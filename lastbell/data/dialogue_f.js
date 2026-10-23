(function(){ const GD = (window.GD = window.GD || {});
// LAST BELL — story-f: the Jubilee finale (Day 3) and all eleven epilogues.
GD.dialoguesF = {

// ===================== JUBILEE CALL (auto-plays Day 3, 19:30) =====================
jubilee_call: {
  title: "The Jubilee",
  start: "open",
  nodes: {
    open: {
      speaker: "narrator",
      voices: 3,
      text: `At half past seven Hob's muster bell goes out over the roofs, three slow strokes and a fourth held until it frays, and District 9 comes out of its doors to be happy. They come in coats over pyjamas, in factory overalls, in the school's grey wool; children on shoulders, grandmothers on grandsons. Each is handed a paper flag and a cup of cocoa the colour of a wet pavement. Along Karsov Avenue the Jubilee banners drop from the lamp-posts, forty feet of red cloth that says FORTY YEARS OF ONE BELL in gold thread, with the Warden underneath, benevolent, enormous, and slightly cross-eyed where the seam falls.\n\nIt is, by any measure, a lovely evening for it. The sky has been scrubbed. Somebody has even hung bunting on the loudspeakers, as if they were guests.`,
      interjections: [
        { skill: "the_grey", min: 2, text: `Eleven thousand pairs of shoes on my skin and not one of them in a hurry. I have not felt this many feet since the queues of the Hunger Winter, and then they were quieter. Then they knew what they were waiting for.` },
        { skill: "solidarity", min: 3, text: `We came. Look at us: we all came. And not one of us can say who asked.` },
        { skill: "doublethink", min: 3, text: `Cocoa, friend. A flag. Someone remembered we like both. Can you remember the last time the State remembered something you liked? Neither can I. Isn't it wonderful that it has started?` },
        { skill: "senses", min: 4, text: `Cocoa, wet wool, boiled cabbage on a hundred breaths, and under all of it a hot-metal smell from the poles: every loudspeaker in the district is warming its valves. You can hear them through your teeth. A hum, a pitch, waiting for a hand.` }
      ],
      choices: [{ text: "Listen.", goto: "warden" }]
    },
    warden: {
      speaker: "state",
      voices: 3,
      text: `A throat clears in every loudspeaker in the district at once. It is a large, humid, grandfatherly clearing, a throat that has been told for forty years that it is loved.\n\n"My children. It is a great evening, and I will not keep you from it. Forty years ago this country had too many hours and not enough rest. We gave it a bell. You have not thanked us, which is how we know it works." A warm wheeze of laughter, recorded, perfectly timed. "Tonight, on the hour, we offer something larger: a Grand Harmony, from the Relay to every hearth, so that the past three days, with their small cruelties and smaller rumours, may be laid down together like tools at the end of a shift. Do not fear what you will not remember. It was not worth the carrying. Stand close. Hum, if you can. One Bell, one Union. The Warden hears."`,
      interjections: [
        { skill: "rote", min: 3, text: `ONE BELL, ONE UNION. THE WARDEN HEARS. THE WARDEN HEARS. (You have finished the slogan with your own lips before you could stop them. Half the Avenue did the same. It sounds like a very large animal agreeing.)` },
        { skill: "archive", min: 3, text: `Actually, the printed programme describes "a short commemorative harmony". The phrase "the past three days" appears nowhere in it. It does appear in Annex 2, "Closure of the Record, Operational", which you read on Wednesday in a library for reasons now smudged. Seventy-two hours. A clean sheet.` },
        { skill: "empathy", min: 4, text: `By the school gate a grandmother lays her palm over her granddaughter's hair and does not know why she has done it. Her hand is shaking. She is going to forget this. She is going to forget she was afraid. It is the cruellest part of the mercy: it takes the fear along with what the fear was for.` },
        { skill: "volition", min: 4, text: `Three days. Tuesday, Wednesday, today. Everything you have done since you woke on a theatre stage. Hold that in your head the way you would hold a hot plate: carefully, and with the intention of putting it down somewhere safe.` }
      ],
      choices: [{ text: "Take stock of what you have.", goto: "tally_things" }]
    },
    tally_things: {
      speaker: "narrator",
      voices: 5,
      text: `Under the banners and the bunting you do what every sensible person does in a crowd: count your pockets. It takes less time than you would like.`,
      interjections: [
        { skill: "archive", min: 2, text: `Inventory, as of the evening bell. The Wake tone: one wax cylinder, two minutes forty, in your possession. Built by Ilsabet Orrin from the Bell's own carrier, inverted. It looks like a very small, very expensive rolling pin.`, cond: "has('counter_tone')" },
        { skill: "archive", min: 2, text: `The Wake tone exists: Ilsabet's bench has stopped glowing. It is not in your pocket. It is wherever the plan put it.`, cond: "flag.counter_tone_built && !has('counter_tone')" },
        { skill: "archive", min: 2, text: `The tape in the relay vault is not the Grand Harmony. It is, in a sense, the opposite of the Grand Harmony. It is labelled GRAND HARMONY, in your own handwriting, which is the funniest forgery you have ever signed.`, cond: "flag.tape_swapped" },
        { skill: "archive", min: 2, text: `You are carrying the Warden's forty-year gift: the master tape of the Grand Harmony, stolen from a vault in the sort of evening that is going to be described to you by other people. Without it, Relay No. 4 has nothing to play at the hour but its own breathing.`, cond: "has('master_tape')" },
        { skill: "archive", min: 2, text: `The relay logbook, forty-one pages, torn out neatly along the stitching. Dates, durations, operator initials, the same sentence in the same column every night: SUPPRESSION APPLIED. PERSONS AFFECTED: ALL.`, cond: "has('relay_log')" },
        { skill: "archive", min: 2, text: `The Ledger: slim, green, cloth, Ostrov's handwriting and your nerves. The whole of the thing, every night of it, in a space smaller than a hymnal.`, cond: "has('ledger')" },
        { skill: "archive", min: 2, text: `The Ledger is no longer in your care. Mother Anka has it, which is the safest place in the district for it to be, and also the one place you cannot read from at short notice.`, cond: "flag.ledger_with_anka && !has('ledger')" },
        { skill: "archive", min: 2, text: `The Ledger, current status: unlocated. You found it once. Then, one assumes, you put it down again. A clerk would call this carelessness. You prefer "the long way round".`, cond: "!has('ledger') && !flag.ledger_with_anka && !flag.found_ledger" },
        { skill: "rote", min: 3, text: `CHOIR SCORE: THE ANTHEM, IN THE KEY OF STEADY HANDS. (Pencilled over, in the margin, in a very small hand: a second key.)`, cond: "flag.choir_wake_arrangement" },
        { skill: "sleight", min: 3, text: `Pockets, ten fingers, one tram token, one forged pass of surprising dignity, and a spoon that is, in the circumstances, the least suspicious thing on you.`, cond: "has('tram_token') || has('forged_pass')" },
        { skill: "composure", min: 2, text: `You have your uniform, your face, and a posture that says nothing at all. It is more than most of the district has tonight.`, cond: "!has('counter_tone') && !has('master_tape') && !has('relay_log') && !has('ledger')" }
      ],
      choices: [{ text: "Count the people instead.", goto: "tally_people_a" }]
    },
    tally_people_a: {
      speaker: "narrator",
      voices: 5,
      text: `The thing about a plan is that it is mostly other people. You tilt your head, the way you do when the ringing in your ears gets loud, and listen for who is out there tonight.`,
      interjections: [
        { skill: "instinct", min: 2, text: `Lieutenant Kell, at the Courtyard gate with her bad knee and her second-best coat. She is not watching the Jubilee. She is watching the stairs, the way an old soldier watches a hill she has already decided to take.`, cond: "(flag.vasha_ready && !flag.vasha_betrays)" },
        { skill: "instinct", min: 2, text: `Lieutenant Kell is at the gate too, standing beside a man in a grey coat, and she is not looking at you. It is the particular way she is not looking. You know it. You have seen that very angle of her cheek across a gym.`, cond: "flag.vasha_betrays" },
        { skill: "senses", min: 2, text: `Wheels on the library boards: four turns, a pause, four turns. Ilsabet, counting seconds out of habit and out of fear. Beneath it, the dry whisper of a hand on a tuning dial.`, cond: "flag.ilsabet_ready" },
        { skill: "empathy", min: 2, text: `Fenwick Alder is in the choir stand in his only good suit, shaking, conducting a tuning fork in his left hand because his right hand is too busy holding the score still. He has been told it is the greatest night of his career. He has chosen to believe two different things about that.`, cond: "flag.fenwick_ready" },
        { skill: "the_grey", min: 2, text: `Down under the Courtyard, in the one room the Bell does not ring in, a dozen chairs have stopped creaking. Mother Anka's circle sits very still. A cell is a held breath with a stove.`, cond: "flag.anka_ready" },
        { skill: "the_grey", min: 3, text: `A broom leans against the stairwell door with its bristles to the wall, which is how Osk puts it down when he means to come back. I hold his keys' warmth in my stair-rail. He is somewhere below you, on purpose.`, cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)" },
        { skill: "solidarity", min: 3, text: `We are fewer than we hoped. We are more than we feared. Count us again slowly. We have never once been counted correctly by anyone who was paid to.`, cond: "!((flag.vasha_ready && !flag.vasha_betrays)) && !(flag.ilsabet_ready) && !(flag.fenwick_ready) && !(flag.anka_ready) && !(((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat))" }
      ],
      choices: [{ text: "Keep counting.", goto: "tally_people_b" }]
    },
    tally_people_b: {
      speaker: "narrator",
      voices: 5,
      text: `A smaller, more exact kind of count: who is in the crowd for you, and who is in it for the Jubilee. They look the same from above. They look the same from a pavement. Only the shoulders give them away.`,
      interjections: [
        { skill: "senses", min: 2, text: `A first-year in a too-big cap, weaving through the legs of the Avenue with a message in each fist and a third one in her teeth. Wren. She has already been caught twice tonight and talked her way out of both. You think she might be happy.`, cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)" },
        { skill: "instinct", min: 2, text: `Karsov Avenue, the tram stop: a conductor's cap, a lit cigarette, a tram standing in the stop at an angle that is wrong by exactly enough to block a car. Nadia Fell has not been told what you plan. She has simply decided to be in the way.`, cond: "(flag.nadia_ready || flag.nadia_ally)" },
        { skill: "the_grey", min: 3, text: `The relay hums in its box on Karsov Avenue, pitched for the teeth. Inside it a tired man in a lab coat is walking from console to vault and back, adding small, deliberate delays, the way a man delays a train he is secretly on the side of.`, cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { skill: "the_grey", min: 3, text: `The Great Bell, above you, with an old man's hand flat against it like a doctor's. Hob does not look at the crowd. He looks at the tower door, and then at the sky, and then, very briefly, at the place in the air where you will arrive.`, cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal)" },
        { skill: "empathy", min: 3, text: `Rhea Vantage stands at the head of the Vanguard guard of honour, perfectly straight, and for one second, as the Warden's voice says "it was not worth the carrying", her mouth moves with it and her eyes do not. Something in her has started to read ahead.`, cond: "(flag.rhea_ready || flag.rhea_turned)" },
        { skill: "empathy", min: 3, text: `Principal Marr, on the dais with a folded speech, looking at nothing. Her pearl earrings are very still. You have the idea she has been practising a different speech, privately, for days.`, cond: "flag.marr_turned" },
        { skill: "solidarity", min: 3, text: `Somewhere in all this hum there's a girl with a note in her fist, a boy with a ticket, an old man with a key. We are not an army. We are an inconvenience with good shoes.`, cond: "(((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)) || ((flag.nadia_ready || flag.nadia_ally)) || (((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)) || ((flag.hob_ready || flag.hob_trust || flag.hob_signal))" },
        { skill: "volition", min: 3, text: `Nobody is coming to save you, and nobody is coming to stop you either. That is the whole of the situation. It is oddly freeing. Pick the thing you can bear to have done.`, cond: "!(((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)) && !((flag.nadia_ready || flag.nadia_ally)) && !(((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)) && !((flag.hob_ready || flag.hob_trust || flag.hob_signal)) && !((flag.rhea_ready || flag.rhea_turned))" }
      ],
      choices: [
        { text: "Find the black car.", goto: "voss_ally", cond: "flag.voss_turned" },
        { text: "Find the black car.", goto: "voss_ally2", cond: "flag.voss_ally && !flag.voss_turned && !flag.voss_exposed" },
        { text: "Find the black car.", goto: "voss_exposed", cond: "flag.voss_exposed && !flag.voss_turned" },
        { text: "Find the black car.", goto: "voss_cold", cond: "!flag.voss_turned && !flag.voss_ally && !flag.voss_exposed" }
      ]
    },
    voss_ally: {
      speaker: "narrator",
      text: `The black car stands by the kerb with its door open, and there is nobody in it. You find the Inspector at the foot of the Courtyard steps, in his good coat, with a folding chair under one arm and a thermos under the other, looking up at the tower like a man at the foot of a very tall confession. He sees you. He lifts the thermos in a small, ruined salute.\n\n"I told them I would watch from the best seat in the district," says Hale Voss. "I did not specify which seat. I did not specify, you will notice, whose side of the Jubilee it was on." His voice is quite gentle. His hands are not steady. "Go up. I will give you a head start and a bad excuse. I think that is all I have."`,
      onEnter: [{ set: "jubilee_voss_seen", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `He is a man standing at the edge of a decision with his coat buttoned wrong. You have never seen a quiet officer look so loud.` },
        { skill: "archive", min: 4, text: `Inspector Hale Voss, State Inspectorate; Ministry of Quiet Hours, field attachment, District 9. Whatever he is tonight, the forms will still say something else by morning.` }
      ],
      choices: [{ text: "Climb.", goto: "watched" }]
    },
    voss_ally2: {
      speaker: "narrator",
      text: `The black car stands by the kerb with its engine running and its rear door open like a mouth that has been told to smile. The Inspector is leaning on it, in his good coat, a thermos in one hand and a folding chair beside him, looking up at the tower with the fond, complicated look of a man at a school reunion for a school that no longer exists.\n\n"{name}," says Hale Voss. "You will have noticed that I have been charming for three days. It was not an accident. It was not entirely a trick either." He unscrews the thermos. "Go up if you like. I am going to watch from the roof. We will talk. I would very much prefer to be talking to you at the end of this."`,
      onEnter: [{ set: "jubilee_voss_seen", val: true }],
      interjections: [
        { skill: "doublethink", min: 3, text: `A friend, friend. An actual friend, with a flask. You could simply sit with him. You could watch the fireworks. There aren't fireworks. There is something better. There is a country that agrees to sleep.` },
        { skill: "instinct", min: 4, text: `He is nervous. A man who is nervous at the top of his own operation is a man who wants someone to give him a reason.` }
      ],
      choices: [{ text: "Climb.", goto: "watched" }]
    },
    voss_exposed: {
      speaker: "narrator",
      text: `The black car stands at the kerb, and around it three men in grey coats stand very close to each other, which is how you know that something has been said above their heads. The Inspector is not among them. He is sitting on the car's running board, alone, in his shirtsleeves, with his hat in his lap and a thermos going cold beside him. When he lifts his eyes to the tower, you realise he has been looking at it for some time.\n\n"You have made my evening very difficult," says Hale Voss, to the middle distance. "I have not decided yet whether that is a compliment." He does not stand. He is, for the first time since you met him, a man with nothing to arrange.`,
      onEnter: [{ set: "jubilee_voss_seen", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `You did that. You pulled him apart in public with a document and a sentence. He is not angry. It is the loneliness that hurts to look at: a man whose cover is gone and who has not yet found what he is underneath it.` },
        { skill: "authority", min: 4, text: `THE MEN IN GREY COATS ARE NOT HIS. LOOK AT THEIR SHOES. THEY ARE THE CHANCELLERY'S, AND THEY ARE HERE FOR HIM AS MUCH AS FOR YOU.` }
      ],
      choices: [{ text: "Climb.", goto: "watched" }]
    },
    voss_cold: {
      speaker: "narrator",
      text: `The black car stands at the kerb, polished to a standard that makes the wet pavement look careless. The Inspector is not in it. He is up on the steps of the Courtyard in his good coat, a folding chair under one arm, a thermos under the other, scanning the crowd with the leisurely attention of a man looking for one particular face in a photograph of a thousand. When it finds yours, he smiles. It is warm. It does not reach his hands.\n\n"There you are, {name}," says Hale Voss, across twenty metres of Avenue, so pleasantly that two women turn to see who he is addressing. "I'm taking the best seat in the house. Do come up and watch. I think you will find it very instructive." He does not wave. Somewhere behind him, a man in a grey coat writes something down.`,
      onEnter: [{ set: "jubilee_voss_seen", val: true }],
      interjections: [
        { skill: "instinct", min: 3, text: `Danger. A warm, polite, sniffing kind of danger, the kind that brings a chair. He will be there at the top of the stair when you arrive, and he will be so glad to see you.` },
        { skill: "composure", min: 3, text: `Nothing on the face. Not even the eyebrows. If he is watching you, give him a very boring thing to watch.` }
      ],
      choices: [{ text: "Climb.", goto: "watched" }]
    },
    watched: {
      speaker: "narrator",
      voices: 3,
      text: `You are not the only person in the crowd with a file. The question, tonight, is how thick the file has got. You can tell by how people stand around you. The Avenue parts for you, or it doesn't; the eyes on the lamp-posts turn, or stay put.`,
      interjections: [
        { skill: "instinct", min: 2, text: `Nobody looks at you. Nobody has looked at you in minutes. You are, for the moment, nothing at all: a student in a grey coat in a street full of grey coats. Enjoy it. It is the last uncomplicated thing you will be handed.`, cond: "surv < 20" },
        { skill: "instinct", min: 2, text: `A hall monitor on the corner writes in a small neat notebook. A woman at the tram stop notices you noticing him and adjusts her flag. You are on a list. A list is a place where people have started to keep you in mind.`, cond: "surv >= 20 && surv < 40" },
        { skill: "authority", min: 3, text: `TWO YOUTH VANGUARD AT THE CORNER. THEY HAVE BEEN THERE FOR TEN MINUTES. THEY HAVE NOT STOPPED WATCHING THE COURTYARD GATE. YOU ARE WATCHED. ACT LIKE SOMEONE WHO NEEDS NO ONE'S PERMISSION.`, cond: "surv >= 40 && surv < 60" },
        { skill: "the_grey", min: 3, text: `You can feel the eyes in the lamp-posts. I can too. Every one of my ten thousand windows has your name on a sticky note. The portraits on the school wall turn, in the draught, a degree toward the tower.`, cond: "surv >= 60 && surv < 80" },
        { skill: "doublethink", min: 3, text: `Wanted, friend. Wanted! Is there anything more wonderful than being wanted? They have put your face on a sheet. You are in the district's heart. You are almost loved.`, cond: "surv >= 80" },
        { skill: "volition", min: 3, text: `You do not have long, however much time they let you think you have. Every minute of this evening is borrowed against the file. Spend each one as though someone is counting.`, cond: "surv >= 60" }
      ],
      choices: [{ text: "Go up to the tower.", goto: "ascend" }]
    },
    ascend: {
      speaker: "narrator",
      voices: 3,
      text: `Nobody stops you at the library. The tower stair, which is locked every other night of the year, is standing open, propped with a mop bucket that has been placed there with great care by someone who did not want to be thanked. The spiral takes forever. It smells of pigeon, tallow and chalk-dust, and the rope-rail is polished to a dark shine by sixty years of one old man's hand.\n\nAs you climb, the Jubilee gets quieter and the sky gets nearer. The loudspeaker array swings into view above the last turn, a crown of black horns pointing out over the roofs. Eleven thousand people, and a country behind them, are about to be sung to sleep through that crown. And you are the only one with a ticket to the control room.`,
      onEnter: [
        { set: "finale_open", val: true },
        { task: "task_jubilee", state: "active" },
        { note: "task_jubilee", text: "The Jubilee. Grand Harmony transmits on the hour from Relay No. 4 through the tower array: seventy-two hours erased from every head in District 9. Decide what goes out instead, or whether anything does." },
        { sfx: "bell" }
      ],
      interjections: [
        { skill: "stamina", min: 3, text: `One more corridor. A hundred and twelve steps and the first forty were the worst. Breathe from the belly. The stair does not care how you got here.` },
        { skill: "the_grey", min: 3, text: `Stone, then brick, then boards, then sky. I am the whole building, and I am telling you: the top is a small room with a very big bell in it. Be quiet at the door. He has been listening for you all day.` },
        { skill: "volition", min: 4, text: `The only way to have a plan is to start it. You have a handful of ways to end this evening. Pick the one you can live with having picked. Do not pick the one you can live with having been picked for.` }
      ],
      choices: [{ text: "Step onto the roof of the school.", goto: "arrive" }]
    },
    arrive: {
      speaker: "narrator",
      text: `Hob is at the bell. He does not turn. His whole body is a question mark made of old overalls, and one big knotted hand lies flat against the bronze, as though the Great Bell were an animal that might bolt. Below, the district lies in its quilt of lamplight, the Avenue a river of flags, and at its far end the Relay's squat grey box with a single yellow window. You find you can read the time by the crowd's breathing. It is a quarter to something.\n\nThe tower array hums at your shoulder, patient, black, enormous. It will begin to sing at the hour. Everything you can do from here, you can do before then.`,
      onEnter: [{ goto: "tower", x: 4, y: 7 }, { dialogue: "finale_hub" }],
      interjections: [
        { skill: "senses", min: 3, text: `The bronze is warm. Not hot, warm: the warmth of a thing that has been touched all day by a person who loves it. Beneath your boots, one note, held very low, from the Relay's cable in the wall.` }
      ]
    }
  }
},

finale_hub: {
  title: "The Jubilee",
  start: [
    { cond: "!flag.finale_open || day < 3", node: "pre" },
    { cond: "time >= 1215", node: "late" },
    { cond: "true", node: "hub" }
  ],
  nodes: {
    // ---------------------------------------------------------------- HUB
    pre: {
      speaker: "narrator",
      voices: 3,
      text: `The tower is quiet, and the array is cold. Eleven black horns face out over the district on a steel frame, their throats packed with a winter's worth of pigeon; behind them, bolted to the wall like an old stove, stands a grey cabinet marked in white paint: LINE IN FROM RELAY 4. Beside it, a fat brass lever behind a perspex guard, labelled THE WARDEN'S SWITCH; a patch-bay with a talkback jack; and, wedged in under the stair like an afterthought, a squat reel-to-reel deck with a sticker that says FOR USE IN EVENT OF LINE FAILURE ONLY.\n\nThe Jubilee is not yet. Tonight at the hour a voice will come down that wire and go out through those horns, and then a tone, and then the district will sleep.`,
      interjections: [
        { skill: "archive", min: 2, repeat: true, text: `Actually, per Annex 2: the Address begins at 20:00 and runs fifteen minutes. At its close, a cue-tone on the line fires the Grand Harmony from the Relay's master tape. Every loudspeaker in District 9 is fed from this cabinet. Every one. The school was built, the building log notes, "to be heard from."` },
        { skill: "the_grey", min: 3, repeat: true, text: `Eleven horns, and I am the thing they stand on. When they sing, I carry it down into the ground and every sleeper in the district hears it through the pillows. I would like very much for it to be something kind.` },
        { skill: "deduction", min: 3, repeat: true, text: `It had been established, by the cabinet's dust and the lever's polish, that the array was used exactly once a year. The deck beneath the stair, however, had been oiled that week. Somebody, I deduced, had been planning for failure.` }
      ],
      choices: [
        { text: "Study what could be done with it.", goto: "pre_needs" },
        { text: "Leave the array alone for now.", end: true }
      ]
    },
    pre_needs: {
      speaker: "archive",
      voices: 8,
      text: `Actually, there is a list. There is always a list. Allow me.`,
      interjections: [
        { skill: "archive", min: 1, repeat: true, text: `THE WAKE TONE. Requires a built counter-tone (Ilsabet, Gregor's bench) AND a way of putting it on the line: either a swapped tape at the Relay, or the Warden's own master tape in your hands, so the tower deck can play instead. Ideally, the choir should sing the Anthem in a key that carries it.` },
        { skill: "archive", min: 1, repeat: true, text: `THE BROADCAST. Requires the Ledger or the relay logbook, and the talkback jack. A decoded carrier helps: the Bell's beat will otherwise bury your voice.` },
        { skill: "archive", min: 1, repeat: true, text: `THE RELAY. Requires entry, a reason, and a way to hurt a concrete box. A wrench, a generator valve, an engineer who knows where the weak solder lives.` },
        { skill: "archive", min: 1, repeat: true, text: `THE INSPECTOR. Requires evidence, or an answer to a question that nobody has asked him in a long time.` },
        { skill: "archive", min: 1, repeat: true, text: `THE BLAME. Requires nothing but a body, and a voice that has not yet been told what it is for.` },
        { skill: "archive", min: 1, repeat: true, text: `THE TRAM. Requires a token or a pass, a conductor, and fifteen minutes' head start on a tone that travels at the speed of sound.` },
        { skill: "archive", min: 1, repeat: true, text: `THE BOILER ROOM. Requires the Ledger, and a patient woman. THE BADGE. Requires nothing at all but the willingness to be asked. THE TEA. See: THE BADGE.` },
        { skill: "archive", min: 1, repeat: true, text: `(Footnote: none of the above is mutually exclusive in theory. All of the above is mutually exclusive in practice. The evening has one hour in it.)` }
      ],
      choices: [{ text: "Back.", goto: "pre" }]
    },

    hub: {
      speaker: "narrator",
      voices: 4,
      text: `The roof of School No. 9, with the whole of District 9 laid out below like something waiting to be told it is loved. Hob at the bell. The array above you, eleven black throats. The long cable from the wall singing its one low note. The Address begins on the hour and runs a quarter of an hour; the Grand Harmony follows it, cued by a tone on the line, and whatever is on the line at the cue goes out through those horns into eleven thousand pairs of ears, and takes three days with it.\n\nYou have one evening, one array, and a handful of ways to spend it.`,
      interjections: [
        { skill: "volition", min: 3, repeat: true, text: `Breathe. You do not have to decide the whole of your life. You have to decide the next forty minutes. They are a smaller thing, and a kinder one, and they are yours.` },
        { skill: "senses", min: 4, repeat: true, text: `The Address has begun. Under the roofs, a warm, humid voice is rolling out of eleven thousand doorways at once. The cue is minutes off.`, cond: "time >= 1200 && time < 1215" },
        { skill: "archive", min: 2, repeat: true, text: `The programme gives you until the end of the Address. After that, the cue. If you are standing on the roof at the cue with nothing in your hands, Regulation 8(c) describes you as "a spectator".`, cond: "time >= 1185 && time < 1200" },
        { skill: "instinct", min: 3, repeat: true, text: `Stop counting your options and start counting your minutes. The longer you hold the hub in your head, the more the hub decides for you.`, cond: "time >= 1195" },
        { skill: "doublethink", min: 3, repeat: true, text: `Or none of them, friend. Sit down beside the bell. Put your flag in your lap. The tea at the end is so nice. I only mention it because nobody else will.`, cond: "surv < 40" },
        { skill: "authority", min: 4, repeat: true, text: `DECIDE. A PERSON WHO HESITATES AT THE TOP OF A STAIR IS ALREADY A PERSON WHO WILL BE CARRIED DOWN IT.`, cond: "time >= 1195" }
      ],
      choices: [
        { text: "The Address is over. The cue is sounding.", goto: "late", cond: "time >= 1215" },
        { text: "Replace the Grand Harmony with the Wake tone. Wake the district.", goto: "wake_start", cond: "time < 1215" },
        { text: "Read the truth over the array before the cue.", goto: "bc_start", cond: "time < 1215" },
        { text: "Go and take the Bell out at the source: the Relay.", goto: "sab_start", cond: "time < 1215" },
        { text: "Go and sit with Inspector Voss.", goto: "voss_start", cond: "time < 1215" },
        { text: "Go down to the Courtyard dais and take the blame.", goto: "mar_start", cond: "time < 1215" },
        { text: "Leave. The night tram is at the stop on Karsov Avenue.", goto: "exo_start", cond: "time < 1215" },
        { text: "Take the Ledger down to the boiler room. Play the long game with Mother Anka.", goto: "led_start", cond: "time < 1215 && (has('ledger') || flag.ledger_with_anka)" },
        { text: "Go to the Principal. Ask to be good.", goto: "gs_start", cond: "time < 1215" },
        { text: "Go home. Drink the tea. Forget with everyone.", goto: "qt_start", cond: "time < 1215" },
        { text: "Who is with you tonight?", goto: "allies" },
        { text: "What exactly do you have?", goto: "stock" },
        { text: "Step away from the array for now.", end: true }
      ]
    },

    stock: {
      speaker: "archive",
      voices: 12,
      text: `Actually, per Regulation 14(b), a person about to attempt something drastic is entitled to an inventory. Route by route:`,
      interjections: [
        { skill: "archive", min: 1, repeat: true, text: `WAKE: complete. Counter-tone built, and the line is yours by tape or by deck. The choir has its second key, if Fenwick can find his nerve.`, cond: "(flag.counter_tone_built && (flag.tape_swapped || has('master_tape'))) && flag.choir_wake_arrangement" },
        { skill: "archive", min: 1, repeat: true, text: `WAKE: workable. Counter-tone built, line available. No second key for the choir: the Anthem will sing the old song over your new one. That is a risk, but a surmountable one.`, cond: "(flag.counter_tone_built && (flag.tape_swapped || has('master_tape'))) && !flag.choir_wake_arrangement" },
        { skill: "archive", min: 1, repeat: true, text: `WAKE: partial. You have a counter-tone but no secure line: the Relay will transmit its own master tape at the cue, and you would have to beat it live, in the air, from this roof. It can be done. It would be the sort of thing people tell stories about, if anyone were left to.`, cond: "(flag.counter_tone_built || has('counter_tone')) && !((flag.counter_tone_built && (flag.tape_swapped || has('master_tape'))))" },
        { skill: "archive", min: 1, repeat: true, text: `WAKE: not available. The counter-tone has not been built. Ilsabet, the tube, the cylinder, Gregor's bench. Some of that is still undone.`, cond: "!((flag.counter_tone_built || has('counter_tone')))" },
        { skill: "archive", min: 1, repeat: true, text: `BROADCAST: available. You have the text and a jack to put it in. The carrier is decoded, so your voice will survive the Bell's beat.`, cond: "(has('ledger') || has('relay_log')) && flag.ilsabet_decoded" },
        { skill: "archive", min: 1, repeat: true, text: `BROADCAST: available, but undecoded. Your voice will fight the Bell's carrier the whole way. Expect to sound like you are reading from underwater.`, cond: "(has('ledger') || has('relay_log')) && !flag.ilsabet_decoded" },
        { skill: "archive", min: 1, repeat: true, text: `BROADCAST: nothing to read. The Ledger and the logbook are not on your person. You would have to recite from memory, which is, to be fair, what the Archive is for.`, cond: "!has('ledger') && !has('relay_log')" },
        { skill: "archive", min: 1, repeat: true, text: `RELAY: you hold a means of entry. The gate will open or can be opened. Whoever is inside has been waiting for a visitor.`, cond: "flag.relay_access || has('relay_pass') || has('forged_pass')" },
        { skill: "archive", min: 1, repeat: true, text: `RELAY: no pass and no appointment. You would be going in the hard way. The hard way has a Captain at the end of it.`, cond: "!flag.relay_access && !has('relay_pass') && !has('forged_pass')" },
        { skill: "archive", min: 1, repeat: true, text: `TRAM: you hold a token or a pass. Nadia can be found. The route out of the district's reach is eleven minutes of tram and four of walking.`, cond: "has('tram_token') || has('forged_pass') || has('black_market_ticket') || (flag.nadia_ready || flag.nadia_ally)" },
        { skill: "archive", min: 1, repeat: true, text: `TRAM: no ticket, no token, no conductor in your pocket. You would be buying a place on the night tram with whatever you have left, and whatever you have left is, on the evidence, mostly nerve.`, cond: "!has('tram_token') && !has('forged_pass') && !has('black_market_ticket') && !((flag.nadia_ready || flag.nadia_ally))" },
        { skill: "archive", min: 1, repeat: true, text: `SURVEILLANCE: you stand at "Wanted". Every route is made harder by it, and one of them, the surrender, is made easier.`, cond: "surv >= 80" }
      ],
      choices: [{ text: "Back to the array.", goto: "hub" }]
    },

    allies: {
      speaker: "solidarity",
      voices: 14,
      text: `Who is with us tonight? Let us say their names, quietly, the way you count heads on a trip. We have always counted heads. It is the one thing we do better than the State.`,
      interjections: [
        { skill: "solidarity", min: 1, repeat: true, text: `Vasha. The Lieutenant has put down her notebook and picked up the stairs. She will hold what she can hold.`, cond: "(flag.vasha_ready && !flag.vasha_betrays)" },
        { skill: "solidarity", min: 1, repeat: true, text: `Vasha. She has not decided. She is standing very near a man in a grey coat. We love her anyway. We would like to know which way her knee leans.`, cond: "flag.vasha_betrays || !flag.vasha_ready" },
        { skill: "solidarity", min: 1, repeat: true, text: `Ilsabet. With her set, her wheels and her clean ear. She can find the seam in any signal.`, cond: "flag.ilsabet_ready" },
        { skill: "solidarity", min: 1, repeat: true, text: `Fenwick. He will conduct. He will conduct the thing whether or not his hands let him. A choir is a lot of people who agree to breathe at the same time.`, cond: "flag.fenwick_ready" },
        { skill: "solidarity", min: 1, repeat: true, text: `Anka. Under the Courtyard, with her cell and her stove. She does not want you to be a hero. She wants you to be alive on Friday. Those are not the same request, and she has made it twice.`, cond: "flag.anka_ready" },
        { skill: "solidarity", min: 1, repeat: true, text: `Osk. His keys, his broom, his thirty-one years of knowing which door sticks. Nobody has ever asked a caretaker to be on a side. He has volunteered.`, cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)" },
        { skill: "solidarity", min: 1, repeat: true, text: `Osk is gone. We say his name anyway. Somebody should.`, cond: "flag.osk_scapegoat" },
        { skill: "solidarity", min: 1, repeat: true, text: `Wren, running messages in a cap too big for her, because she was asked once and she liked it.`, cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)" },
        { skill: "solidarity", min: 1, repeat: true, text: `Nadia, who is not on anyone's side and is, tonight, parked across the road at precisely the wrong angle for the Inspector.`, cond: "(flag.nadia_ready || flag.nadia_ally)" },
        { skill: "solidarity", min: 1, repeat: true, text: `Tomas, in the Relay, with his lab coat and his small deliberate delays. He has been the district's ears for nine years. He would like, once, to be its voice.`, cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { skill: "solidarity", min: 1, repeat: true, text: `Hob. We do not know what Hob wants. We know he wants it. He has been ringing in our ears our whole lives.`, cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal)" },
        { skill: "solidarity", min: 1, repeat: true, text: `Rhea. Yes, her. We did not think we would say it. She has been looking at the Ledger, and at her own hands, and at a very old gap in her memory. We are keeping a place. We do not know if she will take it.`, cond: "(flag.rhea_ready || flag.rhea_turned)" },
        { skill: "solidarity", min: 1, repeat: true, text: `And Marr, who is no friend of ours, but who has folded her speech into a paper boat and set it on the water.`, cond: "flag.marr_turned" },
        { skill: "solidarity", min: 1, repeat: true, text: `Nobody else. We are, tonight, a very small we. It is still a we. It still counts.`, cond: "!((flag.vasha_ready && !flag.vasha_betrays)) && !(flag.ilsabet_ready) && !(flag.fenwick_ready) && !(flag.anka_ready) && !(((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)) && !(((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)) && !((flag.nadia_ready || flag.nadia_ally)) && !(((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)) && !((flag.hob_ready || flag.hob_trust || flag.hob_signal)) && !((flag.rhea_ready || flag.rhea_turned))" }
      ],
      choices: [{ text: "Back to the array.", goto: "hub" }]
    },

    // ---------------------------------------------------------------- ROUTE A: WAKE
    wake_start: {
      speaker: "narrator",
      text: `You cross the roof to the array. Hob steps aside without looking, the way a man makes room on a bench, and takes up the bell-rope in his big knotted hands. The cabinet is cold under your palm, but a note is moving in it: the low line-hum from the Relay, climbing the steel and into the bones of your wrist, where it meets your old ringing and, for a moment, seems about to agree with it.\n\nThe lever behind its perspex guard. The talkback jack. The deck under the stair, with its sticker. Everything you need is within reach of one tired pair of arms. Everything you need to have already done is not.`,
      onEnter: [{ set: "finale_route", val: "wake" }, { set: "wake_pressure", val: 0 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `You are standing on the loudest place in the district. Do you know that every pipe, wire and gutter in the quarter is a throat that could be taught a new song? I would like to be taught. I have only ever been taught the one.` }
      ],
      choices: [
        { text: "Begin. Everything is in place.", goto: "wake_full", cond: "(flag.counter_tone_built && (flag.tape_swapped || has('master_tape')))" },
        { text: "Begin. You have the tone, but not the line.", goto: "wake_live", cond: "(flag.counter_tone_built || has('counter_tone')) && !((flag.counter_tone_built && (flag.tape_swapped || has('master_tape'))))" },
        { text: "Begin. (You do not have the tone.)", goto: "wake_none", cond: "!((flag.counter_tone_built || has('counter_tone')))" },
        { text: "Not yet.", goto: "hub" }
      ]
    },

    wake_none: {
      speaker: "narrator",
      text: `You put your hand on the lever and feel the problem arrive in your stomach. There is no wax cylinder in your pocket. There is no tone on a tape in a vault. Nothing sits in the deck, nothing waits on the line. You came up the stair with a plan and a ringing in your ears, and the plan has no sound in it.\n\nAll that remains is the ringing: the old, thin, childhood note that sits behind your hearing like a lit window in a house you have never entered. Ilsabet once said it lived within two hertz of the carrier's ghost. She meant it as a curiosity. It has begun to sound like a proposal.`,
      interjections: [
        { skill: "archive", min: 3, text: `Status of the Wake tone: not built. Missing, per the file: some or all of a radio tube, a mic cable, a blank cylinder, an evening at Old Gregor's bench, and a girl with a clean ear. You were advised.` },
        { skill: "volition", min: 4, text: `You could walk away from this one with your dignity intact. Or you could stand at the jack and do something extraordinarily stupid with your own head. I am not recommending it. I am only describing the geometry.` },
        { skill: "the_grey", min: 4, text: `Hum, and I will hum with you. I am a building. I have nothing else to do.` }
      ],
      choices: [
        { text: "Plug into the talkback and hum your own ringing into the array.", check: { skill: "volition", diff: 15, id: "finale_hub_wake_hum", pass: "wake_hum_pass", fail: "wake_hum_fail" } },
        { text: "Think of something else.", goto: "hub" }
      ]
    },
    wake_hum_pass: {
      speaker: "volition",
      voices: 3,
      text: `You find the pitch the way you find a name you have been avoiding. You open your mouth into the brass jack, and the sound that comes out is not a song and not a word: it is the note you have lived inside since you were six, thin, high, unmusical, offered up. Every black horn above you swallows it and turns it over. Down in the Courtyard, a thousand heads tilt. Hob's hand finds the bronze and, a heartbeat after you, the Great Bell takes your pitch and lays a body under it.\n\nIt is not a Wake tone. It cannot unmake three days. But a note that holds is a note that holds, and tonight it is the only honest thing in the air.`,
      onEnter: [{ set: "finale_hummed", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `I heard it. Concrete is an excellent listener. We hold sound for years. This one I will keep in the cornice, with the others.` },
        { skill: "solidarity", min: 3, text: `We are not alone in the note. Someone is humming it back. A single voice, two streets away, and then another. We have always known the tune. We just never had permission to start.` }
      ],
      choices: [
        { text: "Keep the jack. Now read them something to hold.", goto: "bc_start" },
        { text: "Step back, shaking.", goto: "hub" }
      ]
    },
    wake_hum_fail: {
      speaker: "narrator",
      text: `A squeal, an ugly one, the sound a kettle makes when it is ashamed. The horns take your note, hold it a moment in their throats, and spit it out across the roofs in a thin electric shriek. Dogs begin to bark in three streets. A child cries, then ten children. Two Vanguard on the corner look up at the tower, and one of them, slowly, takes out a pencil.\n\nHob lowers his hand from the bell. For the first time he looks directly at you, and what is in his face is not contempt. It is closer to sympathy, and it hurts worse.`,
      onEnter: [{ surv: 8 }, { morale: -2 }],
      interjections: [
        { skill: "composure", min: 3, text: `Straighten up. The microphone is not a person. It will not remember how you looked.` },
        { skill: "adrenaline", min: 3, text: `That was GREAT. That was so much noise! We should do something else RIGHT NOW with it!` }
      ],
      choices: [{ text: "Unplug. Think.", goto: "hub" }]
    },

    wake_full: {
      speaker: "narrator",
      voices: 3,
      text: `You take stock of the machine, and the machine, for once, is on your side. The Wake tone is built. A line is waiting for it: one way or another, the thing that goes out through these horns at the cue will be your thing and not theirs. All that remains is the part that always remains: the minutes between the plan and the plan's being allowed to happen.\n\nThe cabinet's LINE IN lamp glows a steady, innocent green.`,
      onEnter: [{ set: "wake_path", val: "full" }],
      interjections: [
        { skill: "senses", min: 3, text: `The lamp is green, the hum is steady, and the whole roof smells of warm dust and old brass. It smells like the inside of a piano.` },
        { skill: "archive", min: 3, text: `Per the schedule: pre-cue check at the array, fifteen minutes before the hour. A technician at the Relay will telephone the tower to confirm the line. This is, you note, an unscheduled risk in the schedule.` }
      ],
      choices: [
        { text: "The tape in the vault is already yours. Guard the line.", goto: "wake_swap", cond: "flag.tape_swapped" },
        { text: "You hold the Warden's master tape. Load the tower's deck and cut the line yourself.", goto: "wake_deck", cond: "!flag.tape_swapped && has('master_tape')" }
      ]
    },
    wake_swap: {
      speaker: "narrator",
      text: `Down on Karsov Avenue, in a concrete box with one yellow window, a tape reel marked GRAND HARMONY in your handwriting is sitting on a shelf, perfectly still, being treated with enormous respect by every man who passes it. It carries the Wake tone, inverted from the Bell's own beat, at the exact length the Ministry expects. When the Address ends and the cue fires, the Relay will thread it, press PLAY, and send your song down every wire in District 9, and out over the air to every one of the Harmony sets in the good flats.\n\nYou have to do nothing. Doing nothing, at the top of a tower, is the hardest job there is.`,
      onEnter: [{ set: "wake_path", val: "swap" }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Nothing at all, friend. Nothing is so easy. You could be on the other side of that cabinet, under a nice bunting, with a cup of cocoa, and the thing would happen all the same. It is a sort of absolution.` },
        { skill: "volition", min: 4, text: `The temptation of a finished plan is to stop watching it. Do not stop watching it.` }
      ],
      choices: [{ text: "Wait at the cabinet. Listen to the line.", goto: "wake_c1_swap" }]
    },
    wake_deck: {
      speaker: "narrator",
      voices: 3,
      text: `The deck under the stair is older than you are, a squat grey reel-to-reel on castors with a hand-lettered sticker and one very serious toggle. You kneel on the boards beside it and the whole machine smells of tallow, machine oil and long neglect. In your pocket the wax of the Wake tone sits like a small, warm egg.\n\nTo make it work you have to thread the cylinder through a mechanism built for tape, trick the deck into believing a very short record is a very long one, and then hold the Warden's switch down, at the cue, long enough for every wire in the district to forget where it was fed from.`,
      onEnter: [{ set: "wake_path", val: "deck" }],
      interjections: [
        { skill: "sleight", min: 3, text: `Ten thieves, one machine. Do not thread it as you would a tape. A tape is a river. The cylinder is a pearl. You have to coax it across a ditch.` },
        { skill: "aim", min: 3, text: `A held breath. A hair's gap between the stylus and the groove. If you flinch, it will chew the first second off the song, and the first second is the clever one.` }
      ],
      choices: [
        { text: "Ilsabet takes the deck from your hands. \"Sit. I've done worse in the dark.\"", goto: "wake_deck_ils", cond: "flag.ilsabet_ready" },
        { text: "Thread the cylinder yourself, slowly, with fingers that have a separate education.", check: { skill: "sleight", diff: 11, id: "finale_hub_wake_thread_sleight", white: true, pass: "wake_deck_ok", fail: "wake_deck_slip" } },
        { text: "Thread it by hand, with a steady breath and no excuses.", check: { skill: "aim", diff: 11, id: "finale_hub_wake_thread_aim", white: true, pass: "wake_deck_ok", fail: "wake_deck_slip" } },
        { text: "Fumble it in and hope.", goto: "wake_deck_slip" }
      ]
    },
    wake_deck_ils: {
      speaker: "ilsabet",
      text: `She comes up out of the dark of the stair on the shoulders of two Undercurrent boys who have been told to say nothing, her folded chair carried behind by a third like a coffin in a very small funeral. They set her down at the cabinet with enormous care and are gone before you can thank them. She does not say hello. She flips the deck's cover with one finger, has the cylinder seated before you can offer, and then, with a pair of tweezers she had in her hair, does something to the pickup that makes the whole machine hum a fifth lower.\n\n"Phase," she says. "Your tone and the Relay's will be the same pitch, but not the same time. I'll put the offset where the Bell's beat has to land. Think of it as a thumb on a scale." Then, quieter, not to you: "My tone. First time anyone's played it for more than me."`,
      onEnter: [{ set: "wake_deck_ready", val: true }, { set: "wake_phase_tuned", val: true }, { xp: 2 }, { morale: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is trying very hard not to cry on the equipment. The tone is the first thing she has ever made that was meant to be used by other people. It is the loneliest and the proudest you have ever seen anyone look.` }
      ],
      choices: [{ text: "Stand by the cabinet. Wait for the call.", goto: "wake_c1_deck" }]
    },
    wake_deck_ok: {
      speaker: "sleight",
      text: `One thumb, one nail, a breath. The cylinder slides across the gap and drops into its seat like a coin into a very patient slot. The stylus touches down on nothing, a small, wet click, and lifts. The deck hums. Ten thieves in a trench coat of cuffs are very pleased with themselves and are trying not to say so.\n\nYou have the line ready. You do not have a second. You have the first, and that is plenty.`,
      onEnter: [{ set: "wake_deck_ready", val: true }, { xp: 1 }],
      choices: [{ text: "Stand by the cabinet. Wait for the call.", goto: "wake_c1_deck" }]
    },
    wake_deck_slip: {
      speaker: "narrator",
      text: `The cylinder skids, catches the edge of the guide and takes a shallow nick out of the first second. You freeze. The deck does not. It spins up, offended, makes a noise like a cat swallowing a spoon, and plays a little of your tone against the empty room before you stop it. The nick is real. It is perhaps a hundredth of the song. It is, you are quite certain, the hundredth that mattered.\n\nIt will still play. It will play with a flaw in its first breath, like a bell with a hair in the bronze.`,
      onEnter: [{ set: "wake_deck_ready", val: true }, { add: "wake_pressure", n: 1 }, { time: 3 }],
      interjections: [
        { skill: "grit", min: 3, text: `It's only a cylinder. You have a hundred more fingers than that. Pick it up. Put it down. Go on.` }
      ],
      choices: [{ text: "Stand by the cabinet. Wait for the call.", goto: "wake_c1_deck" }]
    },

    wake_live: {
      speaker: "narrator",
      voices: 3,
      text: `This is the hard way, and you are on it. You have the tone: a wax cylinder with a song in it that has never been played to more than a girl in a library. You do not have the Relay's line. When the Address ends, Captain Brune's console will thread the master tape and Grand Harmony will leave the Relay by two roads at once: down the cable, to every wired pole in the district, and out over the air, to every Harmony set in the good flats and the Party houses and the black car on the Avenue.\n\nFrom the tower you can cut the cable's road. The Warden's switch does that. You cannot, from here, cut the air.`,
      onEnter: [{ set: "wake_path", val: "live" }],
      interjections: [
        { skill: "dialectics", min: 3, text: `Two roads. You hold one lever. A proposition: therefore, you can win the cable and lose the air. The wired poles are ninety per cent of District 9. The air is perhaps a third of its sleep. Do the sum. It is not a good sum. It is a better one than nothing.` },
        { skill: "archive", min: 4, text: `The only person in a position to kill the aerial band is the Relay's duty engineer. The aerial deck, per the plans, has a single mercury-wetted switch behind a rack. It is, in the plans, labelled DO NOT.`, cond: "!(((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested))" },
        { skill: "instinct", min: 4, text: `Throw the switch, and a lamp lights at the Relay. Brune will know within seconds that the tower is not playing nicely. Expect company.` }
      ],
      choices: [
        { text: "Load the deck and ready the switch.", goto: "wake_live_deck" }
      ]
    },
    wake_live_deck: {
      speaker: "narrator",
      text: `You load the cylinder into the deck by touch, in the dark under the stair, with the Address murmuring on the roofs below like a congregation beginning a long hymn. It seats on the second attempt. The deck purrs. Hob, at the bell, does not turn round, but his shoulders drop a quarter-inch, and you realise he has been holding them there for an hour.\n\nThe lamp on the cabinet glows green. Somewhere out on Karsov Avenue, behind a yellow window, a man with a clipboard is looking at a dial and has not yet found the thing that is wrong with it.`,
      onEnter: [{ set: "wake_deck_ready", val: true }],
      interjections: [
        { skill: "reflex", min: 3, text: `Lever, deck, jack. Lever, deck, jack. Your hand has already done it twice in the air. That is what a body does when the head is still afraid.` }
      ],
      choices: [{ text: "Wait for company.", goto: "wake_c2" }]
    },

    // ---- crisis 1: the call from the Relay
    wake_c1_swap: {
      speaker: "narrator",
      voices: 3,
      text: `The field telephone on the wall, a black Bakelite thing with a crank, rings once. The ring goes through the roof like a dropped tray. Hob does not move. It rings again.\n\nYou lift the receiver. On the other end, over a hiss and a very large hum, a voice you do not know, brisk and bored and exact, is reading from a card: "Array, Relay. Pre-cue line check. Confirm test-tone at one kilocycle on your meter, and read me the needle." Behind it you can hear the click of a console, and another voice, a deeper one, saying: "Ask them again."`,
      interjections: [
        { skill: "archive", min: 3, text: `Actually, that is Form 17: Array Acknowledgement. The needle should read at the green notch, which, on a master tape of Grand Harmony, it would. On a counter-tone it reads... at the orange. A trained ear would notice. The man behind him has a trained ear.` },
        { skill: "instinct", min: 3, text: `Captain Brune. The deeper voice. He is bored, and he is a man who gets bored very carefully. If the needle is wrong, he will not mind: he will send someone to look.` },
        { skill: "slip", min: 3, text: `Not yet. Not yet. Let it ring once more, then pick up. A person who answers too fast has something to say.` }
      ],
      choices: [
        { text: "Hold the receiver out to the tower. \"It's for you.\"", goto: "wake_c1_tomas", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "Give the tower's side of the call to Ilsabet.", goto: "wake_c1_ils", cond: "flag.ilsabet_ready" },
        { text: "Answer in the State's own voice. Let it reassure them.", check: { skill: "doublethink", diff: 11, id: "finale_hub_wake_phone_dt", pass: "wake_c1_dt_pass", fail: "wake_c1_fail" } },
        { text: "Keep your face and your voice perfectly level. Read them a needle.", check: { skill: "composure", diff: 12, id: "finale_hub_wake_phone_comp", pass: "wake_c1_comp_pass", fail: "wake_c1_fail" } },
        { text: "Say whatever comes into your head.", goto: "wake_c1_fail" }
      ]
    },
    wake_c1_deck: {
      speaker: "narrator",
      voices: 3,
      text: `The field telephone on the wall, a black Bakelite thing with a crank, rings once. The ring goes through the roof like a dropped tray. Hob does not move. It rings again.\n\nYou lift the receiver. On the other end, over a hiss and a very large hum, a voice you do not know, brisk and bored and exact, is reading from a card: "Array, Relay. The master tape is not on its shelf. The Captain would like to ask whether anyone at your end has seen a grey can about so big. Also: we are going to be running the pre-cue line check in four minutes. Please confirm you are at your station and that nothing on your side has been, in the language of the form, tampered with."`,
      interjections: [
        { skill: "archive", min: 3, text: `Form 22: Missing Tape Protocol. The Relay must report the loss to the Inspectorate within fifteen minutes. They have been very good. They have taken seventeen.` },
        { skill: "dialectics", min: 3, text: `If they are asking, they do not know. If they were sure, they would not telephone, they would climb. Therefore the man on the other end is a fisherman. Do not mistake the line for the fish.` },
        { skill: "slip", min: 3, text: `Not yet. Let it ring once more. Then pick up like a person who was in the middle of something very boring.` }
      ],
      choices: [
        { text: "Hold the receiver out to the tower. \"It's for you.\"", goto: "wake_c1_tomas", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "Let Ilsabet answer, in her small, polite, utterly credible schoolgirl voice.", goto: "wake_c1_ils", cond: "flag.ilsabet_ready" },
        { text: "Answer in the State's own voice. Let it reassure them.", check: { skill: "doublethink", diff: 11, id: "finale_hub_wake_phone_dt2", pass: "wake_c1_dt_pass", fail: "wake_c1_fail" } },
        { text: "Keep your face and your voice perfectly level. Lie to them.", check: { skill: "composure", diff: 12, id: "finale_hub_wake_phone_comp2", pass: "wake_c1_comp_pass", fail: "wake_c1_fail" } },
        { text: "Say whatever comes into your head.", goto: "wake_c1_fail" }
      ]
    },
    wake_c1_tomas: {
      speaker: "tomas",
      text: `A long, rustling pause on the line, the sound of a very tired man leaning over a console. Then a voice, dry and nasal, exactly the voice of a tape-operator reading a form he has read nine thousand times: "Array, Relay. Tomas Wend, duty engineer. Confirm needle at green. Confirm line at nominal. Confirm that your side has been in no way, per the form, tampered with." A beat. "Captain, I have the tower. Everything is nominal. Everything has been nominal for nine years. May I put the kettle on?"\n\nBehind him the Captain grunts. The click of a pencil is heard to make a tick.\n\nThen, softer, with the receiver turned away: "I'm going to stand in front of the vault for the rest of the evening, I think. I would like someone to remember I did."`,
      onEnter: [{ xp: 2 }, { morale: 2 }, { set: "wake_c1_clear", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `Nine years of nominal. A man who has said "nominal" so long it has worn a groove in him. And tonight he has said it for the first time on purpose.` },
        { skill: "solidarity", min: 3, text: `We have friends in the machine. We always did. We should have asked them earlier what they wanted. It was only ever to be asked.` }
      ],
      choices: [{ text: "Hang up. Breathe.", goto: "wake_c2" }]
    },
    wake_c1_ils: {
      speaker: "ilsabet",
      text: `She takes the receiver as one takes a cup of tea from a stranger. She does not say anything for a second. She hums the carrier through her teeth, the exact one-kilocycle note, held steady against the line's hiss, and at the other end a man who has said "read me the needle" so often that he no longer hears the words hears, with his ear, the note he has been waiting to hear. "Needle's green," says Ilsabet, in a voice she has borrowed from a dead aunt. "Array confirms. May I go back to my homework, please, sir?"\n\nA laugh on the line, bored and not unkind. "Carry on, miss."\n\nShe hangs up. Her hand is shaking. She tucks it under her thigh, the way she does, and looks at you with an expression so careful that it takes a moment to see it is triumph.`,
      onEnter: [{ xp: 2 }, { morale: 1 }, { set: "wake_c1_clear", val: true }],
      interjections: [
        { skill: "charm", min: 3, text: `"May I go back to my homework, please, sir?" is the single most beautiful thing anyone has ever said to a security officer. I'd like to frame it. I'd like to have said it.` },
        { skill: "senses", min: 4, text: `She is still humming, silently, under her breath. She cannot stop. Whatever tone is in her ear, she has locked it in, and it will stay there till morning.` }
      ],
      choices: [{ text: "Squeeze her shoulder. Turn back to the stair.", goto: "wake_c2" }]
    },
    wake_c1_dt_pass: {
      speaker: "doublethink",
      voices: 3,
      text: `Oh, friend, you have been waiting your whole life to be asked this. Open your mouth. Open it wide. Let the lovely, reasonable, unhurried voice, the one that has always known what to say, step out onto the tongue and take the telephone.\n\n"Relay, this is Array." It is your mouth. It is not your voice. It is warmer. It is the voice of an Assistant Deputy Sub-Director of something, who has been up all night, who is a little hurt that you would doubt a colleague. "Needle at the green notch, as always. I'm looking at it now. I'm afraid the pigeons have been at the cabinet again. If you would be good enough to send the requisition. Thank you so much. Glory to the Hour."\n\n"Glory to the Hour," the line murmurs, with real feeling, and clicks off.`,
      onEnter: [{ xp: 2 }, { set: "wake_c1_clear", val: true }, { surv: -2 }],
      interjections: [
        { skill: "volition", min: 4, text: `That was you. All of it. It does not stop being you because it was convenient. Remember that when it is not convenient.` },
        { skill: "rhetoric", min: 3, text: `"Glory to the Hour." I was a little jealous. I'd have gone for "Glory to the Quarter-Hour," for the scansion.` }
      ],
      choices: [{ text: "Put the receiver back on its hook. Wipe your palm.", goto: "wake_c2" }]
    },
    wake_c1_comp_pass: {
      speaker: "composure",
      text: `Collar. Pressed. Shoulders level, eyebrows flat, voice a folded handkerchief. You read the dull little lies off the inside of your eyelids as if they were printed there: the needle (green), the line (nominal), the weather on the roof (mild with some pigeons). Not a flicker in the throat. Not a tick in the tone.\n\n"Understood, Array," says the line. A long pause, in which you can feel the Captain consider whether to make this his problem. Then the click of a pencil, a tick, and a dial tone like a tiny sleeping animal.\n\nYour hand, you notice, is not shaking. That is not an achievement of nerves. It is an achievement of tailoring.`,
      onEnter: [{ xp: 2 }, { set: "wake_c1_clear", val: true }],
      choices: [{ text: "Hang up. Put your face back on.", goto: "wake_c2" }]
    },
    wake_c1_fail: {
      speaker: "narrator",
      text: `"Say again, Array?" says the voice. A pause that has a trowel in it. In the background the deeper voice says something short, and a chair scrapes back. "Array, stay at your station. We are sending somebody up to look at your meter."\n\nThe line goes dead. You stand with the receiver humming against your ear like a cooling kettle. You have bought nothing, and you have paid for it: now someone is coming, and they know a very exact thing about you, which is that you were nervous on a telephone.\n\nHob, at the bell, has turned his head to listen to the stairwell. His eyebrows go up slowly, the whole slow comic length of them.`,
      onEnter: [{ add: "wake_pressure", n: 1 }, { surv: 6 }],
      interjections: [
        { skill: "adrenaline", min: 3, text: `WELL THAT WENT BADLY. EXCELLENT. NOW THEY'RE COMING UP THE STAIRS AND WE CAN ACTUALLY DO SOMETHING.` },
        { skill: "volition", min: 4, text: `It is one small failure. A failure is a fact; not a verdict. Find the door they will come through.` }
      ],
      choices: [{ text: "Turn to the stair.", goto: "wake_c2" }]
    },

    // ---- crisis 2: the stair
    wake_c2: {
      speaker: "narrator",
      voices: 3,
      text: `Boots on the stair. Not one pair: six, eight, in step, the kind of step that has been taught on a gym floor and has never been wrong on one. They take the spiral at a steady climb, a hundred and twelve ramps and risers, and the sound arrives in the tower a long while before the people do, as if the staircase were a long throat swallowing rhythm.\n\nHob puts his hand on the stair-rail and closes his eyes, as if reading a letter. Then he holds up the fingers of one hand, three, then four, then a closed fist. Three of them. Four. One in front.\n\nThe one in front is wearing a red enamel pin in the shape of a flaming bell.`,
      interjections: [
        { skill: "reflex", min: 3, text: `Door. Rail. Rope. Three feet from the lever, five from the bell. The roof is a stage, and she's coming from the wings.` },
        { skill: "authority", min: 3, text: `YOU HOLD THE HIGH GROUND. YOU HAVE ONE DOOR TO WATCH. NOBODY HAS EVER LOST A STAIRCASE BY STANDING STILL AT THE TOP.` },
        { skill: "empathy", min: 4, text: `She will not be coming up with her heart in her mouth. She will be coming up with it exactly where it has always been: neat, in a drawer, under a ribbon.` }
      ],
      choices: [
        { text: "Lieutenant Kell is already on the landing below. You hear her cough once, deliberately.", goto: "wake_c2_vasha", cond: "(flag.vasha_ready && !flag.vasha_betrays)" },
        { text: "Osk's keys, below you, turn in a lock. Then in another. Then in a third.", goto: "wake_c2_osk", cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)" },
        { text: "Rhea comes up the last turn alone. She closes the door behind her.", goto: "wake_c2_rhea", cond: "(flag.rhea_ready || flag.rhea_turned)" },
        { text: "Something small and fast shoots past you onto the stair. Wren.", goto: "wake_c2_wren", cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)" },
        { text: "Hob puts both hands on the bell-rope and looks at you for permission.", goto: "wake_c2_hob", cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal)" },
        { text: "Meet Rhea on the landing.", goto: "rhea_start" },
        { text: "Hide behind the bell and hope.", goto: "wake_c2_hide" }
      ]
    },
    wake_c2_vasha: {
      speaker: "vasha",
      voices: 3,
      text: `You find her on the landing between the library and the clock-room, in the half-dark, in her second-best coat, with a cigarette not lit and a knee that is making its feelings known. She does not look round when you come down the last six steps. She is looking up the stair, at the eight pairs of feet.\n\n"Go on, kid." Her voice is quite flat. "I was an infantry sergeant for eleven years before they made me a gym teacher. There is nothing in this building that I haven't held a staircase against." She sets her back against the newel-post and her good foot against the wall. "I wrote you up in a notebook for three days. Let me do one thing that isn't paper."\n\nShe takes the cigarette from her mouth, looks at it, and puts it behind her ear. "Tell them the Lieutenant's on the stairs. They'll know what it means."`,
      onEnter: [{ xp: 2 }, { morale: 2 }, { set: "wake_c2_clear", val: true }, { set: "wake_vasha_held", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is going to be hurt on this stair. She knows. She has decided that the knee will not be the reason she does not stand here.` },
        { skill: "authority", min: 4, text: `THAT IS HOW YOU HOLD A STAIRCASE. SHE DOES NOT RAISE HER VOICE. SHE STANDS WHERE THE STAIRCASE IS NARROWEST AND LETS THE GEOMETRY DO IT.` },
        { skill: "solidarity", min: 3, text: `We never said she wasn't one of us. We only said she was standing in the wrong room. Now she's in the right one, with her bad foot and her good wall.` }
      ],
      choices: [{ text: "Nod. Climb. Do not look back.", goto: "wake_c3" }]
    },
    wake_c2_osk: {
      speaker: "osk",
      text: `You hear it from the roof: the turn of a key in the door at the foot of the spiral, a heavy, sullen, reliable sound, and then, one landing up, another; and another; and another. Osk, doing what he has done for thirty-one years, one door at a time, with all the unhurried dignity of a man who has never in his life been asked what he thinks of the Jubilee and has decided to say it in iron.\n\nThe eight pairs of boots arrive at the first locked door and stop. Somebody swears. Somebody tries a shoulder. Down the stair, floating up like a hymn, comes a gruff, mild, slightly deaf voice: "Sorry, young miss. Staff only. I'll be a minute with the key. It sticks."\n\nIt sticks, you notice, in a way that it has never stuck before.`,
      onEnter: [{ xp: 2 }, { morale: 1 }, { set: "wake_c2_clear", val: true }, { set: "wake_osk_held", val: true }],
      interjections: [
        { skill: "the_grey", min: 3, text: `He is the best lock in the building. He knows every door's moods. A key is only a promise between a man and a hinge, and he has just promised the hinges everything.` },
        { skill: "senses", min: 4, text: `Oil on the third landing's bolt. He greased it the wrong way on purpose: it will bind for another four minutes. He thought of this on Wednesday and did not tell anyone.` }
      ],
      choices: [{ text: "Smile at the dark. Go back to the array.", goto: "wake_c3" }]
    },
    wake_c2_rhea: {
      speaker: "rhea",
      voices: 3,
      text: `She comes through the door at the head of the stair with her squad stranded two landings below her, behind the door she has, with her own hand, closed, and when it clicks shut it sounds a great deal like a decision. She does not draw the baton. She stands against the brick with her armband very straight and her breath not quite even.\n\n"They believe I am questioning a suspect," says Rhea Vantage. "I have four minutes." She looks at the array, the lever, the horns, Hob. She looks at you. "I read the line you showed me. Row forty-one: V., R., female, aged seven. Pedagogic Harmony, applied. I have not been able to make my eyes leave it." She swallows. "Tell me what to do with my hands."`,
      onEnter: [{ xp: 3 }, { morale: 2 }, { set: "wake_c2_clear", val: true }, { set: "wake_rhea_held", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `This is the bravest thing she has ever done and it looks exactly like standing still. She has just closed the one door in her life she was ever ordered to keep open.` },
        { skill: "instinct", min: 4, text: `She is not lying. Nobody who is lying asks what to do with their hands.` },
        { skill: "solidarity", min: 3, text: `We did not think we would ever see her at the edge. We are so afraid of how glad we are.` }
      ],
      choices: [{ text: "\"Hold the door. That's all. Just hold it.\"", goto: "wake_c2_rhea_b" }]
    },
    wake_c2_rhea_b: {
      speaker: "rhea",
      text: `"Hold it." She says it as if it were a very large word. Then she puts her back to the door and her heels against the sill, a girl in a perfect uniform holding up the sky with her spine. "They'll force it. In four minutes, five. When they do, I will have been overpowered. Tell Kell I said it was a fair fight, if she asks."\n\nShe looks at her split knuckle, the one that closed over a month of silences, and flexes it. "I did it, you know. The Commissar. I'll say it to whoever you like, after. I only want to say it after this." A thin, bright, awful smile. "I'd like, for once, to be on the side of the thing that remembers."\n\nYou realise you have been holding your breath. You let it go. It does not make a sound.`,
      onEnter: [{ set: "rhea_holds_door", val: true }],
      choices: [{ text: "Go back to the array.", goto: "wake_c3" }]
    },
    wake_c2_wren: {
      speaker: "wren",
      text: `She comes up the spiral at a dead run, flat as a thrown glove, holds out a folded note without breaking stride, and goes straight on through the door onto the roof, around the bell, and down the other side of the stair, the one nobody uses, the maintenance chute with the rope. She does it all in about seven seconds.\n\nThe note says, in huge, uneven, joyous capitals: THEY ARE SEARCHING THE DORMS. I TOLD THEM YOU WERE IN THE LIBRARY. I TOLD THEM THIS WAS A DRILL. I TOLD THEM IT WAS MY BIRTHDAY. THEY'RE ALL GOING TO THE WRONG STAIR. LOVE, WREN.\n\nBelow, as if in answer, a very large number of boots stop, turn, and march with great discipline in the wrong direction.`,
      onEnter: [{ xp: 2 }, { morale: 2 }, { set: "wake_c2_clear", val: true }, { set: "wake_wren_held", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `It is not her birthday. She is crying a little, you think, somewhere in the maintenance chute. She is twelve. She is going to remember this for the rest of her life, and if you are lucky, so will you.` },
        { skill: "charm", min: 4, text: `Honestly? She is better at this than you. I'd like her to teach a seminar.` }
      ],
      choices: [{ text: "Read the note again. Pocket it.", goto: "wake_c3", effects: [{ give: "wren_note" }] }]
    },
    wake_c2_hob: {
      speaker: "hob",
      voices: 3,
      text: `Hob does not ask. He only looks, and the look has the whole weight of a very patient animal: Shall I? You nod. He takes the rope in his two hands, braces one boot on the stone, and pulls the Great Bell through exactly one quarter-turn of its arc.\n\nThe sound is not a note. It is the sound a thing makes when it has stopped being a note and become a weather. It comes out of the bronze and down the stairwell, dropping soot, dust and old paint like snow. Eight pairs of boots, a long way below you, stop dead; a few of them sit down. Somebody cries out and covers his ears. It is the first time in forty years that the Great Bell has been rung off the hour.\n\nHob lets go. The bell sings on, long after, softly, like a thing remembering.`,
      onEnter: [{ xp: 2 }, { surv: 4 }, { set: "wake_c2_clear", val: true }, { set: "wake_hob_held", val: true }],
      interjections: [
        { skill: "the_grey", min: 3, text: `That is my voice. The bell is the only part of me that was ever meant to speak. He rings it the way a man opens a window in a sickroom.` },
        { skill: "grit", min: 4, text: `Your ears hurt. It's only an ear. You have another. Stay on your feet.` },
        { skill: "senses", min: 3, text: `Bronze. Soot. A cold, clean ringing that goes on in the stone for a full minute. Below, a very faint, very human noise: eight Vanguard cadets laughing, nervously, with relief, at being stopped.` }
      ],
      choices: [{ text: "Raise a hand to Hob. Go back to the array.", goto: "wake_c3" }]
    },
    wake_c2_hide: {
      speaker: "narrator",
      text: `You crouch behind the Great Bell, in the lee of its curved flank, and the world becomes bronze. The bell's cold surface hums a quarter-tone under your cheek. The stair door opens. The boots come out onto the roof and stop. Somebody counts, in a whisper. Somebody finds the deck, the cable, the lever's guard, your footprint in the dust. A flashlight arrives at the edge of your hiding place and stays there.\n\n"Cadets," says Rhea Vantage, in a conversational tone. "I am so sorry to have to do this on a feast day."\n\nIt was a bad plan. It was always going to be a bad plan. You had sixty seconds to make it good and you spent them breathing.`,
      onEnter: [{ add: "wake_pressure", n: 2 }, { surv: 10 }, { hp: -2 }],
      interjections: [
        { skill: "slip", min: 3, text: `Not yet, I said. I said not yet and then you stayed. This is what staying looks like.` },
        { skill: "grit", min: 3, text: `It's only a hand. It's only a hand. They are standing on it.` }
      ],
      choices: [
        { text: "Come out with your hands open.", goto: "rhea_start" }
      ]
    },

    // ---- crisis 3: the Inspector on the roof
    wake_c3: {
      speaker: "narrator",
      voices: 3,
      text: `The door at the head of the stair opens again, slowly, the way a door is opened by someone who wants it to be remembered that he opened it politely. A folding chair comes through first, unfolded with a click. Then a thermos. Then the Inspector, in his good coat, a little out of breath from the hundred and twelve steps and a great deal out of breath from everything else.\n\n"Please," says Hale Voss. "Don't get up. I only came to watch." He sets the chair down on the boards between you and the lever, sits, crosses one knee over the other, and unscrews the thermos. Steam rises, smelling of lemon and old tea. "It is a lovely view. It's my favourite part of the district. I'd hate to have it spoiled by anyone doing anything."`,
      interjections: [
        { skill: "instinct", min: 3, text: `He is between you and the lever. By accident, he would say. A man like that has never done anything by accident since the day he was sworn in.` },
        { skill: "composure", min: 3, text: `Do not look at the lever. Do not look at the deck. Look at the view. People who are looking at the view are people who are, officially, doing nothing.` }
      ],
      choices: [
        { text: "Sit down beside him.", goto: "voss_arrive" },
        { text: "Stay on your feet, and face him.", goto: "voss_arrive" }
      ]
    },

    // ---- the cue
    wake_hour: {
      speaker: "narrator",
      voices: 3,
      text: `Below the roof, the Warden's voice finishes the last sentence of the Address: "...and so, my children, rest." There is a long, warm silence, eleven thousand people in a street holding their paper flags a little closer. Somewhere in the Relay a clock completes its turn. A single clean tone sounds on the line: the cue.\n\nNow.`,
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "reflex", min: 3, text: `Now. Now. NOW.` },
        { skill: "the_grey", min: 3, text: `The district draws breath. I feel it in the cobbles: eleven thousand sets of ribs rising at once. The longest inhale I have ever been part of.` }
      ],
      choices: [
        { text: "Watch the line. The tape is already yours.", goto: "wake_hour_swap", cond: "flag.wake_path === 'swap'" },
        { text: "Throw the Warden's switch. Start the deck.", goto: "wake_hour_deck", cond: "flag.wake_path === 'deck'" },
        { text: "Throw the Warden's switch. Start the deck. Fight the air.", goto: "wake_hour_live", cond: "flag.wake_path === 'live'" }
      ]
    },
    wake_hour_swap: {
      speaker: "narrator",
      voices: 3,
      text: `The cabinet's lamp flickers, flares, and goes steady. The line hum rises in pitch, takes a small breath, and a sound comes out of every horn on the roof that you have heard exactly once before, in a library, on a wax cylinder, from a girl who was holding her own hands: the Wake tone. It is not loud. It is, in fact, almost nothing: a long sweet descending pair of pitches, lying across each other like a couple asleep. But they are the Bell's own two notes, turned inside out, and where they land the old beat has nothing to push against.\n\nOn the Avenue, the first flag drops.\n\nIt is the sound of a district waking up in the middle of its own party.`,
      onEnter: [{ sfx: "chime" }],
      interjections: [
        { skill: "senses", min: 3, text: `The tone climbs your spine like cold water going the right way. All the muscles in your neck, which have been clenched for three days without your knowledge, let go.` },
        { skill: "empathy", min: 4, text: `People are looking at each other. Not at the flags, not at the horns: at each other, like strangers at a very old wedding, working out who they were before the music.` }
      ],
      choices: [{ text: "Hold on.", goto: "wake_choir" }]
    },
    wake_hour_deck: {
      speaker: "narrator",
      voices: 3,
      text: `You throw the Warden's switch. It goes over with a long brass clunk like the lid of a coffin made by a clockmaker, and every light on the cabinet turns from green to amber. At the Relay, in a concrete box with one yellow window, a lamp comes on, and someone says a short word. It is too late. The line is yours.\n\nYou start the deck. The cylinder turns. The stylus finds the groove. And out of eleven black horns, out across the Courtyard and the Avenue and the long grey roofs, comes a long sweet descending pair of pitches, lying across each other like a couple asleep: the Bell's own two notes, inside out.\n\nOn the Avenue, the first flag drops.`,
      onEnter: [{ sfx: "chime" }, { set: "wake_switch_thrown", val: true }],
      interjections: [
        { skill: "reflex", min: 3, text: `Lever. Deck. Hold. Your arm did it before you'd decided to. Hold it down. Do not let go.` },
        { skill: "senses", min: 3, text: `The brass is hot under your thumb. The deck hums a fifth lower, as Ilsabet's phase, or your luck, intended. It smells of tallow and old courage.` }
      ],
      choices: [{ text: "Hold on.", goto: "wake_choir" }]
    },
    wake_hour_live: {
      speaker: "narrator",
      voices: 3,
      text: `You throw the Warden's switch. The lever goes over with a long brass clunk and every light on the cabinet turns from green to amber. At the Relay a lamp comes on, and the Captain's chair goes back. You start the deck. The cylinder turns. The tone comes out of the horns, a long sweet descending pair, lying across each other like a couple asleep, and the wired poles of District 9 take it up one after another: Avenue, Courtyard, dormitory roof, the kiosk, the tram stop, the whole long chain of tin throats waking.\n\nBut at the very same moment, from somewhere a little to the east, from the Party houses and the good flats and the black car's own dashboard, thin and bright and utterly ordinary, the old Harmony drifts over the air: a choral swell, a chime, the Bell proper. Two songs. They meet above the Courtyard and begin, very slowly, to quarrel.`,
      onEnter: [{ sfx: "chime" }, { set: "wake_switch_thrown", val: true }, { add: "wake_pressure", n: 1 }],
      interjections: [
        { skill: "dialectics", min: 3, text: `As foreseen. The cable is yours; the air is not. Two tones in a single sky. The beat between them will be audible as a wobble in everything. Whoever has the stronger carrier wins the intersection. You have the louder horns, but not the louder transmitter.` },
        { skill: "the_grey", min: 3, text: `A third of the roofs hum the wrong tune. I can feel them, little warm patches in my skin where the old song is still pooling. They are not wicked. They are only on the other frequency.` }
      ],
      choices: [{ text: "Hold on.", goto: "wake_choir" }]
    },

    wake_choir: {
      speaker: "narrator",
      voices: 3,
      text: `Down in the Courtyard, on the choir stand beneath the Warden's banner, Fenwick Alder has lifted both arms. He holds them there, quivering. Behind him, forty students in grey wool are waiting for the one downbeat they have been told is the greatest of their lives. And the Anthem, the real Anthem, which has been wired by the Ministry to follow the cue exactly, is about to begin.\n\nIt begins in the wrong key. It begins, that is, in the key of Steady Hands, the key that carries the Bell's beat inside it like a worm in an apple: if forty children sing the Anthem over the Wake tone, they will be singing the old song over the new, and everything they were just given will be rubbed away.`,
      interjections: [
        { skill: "rote", min: 3, text: `THE ANTHEM IS IN G. THE ANTHEM IS ALWAYS IN G. (There is a small, inexplicable pencil mark in the margin of the score, next to the key signature. It says E-FLAT. It says it in Fenwick's hand.)` },
        { skill: "empathy", min: 3, text: `He is looking up at the tower. Not at you: at the array. Forty seconds ago he was a man who had never in his life disobeyed a conductor's score. He is trying to decide, in the last second, who the conductor is.` }
      ],
      choices: [
        { text: "On the roof, Hob rings the Great Bell in E-flat. Fenwick hears it, and lowers his hands.", goto: "wake_choir_fen", cond: "flag.fenwick_ready && flag.choir_wake_arrangement" },
        { text: "Fenwick, without his arrangement, hesitates. Let the bell tell him which key.", goto: "wake_choir_hob", cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal) && !(flag.choir_wake_arrangement && flag.fenwick_ready)" },
        { text: "Say nothing. Trust the horns.", goto: "wake_choir_none" }
      ]
    },
    wake_choir_fen: {
      speaker: "fenwick",
      voices: 3,
      text: `Fenwick brings his hands down.\n\nThe forty voices do not sing the Anthem in G. They sing it in E-flat, the key pencilled in his own hand in the margin of every copy since Wednesday: a key a minor third lower, a key in which the Anthem's tune, long and mournful, lies down alongside the Wake tone like a dog beside a sleeping child. A bass, a tenor, a few frightened, brave sopranos, the real, ragged, slightly flat voices of real children, take the cue and carry it across the Courtyard on their breath. They have, in thirty seconds, taken a hymn of forgetting and made it a hymn of waking.\n\nOn his podium, in the one good suit, with tears running into his collar, Fenwick Alder is conducting with his eyes shut. His mouth is moving. He is not singing the words. He is singing, over and over, very low: "Thank you. Thank you. Thank you."`,
      onEnter: [{ xp: 3 }, { morale: 3 }, { set: "wake_choir_carried", val: true }],
      interjections: [
        { skill: "solidarity", min: 3, text: `We sing. All of us. In the right key, in the wrong voices, on the one night it matters. A choir is how a crowd tells itself it is not alone.` },
        { skill: "rhetoric", min: 4, text: `And there it is: the pause before the applause. For once it is not mine. I would give the pause away to anyone. I would give them the podium.` }
      ],
      choices: [{ text: "Hold the line.", goto: "wake_hold" }]
    },
    wake_choir_hob: {
      speaker: "hob",
      text: `You look at Hob. He is already looking at you, and in his big slow face there is a question and a decision, which is how he says everything. He takes the bell-rope in both hands. He does not ring the quarter-hour, or the whole hour, or the old muster. He pulls the Great Bell through a long, low, rolling swing, and the bronze gives out a single note that fills the roof from edge to edge: not G. A tone that lives a little below the Wake tone's lower pitch, as a floor lives beneath a room.\n\nDown in the Courtyard, forty children and one man lift their heads. Fenwick has perfect pitch. He has had it all his life. He hears the bell once, and you see his shoulders do something they have not done since the day he was told what the Anthem was for.\n\nHe brings his hands down. It is a different key, and it is not quite the right one. It is close enough that the Anthem lies down across the Wake tone instead of stamping it flat.`,
      onEnter: [{ xp: 2 }, { morale: 2 }, { set: "wake_choir_carried", val: true }, { set: "wake_choir_ragged", val: true }],
      interjections: [
        { skill: "the_grey", min: 3, text: `He does not need words. The bell is the only language I have ever been fluent in. I am so proud of him I can hardly hold the stone together.` },
        { skill: "empathy", min: 3, text: `Fenwick looks up at the tower in the last second, finds a shape he knows, and decides. Everything he had wanted was just the permission to be told.` }
      ],
      choices: [{ text: "Hold the line.", goto: "wake_hold" }]
    },
    wake_choir_none: {
      speaker: "narrator",
      text: `You say nothing. The horns hold the tone. Fenwick's arms come down.\n\nThe choir sings the Anthem in G.\n\nIt is a big, handsome, unforgettable sound, and it lies across the Wake tone like a very good blanket across a very quiet fire. For the length of the first line the two songs do not touch: the choir above, the tone beneath, forty voices of forgetfulness set above a single long note of waking, and the Courtyard stands between them, undecided. Then the beat comes in. You feel it in your fillings. The old, sweet, cruel, familiar beat begins, very faintly, to push.`,
      onEnter: [{ add: "wake_pressure", n: 1 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `It will get louder. Everything with a choir behind it does.` },
        { skill: "volition", min: 4, text: `There is a little, bitter, useful lesson in this. You trusted the horns to do the speaking. Nobody ever trusted a loudspeaker with an argument and won.` }
      ],
      choices: [{ text: "Hold the line.", goto: "wake_hold" }]
    },

    wake_hold: {
      speaker: "narrator",
      voices: 4,
      text: `It is a contest now, and it is happening almost entirely in your head. Under the Wake tone the old beat still moves, the thin, sweet, patient pressure of three days' worth of forgetting trying to find the one ear in the Courtyard that will take it. Yours is not that ear. Yours was never that ear. But the beat is not stupid: it knows that this is the place the tone is coming from, and it is pushing the one way a thing can push on a person who cannot be fooled by sound.\n\nIt pushes on you, from the inside, to let go.\n\nYou do not have to do anything. You only have to not let go. You have never in your life had a task so simple, or one that so completely refused to be easy.`,
      interjections: [
        { skill: "volition", min: 3, text: `Hold. Hold the lever, hold the line, hold the one thought you have been carrying for three days. The Bell wants it. Do not give it. It is not a heavy thing. It is only a name, and a date, and a promise. Hold it.` },
        { skill: "solidarity", min: 3, text: `We are holding it too. Look around you: every one of us has the same thought and it is the same weight and it is shared out, so that no one carries it alone. Lean on us. We will take your side of the lever.` },
        { skill: "the_grey", min: 4, text: `Let me hold it. I am concrete and I am very slow. I do not forget. Press your back against my stone and I will hold your back up while you hold the district's.` },
        { skill: "grit", min: 3, text: `It's only a headache. It's only a tooth. It's only the end of the world, which is a small thing compared to what you have already carried up a hundred and twelve steps.` }
      ],
      choices: [
        { text: "Hold. Will the thing to stay. (Choir carrying the tone.)", cond: "flag.wake_choir_carried && flag.choir_wake_arrangement", check: { skill: "volition", diff: 11, id: "finale_hub_wake_hold_vol_choir", pass: "wake_win", fail: "wake_hold_fail" } },
        { text: "Hold. Will the thing to stay.", cond: "!(flag.wake_choir_carried && flag.choir_wake_arrangement)", check: { skill: "volition", diff: 13, id: "finale_hub_wake_hold_vol", pass: "wake_win", fail: "wake_hold_fail" } },
        { text: "Let the murmur of the crowd carry the weight with you.", check: { skill: "solidarity", diff: 12, id: "finale_hub_wake_hold_sol", pass: "wake_win", fail: "wake_hold_fail" } },
        { text: "Press your back to the stone. Let the city hold it.", cond: "skill('the_grey') >= 4", check: { skill: "the_grey", diff: 12, id: "finale_hub_wake_hold_grey", pass: "wake_win", fail: "wake_hold_fail" } },
        { text: "Hum with the tone, against the beat, with the note you have lived in all your life.", cond: "flag.finale_hummed", check: { skill: "grit", diff: 9, id: "finale_hub_wake_hold_hum", pass: "wake_win", fail: "wake_hold_fail" } },
        { text: "Don't fight it. Just hang on.", goto: "wake_hold_fail" }
      ]
    },
    wake_hold_fail: {
      speaker: "narrator",
      text: `For a moment, one long clean moment, it goes. The thought you were holding, the name, the date, the promise, thins in your head like breath on a window. You see the Courtyard from a great distance, a small bright toy-box full of people, a girl in a wheelchair, a man in a good suit conducting nothing at all. You think: it is all right. It is only a day. It was only ever a day.\n\nThen Hob, who has not spoken once, strikes the bell. Not for the hour. Not for the choir. For you.\n\nThe sound goes through the soles of your boots and shakes the thought back into your head like a coin out of a tin. It comes back thinner, bruised, a little altered, but it comes back.`,
      onEnter: [{ hp: -2 }, { morale: -2 }, { set: "finale_wake_costly", val: true }],
      interjections: [
        { skill: "grit", min: 3, text: `Teeth. Blood in the mouth, a taste of copper and old coins. You bit your cheek. Fine. It is only a cheek. You have another.` },
        { skill: "the_grey", min: 3, text: `I told you. Concrete holds. Even when the thing leaning on it is itself.` }
      ],
      choices: [
        { text: "Hold what you can.", goto: "wake_costly", cond: "flag.wake_pressure < 3 || flag.finale_voss_delay" },
        { text: "It is slipping out of your hands.", goto: "wake_fail", cond: "flag.wake_pressure >= 3 && !flag.finale_voss_delay" }
      ]
    },
    wake_win: {
      speaker: "narrator",
      voices: 4,
      text: `It breaks. The pressure goes out of the air all at once, the way a fever goes out of a child, and where it was there is a clean wet quiet in which every sound is suddenly itself. Eleven thousand people on Karsov Avenue and in the Courtyard are standing with paper flags in their hands, and every one of them has stopped humming. The Warden's face, forty feet high on its banners, looks out over a district that has just, collectively, remembered exactly what it was doing at three o'clock on Tuesday afternoon.\n\nA woman on the corner by the kiosk says, quite clearly, "I never took my son to the clinic." A man says a name. A child, lifted on a shoulder, looks up at the horns, and says, with enormous interest, "That's the thing that makes me sleepy."`,
      onEnter: [{ xp: 5 }, { morale: 4 }, { sfx: "chime" }, { set: "finale_wake_full", val: true }],
      interjections: [
        { skill: "solidarity", min: 3, text: `We remember. All of us, at once, the same three days, the whole district's quilt of hours stitched back into one piece. We are a quilt. We are so many colours. We had forgotten we were so many colours.` },
        { skill: "empathy", min: 3, text: `It is not a happy sound. It is something stranger and better. The sound of eleven thousand people discovering how much they were afraid, and how long, and then discovering they are standing next to each other.` },
        { skill: "the_grey", min: 3, text: `I felt it in my foundations. The whole quarter exhaled. Thank you. Thank you. Whatever happens next, I would like it recorded in the cornice: tonight was not forgotten.` },
        { skill: "volition", min: 3, text: `You held. You can put it down now. You can put it all down.` }
      ],
      choices: [{ text: "Look down at the Avenue.", goto: "wake_win2" }]
    },
    wake_win2: {
      speaker: "narrator",
      text: `You lean on the railing and look down. The Avenue is full of a sound you have never heard it make: the rising, ragged, overlapping noise of eleven thousand people all starting to talk at once. Some are laughing. Some are shouting names. At the school gate, an old woman has gone down on her knees on the cobbles and is being helped up by three strangers. In the choir stand, forty children are still singing, in E-flat or something like it, because nobody has told them to stop and none of them wants to be the one to tell the others.\n\nAt the far end of the Avenue the Relay's one yellow window goes out. Then comes on again. Then, very slowly, a second window beside it, lit by someone who has stopped being afraid of the light.\n\nBehind you, Hob rings the Great Bell, once, for the hour, a plain, glad, ordinary hour.`,
      onEnter: [{ ending: "end_wake" }],
      interjections: [
        { skill: "rote", min: 3, text: `ONE BELL. (The slogan stops, mid-word. It has nowhere to go. For the first time in your life it has nothing to finish.)` }
      ]
    },
    wake_costly: {
      speaker: "narrator",
      voices: 3,
      text: `It is not clean. When the pressure breaks it breaks unevenly, like ice in March, and for ten long seconds the Avenue is full of people who are looking at each other and cannot say why. A man with a flag in his fist says, "Wait, I knew something." A woman says, "Which day is it?" A child begins to cry, and the crying spreads. Some wake all the way. Some wake to the edge, and stand there, trembling at the edge of a very large room.\n\nFor the rest of your life, a place at the back of your own head will be a little smudged: the exact minute the tone and the beat met and fought. You won't remember what was in it. Perhaps it was only the cue.\n\nBut they remember. Most of them. Enough of them.`,
      onEnter: [{ xp: 3 }, { sfx: "chime" }, { set: "finale_wake_full", val: true }, { set: "finale_wake_costly", val: true }],
      interjections: [
        { skill: "volition", min: 3, text: `A smudge is a small price. Look at the street. It was always going to cost a minute of you. It might have cost all of you.` },
        { skill: "solidarity", min: 3, text: `Enough of us. Enough is the only number that ever mattered.` }
      ],
      choices: [{ text: "Look down at the Avenue.", goto: "wake_win2" }]
    },
    wake_fail: {
      speaker: "narrator",
      voices: 3,
      text: `It is too much. The old beat, which has had forty years' practice at this one small job, finds the place at the back of the Courtyard where the choir is singing in the wrong key and goes in there like water into a crack. The Wake tone shivers. The cabinet's lamp goes from amber to red. In the Relay, a man in a good coat has put down his thermos and picked up a telephone, and a pair of very simple, very expensive circuit-breakers, placed in the line for exactly this contingency, drop open one after another, silently, like sleepers rolling over.\n\nThe tone cuts out. In the Courtyard, a thousand heads rise toward the tower, hear the old Harmony take up its place without a break, and, one by one, with an expression of the most infinite relief, forget.\n\nYou are still on the roof. Your ears are ringing. Yours always were.`,
      onEnter: [{ sfx: "static" }],
      interjections: [
        { skill: "the_grey", min: 3, text: `I could not hold them. I am sorry. I am only the building.` },
        { skill: "doublethink", min: 3, text: `Oh, but it's all right now, friend. Isn't it all right? Nobody remembers that you tried. How restful.` }
      ],
      choices: [
        { text: "Wait for them to come up the stair.", goto: "fail_caught" },
        { text: "Sit down against the bell and wait for the night to take you.", goto: "fail_forgotten" }
      ]
    },

    // ---------------------------------------------------------------- ROUTE D + SHARED: INSPECTOR VOSS
    voss_start: {
      speaker: "narrator",
      text: `You go down. It takes a quarter of the evening: the spiral, the library, the Courtyard, and a river of people going the opposite way, carrying paper flags and cups of cocoa toward the stand where the choir is already shivering in rows. By the Statue of the Warden's Father, where the crowd thins, a folding chair has been set up in the lee of the enormous outstretched stone hand, as though it were an umbrella. A man sits in it, in a good coat, with a thermos at his feet and his hat on his knee, watching the district be happy with an expression you can only call professional grief.\n\nHe sees you coming a long way off. He does not get up. He only unscrews the thermos lid, and pours a second cup.`,
      onEnter: [{ set: "finale_route", val: "voss" }],
      interjections: [
        { skill: "archive", min: 3, text: `Actually, the surname is not so rare. Voss: "fox", in the old dialect. It is also the surname of Aurel Voss, the Warden's Father, whose hollow plinth you are standing beside. The Inspector will tell you, when asked, "No relation." He will say it a fraction faster than a man who is certain.` },
        { skill: "the_grey", min: 3, text: `He is sitting in the lee of the stone hand, where I have kept the rain off a great many people. I did not think a man who runs the Bell would ever pick my side of the statue.` }
      ],
      choices: [
        { text: "Sit down beside him.", goto: "voss_open_turned", cond: "flag.voss_turned" },
        { text: "Sit down beside him.", goto: "voss_open_ally", cond: "flag.voss_ally && !flag.voss_turned && !flag.voss_exposed" },
        { text: "Sit down beside him.", goto: "voss_open_exposed", cond: "flag.voss_exposed && !flag.voss_turned" },
        { text: "Sit down beside him.", goto: "voss_open_cold", cond: "!flag.voss_turned && !flag.voss_ally && !flag.voss_exposed" },
        { text: "Turn around. Not yet.", goto: "hub" }
      ]
    },
    voss_arrive: {
      speaker: "narrator",
      text: `The Inspector pours a second cup into the lid of the thermos and holds it out, without asking whether you want it, with the unforced courtesy of a man who has done a great many hard things to a great many people and has never once let a guest go without tea.`,
      choices: [
        { text: "Take the cup.", goto: "voss_open_turned", cond: "flag.voss_turned" },
        { text: "Take the cup.", goto: "voss_open_ally", cond: "flag.voss_ally && !flag.voss_turned && !flag.voss_exposed" },
        { text: "Take the cup.", goto: "voss_open_exposed", cond: "flag.voss_exposed && !flag.voss_turned" },
        { text: "Take the cup.", goto: "voss_open_cold", cond: "!flag.voss_turned && !flag.voss_ally && !flag.voss_exposed" }
      ]
    },
    voss_open_cold: {
      speaker: "voss",
      voices: 3,
      text: `"{name} Voran." He says it as one says the name of a dish one has been looking forward to. "Static-resistant. Persistent tinnitus. A nice hand with a note, and a nicer one with a lie. You have had a busy three days, and I have followed them with the sort of attention a father gives a child's first examinations." He sips. "I won't pretend there isn't a file. I don't think much of the file. It makes you sound like a conspiracy. In person you are far more like a student who has left their umbrella on a tram."\n\nHe smiles. It is a good smile, and it is clearly tired of being one. "Please. Ask me anything. In the Ministry's experience, nothing disarms like an answered question."`,
      interjections: [
        { skill: "instinct", min: 3, text: `He is not lying. That is the problem. He is simply choosing, with enormous grace, which true things to say first.` },
        { skill: "doublethink", min: 3, text: `A father, friend. A father, with tea. It is such a restful thing to be looked at kindly by someone who has your file. You could put your head on his shoulder. Honestly.` },
        { skill: "composure", min: 3, text: `Take the cup. Do not drink it. Hold it with both hands as though it were warm and you were cold and the two things were unconnected.` }
      ],
      choices: [{ text: "Listen.", goto: "voss_hub" }]
    },
    voss_open_ally: {
      speaker: "voss",
      voices: 3,
      text: `He holds out the cup with both hands, like a communion. "I won't ask you to trust me. We are past that. I will only ask you to listen to a man who has been honest this week, which is not a habit of mine and has been exhausting." He leans back in the little chair and the chair complains. "There is a car at the bottom of the stairs, and three men in grey coats who work for people who do not know my name. They would prefer that I bring you in at the cue. I would prefer a number of other things."\n\nHe looks at the tower, the roofs, the little ruled lines of the Avenue. "Ask. I'll answer. I've found, lately, that I'm good at answering."`,
      interjections: [
        { skill: "empathy", min: 3, text: `He means it. He is a man standing at the edge of a decision with his coat buttoned wrong. It is the most honest thing about him: the buttons.` },
        { skill: "charm", min: 4, text: `He likes you. You like him. Neither of you has found a polite way to say how dangerous that is.` }
      ],
      choices: [{ text: "Listen.", goto: "voss_hub" }]
    },
    voss_open_exposed: {
      speaker: "voss",
      voices: 3,
      text: `The Inspector's hat is on his knee and the thermos is unopened at his feet. He does not look up when you arrive. "I am, as of about six this evening, a man whose letters of reference have been revised." His voice is as dry as chalk. "The men in the grey coats have been very civil. They have suggested a quiet retirement after the Jubilee. In the Ministry, retire is a transitive verb."\n\nA small ruined smile. "I would like to be told what I am by the person who found out. You may go first. I would very much like it to be somebody who isn't paid."`,
      interjections: [
        { skill: "empathy", min: 3, text: `You took the coat off him in public with a page and a sentence. He is not angry. It is the loneliness that you would not be able to look at, if you let yourself look.` },
        { skill: "dialectics", min: 3, text: `An exposed officer is a thing the system has not got a procedure for. He has twenty minutes in which he is not yet disposed of. That is a window, not a kindness.` }
      ],
      choices: [{ text: "Tell him.", goto: "voss_hub" }]
    },
    voss_open_turned: {
      speaker: "voss",
      voices: 3,
      text: `The Inspector has taken his hat off. It sits on his knee like a sleeping pet. "I have decided to be useful," he says, "which I am told is the first sign of a conversion and the last sign of a career." He stirs the tea with a finger, which is not a thing he would ever have done a week ago. "I have one hour, one coat, and a very large number of forms with my name at the bottom. Tell me what you need."\n\nHe looks up at the array, black against a dying sky. "I would like to be told it will work. I don't expect to be. I would like, though, to be asked."`,
      interjections: [
        { skill: "empathy", min: 3, text: `He has crossed over, and it hasn't made him lighter. It has made him exact. A man who has been carrying a thing for eleven years and has finally been given somewhere to put it down.` },
        { skill: "solidarity", min: 3, text: `Welcome. We do not have badges. We have chairs, and there is always a spare one, and it is usually the one with the short leg.` }
      ],
      choices: [{ text: "Ask him what he can do.", goto: "voss_t_hub" }]
    },

    voss_hub: {
      speaker: "voss",
      voices: 3,
      text: `The Inspector refills the lid. A long way off, the noise of a district being happy goes on like the sea heard through a wall. "Well," he says. "We have perhaps forty minutes. I propose we spend them as intelligent people do: arguing about a question that has already been decided."`,
      interjections: [
        { skill: "instinct", min: 3, repeat: true, text: `He is afraid of your next sentence. Not for himself: for it. As if it were a bird that might fly into the glass.` },
        { skill: "archive", min: 3, repeat: true, text: `Actually, he has not yet mentioned the cue. He has not once looked at his watch. A man who does not look at his watch is a man who has already decided what time it is.` },
        { skill: "volition", min: 4, repeat: true, text: `Whatever you want from this man, do not mistake the pleasantness for time. Every sentence you spend here comes out of the same hour you need elsewhere.` }
      ],
      choices: [
        { text: "\"What exactly are you, Inspector?\"", goto: "voss_job" },
        { text: "\"What happens at the cue?\"", goto: "voss_harmony" },
        { text: "\"Tell me about your daughter.\"", goto: "voss_daughter", cond: "flag.voss_job_asked" },
        { text: "\"Tell me about the Vanguard Homes.\"", goto: "voss_rhea", cond: "flag.voss_daughter_asked" },
        { text: "Show him what you are carrying.", goto: "voss_evidence", cond: "has('ledger') || has('relay_log')" },
        { text: "Try to change his mind.", goto: "voss_turn", cond: "!flag.voss_turned" },
        { text: "\"What would you offer me, if I stopped?\"", goto: "voss_offer", cond: "!flag.voss_turned" },
        { text: "Try to get past him by force.", goto: "voss_force", cond: "!flag.voss_turned && !flag.voss_ko" },
        { text: "Excuse yourself.", goto: "voss_leave" }
      ]
    },
    voss_job: {
      speaker: "voss",
      voices: 3,
      text: `He considers the question for a while, with the air of a man being asked, for the first time in years, to describe his own front door.\n\n"I am an Inspector of the State Inspectorate, which is a coat. Under the coat I am what the Ministry of Quiet Hours calls a Quiet Officer. My job is that nothing should have happened. Not that nothing should happen: that is the Vanguard's department, and they are bad at it. Mine is that nothing should have happened. The difference is the whole of the profession." He rolls the lid between his palms. "I run the Static in District 9. Every night at nine, I am the reason the Bell rings. I have done it for eleven years. I was, I think, rather good."\n\n"I was a reasonable young man. That's what nobody tells you. It is always reasonable young men."`,
      onEnter: [{ set: "voss_job_asked", val: true }, { xp: 2 }],
      interjections: [
        { skill: "archive", min: 3, text: `Ministry of Quiet Hours: established by Chancellery decree in the Year of Steady Hands; budget line "Hygiene"; staff complement unpublished; slogan, printed inside every officer's cap: NOTHING HAPPENED HERE. It is, as slogans go, extraordinarily honest.` },
        { skill: "empathy", min: 4, text: `He says "reasonable" the way you touch a bruise to see whether it still hurts.` },
        { skill: "dialectics", min: 3, text: `Premise: the job is that nothing should have happened. Premise: the officer remembers the job. Therefore the officer is the only person in the district for whom something has always happened. Ask him how that works.` }
      ],
      choices: [{ text: "Go back to the question.", goto: "voss_hub" }]
    },
    voss_harmony: {
      speaker: "voss",
      voices: 3,
      text: `"At the cue, the Grand Harmony begins. It is the Bell, but longer, and richer in the second note. It lasts four minutes. When it ends, everyone in District 9 will have mislaid the last three days: the Commissar, the Undercurrent, the school, you." He is perfectly matter-of-fact. "It is not erasure. I want you to understand that. It is like a drawer in a very old chest being closed. Some of what is in it will come back as dreams. The Chancellery calls this residual comfort."\n\n"In the capital there is to be an audit of the Ministries, in the autumn. A district that remembers is a district that can testify. District 9 has had a Commissar on a hoop, a Ledger, and a boiler room with chairs in it. The Chancellery would like none of it to be anywhere when the auditors arrive." He sips. "Nobody is hurt. Nobody has ever been hurt by a Harmony. They have a lighter bag, that's all."`,
      onEnter: [{ xp: 2 }, { thought: "th_grand_harmony" }],
      interjections: [
        { skill: "dialectics", min: 3, text: `"Nobody is hurt." Define hurt. If hurt is a felt thing, you are correct: the forgotten do not feel it. If hurt is the taking of a thing from a person without leave, you have just described a robbery and called it a cloakroom.` },
        { skill: "the_grey", min: 3, text: `I know whose bag it is. The mother who does not remember the clinic. The man who cannot place the knock at the door. Light? They are staggering. They are staggering and they think they are tired.` },
        { skill: "empathy", min: 4, text: `He believes it. That is not the terrible part. The terrible part is that he has a gift for believing things that are not entirely false.` }
      ],
      choices: [{ text: "Go back to the question.", goto: "voss_hub" }]
    },
    voss_daughter: {
      speaker: "voss",
      voices: 3,
      text: `He does not answer at once. He puts down the lid and takes from the inside of his good coat a wallet, soft as a glove, and from behind its lining a photograph the size of a stamp. A little girl of about five on a swing, caught at the top of the arc, mouth wide open, one front tooth missing. On the back, in blue ink, in a hand you recognise as his, one word: LINNET.\n\n"I found it eight years ago, the week they gave me the coat. Behind the lining. I do not remember writing the name. I do not remember the swing, or the tooth, or any child. I have looked at it every night for eight years and I feel what you feel looking at a stranger's photograph at a station: an enormous, kindly curiosity." He turns it over, to the word. "Either I had a daughter and I was Harmonised, for hygiene, so that I should be a better officer. Or I had a daughter and she was Harmonised, so that she should be a better citizen, and she has been walking round a district I run for I do not know how long without knowing me. I have never been able to decide which is worse. I have a good brain for most things."`,
      onEnter: [{ set: "voss_daughter_asked", val: true }, { xp: 3 }, { thought: "th_borrowed_memory" }],
      interjections: [
        { skill: "empathy", min: 3, text: `Eight years of looking at a stranger on a swing. It is the most loving act you have ever witnessed, and he does not know it is love. He thinks it is a hobby.` },
        { skill: "archive", min: 4, text: `File H. VOSS: Dependants: see Annex [REDACTED]. A redaction is the only honest document in the whole file. It admits that there was something.` },
        { skill: "senses", min: 4, text: `A faint pencilled mark on the swing's chain, hardly a smudge: a corner of a gate. A painted letter on the gate, V-something, almost gone.` }
      ],
      choices: [
        { text: "\"Do you want to find her?\"", goto: "voss_daughter2" },
        { text: "Say nothing. Let him put the photograph away.", goto: "voss_hub" }
      ]
    },
    voss_daughter2: {
      speaker: "voss",
      text: `"I think," says Hale Voss, "I am afraid that I already have."\n\nHe does not say anything else. He folds the photograph into the wallet and the wallet into the coat. He looks down at the Courtyard, where, very small, very straight, in the red-brown of the Youth Vanguard, a girl with slicked hair is checking the cuffs of a cadet three times her size. It is only for a moment. Then he looks at the thermos.\n\n"I'll tell you the thing about being Static-wiped, {name}. It doesn't take the facts. It takes the weight of them. I have all the facts. I just can't lift any of them."`,
      interjections: [
        { skill: "deduction", min: 3, text: `It had been established, by a small gap in a front tooth, a half-smile, and the rate at which a certain man looked away from a certain cadet, that an inference lay on the table. I deduced it. I wish, now, that I had not. Please do not say it aloud.` },
        { skill: "volition", min: 4, text: `You have been given something very delicate. Do not drop it. Do not use it as a lever unless you have first decided you can live with having used it.` }
      ],
      choices: [{ text: "Leave it there.", goto: "voss_hub" }]
    },
    voss_rhea: {
      speaker: "voss",
      voices: 3,
      text: `"Don't." He holds up one hand. "Whatever you are about to say. Please. If you say it I shall have to know you have thought it, and I have spent eight years carefully not thinking it." A breath. "The Vanguard Homes. The Hunger Winter intake, children of seven, eight, nine, parents unrecorded. They were Harmonised nightly for eleven years: Pedagogic Harmony, the heavy dose. I signed the schedule on two of those years myself, without reading it. Rhea Vantage's file has a blank where a father should be. So does mine, under 'dependants'. A blank is not evidence. It is only a house style."\n\nHe stares at the Courtyard. "She smiles with half her mouth. I noticed it the first day I saw her, and then I noticed that I had noticed, and I went and sat in my car for twenty minutes."\n\n"I will not tell her. If I am right, she would have to forgive a stranger for the offence of being her father. If I am wrong, she would have to forgive me for hoping. I do not think a person can be asked to do either."`,
      onEnter: [{ set: "voss_rhea_hint", val: true }, { xp: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `He is not asking for permission. He is asking for you not to take it away. It is not the same. You can hear the difference in the pause.` },
        { skill: "doublethink", min: 3, text: `Isn't it lovely? A father who may not be one, a daughter who may not be anyone's, and a Ministry that signs for the blanks. Everything has been so tidily arranged. You could cry. You may. It is also on the schedule.` }
      ],
      choices: [
        { text: "\"I won't say it.\"", goto: "voss_hub" },
        { text: "\"She has a right to know.\"", goto: "voss_rhea2" }
      ]
    },
    voss_rhea2: {
      speaker: "voss",
      text: `"Perhaps." It is very quiet. "Perhaps she has. After. If there is an after, and if I am still a man whom someone could be told about." He closes his eyes. "If you decide to, I would ask one thing. Do not tell her I am her father. Tell her there is a photograph. Let her decide whether it has anything to do with her."\n\nHe does not ask you to promise. He is not that sort of fool. He only picks up the thermos and finds that it is empty and holds it anyway, for something to hold.`,
      onEnter: [{ set: "voss_rhea_may_be_told", val: true }, { xp: 1 }],
      choices: [{ text: "Nod.", goto: "voss_hub" }]
    },
    voss_evidence: {
      speaker: "voss",
      text: `He looks at what you are carrying the way one looks at a very small, very dangerous dog. "Ah," says Hale Voss. "The famous reading matter. I must say, I never expected to see it in daylight." His eyes do not leave it. "Whatever you do with it, I must advise you that I am required to have it. And whatever I am required to do, I should like to be allowed to read it first."`,
      interjections: [
        { skill: "instinct", min: 3, text: `He wants it. He wants it the way a man wants to learn the ending of a story he has been in for years. This is the one moment he might do something quite out of character.` }
      ],
      choices: [
        { text: "Open the relay logbook to the pages headed SPECIAL APPLICATIONS. Hand it over.", goto: "voss_show_log", cond: "has('relay_log')" },
        { text: "Hand it over. All of it. In return for terms.", goto: "voss_offer" },
        { text: "Keep it in your pocket. Say nothing.", goto: "voss_hub" }
      ]
    },
    voss_show_log: {
      speaker: "voss",
      voices: 3,
      text: `He takes the logbook in both hands, like a hymnal, and turns without being told to the stitched section near the back that no one reads. A column of dates. A column of initials. A column headed REASON. He reads for a long time, and the long time is a thing you can see, like weather crossing a field.\n\n"SPECIAL APPLICATION. Subject: VOSS, H., Q.O. Reason: dependant interference. Operator: T. Wend." His finger follows the dates. "Eleven. One a spring, each year since I was given the coat." The finger stops at a date. "The sixth of April." His voice is almost conversational. "That is her birthday. I know that. I know that, don't I. Where do I know that from?"\n\nHe closes the book very gently, as one closes the door of a room in which someone is asleep.`,
      onEnter: [{ add: "voss_turn_pts", n: 2 }, { set: "voss_saw_log", val: true }, { xp: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `He has just read the date of his own forgetting, in a stranger's handwriting, in a column, in ink, in a book. There is no cruelty greater and no gentler way of delivering it.` },
        { skill: "archive", min: 4, text: `Eleven applications, April sixth, annually. The Ministry did not even trouble to disguise the schedule. Why bother? The only person who might have noticed was the one it was done to.` }
      ],
      choices: [{ text: "Wait, quietly.", goto: "voss_hub" }]
    },

    voss_turn: {
      speaker: "narrator",
      voices: 2,
      text: `You decide to change the mind of a man whose profession is the changing of minds. It is a little like trying to out-sing a choir by humming, and a little like trying to teach a locksmith about doors. But he has put the cup down. He is listening, which is the first, narrowest door.\n\nWhat do you say?`,
      interjections: [
        { skill: "volition", min: 3, repeat: true, text: `Choose the argument that you believe. You will not out-lie him. You can only out-mean him.` }
      ],
      choices: [
        { text: "\"You sell forgetting as mercy. Mercy needs consent. Nobody asked a single person in this district.\"", check: { skill: "dialectics", diff: 12, id: "finale_hub_voss_turn_dial", white: true, pass: "voss_turn_dial", fail: "voss_turn_fail" } },
        { text: "Quote the Charter of Quiet Hours at him. Article 3(a): suspension pending review.", check: { skill: "archive", diff: 12, id: "finale_hub_voss_turn_arch", white: true, pass: "voss_turn_arch", fail: "voss_turn_fail" } },
        { text: "\"Linnet. Say her name out loud, just once, to somebody who is listening.\"", cond: "flag.voss_daughter_asked", check: { skill: "empathy", diff: 12, id: "finale_hub_voss_turn_emp", pass: "voss_turn_emp", fail: "voss_turn_fail_hard" } },
        { text: "\"They did it to you too, Inspector. You are one of us. You have always been in the same queue.\"", check: { skill: "solidarity", diff: 12, id: "finale_hub_voss_turn_sol", white: true, pass: "voss_turn_sol", fail: "voss_turn_fail" } },
        { text: "Stand up and make the speech you have been rehearsing since Tuesday.", check: { skill: "rhetoric", diff: 13, id: "finale_hub_voss_turn_rhet", white: true, pass: "voss_turn_rhet", fail: "voss_turn_fail" } },
        { text: "Ask him the question.", goto: "voss_turn_final", cond: "((flag.voss_turn_pts || 0) + (flag.voss_ally ? 1 : 0) + (flag.voss_exposed ? 1 : 0)) >= 3" },
        { text: "Let it rest.", goto: "voss_hub" }
      ]
    },
    voss_turn_dial: {
      speaker: "dialectics",
      text: `Consent. You lay it on the grass between you like a spirit-level, and the bubble does not sit in the middle. He sees it. A debate-club ghost has, for the first time in its death, found an audience that can follow. "Mercy is a gift," you say. "A gift that is administered without the recipient's knowledge is not a gift. It is a theft with a bow on." "Not a theft," says Voss, automatically; and stops; and hears himself.\n\n"I have been saying 'not a theft' for eleven years," he says, slowly. "I do not remember ever being asked to define theft." He rubs his eyes. "That is a very irritating thing to have done to a man at a party."`,
      onEnter: [{ add: "voss_turn_pts", n: 1 }, { xp: 2 }],
      choices: [{ text: "Press on.", goto: "voss_turn" }]
    },
    voss_turn_arch: {
      speaker: "archive",
      text: `Actually, Article 3(a) of the Charter of Quiet Hours, as ratified, reads: "Where an officer is shown credible evidence of a breach of the Charter by his own Ministry, he shall suspend operations in the district pending review." It is on page nine. It is in the small print. It was written by a clerk in a good mood in the Year of Steady Hands, who believed that nobody would ever, ever read page nine.\n\nVoss reads page nine. He reads it twice. He puts the page down very gently, like a man putting down a baby bird.\n\n"I have a form for that," he says. "I have always had a form for that. I have never once, in eleven years, thought to ask what it was for."`,
      onEnter: [{ add: "voss_turn_pts", n: 1 }, { xp: 2 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `It is only a technicality, friend. Pay it no mind. Nobody has ever been moved by a technicality. (Oh, but you do enjoy a technicality, don't you? So does he.)` }
      ],
      choices: [{ text: "Press on.", goto: "voss_turn" }]
    },
    voss_turn_emp: {
      speaker: "empathy",
      voices: 3,
      text: `You say it softly, as you would say it to a sleeping person you did not want to startle. "Linnet."\n\nIt works the way a key works in the wrong lock that happens to be the right one. Hale Voss does not speak. His hand goes to the breast of his good coat, where the wallet is, and stays there. His face does something it has not done in eleven years: it forgets to be arranged. For a long while he is only a man on a folding chair with the evening on his shoulders. "Say it again," he says. "Please. I'd like to hear it from outside my own head."\n\nYou say it again. He weeps without noise, with great dignity, like a man who has been told it is permitted.`,
      onEnter: [{ add: "voss_turn_pts", n: 2 }, { xp: 4 }, { morale: 1 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `We hold him. We have held the others. We know how, and we are good at it, and we have never once been paid.` },
        { skill: "the_grey", min: 3, text: `I will not say a word. I am the stone beside the chair. A stone is a thing a man can weep beside without being observed.` }
      ],
      choices: [{ text: "Wait with him.", goto: "voss_turn" }]
    },
    voss_turn_sol: {
      speaker: "solidarity",
      text: `We say it for you, with your mouth. "They did it to you too. You were in the queue. You were in the same queue as the woman at the clinic and the grandmother at the gate. You stood in the same long line, and when they reached you, they did not ask your name either."\n\nHe is very still. "I am an officer," he says, finally, with no force. "I am on the other side of the glass."\n\n"Glass is what a person calls a wall when he has been told he is on the good side of it," says the murmur. And then, so gently it is hardly argument: "There is a chair. It has a short leg. It is always the one we give the new ones."\n\nHe laughs, once, shortly, at the chair.`,
      onEnter: [{ add: "voss_turn_pts", n: 1 }, { xp: 2 }],
      choices: [{ text: "Press on.", goto: "voss_turn" }]
    },
    voss_turn_rhet: {
      speaker: "rhetoric",
      text: `You stand. The podium is a folding chair and the audience is a man with a thermos, but you have been waiting three days for a room to say this in, and in this room, with the Warden's own horns at your back, it comes out clean. You tell him what the Jubilee is for. You tell him what a country is, if it can only be kept by being forgotten. You tell him that no regime that needs the last three days gone can have been anything but afraid of them. You tell it with the pauses in all the right places, and nobody applauds, and it is the best you have ever done.\n\nVoss, who has heard a thousand speeches and given a hundred, lowers his eyes. "That," he says, "was very good. Where did you learn to do that?"\n\n"From you," you say. "From the Warden. From everyone who ever made us stand still to be talked at."`,
      onEnter: [{ add: "voss_turn_pts", n: 1 }, { xp: 2 }],
      choices: [{ text: "Press on.", goto: "voss_turn" }]
    },
    voss_turn_fail: {
      speaker: "voss",
      text: `"That was a very good argument," says Hale Voss kindly. "It will sound even better in a seminar." He smiles. It is the same smile; it has simply gone back inside the coat. "I have heard every one of them, {name}. I used to make them myself. They are good arguments, and they work on people who have not yet signed anything."\n\nHe pours more tea. His hand is perfectly steady. It is steadier than before.`,
      onEnter: [{ surv: 5 }],
      choices: [{ text: "Try another way.", goto: "voss_turn" }]
    },
    voss_turn_fail_hard: {
      speaker: "voss",
      text: `He looks at you for a long time. When he speaks it is without anger, with a terrible exactness: "That was not yours to say."\n\nHe stands. He puts the hat on. He picks up the thermos and the chair and folds the chair with one practised flick, as one folds a flag. "I'm going to excuse myself for a few minutes. I would like to be a man who did not hear that. I will manage it, I think, by doing my job."\n\nIt is a very small cruelty, and it is yours. He does not go far. But something has closed in him that you will not be able to open again tonight.`,
      onEnter: [{ surv: 8 }, { set: "voss_hard", val: true }, { morale: -2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `I'm sorry. I'm so sorry. You reached for the wrong door in the dark and it was the one with the lamp in it.` }
      ],
      choices: [{ text: "Let him go.", goto: "voss_leave" }]
    },
    voss_turn_final: {
      speaker: "voss",
      voices: 3,
      text: `He puts the thermos down on the boards beside the chair. Not as one puts down a thing one means to pick up again.\n\n"If you ask me whether I'll help you," says Hale Voss, "I should like you to understand what you are asking. There are three men on the stair with orders in their pockets that were not written by me. There is a Captain in the Relay who believes I am a loyal man. There is an entire Ministry whose idea of a retirement party is a van. If I help you, there is no coat afterwards. There is no pension. There is, for all I know, no daughter either way." He looks at you, and for once it is perfectly plain, a tired man's face, without a single reserve. "Go on. Ask. I would very much like to have been asked."`,
      interjections: [
        { skill: "volition", min: 3, text: `Say it properly. Do not ask for the thing you need. Ask for the thing he is.` },
        { skill: "charm", min: 4, text: `This is the moment where a smile would be a cheat. Don't use it. Let him see your face as it is.` }
      ],
      choices: [
        { text: "\"Help us. Not as the Ministry. As a person.\"", goto: "voss_turned_scene" }
      ]
    },
    voss_turned_scene: {
      speaker: "voss",
      voices: 3,
      text: `"Yes," says Hale Voss.\n\nIt is such a small word that for a moment neither of you recognises it. He stands. He takes off the hat, looks into it as if it contained a speech, and puts it back on at a very slightly different angle. "I shall need to make some telephone calls that will end my career. And one that will begin something I do not have a name for." He holds out his hand, and when you take it his grip is dry and firm and a little too long. "I was a reasonable young man, once. I find I should like to be an unreasonable old one."\n\nHe looks, for one moment, like a person in a photograph on a swing. Then he sits again, opens the thermos, and says, to the roofs, to the sky, to the long grey slopes of a district that has never been asked: "Right. Where is the stair?"`,
      onEnter: [{ set: "voss_turned", val: true }, { set: "finale_voss_turned_now", val: true }, { surv: -10 }, { xp: 5 }, { morale: 3 }, { thought: "th_double_agent" }],
      interjections: [
        { skill: "solidarity", min: 3, text: `One more chair. We have run out of short-legged ones. We will manage.` },
        { skill: "doublethink", min: 3, text: `Oh, no, friend. Not the Inspector. Not my Inspector. He was the kindest voice in the whole building. Very well. We shall go on being kind. We have never needed an Inspector for that.` }
      ],
      choices: [{ text: "Ask what he can do.", goto: "voss_t_hub" }]
    },

    voss_t_hub: {
      speaker: "voss",
      voices: 3,
      text: `"Three things I can do," says Voss, counting on his gloved fingers, "and every one of them is a form with my name at the bottom. I can delay the cue by six minutes by telling the Relay that the Chancellery's delegation is stuck at the bridge. I can send the Vanguard cadets to the wrong end of the Avenue on a security alert I shall invent on the spot. And I can walk into Relay No. 4 in my good coat and tell Captain Brune that I am personally assuming command of the line, which he will believe, because I have never, in eleven years, been anything but exact."\n\nHe finishes the tea. "I would do all three. I should like it noted that I am very frightened."`,
      onEnter: [{ set: "finale_voss_delay", val: true }, { set: "finale_voss_stairs", val: true }, { set: "finale_voss_relay", val: true }, { xp: 1 }],
      interjections: [
        { skill: "authority", min: 3, text: `THREE ORDERS, ONE VOICE. YES. THIS IS HOW A MAN WITH A COAT IS SUPPOSED TO BE USED.` },
        { skill: "empathy", min: 4, text: `He says "I am very frightened" the way another man would say "I am very tall." It is simply a feature of the day.` }
      ],
      choices: [
        { text: "\"Stay with me, at the cue.\"", goto: "voss_t_stay" },
        { text: "\"The photograph. You'll let me do something about that, after.\"", goto: "voss_t_daughter", cond: "flag.voss_daughter_asked" },
        { text: "\"Go. Make the calls.\"", goto: "voss_leave" }
      ]
    },
    voss_t_stay: {
      speaker: "voss",
      text: `"Of course." He folds the chair and sets it down again, closer. "I have always found, at a cue, that it helps to have somebody beside one who is not paid to be." He unscrews the thermos, finds it empty, and holds it out to you with a grave, comic dignity. "I'm afraid I've drunk it all. It is a good habit in an officer. One should never leave a cup for the enemy."\n\nHe settles back. Down in the Courtyard, a choir is lifting its collective breath. "Whatever it is," he says, "I should like to see it begin. I think I have been waiting for something to begin for a long time."`,
      onEnter: [{ set: "voss_with_you", val: true }, { morale: 2 }],
      choices: [{ text: "Go on.", goto: "voss_leave" }]
    },
    voss_t_daughter: {
      speaker: "voss",
      voices: 2,
      text: `He takes out the photograph again and lays it on his knee, face up, in the last of the light. "If we should come out of this," he says, "and if there is, afterwards, a girl in a Vanguard uniform who has just learned a good deal about the Hunger Winter, I would like it very much if somebody told her there is a swing in a photograph. And that it is not a trick." He turns the picture over to the word. "I will not ask more than that. I am an inspector. I know exactly how much one is entitled to ask."\n\nA pause. "Her birthday is the sixth of April. I am not certain where I know it from. I have decided I do not need to be."`,
      onEnter: [{ set: "voss_rhea_may_be_told", val: true }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `I do not know whether he is her father. I do not know whether it matters. A photograph is a thing that has been kept for someone. Whoever that someone was, he has kept it eight years, which is its own sort of paternity.` }
      ],
      choices: [{ text: "Promise nothing. Nod.", goto: "voss_t_hub" }]
    },

    voss_offer: {
      speaker: "voss",
      voices: 3,
      text: `"Very well." He straightens his coat. It is as if a different man has sat up in the same body, the one with the card in his pocket. "Here is what I can say, and I would not say it to anyone else. Come in. Not as a prisoner: as a trainee Quiet Officer. You have the ear, which is how the Ministry recruits: the ones who do not take it. You see things. You would be wonderful. The cell in the boiler room is not pursued. The Ledger is received, and read, and filed. The Commissar was an unstable man. Your name is cleaned, your file is cleaned, and in six weeks you wear the coat."\n\nHe leans forward. "And you would remember. Always. Every night, every Harmony, every hour that was taken. You would be the one who knows. You could be a very different kind of officer from me. Better. Do you see? It is the one place in the Union where you could always, always remember."`,
      interjections: [
        { skill: "doublethink", min: 3, text: `It is a wonderful offer. It is a splendid offer. Observe how he has left out every unpleasant noun. You would be IN. The wall is WARM. And you would still remember: what a lovely compromise.` },
        { skill: "solidarity", min: 3, text: `We would not be there. We would be down in the chairs, with the short leg, and you would be in the car. Remember that the one who remembers is the one who is not in the room.` },
        { skill: "empathy", min: 4, text: `He wants a friend. That is the truest line in the offer. He is so tired of being the only person who knows.` }
      ],
      choices: [
        { text: "\"Yes. I will come in.\"", goto: "voss_join" },
        { text: "\"Yes. And I will bring the cell's safety with me, in writing.\"", check: { skill: "rhetoric", diff: 12, id: "finale_hub_voss_terms", white: true, pass: "voss_join_terms", fail: "voss_join" } },
        { text: "\"Yes.\" (Mean the opposite. Say it in the State's own voice.)", cond: "flag.anka_ready || flag.cell_active || flag.ledger_with_anka", check: { skill: "doublethink", diff: 13, id: "finale_hub_voss_agent", pass: "voss_join_agent", fail: "voss_join_suspect" } },
        { text: "\"No.\"", goto: "voss_hub" }
      ]
    },
    voss_join: {
      speaker: "narrator",
      voices: 3,
      text: `You say yes. It comes out of your mouth easily, like the Eleven Thanks, and Voss's whole face lights, a lamp finding a wall. "Good," he says. "Good. I was so afraid you wouldn't." He takes from inside the good coat a small card in grey board with a gold edge, a stamp, and a space for a signature. INSPECTORATE, QUIET HOURS DIVISION. TRAINEE. "Sign here, and here. You'll have a coat by the end of the month. They are very warm. They have lining."\n\nThe pen is heavy. The pen has been used a great many times. It is a very good pen.`,
      interjections: [
        { skill: "doublethink", min: 3, text: `It's so warm. Look at it. Look at how many people have signed with that pen and look at how well-fed they look. You belong. You were always going to belong. It is only a matter of lining.` },
        { skill: "volition", min: 4, text: `You can still put the pen down. You will not be able to in about forty seconds. This is the last place where you are somebody who could.` },
        { skill: "the_grey", min: 3, text: `I do not stop you. I am only a building. I have held many people who signed. I will hold you too, though I will not tell you what I think of the pen.` }
      ],
      choices: [
        { text: "Sign.", goto: "voss_join_end" },
        { text: "Put the pen down. Not yet.", goto: "voss_hub" }
      ]
    },
    voss_join_terms: {
      speaker: "narrator",
      voices: 3,
      text: `"In writing," says Voss. For a moment he looks as if you have asked for the moon. Then something crosses his face that is almost relief: the relief of a man who is, after all, being asked to do paperwork, which is the one honest thing he knows. He takes out the pen, a sheet of the Inspectorate's thick grey paper, and writes, in a tidy hand, under the Ministry's crest, a short, exact, legally unbreakable paragraph. The cell in the boiler room is, by order of the Inspectorate, to be regarded as a school society of the third rank. Its members are not to be pursued. Its premises are not to be raided. It is, in the language of the Ministry, "of no operational interest." He signs it, and he holds it out, and you see that his hand is shaking.\n\n"I have just forged my own superior's authority," he says, almost cheerfully. "It is the nicest thing I have ever done with a pen."`,
      onEnter: [{ set: "finale_voss_terms", val: true }, { xp: 3 }],
      choices: [{ text: "Fold the paper. Take the pen.", goto: "voss_join_end" }]
    },
    voss_join_agent: {
      speaker: "narrator",
      voices: 3,
      text: `You say yes in the voice the State gave you, warm, reasonable, helpful, with a small, carefully rehearsed catch in the throat where the temptation goes. You say it so well that you are not sure, for a moment, which of you is speaking. Voss looks at you with the face of a man who has been very lonely a very long time and has just been told he need not be. "Good," he says. "Good. I was so afraid you wouldn't."\n\nHe takes the grey card and the pen. He is smiling the way people smile on trains, going home. You sign. You do not think about the boiler room. You think instead, extremely carefully, about nothing at all. A second voice, far down, says: you may never be able to stop being what you are pretending.\n\nIt is a very good pen.`,
      onEnter: [{ set: "finale_double_agent", val: true }, { xp: 3 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Of course you mean it, friend. How could you be pretending to mean it? There's no gap. There's no gap at all. (There is a very small gap. I have put a rug over it.)` },
        { skill: "volition", min: 4, text: `Remember it. Say it to yourself every night. "I am only pretending." One day it will be the only thing that holds the rest of you together.` }
      ],
      choices: [{ text: "Sign.", goto: "voss_join_end" }]
    },
    voss_join_suspect: {
      speaker: "voss",
      text: `He lets you finish. He is smiling, still, and it takes you a moment to see that it is the smile of a man who has recognised a handwriting. "That," says Hale Voss, "was a beautiful performance. I could not have done it better myself. I did it better myself, in fact, in a similar chair, in a different year." He taps the card against his knee. "You are lying, {name}. You are lying with great skill and great love for somebody. I shall take you anyway. It is, as I think you will find, the main qualification."\n\nHe holds out the pen. "I'll know. You'll know that I know. We shall both be very polite about it for the next forty years."`,
      onEnter: [{ set: "finale_voss_knows", val: true }, { surv: 5 }],
      choices: [{ text: "Take the pen.", goto: "voss_join_end" }, { text: "Not like this.", goto: "voss_hub" }]
    },
    voss_join_end: {
      speaker: "narrator",
      text: `Your name goes onto the card in your own hand. It looks very small there, the way your own handwriting always does when you have signed a thing you will have to live inside. Voss blots it, folds it, and slides it into the breast pocket of your coat with a tenderness that is almost paternal. Then he stands, and takes your arm, and for a moment you stand together on the roof of the school, a man in a good coat and a student in a torn uniform, watching a Jubilee neither of you will remember in the way the others do.\n\n"It will be very quiet," he says. "You'll like it. It's the best thing about the work."\n\nBelow, at the cue, the Bell begins.`,
      onEnter: [{ give: "inspector_card" }, { set: "voss_card_signed", val: true }, { ending: "end_wardens_eye" }]
    },

    voss_force: {
      speaker: "narrator",
      voices: 3,
      text: `You do not decide it. Your legs do. Something at the back of you that has been listening to a charming man's voice for ten minutes has had enough of being charmed, and your weight is forward and your shoulder low before the thought arrives. He is a slim man in a good coat sitting in a canvas chair. You are seventeen and you have been living on cabbage and fury. It is not, objectively, a fair fight, in your favour.\n\nHale Voss does not rise. He only looks up, with a kind of tired interest, and takes his hand out of his pocket.`,
      interjections: [
        { skill: "adrenaline", min: 3, text: `YES. GO. NOW. HE IS TWELVE STONE OF TWEED AND THERE IS A STAIR BEHIND HIM AND WE ARE SO TIRED OF POLITE.` },
        { skill: "reflex", min: 3, text: `His hand is going to the pocket. He is not fast. He is early. It is a different thing.` },
        { skill: "instinct", min: 3, text: `A bad idea. A hot, red, stupid, wonderful bad idea. The animal in the corridor has decided this is the only room it knows how to leave by.` }
      ],
      choices: [
        { text: "Hit him with everything you have.", check: { skill: "brawn", diff: 13, id: "finale_hub_voss_force_brawn", pass: "voss_ko", fail: "voss_force_fail" } },
        { text: "Slip past him, low, before his hand comes out.", check: { skill: "reflex", diff: 13, id: "finale_hub_voss_force_reflex", pass: "voss_ko", fail: "voss_force_fail" } },
        { text: "Stop. Sit back down.", goto: "voss_hub" }
      ]
    },
    voss_ko: {
      speaker: "narrator",
      text: `He is lighter than you thought. The chair goes one way and the Inspector another, and the thermos goes off the edge of the roof in a long bright arc, shedding steam like a comet, and lands somewhere far below with the small clear sound of a tin cup on cobbles. Voss lies on the boards with his hat on his chest and his eyes open, winded and quite still, looking up at the sky with a look of the most tender, sorrowful interest.\n\n"Well," he says, without much breath. "That was inelegant." A cough. "I shall tell them you were very brave. I shall not, I think, be able to tell them anything else."\n\nHe does not try to stop you. It is the worst part. He turns his face to the stars, and he does not try.`,
      onEnter: [{ set: "voss_ko", val: true }, { surv: 25 }, { xp: 2 }, { morale: -2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `You hit a man who had put down his cup to listen. It was effective. That is all that will ever be said for it.` },
        { skill: "adrenaline", min: 3, text: `HA. HA. HA. (A flat, small, ashamed silence afterwards, like a dropped plate.)` }
      ],
      choices: [{ text: "Go.", goto: "voss_leave" }]
    },
    voss_force_fail: {
      speaker: "narrator",
      text: `The hand comes out of the pocket holding not a gun but a small silver whistle. It is blown once, thin and high, and at the foot of the stair three pairs of boots turn as one. He has not stood. He has barely moved. The whole thing is over in the time it takes a person to put a pencil behind an ear.\n\n"I am so sorry," says Hale Voss, and he sounds it. "I did try to say I would rather not."\n\nThe men in grey coats arrive on the roof with the unhurried courtesy of men who have never, in their lives, had to run. One of them is carrying a form.`,
      onEnter: [{ surv: 30 }, { hp: -2 }],
      choices: [{ text: "Hold out your wrists.", goto: "fail_caught" }]
    },
    voss_leave: {
      speaker: "narrator",
      text: `You rise. The Inspector rises with you, as a gentleman does, and brushes a leaf from the knee of his trousers, and stands for a moment looking at the Courtyard as if you had both come out to see the weather. "Whatever you are going to do," he says, "I shall not stop you, if I can avoid it. I should like that noted. And I shall not help you, if I can avoid that. I should like that noted also."\n\nHe sits. He opens the thermos. By the time you have turned to go, he has already begun, softly, to hum.`,
      onEnter: [{ add: "wake_pressure", n: 1 }],
      interjections: [
        { skill: "instinct", min: 3, text: `He is humming the Anthem. Slightly flat. He is humming it the way people hum things they have been made to love.` }
      ],
      choices: [{ text: "Go.", goto: "voss_return" }]
    },
    voss_return: {
      speaker: "narrator",
      text: `Time moves on. It does not ask whether you are ready.`,
      choices: [
        { text: "Back to the array.", goto: "wake_hour", cond: "flag.finale_route === 'wake'" },
        { text: "Back to the array.", goto: "bc_read", cond: "flag.finale_route === 'bc'" },
        { text: "On to the Relay.", goto: "sab_after_voss", cond: "flag.finale_route === 'sab'" },
        { text: "On to the tram.", goto: "exo_after_voss", cond: "flag.finale_route === 'exo'" },
        { text: "Onto the dais.", goto: "mar_after_voss", cond: "flag.finale_route === 'mar'" },
        { text: "Back up to the array.", goto: "hub", cond: "flag.finale_route === 'voss'" }
      ]
    },

    // ---------------------------------------------------------------- SHARED: RHEA ON THE STAIR
    rhea_start: {
      speaker: "narrator",
      voices: 3,
      text: `You meet her on the last landing before the roof, where the spiral narrows to a throat and the rope-rail turns black with sixty years of one old man's hand. Behind her, three, four, six cadets in the red-brown of the Vanguard stand on the stairs below in perfect order, each with a baton hung at the hip like a rolled umbrella. One of them has Bronka's jaw. He will not meet your eye.\n\nRhea Vantage stands one step above the rest, with her back to a window that has gone the colour of an old bruise. She is very straight. She has put on a clean armband for the Jubilee. She is, you realise, nervous. She has dressed for it.`,
      onEnter: [{ add: "rhea_pts", n: 0 }],
      interjections: [
        { skill: "empathy", min: 3, text: `The cadet with Bronka's jaw is trying to be six inches taller than he is. He's fifteen. His mother does not know he is on this stair. You cannot decide if that makes it better or worse.`, cond: "flag.bronka_trust" },
        { skill: "instinct", min: 4, text: `The baton is on her left hip. She is right-handed. She has deliberately given herself the further reach. She does not want to use it. She will, if she has to, and then she will sit in a quiet room for a very long time.` }
      ],
      choices: [
        { text: "Look at her.", goto: "rhea_open_ally", cond: "(flag.rhea_ready || flag.rhea_turned)" },
        { text: "Look at her.", goto: "rhea_open_exposed", cond: "!((flag.rhea_ready || flag.rhea_turned)) && flag.rhea_exposed" },
        { text: "Look at her.", goto: "rhea_open_cold", cond: "!((flag.rhea_ready || flag.rhea_turned)) && !flag.rhea_exposed" }
      ]
    },
    rhea_open_cold: {
      speaker: "rhea",
      voices: 3,
      text: `"Student Voran." She says it with a slight bow of the head, like a clerk accepting a parcel. "You are in a restricted area, on the evening of a state occasion, in possession of, I am told, a number of things that are not yours. I have been asked to bring you down." A beat. "I have not been asked to hurt you. I would like us both to remember that. I should hate to have to start."\n\nHer eyes are very bright and very calm. They are also, now that you look, a little red at the rims.`,
      interjections: [
        { skill: "authority", min: 4, text: `SHE IS WINNING THE POSITION. SHE HAS THE STAIR, SHE HAS THE NUMBERS AND SHE HAS THE LIGHT AT HER BACK. TO TAKE ANYTHING FROM HER YOU MUST CHANGE WHAT SHE IS STANDING ON.` },
        { skill: "empathy", min: 3, text: `Red rims. She has not been sleeping. A person who has not slept for three days is a person who can be talked to at exactly one hour of the night, and it is tonight's.` }
      ],
      choices: [{ text: "Talk.", goto: "rhea_hub" }]
    },
    rhea_open_exposed: {
      speaker: "rhea",
      voices: 3,
      text: `"I did it." She says it before you can. Her voice is quite level and her hands are very still. "Everybody knows I did it, don't they. The Lieutenant knows, and the Principal knows, and the Inspector knows. And no one has taken me away." She looks at the cadets behind her, whose eyes are very carefully fixed on the wall. "Do you know what that means? It means I am useful. I'd like you to think about that, student Voran. I would like somebody to have thought about it besides me."\n\nShe takes the baton from her hip, looks at it as if it were a spoon, and puts it back.`,
      interjections: [
        { skill: "empathy", min: 3, text: `She is not threatening you. She is asking you to be the only person who will say that being kept on is not the same as being forgiven.` },
        { skill: "instinct", min: 4, text: `This is the most dangerous she has ever been. A person who has nothing left to hide will do anything: not out of malice. Out of lightness.` }
      ],
      choices: [{ text: "Talk.", goto: "rhea_hub" }]
    },
    rhea_open_ally: {
      speaker: "rhea",
      text: `She looks over her shoulder at the cadets, and then at you, and says, quite quietly, "Sergeant Pell. Take the squad to the foot of the stair. Report that the roof is secure." A pause, in which a very young cadet blinks. "That is an order. I shall be four minutes."\n\nThe boots descend. When they have gone, she lets out a breath she has apparently been holding since Tuesday, and puts one hand flat on the wall, like a person feeling a ship move.\n\n"I haven't slept," says Rhea Vantage. "I keep reading the same line. Tell me what you need."`,
      onEnter: [{ set: "rhea_holds_door", val: true }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She did not need to say it to the cadets as an order. She did it so that the boy with Bronka's jaw would be obeying a command rather than choosing a side. It is the nicest thing she has ever done and she does not know that she did it.` }
      ],
      choices: [{ text: "Tell her.", goto: "rhea_return" }]
    },
    rhea_hub: {
      speaker: "rhea",
      voices: 3,
      text: `"Go on." She waits. "I have four minutes before the cadets decide I am negotiating. Whatever you came up here to say, I would like you to say it quickly and exactly. I find that is the only way I can hear."`,
      interjections: [
        { skill: "volition", min: 3, repeat: true, text: `She is a locked door that has put its own ear to the keyhole. Say the true thing in the plainest words you have.` },
        { skill: "instinct", min: 3, repeat: true, text: `Every minute you spend on the landing is a minute the cadets spend deciding not to come up. It is a lovely kind of time. It is also running.` }
      ],
      choices: [
        { text: "\"You killed Ostrov Dane.\"", goto: "rhea_ostrov" },
        { text: "Show her the page.", goto: "rhea_ledger", cond: "has('ledger') || has('relay_log')" },
        { text: "\"What do you remember, Rhea? From before the Homes?\"", goto: "rhea_origin" },
        { text: "\"There is a photograph. A girl on a swing.\"", goto: "rhea_swing", cond: "flag.voss_rhea_may_be_told" },
        { text: "\"Stand aside. This is not yours to hold.\"", check: { skill: "authority", diff: 13, id: "finale_hub_rhea_aside", white: true, pass: "rhea_aside", fail: "rhea_block" } },
        { text: "\"Ask me to stand aside, Rhea. Then watch yourself not do it.\"", goto: "rhea_turns", cond: "(flag.rhea_pts || 0) >= 3" },
        { text: "Go through her.", goto: "rhea_fight" },
        { text: "Give up. Hold out your wrists.", goto: "fail_caught" },
        { text: "Retreat down the stair.", goto: "hub" }
      ]
    },
    rhea_ostrov: {
      speaker: "rhea",
      voices: 3,
      text: `"Yes." She does not blink. "I would have told you, if you'd asked on Tuesday. Nobody asked on Tuesday." She looks at the window. "He had his thumb through the Warden's ear. You've seen it: the torn portrait. The felt, the wire. He said, 'Listen, Rhea. Listen to it breathe.' He was so pleased. Like a boy with a frog." Her voice does not change. "The Principal said the order came from the District Warden's office. She said it was the first time in my life that anyone would trust me with something that mattered."\n\nShe turns her hand over and looks at the knuckle. "It was very quiet. I thought it would be louder. I have been waiting for it to be louder for three days."`,
      onEnter: [{ xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `It was the first time anyone trusted her with something that mattered. She says it as a fact about the weather. It is the saddest sentence you have heard all week, and you have heard a great many.` },
        { skill: "dialectics", min: 3, text: `Premise: she killed on orders. Premise: she believes in the orders. Premise: she has not slept. If she believed, she would sleep. The conclusion is hers to draw. You are only the one who is standing close enough to show her the sum.` }
      ],
      choices: [{ text: "Go on.", goto: "rhea_hub" }]
    },
    rhea_ledger: {
      speaker: "narrator",
      voices: 3,
      text: `You open the page you have been carrying since you found it, the Vanguard Homes, Block C, nightly dosing, the long grey columns of Pedagogic Harmony in Ostrov's small furious hand, and turn it round so the lamp from the stairwell falls on it. A line near the foot is underscored twice. VANTAGE, R. Female. Intake: Hunger Winter, age seven. Dose: heavy, nightly, forty-one consecutive nights. In the margin, in pencil: Asks for the singing woman. Remarks: attachment interference. Suppressed.\n\nRhea reads it. She reads it as she reads everything: once, fast, to the end. Then she reads it again, slower. Her lips move on the word singing. Her left hand rises toward the page and stops an inch above it, trembling slightly, like a hand held over a stove.`,
      onEnter: [{ add: "rhea_pts", n: 2 }, { set: "rhea_saw_row", val: true }, { xp: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is not reading a record. She is reading a stranger who has her name and is described, at last, as having wanted something. Nobody has described her as wanting anything in ten years.` },
        { skill: "archive", min: 3, text: `Attachment interference: a technical term, Form 31(c). Used when a child, after a Harmony, asks for a specific person by name. Treatment: another Harmony. Repeat as necessary.` },
        { skill: "the_grey", min: 3, text: `I remember her. A very small girl who used to sit in the yard of the Vanguard Homes in the evenings and hum four notes into the drainpipe. I did not know what she was asking. I only carried the sound.` }
      ],
      choices: [{ text: "Wait.", goto: "rhea_hub" }]
    },
    rhea_origin: {
      speaker: "rhea",
      text: `"Before the Homes." She says it like a phrase in a foreign language she has been told she once spoke. "Nothing. A winter. A queue. A smell of wet wool." Then a pause, and something careful happens in her face, as if she were reaching, without her hands, for something on a high shelf. "There's a pair of hands, doing a plait. Somebody singing. Four notes, over and over. I never knew the words. I think there weren't any." She laughs, a short, dry sound. "I have always supposed I made it up. It's the sort of thing a child of the Homes makes up. We were all issued one."\n\nShe looks at you, sharply, as if you might take it from her. "Why are you asking?"`,
      onEnter: [{ xp: 1 }],
      choices: [
        { text: "Look at her. Really look.", check: { skill: "empathy", diff: 12, id: "finale_hub_rhea_origin", pass: "rhea_origin_pass", fail: "rhea_origin_fail" } },
        { text: "\"Nothing. I'm sorry.\"", goto: "rhea_hub" }
      ]
    },
    rhea_origin_pass: {
      speaker: "empathy",
      text: `She is seven. You see her, for one second, quite clearly, standing on the Vanguard Homes' cold cobbles, with a woollen cap and a tin cup, listening to a drainpipe. Under the uniform and the slick hair and the perfect posture there is somebody who has been waiting at a window for ten years for a person who sang four notes, and who has been told, every night, kindly, that there was no such person. You do not say any of this. You only let your face show that you can see it.\n\n"Oh," says Rhea Vantage, very quietly. "Oh. You're not trying to take it." She sits down on the stair, in her ironed uniform, with her baton, among six astonished cadets who are all, suddenly, extremely interested in the architecture. "I haven't had anyone look at me like that since I was seven. I had forgotten that people do."`,
      onEnter: [{ add: "rhea_pts", n: 1 }, { xp: 3 }, { morale: 1 }],
      choices: [{ text: "Sit beside her.", goto: "rhea_hub" }]
    },
    rhea_origin_fail: {
      speaker: "rhea",
      text: `Her face closes. It does it the way a shop shutter does, with a long grey rattle. "I see," says Rhea Vantage. "A technique." She stands. "Thank you for the demonstration. I have been looked at professionally before. It is not an unpleasant sensation. It is only an inaccurate one."\n\nThe baton comes out of the hip-loop and rests, with great lightness, across her palm.`,
      onEnter: [{ surv: 5 }],
      choices: [{ text: "Try again, differently.", goto: "rhea_hub" }]
    },
    rhea_swing: {
      speaker: "rhea",
      voices: 2,
      text: `"A photograph." She repeats it with a faint, polite frown, as if you had offered her a foreign coin. "Of a girl on a swing." A very long pause. "There was a swing. In the courtyard of the Homes. They took it down the winter I was eight. I used to hate it, and I could never say why." She stops. Her left hand has gone to the corner of her mouth, where the half-smile lives, and found it with its fingers like a thing she had dropped. "That is not a photograph of me."\n\n"No," you say. "I don't think it is. I think it's a photograph of a swing."\n\n"Yes," says Rhea Vantage. "Good. That's all it is." But she does not take her hand from her mouth.`,
      onEnter: [{ add: "rhea_pts", n: 1 }, { set: "rhea_told_of_swing", val: true }, { xp: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `You have given her a swing. You have not said whose. She will have to carry it up and down for the rest of her life without knowing how heavy it is. It was either a very great kindness or a very great crime. You cannot tell. Nobody could.` },
        { skill: "volition", min: 4, text: `You chose not to say it. That was correct. Not because the truth would hurt. Because it was not yet hers.` }
      ],
      choices: [{ text: "Say nothing more.", goto: "rhea_hub" }]
    },
    rhea_aside: {
      speaker: "narrator",
      text: `You say it in the voice that has no questions in it, the one you did not know you owned, and the whole landing takes it like a drill-order. Boots shift. A cadet straightens by reflex. Rhea Vantage blinks once, very slowly, and for the first time in your acquaintance she does not have an answer ready. She steps up on to the next stair, to the wall, with her back to the brick, leaving the width of a single person's shoulders.\n\n"This is not a permission," she says, to the middle air. "You understand. I am only observing that I have moved."\n\nShe will report it. She will say she was overpowered. She will be believed, because she is Rhea Vantage and has never in her life exaggerated.`,
      onEnter: [{ set: "finale_rhea_reports", val: true }, { surv: 8 }, { xp: 2 }, { add: "wake_pressure", n: 1 }],
      choices: [{ text: "Go up.", goto: "rhea_return" }]
    },
    rhea_block: {
      speaker: "rhea",
      text: `"No," says Rhea Vantage, as if correcting a pupil, "I do not think so." The voice is not unkind. It is simply a wall. "I can hear that you have been practising. It is an admirable quality in a student. But you cannot command me, {name}. Nobody has commanded me since I was seven. I have been in the business of being commanded for so long that I know exactly what it feels like when someone does it badly."\n\nA cadet behind her swallows. The baton comes out. It is held low and loose, a handsome object, as a clerk holds a ruler.`,
      onEnter: [{ surv: 6 }],
      choices: [{ text: "Think of something else.", goto: "rhea_hub" }]
    },
    rhea_turns: {
      speaker: "rhea",
      voices: 3,
      text: `"Stand aside," says Rhea Vantage, slowly, to nobody, to the stairwell. She listens to herself say it. "That is the wrong way round." She takes a breath, and the breath seems to go a long way into her. "I would like to stand aside. I would like very much to stand somewhere that is not in front of anything." She turns to the cadets. "Squad. About face. Report that the stair is held. Report it is held by Vantage."\n\nThey go, with an enormous, wondering discipline. She watches them down the spiral and her face, with no one to see it, loses its ironing. "I will have to say something to the Principal. I've decided what." She looks at you with the terrifying openness of someone who has taken off a uniform inside. "Thank you for not telling me what I am. I'd like to find out."`,
      onEnter: [{ set: "rhea_turned", val: true }, { set: "rhea_holds_door", val: true }, { xp: 5 }, { morale: 3 }, { thought: "th_loyal_rhea" }],
      interjections: [
        { skill: "solidarity", min: 3, text: `There is room. There is always room. We never had a rule about who was allowed to be at the edge of the ring.` },
        { skill: "the_grey", min: 3, text: `A girl in a good uniform sits down on my stair and does not know what to do with her hands. I have held this stair for sixty years. I have never held a thing so new.` }
      ],
      choices: [{ text: "Go up.", goto: "rhea_return" }]
    },
    rhea_fight: {
      speaker: "narrator",
      voices: 3,
      text: `She is smaller than you. That is the first fact. The second is that she is better at this than you by about eleven years, six hundred drills and one very good teacher whom she has just remembered she killed. She sees the weight go forward in your shoulders and drops her own, a bare half-inch, with a faint, almost inquisitive tilt of the head, as one does for a pupil who has made a good guess.\n\n"Cadets," says Rhea Vantage, quietly. "Stay where you are. This one is mine."`,
      interjections: [
        { skill: "adrenaline", min: 3, text: `GO. GO. GO. SHE IS A GIRL WITH A STICK. WE HAVE BEEN WALKING INTO THIS STAIRWELL SINCE BIRTH.` },
        { skill: "reflex", min: 3, text: `Duck left. The baton is on the left. No: right. Wait.` },
        { skill: "grit", min: 3, text: `It is only a hand. It is only a rib. Pain is information. Pain is a clerk who comes to inform you of what you have already been told.` }
      ],
      choices: [
        { text: "Hit her first, hard.", check: { skill: "brawn", diff: 14, id: "finale_hub_rhea_brawn", pass: "rhea_down", fail: "rhea_lose" } },
        { text: "Get under the baton and past.", check: { skill: "reflex", diff: 13, id: "finale_hub_rhea_reflex", pass: "rhea_down", fail: "rhea_lose" } },
        { text: "Stop. Put your hands up. Talk.", goto: "rhea_hub" }
      ]
    },
    rhea_down: {
      speaker: "narrator",
      text: `It is over faster than anything that has happened to you in three days. A step, a twist, a flat, shocked sound, and Rhea Vantage is on the stair with her back against the rail and the baton ringing down the spiral, bounce after bounce, into the dark. She does not try to rise. She looks up at you with her bright calm eyes, with a thin line of blood at her lip, and, astonishingly, with what looks like respect.\n\n"Well," she says, gently. "That's the first time anyone's managed it since the Homes." She wipes her mouth with the back of her hand. "Go on, then. I should like to say I tried."\n\nThe cadets, arranged on the stair behind her like eight statues of embarrassed boys, do not move.`,
      onEnter: [{ set: "rhea_beaten", val: true }, { surv: 12 }, { xp: 2 }, { hp: -1 }],
      choices: [{ text: "Go up.", goto: "rhea_return" }]
    },
    rhea_lose: {
      speaker: "narrator",
      text: `There is a flat, whirling instant in which the wall of the stair swings across your eyes. Then the stone is against your cheek and one arm is up behind your back at an angle that is a clear statement. Rhea Vantage's knee is exactly between your shoulder blades, very light, very correct. She is not breathing hard.\n\n"I'm sorry," she says, and she sounds as if she is, in a distant, tidy way. "I'd have preferred talking. Cadets. The student is under arrest." A pause. "Gently."\n\nBoots on the stair. Somebody with Bronka's jaw takes your other arm, and his hand is shaking.`,
      onEnter: [{ surv: 20 }, { hp: -2 }],
      choices: [{ text: "Go with them.", goto: "fail_caught" }]
    },
    rhea_return: {
      speaker: "narrator",
      text: `The stair opens above you, and the sky is waiting at the top.`,
      choices: [
        { text: "Go up.", goto: "wake_c3", cond: "flag.finale_route === 'wake'" },
        { text: "Go up.", goto: "bc_c3", cond: "flag.finale_route === 'bc'" },
        { text: "Go back to the array.", goto: "hub", cond: "flag.finale_route !== 'wake' && flag.finale_route !== 'bc'" }
      ]
    },

    // ---------------------------------------------------------------- ROUTE B: THE BROADCAST (end_static)
    bc_start: {
      speaker: "narrator",
      text: `The talkback panel is a grey steel plate bolted below the cabinet, with a chrome jack the size of a thumb and a plate that says HEADMASTER'S ANNOUNCEMENTS ONLY, in the capitals of a man who has never imagined anyone else. Once the Warden's switch is thrown, whatever goes into that jack goes into every horn on the roof, and out through every pole in the district until someone arrives to take it back.\n\nIt has been used, the log says, nine times in forty years. Eight were fire drills.`,
      onEnter: [{ set: "finale_route", val: "bc" }, { set: "bc_pressure", val: 0 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `Every pole on the Avenue is a throat waiting for someone to put a word in it. I have heard them all my life repeating other people's. I would give a great deal to hear one say something that was true.` }
      ],
      choices: [
        { text: "Open the Ledger. Open the logbook. Start.", goto: "bc_prep", cond: "has('ledger') || has('relay_log')" },
        { text: "You have nothing to read.", goto: "bc_empty", cond: "!has('ledger') && !has('relay_log')" },
        { text: "Not yet.", goto: "hub" }
      ]
    },
    bc_empty: {
      speaker: "narrator",
      voices: 3,
      text: `Your hands are empty. You pat your pockets as though the Ledger might have been hiding in one, and find only a pencil, a ration-card stub, and a half-eaten certainty. The talkback jack gleams. The Warden's switch waits behind its perspex guard.\n\nIt would be a joke, if it were not the worst moment of the week to find that you are the only copy of what you are about to say.`,
      interjections: [
        { skill: "archive", min: 3, text: `Actually... I know most of it. Page by page. Dates, durations, relay codes. I read it once on Wednesday, because I read everything once. Do you wish me to recite? I warn you I am not a performer.` },
        { skill: "rote", min: 3, text: `NIGHT ONE. NIGHT TWO. NIGHT THREE. (You have finished the Ledger's first column out loud without noticing. Rote never forgets a thing it was made to recite. It simply needs asking nicely.)` }
      ],
      choices: [
        { text: "Let the Archive recite it, line by line, from memory.", check: { skill: "archive", diff: 14, id: "finale_hub_bc_memory", pass: "bc_empty_pass", fail: "bc_empty_fail" } },
        { text: "Go and find something to read.", goto: "hub" }
      ]
    },
    bc_empty_pass: {
      speaker: "archive",
      text: `Tuesday, nineteen minutes to nine: the carrier is applied from Relay No. 4 to all of District 9. Duration: two hours and forty minutes. Persons affected: all. Remark column: tranquillity. Wednesday: two hours and fifty-one. Wednesday, school wing, supplementary Pedagogic dose, forty minutes: persons affected, the third form, boarders. Remark: examinations. The dates come up in you one by one, like a row of pennies in a fountain. You know where the commas are.\n\nIt is, you realise with a small dry thrill, the best thing you have ever done with your memory. Whatever they take tonight, you will have given it away first.`,
      onEnter: [{ set: "bc_memory", val: true }, { xp: 3 }],
      choices: [{ text: "Plug into the jack.", goto: "bc_prep" }]
    },
    bc_empty_fail: {
      speaker: "narrator",
      text: `Tuesday, you begin silently. Tuesday... evening. The carrier was applied. There were some number of hours. It was... You see the page. You see the shape of the page. You see, with perfect clarity, the margin where the figures were, and in the margin there is nothing, only a pleasant grey smudge like breath on a window.\n\nThe Static has been working on you for three days with the patience of a very good tailor. It has taken the one thing you needed it not to.`,
      onEnter: [{ morale: -2 }, { surv: 3 }],
      choices: [{ text: "Step back from the panel.", goto: "hub" }]
    },

    bc_prep: {
      speaker: "narrator",
      voices: 3,
      text: `You kneel at the panel. The jack takes a mic cable with a small, dry click, and you find, at the other end of it, that you are holding a microphone. It is a small thing. It is a stick of black Bakelite with a grille, a thumb-switch, and a cord. It weighs about as much as a bread roll.\n\nThe Bell's carrier is a living thing on the line: a faint sweet beat that lies under all the hum, the one that gets in behind the eyes. If you speak over it unprepared, your voice will be swallowed by it. Everything you say will arrive in every ear in the district as a pleasant, indistinct warmth.`,
      interjections: [
        { skill: "senses", min: 3, text: `There it is: the beat. Under the hum, a slow throb at about the rate of a sleeper's pulse. It is very quiet. It is the quietest thing in the world and it has been in every room you have ever slept in.` },
        { skill: "archive", min: 3, text: `A decoded carrier can be cancelled in the first second of speech. An undecoded one will fight your voice for the first minute, at least. Ilsabet Orrin has the decode. If she has not given it to you, the beat will be present in the room as you speak.`, cond: "!flag.ilsabet_decoded" }
      ],
      choices: [
        { text: "Plug in the cable. (You have the decode.)", goto: "bc_rig_ok", cond: "flag.ilsabet_decoded" },
        { text: "Ilsabet takes the headphones off her neck and slides them over yours.", goto: "bc_rig_ils", cond: "flag.ilsabet_ready" },
        { text: "Work it out on the fly. Rig a filter from what is lying about.", check: { skill: "sleight", diff: 12, id: "finale_hub_bc_rig", white: true, pass: "bc_rig_ok", fail: "bc_rig_bad" } },
        { text: "Plug in and speak. Whatever it takes.", goto: "bc_rig_bad" }
      ]
    },
    bc_rig_ils: {
      speaker: "ilsabet",
      text: `She does not make a speech. She has the headphones on your head with one hand and a screwdriver in the panel with the other and her glasses pushed up into her hair. "Beat's at 1.4 hertz. I've got a notch filter, hand-wound, from your radio tube, in the back of the set. You'll hear it vanish in about a second." She does something with a knob. The throb in your ears goes out like a candle. In its place there is a silence so clean that you can hear her breathing.\n\n"That's the first time you've heard it without the Static underneath," says Ilsabet. "Isn't it enormous?" Then, quite plainly, not at all like herself: "Say it right. I'm going to be recording."`,
      onEnter: [{ set: "bc_clear_carrier", val: true }, { set: "bc_ils_recording", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She has waited her whole life to hear a clean line. The silence in your ears is the thing she has been hunting since she was nine.` }
      ],
      choices: [{ text: "Throw the Warden's switch.", goto: "bc_c1" }]
    },
    bc_rig_ok: {
      speaker: "narrator",
      text: `The decode that Ilsabet gave you comes out of your head like a thing you have always known: a notch at 1.4 hertz, a hand-wound coil you can taste on the roof of your mouth. You slide the cable home. The carrier's throb, which has been in your ears the whole of this three days like a dog under a table, goes still. The silence it leaves is so clean that the roof seems to stand up.\n\nYou put your thumb on the Warden's switch. The perspex guard comes up under your hand like a lid. It has never been lifted by anyone who was not told to.`,
      onEnter: [{ set: "bc_clear_carrier", val: true }, { xp: 1 }],
      choices: [{ text: "Throw it.", goto: "bc_c1" }]
    },
    bc_rig_bad: {
      speaker: "narrator",
      text: `You speak a test syllable into the grille, and the horns hand it back to you wrapped in warm wool. The beat has got into it. Your own voice comes out of eleven black throats a half-second late, soft-edged, faintly sweet, like a thing remembered from childhood. It is very beautiful. It is also very sleepy.\n\nYou are going to have to speak through it, and everyone who hears you will be hearing you through a pillow.`,
      onEnter: [{ set: "bc_garbled", val: true }, { add: "bc_pressure", n: 1 }],
      interjections: [
        { skill: "volition", min: 3, text: `Louder is not clearer. Slower is clearer. Say each thing as if it were the only thing you had ever said.` }
      ],
      choices: [{ text: "Throw the Warden's switch anyway.", goto: "bc_c1" }]
    },

    bc_c1: {
      speaker: "narrator",
      voices: 3,
      text: `The switch goes over with a long brass clunk, and the cabinet's lamps change from green to amber. At the far end of the Avenue, in a box with a yellow window, a lamp comes on and a chair is pushed back. Sooner than you would have liked, the array hums and settles into the dull, listening quiet of a thing about to be spoken through.\n\nBut the array draws its power from the school's old mains, which come up through a breaker in the Principal's cellar: a single big iron lever and a needle on a dial. Whoever holds the lever can end this by leaning on it. A person in the cellar has noticed the needle move.`,
      onEnter: [{ sfx: "static" }],
      interjections: [
        { skill: "archive", min: 3, text: `Cellar breaker, school mains, Regulation 40: "no person other than the Principal or a designated deputy shall operate the school main." The Principal has a designated deputy. His name is Lemmy Tarsk. He has been waiting for this his whole life.`, cond: "!flag.lemmy_redeemed" },
        { skill: "instinct", min: 3, text: `Somebody's hand is on a lever six floors below you. You can feel it the way you feel somebody at the other end of a rope.` }
      ],
      choices: [
        { text: "Lemmy Tarsk comes up the stair, white-faced, with the cellar key in his fist.", goto: "bc_c1_lemmy", cond: "flag.lemmy_redeemed", once: true },
        { text: "Osk's keys turn the cellar bolt from the outside, twice, and are removed.", goto: "bc_c1_osk", cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)", once: true },
        { text: "The speaking-tube by the stair whistles. It is the Principal.", goto: "bc_c1_marr", cond: "flag.marr_turned", once: true },
        { text: "Wren, with the bent spoon from the Ration Hall tray, appears from nowhere.", goto: "bc_c1_spoon", cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught) && has('bent_spoon')", once: true },
        { text: "Speak and take your chances with the cellar.", goto: "bc_c1_gamble", cond: "!flag.bc_c1_clear" },
        { text: "Go on to the speech.", goto: "bc_draft", cond: "flag.bc_c1_clear" }
      ]
    },
    bc_c1_lemmy: {
      speaker: "lemmy",
      text: `He is out of breath. His armband is in his pocket; you can see a red corner of it. "I told her the key was on the roof," says Lemmy Tarsk. "She sent me up. I said, 'Yes, Principal.' I haven't told her a lie since I was nine." He swallows. "It was disgusting. It felt like swallowing a coin. I'd like to do it again."\n\nHe holds up the cellar key, a long black iron one, and, before you can speak, opens his hand over the stairwell and lets it fall. It drops forty feet down the middle of the spiral and rings off the stone at the bottom, once, twice, a slow clear bell.\n\n"I'll go and stand on the lever," he says. "Somebody should. I was always going to be somebody's hall monitor. I'd like it to be yours."`,
      onEnter: [{ set: "bc_c1_clear", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `A boy who told on everyone for three years and lost the taste for it in a single evening. The key falling down the stair is the loudest noise of his life.` }
      ],
      choices: [{ text: "Nod. Go back to the panel.", goto: "bc_c1" }]
    },
    bc_c1_osk: {
      speaker: "narrator",
      text: `Far down, below the library, below the Courtyard, a heavy bolt goes home. A second. A third. It is not the sound of someone locking a door. It is the sound of a very large man doing so with great gentleness, knowing that everyone, for thirty-one years, has listened to the click of his keys and thought nothing of it.\n\nThen, up the stairwell, rising like a pigeon: "Sorry, Principal. Cellar's out for maintenance. Fire regs. I'll fetch the key directly, soon as I find it." A pause. "May be some time."\n\nThere is a silence below in which a woman in pearl earrings considers whether to be angry with a caretaker. She decides, apparently, that it is not worth the energy.`,
      onEnter: [{ set: "bc_c1_clear", val: true }, { xp: 2 }, { morale: 1 }],
      choices: [{ text: "Go back to the panel.", goto: "bc_c1" }]
    },
    bc_c1_marr: {
      speaker: "marr",
      voices: 2,
      text: `The brass speaking-tube by the stair gives a thin whistle, like a kettle with something to say. You pull the stopper. Out of the tube, small, exact, and quite unmistakeable, comes the voice of Principal Odalys Marr.\n\n"The needle is steady," she says. "I am watching it. I shall be watching it for as long as you are speaking, and, I should say, I intend to watch it to the end of the page." A pause in which something fine and brittle moves. "I find I want to hear the ending. I have not wanted to hear the ending of anything in a number of years. Please do not make a mess of it."\n\nShe stoppers the tube. You hear her put on her glasses.`,
      onEnter: [{ set: "bc_c1_clear", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `"I want to hear the ending." She means it. It may be the most truthful sentence she has said since the spring.` },
        { skill: "doublethink", min: 3, text: `Oh, but she is so reasonable! She is so reasonable, even now, friend. It is such a pity about her taste in earrings.` }
      ],
      choices: [{ text: "Go back to the panel.", goto: "bc_c1" }]
    },
    bc_c1_spoon: {
      speaker: "wren",
      text: `She comes up the stair three at a time, holding the bent spoon from the Ration Hall tray in her fist like a torch. "It's in," she says. "I went down the coal-hole. I put it across the contacts, here, here." She draws a diagram in the dust of the roof with one finger: a thick lever, two plates, and across them, quite decisively, a spoon. "Now it can't open. Not without a hammer. Also I put a note on it that said BREAKFAST." She grins. "The cellar man will be very confused."\n\nShe is gone again before you can find a thing to say. She has left a smear of coal on the cabinet. It is, you think, the most beautiful thing in the room.`,
      onEnter: [{ set: "bc_c1_clear", val: true }, { take: "bent_spoon" }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "sleight", min: 3, text: `A spoon across the contacts: a thing a hand does when a hand has been told that a spoon is only a spoon. Ten thieves applaud. We would have used a fork.` }
      ],
      choices: [{ text: "Go back to the panel.", goto: "bc_c1" }]
    },
    bc_c1_gamble: {
      speaker: "narrator",
      text: `You leave the cellar to its own devices. Somewhere beneath you, at an unknowable moment, a lever may be leaned on and the power will go, and the thing you are about to say will stop in the middle of a word.\n\nThere is nothing to be done about it from the roof. You can say the most important thing first. That is, in the end, the only plan that has ever worked on a lever.`,
      onEnter: [{ add: "bc_pressure", n: 2 }, { set: "bc_c1_clear", val: true }],
      interjections: [
        { skill: "volition", min: 3, text: `Say the most important thing first. If you do not know what that is, say your name.` }
      ],
      choices: [{ text: "Begin.", goto: "bc_draft" }]
    },

    bc_draft: {
      speaker: "narrator",
      voices: 4,
      text: `The lamp on the panel turns from amber to a steady, expectant red. The microphone is in your hand. The Address, somewhere below, has just reached its third paragraph and the Warden's warm voice is, abruptly, cut off in the middle of the word "rest". There is a silence across the whole district. Eleven thousand faces turn upward. You have exactly one chance to start.\n\nHow do you begin?`,
      interjections: [
        { skill: "rhetoric", min: 3, text: `A pause. A long, full, exquisite pause. The entire district is listening to a silence you have made. That is the most powerful instrument I own. Spend it carefully.` },
        { skill: "volition", min: 3, text: `Say it the way you would say it to one person. Everyone on that Avenue is one person at a time.` },
        { skill: "composure", min: 3, text: `Shoulders down. Breathe through your nose. The microphone does not care how you look. The people do.` },
        { skill: "instinct", min: 4, text: `Not long. Do not do a long preamble. Say the thing before somebody remembers to be afraid.` }
      ],
      choices: [
        { text: "Read the dates and the durations. Plainly. Exactly. Let the arithmetic do the shouting.", check: { skill: "dialectics", diff: 11, id: "finale_hub_bc_style_facts", white: true, pass: "bc_style_facts", fail: "bc_style_fail" } },
        { text: "Read it in the State's own voice. A warm, reasonable bulletin. A courtesy notice.", check: { skill: "doublethink", diff: 11, id: "finale_hub_bc_style_bulletin", white: true, pass: "bc_style_bulletin", fail: "bc_style_fail" } },
        { text: "Read the names. Every name the Ledger gives, in order.", check: { skill: "empathy", diff: 11, id: "finale_hub_bc_style_names", white: true, pass: "bc_style_names", fail: "bc_style_fail" } },
        { text: "Speak as a \"we\". Tell them what they already know.", check: { skill: "solidarity", diff: 11, id: "finale_hub_bc_style_we", white: true, pass: "bc_style_we", fail: "bc_style_fail" } },
        { text: "Shout it. Tell them they were robbed.", check: { skill: "adrenaline", diff: 11, id: "finale_hub_bc_style_rage", white: true, pass: "bc_style_rage", fail: "bc_style_fail" } },
        { text: "Say whatever comes out.", goto: "bc_style_fail" }
      ]
    },
    bc_style_facts: {
      speaker: "dialectics",
      text: `"Good evening, District 9. I am going to read you some figures." Your voice comes out flat and cold and enormously carrying, like a ruler laid on a table. "Tuesday. Nineteen minutes to nine. The Bell, applied from Relay No. 4. Duration of suppression: two hours forty. Persons affected: eleven thousand two hundred and fourteen. Remark column: tranquillity. Wednesday. Nineteen minutes to nine. Two hours fifty-one. Persons affected: the same. Remark: tranquillity. Please note the remark."\n\nA ruler, a debate-club ghost, a lifetime's cold sentences, finally in a room where the sums are all true. Q.E.D. You continue. Along the Avenue, the flags have stopped waving, one by one, because the people holding them are doing arithmetic in their heads and arriving, one after another, at the same figure.`,
      onEnter: [{ set: "bc_style", val: "facts" }, { xp: 2 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_style_bulletin: {
      speaker: "doublethink",
      text: `"Citizens." It is a lovely voice. It is the loveliest voice you have ever had. It is the voice of an Assistant Deputy Sub-Director of the Ministry of Quiet Hours, warm, patient, a little hurt, and it comes out of eleven horns and into a thousand kitchens. "A brief courtesy notice from your Ministry. For your comfort, a number of hours have been removed from you this week. We apologise for any lightness this may have caused. The following is a schedule of the hours removed. We encourage you to follow along."\n\nAnd then, in the same warm, humane, kindly bulletin voice, you read them the Ledger. Every night. Every hour. WHAT THEY TOOK. For the first three entries, they believe it is the Ministry. At the fourth, an old man in the third row of the Avenue says, aloud, "Wait," and drops his flag.`,
      onEnter: [{ set: "bc_style", val: "bulletin" }, { xp: 2 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Isn't it wonderful? Isn't it wonderful that we can still use it for something? A voice like that was made for the truth. It was just never given it.` }
      ],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_style_names: {
      speaker: "empathy",
      text: `You do not begin with figures. You begin with a name. "Ostrov Dane," you say, and your voice, which you had planned to keep steady, is not. "Youth Commissar. Taught history for nine years before they made him a Commissar. Found hanging from a basketball hoop on Tuesday morning. Not by his own hand." The silence in the horns is vast. "Osk Brannic. Janitor. Thirty-one years. Offered, on Tuesday afternoon, as a replacement for the truth."\n\nThere are other names in the Ledger. There are two hundred and eleven. You read them, one by one, slowly, as one lays flowers, and along the Avenue, as each is read, a head goes down. It is not a loud thing. It is the sound of eleven thousand people, in a street, quietly being given back their dead.`,
      onEnter: [{ set: "bc_style", val: "names" }, { xp: 2 }, { morale: -1 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_style_we: {
      speaker: "solidarity",
      text: `"We know this." It is not your voice. It is a murmur, broad as a crowd, and you are only the hole it is coming out of. "We know it. We know it, all of us. We felt it. Every night at nine, we felt it come, and every morning we woke up lighter and told each other we were tired. We were not tired. We were robbed. We did not ask. We are not angry yet. We are only saying that it happened."\n\nOn the Avenue the murmur lifts, picks itself up from the cobbles. Somebody has said "yes". Somebody beside them says "yes". You find that you are no longer holding the microphone but only standing near it, like a person near a very large fire, being warmed by it.`,
      onEnter: [{ set: "bc_style", val: "we" }, { xp: 2 }, { morale: 2 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_style_rage: {
      speaker: "adrenaline",
      text: `"YOU WERE ROBBED." It leaves you like a thrown brick. "Every night. EVERY NIGHT. They put a tune in your ears and took your afternoons. They took the clinic. They took the knock on the door. They took your son's first day at school and they gave you COCOA." The horns shriek. A hundred dogs begin to bark. "THEY TOOK THREE DAYS TONIGHT. THEY'RE TAKING THEM NOW. LOOK AT THE POLE. IT'S LISTENING. IT HAS ALWAYS BEEN LISTENING."\n\nIt is raw, and cruel, and ragged. It is also the loudest sound ever made on that roof, and every one of eleven thousand people hears it and flinches, and then, slowly, straightens. You do not feel brave. You feel like a fist that has found a table.`,
      onEnter: [{ set: "bc_style", val: "rage" }, { xp: 2 }, { surv: 5 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_style_fail: {
      speaker: "narrator",
      text: `The first sentence goes out of you badly. It is neither one thing nor the other: not a speech, not a statement, not a scream, but a long mumbled sound with the word "Ledger" in it, buried in a pillowy blur of warmth. In the Avenue, eleven thousand heads tilt. Somebody laughs, uncertainly, in the way people laugh at a thing they have not decided is a joke.\n\nYou have to start again, without seeming to. You do it by reading, in a quiet voice, the first date you can see.`,
      onEnter: [{ set: "bc_style", val: "plain" }, { add: "bc_pressure", n: 1 }, { morale: -1 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },

    bc_c2: {
      speaker: "narrator",
      voices: 3,
      text: `You read. Somewhere behind you, a door at the head of the stair opens and shuts. You do not turn. The microphone is the only thing in the world, and the voice coming back to you off the Courtyard is the only company you have. Then, over your own words, you hear them: the boots, the steady Vanguard step, a hundred and twelve stairs, taken at the double.\n\nThey will be on the roof in two minutes. In two minutes the horns will stop. Whatever is going to help you must happen between a sentence and a sentence.`,
      interjections: [
        { skill: "instinct", min: 3, repeat: true, text: `You are reading, and the stair is climbing, and both of those are going at the same speed. Do not lose the beat of either.` },
        { skill: "reflex", min: 3, repeat: true, text: `Don't turn. Do not turn. If you turn the microphone drops a half-inch, and a half-inch is a gap, and a gap is somebody else's sentence.` }
      ],
      choices: [
        { text: "Lieutenant Kell steps up to the microphone beside you, with a notebook in her hand.", goto: "bc_c2_vasha", cond: "(flag.vasha_ready && !flag.vasha_betrays)", once: true },
        { text: "Osk's keys, below, turn the stairhead lock and the one after that.", goto: "bc_c2_osk", cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)", once: true },
        { text: "Hob rings the Great Bell, once, behind each entry you read.", goto: "bc_c2_hob", cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal)", once: true },
        { text: "Rhea Vantage stands at the stairhead and speaks to her cadets.", goto: "bc_c2_rhea", cond: "(flag.rhea_ready || flag.rhea_turned)", once: true },
        { text: "Wren slides past with a satchel of pencil stubs and torn paper and goes down the chute.", goto: "bc_c2_wren", cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)", once: true },
        { text: "In the Courtyard, Fenwick's choir stops singing the Anthem and begins, very softly, to hum.", goto: "bc_c2_fen", cond: "flag.fenwick_ready", once: true },
        { text: "Ilsabet unclips the little recorder from her chair and sets the cylinder turning.", goto: "bc_c2_ils", cond: "flag.ilsabet_ready && !flag.bc_ils_recording", once: true },
        { text: "Turn and meet Rhea on the landing.", goto: "rhea_start", cond: "!((flag.rhea_ready || flag.rhea_turned)) && !flag.bc_c2_clear" },
        { text: "Read on and ignore the stair.", goto: "bc_c2_ignore", cond: "!flag.bc_c2_clear" },
        { text: "Read on.", goto: "bc_c3", cond: "flag.bc_c2_clear" }
      ]
    },
    bc_c2_vasha: {
      speaker: "vasha",
      voices: 3,
      text: `She does not ask. She comes out of the dark of the stairwell in her second-best coat and takes the microphone from your hand with a flat, courteous nod, as she once took a whistle from a boy who was blowing it wrong. You see what is in her other hand: a small black notebook, soft with carrying, tied with a ration-string.\n\n"Lieutenant Vasha Kell," says Vasha, to the district. "Physical Culture. I have something to read you." Her voice does not shake. "For three days I have written reports on a seventeen-year-old student of this school. They were addressed to a man in a good coat. Here is what I wrote." She opens the notebook. "Tuesday. The student is unwell and rude. The student does not know what it did. Wednesday. The student is more careful. The student has begun to trust me. I am not sure what I will do about that."\n\nShe reads it all. She does not look at you once. It is the bravest thing you have ever seen a person do with a notebook.`,
      onEnter: [{ set: "vasha_confession", val: true }, { set: "bc_c2_clear", val: true }, { xp: 3 }, { morale: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is reading her own betrayal aloud to eleven thousand people in a flat voice, so that they will know what an informer is made of: a tired person with a pencil, who is sorry. It is the only apology she knows how to make.` },
        { skill: "solidarity", min: 3, text: `We have never wanted to hear one of them say it. We have only wanted to know that they hated it as much as we did. She says it. We are holding our breath so we do not interrupt.` }
      ],
      choices: [{ text: "Let her read. Look at the stair.", goto: "bc_c2" }]
    },
    bc_c2_osk: {
      speaker: "osk",
      text: `The first lock closes with a heavy, patient clunk. Then a second, one landing up. Then a third, and a fourth, until you lose count of the doors that have been turned against the stair. Below you, the Vanguard find the first one and stop. There is a short, impatient, scuffling silence. "Staff only," comes up the stairwell, slow and mild, in the voice of a man who has been telling people this for thirty-one years. "Mind the step, young miss. Sorry. Sticks."\n\nYou read on. The doors, one by one, close on the stair, like the rings of a very long, slow, wooden clock.`,
      onEnter: [{ set: "bc_c2_clear", val: true }, { xp: 2 }, { morale: 1 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_c2_hob: {
      speaker: "hob",
      voices: 2,
      text: `Behind each entry you read, Hob, who has not once spoken, rings. Not the hour; not the muster. A single, round stroke of the Great Bell, laid across each night's figure like a seal on a letter. Tuesday, ring. Wednesday, ring. The strokes ride out over the Avenue, and a district that has never, in its life, been given a clear answer to the question of what the Bell was for hears, each time, the Bell itself say: that. That one. That is what it took.\n\nBy the third night he has found the beat of your sentences, and by the fifth your sentences have found his. It becomes an antiphon: a voice, a bell, a voice, a bell. At the foot of the tower an old woman crosses herself, as if in church. She does not know what she is crossing herself for. It does not matter.`,
      onEnter: [{ set: "bc_c2_clear", val: true }, { set: "bc_hob_rang", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `That is my other voice. The first was a lie told to a district for forty years by an old man who did not know what he rang for. Now he knows. Listen to the difference.` }
      ],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_c2_rhea: {
      speaker: "rhea",
      text: `You do not see what she says to them. You hear it, from the stairhead, through your own words: not loud, not an order. "Cadets. Take off your caps." A confused scuff. "I am asking you. Take them off. Listen to it. I would like you to hear what you've been doing." A long pause. "Right. That is a Vanguard Home dosing schedule. Block C. I was in Block C. Listen to the line about attachment interference. That was me, aged seven."\n\nThere is a silence on the stair. Then eight pairs of boots, one by one, stop climbing. A cadet, quite small, is quietly sick into his cap. Another puts his hand over his mouth. Rhea Vantage stands at the head of the stair and does not move, an armed girl in a perfect uniform guarding a stair against her own side with no weapon but a list.`,
      onEnter: [{ set: "bc_c2_clear", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `"That was me, aged seven." She has said it in front of her own squad. She will never have a squad again. She has said it anyway, and it is the first time you have heard her voice do something it was not trained for.` }
      ],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_c2_wren: {
      speaker: "wren",
      text: `She goes by you in a blur of cap and elbows, with a canvas satchel over her shoulder and her pockets making the noise of a very small stationery shop. "Pencils," she says, in a whisper that carries like a pin. "Paper. Ration slips, the backs of the Jubilee programmes, the lining of a cap. When you tell them to write it on their hands, they won't have anything to write with. So I'm going down. I'm going to give them something."\n\nThen she is on the chute rope and gone, sliding down the outside of the tower in a long, mad, rattling rush. You hear, a minute later, from the Courtyard, a single high voice shouting, in delight: "PENCILS! FREE! FOR THE STATE!" and a district beginning, uncertainly, to rummage in its pockets.`,
      onEnter: [{ set: "bc_c2_clear", val: true }, { set: "bc_wren_pencils", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "charm", min: 3, text: `"FREE! FOR THE STATE!" is the finest advertising slogan I have ever heard. It fills me with something between pride and jealousy.` }
      ],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_c2_fen: {
      speaker: "fenwick",
      text: `Down in the Courtyard, forty students in grey wool have been standing at attention for an Anthem that the Address has just failed to cue. Fenwick Alder, with his arms still raised, hears the voice from the horns, and you hear him make a decision, in the air, like a man stepping off a kerb. He brings both arms down, very softly, and the choir does not sing the Anthem. They hum. A low, level, many-voiced hum, in the key of the sentences you are reading, a bed laid under your words.\n\nIt is the most beautiful accompaniment you have ever heard. It has no tune. It is only forty children breathing in the same place.`,
      onEnter: [{ set: "bc_c2_clear", val: true }, { set: "bc_choir_hum", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `A choir is a crowd that has agreed to be in tune. We have been trying to teach the Avenue to do it for years. It is turning out to be very easy, once you start.` }
      ],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_c2_ils: {
      speaker: "ilsabet",
      text: `She has a recording head, a half-inch of wax in a tin, and a belt-driven spindle she built from a bicycle. She sets it going with a flick of the finger and holds the little brass horn up to the speaker. The wax hums. "I'm keeping it," she says, quite matter-of-fact. "Every word. This is going in the cylinder, and the cylinder is going in a biscuit tin, and the biscuit tin is going somewhere they'd never look. If they can take the district's head, they can't take this."\n\nShe does not look at you. She looks at the needle. Her voice is almost cheerful. "I've waited all my life to make a recording that mattered."`,
      onEnter: [{ set: "bc_c2_clear", val: true }, { set: "bc_ils_recording", val: true }, { xp: 3 }, { morale: 2 }],
      choices: [{ text: "Read on.", goto: "bc_c2" }]
    },
    bc_c2_ignore: {
      speaker: "narrator",
      text: `You read. The boots take the last turn of the spiral and burst through the stairhead door, and a hand takes you by the collar. It is quite a gentle hand. A voice, a girl's voice, perfectly calm, says, "Keep going. I have been told to remove you. I have not been told when." The microphone stays up. A baton rests against the small of your back like a finger.\n\nYou read on, with Rhea Vantage's breath in your hair. It is an experience you will carry for the rest of your life.`,
      onEnter: [{ add: "bc_pressure", n: 1 }, { surv: 8 }],
      choices: [{ text: "Read on.", goto: "bc_c3" }]
    },
    bc_c3: {
      speaker: "narrator",
      voices: 2,
      text: `Between one entry and the next the stairhead door opens with great politeness, and a man comes out onto the roof with a folding chair under his arm. He sets the chair down on the boards, a yard behind you, and sits. He does not touch you. He does not touch the microphone. He crosses one knee over the other, with a thermos in his gloved hand, and listens to you read the Ledger with an expression of the closest, tenderest attention.\n\nIt is, you realise after a line or two, the first time in your life you have been listened to by the person the speech is about.`,
      interjections: [
        { skill: "instinct", min: 3, text: `Do not stop. If you stop, he will say something. If he says something it will be kind and you will find you want to hear the rest.` }
      ],
      choices: [{ text: "Keep reading. Let him sit.", goto: "bc_c3b" }]
    },
    bc_c3b: {
      speaker: "narrator",
      text: `You do not stop. You turn the page. You read the next line, in the voice you chose, and from a yard behind you the Inspector says, softly, so as not to carry, in the very gap between two sentences: "I can hear the Relay trying to cut you. I have told it, three times now, that the fault is in the line."\n\nThat is all he says. It is also, as you will realise later, a gift.`,
      onEnter: [{ add: "bc_pressure", n: -1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Is that a threat or a courtesy? Friend, in the Ministry they have never learned to tell the difference. It is one of the things that make us so hard to hate.`, cond: "!flag.voss_turned" },
        { skill: "empathy", min: 3, text: `He is helping. He does not seem to know it. He is just leaving small, deniable gaps, one after another, like a man holding a door.` }
      ],
      choices: [
        { text: "Turn your head a fraction. Speak to him between sentences.", goto: "voss_arrive" },
        { text: "Keep reading.", goto: "bc_read" }
      ]
    },

    bc_read: {
      speaker: "narrator",
      voices: 4,
      text: `Page by page, then. Night by night. You read the Ledger, the whole slim green cloth thing of it, Ostrov's small furious script and the long columns in the Ministry's neat ones, WHAT THEY TOOK, WHAT THEY TOOK, WHAT THEY TOOK, until the words themselves have turned from information into rhythm, and the rhythm into a kind of weather. All over the district, eleven thousand people are standing in streets and kitchens, in their coats over their pyjamas, in the wrong light, hearing for the first time in their lives what happened to them.\n\nAnd under your own voice, always, the beat is pressing. It will not stop while you speak. It only waits.`,
      interjections: [
        { skill: "dialectics", min: 3, text: `You have shown them the premises, one after another. They will draw the conclusion themselves. It is the only conclusion that ever sticks.`, cond: "flag.bc_style === 'facts'" },
        { skill: "doublethink", min: 3, text: `And the lovely thing is, nobody can quite tell, still, whether the Ministry is saying it. The warmth never wavers. It goes on reassuring them all the way to the revolution.`, cond: "flag.bc_style === 'bulletin'" },
        { skill: "empathy", min: 3, text: `You are saying the names in order. Two hundred and eleven. It takes eleven minutes. It is the longest silence anyone in this district has ever kept for the dead.`, cond: "flag.bc_style === 'names'" },
        { skill: "solidarity", min: 3, text: `We are saying it, not you. You are only the throat. There are eleven thousand of us in a street and every one of us has already said the next sentence.`, cond: "flag.bc_style === 'we'" },
        { skill: "adrenaline", min: 3, text: `LOUDER. NO. WAIT. THAT WAS ENOUGH. THAT WAS EXACTLY ENOUGH. LET THEM HEAR IT BREATHE.`, cond: "flag.bc_style === 'rage'" },
        { skill: "volition", min: 4, text: `Somewhere in the page, your own thoughts have begun to blur. The beat is working on you, from underneath. You have read the same line twice. Be careful. You are the only one in the district who can be made to forget what you are saying while you say it.` }
      ],
      choices: [
        { text: "Hold your voice together. Stay on the line.", check: { skill: "volition", diff: 12, id: "finale_hub_bc_hold_vol", pass: "bc_read_pass", fail: "bc_read_fail" } },
        { text: "Let the crowd's murmur carry the sentence for you.", check: { skill: "solidarity", diff: 11, id: "finale_hub_bc_hold_sol", pass: "bc_read_pass", fail: "bc_read_fail" } },
        { text: "Lean on the sheer stubborn physical fact of your throat.", check: { skill: "stamina", diff: 11, id: "finale_hub_bc_hold_sta", pass: "bc_read_pass", fail: "bc_read_fail" } },
        { text: "Keep going and hope.", goto: "bc_read_fail" }
      ]
    },
    bc_read_pass: {
      speaker: "narrator",
      text: `You hold. The blur comes up around the edge of the page, soft as a tide, and you read straight through it, one word on top of another, the way you walk across a river on stones you cannot quite see. It does not stop. It cannot. But you do not stop either, and a voice that does not stop is, in the end, an argument for itself. By the last of the Tuesday entries the beat has begun to thin. It is looking for a place in the Avenue to hide.\n\nYou can feel the district listening the way you feel a held breath on the back of your neck. It is a very large, very warm feeling, and under it, small and quite distinct, you feel the thing you have been looking for since you woke on the stage of the Old Theatre. You feel like yourself.`,
      onEnter: [{ xp: 3 }, { morale: 2 }],
      choices: [{ text: "Come to the last page.", goto: "bc_note" }]
    },
    bc_read_fail: {
      speaker: "narrator",
      text: `The blur comes up and takes the sentence. For one slow, terrible half-minute you are not reading anything: you are only a mouth, saying shapes. Then Hob's hand finds the bell, or the Inspector's cough finds the gap, or only your own old ringing, that thin childhood note, finds your ear, and you are back, with a page you can read and nothing in your head to say it with. You read it anyway.\n\nIt is a worse reading than the first. It is a worse reading, and a truer one, and the district hears it, with its flags dropped and its cocoa cold, the stumbling, frightened voice of a person who has nearly forgotten what they are saying.`,
      onEnter: [{ add: "bc_pressure", n: 1 }, { morale: -2 }, { hp: -1 }],
      choices: [{ text: "Come to the last page.", goto: "bc_note" }]
    },
    bc_note: {
      speaker: "narrator",
      voices: 3,
      text: `The last page. It is blank except for a single printed line and the handwriting of a dead man. The printed line is the Ministry's: GRAND HARMONY, 20:15. Under it, in pencil, in Ostrov's hand, an instruction to a courier who might never be able to remember it: WRITE IT DOWN. That's all. It has no signature. It does not need one.\n\nEverything you have read has a lifetime of about eleven minutes. When the Grand Harmony arrives, the District will have heard the Ledger, and will not remember hearing it. The residue will be a sentence behind the teeth, a feeling, a smudge. Unless.`,
      interjections: [
        { skill: "archive", min: 3, text: `Notes from Yesterday-You. A method, and a crude one: a person who knows they will forget writes it down in their own hand, so that the person they will be tomorrow has no choice but to believe it. It worked on you. It is the only thing that has ever worked on anyone.` },
        { skill: "volition", min: 3, text: `This is the last thing you will say on the air. Choose it as you would choose the last thing you were to say to anyone.` },
        { skill: "the_grey", min: 3, text: `Every hand in the district has a palm, a wrist, a knuckle. It is the only paper that no Ministry has ever managed to collect.` }
      ],
      choices: [
        { text: "\"Write it down. On your hands, on the walls, on each other. In your own writing. DO NOT TRUST THE BELL.\"", goto: "bc_note_write" },
        { text: "Say the names one more time, and then your own.", goto: "bc_note_name" },
        { text: "Say nothing. Hold the microphone out to the roof, to the people beside you, and let them speak.", goto: "bc_note_pass", cond: "flag.bc_c2_clear" }
      ]
    },
    bc_note_write: {
      speaker: "narrator",
      text: `"Write it down." You say it slowly, and the beat tries to get in under the words. "Write it on your hands. On the back of the programme. On the wall. On each other's arms, if you have no paper. In your own handwriting, because you will believe your own handwriting. Write: I WAS ROBBED. Write: THE BELL IS A MACHINE. Write: ASK THE ONES WHO COULD NOT SLEEP. Tomorrow morning, when you wake up, and do not know why your hand says what it says, believe it."\n\nBelow, in the Courtyard, a very small shape, which you recognise as a first-year with a satchel, is distributing pencil stubs with the air of a bishop.\n\nAnd all across the Avenue, one after another, in the lamplight, you see them: people holding up their palms.`,
      onEnter: [{ set: "bc_notes_called", val: true }, { xp: 4 }, { morale: 3 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `We did not know we could do it. We did not know a hand was a place you could keep a country.` }
      ],
      choices: [{ text: "Put the microphone down.", goto: "bc_end" }]
    },
    bc_note_name: {
      speaker: "narrator",
      text: `You say them again, all of them, as fast as a person can who means every one. At the end you say a last name, because it is yours, and the horns hand it back to you across the Courtyard in a voice you did not know you owned. "My name is {name} Voran. I am seventeen. I carried this. I do not remember doing it. I would like it known that I did."\n\nA pause that goes on a very long time. Then, from the Avenue, from the crowd, from the school gate, a voice shouts your name back: once, high and cracked and joyful, and then a second, and a third. It is not a chant. It is only people saying it, one after another, to see what it sounds like.`,
      onEnter: [{ set: "bc_named", val: true }, { xp: 3 }, { morale: 3 }, { surv: 5 }],
      choices: [{ text: "Put the microphone down.", goto: "bc_end" }]
    },
    bc_note_pass: {
      speaker: "narrator",
      text: `You hold the microphone out into the wind of the roof. For a moment nobody understands what you mean. Then Ilsabet, or Wren, or Fenwick, or the Lieutenant, or a girl in a Vanguard uniform who is not sure she is allowed to, steps forward and takes it from your hand. It goes from hand to hand. Somebody says a sentence of their own. Somebody says the name of a person who was taken. A small, dry, clear voice you have never heard says, "Wait, I remember my mother's face," and the whole Avenue makes a sound.\n\nYou have stopped being the one who speaks. It was the one thing you had not planned for, and it is the best thing in the whole evening.`,
      onEnter: [{ set: "bc_mic_passed", val: true }, { xp: 4 }, { morale: 3 }],
      choices: [{ text: "Step back from the panel.", goto: "bc_end" }]
    },
    bc_end: {
      speaker: "narrator",
      voices: 3,
      text: `They come for you quietly. The hand on your collar is the same hand as before, and the baton at your back has not moved. Behind it, in the stairhead door, six men in grey coats have arrived with the unhurried courtesy of men who have never run for anything in their lives. One of them is carrying a form. At the far end of the Avenue the Relay's one yellow window blinks, and the cabinet's lamp goes red as somebody, a long way off, walks to a lever and puts a hand on it.\n\nThe Warden's switch is thrown back. The horns hold a single, breathing silence. Then, as a district full of people looks up at a roof, the Grand Harmony begins, a long sweet descending pair of pitches, a small bright tune. It is beautiful. It is exactly as beautiful as it was last night.`,
      onEnter: [{ sfx: "bell" }],
      interjections: [
        { skill: "the_grey", min: 3, text: `It does not take them all. I felt it: a great many hands on a great many railings, holding on. The pencils held. Hear that? Under the Harmony, under the pause, the sound of a district, scratching.` },
        { skill: "volition", min: 3, text: `You said it. Whatever they take now, you said it. No Ministry in the country can send a cleaner into a sentence that has already been spoken.` }
      ],
      choices: [
        { text: "Surrender. Hold out your wrists.", goto: "bc_end_a", cond: "flag.bc_pressure < 3" },
        { text: "They have cut the line before you finished.", goto: "bc_cut", cond: "flag.bc_pressure >= 3" }
      ]
    },
    bc_end_a: {
      speaker: "narrator",
      text: `The cuffs are quite cold. They are also, you notice, very new, as if they had been bought for the occasion. "{name} Voran," says the man with the form. "You are being detained under Regulation 61, disturbance of a state occasion." His voice is wholly without malice. "You have the right to a hot drink." He sounds a little embarrassed on the Union's behalf. "I'm afraid it will not be very good."\n\nThey take you down the spiral, past locked doors, past the boy with Bronka's jaw, past a caretaker standing with his keys in his hand and his chin up. On the Avenue, the Grand Harmony is beginning, a beautiful thing, thick with sweetness, and on every palm you pass, in pencil, in the lamplight, you can read the same three words.`,
      onEnter: [{ ending: "end_static" }]
    },
    bc_cut: {
      speaker: "narrator",
      text: `The array dies in the middle of a word. It is not a dramatic death. The amber lamps go out, one after another, like the windows of a street at bedtime, and the microphone in your hand becomes a stick of Bakelite with a cord. Somewhere below, a lever has gone over, and a needle has dropped, and a woman in pearl earrings has put her hand down at last.\n\nThey got maybe a third of it. The first nights, the names, perhaps the Hunger Winter. The district, which has been listening with its mouth open for eleven minutes, stands there in the dark with its paper flags, and then, as the Relay takes the line back, the Grand Harmony begins in the old, sweet, beautiful way. It will have heard the first of it. It will wake with a sentence behind its teeth.\n\nThe door at the stairhead opens, and a form is brought out.`,
      onEnter: [{ sfx: "static" }, { surv: 15 }],
      choices: [{ text: "Hold out your wrists.", goto: "fail_caught" }]
    },

    // ---------------------------------------------------------------- ROUTE C: SABOTAGE (end_silenced)
    sab_start: {
      speaker: "narrator",
      voices: 3,
      text: `It is a very simple idea. The Bell is not a metaphor: it is a tone made in a box, and a box can be broken. District Relay No. 4 stands at the far end of Karsov Avenue, a concrete cube with one yellow window, eleven minutes away at a run, against the stream of eleven thousand people who have come out to be sung to. If you go now, you can be inside before the Address is over. If you break the right thing, the cue will fire into nothing, and the horns on the roof behind you will not so much as hiss.\n\nIt is also the one plan on the list that no one will thank you for.`,
      onEnter: [{ set: "finale_route", val: "sab" }],
      interjections: [
        { skill: "adrenaline", min: 3, text: `FINALLY. A PLAN WITH A HAMMER IN IT.` },
        { skill: "empathy", min: 3, text: `There are people in that box. A tired man in a lab coat. A man with a megaphone. Whatever you do to the machine you do to them. I would like you to decide that now, rather than afterward.` },
        { skill: "dialectics", min: 3, text: `A lightning rod conducts to the ground. If you destroy the Relay, the Chancellery will simply build a second. Remember what you are buying: not an end. A night.` }
      ],
      choices: [
        { text: "Go. Down the stair, into the crowd, along the Avenue.", goto: "sab_run" },
        { text: "Not like this.", goto: "hub" }
      ]
    },
    sab_run: {
      speaker: "narrator",
      voices: 3,
      text: `You take the hundred and twelve steps three at a time and come out of the library into a district at a standstill. The Avenue is a sea of coats and flags, shoulder to shoulder, all faces turned up toward the tower and the dark, expectant horns. The Address is a warm voice rolling from every pole. Nobody is going the other way.\n\nThe Relay is eleven minutes off. The crowd is a wall. And somewhere behind you, at the foot of the tower, a whistle has gone, thin and high, and a pair of men in grey coats have turned to look at a student running.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `Left at the dye-works. Through the drain-arch, under the kiosk. A child's chalk hopscotch on the pavement is a map I have kept for sixty years. I know every corner of this district that was built to be avoided.` },
        { skill: "stamina", min: 3, text: `One more corridor. One more corridor. Breathe from the belly. The Avenue is only a very long corridor with the lights on.` },
        { skill: "reflex", min: 3, text: `Duck the cocoa cart. Hop the rope. Spin through the queue for the free flag. Your feet are doing it before you've asked them to.` }
      ],
      choices: [
        { text: "Run the long way round, through the drains and alleys. Let the city show you.", check: { skill: "the_grey", diff: 11, id: "finale_hub_sab_run_grey", pass: "sab_run_ok", fail: "sab_run_bad" } },
        { text: "Run it straight. One lung at a time.", check: { skill: "stamina", diff: 11, id: "finale_hub_sab_run_sta", pass: "sab_run_ok", fail: "sab_run_bad" } },
        { text: "Weave through the crowd like a thrown stone.", check: { skill: "reflex", diff: 12, id: "finale_hub_sab_run_ref", pass: "sab_run_ok", fail: "sab_run_bad" } },
        { text: "Go as fast as you can and hope for the best.", goto: "sab_run_bad" }
      ]
    },
    sab_run_ok: {
      speaker: "narrator",
      text: `You find the seam in the city and run along it. A drain-arch, a coal-hole, a passage under the kiosk that smells of a hundred years of cats, a courtyard where somebody has hung out washing on the one night of the year nobody will look. The roar of the Avenue goes by on your left like a river heard through a wall. You come out at the end of it, at the corner of the Relay's own rail fence, with your lungs on fire and not one person having looked up.\n\nBehind you, the Address reaches its second page. It is a very good run. It is the sort of thing you will never be able to tell anyone.`,
      onEnter: [{ xp: 2 }],
      choices: [{ text: "Approach the gate.", goto: "sab_gate" }]
    },
    sab_run_bad: {
      speaker: "narrator",
      text: `You run into the crowd and the crowd runs into you. A paper flag goes in your mouth. An elbow takes you in the ribs. A grandmother with a cocoa shouts something about manners and the nearest Vanguard sentry, turning at the noise, finds himself looking directly into your face. You are three hundred metres from the Relay, bleeding a little from the lip, and a whistle has gone behind you.\n\nYou get there. It takes you the best part of a quarter hour and a number of things you will not tell anyone. When you arrive at the Relay's fence you are late, and winded, and on somebody's list.`,
      onEnter: [{ surv: 8 }, { hp: -1 }, { time: 4 }],
      choices: [{ text: "Approach the gate.", goto: "sab_gate" }]
    },

    sab_gate: {
      speaker: "narrator",
      voices: 3,
      text: `The Relay stands at the end of the Avenue like a bad idea that has been given a postcode. A rail fence, a heavy grey door with a window the size of a hand, a sentry box with a sentry in it who has been given an extra ration of cocoa for the Jubilee and is drinking it very slowly. The hum is audible at fifty metres. It is not loud; it is just a pitch exactly in the middle of your teeth.\n\nA light in the yellow window moves. Somebody inside is walking from console to vault, and the walk has a limp.`,
      interjections: [
        { skill: "senses", min: 3, text: `Cocoa on the sentry's breath, hot valves, a seam of machine oil, and a thin, high smell of something burning that is not on the schedule: a lab coat, left too near a lamp.` },
        { skill: "slip", min: 3, text: `Not yet. The sentry has seven seconds when the cocoa is in his mouth. You have counted. Not yet.` }
      ],
      choices: [
        { text: "Show the pass at the sentry box. It is all in order.", goto: "sab_in_pass", cond: "flag.relay_access || has('relay_pass') || has('forged_pass')" },
        { text: "Whistle the tune. The one the engineer taught you. A lamp turns green in the yellow window.", goto: "sab_in_tomas", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "Go in as a shadow while the sentry drinks.", check: { skill: "slip", diff: 13, id: "finale_hub_sab_gate_slip", white: true, pass: "sab_in_slip_ok", fail: "sab_in_slip_bad" } },
        { text: "Go through the sentry. Quickly, and without discussion.", check: { skill: "brawn", diff: 12, id: "finale_hub_sab_gate_brawn", pass: "sab_in_force", fail: "sab_in_slip_bad" } },
        { text: "Turn back.", goto: "hub" }
      ]
    },
    sab_in_pass: {
      speaker: "narrator",
      text: `The sentry looks at your pass for a long, slow moment, with the stolid dignity of a man holding a very small thing at the wrong distance. "Student," he says, "it's the Jubilee. Nobody's visiting." Then, with the sigh of a man who has never in his life made a decision he could not lay at someone else's door, he stamps it. "In. Sign the book. Mind the dog."\n\nThere is no dog. There never was. The door opens on a long grey corridor, a smell of warm dust, and a hum that goes straight through the soles of your shoes.`,
      onEnter: [{ xp: 1 }],
      choices: [{ text: "Go in.", goto: "sab_hall" }]
    },
    sab_in_tomas: {
      speaker: "tomas",
      text: `You whistle four notes you were taught on Wednesday over a cup of tea, and the lamp in the yellow window goes from amber to green and back. The sentry, who has not seen this, turns his head, unaware, toward a noise in the opposite direction, which turns out to be a man in a lab coat dropping a heavy tin tray, with great care, at the far end of the fence.\n\n"Oh dear," says Tomas Wend, to nobody. "Oh, how clumsy of me." He shuffles out into the yard to pick it up, very slowly. As he passes you, without turning his head, he says, "The side door. Third on the left. Don't touch the red pipe."\n\nThen he is back inside. The sentry has not turned round.`,
      onEnter: [{ xp: 2 }, { morale: 1 }, { set: "sab_tomas_opened", val: true }],
      choices: [{ text: "Slip through the side door.", goto: "sab_hall" }]
    },
    sab_in_slip_ok: {
      speaker: "slip",
      text: `Not yet. Not yet. Not yet. Now.\n\nThe sentry's cup is at his mouth. The cocoa is a lovely warm weight in the cup. In the last fraction of the swallow you move, flat to the wall, with your breath held in your ribs, through the narrow gap between the fence and the box, round the corner of the Relay and into the shadow of a rain-barrel, where you stop, and become a dark patch on a wall. The sentry looks round. He sees a barrel. He sees a wall. He drinks the rest of his cocoa and sighs, in the most profound contentment a state employee has ever known.\n\nThe side door is not locked. It never was. Nobody has ever tried to break into a thing that hums.`,
      onEnter: [{ xp: 2 }],
      choices: [{ text: "Go in.", goto: "sab_hall" }]
    },
    sab_in_slip_bad: {
      speaker: "narrator",
      text: `The cocoa goes down; the sentry looks up; and you are standing in the open with one foot on a rail, in the full light of a lamp. He does not shout. He is a decent man and not a quick one. He says, "Oi," in a puzzled, civil tone, and then, with more alarm, "Oi!" and the door of the Relay opens and a big man with a megaphone comes out of it, looking at you as one looks at an unexpected parcel.\n\n"Well, well," says Captain Brune, through the megaphone, at a distance of about eight feet. "Student. Visiting hours were never."`,
      onEnter: [{ surv: 8 }],
      choices: [{ text: "Face him.", goto: "sab_hall" }]
    },
    sab_in_force: {
      speaker: "narrator",
      text: `You do not wait for the cocoa. You go at the sentry like a wet coat falling off a hook, and the cup goes one way and the man another, and by the time he has finished saying "Oh", you have the door open and the corridor under your feet. He sits up in the puddle, quite bewildered, holding his empty cup in both hands. "That's a nasty thing to do," he says. It is. You do not stop to agree.\n\nInside, an alarm bell, a very small one, goes off in some far room. It sounds, to your ear, as if someone has dropped a spoon.`,
      onEnter: [{ surv: 10 }, { xp: 1 }],
      choices: [{ text: "Run for the console room.", goto: "sab_hall" }]
    },

    sab_hall: {
      speaker: "narrator",
      voices: 3,
      text: `The console room is a long, low, hot, green-lit space full of valves and small dials and the slow ticking of a thing being very patient. A pair of vast reels turn in a rack. A wall of glass tubes glows blue-white. And between you and the great metal bulk of the broadcast console, in a chair too small for him, sits a heavy, tired man with a megaphone in his lap.\n\n"Student Voran," says Captain Brune, quite quietly, and the megaphone says it a second later, a little louder, through the habit of a lifetime. "I'm sorry about the volume. It's a condition. The doctor has a word for it." He sets the megaphone down on his knee. "I should say that I don't do heroics. I do shifts."`,
      interjections: [
        { skill: "empathy", min: 3, text: `He is a very tired man on the longest shift of his year. He has the face of someone who joined the Relay to be near an oven and has never forgiven the building for turning out to be a weapon.` },
        { skill: "instinct", min: 3, text: `He has not stood up. A man who does not stand up when an intruder enters the room is a man who has decided, privately, how this will go. It may be violence. It may be bargaining. It is not surprise.` }
      ],
      choices: [
        { text: "Walk past him as though he were furniture. He has been told to guard, not to look.", goto: "sab_voss", cond: "flag.brune_down" },
        { text: "\"Captain. I need to speak to the engineer.\" Use the voice that does not ask.", check: { skill: "authority", diff: 13, id: "finale_hub_sab_brune_auth", white: true, pass: "sab_brune_talk", fail: "sab_brune_lose" } },
        { text: "Offer him something. A ration coupon, a black-market ticket. A good night's sleep.", goto: "sab_brune_bribe", cond: "has('ration_coupon') || has('black_market_ticket') || has('thermos')" },
        { text: "Go for him. Fast.", check: { skill: "adrenaline", diff: 13, id: "finale_hub_sab_brune_fight", pass: "sab_brune_fight", fail: "sab_brune_lose" } },
        { text: "Wait for the Captain to look away.", check: { skill: "slip", diff: 14, id: "finale_hub_sab_brune_slip", pass: "sab_brune_sneak", fail: "sab_brune_lose" } },
        { text: "Tomas is already there with a tray of tea, and a very stupid expression.", goto: "sab_brune_tomas", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "Retreat.", goto: "hub" }
      ]
    },
    sab_brune_talk: {
      speaker: "authority",
      text: `You say it as if the question had been settled hours ago. Captain Brune, who has spent twenty years being told what to do in exactly this register, has already half-risen before he knows he has done it. "Sir," he says, and then, appalled at himself, "Miss. Student." The megaphone comes up, then down, in a clumsy little arc. "The engineer's in the vault. I... he's at his lunch."\n\n"Go and get him," you say. It is not a question. The Captain goes, with an expression of the blankest astonishment, like a man who has just found, in his own pocket, a key to a door he has been guarding for twenty years.\n\nBy the time he returns, you have already crossed the room.`,
      onEnter: [{ set: "brune_talked", val: true }, { xp: 3 }, { surv: 4 }],
      choices: [{ text: "Go on.", goto: "sab_voss" }]
    },
    sab_brune_bribe: {
      speaker: "narrator",
      text: `You lay it on the console between you: a ration coupon, a ticket for something nobody has mentioned, a thing that was once a thermos. He looks at it. He looks at it for a long, wondering time, as a man looks at a plate of food in a dream. "That is the most," says Captain Brune, "unprofessional thing that has happened to me this year. And I was at the party where the Deputy Sub-Director sang." He pockets it. "I have a dog at home called Ministry. She hasn't eaten properly since the spring."\n\nHe picks up the megaphone, looks at it, and sets it in a drawer. "I'm going to go and check the generator pressure. I'll be a quarter-hour. I may not be quick."`,
      onEnter: [{ set: "brune_bribed", val: true }, { xp: 2 }, { surv: 2 }],
      interjections: [
        { skill: "charm", min: 3, text: `A dog called Ministry. I'd like to meet her.` }
      ],
      choices: [{ text: "Go on.", goto: "sab_voss" }]
    },
    sab_brune_tomas: {
      speaker: "tomas",
      text: `Tomas comes round the corner of the rack with a tray of tea, three cups, a plate of Jubilee biscuits in the shape of tiny bells. "Captain," he says, in a voice like a man doing an impression of someone cheerful. "I thought you'd like a hot drink before the cue." He sets the tray down on the console. The Captain, who has been awake for thirty hours, looks at the biscuits with an expression of the purest gratitude, and it is clear that he has never in his life been given a biscuit by a subordinate who was not up to something.\n\nHe eats three. He drinks the tea. In four minutes he is asleep in his chair with the megaphone in his lap like a sleeping child with a toy.\n\n"Valerian," says Tomas Wend. "I stole it from the infirmary. I've been wanting to use it for nine years."`,
      onEnter: [{ set: "brune_down", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "charm", min: 3, text: `A man who drugs his captain with biscuits has a particular, unrepeatable charm. I am a little in love. I'd like to say so on the air.` }
      ],
      choices: [{ text: "Go on.", goto: "sab_voss" }]
    },
    sab_brune_fight: {
      speaker: "narrator",
      text: `You go in like a thrown brick. The megaphone goes one way and Captain Brune goes the other, a very heavy man in a very small chair, and the chair has a great deal to say about it. For a moment there is nothing but an elbow, a gasp and the loud, wounded creak of a floor under weight. You come up on top of him with your knee on his arm and your fist in the air and no idea how it got there.\n\n"Oh," says Captain Brune, from the floor. His voice, without the megaphone, is rather small and wondering. "That's a good one." He turns his head to look at the ceiling. "I'll lie here a bit, if that's all right. I don't think I'm any use for it tonight."`,
      onEnter: [{ set: "brune_down", val: true }, { surv: 15 }, { xp: 2 }, { hp: -1 }],
      choices: [{ text: "Go on.", goto: "sab_voss" }]
    },
    sab_brune_sneak: {
      speaker: "slip",
      text: `Not yet. Not yet. Not yet. The Captain is watching the dial. The dial is watching the Captain. The two of them have been watching each other for eleven years and it has not once occurred to either that a third party might be in the room. You go along the back wall like a rumour, round the end of the rack, under the lip of the console, through the narrow gap between the great reels. He sneezes. You freeze. He wipes his nose on a sleeve, and scratches a place under his collar, and turns the page of a newspaper.\n\nYou come out on the far side of him without having been present.`,
      onEnter: [{ set: "brune_passed", val: true }, { xp: 3 }],
      choices: [{ text: "Go on.", goto: "sab_voss" }]
    },
    sab_brune_lose: {
      speaker: "narrator",
      text: `"Ah," says Captain Brune, through the megaphone, with a long, gentle sigh, as if to a pupil who has made a very ordinary mistake. "I was afraid of that." He stands. He is much bigger standing. "Please don't struggle. I'd like to do this properly." A hand like a spade closes round your upper arm. "I'm going to sit you in the corner and ring the Inspector, and you are going to be quiet until he arrives. It's a very comfortable corner. It has a radiator."\n\nBehind him, the dials tick, patient as any clock. In four minutes, the cue.`,
      onEnter: [{ surv: 15 }, { hp: -1 }],
      choices: [{ text: "Sit in the corner.", goto: "fail_caught" }]
    },
    sab_voss: {
      speaker: "narrator",
      voices: 2,
      text: `You have a bare minute. The console room's red telephone rings once, and the clipped voice of the Relay's own loudspeaker says, in a warm, patient murmur, "Inspector Voss to the console room." There are steps in the corridor. Not hurried. Steps that have never in their lives hurried: a good coat on a bad stair.\n\nThe Inspector comes in, in a cloud of lemon and old tea, with a thermos in one hand and the other hand, you notice, empty. He looks at the vast console, the tubes, the reels, and at you. He closes the door behind him with his heel, softly.`,
      interjections: [
        { skill: "instinct", min: 3, text: `He is alone. Where are the grey coats? He has come in without the grey coats. He has left them at the gate, or they have been left at the gate for him. It is an invitation, or a trap, and you have no way to know which.` }
      ],
      choices: [{ text: "Face him.", goto: "voss_arrive" }]
    },
    sab_after_voss: {
      speaker: "narrator",
      text: `Whatever was said in that room, it is over. The Relay is yours, or as much of it as a student can hold. Behind the glass of the console room, a hundred valves glow blue and patient, and the cue is, by the clock, perhaps eleven minutes off. The hum goes straight through you. For the first time since you came in, you are able to hear what it is: not a machine, but a voice, a very long drawn-out voice, saying a single word to the district, over and over, in a language of pure pitch. The word is quiet.\n\nYou have to choose what to break.`,
      choices: [{ text: "Look at the machines.", goto: "sab_target" }]
    },
    sab_target: {
      speaker: "narrator",
      voices: 4,
      text: `Three things can be broken in this room, and each of them is a different sort of ending.\n\nThe generator, in the shed at the back, a great grey iron drum the size of a car, feeds the whole building and the district's wire. Break it and the Relay goes dark, and with it every loudspeaker on every pole, and the street lamps on the Avenue, and the light in the clinic on Cinder Street.\n\nThe aerial deck, up the ladder at the far end, is a small mercury switch behind a rack, labelled in capitals DO NOT. It carries the Harmony out over the air, and the wire. Pull it, and the Bell dies without a flicker, and every light in the district stays on.\n\nThe tape in the vault is only a tape. There are others.`,
      interjections: [
        { skill: "empathy", min: 3, repeat: true, text: `The clinic on Cinder Street has an iron lung on the second floor. It runs on the district's wire. I'd like that on the record before you pick up the wrench.` },
        { skill: "dialectics", min: 3, repeat: true, text: `A generator is an act of blunt force. An aerial switch is an act of precision. The consequences of the first are, in principle, unbounded. The second has, I am bound to observe, a smaller blast radius and a much smaller audience.` },
        { skill: "deduction", min: 3, repeat: true, text: `It had been observed that nothing in the room was labelled DO NOT except one thing. The man who wrote the label was, I deduced, a man who wished to be disobeyed. Possibly by a student. Possibly tonight.` },
        { skill: "adrenaline", min: 3, repeat: true, text: `GENERATOR. GENERATOR. THE BIG GREY DRUM. LOOK AT IT. IT WANTS TO BE HIT.` }
      ],
      choices: [
        { text: "The generator. Blunt force. Take it all down.", goto: "sab_gen_1" },
        { text: "The aerial deck. A quiet switch behind a rack. (Tomas knows where it is.)", goto: "sab_surg_1", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "The aerial deck. Find the DO NOT switch yourself.", check: { skill: "deduction", diff: 12, id: "finale_hub_sab_find_dn", white: true, pass: "sab_surg_1", fail: "sab_surg_lost" }, cond: "!(((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested))" },
        { text: "Think again. You are not ready to do this.", goto: "hub" }
      ]
    },
    sab_gen_1: {
      speaker: "narrator",
      voices: 3,
      text: `The generator shed is a roofed yard of oil and rust, smelling of hot iron, with a great grey drum at its centre that thrums like the chest of an enormous sleeping animal. Dials. A coolant valve the size of a dinner plate. A red lever, labelled in the careful capitals of a man who knew there would be one person in the world who wished to do this, BREAKER: DO NOT RELEASE UNDER LOAD.\n\nThe quickest way to kill a thing like that is to starve it of coolant, and then to let it think about its choices. The valve is rusted. The wheel is hot. A wrench would help. A wrench is, on the whole, what you do not have.`,
      interjections: [
        { skill: "brawn", min: 3, text: `It's a valve. It's a round thing that turns. Everything that turns turns eventually.` },
        { skill: "grit", min: 3, text: `It will burn your hands. It's only a hand. You have another. The other is for the lever.` },
        { skill: "senses", min: 4, text: `Hear that? The drum is beginning to labour under the Jubilee load. A sound like a man carrying a wardrobe upstairs. One good push and it would stop.` }
      ],
      choices: [
        { text: "Use the wrench. The one you picked up on the way.", goto: "sab_gen_2", cond: "has('wrench')" },
        { text: "Tomas comes in behind you with a spanner in his hand and a very pale face.", goto: "sab_gen_tomas", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "Wrench it off its seat with your bare hands.", check: { skill: "brawn", diff: 13, id: "finale_hub_sab_gen_brawn", pass: "sab_gen_2", fail: "sab_gen_burn" } },
        { text: "Take the glowing wheel in both fists and turn it, whatever it costs.", check: { skill: "grit", diff: 12, id: "finale_hub_sab_gen_grit", pass: "sab_gen_2", fail: "sab_gen_burn" } }
      ]
    },
    sab_gen_tomas: {
      speaker: "tomas",
      voices: 3,
      text: `He does not say anything for a moment. His face is the grey of old paper. He looks at the drum, the valve, the lever, at you, and then, slowly, deliberately, he sets down his tea. "No," says Tomas Wend. "Let me." He takes the wrench from your hand if you have one, or from the hook on the wall if you don't, and sets it to the coolant wheel with the easy, exact tenderness of a man putting a hand on the neck of an old horse. "I put in this valve myself. Nine years ago. I put it in so that it would never, ever stick."\n\nThe wheel turns. It turns with a long, shrieking, rusty cry. The coolant starts to leave. "There," he says. "It will take about two minutes to think about it. I'm going to stay. Somebody should be here when it does."`,
      onEnter: [{ set: "sab_tomas_stays", val: true }, { xp: 3 }, { morale: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `He has decided to be the person who is in the room when it happens. It is the bravest and the stupidest and the most natural thing in the world.` },
        { skill: "solidarity", min: 3, text: `Do not argue. If you argue he will have to defend it. Take his hand. He needs someone to have held it.` }
      ],
      choices: [
        { text: "\"Come with me. Please.\"", goto: "sab_gen_2", effects: [{ set: "sab_tomas_asked", val: true }] },
        { text: "Let him.", goto: "sab_gen_2" }
      ]
    },
    sab_gen_burn: {
      speaker: "narrator",
      text: `The wheel is a hot plate. The heat goes up your arms like a message from a stranger. For two long breaths it will not move, and then, with an enormous crack, it does, and you are on your knees in a pool of oil with a palm that has left half its skin on the iron and a smell in your nose that you will remember for the rest of your life.\n\nThe valve is open. It is a very expensive way to learn the temperature of a thing.`,
      onEnter: [{ hp: -3 }, { morale: -1 }],
      interjections: [
        { skill: "grit", min: 3, text: `It's only a hand. It's only a hand. It is, in all honesty, a bit more than a hand, but you still have the other.` }
      ],
      choices: [{ text: "Go on.", goto: "sab_gen_2" }]
    },
    sab_gen_2: {
      speaker: "narrator",
      voices: 3,
      text: `The drum begins to labour. The sound that comes out of it is a long, rising, shuddering note, like a very large man being told bad news, and the dials, one by one, swing toward red. The shed fills with a hot, bitter smell of scorched oil. The lever on the breaker, DO NOT RELEASE UNDER LOAD, is the last thing between you and the end of the district's evening.\n\nYou put both hands on it. It is warm and slick. It is the sort of lever that was designed by men who did not believe anyone would ever touch it. You think, very clearly, for no reason, of a boy in a cap with a bent spoon.\n\nThen you pull.`,
      onEnter: [{ sfx: "hit" }],
      interjections: [
        { skill: "adrenaline", min: 3, text: `PULL IT. PULL IT. PULL IT OFF THE WALL.` },
        { skill: "volition", min: 4, text: `There is a clinic with an iron lung, and a tram on the wires, and a child in a cradle in every third kitchen. You have decided that this is worth it. Say it to yourself, quietly, once, so it will be a decision rather than an event.` },
        { skill: "the_grey", min: 3, text: `I will go dark. I will go dark for you. I have been dark before, in the war, and I have remembered how.` }
      ],
      choices: [{ text: "Pull.", goto: "sab_dark" }]
    },
    sab_dark: {
      speaker: "narrator",
      voices: 4,
      text: `The breaker comes off the wall with a long, tearing, merciless crack. For a fraction of a second nothing happens. Then, in the dark of the generator shed, in the glow of the red dials, the whole drum draws a breath and holds it, and the lights of the Relay go out one at a time, from the back to the front, like the lamps of a street at the end of a long night.\n\nThe hum stops. You did not know until it stopped how loud it was. It has been in your fillings for three days. It goes out of the world like water out of a tub, and in the quiet where it was you can hear your own breath, and the generator ticking as it cools, and, from a very long way off, from the Avenue, from eleven thousand throats, a single long, rising, uncertain murmur.\n\nThe poles on Karsov Avenue have gone silent. The street lamps are dark. The Warden's face, forty feet high, on its banner, has been, quite suddenly, unlit.`,
      onEnter: [{ set: "sab_done", val: true }, { sfx: "static" }, { xp: 5 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `Dark. Oh, I remember dark. The whole district under me, holding its breath in the same moment. There are a hundred thousand windows. Not one has a lamp. It is the loudest quiet I have ever been part of.` },
        { skill: "solidarity", min: 3, text: `We are all in the dark. At the same time. For the first time since the Hunger Winter nobody can tell who is who. It is the kindest thing the district has ever been given.` },
        { skill: "empathy", min: 4, text: `Somewhere on Cinder Street a nurse has just picked up a hand-pump, and a doctor is counting aloud. I am sorry. I am very sorry. You did what you meant to, and this is the price. It is yours, now.` },
        { skill: "volition", min: 3, text: `Whatever follows, you have the next ten minutes. No bell. No tone. No Static. Stand still in them. They are the first of their kind in forty years.` }
      ],
      choices: [{ text: "Walk out of the dark.", goto: "sab_end_gen" }]
    },
    sab_end_gen: {
      speaker: "narrator",
      voices: 3,
      text: `You walk out of the shed into a night with no hum in it. The Avenue is black from end to end, and full of people. They are not rioting. That is the thing you will remember: that they are standing, in the dark, in their coats, with their paper flags, listening, and that nobody is afraid. In the dark of a district without a Bell, eleven thousand people are doing something they have not done in a generation. They are listening to each other breathe.\n\nA match flares. Then another. Then, here and there, small and uncertain, the first candles. Behind you, a man in a lab coat is sitting in the doorway of the generator shed with his head in his hands, and, in the long dark of the Avenue, a voice is beginning a song with no tune.\n\nThe whistles start about a minute later. They start at the Relay gate, and spread.`,
      onEnter: [{ ending: "end_silenced" }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Oh, it is so dark. Shall I turn the lights back on, friend? I know where the switch is. It is in the State. It has always been in the State.` }
      ]
    },

    sab_surg_lost: {
      speaker: "narrator",
      text: `You search the room as a man searches his pockets for something he knows he did not bring. A rack; another rack; a cabinet with a lock; a ladder going up into the dark. Nothing says DO NOT. Several things say, in quite the same bureaucratic voice, DO. You open a panel marked MAINTENANCE and a bell rings somewhere. A fuse blows. You lose four minutes and what is left of your composure.\n\nThere is only the generator. There always was. It is a blunt, easy, honest sort of ending, and it is, God help you, the one that was always going to be on the table.`,
      onEnter: [{ surv: 6 }, { time: 4 }],
      choices: [{ text: "Go to the generator.", goto: "sab_gen_1" }]
    },
    sab_surg_1: {
      speaker: "narrator",
      voices: 3,
      text: `The ladder is at the far end of the room, beside the antenna feed, a rusted iron thing that goes up into the dark of an aerial deck on the roof. It takes four minutes to climb, in the half-light, with a hand on each rung and a quiet certainty that this is the only part of the evening that will not be forgiven. The deck is a small iron cage, open to the sky, with a transmitting rack bolted down in the middle, and behind the third rack, at the end of a tangle of grey cable, a single mercury-wetted switch in a glass tube. In capitals on a plate: DO NOT.\n\nThe aerial hums under your hand, a thin high pitch like a mosquito that has taken holy orders. It is the whole Harmony, out over the roofs. It is a very small thing to hold.`,
      interjections: [
        { skill: "aim", min: 3, text: `A steady breath. A hair's breadth. Mercury is a heavy liquid, and the tube is glass; it will break if you strike it, and if it breaks the vapour is unkind. Take it out by the cap. Take your time. You do not have time.` },
        { skill: "reflex", min: 3, text: `The rungs are wet. The wind is up. If you slip, there is a very long way down. Your hand has already found the next rung.` }
      ],
      choices: [
        { text: "Draw the switch out by its cap, slowly, as if lifting a sleeping bird.", check: { skill: "aim", diff: 12, id: "finale_hub_sab_surg_aim", pass: "sab_surg_2", fail: "sab_surg_bad" } },
        { text: "Tomas, below, calls up the exact order of the cables. Follow his voice.", goto: "sab_surg_2", cond: "((flag.tomas_ready || flag.tomas_ally) && !flag.tomas_arrested)" },
        { text: "Smash it.", goto: "sab_surg_bad" }
      ]
    },
    sab_surg_bad: {
      speaker: "narrator",
      text: `The tube slips. It shatters on the rack with a sound like a very small bell, and a bright bead of mercury goes skittering across the deck and drops through a grating into the dark. The vapour is a thin sour taste. You hold your breath and retreat, and, as you retreat, you realise that it has worked: the aerial feed is dead, quite dead. The sudden silence of the little antenna is the loudest thing you have ever heard.\n\nIt is also, you realise, a great deal messier than the plan. There is mercury on your hand. There is the faint, wrong taste of metal in your teeth. It will pass, you are almost sure.`,
      onEnter: [{ hp: -2 }, { set: "sab_done", val: true }, { set: "sab_surgical", val: true }],
      choices: [{ text: "Climb down.", goto: "sab_surg_end" }]
    },
    sab_surg_2: {
      speaker: "narrator",
      voices: 3,
      text: `The switch comes out in your fingers like a tooth. The glass is warm. A drop of mercury runs up it and back, once, as though uncertain. You hold it for a moment in the dark, the small, quiet thing at the heart of a forty-year machine, and then you lay it down, very gently, on the iron grating, and the thin high note in the aerial rack falls a semitone, and another, and goes out.\n\nThere is no explosion. There is no blackout. Karsov Avenue stays lit. The poles continue to hum their small dull hum. Only the thing underneath them, the sweet second beat, the one that gets into the back of the eyes, has ceased, quite silently, like a mouth closing.\n\nThe cue, when it comes, will play a tape of music to a district that is perfectly awake.`,
      onEnter: [{ set: "sab_done", val: true }, { set: "sab_surgical", val: true }, { xp: 5 }, { morale: 2 }],
      interjections: [
        { skill: "aim", min: 3, text: `A held breath. A glass thing, in a bare hand. A hair's gap, and you didn't flinch. Take a note: that was the best thing you've done with your fingers.` },
        { skill: "the_grey", min: 3, text: `I felt the aerial go. It was a small, tight, bitter thread in my skin that I have had under me for eleven years. I did not know it was a thread until you cut it.` }
      ],
      choices: [{ text: "Climb down.", goto: "sab_surg_end" }]
    },
    sab_surg_end: {
      speaker: "narrator",
      voices: 3,
      text: `You climb down into the console room as the Address comes to its last sentence on the loudspeaker. There is a quarter of a minute. Tomas, or the Captain, or a man you do not know, will push the green button, and a pair of reels will turn, and a sweet and beautiful tune will go out along every wire and every wave in the district, and not one of the eleven thousand people on the Avenue will go to sleep.\n\nYou have time to say a few words to whoever is in the room, if you want. You do not take it. You walk out, past the vault, into the street, and stand a while, looking up, in the cold, at the long grey wall of the Warden's face, which has just begun to realise that nobody is listening. In the Courtyard, the choir starts the Anthem, and nothing happens, and keeps singing, and nothing happens, and keeps singing.\n\nThe whistles start about a minute later.`,
      onEnter: [{ ending: "end_silenced" }],
      interjections: [
        { skill: "volition", min: 3, text: `That was an act you can be hanged for. It was also an act that took nothing from anyone but the Bell. Stand with it. It will be one of the few things you ever do that has an exact edge.` }
      ]
    },

    // ---------------------------------------------------------------- ROUTE E: THE BLAME (end_martyr)
    mar_start: {
      speaker: "narrator",
      voices: 4,
      text: `There is a third kind of plan, and you have not wanted to look at it. It does not need a tape, or a tone, or a ledger, or a lever. It needs a student, a microphone and a very large lie.\n\nThe Union has never in its history been able to leave a case open. It must have a culprit, as the Jubilee must have a flag. Give them one, a seventeen-year-old with chalk on his hands and a notebook full of nonsense, and the Quiet Officers will close the file by morning. They will not look for a cell in a boiler room if the entire cell is you. They will not look for a woman with a ledger if the ledger was your idea. They will have their story, and a good one, and all of the people you would rather they forgot will be, in the Ministry's phrase, "of no interest".\n\nIt is a very elegant plan. It is also, you note, the only one in which you do not get to remember it.`,
      onEnter: [{ set: "finale_route", val: "mar" }],
      interjections: [
        { skill: "solidarity", min: 3, text: `We do not leave anyone behind. That is the entire rule, the only one we have. We do not send one of us up a stair alone and say we will see them at the bottom.` },
        { skill: "doublethink", min: 3, text: `Isn't it lovely, friend? To be so very useful? To be remembered as the villain by a district that would otherwise have forgotten you? A confession is the only form of literature that is always published.` },
        { skill: "volition", min: 3, text: `You will be the one standing there when they come. Decide now whether it is because you chose it, or because you ran out of other ways to be brave.` },
        { skill: "empathy", min: 4, text: `You are not doing this for the cause. You are doing it for a particular person you do not want to see taken away. You know who. Do it for them. It is the only reason that ever lasts.` }
      ],
      choices: [
        { text: "Go down to the Courtyard dais.", goto: "mar_walk" },
        { text: "Not like this. Not alone.", goto: "hub" }
      ]
    },
    mar_walk: {
      speaker: "narrator",
      voices: 3,
      text: `You go down. The spiral, the library, the Courtyard doors, and then the whole Jubilee at once like a hand in your face: the banners, the horns, the paper flags in eleven thousand hands, the choir in grey wool on its stand beneath the Warden's forty-foot face. At the head of the Courtyard, between the choir and the Statue of the Warden's Father, a low dais has been built out of packing-crates and red cloth, with a lectern, a microphone on a gooseneck, and a vase of paper roses that nobody will notice are paper.\n\nThe Principal stands behind it, in her good grey suit, with a folded speech.\n\nBeside the steps, in a red-brown uniform, eyes front, a hand's breadth from a baton, stands the guard of honour of the Youth Vanguard. At their head is a girl you know.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `The Courtyard under your feet is warm with eleven thousand pairs of soles. I have never carried so many. It is like being a floor in a cathedral.` },
        { skill: "composure", min: 3, text: `Walk like a person who has been asked to the dais. Posture. Pace. You are not an interloper: you are a student with an announcement.` }
      ],
      choices: [{ text: "Walk to the steps.", goto: "mar_dais" }]
    },
    mar_dais: {
      speaker: "narrator",
      voices: 3,
      text: `The crowd opens in front of you the way a crowd does in front of someone who looks as though they know where they are going. At the foot of the dais steps the guard of honour turns its eyes a quarter-inch toward you and, with perfect discipline, does nothing. The Principal's speech is in her left hand. Her right is on the lectern. She has seen you coming from a hundred feet and has not blinked. Her pearl earrings are very still.\n\n"{name}," says Principal Odalys Marr, in the small exact voice of a woman who has never in her life been surprised in public. "This is a state occasion."`,
      interjections: [
        { skill: "instinct", min: 3, text: `She is holding the lectern with her whole right hand. It is not for authority. It is because she is not sure of her knees.` }
      ],
      choices: [
        { text: "\"Principal. I have something to say to the district.\"", goto: "mar_marr_turned", cond: "flag.marr_turned" },
        { text: "Climb the steps. Do not stop.", check: { skill: "authority", diff: 13, id: "finale_hub_mar_steps_auth", white: true, pass: "mar_steps_pass", fail: "mar_steps_fail" }, cond: "!flag.marr_turned" },
        { text: "Smile at her. Hold out both hands. \"A very short announcement, ma'am. I'll be done in a minute.\"", check: { skill: "charm", diff: 13, id: "finale_hub_mar_steps_charm", white: true, pass: "mar_steps_pass", fail: "mar_steps_fail" }, cond: "!flag.marr_turned" },
        { text: "Go up the steps like a thrown stone.", check: { skill: "adrenaline", diff: 12, id: "finale_hub_mar_steps_adr", pass: "mar_steps_pass", fail: "mar_steps_fail" }, cond: "!flag.marr_turned" },
        { text: "Hob's bell rings out the hour early. Every head tilts toward the tower, and the Principal's with them.", goto: "mar_steps_hob", cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal) && !flag.marr_turned" },
        { text: "Turn around. Not like this.", goto: "hub" }
      ]
    },
    mar_marr_turned: {
      speaker: "marr",
      voices: 3,
      text: `"Yes," says Principal Marr, before you have finished. She looks at the speech in her hand, a clean page of Jubilee platitudes, six minutes long, typed on a good typewriter by a good secretary, and folds it very small, and then smaller, and puts it into the vase of paper roses. "I was going to say a thing about continuity. I find I have no feeling for continuity." She takes her hand off the lectern. Her knees, you see, are fine. "The microphone is yours. I have, as it happens, been asked to see to the audio. I shall see to it. For as long as I am asked."\n\nShe steps down from the dais. It is a very small step for a very small woman, and it is the longest she has ever taken.`,
      onEnter: [{ set: "mar_dais_clear", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She has just put her own speech into a vase and walked away from forty years of being the person it was written for. She is not smiling. She looks, for the first time, about the age she is.` }
      ],
      choices: [{ text: "Take the lectern.", goto: "mar_rhea" }]
    },
    mar_steps_pass: {
      speaker: "narrator",
      text: `You do not stop. You go up the steps as if the dais were a thing that had been built for you, and the Principal, who has spent forty years learning to read a person's intentions off the angle of their shoulders, reads yours and finds nothing she can answer. She opens her mouth. She closes it. "Student Voran," she says, with a faint, dry, appalled admiration, "this is going to be extremely irregular." She steps one pace back from the lectern, with the courtesy of a woman who has just been out-manoeuvred by a first-year.\n\nThe microphone is at the level of your mouth. The gooseneck is a little too high. You adjust it, and you notice that your hand is perfectly steady.`,
      onEnter: [{ set: "mar_dais_clear", val: true }, { xp: 2 }, { surv: 5 }],
      choices: [{ text: "Look down at the Courtyard.", goto: "mar_rhea" }]
    },
    mar_steps_hob: {
      speaker: "narrator",
      text: `The Great Bell rings. It is early, and it is not a bell for any hour on the programme, a single long stroke, a quarter-turn off its arc, that shakes the Courtyard like a dropped plate. Every head in the crowd goes up; the Principal's with them. In the half-second in which a state occasion forgets to look at a girl on its steps, you are up them and at the lectern, and the Principal turns back to find, standing at her microphone with your hand on the stem, a student she has had to deal with twice this week.\n\n"You are very good at this," she says, almost kindly. "I had been under the impression you were merely lucky."`,
      onEnter: [{ set: "mar_dais_clear", val: true }, { xp: 2 }, { surv: 3 }],
      choices: [{ text: "Look down at the Courtyard.", goto: "mar_rhea" }]
    },
    mar_steps_fail: {
      speaker: "marr",
      text: `"No," says Principal Marr, quite gently, and puts one small hand flat on your chest. It is as light as a leaf. "I think we shall not." The guard of honour, which has been doing nothing with great discipline, has begun, with great discipline, to turn. "You are overwrought. It is entirely natural. It has been a very difficult week for the School." The hand does not move. "I shall have somebody take you to the infirmary. It is only a precaution."\n\nBehind her, from the choir stand, comes a thin, sharp, nervous noise, as Fenwick Alder's baton, in his shaking hand, strikes the edge of the podium. A girl in a Vanguard uniform has turned her head and is watching, very carefully, without expression. Whatever happens now has to be quick.`,
      onEnter: [{ surv: 6 }, { add: "mar_trouble", n: 1 }],
      choices: [
        { text: "Duck her hand and go up the steps anyway.", check: { skill: "reflex", diff: 12, id: "finale_hub_mar_steps_ref", pass: "mar_steps_pass", fail: "mar_steps_lost" } },
        { text: "Speak over her, to the Courtyard, as loud as you can.", goto: "mar_rhea", effects: [{ set: "mar_dais_clear", val: true }, { surv: 10 }] }
      ]
    },
    mar_steps_lost: {
      speaker: "narrator",
      text: `The hand is not where you thought. It is in your collar, light and quite impossible to break, and the other is on your arm, and between them you are, very gently, stopped. "Cadets," says Principal Marr, in a conversational voice. "I should like this young person taken to the infirmary, please." Two of them come up the steps. You see, at the far side of the guard of honour, a girl with slicked hair watching you go with an expression that might be anything.\n\nThey are very polite. That is what you will remember: how polite it is.`,
      onEnter: [{ surv: 15 }],
      choices: [{ text: "Go with them.", goto: "fail_caught" }]
    },

    mar_rhea: {
      speaker: "narrator",
      voices: 3,
      text: `From the lectern you can see the whole of it: the choir on its stand in rows, a first-year's cap bobbing in the third row of the crowd, the Statue of the Warden's Father with his hand out as if to test the rain, and at the foot of the dais, in the red-brown of the Youth Vanguard, with her cap square and her eyes fixed on a point exactly over your head, Rhea Vantage.\n\nShe has seen you reach for the microphone. She is the only person in the Courtyard who has any idea what you are about to say, and she has never, in her life, looked more composed.`,
      interjections: [
        { skill: "empathy", min: 3, text: `She is not looking at you. She is looking at the exact place where, in two minutes, you will say her crime out loud. She has stood in that place before. She does not know how to stand anywhere else.` }
      ],
      choices: [
        { text: "She steps up beside you. \"Don't. It was me. It's been me the whole time.\"", goto: "mar_rhea_confess", cond: "(flag.rhea_ready || flag.rhea_turned)" },
        { text: "Look at her. Say nothing. Let her see that you know.", goto: "mar_rhea_silent", cond: "!((flag.rhea_ready || flag.rhea_turned))" }
      ]
    },
    mar_rhea_confess: {
      speaker: "rhea",
      voices: 3,
      text: `She comes up the steps in three strides, with a clipped, immaculate, ruinous correctness, and takes you by the wrist. "No." It is a whisper, and it has a command in it, and under the command, like a wire, something trembling. "You are not going to say it. You were not there. I was." She is very white. "I have been rehearsing it since Tuesday: I would say to Lieutenant Kell, or to the Inspector, or to nobody. I have never been able to say it to a person who was going to be brave about it first."\n\nShe turns to the lectern. "Let me. It's mine. You've done enough. You gave me the page." She is trying not to cry, and she is doing it in a Vanguard uniform, in front of eleven thousand people, as if it were a drill.\n\nIt is, you realise, the most dreadful, most generous and most stubborn argument you have ever lost.`,
      onEnter: [{ set: "mar_rhea_wants", val: true }, { xp: 3 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `We have two, now. Two of us fighting to take the same blame at the same microphone. It is an extraordinary thing to be present at. It is exactly what we always hoped we'd be like, and exactly what we always feared.` },
        { skill: "volition", min: 4, text: `This is the point on which the whole evening turns. If she speaks, the Ministry gets its killer and a Vanguard sergeant is shot. If you speak, the Ministry gets a student and the killer lives. Neither is a good arithmetic. Choose which grief you can carry.` }
      ],
      choices: [
        { text: "\"Let go, Rhea. If you speak, they shoot you. If I speak, they only lose me.\"", check: { skill: "empathy", diff: 12, id: "finale_hub_mar_rhea_hold", pass: "mar_rhea_back", fail: "mar_rhea_goes" } },
        { text: "\"Then we do it together.\"", goto: "mar_rhea_together" }
      ]
    },
    mar_rhea_back: {
      speaker: "rhea",
      text: `She looks at you for a very long time. Then, slowly, she lets go of your wrist, one finger at a time, as one releases a thread. "That is a bad argument," she says. "It is also the only argument I've ever been given that I didn't want to refute." She steps down, a stair at a time, to her place at the head of the guard of honour, and turns to face the dais with her hands behind her and her eyes fixed on a point over your head.\n\nBut the point has moved, you see. It is not fixed any more. It is exactly where your face is.`,
      onEnter: [{ xp: 3 }, { morale: 1 }, { set: "mar_rhea_silent", val: true }],
      choices: [{ text: "Turn to the microphone.", goto: "mar_allies" }]
    },
    mar_rhea_goes: {
      speaker: "rhea",
      text: `"No," says Rhea Vantage. It is quite soft, and it is the end of the discussion. She steps in front of you, takes hold of the microphone's stem, and says, in a clear, high, bell-like voice that goes out to every pole in the Courtyard: "I am Rhea Vantage, Enforcer-Junior of the Youth Vanguard. On Tuesday morning I killed Commissar Ostrov Dane, by order, in the gymnasium, and staged it as a suicide. I would like to say that I am sorry. I would also like to say that it was an order, and that I have just read the order, and I should like it read aloud."\n\nThe Courtyard, which has been so full of sound, is quite silent. The Principal has gone the colour of her suit.\n\nIt is, you realise, not what you wanted. It is also, perhaps, what she needed.`,
      onEnter: [{ set: "mar_rhea_confessed", val: true }, { set: "mar_dais_clear", val: true }, { surv: 15 }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `You have lost the argument and she has won her freedom, if freedom is what this is. I am very proud of her and I am very afraid.` }
      ],
      choices: [{ text: "Stand beside her.", goto: "mar_allies" }]
    },
    mar_rhea_together: {
      speaker: "narrator",
      text: `You stand shoulder to shoulder at a lectern built from packing crates, a student in a torn uniform and a Vanguard sergeant in a perfect one. For a moment you both look at the microphone as one looks at a very large dog. Then Rhea Vantage, whose hand is quite steady, takes the gooseneck and bends it, with a precise soft click, to a height at which two people can speak into it.\n\n"Right," she says. "On three." She doesn't say what happens on three. She never has been able to say what happens on three.`,
      onEnter: [{ set: "mar_rhea_together", val: true }, { xp: 3 }, { morale: 2 }, { surv: 10 }],
      choices: [{ text: "Turn to the microphone.", goto: "mar_allies" }]
    },
    mar_rhea_silent: {
      speaker: "narrator",
      text: `You look at her. She looks at the point over your head. For a long moment neither of you gives the other anything, two people standing on opposite sides of a short flight of steps, each holding a very large secret. Then something moves in her face, a muscle along the jaw that she has trained out of all her other muscles, and her eyes come down, slowly, and meet yours. There is a question in them. You do not answer it. You only give the smallest of nods.\n\nShe understands. You see it arrive. She is not grateful. She does not know what to do with it. For the first time in your acquaintance, Rhea Vantage is looking at someone as if they were a mystery.`,
      onEnter: [{ set: "mar_rhea_silent", val: true }, { xp: 2 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `Two small silences in a very large square. It is the most honest conversation anyone has had on these cobbles in a decade.` }
      ],
      choices: [{ text: "Turn to the microphone.", goto: "mar_allies" }]
    },

    mar_allies: {
      speaker: "narrator",
      voices: 3,
      text: `You have a few seconds, and a few seconds is about the length of a person's loyalty. A single flicker at the edge of the dais, a face in the crowd, the shape of a hand lifted from a pocket. It is the people you did not ask. Without a word, one by one, each of them has decided to do something small and stupid about it.`,
      interjections: [
        { skill: "solidarity", min: 3, repeat: true, text: `Look. Look at them. That is what we are. Not an army. A great many small stupid brave things, each done at the edge of someone's attention.` }
      ],
      choices: [
        { text: "At the edge of the crowd, Lieutenant Kell lifts one hand and lowers it, a signal you recognise: the rope is in her locker. The rope will say it was you.", goto: "mar_ally_vasha", cond: "(flag.vasha_ready && !flag.vasha_betrays)", once: true },
        { text: "A broad grey man in overalls steps out of the crowd and stands, with his cap in his hand, at the foot of the dais.", goto: "mar_ally_osk", cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)", once: true },
        { text: "A first-year in a cap too big for her slides a folded paper into your sleeve. She was gone before you saw her face.", goto: "mar_ally_wren", cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)", once: true },
        { text: "At the back of the crowd, in the black coat of a tram conductor, a woman is smoking and looking at her watch.", goto: "mar_ally_nadia", cond: "(flag.nadia_ready || flag.nadia_ally)", once: true },
        { text: "From the boiler-room grating beside the statue comes the faint, unmistakeable smell of a cigarette. And a whisper.", goto: "mar_ally_anka", cond: "flag.anka_ready", once: true },
        { text: "Step to the microphone.", goto: "mar_script" }
      ]
    },
    mar_ally_vasha: {
      speaker: "vasha",
      voices: 3,
      text: `You find her in the crowd with your eyes, once, over the heads, and she is already looking. She does not smile. She has her cigarette between two fingers, unlit. She taps it, twice, against the bad knee, which is the signal you agreed on a Wednesday, in a gym, without either of you saying what it meant. Then she lifts two fingers to her lips: the rope.\n\nThe rope is in her locker. The rope has your handprints on it, because you picked it up on Tuesday and put it down again. She has already decided what it will say. She is going to hand it to the first man in a grey coat who asks. She will be, in the Union's records, the lieutenant who found the evidence and did her duty.\n\nShe holds your eye one more second. It is a salute. It is the only one she has ever given.`,
      onEnter: [{ set: "mar_vasha_rope", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is going to be thanked for betraying you. She will wear the thanks for the rest of her life, like a coat that doesn't fit. She has chosen it. It is her way of being in the confession.` }
      ],
      choices: [{ text: "Nod. Turn back.", goto: "mar_allies" }]
    },
    mar_ally_osk: {
      speaker: "osk",
      text: `Osk stands at the foot of the dais with his cap in both hands, turning it by the brim. He has never been asked to say anything in public in thirty-one years. He does not say it now. He only looks up at you, with the broad, mild, deaf face of a man who has swept up after every Jubilee since the old Warden, and clears his throat.\n\n"Saw you," he says, to the men in grey coats who have begun to drift toward the steps, to the guard of honour, to anyone. He says it loudly, as if talking to someone in the next room. "Two minutes after two on Tuesday morning. Leaving the gym. Saw you plain." He nods. "I've been wanting to say so. Nobody asked."\n\nIt is the most useful lie he has ever told, because it is true.`,
      onEnter: [{ set: "mar_osk_witness", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `He is giving you your own alibi back as evidence. He knows exactly what he is doing. He has put his own safety in a pocket for you and is wearing the pocket on the outside.` }
      ],
      choices: [{ text: "Nod. Turn back.", goto: "mar_allies" }]
    },
    mar_ally_wren: {
      speaker: "wren",
      text: `The paper in your sleeve says, in huge, uneven, joyous capitals: I HAVE THE LEDGER PAGES. ALL OF THEM. IN MY CAP. I AM GOING TO LEAVE THEM IN THE PLINTH OF THE STATUE AND THE MORNING AFTER ANYONE WHO CAN READ WILL FIND THEM. DO NOT WORRY ABOUT ME. I TOLD THEM I WAS LOOKING FOR MY MOTHER. THEY BELIEVE IT BECAUSE I AM VERY SMALL. THIS IS THE BEST NIGHT OF MY LIFE.\n\nUnderneath, in smaller letters: I WON'T FORGET YOU. I PROMISE. I'M GOING TO WRITE IT ON MY ARM.\n\nYou look up. In the third row of the crowd, a cap has come off, and a very small head with a very large grin has bowed to you with the stern solemnity of a general.`,
      onEnter: [{ set: "mar_wren_pages", val: true }, { xp: 3 }, { morale: 3 }],
      choices: [{ text: "Fold the note. Turn back.", goto: "mar_allies" }]
    },
    mar_ally_nadia: {
      speaker: "nadia",
      text: `Nadia Fell is smoking against a lamp-post at the very back of the Courtyard crowd, in a black conductor's coat, with her cap over one eye and a tram token in her other hand, which she is turning over and over with her thumb, like a dealer doing a trick. She sees you see her. She lifts the token, not far, an inch, and puts it behind her ear. Then she points, with the cigarette, down the Avenue, at a small, square, yellow tram sitting at an unusually bad angle across the line.\n\n"Night tram goes in ten minutes," she mouths. "Whoever wants to be on it." She shrugs. "I put them on a route. I don't ask for papers. It's not charity. It's tram-keeping."\n\nShe knows what you are going to do. She does not think much of it. She is going to hold the tram for whoever comes.`,
      onEnter: [{ set: "mar_nadia_tram", val: true }, { xp: 2 }, { morale: 1 }],
      choices: [{ text: "Nod. Turn back.", goto: "mar_allies" }]
    },
    mar_ally_anka: {
      speaker: "anka",
      voices: 3,
      text: `The boiler-room grating is at the foot of the statue, a rusted square of iron in the cobbles with a scrap of warm air coming through it, smelling of ammonia, chalk and Anka's cigarettes. The voice that comes up through the bars is low, dry and quite unhurried. "I told you," says Mother Anka, "that I did not want you to be a hero." A drag. "I told you I wanted you alive on Friday."\n\n"I know." You do not turn your head.\n\n"I know you know." A long pause. "The chairs are all leaving by the coal chute. Eleven of them, in twenty minutes. I shall stay for the stove. Somebody should." Another pause. "Whatever you say up there, say it so that the ones who can hear it will understand the part that isn't a lie." And, much more quietly: "You were the best courier we ever had. You had a note for everything."`,
      onEnter: [{ set: "mar_anka_leaves", val: true }, { xp: 3 }, { morale: 3 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `She is telling us we will be all right. She is telling us in the language of a woman who does not say such things. We have been waiting for it all our lives. It is, as it turns out, a very small sentence.` }
      ],
      choices: [{ text: "Say nothing. Turn back.", goto: "mar_allies" }]
    },

    mar_script: {
      speaker: "narrator",
      voices: 3,
      text: `The microphone is in front of you, a chrome head on a gooseneck, the grille a little dented, with a pilot lamp winking like an eye. Eleven thousand people have gone quiet. You feel the whole of the Courtyard lean in, like a thing drawn on a string.\n\nYou have a minute. It must be a very good minute. It must be a confession the Ministry will find tidy, and plausible, and which gives them nothing at all that they did not already have. It must be, in other words, a lie of exactly the right shape.\n\nWhat will you claim?`,
      interjections: [
        { skill: "rhetoric", min: 3, text: `A confession is a performance. It is the only genre in which the audience is paid to believe you. Choose your lines as you would choose a costume.` },
        { skill: "doublethink", min: 3, text: `Say you did it all, friend. Say it with feeling. It is so much easier when you mean it. And in a very little while, you will.` }
      ],
      choices: [
        { text: "\"I was alone. There was no Undercurrent. There never was: it was only me.\"", goto: "mar_speech_alone" },
        { text: "\"I was alone. And I killed the Commissar.\"", goto: "mar_speech_murder" },
        { text: "\"I am the Ledger. Take me, and nothing else.\" (Say nothing of what it said.)", goto: "mar_speech_ledger" },
        { text: "Not like this.", goto: "hub" }
      ]
    },
    mar_speech_alone: {
      speaker: "narrator",
      voices: 3,
      text: `"There was no Undercurrent." Your voice goes out across the Courtyard in a single warm wave. "I would like the district to know that. There was no cell in the boiler room, no teacher, no friend, no circle of chairs. Anything you have heard about such a thing was me. I wrote the notes. I took the chalk. I started the rumour, and I fed it, and I am the only one who ever believed it." You wait for a laugh. There is none. "It was a game for a very lonely person. I am sorry. I would like to apologise to the Union for the trouble."\n\nIt is a very small, very sad, very credible thing to say. A seventeen-year-old in a torn uniform has just imagined, in public, an entire resistance, so as to have somebody to be. You watch the crowd believe it. It is, you realise, a brilliant lie, because it contains the one thing that no lie can fake: the exact smell of loneliness.`,
      onEnter: [{ set: "mar_claim_alone", val: true }, { xp: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `That was true, a little. The part about the lonely person. Some small piece of that is simply you, and the crowd could hear it.` },
        { skill: "solidarity", min: 3, text: `We are not nobody. We were never only you. Say it again, quietly, to the cobbles, so it is a thing that was said.` }
      ],
      choices: [{ text: "Go on.", goto: "mar_belief" }]
    },
    mar_speech_murder: {
      speaker: "narrator",
      voices: 3,
      text: `"There was no Undercurrent. And I killed Commissar Dane." The Courtyard draws one breath, a sound like a very large sheet being shaken out. "On Tuesday morning, about two o'clock, in the gymnasium. I hanged him from the hoop with the climbing rope, and I tore the Warden's portrait to hide what I had done. I was alone. I was not told to. Nobody told me anything." You make yourself say the next part slowly. "I am a student of this school. I would like to apologise to the Commissar's family. I would like to apologise to the caretaker, who was blamed."\n\nIn front of the dais, a girl in red-brown stands motionless, the whole length of her spine rigid, her eyes on a point over your head. She has just been given something nobody has ever given her: a murder she did not have to carry.`,
      onEnter: [{ set: "mar_claim_alone", val: true }, { set: "mar_claim_murder", val: true }, { xp: 3 }, { surv: 10 }],
      interjections: [
        { skill: "empathy", min: 3, text: `You have just taken a dead man's death onto your own head to protect his killer. You will have to decide, for the rest of your short life, whether that was mercy or the exact thing the Ministry wanted. I do not know either.` },
        { skill: "dialectics", min: 3, text: `Note that it is the only version in which the Ministry has no reason to look further. A killer who confesses is a killer who closes a case. Observe how little they will ask.` }
      ],
      choices: [{ text: "Go on.", goto: "mar_belief" }]
    },
    mar_speech_ledger: {
      speaker: "narrator",
      voices: 3,
      text: `"I took something that did not belong to me." You say it quite clearly, and you do not say what it was. "A book. A slim green cloth book, belonging to the Union. I read it. I kept it. I have decided, tonight, in front of you all, that I was wrong to do so, and I would like to hand myself over to whoever will have me." The word Ledger does not escape you. The word Bell does not escape you. You say nothing about Relays or Harmony or hours.\n\nBut in the Courtyard, in the crowd, there are a hundred people who heard the words "a book," and who will wake tomorrow, with a pencil in the pocket, and a vague, strange tug at the back of the head, and look at the shelf where a green cloth book once stood.\n\nIt is the smallest confession you can make. It is also, perhaps, the only one in which you say nothing you do not mean.`,
      onEnter: [{ set: "mar_claim_ledger", val: true }, { xp: 3 }],
      choices: [{ text: "Go on.", goto: "mar_belief" }]
    },
    mar_belief: {
      speaker: "narrator",
      voices: 3,
      text: `The trouble with a lie of this shape is that it must be believed by exactly the wrong people: by a Principal who is paid not to, by a Vanguard guard who has seen it done a hundred times, by a Ministry that knows, with the professional certainty of a locksmith, the sound of a thing being made up. You have to make them believe it for as long as it takes. Not for the whole of the rest of your life. Only for the one night.\n\nYou can feel them weighing it. Behind you, among the paper roses, the Principal has gone very still. At the foot of the steps, a pair of men in grey coats exchange the most imperceptible nod.`,
      interjections: [
        { skill: "composure", min: 3, text: `Face. Posture. Hands. Do not look at the people it protects. Whatever you do, do not look for them in the crowd.` },
        { skill: "volition", min: 3, text: `You can do this. You have only to keep saying it until they have all agreed to be tired.` }
      ],
      choices: [
        { text: "Say it as if it were the truest thing you had ever said.", check: { skill: "rhetoric", diff: 12, id: "finale_hub_mar_belief_rhet", pass: "mar_believed", fail: "mar_doubted" } },
        { text: "Let your face go quite blank. Give them nothing at all to doubt.", check: { skill: "composure", diff: 12, id: "finale_hub_mar_belief_comp", pass: "mar_believed", fail: "mar_doubted" } },
        { text: "Say it in the State's own voice. Let them hear a confession composed by a professional.", check: { skill: "doublethink", diff: 11, id: "finale_hub_mar_belief_dt", pass: "mar_believed", fail: "mar_doubted" } },
        { text: "Just say it. Whatever comes.", goto: "mar_doubted" }
      ]
    },
    mar_believed: {
      speaker: "narrator",
      voices: 3,
      text: `It lands. You feel it land, exactly, like a stone dropped into a well that you cannot see the bottom of. The Principal lets out a small, dry breath. The men in grey coats at the foot of the steps lower their eyes, one after another, to the cobbles, in the polite, professional manner of men who have just seen the end of a long file. Across the Courtyard a murmur begins that is not outrage and not disbelief: it is the sound of a district being told a story, and accepting it with gratitude because it is simple.\n\nIt is, you realise, going to work. They are going to take you away, and they are going to close the book, and in a very short while no one will have any reason to look in a boiler room for a woman with a stove.`,
      onEnter: [{ set: "mar_believed", val: true }, { xp: 4 }, { morale: 1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Oh, you have done so well, friend. Look how well. A perfect confession. They'll have it framed. I could not have done it better myself, and I wrote most of it.` },
        { skill: "the_grey", min: 3, text: `A lie told for love lasts longer than a truth told for sport. I have known this for sixty years. I have it in the foundations.` }
      ],
      choices: [{ text: "Step back from the microphone.", goto: "mar_voss" }]
    },
    mar_doubted: {
      speaker: "narrator",
      text: `It sounds like what it is: the confession of a very frightened child. You hear it go flat in the air. You see, at the foot of the steps, a pair of eyebrows rise in a grey-coated face, and a pencil being taken out. Somebody in the crowd coughs, quite pointedly. The Principal does not look at you. She looks at the Vanguard guard, and the Vanguard guard, as one, looks at the nearest man in a grey coat.\n\nThey do not believe you. They will pretend to for a while, because it is convenient. But there will be questions. There will be questions in a room, and the questions will start with the words, "And who helped you?"`,
      onEnter: [{ set: "mar_doubted", val: true }, { surv: 10 }, { morale: -2 }],
      choices: [{ text: "Step back from the microphone.", goto: "mar_voss" }]
    },
    mar_voss: {
      speaker: "narrator",
      voices: 2,
      text: `A hand touches your elbow. It is not rough. It is a gloved hand, dry and cool, and the voice that comes with it is low and dry and quite unmistakable. "That," says Inspector Hale Voss, at your ear, "was an extremely tidy piece of work." You turn. He has come up the dais steps with a folding chair under his arm and a thermos in his hand, in his good coat, in front of eleven thousand people, and nobody has so much as turned their head.\n\n"I should like a word," he says, "before they take you. I would not ask, otherwise."`,
      choices: [{ text: "Hear him out.", goto: "voss_arrive" }]
    },
    mar_after_voss: {
      speaker: "narrator",
      voices: 3,
      text: `Whatever was said between you, it is done. The Inspector stands a little way off, with the chair folded under his arm, looking at the Courtyard, at the paper roses, at the choir on its stand; and the men in grey coats, who have been waiting for an order, are waiting, apparently, still.\n\nThe last light goes out of the sky. The horns hum. The Address has begun, a warm voice rolling out across the Courtyard, and for the first time in your life it is not speaking to you. It is speaking about you, or about someone very like you, in the past tense. The Grand Harmony will follow. The district will not remember that you stood here. It will remember a story the Ministry tells. It will remember it, you think, with a faint, lingering, unaccountable affection.\n\nThere is a hand on your arm again. It is a stranger's. It is quite gentle.`,
      interjections: [
        { skill: "volition", min: 3, text: `You are being taken. You have chosen it. Say that once more, in your own head, and then do not say it again. A thing said too often becomes a slogan.` },
        { skill: "the_grey", min: 3, text: `I will hold the cobbles where you stood. I will hold the shape of your shoes in the moss. They will wipe the district's mind. They cannot wipe a wet stone.` }
      ],
      choices: [{ text: "Go with them.", goto: "mar_end" }]
    },
    mar_end: {
      speaker: "narrator",
      text: `They put you in the black car, and the black car moves off down Karsov Avenue, through a district that has been told to be happy and is making, on the whole, a very good attempt. The Jubilee goes by the windows in strips: a banner, a flag, a face, a lamp, a pole. Somebody has hung bunting on a loudspeaker. A child on a man's shoulders waves at the car, because it is a good car. You wave back.\n\nAt the far end of the Avenue the Relay's one yellow window grows larger. Behind you, from a long way off, the cue-tone sounds, a single clear note, and then the Grand Harmony, sweet and long, begins. You feel it arrive in the back of your skull like a hand on a shoulder, and, for the first time in three days, you let it.\n\nBut you do not forget. You have a ringing in your ears. You always did.`,
      onEnter: [{ ending: "end_martyr" }]
    },

    // ---------------------------------------------------------------- ROUTE F: THE NIGHT TRAM (end_exodus)
    exo_start: {
      speaker: "narrator",
      voices: 4,
      text: `There is a tram. There is always a tram. Number 9, yellow and square, the last one out, standing at the stop at the far end of Karsov Avenue under a lamp that has been burning since the war. Its wires run east. Eleven minutes along them, at Cinder Bridge, the district ends: a line on a map, a rail across a river, a sentry-box nobody has manned since the amnesty. The Harmony's reach stops there. Not by law. By physics: the horns are only so loud.\n\nA person on a tram at the cue, on the far side of that bridge, would hear the first bar of the Grand Harmony faint as a radio in the next flat, and would remember everything. Everything that happened. Everyone. It would be a very lonely thing to remember, in a country where nobody else did. It would also be, almost alone among the evening's choices, a way of staying yourself.`,
      onEnter: [{ set: "finale_route", val: "exo" }],
      interjections: [
        { skill: "the_grey", min: 3, text: `I end at the bridge. I have always known where. It is the one place in the district where I feel the world getting wider. I should like to see it from the other side, once, through your eyes.` },
        { skill: "solidarity", min: 3, text: `Who would we take? Whom would we leave? We always said we would never be the sort to ask. It turns out it is the only question.` },
        { skill: "volition", min: 3, text: `Running is not the same as cowardice. It is only a very large decision that looks like one. Decide which it is for you, and then do not argue with yourself about it on the tram.` },
        { skill: "doublethink", min: 3, text: `Leave, friend? Of course. How very sensible. It is only a district. It was only ever a place you were put.` }
      ],
      choices: [
        { text: "Go to the tram stop. Quickly.", goto: "exo_stop", cond: "time < 1195" },
        { text: "It is almost too late to catch it. Run anyway.", goto: "exo_late", cond: "time >= 1195" },
        { text: "Not yet.", goto: "hub" }
      ]
    },
    exo_late: {
      speaker: "narrator",
      text: `You are late. You are very late. You reach the end of the Avenue with a stitch in your side and a district's worth of coats round you, in time to see the last tram move off from the stop in a long, slow, creaking curve, its single yellow window lit, its bell going once, twice, with great gentleness. A cap leans out of the driver's door: Nadia Fell, one hand on the wires. She sees you. She lifts two fingers to the peak, a salute, a goodbye. The tram does not stop. It cannot. It is carrying someone's whole life.\n\nOn the roofs above you the Address winds toward its close. There will be another tram. It will not be tonight.`,
      onEnter: [{ morale: -3 }],
      interjections: [
        { skill: "stamina", min: 3, text: `One more corridor. Not that one. The corridor ended. I am sorry.` }
      ],
      choices: [
        { text: "Run after it. Try to catch the rear step.", check: { skill: "reflex", diff: 14, id: "finale_hub_exo_late_run", pass: "exo_late_pass", fail: "exo_late_fail" } },
        { text: "Let it go. Go back.", goto: "hub" }
      ]
    },
    exo_late_pass: {
      speaker: "narrator",
      text: `You do not decide. Your feet do. You go down the Avenue like a thrown glove, across the rail, along the wires, and the tram, whose driver has seen you in her mirror and, being a person of a particular temperament, has not slowed, is moving at a walking pace that is exactly, precisely, the speed of one pair of lungs. A rail. A step. A brass handrail that is warm with someone's hand. You take it. You are on.\n\n"Mind the door," says Nadia Fell, without turning her head. "I don't open it twice."`,
      onEnter: [{ xp: 3 }, { morale: 2 }],
      choices: [{ text: "Climb in.", goto: "exo_stop_in" }]
    },
    exo_late_fail: {
      speaker: "narrator",
      text: `The brass handrail slides out of your fingers by a hand's breadth. You hit the cobbles on your knees with a sound like a dropped book. The tram's bell goes again, once, quite softly, far down the Avenue, and then the wires take it, and it is gone, a little yellow window on a long dark string, shrinking, going out.\n\nThere is a district behind you. There is a cue in a quarter of an hour. And you are standing in the middle of a road, on both knees, with a ringing in your ears, watching the only way out go home.`,
      onEnter: [{ hp: -2 }, { morale: -3 }],
      choices: [{ text: "Get up.", goto: "fail_forgotten" }]
    },

    exo_stop: {
      speaker: "narrator",
      voices: 3,
      text: `The tram stands at the end of the Avenue, where the cobbles give way to rail, its bell hanging quiet under a lamp. A woman in a black conductor's coat leans against the front step, a cigarette in her fingers, a leather satchel across her hip with its brass clasp shut. Behind her, along the whole length of the street, the Jubilee roars quietly to itself like a sea heard through a wall. Nobody is boarding. Nobody has noticed there is a tram.\n\n"Student," says Nadia Fell. She says it without surprise. "You're late. You've got ten minutes before I pull out. I don't wait for the cue. I never have." She draws on the cigarette. "Price of the ticket is a token. Tokens are scarce tonight."`,
      interjections: [
        { skill: "instinct", min: 3, text: `She is not afraid of you. She is not afraid of the Jubilee. She is not afraid of the Ministry. She is, however, a little afraid of the tram being left empty, which is a strange thing to be afraid of, and it makes you like her at once.` },
        { skill: "senses", min: 3, text: `Tobacco, hot rails, machine oil, orange peel. A little paper bag of orange peel, in her coat pocket, which she is going to give to a child on the ride. You can tell. It is a smell that has done it before.` }
      ],
      choices: [
        { text: "Hold out a tram token.", goto: "exo_stop_in", cond: "has('tram_token')" },
        { text: "Show the forged pass. It is, frankly, a work of art.", goto: "exo_stop_in", cond: "has('forged_pass') || has('black_market_ticket')" },
        { text: "\"Nadia. I'm not asking for me.\" Dov's name, Wren's name, on your lips.", goto: "exo_stop_nadia", cond: "(flag.nadia_ready || flag.nadia_ally)" },
        { text: "Talk her round. A very good story. A very kind face.", check: { skill: "charm", diff: 12, id: "finale_hub_exo_stop_charm", white: true, pass: "exo_stop_in", fail: "exo_stop_bad" } },
        { text: "Lift a token out of her satchel while she is looking at the sky.", check: { skill: "sleight", diff: 12, id: "finale_hub_exo_stop_sleight", white: true, pass: "exo_stop_steal", fail: "exo_stop_bad" } },
        { text: "Give her your last ration coupon and everything you have left.", goto: "exo_stop_in", cond: "has('ration_coupon')", effects: [{ take: "ration_coupon" }] },
        { text: "Not yet.", goto: "hub" }
      ]
    },
    exo_stop_nadia: {
      speaker: "nadia",
      text: `Nadia Fell looks at you for a long moment through the smoke. "You know," she says, "the thing nobody understands about a tram. It is the only vehicle in the Union that goes where it is told. A car goes where the man in the car wants. A train goes where the Ministry wants. A tram goes along the wire, and if you cut the wire it goes nowhere, and if you leave it alone it goes to the end of the line, and the end of the line is a bridge." She flicks the ash. "I decided, a little while ago, that I'd like to be the tram."\n\nShe steps aside. "Get in. I don't take the grown-ups for free. I take the kids. You," she looks you up and down, "are close enough."`,
      onEnter: [{ set: "exo_nadia_free", val: true }, { xp: 2 }],
      choices: [{ text: "Climb in.", goto: "exo_stop_in" }]
    },
    exo_stop_steal: {
      speaker: "sleight",
      text: `Ten cheerful thieves in a trench coat, one trick. You admire the sky with Nadia, and your left hand finds the satchel's clasp as one finds a light switch in one's own house. Three tokens, a roll of tape, an orange. You take one token. You do not take the orange. You do not take anything you do not need. You have never stolen anything you did not need, and you have needed a great deal.\n\nHer eyes do not move from the sky. But her mouth does, at one corner. "I've been robbed by better," says Nadia Fell, to the stars, "and by worse. You're all right. Climb in."`,
      onEnter: [{ xp: 2 }, { give: "tram_token" }],
      choices: [{ text: "Climb in.", goto: "exo_stop_in" }]
    },
    exo_stop_bad: {
      speaker: "nadia",
      text: `"No," says Nadia Fell. It is not an unkind no, but it is entirely closed. "I've heard that one. I've told it myself." She drops the cigarette and treads on it, with the care of a woman who has a very small number of cigarettes. "I take tokens. I take favours that I can trade. I don't take stories. A story's a thing a person tells when they haven't got a token."\n\nShe looks at her watch. "Eight minutes." She does not say it cruelly. She says it as a conductor says it: a fact about a timetable.`,
      onEnter: [{ add: "exo_trouble", n: 1 }],
      choices: [
        { text: "Find a way. Anything.", goto: "exo_stop" }
      ]
    },
    exo_stop_in: {
      speaker: "narrator",
      voices: 3,
      text: `The inside of the tram is a long dim yellow box with wooden seats and a floor that smells of wet wool and old cigarettes. There is a rack of paper tickets and a little brass bell on a cord. It is empty. It is the most beautiful place you have ever seen. Nadia leans against the driver's rail with the wire's current humming faintly through the soles of her boots, and the lamp over the door swings once, very gently, as the whole tram breathes.\n\n"You can bring who you like," she says, "within reason. I've got forty seats and nine minutes. I'll take a child on my knee. Don't bring a cat. I'm allergic." She looks at you, quite plainly. "And say your goodbyes in a hurry. People are very bad at them in a hurry, and the hurry is the only thing that makes them bearable."`,
      onEnter: [{ set: "exo_aboard", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `A tram is a small round world with a bell in it. Everything that matters is going to be said here, in the next nine minutes, in the wrong order.` }
      ],
      choices: [{ text: "Look out of the window. Who is there?", goto: "exo_board" }]
    },
    exo_board: {
      speaker: "narrator",
      voices: 3,
      text: `From the platform you can see all the way back up the Avenue, the sea of flags, the tower at its far end with a single lit window. Among the coats there are the ones who have come to you, and the ones you would like to ask. A tram holds forty. It is going to leave in a few minutes. It will not wait, and it will not be able to take everyone, and you are going to have to decide, in the time it takes to say it, who is a passenger and who is a goodbye.`,
      interjections: [
        { skill: "solidarity", min: 3, repeat: true, text: `We are not the sort to leave anyone behind. And yet there is a tram, and a wire, and a number of seats. This is the whole tragedy of the lifeboat. It is not that there is not enough room. It is that there is always, always one more.` }
      ],
      choices: [
        { text: "Wren is at the rail with a satchel and a cap and a very large grin. \"Is it a real tram? Can I ring the bell?\"", goto: "exo_wren", cond: "((flag.wren_ready || flag.wren_ally) && !flag.wren_caught)", once: true },
        { text: "Ilsabet's chair rolls up the ramp that Nadia lowers without being asked. She has her set on her knee and her chin up.", goto: "exo_ils", cond: "flag.ilsabet_ready", once: true },
        { text: "Dov Kessel steps onto the platform with a suitcase full of forged passes and a deeply insincere expression.", goto: "exo_dov", cond: "flag.dov_ally", once: true },
        { text: "Lemmy Tarsk is standing at the very edge of the platform, with his armband off, looking at his shoes.", goto: "exo_lemmy", cond: "flag.lemmy_redeemed", once: true },
        { text: "Corvin Hale, a suitcase in one hand, a pamphlet entitled MY DEPARTURE in the other, arrives breathless at the rail.", goto: "exo_corvin", cond: "flag.corvin_ally", once: true },
        { text: "Say your goodbyes. To the ones who are not coming.", goto: "exo_goodbyes" },
        { text: "That is all. Tell Nadia to go.", goto: "exo_stop_voss" }
      ]
    },
    exo_wren: {
      speaker: "wren",
      text: `"It's a real tram," says Nadia, from the rail. "And you may ring the bell. Once." Wren goes up the steps like a squirrel up a drainpipe and pulls the cord with her whole weight, and the little brass bell rings out over the whole end of the Avenue in a tiny, ridiculous, perfectly happy clang. She turns to you with a glow of pure indecent joy. "I told my mother," she says, "that I was going to the library. She said, 'good girl.' I wasn't lying. It's a very long library."\n\nShe takes a pencil stub from her cap and draws a small neat bell on her wrist, with a cross through it. "So I don't forget what I'm for."`,
      onEnter: [{ set: "exo_with_wren", val: true }, { xp: 3 }, { morale: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is twelve. She has just left her entire life for a tram, and she is more excited about the bell. It is possible she is the only sane person in the district.` }
      ],
      choices: [{ text: "Smile. Turn back.", goto: "exo_board" }]
    },
    exo_ils: {
      speaker: "ilsabet",
      text: `The ramp goes down with a clank and she rolls on without being asked, with her chair's small wheels chirruping on the boards, and sets the set on the seat beside her, and the little green eye winks. "I've never been on a tram," she says, in the offhand voice of someone who has thought about this at length. "They're always at the other end of something. It's very loud. Is it always this loud?" She takes off her glasses, polishes them on her cardigan, puts them on again.\n\n"I'm going to listen to the Harmony on the bridge," says Ilsabet Orrin. "I want to hear what it sounds like from outside. I've waited my whole life. I'm not going to be able to stay for the end, and I'm not going to be able to stay at all, and I think I'd like, at least, to hear the thing I made turning over in the dark behind me like a fish."`,
      onEnter: [{ set: "exo_with_ils", val: true }, { xp: 3 }, { morale: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is leaving everything she built behind. She is going to hear it with the whole of her skin from a bridge. It will be the loneliest and most beautiful thing she has ever listened to.` }
      ],
      choices: [{ text: "Smile. Turn back.", goto: "exo_board" }]
    },
    exo_dov: {
      speaker: "dov",
      text: `He comes up the steps like a man who has been to a great many stations and sold something at each. "Dov Kessel," he says, to Nadia, "dealer in small comforts. I have forty-one passes in this case, all of them forged, all of them excellent, and none of them any use at all where we're going. I thought I'd bring them anyway." He sets the suitcase down on a seat and opens it, with a showman's flourish, to a thick drift of grey and gold paper. "In case there's a border."\n\nHe winks at you, and the wink is entirely sincere. "I never meant to be loyal. It just seems to have happened, like a rash." He sits. "I've always wanted to see the end of the line. They say the pastries are better."`,
      onEnter: [{ set: "exo_with_dov", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "charm", min: 3, text: `"Like a rash." I'm taking that. I'll use it at weddings.` }
      ],
      choices: [{ text: "Laugh. Turn back.", goto: "exo_board" }]
    },
    exo_lemmy: {
      speaker: "lemmy",
      text: `"I haven't got a token," says Lemmy Tarsk. He has been standing there for a long time. His armband is in his fist, wadded into a ball, and he turns it over and over, red side in. "I haven't got a pass. I haven't got anything. I was always going to be somebody's hall monitor. I just don't know whose any more." He looks up. His eyes are very bright and a little red. "I thought, if there was a place with no corridors."\n\nNadia, in the driver's door, looks at him, sighs, and holds out a token between two fingers. "A hall monitor," she says, "is a sort of conductor. You'll find the job's much the same. Stand by the door and tell people to mind the step."\n\nHe takes it as one takes a very small, very hot coal.`,
      onEnter: [{ set: "exo_with_lemmy", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `A boy who told on a hundred people, standing on a platform, being given a ticket. It is the most generous thing the Union has done in a long time, and it was not done by the Union.` }
      ],
      choices: [{ text: "Nod to him. Turn back.", goto: "exo_board" }]
    },
    exo_corvin: {
      speaker: "corvin",
      text: `"I should like it noted," says Corvin Hale, hauling a huge suitcase up the steps in both arms, "that I have a great deal of luggage and no clear reason to be here." He is out of breath and flushed and extraordinarily well-dressed. "I am, as of about an hour ago, no longer a candidate for the Vanguard. I have written a resignation, in four copies, with an appendix. It is on the platform. It will be read by nobody. I am nonetheless very proud of the appendix."\n\nHe sets the suitcase down, takes out a pamphlet, and puts it into your hand. It is entitled A PERSONAL ACCOUNT OF A DEPARTURE. It is, you see, thirty-one pages long. "I thought it should be on record. I did not expect to be on the tram. But somebody has to document it, and I have the best handwriting in the third form."`,
      onEnter: [{ set: "exo_with_corvin", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "rhetoric", min: 3, text: `Thirty-one pages with an appendix! I should like to be in his audience. I should like to heckle him. It would be the best thing to happen to us in years.` }
      ],
      choices: [{ text: "Take the pamphlet. Turn back.", goto: "exo_board" }]
    },
    exo_goodbyes: {
      speaker: "narrator",
      voices: 3,
      text: `The ones who are not coming. It is a very short list, and it is all of the people you cannot stand to leave. They have come to the foot of the Avenue, each in their own way, to see you off, and each of them has a reason for staying that is, when you think about it, the same: someone has to be here when the others wake up.`,
      interjections: [
        { skill: "volition", min: 3, repeat: true, text: `Be brief. It is a cruelty to make them hold a smile for long.` }
      ],
      choices: [
        { text: "Mother Anka is standing at the very edge of the lamplight with her stove-black hands in her cardigan pockets.", goto: "exo_bye_anka", cond: "flag.anka_ready", once: true },
        { text: "Lieutenant Kell, in her second-best coat, is leaning against the lamp-post, not smoking.", goto: "exo_bye_vasha", cond: "(flag.vasha_ready && !flag.vasha_betrays)", once: true },
        { text: "Osk is standing at the end of the platform with a ring of keys, as he stands at the end of every day.", goto: "exo_bye_osk", cond: "((flag.osk_ready || flag.osk_keys) && !flag.osk_scapegoat)", once: true },
        { text: "Fenwick Alder has left the choir stand and come down the Avenue with his score under his arm.", goto: "exo_bye_fen", cond: "flag.fenwick_ready", once: true },
        { text: "Far away, over the roofs, the Great Bell rings once. It is not the hour.", goto: "exo_bye_hob", cond: "(flag.hob_ready || flag.hob_trust || flag.hob_signal)", once: true },
        { text: "That is enough. Go.", goto: "exo_board" }
      ]
    },
    exo_bye_anka: {
      speaker: "anka",
      voices: 2,
      text: `"Well," says Mother Anka, with the economy of a woman who has said this to several hundred children and means each of them. She does not hug you. She straightens your collar, which is not crooked, and puts something into your hand, small, hard and wrapped in newspaper. "A pickle," she says. "A real one. For the bridge." Her eyes are very bright behind the glasses. "I shall stay. Somebody has to be at the stove, when they all wake up with questions, and a chemistry teacher is the only person in the district who is entirely used to explosions."\n\n"Go on. You'll write. You'll write notes. You had a gift for it." She pats your face, twice, briskly, with a hand that smells of ammonia and chalk. "You were the best courier I ever had."`,
      onEnter: [{ set: "exo_anka_stays", val: true }, { xp: 2 }, { morale: 2 }],
      interjections: [
        { skill: "appetite", min: 2, text: `A PICKLE. FROM ANKA. YOU WILL NEVER EAT IT. YOU WILL KEEP IT IN A DRAWER FOR FORTY YEARS AND THEN EAT IT, AND IT WILL BE THE BEST PICKLE IN THE WORLD.` }
      ],
      choices: [{ text: "Go.", goto: "exo_goodbyes" }]
    },
    exo_bye_vasha: {
      speaker: "vasha",
      text: `"I'm not coming," says Lieutenant Vasha Kell. "Don't ask. I'm an infantry sergeant. I've never left a post in my life, and I've written a number of reports I would like, one day, to be asked about." She takes a cigarette from behind her ear, looks at it, and puts it back. "Someone will need to answer for the knee, at any rate. And someone will need to put the paper right." She looks at you. She is, you realise, trying very hard to be unsentimental.\n\n"You were a bad liar and a worse student, and the best thing that happened to my division in eleven years." She salutes. It is a real one. "Go on. And mind that kid with the cap. She'll climb the roof."`,
      onEnter: [{ set: "exo_vasha_stays", val: true }, { xp: 2 }, { morale: 2 }],
      choices: [{ text: "Return the salute. Go.", goto: "exo_goodbyes" }]
    },
    exo_bye_osk: {
      speaker: "osk",
      text: `He does not say anything. He has never said much. He looks at the tram, and then at his ring of keys, and, after a considerable pause, takes one off. A small brass one, worn bright. He turns it over twice in his big flat fingers, as if checking it was the right way up, and holds it out. "Spare," he says. "Front door of the school. Don't know where you're going. Might want to come back." He clears his throat. "Somebody'll be here. To open it."\n\nThen, with the stolid, fierce embarrassment of a man who has never been thanked in his life and would very much rather not start, he looks at the lamp, the rail, the sky, the horns, the cobbles, and, with great attention, his own boots.`,
      onEnter: [{ set: "exo_osk_stays", val: true }, { xp: 2 }, { morale: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `A key to a door you will not use, in a country you cannot see from here, from the one man who has understood that a door is a promise.` }
      ],
      choices: [{ text: "Take the key. Go.", goto: "exo_goodbyes" }]
    },
    exo_bye_fen: {
      speaker: "fenwick",
      text: `He has run, you can see. His good suit is damp at the collar, and he has the score against his chest like a child. "I'm told," says Fenwick Alder, quite breathless, "that I'm expected back on the podium in four minutes. I've come to say that I'm going to conduct the Anthem in E-flat, whatever it costs, and then I'm going to find out what that costs." He holds out the score. "Copy. I made it on Wednesday. In case there's a choir, where you're going."\n\nHis eyes are bright. "I never in my life disobeyed a score. It was astonishing. I recommend it. One does feel so extremely alive."`,
      onEnter: [{ set: "exo_fen_stays", val: true }, { xp: 2 }, { morale: 2 }, { give: "choir_score" }],
      choices: [{ text: "Take the score. Go.", goto: "exo_goodbyes" }]
    },
    exo_bye_hob: {
      speaker: "hob",
      text: `The Great Bell rings, a long way off, over the roofs: not the hour, not the muster. A single round stroke, held, falling away, a sound like a deep breath let out. It comes over the Avenue, over the paper flags, over the heads of eleven thousand people who turn and wonder. Only you know what it means. It is a goodbye. It is, you realise, the first time in forty years that Hob the Bellringer has said one.\n\nThe sound reaches you at the tram stop, soft and enormous. The little brass bell on the tram, by the driver's rail, hums in answer, a hair's-breadth sympathetic note, all by itself.`,
      onEnter: [{ set: "exo_hob_stays", val: true }, { xp: 2 }, { morale: 2 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `He is the voice I have always had. Now he is saying goodbye in it. It is the only language I know how to cry in.` }
      ],
      choices: [{ text: "Raise a hand to the tower. Go.", goto: "exo_goodbyes" }]
    },

    exo_stop_voss: {
      speaker: "narrator",
      voices: 3,
      text: `"Right," says Nadia Fell, and pulls the cord. The tram shudders. The wires hum. At the same moment, from the far end of the Avenue, with a long, low, unhurried growl, a black car with its lamps off turns out of a side street and rolls to a halt across the rails, a hundred feet in front of the tram's nose.\n\nThe driver's door opens. A man steps out in a good coat. He closes the door behind him with his heel. He is carrying, you see, a thermos, and nothing else. He stands in the middle of the road with the Jubilee at his back and the tram's single yellow lamp full in his face, and he does not wave it down. He simply stands, the way a man stands who has chosen to be in the way.`,
      interjections: [
        { skill: "instinct", min: 3, text: `He is alone. Always alone. It is the most dangerous thing about him.` }
      ],
      choices: [{ text: "Get down from the tram. Walk to him.", goto: "voss_arrive" }]
    },
    exo_after_voss: {
      speaker: "narrator",
      voices: 3,
      text: `Whatever was said in the road, it is done. He lifts the thermos in a small salute, and, without a word, walks round to the driver's door of the black car and gets in. The engine starts. The car reverses, very slowly, into the side street, and the rails are clear.\n\n"Right," says Nadia Fell again, to nobody, from the driver's rail, and with a long, creaking, joyful clang the tram begins to roll.\n\nOn the Avenue, the first of the paper flags turns, wondering, to look. The tower's one lit window slides back and away behind the roofs. The sound of the Jubilee drops in pitch, like a thing going under water.`,
      onEnter: [{ sfx: "bell" }],
      interjections: [
        { skill: "the_grey", min: 3, text: `Goodbye. Goodbye. I feel you go along my wires like a little warm bead. I will not forget you. I am a district. It is the one thing I am good at.` }
      ],
      choices: [{ text: "Take a seat. Look out of the window.", goto: "exo_ride" }]
    },
    exo_ride: {
      speaker: "narrator",
      voices: 4,
      text: `The tram goes east along the wires at the speed of a good walk, and District 9 goes by in strips: a dye-works, a gasometer, a long wall of posters with the Warden's face on every one, a kiosk with its shutters down. The Avenue thins. The lamps thin. The Jubilee drops behind, becomes a glow, becomes a murmur, becomes a thing you could almost mistake for the sea.\n\nThe tram's yellow light moves over the passengers, one by one: a girl with a pencil and a cap, a girl with a wheelchair and a set, a boy with a suitcase of forgeries, an empty seat that is the shape of someone who stayed. Nobody says anything. It is not a silence. It is a sort of listening.\n\nIn four minutes you will be on the bridge.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `I watch you go out through my wall, one window at a time. It is like watching a thought leave. It is the first time I have ever minded.` },
        { skill: "empathy", min: 3, text: `They are all remembering something. Nobody says what. A tram at night is the last place in the world where a person is allowed to look quietly out of a window.` },
        { skill: "solidarity", min: 3, text: `We are on a tram. We are going. We are very small, and the dark is large, and we are, for these four minutes, entirely together.` },
        { skill: "composure", min: 3, text: `Hands in lap. Face to the glass. You are a student on a night tram, going nowhere in particular. It is the first role you have played tonight that is also the truth.` }
      ],
      choices: [{ text: "Watch the bridge come up out of the dark.", goto: "exo_bridge" }]
    },
    exo_bridge: {
      speaker: "narrator",
      voices: 3,
      text: `Cinder Bridge is a black iron span across a black river, with a sentry-box at each end, both empty, and a single rail-lamp in the middle. The tram rings across it, slow and hollow, like a spoon in a very large cup. Below, the river is wide and cold and slow, with a pale stripe of reflected sky. Beyond, at the far bank, a few scattered lights, a road, a long dark country.\n\nThe cue-tone sounds on the wind, very faint, a single clear note from a long way behind you. Then, like the first breath of a very large sleeper, the Grand Harmony begins.`,
      interjections: [
        { skill: "senses", min: 3, text: `It is quite faint. A radio in the next flat, a half-heard hymn from a window. Under the sweetness there is a second, slower note. It is like seeing a friend's face, small, across a lake.` },
        { skill: "volition", min: 3, text: `It will not reach as far as the bridge in force. But it will reach as far as the first bar, and a first bar is all it takes to blur a very small girl who has never heard it from outside.` }
      ],
      choices: [{ text: "Turn to the others.", goto: "exo_hold" }]
    },
    exo_hold: {
      speaker: "narrator",
      voices: 4,
      text: `You feel it come, sweet and thin and far behind you, like a hand on a shoulder: the Bell, the choir, the second note. Nobody on the tram is Static-resistant. Nobody has your ear. In the seat across from you, a first-year with a pencil stub puts her hand to her forehead and says, in a very small voice, "Oh. Oh, that's the... that's the sleepy one."\n\nYou have perhaps thirty seconds. The beat is faint, but it has found them, and it is looking for the places in their heads where the day is kept. The only thing that will hold them is each other, a name, a sentence, a hand on the wrist. They need to be kept awake long enough to write it down.`,
      interjections: [
        { skill: "empathy", min: 3, text: `Look at each of them. Say their names. You are the only person on this tram who can hear the beat and still stand up. Use it.` },
        { skill: "solidarity", min: 3, text: `We are here. We are all here. We say it together. Nobody is allowed to go under while we are saying it.` },
        { skill: "volition", min: 3, text: `You hold the tram. That is all. You hold it together the way you have held yourself together for three days, by the scruff.` }
      ],
      choices: [
        { text: "\"Write it on your arms. Now. Your name, the date, 'we left.'\" Hold out the pencil.", goto: "exo_hold_write", cond: "flag.exo_with_wren || flag.exo_with_ils || flag.exo_with_dov || flag.exo_with_lemmy || flag.exo_with_corvin" },
        { text: "Hold them together. Talk. Say their names, one by one, in order, until the beat has passed.", check: { skill: "empathy", diff: 12, id: "finale_hub_exo_hold_emp", pass: "exo_hold_pass", fail: "exo_hold_fail" } },
        { text: "Sing something. Anything. Badly, and with your whole chest.", check: { skill: "solidarity", diff: 11, id: "finale_hub_exo_hold_sol", pass: "exo_hold_pass", fail: "exo_hold_fail" } },
        { text: "Keep them awake by force of will.", check: { skill: "volition", diff: 13, id: "finale_hub_exo_hold_vol", pass: "exo_hold_pass", fail: "exo_hold_fail" } },
        { text: "Hope it passes.", goto: "exo_hold_fail" }
      ]
    },
    exo_hold_write: {
      speaker: "narrator",
      text: `You hold out the pencil stub, and a hand takes it, small and grubby, and writes. A name, in huge, shaky, determined capitals on the inside of a wrist: WREN. A date. Beneath it, in smaller print: WE LEFT. The pencil goes from hand to hand. A wheelchair's armrest has been written on, and a suitcase, and the back of a seat, and a cuff. Someone is humming. Somebody has started to laugh, high and helpless, the way you laugh at a funeral.\n\nThe beat passes over the tram like the shadow of a bird. It goes on, over the bridge, over the river, thinning into the dark country, looking for a district that is not here. By the time the last note fades, the tram is full of people looking at their own arms, and every one of them has a name there.`,
      onEnter: [{ set: "exo_written", val: true }, { xp: 4 }, { morale: 3 }],
      interjections: [
        { skill: "archive", min: 3, text: `The Notes from Yesterday-You method, generalised. A technique that was always going to be taught in a classroom, one day. It is, as it happens, being taught on a tram.` }
      ],
      choices: [{ text: "Breathe.", goto: "exo_border" }]
    },
    exo_hold_pass: {
      speaker: "narrator",
      text: `You say their names. One by one, round the tram, a hand on a wrist, a face held in yours, until each of them looks back. You say them in order, and the order is a rope. The beat, which has come looking for a place to set down, stands over the tram in the cold air like a patient dog, and finds nothing to hold. By the time the last bar fades, every head is up. A girl in a cap is staring at you with her eyes very wide. "I was almost," she says. "I was almost somewhere else."\n\n"I know," you say. "I was there with you."\n\nIt is a lie. You were not. But in the dark of a tram on a long iron bridge, with a river below, it is the best kind.`,
      onEnter: [{ set: "exo_held", val: true }, { xp: 3 }, { morale: 2 }],
      choices: [{ text: "Breathe.", goto: "exo_border" }]
    },
    exo_hold_fail: {
      speaker: "narrator",
      text: `You are not quick enough. The beat passes through the tram like a hand through a curtain, and as it passes a number of heads go slowly down. It is not a faint, or a sleep. It is a smudge: a sudden glaze, a loosening of the eyes. When it is gone, one of the passengers is looking at you with a pleasant, puzzled smile, and does not know your name.\n\nYou know theirs. You say it. It does not stick.\n\nIt is, you understand, only the first day. They will remember most of what matters. But the tram has lost an evening, and a piece of itself has stayed on the bridge for good.`,
      onEnter: [{ set: "exo_lost_some", val: true }, { morale: -3 }, { hp: -1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `You are going to tell them. You are going to tell them again, and again. It is the only thing left you can do: be the one who remembers on behalf of the ones who don't.` }
      ],
      choices: [{ text: "Hold on to what remains.", goto: "exo_border" }]
    },
    exo_border: {
      speaker: "narrator",
      voices: 3,
      text: `The tram goes on through the dark, with a flickering lamp and a sound of wheels. After a long time, far off, a light appears: a lamp at a level crossing, a dog barking, the long grey smudge of a road. The Grand Harmony's last note falls away behind you like a sleeper's breath, and there is a silence in which, for the first time in your life, you can hear what the world sounds like with no Bell in it.\n\nIt sounds like a country. It sounds, in fact, quite ordinary. Crickets. A distant engine. Somebody's radio, far away, playing something with an accordion.\n\nNadia Fell lights a cigarette at the driver's rail and speaks, without turning, to the windscreen. "Right. End of the line. It's a terminus with a café that does pastries." A pause. "I told Dov there'd be pastries."`,
      interjections: [
        { skill: "the_grey", min: 3, text: `I cannot feel the cobbles any more. Only the rail. It is a thin, cold, narrow thing. It is the first time since my birth that I have not been a district. I am only a track. It is very quiet. I think I like it.` },
        { skill: "empathy", min: 3, text: `Somewhere behind you, eleven thousand people are waking up with a lighter bag. They do not know you left. Someone will remember you for them. You have given a whole district the gift of a single person who remembers it.` },
        { skill: "volition", min: 3, text: `You can put the evening down now. You have carried it across a river. It weighs about as much as a pickle.` }
      ],
      choices: [{ text: "Step off the tram.", goto: "exo_end" }]
    },
    exo_end: {
      speaker: "narrator",
      text: `You step down onto a platform of wet planks, under a lamp with moths in it, into a cold that smells of coal and apples. The others come down behind you, blinking: a girl with a cap, a wheelchair, a suitcase of forgeries. Nadia Fell swings down last, takes the cigarette out of her mouth, looks at the sky, which is large and full of stars you have never been allowed to see, and says, with a conductor's perfect lack of ceremony, "Mind the step."\n\nSomewhere behind you, a long way off, a district is going to sleep.\n\nYou are very tired. You are awake. It is the beginning of a very long night, and the first in your life that has been entirely yours.`,
      onEnter: [{ ending: "end_exodus" }]
    },

    // ---------------------------------------------------------------- ROUTE G: THE LEDGER TO ANKA (end_ledger)
    led_start: {
      speaker: "narrator",
      voices: 3,
      text: `The least dramatic plan is the one that has been working the longest. It does not need a tower. It does not even need the evening. It needs a cellar, a stove, a woman who smells of ammonia, and a very long view.\n\nYou go down the spiral, past the library, out through the Courtyard, where the choir is lining up in rows and the Jubilee is gathering itself like a great animal. You cross the cobbles to the corner by the Statue of the Warden's Father, where a rusted iron grating lies flat in the paving with a scrap of warm air coming through it. You knock. Twice, then once. The grating, after a decent interval, moves aside.`,
      onEnter: [{ set: "finale_route", val: "led" }],
      interjections: [
        { skill: "solidarity", min: 3, text: `Oh, it is the best of them. It is the slowest, and the least glorious, and the only one that has ever, in the history of anything, worked. We are very fond of it. We have been doing it for sixty years.` },
        { skill: "doublethink", min: 3, text: `Well, that is certainly safe. A cellar. A stove. A woman. Nobody will ever bother you. They will not even remember that you were there. It is almost like the Quiet Hours, friend, but with soup.` },
        { skill: "the_grey", min: 3, text: `Down, down, down. Into my belly. I would like to hold you for a long time. I am an excellent cellar.` }
      ],
      choices: [
        { text: "Go down with the Ledger.", goto: "led_hub", cond: "has('ledger')" },
        { text: "Go down. Anka already has it.", goto: "led_hub", cond: "!has('ledger') && flag.ledger_with_anka" },
        { text: "Not yet.", goto: "hub" }
      ]
    },
    led_hub: {
      speaker: "anka",
      voices: 3,
      text: `The boiler room on the night of the Jubilee is warmer than you have ever known it. The old boiler mutters in its corner. The circle of chairs has been put away, stacked against the wall. On the planning table, among cups, chalk, a spirit-lamp and two wire baskets of onions, a battered duplicating machine, with a drum the colour of a plum, squats under a lamp.\n\n"There you are," says Mother Anka, not turning. She is cutting a stencil with a pin, by touch. "I told them you'd come. I said, he will come down the stairs at ten to eight and say nothing for a long minute, and then he will say something clever, and I shall tell him to eat." She puts the pin down. "Have you eaten?"`,
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She said it on Tuesday, too. It is the same sentence. She says it to every frightened child who comes through the door. It is not a ritual. It is simply that she has never once known what else to say.` },
        { skill: "appetite", min: 2, text: `Onions. Real, brown, sweet onions, in a wire basket. Somebody's been frying them. Say yes. Say yes, say yes, say yes.` }
      ],
      choices: [
        { text: "\"Not yet.\" Put the Ledger on the table.", goto: "led_give", cond: "has('ledger')" },
        { text: "\"What's the plan, Anka?\"", goto: "led_plan" },
        { text: "\"Ostrov used to sit here, didn't he?\"", goto: "led_ostrov" },
        { text: "\"Show me how to do the notes. Properly.\"", goto: "led_notes" },
        { text: "\"I'll sit with you. For the cue.\"", goto: "led_cue", cond: "flag.led_given || flag.ledger_with_anka" },
        { text: "Go back up. Not yet.", goto: "hub" }
      ]
    },
    led_plan: {
      speaker: "anka",
      voices: 3,
      text: `"The plan." She sounds faintly amused, as one is when a child asks about the Sun. "The plan is not interesting, dear. The plan is a very large number of small things, each done by someone who would rather be asleep." She turns the drum of the duplicator by hand, once. "We copy. The Ledger, the relay log, anything. In violet ink, because violet is what the Ministry never thinks to look for. We put the copies in eleven places. A hymnal. A drawer in the clinic. The lining of a tram seat. A tin in a Vanguard locker." A dry smile. "They will be found by people who didn't know they were looking."\n\n"And we teach the notes. Your notes. Yesterday-You. Every one of us writes one before nine, in our own hand. In ten years there will be four thousand people in this district who write a note before the Bell, and do not know why. That is the revolution. It is quite boring. I find it very comforting."`,
      onEnter: [{ xp: 2 }, { thought: "th_chosen_family" }],
      interjections: [
        { skill: "dialectics", min: 3, text: `The plan has no single point of failure. It is a distributed system of small human decencies. It cannot be arrested because it is not anywhere. A genuinely excellent piece of design, executed by a woman with an onion basket.` },
        { skill: "solidarity", min: 3, text: `Four thousand. Four thousand little notes. It is the first number anyone has said to us that sounded like a place we could stand.` }
      ],
      choices: [{ text: "Go on.", goto: "led_hub" }]
    },
    led_ostrov: {
      speaker: "anka",
      text: `She takes a very long time to answer. She puts the pin down, wipes her hands on her labcoat, and, for a moment, looks at the chair beside you, which is an ordinary wooden one with a cracked rung. "He sat there. He took his tea without sugar and lied about it. He said it was a principle. It was only that he thought I had run out." A short, dry breath, almost a laugh. "He was twenty-eight years younger than I am and he was the cleverest man in the Union and he was quite hopelessly, tenderly, stupidly in love with being right."\n\n"I told him it would kill him. I told him many times. He said, 'It's all right, Mother. I've got a courier.'" She looks at you, plainly. "He meant you. He was so pleased with you. He said you were the only person in District 9 who still had a ringing in the ears, and that it was the best thing about you."`,
      onEnter: [{ set: "led_ostrov_told", val: true }, { xp: 2 }, { morale: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She has been waiting three days to tell you that he loved you. She is doing it sideways, in the form of an anecdote, because the front door of that sentence is too heavy.` }
      ],
      choices: [{ text: "Say nothing. Pour the tea.", goto: "led_hub" }]
    },
    led_notes: {
      speaker: "anka",
      voices: 2,
      text: `She pushes a stub of pencil across the table, and a half-sheet of cheap grey paper. "There's a way to do it," says Mother Anka, "so that you believe it. Everybody gets it wrong. They write 'Remember: the Bell is a machine.' That's no good. You will read that tomorrow and think, how paranoid. You must write something that only you could have written, and that you cannot argue with. Something small. Something that smells."\n\n"I'll show you mine." She pulls up her sleeve. On her forearm, in blue ink, in a spidery, firm hand: DO NOT BE AFRAID OF THE BOY WITH THE FLAG. HE IS OURS. EAT SOMETHING.`,
      onEnter: [{ xp: 2 }],
      interjections: [
        { skill: "archive", min: 3, text: `Actually, an excellent method. A note that is verifiable by the reader's own handwriting, specific, domestic, and impossible to rationalise away. The Ministry has a regulation against it. It is Regulation 11. It is entirely unenforceable.` }
      ],
      choices: [
        { text: "Write one. On your own arm.", goto: "led_notes_write" },
        { text: "Hand the pencil back.", goto: "led_hub" }
      ]
    },
    led_notes_write: {
      speaker: "narrator",
      text: `You push up your sleeve. You think for a long time, with the pencil an inch above the skin of your wrist, and the boiler muttering, and the onions frying somewhere behind you. In the end you write only what is true. It takes up a whole forearm, in a handwriting that is yours and, a little, Ostrov's:\n\nYOU CARRIED IT. YOU WERE AFRAID. YOU DID IT ANYWAY. THE WOMAN WITH THE STOVE IS ANKA AND SHE WILL ASK IF YOU'VE EATEN. SAY NO, EVEN IF YOU HAVE.\n\nMother Anka reads it, upside down, over the lamp, and for a moment she does not say anything at all.`,
      onEnter: [{ set: "led_note_written", val: true }, { xp: 3 }, { morale: 2 }],
      choices: [{ text: "Roll your sleeve down.", goto: "led_hub" }]
    },
    led_give: {
      speaker: "narrator",
      voices: 3,
      text: `You lay it on the table among the cups and the chalk. It looks a good deal smaller than it did in the Courtyard: a slim green cloth book, soft at the corners, with a coffee ring on the front board and Ostrov's handwriting inside like a very long, very polite scream. For a moment nobody says anything.\n\nMother Anka dries her hands on her coat. She picks it up, not as a person picks up a treasure, but as one picks up a baby to check it has been fed. She opens it to the middle, and reads one line, and shuts it again.\n\n"Right," she says. "Right. Violet ink, I think."\n\nShe sets it, with great gentleness, under the lamp, beside the plum-coloured drum. It is, you realise, the exact same motion with which one puts a loaf into an oven.`,
      onEnter: [{ set: "ledger_with_anka", val: true }, { set: "led_given", val: true }, { take: "ledger" }, { xp: 3 }, { morale: 2 }],
      interjections: [
        { skill: "volition", min: 3, text: `You are lighter. Do not mistake it for freedom. It is the weight of a thing handed on, and it will come back, all the lighter for being shared.` },
        { skill: "solidarity", min: 3, text: `It is no longer yours. It is no longer anyone's. It is a thing that belongs to the stove and the pencil and the onion. It is, at last, safe in the only way that anything is.` }
      ],
      choices: [{ text: "Roll up your sleeves.", goto: "led_copy" }]
    },
    led_copy: {
      speaker: "narrator",
      voices: 3,
      text: `The duplicating machine is older than Anka and more temperamental than the boiler. It has to be fed a stencil, wet, a strip at a time, with a gentleness that is wholly alien to the temper of the thing, and then cranked, hand over hand, at a steady speed, while a girl at the other end catches each damp violet sheet and lays it on a rack. The room fills with the sweet, sharp smell of spirit and ink. It is a smell that, you realise, you will carry in your clothes for the rest of your life. It is the smell of a resistance.\n\nAn hour of this is a very long time. The cue is in a quarter of one.`,
      interjections: [
        { skill: "stamina", min: 3, text: `One more crank. One more. The arm will burn at the fortieth, go numb at the sixtieth, and return as a cheerful, mindless, rhythmic machine at the hundredth. One more corridor.` },
        { skill: "sleight", min: 3, text: `Stencil. Wet, slow, careful. A hair's breadth of paper between a thing that is legible and a thing that is a purple smear. Ten cheerful thieves, working as a bench of printers.` },
        { skill: "archive", min: 3, text: `An index. You'll need an index. If they are to find it again, in years, in a hymnal, in a tin, in a seat lining, there has to be a way to look things up. I am, if I may say so, uniquely qualified.` }
      ],
      choices: [
        { text: "Crank the drum. Steady, hand over hand.", check: { skill: "stamina", diff: 10, id: "finale_hub_led_crank", pass: "led_copy_pass", fail: "led_copy_fail" } },
        { text: "Cut the stencils. Quick, clean, perfect.", check: { skill: "sleight", diff: 11, id: "finale_hub_led_stencil", pass: "led_copy_pass", fail: "led_copy_fail" } },
        { text: "Write the index. Every date, every name, every page.", check: { skill: "archive", diff: 11, id: "finale_hub_led_index", pass: "led_copy_pass", fail: "led_copy_fail" } },
        { text: "Sit down and let the others do it.", goto: "led_copy_fail" }
      ]
    },
    led_copy_pass: {
      speaker: "narrator",
      text: `It goes well. It goes like a thing in a good dream: the stencil lies flat, the drum turns, the violet sheets come off the roller one after another into a basket, every one of them clear. By the end of an hour there are forty-one copies, each in its own brown paper wrapper, tied with ration-string, and a small neat hand has written on each of them, in a corner, a place: HYMNAL. CLINIC. TRAM. LOCKER. STATUE. A girl you cannot quite see goes up the coal-chute with a satchel of them, and the satchel does not clink.\n\n"Forty-one," says Mother Anka, with her hands on her hips. She is covered, to the elbow, in violet. She has never looked happier. "Forty-one places they will not look. I could kiss you. I won't. Go and wash."`,
      onEnter: [{ set: "led_copied", val: true }, { xp: 3 }, { morale: 2 }],
      choices: [{ text: "Wash. Come back.", goto: "led_hub" }]
    },
    led_copy_fail: {
      speaker: "narrator",
      text: `A stencil tears. A sheet comes off blotched. The drum catches, the whole machine groans, and a great purple blot spreads across forty pages like a bruise. Somebody swears, and somebody else laughs, and Anka puts the damaged pages in the stove with the regretful efficiency of a woman who has burned much better things. You get twenty-three copies. A good half are legible. They are less than there should be, and more than there might have been.\n\n"Twenty-three," says Mother Anka. "It is a good number. It is an unlucky one for the Ministry, which prefers even numbers." She wipes her hands. "Never mind. It is the thing that counts, not the amount."`,
      onEnter: [{ set: "led_copied_some", val: true }, { xp: 1 }],
      choices: [{ text: "Wash. Come back.", goto: "led_hub" }]
    },
    led_cue: {
      speaker: "narrator",
      voices: 4,
      text: `At a quarter past the hour the pipes begin to sing. It does not come from the speakers, because there are no speakers in the boiler room: the Bell comes through the walls, the plaster, the plumbing, the old iron radiators, a long, sweet, descending pair of pitches carried in the very water. The boiler mutters in answer. Somebody puts down a cup.\n\nThey have all written their notes. The eleven in the circle of chairs have come down one by one from the coal-chute: Ilsabet's brother, a man from the clinic, three boys from the third form, a woman with a pram. Each has a sleeve rolled up. They sit in the dark, in the lamplight, around the plum-coloured machine, and wait.\n\n"I'd like to hold someone's hand," says Mother Anka. "If nobody minds."`,
      interjections: [
        { skill: "the_grey", min: 3, text: `It comes through me. All of it. I have no way to stop it. I am the pipe it travels in. I am so sorry. I will carry it to them as gently as I can.` },
        { skill: "empathy", min: 3, text: `Twelve people, holding hands, about to forget they were here. It is not sad, exactly. It is only a very exact kind of courage.` },
        { skill: "solidarity", min: 3, text: `We are all in the one room. We have been here the whole time. It is the room we will wake in, and it will have a violet smell, and a stove, and we will not know why we are glad.` },
        { skill: "volition", min: 4, text: `You are the only one who will remember this. You are, tonight, the whole memory of this room. It is a very heavy thing to be. Be it kindly.` }
      ],
      choices: [{ text: "Take her hand.", goto: "led_cue2" }]
    },
    led_cue2: {
      speaker: "narrator",
      text: `You take it. It is small and dry and covered in violet, and it grips back with a surprising force. The sweet pair of pitches comes down through the plumbing like water through a hand. You feel them, around the circle, one by one: a shoulder dropping, a breath going out, a head tilting, a pair of eyes going soft and pleasant and far away. The woman with the pram is smiling at nothing. A boy is looking at his own wrist with an expression of mild surprise.\n\nYou are not going. You never were. You sit in the warm, dim, ink-smelling room, holding the hand of an old woman who is, very gently, ceasing to know you, and you say, quite quietly, so that she will have it for whatever part of her can still hear: "I'm here. It's all right. I'm here."\n\nMother Anka looks at you. She looks at her sleeve. She reads it. Her lips move.`,
      onEnter: [{ xp: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `This is the moment. This is what the whole three days were for: a hand in a hand, a sleeve in a lamp, a woman reading a line in her own writing and choosing, with a face you will never forget, to believe it.` }
      ],
      choices: [{ text: "Wait.", goto: "led_end" }]
    },
    led_end: {
      speaker: "anka",
      text: `"Well," says Mother Anka, quite slowly, to the room, in a voice that has gone very soft and a little puzzled. She looks at you as a person looks at a face on a platform that they are certain they have met. She looks at her sleeve. Then she smiles, the smile of an old woman reading a letter she has written to herself and found, to her great surprise, to be quite right. "You must be the courier."\n\n"Yes," you say.\n\n"Have you eaten?"\n\nIt is, in its way, the finest thing anyone has ever said to you. You do not trust yourself to answer. You shake your head. She nods, briskly, rises, and goes to the stove, and from somewhere in the dark of the boiler room, as the Grand Harmony fills the pipes, there comes the sound of a spoon in a pot.`,
      onEnter: [{ ending: "end_ledger" }]
    },

    // ---------------------------------------------------------------- ROUTE H1: THE GOOD STUDENT (end_good_student)
    gs_start: {
      speaker: "narrator",
      voices: 4,
      text: `There is a way out of this evening that has been quietly left open for you the whole time, like a door in a good restaurant that is never quite locked. Nobody has ever called it cowardice. It is not cowardice. It is, in the Union's phrase, citizenship.\n\nThe Principal will be on the dais in the Courtyard, in her good grey suit, with a folded speech and a pin in her pocket. She has been waiting since Tuesday for you to be sensible. There is a brass profile of the Warden in that pocket, and a place at the head of the Vanguard guard of honour, and, in a drawer in her office, a file that says in neat blue capitals: EXEMPLARY.`,
      onEnter: [{ set: "finale_route", val: "gs" }],
      interjections: [
        { skill: "doublethink", min: 2, text: `Oh, how lovely, friend. At last. At last. We have wanted this for you for the longest time. Look at that. Look how warm the door is. Look how clean the hall is, on the other side. They have put down a runner.` },
        { skill: "volition", min: 3, text: `You are considering it. Fine. Consider it honestly. Look at what it costs, and who pays. Do not tell yourself the price was zero.` },
        { skill: "the_grey", min: 3, text: `I do not judge. A great many people walked through that door, and I carried them out the other side. I only note that it is the sort of door that closes quietly.` },
        { skill: "empathy", min: 4, text: `Someone else will pay for your badge. There is always a bill. It will not be delivered to you. It will be delivered to somebody who was not consulted.` }
      ],
      choices: [
        { text: "Go to the dais. Find the Principal.", goto: "gs_marr" },
        { text: "No. Not that.", goto: "hub" }
      ]
    },
    gs_marr: {
      speaker: "marr",
      voices: 3,
      text: `"{name}." She says it as one pronounces a word one has been practising. "Sensible. I did hope you would be." Principal Marr stands at the lectern in her good grey suit with the speech folded in her left hand, and for the first time since you met her there is something in her face that is nearly warmth. "It has been a difficult week. I shall not pretend otherwise. But the School has weathered a number of such weeks, and it is in the nature of a good student to be, in the end, a part of the weather."\n\nShe takes from her pocket a small brass medallion, stamped with a stern and benevolent face, and holds it between two fingers, like a sweet. "The Warden's Badge. Vanguard Sergeant, Honorary. Your examination, I need hardly say, has been marked: Exemplary. I have only one small administrative matter."`,
      interjections: [
        { skill: "authority", min: 4, text: `SHE IS OFFERING YOU THE ONE THING YOU HAVE ALWAYS WANTED TO BE GIVEN WITHOUT ASKING. STAND UP STRAIGHT. YOU ARE ABOUT TO BE PROMOTED.` },
        { skill: "doublethink", min: 3, text: `A small administrative matter! She is so tactful. It is such a pleasure to be addressed by a person who knows exactly what she is asking and has found a polite word for it.` }
      ],
      choices: [
        { text: "\"What is the matter, Principal?\"", goto: "gs_name" }
      ]
    },
    gs_name: {
      speaker: "marr",
      voices: 3,
      text: `"A name," says Principal Marr. "For the file. It need not be anyone you are fond of." Her glasses catch the light of the lamps. "The Commissar's death must be attributed. It is quite a small attribution. The Ministry is flexible as to the person: it is only particular as to the form. If you would like to suggest someone, I shall see that it is dealt with kindly. If you would prefer not to, I shall suggest someone myself."\n\nHer voice is level and quite kind. She is, you realise, offering you the one real choice you have been given all week: whom to hand over. And she has put it as though she were asking you to choose a dessert.`,
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `Whoever you name is going to be taken to a room with a table and two chairs and a woman in a cardigan who offers biscuits. I would like you to hold that in your head for the next ten seconds before you say anything.` },
        { skill: "solidarity", min: 3, text: `We would say nobody. We would say it very loudly. We are not sure it will work. We would like to have said it.` }
      ],
      choices: [
        { text: "\"Osk Brannic, the caretaker. He was seen leaving the gym.\"", goto: "gs_osk", cond: "!flag.osk_scapegoat", effects: [{ set: "osk_scapegoat", val: true }] },
        { text: "\"The caretaker was already taken, Principal. I'd like to be of further service.\" Offer another name.", goto: "gs_other", cond: "flag.osk_scapegoat" },
        { text: "\"Nobody. I'll simply be good. You can find someone yourself.\"", goto: "gs_nobody" },
        { text: "\"There is a boiler room under the Courtyard. With a chair for every one of them.\" (Give her the cell.)", goto: "gs_cell" },
        { text: "Take it off the table. \"I changed my mind.\"", goto: "hub" }
      ]
    },
    gs_osk: {
      speaker: "narrator",
      text: `You say it in your own voice, and it is a great deal easier than it ought to be. Osk Brannic. A caretaker, thirty-one years of service, a broom, a ring of keys, a deaf left ear. "Seen leaving the gym." The Principal nods, quite gravely, with an expression of the most scrupulous regret, and writes it down, in a small neat hand, on a card in her pocket. She does not, you notice, ask whether it is true. It has never in her professional life been a question that mattered.\n\n"Thank you," she says, with real feeling. "That is very helpful."\n\nBehind you, from the crowd by the Statue of the Warden's Father, a big man in grey overalls has taken his cap off. He is looking at you with an expression you will carry, in a drawer of yourself, for the rest of your life. It is not anger. It is only a very tired, very mild kind of recognition.`,
      onEnter: [{ xp: 1 }, { surv: -8 }, { thought: "th_weight_of_osk" }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Oh, but you've done such good work, friend. So economical. A man like that has nothing to lose but his broom. It is, in its way, a kindness: he has been getting older for so long that it will be a relief to have it be a different sort of tired.` },
        { skill: "empathy", min: 3, text: `You will remember his face. I am not telling you to. I am only telling you that you will.` }
      ],
      choices: [{ text: "Take the badge.", goto: "gs_confirm" }]
    },
    gs_other: {
      speaker: "narrator",
      text: `"The caretaker." Principal Marr smiles, a little. "Yes. That is dealt with. The paperwork is an hour old." She turns the badge in her fingers. "But I should like something in addition. For tidiness." Her eyes are mild, level, courteous. "A second name. The Ministry likes things in pairs."\n\nIt is, you see, an offer that cannot be refused politely and cannot be accepted without a price. She has not changed the question. She has only widened it.`,
      choices: [
        { text: "Give her nobody. Say you have no more names.", goto: "gs_nobody" },
        { text: "Give her the cell in the boiler room.", goto: "gs_cell" },
        { text: "Take it off the table.", goto: "hub" }
      ]
    },
    gs_nobody: {
      speaker: "marr",
      text: `"Nobody." Principal Marr considers this with her head slightly on one side, like a person tasting a wine she was not quite expecting to enjoy. "That is, I think, the best answer I have been given this year." She puts the badge in your hand and closes your fingers round it with her dry cool ones. "We shall find someone ourselves. We always do. You will be spared the discomfort of having chosen." A thin, courteous smile. "That is, of course, the best part of being good. One is never asked to know what it costs."\n\nHer fingers are cool and her voice is kind. It is an offer so well made that it takes you a moment to see that you have not, in fact, been spared at all.`,
      onEnter: [{ xp: 1 }, { surv: -5 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `There. You see? Nobody is hurt. You didn't say a name. It will be somebody else's name. It is much cleaner this way.` },
        { skill: "dialectics", min: 3, text: `Premise: someone will be named. Premise: you refused to name them. Conclusion: you have outsourced the choice. You may call it innocence. It is merely a subcontract.` }
      ],
      choices: [{ text: "Take the badge.", goto: "gs_confirm" }]
    },
    gs_cell: {
      speaker: "narrator",
      voices: 3,
      text: `You say it. You do not know why. You say the corner by the Statue of the Warden's Father, the iron grating, the stairs under the Courtyard, the warm room and its twelve chairs. You say the name that people call an old woman with a stove. The Principal does not write it down. She does not need to. She has a way of listening that makes writing unnecessary. She nods, once, with her whole small body.\n\n"Thank you," she says. "That is extremely helpful. I shall see that it is dealt with very gently." And, for a moment, she looks at you with something that is not contempt, nor triumph, nor satisfaction, but a sort of exhausted pity, as one looks at a child one has just taught to lie.`,
      onEnter: [{ set: "gs_betrayed_cell", val: true }, { xp: 1 }, { surv: -12 }, { morale: -3 }],
      interjections: [
        { skill: "empathy", min: 3, text: `You have just given away a woman who asked if you had eaten. There is not a word for what you are. There is a word for what you will spend the rest of your life being. It is "careful".` },
        { skill: "solidarity", min: 2, text: `No. No, no, no. We were not an address. We were the chairs.` },
        { skill: "doublethink", min: 3, text: `Oh, friend. How efficient. How lovely and efficient and clean. I did not know you had it in you, and it makes me so very proud that I could weep.` }
      ],
      choices: [{ text: "Take the badge.", goto: "gs_confirm" }]
    },
    gs_confirm: {
      speaker: "narrator",
      voices: 3,
      text: `The badge is cool and heavier than it looks, brass over lead, with a stern, kind, slightly cross-eyed face on the front. It lies in your palm like a coin you have been paid for something. At the foot of the dais steps, the guard of honour has turned its eyes a quarter-inch, and a girl in red-brown is looking at you with an expression you cannot read.\n\nIf you pin it on, that is the end of the matter. You will be a good student. It is quite simple. You will stand in a line at the head of the Courtyard, and the Bell will ring, and the Static will take the last three days, and you will wake up in the morning in a clean uniform with a pin on the lapel and no notion at all of what you paid.`,
      interjections: [
        { skill: "volition", min: 3, text: `Last chance. The last place on this road at which you could say no. I will not shout it. I will only say that I am here.` }
      ],
      choices: [
        { text: "Pin it on.", goto: "gs_end" },
        { text: "Put it down on the lectern. Walk away.", goto: "hub" }
      ]
    },
    gs_end: {
      speaker: "narrator",
      text: `The pin goes through the cloth with a small dry click. The Principal steps back to look, with her head on one side, like a seamstress at a hem. "There," she says. "Very good." Somebody applauds, politely, a patter of gloved hands. The guard of honour straightens, one body, one breath. A photographer you did not see steps out from behind the lectern and takes a picture, and in the moment before the flash you see, very small, very bright, in the glass of the lens, a boy in a clean uniform with a brass face on his chest, smiling.\n\nHe looks, you think, extremely well.\n\nThe Address begins. The horns warm up. It is a lovely evening for it.`,
      onEnter: [{ give: "warden_badge" }, { ending: "end_good_student" }]
    },

    // ---------------------------------------------------------------- ROUTE H2: THE QUIET WAY (end_quiet)
    qt_start: {
      speaker: "narrator",
      voices: 4,
      text: `Nobody will blame you. That is the cruellest thing about it. There is nobody left in the district who would think less of you for going home on the eve of a Jubilee and drinking a cup of tea. A great many of them are doing it. The whole district is doing it, out there in the dark, in coats over pyjamas, with a paper flag and a mug.\n\nThere is a small brass urn at the foot of the tower, left by someone considerate. It steams. It smells of cloves and orange peel and a sweetness under the sweetness that you have been careful for three days not to examine.`,
      onEnter: [{ set: "finale_route", val: "qt" }],
      interjections: [
        { skill: "appetite", min: 2, text: `Tea. Warm. Sweet. Nobody asking anything. Isn't it simply the nicest thing? Just one. Just one cup. You have had such a terribly long week.` },
        { skill: "doublethink", min: 3, text: `And why not, friend? Why not simply be the sort of person who is allowed to be tired? You have done so much. Look at all the doing. It is quite enough.` },
        { skill: "volition", min: 3, text: `You may. It is not a crime. I will only ask that you do it with your eyes open, so that you know, afterwards, what you did.` },
        { skill: "the_grey", min: 3, text: `A great many people have taken the tea. It is, in its way, the kindest thing in the country. That is why it is the cruellest.` }
      ],
      choices: [
        { text: "Pour a cup.", goto: "qt_tea" },
        { text: "Walk away from the urn.", goto: "hub" }
      ]
    },
    qt_tea: {
      speaker: "narrator",
      voices: 3,
      text: `You pour it into a tin mug that has been left on the lip of the urn. It is warm in your hands, and the steam goes up into your face, and for a moment the whole of the day goes soft and distant, like a film you saw as a child. You think of a dead man in a gym. You think of an old woman in a boiler room. You think of a girl with a pencil and a cap, and a man with a bell, and you feel them go, one by one, as the steam rises, into a blur.\n\nIt is not forgetting. Not yet. It is only the willingness. It is the small, warm, sweet, hospitable place in the head that says: you may.`,
      interjections: [
        { skill: "appetite", min: 2, text: `Oh, it's lovely. It's so, so lovely. Don't you feel just lovely?` },
        { skill: "empathy", min: 3, text: `You are choosing to be somebody who does not carry it. You are allowed. I am only going to be a little sad about it, at the edges, where you won't see.` }
      ],
      choices: [
        { text: "Drink.", goto: "qt_gate" },
        { text: "Put the mug down.", goto: "hub" }
      ]
    },
    qt_gate: {
      speaker: "narrator",
      voices: 3,
      text: `The tea goes down warm. You walk out through the Courtyard with the empty mug in your hand, past the choir and the banners, past the crowd that is looking up at the tower, past a small girl in a cap who is looking, of all things, at you, with an expression that you cannot hold. You do not stop. You go through the school gate into Karsov Avenue, which is full of coats and flags and a faint smell of cocoa, and nobody looks.\n\nIt is the best feeling you have had in three days. It is the lightness of a thing put down. You go on, a little unsteadily, in the direction of the bus.`,
      interjections: [
        { skill: "volition", min: 4, text: `This is the last place at which you could turn round. After the next corner there is no turning round, because you will have forgotten which way you were facing.` },
        { skill: "empathy", min: 3, text: `A first-year in a cap is watching you go. She is not angry. She is only learning what it looks like.` }
      ],
      choices: [
        { text: "Keep walking.", goto: "qt_home" },
        { text: "Turn back. Right now. While you still know why.", check: { skill: "volition", diff: 12, id: "finale_hub_qt_turn", pass: "qt_turned", fail: "qt_home" } }
      ]
    },
    qt_turned: {
      speaker: "volition",
      text: `You stop in the middle of the pavement, with the tea sweet and warm in your belly and the lamps going by like small yellow sums, and you do something you will be proud of later: you tip the last of the mug into the gutter. It goes down the grating in a thin brown ribbon. You stand there for a moment looking at it, a calm, slightly exhausted class monitor in the inside of your head, and you say, very quietly, "No."\n\nIt is not a heroic word. It is hardly audible. But the blur that was coming up at the back of your head hesitates, as if it had walked into a room and found someone in it.\n\nYou turn round.`,
      onEnter: [{ xp: 3 }, { morale: 1 }],
      choices: [{ text: "Go back up the Avenue.", goto: "hub" }]
    },
    qt_home: {
      speaker: "narrator",
      text: `You go on. The number 9 is half-empty, and a woman with a string bag nods at you, and the lamps go by, and you count them, and the sum comes out quite right. At the end of the line a door opens, and there is a smell of soup, and somebody says your name in the voice of someone who has said it all your life. You eat. You say that the day was fine. You say that you passed, or that it went well, or that it was a day.\n\nIn a quarter of an hour, in the kitchen, the little speaker will clear its throat and begin to sing. You will hear it as you have always heard it: as a sort of tender weather.\n\nYou are, you find, very tired. It is such a comfortable tiredness.`,
      onEnter: [{ ending: "end_quiet" }]
    },

    // ---------------------------------------------------------------- FAILURES
    fail_caught: {
      speaker: "narrator",
      voices: 3,
      text: `Nobody shouts. That is what you will find strangest. Two men in grey coats come for you quite politely, as if fetching you to a dentist, and one of them even holds a door. There is a van, with a thermos in it, and a paper cup, and a small card on the seat that reads: THE UNION REGRETS THE INCONVENIENCE. Behind you, on the roof of the school, the Address is still going. It is a long Address. You will not hear the end of it.\n\nThe cuffs are cold. Down the Avenue, a district is lifting its flags. At the cue, as the van pulls out onto the cobbles with a long, discreet sigh, you feel the Grand Harmony begin to arrive, sweet and enormous, a hand on every shoulder in the country but yours.`,
      onEnter: [{ surv: 100 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `It is quite all right, friend. Nobody is cross. It is only that someone has to be taken, and it was convenient that it was you.` },
        { skill: "volition", min: 3, text: `They have you. They do not have what you carried. A person is a thing that can be taken. An act is not.` }
      ]
    },
    fail_forgotten: {
      speaker: "narrator",
      voices: 3,
      text: `You are not stopped. That is the bitter thing. Nobody comes. The cue sounds, a single clear note, and the Grand Harmony begins, sweet and long and enormous, and it comes down out of the horns over the school like a quilt over a sleeper. On the roof, an old man has taken his hand from the bell and put it, very gently, on your shoulder. He cannot speak. He does not need to.\n\nIt arrives in the back of your head like a hand on a shoulder: the blur, the sweet, the second note. You have perhaps a minute before your own ringing, thin and ancient, stops being enough. The day is going out of you as water goes out of a bath.`,
      onEnter: [{ sfx: "bell" }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Rest, friend. It is only the Hour. Nobody blames you. You did so very well, whatever it was.` },
        { skill: "volition", min: 3, text: `You have one minute and one hand. Whatever you can do with them, do it now.` },
        { skill: "the_grey", min: 3, text: `I will hold what I can. I will hold the shape of you in the stone. I cannot hold the rest.` }
      ],
      choices: [
        { text: "Write it on your arm. Anything. Your name. \"DO NOT TRUST THE BELL.\"", goto: "fail_note" },
        { text: "Let it come. Sit down against the bell.", goto: "fail_forgotten2" }
      ]
    },
    fail_note: {
      speaker: "narrator",
      text: `You find a pencil stub in the lining of your pocket, the one you had for nothing at all. You push up your sleeve. The pencil shakes. The day is going out of you in strips, a street, a face, a name, but your hand still knows how to be a hand, and it writes, in capitals that are yours and a little Ostrov's, against the inside of your forearm: DO NOT TRUST THE BELL. YOU WERE HERE. YOU TRIED. EAT SOMETHING.\n\nThe last word is mostly a line. Then the beat takes you like a tide.`,
      onEnter: [{ set: "finale_wrote_note", val: true }, { xp: 2 }],
      choices: [{ text: "Let go.", goto: "fail_forgotten2" }]
    },
    fail_forgotten2: {
      speaker: "narrator",
      text: `You sit with your back against the Great Bell, which hums under your shoulder-blades a quarter-tone flat, and the sky is a deep, enormous, clear blue-black with a few stars in it, and the sweet pair of pitches goes through you, and through the tower, and out into the district, and you feel it take everything it was sent for. Nobody told you it would be gentle. It is, in fact, extraordinarily gentle. It is like being put to bed by a very large, very patient, very stupid hand.\n\nYou are not in pain. You are not afraid. You are only, quite suddenly, extremely tired.\n\nThe last thing you hear is the bell, not rung, but softly, resonating under its own weight, remembering something it was never told.`,
      onEnter: [{ ending: "end_curfew" }]
    },
    late: {
      speaker: "narrator",
      voices: 3,
      text: `You have been dithering. It is a human thing to do, and nobody will say it was a failing. But while you were weighing it, the Address ended. A pause fell across the district, eleven thousand people holding their breath at once, and in the pause somebody, a long way off, in a concrete box with a yellow window, pressed a green button.\n\nThe cue sounds on the line, and the horns on the roof above you wake, one by one, and the Grand Harmony begins, sweet and long and utterly, utterly beautiful. You are standing exactly where you were when you last made a decision. It is, you notice, a very comfortable place to be caught.`,
      onEnter: [{ sfx: "bell" }],
      interjections: [
        { skill: "archive", min: 3, text: `Actually, Regulation 8(c) classifies you as "a spectator". It carries no penalty. It carries, however, a lacuna in the record of seventy-two hours.` },
        { skill: "instinct", min: 3, text: `Too late. Not by a lot. By one decision. It is always one.` }
      ],
      choices: [{ text: "Feel it come.", goto: "fail_forgotten" }]
    },

  }
},

};
})();
