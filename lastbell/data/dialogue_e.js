(function(){ const GD = (window.GD = window.GD || {});

// ---- tiny builders (data only; keeps the file readable) ----
const I = (skill, min, text, o) => Object.assign({ skill, min, text }, o || {});
const C = (text, goto, o) => Object.assign({ text, goto }, o || {});
const X = (text, o) => Object.assign({ text, end: true }, o || {});
const K = (text, skill, diff, id, pass, fail, o) => {
  o = o || {};
  const check = { skill, diff, id, white: !!o.w, pass, fail };
  if (o.pe) check.passEffects = o.pe;
  if (o.fe) check.failEffects = o.fe;
  const c = { text, check };
  if (o.cond) c.cond = o.cond;
  if (o.once) c.once = true;
  return c;
};
const N = (speaker, text, o) => Object.assign({ speaker, text }, o || {});

GD.dialoguesE = {

// =====================================================================
enter_day3: {
  title: "Thursday",
  start: "wake",
  nodes: {
    wake: N("narrator", `Thursday arrives wearing bunting. It is strung from the dormitory lamp to the window latch, red paper and gold paper in alternating loops, put up in the night by somebody either very loyal or very well paid. Through the painted-shut window the Courtyard has been dressed too: the statue has a garland, the loudspeaker pole has a ribbon, and the Warden's portrait over the door has been given a wreath, as if he had died and nobody had told him.\n\nOn the pole outside a speaker clears its throat, tests the Jubilee March for eleven bars, and stops. A banner across the gable says: THE WARDEN'S JUBILEE. THURSDAY, 20:00. ATTENDANCE IS A PLEASURE.\n\nYour head is ringing, which is normal. What is not normal is that the ringing is keeping time with the march.`, {
      onEnter: [
        { task: "task_jubilee", state: "active" },
        { note: "task_jubilee", text: "Thursday. The Warden's Jubilee: Grand Harmony goes out at 20:00 over every pole in the district. If it airs, the last seventy-two hours go with it: the Commissar, the Ledger, the Undercurrent, me. I have until the Bell to make it not be so." },
        { thought: "th_grand_harmony" },
        { thought: "th_second_day" }
      ],
      interjections: [
        I("senses", 3, `Paint, glue, wet paper. Somebody has been up all night with a stapler. Under it, the ironed smell of the Matron's cardigan, and under THAT, very faintly, ozone: the poles have been powered up early and are holding their breath.`),
        I("the_grey", 3, `I have been put in a party frock. I do not mind the frock. I mind the staples. Every wall in the district is being asked to smile at once, and walls cannot, and you can hear the strain in the mortar.`),
        I("instinct", 4, `Today is not like the other days. Your neck hair has a calendar and it has circled this one.`)
      ],
      choices: [C(`Lie still and listen to who wakes up.`, "dread_a")]
    }),

    dread_a: N("narrator", `They wake in the order they always do: loudest last. Something small and cold hauls itself upright in the back of your skull and starts, without being asked, to count.`, {
      voices: 6,
      interjections: [
        I("dialectics", 1, `Seventy-two hours. The Grand Harmony forgets seventy-two hours, and by my reckoning that includes this conversation. I would like it noted that I have never lost an argument and I am about to lose all of them at once.`),
        I("rote", 1, `ONE BELL, ONE UNION. ONE BELL, ONE UNION. (I do not know why I am doing this. I am frightened and it is the only thing I am good for.) ONE BELL.`),
        I("deduction", 1, `The facts are these, and I say it in the past perfect to keep my hands from shaking: everything that mattered had already happened by Tuesday night. All that remained was to decide who would be allowed to remember it.`),
        I("rhetoric", 1, `Ladies and gentlemen of the jury of one. We open today in the defence of an event. The event is called Yesterday. The prosecution is a very large loudspeaker.`),
        I("doublethink", 1, `Isn't it a lovely morning? Bunting! A Jubilee! Nobody has ever been hurt by a party. (We are not afraid. We are a good citizen in a nice hat. Say it with me.)`),
        I("archive", 1, `Per the Jubilee Notice, Annex C: "all residents will attend and will have been glad to." Note the tense. They have already written down how you will remember it. This is, strictly speaking, a spoiler.`)
      ],
      choices: [C(`Listen to the others.`, "dread_b")]
    }),

    dread_b: N("narrator", `The rest come up like sailors who were told the ship was a hotel.`, {
      voices: 15,
      interjections: [
        I("empathy", 1, `Everyone in this building is going to wake up scared this morning, and not one of them knows why. I am so sorry. I am sorry to the ceiling. I am sorry to the little cracks in it.`),
        I("volition", 1, `Up. Feet on the floor. I am not going to lie to you: today is the sort of day I was made for and the sort I hoped I would never get. Hands out of your face. Boots on.`),
        I("authority", 1, `YOU ARE NOT A VICTIM. YOU ARE THE ONE PERSON IN THIS BUILDING WHO KNOWS WHAT IS COMING. THAT IS NOT A BURDEN. THAT IS A COMMAND POST.`),
        I("charm", 1, `Smile first, darling. If today is a performance, we're going to be so good they forget to turn the lights off.`),
        I("solidarity", 1, `We are all in this. Every bed in the room. Every bed in the district. Eleven thousand foreheads against eleven thousand pillows. We would like, very much, to wake up together.`),
        I("stamina", 1, `Fourteen hours to the Bell. One more corridor. Then another. Then, I'm afraid, a staircase. Start with water.`),
        I("grit", 1, `It's just a morning. You have another.`),
        I("brawn", 1, `Bell tower is heavy. Bell is heavy. Today we lift things.`),
        I("appetite", 1, `Tea. Right now. And a roll, if there is a roll, and if the world ends tonight I would like the record to show that I asked for the roll FIRST.`),
        I("adrenaline", 1, `It's today, it's today, it's today, it's TODAY, can we go, can we go, can we hit something with a tower!`),
        I("aim", 1, `One breath. Hold it a half-second too long. Today, everything has to land exactly where it lands.`),
        I("reflex", 1, `Already on my feet. Sorry. Don't know what for. Something is going to fall.`),
        I("composure", 1, `Collar. Cuffs. Face. We are going to walk through a building full of informers and look like a bored hat stand. Begin.`),
        I("slip", 1, `Quiet on the stairs, third step creaks, the Matron's door is open one hand-width. Today the whole school is a door open one hand-width.`),
        I("sleight", 1, `Pockets checked: three. Pockets that I will lie about: all of them.`)
      ],
      choices: [C(`Take stock of what you actually know.`, "stakes")]
    }),

    stakes: N("archive", `Fine. For the record, because there will not be one: the Bell is not a bell. It is a tone with a second tone folded into it, and the second tone is a beat, seven then eleven, that makes the evening go soft. The District Relay No. 4 on Karsov Avenue sends it. The Ministry of Quiet Hours owns the relay, the Ministry owns the tone, and the Ministry owns the hour in which you are told it is a lullaby.\n\nTonight at 20:00 the relay will transmit Grand Harmony from a master tape, over every pole, through every horn, into every pillow. It does not take one night. It takes seventy-two hours. Ostrov goes. The Ledger goes. You go: your name will be the last thing the district forgets and the first thing it is proud of having never learned.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("dialectics", 4, `Logical consequence: after Grand Harmony the only surviving account of Tuesday is the official one. "The suicide of an unstable man." You will have written it yourself, in the sense that you will have nodded.`),
        I("rhetoric", 4, `Three ways to beat a broadcast. Replace it, interrupt it, or make people remember in spite of it. Each is a speech. Each has an audience of eleven thousand. Choose your hall.`),
        I("empathy", 5, `Not one of them will miss what they never knew they had. That's the cruelty, you see. It's not a theft; it's a tidy-up.`)
      ],
      choices: [C(`Think back over the last two days.`, "days")]
    }),

    days: N("archive", `Ledger of two days, in strict order of embarrassment.`, {
      voices: 6,
      interjections: [
        I("doublethink", 0, `You did so well. You framed the old man, you wore the pin, you took the Principal's pretty badge and the whole district thanked you for it, in its way. (It is mild to say it was necessary. It is cold to say it was wrong. Let us not say either.)`, { cond: "flag.verdict_good_student" }),
        I("solidarity", 0, `We have a Ledger, and it is not in our pocket. It is in the hands of eleven people who have been waiting thirty years to be handed one. We did that. Do not forget it. We would like you not to forget it. (The Jubilee will forget it for you.)`, { cond: "flag.verdict_ledger" }),
        I("adrenaline", 0, `You rang the whole Hall. You stood on the stage and said it out loud into a live microphone and the Union heard you, and it SHOOK. They know your face now. They know your VOICE. Wonderful. Terrible. Do it again!`, { cond: "flag.verdict_static" }),
        I("appetite", 0, `You went home and drank the tea. It was lovely. It was honestly lovely, and I can't promise I would not do it again, and I miss it.`, { cond: "flag.verdict_quiet" }),
        I("volition", 0, `You chose to forget, once. And the notes got you back anyway. That is the whole of what I know about you, and I will take it.`, { cond: "flag.verdict_quiet" }),
        I("empathy", 0, `Osk's broom has not moved from the stove-room all night. Nobody sweeps for him. You can feel the missing sweeping, a cold space in the corridor shaped like a man who put his back into a form.`, { cond: "flag.osk_scapegoat" }),
        I("the_grey", 0, `The old man in the coat has a bed and a bowl in a place with no window. I carry the news in the pipes. It travels slowly. It arrives wet.`, { cond: "flag.osk_scapegoat", effects: [{ thought: "th_weight_of_osk" }] }),
        I("authority", 0, `You have a cell. It has a Mother. Keep that in mind when it turns out they expect you to say something.`, { cond: "flag.cell_active" })
      ],
      choices: [
        C(`Think about the Inspector.`, "voss", { cond: "flag.voss_met" }),
        C(`Take stock of your hands. What do you actually have?`, "assets"),
        C(`Think about the Jubilee itself. What can be done?`, "plan")
      ]
    }),

    voss: N("narrator", `Inspector Hale Voss: a good coat, a tired voice, an offer you did not entirely hate. He is somewhere on Karsov Avenue by his black car, and he knows exactly what time it is.`, {
      interjections: [
        I("doublethink", 0, `He likes us. He said so. He said we were too good for the Ministry's little dustpans and then he offered us the dustpan. Isn't that nice? A trainee badge, a window, an evening gown for the soul. (Do not say "no" to a man who likes you.)`, { cond: "flag.voss_ally" }),
        I("instinct", 0, `He turned. A little. You felt it. The hand that offered you the badge shook, and then it stopped shaking, and you do not know which of those was the lie.`, { cond: "flag.voss_turned" }),
        I("deduction", 0, `He knows you know. You said it to him with your face. Men like Voss do not act on what they suspect. They act on what they can prove, at the last possible hour, with paperwork.`, { cond: "flag.voss_exposed || flag.voss_suspected" }),
        I("rhetoric", 0, `Invitation received: the relay gate will open for you if you say the right word in the right coat. This is rarer than a ticket to the Opera and far better dressed.`, { cond: "flag.voss_invited" }),
        I("empathy", 0, `Once, a girl forgot him. Or he forgot a girl. He did not say which. He said it the way you say a street name in a city you left. That is the only reason any of this is not already finished.`)
      ],
      choices: [C(`Take stock of your hands.`, "assets"), C(`What can be done about the Jubilee?`, "plan")]
    }),

    assets: N("archive", `Inventory, since the Static insists on it.`, {
      voices: 5,
      interjections: [
        I("rote", 0, `COUNTER-TONE: BUILT. (A small tape. A small thing. The noise a conscience would make if it were permitted to be a noise.)`, { cond: "flag.counter_tone_built || has('counter_tone')" }),
        I("deduction", 0, `You know the vault exists, and where the wheel is, and that the master tape is a thing a person can hold in two hands. That is half a plan. Frankly, it is half a plan that has been successful before.`, { cond: "flag.tape_found" }),
        I("composure", 0, `The tape has been swapped. You are carrying nothing, and the district will be listening to the thing you left. Do not look at the loudspeakers. They will see you looking.`, { cond: "flag.tape_swapped" }),
        I("solidarity", 0, `An engineer named Tomas sleeps in the vault beside a tape he does not want to play. He is ours. We wish he would shave.`, { cond: "flag.tomas_ally" }),
        I("senses", 0, `Pockets: a chalk stub, a couple of coupons, a smell of cabbage that is almost an identity. A modest inventory for a revolution.`),
        I("slip", 0, `You have a way in, if you want it: a pass in a cheap envelope, a bored guard, a back gate that is only technically a gate.`, { cond: "flag.relay_access" }),
        I("charm", 0, `Friends. Don't smirk. You have friends, a thing you didn't have on Tuesday. They are a Cook, a Choirmaster, a girl in a wheelchair with a soldering iron, and a janitor if you've been kind. We're a ridiculous crew. We are going to be adored.`)
      ],
      choices: [C(`What can be done about the Jubilee?`, "plan")]
    }),

    plan: N("narrator", `The shape of the day, as it sits on your chest. Fourteen hours, six ways through, none of them clean.`, {
      interjections: [
        I("dialectics", 3, `Every route needs the same ingredient: someone who is already inside the machine and tired of it. Count your tired people.`),
        I("volition", 4, `Do not decide this morning. Decide at the hour. Today is for making the choices possible. Tonight is for making one.`)
      ],
      choices: [
        C(`Swap the tape: put the Wake tone where Grand Harmony should be.`, "r_tape"),
        C(`Make the Anthem itself carry the Wake tone: the choir.`, "r_choir"),
        C(`Use the Ledger: send the proof to every ear that will take it.`, "r_ledger"),
        C(`Go through the Inspector.`, "r_voss", { cond: "flag.voss_met" }),
        C(`Leave. The night tram. Take as many as will fit.`, "r_tram"),
        C(`Stop thinking. Get dressed.`, "last")
      ]
    }),

    r_tape: N("narrator", `The simplest wicked plan: Grand Harmony is a tape. A tape is a thing. A thing can be swapped for another thing. In the relay's vault there is a wheel like a ship's, and behind it a reel with a Ministry stamp, and in your head a pitch you cannot hum without Ilsabet's headphones.\n\nTo do it you need three things: a tone that wakes instead of soothes, a way through the gate, and a quarter-hour when Captain Brune is looking at something else. Everyone you have met is, in some small way, one of those three things.`, {
      interjections: [
        I("slip", 4, `The vault door is a wheel and a lock and a nervous man behind it. The hard part is the nervous man.`, { cond: "!flag.tomas_ally" }),
        I("reflex", 3, `Catch it before it falls. Swap it before it plays. Both are the same muscle.`)
      ],
      choices: [C(`Go back.`, "plan")]
    }),

    r_choir: N("narrator", `The Anthem will be sung tonight, live, from the Ration Hall stage, into a microphone wired to the school PA. Fenwick's choir of forty children is the one thing in the district that is permitted to be loud at the hour of the Bell. If the Wake tone rides inside the pedal note, the way a pill rides in a spoonful of jam, the Anthem becomes a lullaby that wakes people up.\n\nYou will need a score, a choir with the nerve, a tone, and a headmistress too busy to listen.`, {
      interjections: [
        I("rhetoric", 3, `Subversion by hymn. It has been done. Usually by clergy, usually badly, once by a goat.`),
        I("solidarity", 3, `We are forty small voices and a conductor who says "ah". We like our chances.`)
      ],
      choices: [C(`Go back.`, "plan")]
    }),

    r_ledger: N("narrator", `The Ledger is paper. Paper has a very bad reputation in this Union and an excellent record. If it reaches the Hall stage, if it is read aloud into a live mic, or copied nine times into nine Catechisms, if it is handed to someone tired enough to believe it, then Tuesday survives Thursday: in print, in other people's handwriting, outside anybody's skull.\n\nThe price is the usual one. Loud means found.`, {
      interjections: [
        I("archive", 3, `Practical note: copies. Nine copies on nine typewriters cannot be forgotten by one tape. It can only be burnt, nine times, by nine policemen, and policemen get tired.`),
        I("adrenaline", 3, `SHOUT IT. Put it in a microphone and SHOUT IT.`)
      ],
      choices: [C(`Go back.`, "plan")]
    }),

    r_voss: N("narrator", `You could take the Inspector's hand. The black car, the badge, a cold clean office with a view of a warm clean street. Voss could keep the district from forgetting you, and in exchange you would help the district forget everything else, very well, for forty years, in a good coat.\n\nOr you could take his hand and then not let go of it, at the right moment, in the wrong direction. That is called turning a man. It has historically ended in tears.`, {
      interjections: [
        I("doublethink", 3, `Oh, it's a wonderful future. We would be so valuable. They would call us "Officer" and the pillows would be ironed.`),
        I("empathy", 4, `He wanted somebody to do it better than he did. He is hoping that somebody is you. That is not a trap; that's far worse. It is hope.`)
      ],
      choices: [C(`Go back.`, "plan")]
    }),

    r_tram: N("narrator", `Nadia Fell drives the night tram, sells everything that is not nailed down, and has nailed down very little. The tram leaves Karsov Avenue at 20:40, in the middle of the Jubilee, when every eye in the district will be looking up at a loudspeaker. Beyond the terminus there are mills, post offices, nine typewriters, a province with different slogans.\n\nYou could save the ones who can be saved. You could also leave eleven thousand people to wake up in a clean room, entirely forgiven for what they did not know.`, {
      interjections: [
        I("grit", 4, `A person can carry some things and not others. A district is one of the others.`),
        I("volition", 4, `It is a legitimate choice. I will not call it cowardice. I will call it arithmetic, and I will watch your face while you do the sum.`)
      ],
      choices: [C(`Go back.`, "plan")]
    }),

    last: N("volition", `Boots. Water. Face. There are fourteen hours of day and one hour of the thing you are going to do with it, and the first rule of Thursday is: do not be late to your own revolution.\n\nOutside, the loudspeaker finishes its eleven bars of the Jubilee March and begins again, a note lower, as if it too has been tuned by somebody who does not know the tune.`, {
      onEnter: [{ xp: 1 }],
      choices: [X(`Go downstairs.`)]
    })
  }
},

// =====================================================================
enter_tower: {
  title: "The Bell Tower",
  start: "climb",
  nodes: {
    climb: N("narrator", `The spiral stair goes up behind the Library like an argument that has nothing to do with books. A hundred and twelve steps; you count them because you cannot help it, and at step ninety the wallpaper stops and the brick begins. The air thickens with pigeon and old rope. A little light leaks down in coins.\n\nAt the top a trapdoor stands open and a smell comes through it: iron, oil, cold, and a sort of warm animal quiet, like the inside of a church bell when nobody is ringing it.`, {
      onEnter: [{ task: "task_hob", state: "active" }, { note: "task_hob", text: "A bellringer lives at the top of the Library stair. He does not speak. He keeps the Great Bell, and the Bell, I think, keeps him." }],
      interjections: [
        I("stamina", 3, `A hundred and twelve. I counted, which is the only way I know how to love a staircase.`),
        I("the_grey", 4, `The tower has stood through three regimes. It is the only building in the district that remembers what the sky looked like before the loudspeakers. It says nothing. It is being polite.`),
        I("senses", 3, `Cold, then warmer. Somebody has been keeping a stove going up there, and has not wanted the smoke noticed.`)
      ],
      choices: [C(`Climb through the trapdoor.`, "top")]
    }),

    top: N("narrator", `The top of the tower is a wooden room with the walls knocked out. Wind comes through. In the middle, hanging from a beam as thick as a horse, is the Great Bell: bronze, green at the lip, the size of a small truck, and entirely silent. Ropes fall from its yoke through holes in the floor. A bank of loudspeaker horns the colour of old teeth is bolted to the east railing, aimed at the whole district like the mouths of a congregation.\n\nBeyond the railing is everything: the roofs of School No. 9, the wet brown ribbon of Karsov Avenue, a tram crawling, a black car, and in the far distance the little concrete box with an aerial that hums at the edge of your fillings.`, {
      interjections: [
        I("senses", 4, `Ozone from the horns. Rope tar. Pigeon, but old pigeon, the kind that has retired. And a hum in the bronze, so low it would not be a sound if your teeth did not carry it.`),
        I("authority", 4, `COMMAND POST. This is a command post, and it has been a command post for a hundred years, and it was never given to anyone who could use it.`),
        I("rote", 3, `THE GREAT BELL OF SCHOOL NO. 9: CAST BEFORE THE UNION, RUNG FOR THE UNION, RUNG, ON ONE OCCASION, AGAINST IT.`, { once: true })
      ],
      choices: [C(`Look for whoever keeps this place.`, "hob_sighted")]
    }),

    hob_sighted: N("narrator", `He is standing with his back to you, forty feet away, by the ropes. He is old, in a way that looks structural: big shoulders turned small, a brown coat tied at the waist with a bell-rope, a cap of grey wool pulled down over his ears and, beneath it, a smear of yellow that could be wax. His hands rest on a rope the way a man's hands rest on the neck of a horse.\n\nHe has not turned. He has not heard you. He has, you realise, felt you: his shoulders came up when your boot touched the last step, and now they are slowly coming down.`, {
      interjections: [
        I("empathy", 3, `He is frightened and he is not frightened of you. He is frightened of the day. You are only the next thing in a long line of things the day has put through that trapdoor.`),
        I("instinct", 3, `Don't walk up behind him. Walk where he can see your feet.`),
        I("composure", 4, `Hands in the open. Face calm. You are going to be examined by a man who has spent thirty years listening to what bronze says about people.`)
      ],
      choices: [
        C(`Stamp twice on the boards. Let him feel you coming.`, "stamp"),
        C(`Walk round where he can see you.`, "stamp"),
        C(`Look at the bell instead. Let him come to you.`, "bell_first")
      ]
    }),

    stamp: N("narrator", `The boards pass the news along to his boots before your voice could. He turns. Slowly, a full half-circle, the way a ship turns in a canal.\n\nHis face is a map of weather. His eyes are a pale, pooled grey, very steady. Wax plugs fill his ears, honey-coloured, kneaded in daily. When he looks at you he looks at your mouth, then your hands, and then, curiously, your ears: left one, right one. A small crease goes through his forehead and stays.`, {
      interjections: [
        I("senses", 4, `Wax in both ears. Not for comfort: they have been replaced so often the canals are scarred. He does not hear the bell because the bell has already used up everything he had.`),
        I("empathy", 4, `He looked at your ears and not your eyes, because he knows how people carry the thing that is wrong with them. He is checking whether you hear it too.`, { effects: [{ xp: 1 }], once: true })
      ],
      choices: [C(`Speak to him.`, "speak"), C(`Don't. Hold up both hands, palms open.`, "hands")]
    }),

    speak: N("narrator", `You say hello. You say your name. His face does not move, and at the corner of his mouth something that might be apology tilts up and sets again. He lays one hand flat against his own breastbone, then one flat against his ear, and shakes his head: no, not that. Then he holds up a small wooden mallet.\n\nHe does not speak because he does not hear himself. He does not hear himself because, you will come to believe, he decided long ago that the thing worth saying should be said once, by bronze.`, {
      interjections: [
        I("empathy", 3, `It isn't that he can't. It's that nobody has asked him a question worth the breath in thirty years.`),
        I("rhetoric", 3, `Do not make a speech. A man who has lived with a bell does not need a speech. He needs one clear sentence and a pause the size of the room.`)
      ],
      choices: [C(`Hold your hand out, palm up, for the mallet.`, "pause")]
    }),

    hands: N("narrator", `You hold up your hands, palms out. He looks at them. He looks for a long time, as if he were checking for what is not in them, and finds it. His shoulders come down. Something that is not quite a smile arrives and does not stay.\n\nHe taps his own breastbone twice, flat-handed. A greeting, or a verdict. You will have to learn which.`, {
      interjections: [
        I("charm", 3, `Excellent. You've made a friend by having nothing to sell. That's the rarest pitch in the district.`)
      ],
      choices: [C(`Step closer.`, "pause")]
    }),

    bell_first: N("narrator", `You turn to the Great Bell instead and stand under it. From here it is a bronze sky. The inside of the lip is polished bright in a single stripe where, for a hundred years, a clapper has struck the same place. The clapper is a lump of iron like a sleeping calf, and someone has lashed a leather strap around it, tight, so that it cannot swing free.\n\nBehind you the boards creak, once, and a weight settles. You feel him come and stand, a polite arm's length behind your left shoulder. He has been watching you look.`, {
      interjections: [
        I("deduction", 4, `The strap. He muffled the clapper. The Great Bell has not been rung freely in some time. Somebody ordered it quiet, or somebody ordered it to wait for a signal.`, { effects: [{ set: "tower_clapper_strapped", val: true }] }),
        I("instinct", 4, `He wants you to see it. He stood behind you on purpose, to let you finish.`)
      ],
      choices: [C(`Turn around.`, "pause")]
    }),

    pause: N("narrator", `The two of you stand in a silence you could rent out by the hour. Outside, a loudspeaker begins eleven bars of the Jubilee March and falls over. The old man's eyes go, in the unmistakable way of the deaf, to your boots: the vibration told him the tune before you could.\n\nHe lifts the mallet and, with a small wry motion, taps the rim of the bell just once. A pure note, soft as breath, drifts out into the grey. He watches your face to see what the note does to it.`, {
      onEnter: [{ set: "tower_entered", val: true }],
      interjections: [
        I("rote", 3, `E-FLAT. THE NOTE IS E-FLAT. THIS NOTE IS E-FLAT. WHY IS IT NOT THE SAME E-FLAT?`),
        I("senses", 4, `No shiver in it. No beat folded under. The bell is just a bell. It says one thing and means it.`, { effects: [{ xp: 1 }], once: true })
      ],
      choices: [
        C(`Go to him.`, "to_hob", { cond: "day < 3" }),
        C(`Go to him.`, "to_hob3", { cond: "day >= 3" })
      ]
    }),

    to_hob: N("narrator", `He nods once, as if the pause had been an exam and you had finished writing. He gestures at the nearest thing that will take a seat: an upturned bucket, an iron stool, a coil of rope the size of a drum. The wind lifts the pigeons and sets them down again.`, {
      choices: [{ text: `Sit with him.`, dialogue: "hob" }, X(`Not yet. Look around first.`)]
    }),

    to_hob3: N("narrator", `He nods once, as if the pause had been an exam and you had finished writing. He gestures at the nearest thing that will take a seat: an upturned bucket, an iron stool, a coil of rope the size of a drum. Beyond the railing the whole day is waiting, and in its middle the 20:00 hour, like a stone in a plum.`, {
      choices: [{ text: `Sit with him.`, dialogue: "hob_d3" }, X(`Not yet. Look around first.`)]
    })
  }
},

// =====================================================================
w_bell: {
  title: "The Great Bell",
  start: [{ cond: "flag.w_bell_rung", node: "again" }, { cond: "flag.w_bell_read", node: "hub" }, { node: "look" }],
  nodes: {
    look: N("narrator", `Up close the Great Bell is less an object than a weather system. Bronze, mottled green, a lip you could sit a child on, and a skin of old dents and polishing where a hundred years of hands have asked it for time. Pigeon droppings have been scrubbed from the crown by someone who loves it. The clapper is lashed in leather, as tight as a fist.\n\nLettering runs round the shoulder in raised capitals, half under verdigris.`, {
      onEnter: [{ set: "w_bell_read", val: true }],
      interjections: [
        I("archive", 3, `A founder's mark: "OSTRAV AND SONS, TARNOV." Foundry closed forty years before the Union. This bell was cast by people who thought a bell was for calling children home.`),
        I("brawn", 3, `Four hundred kilos of wanting to be pushed. I would like to push it. I would not like to be near it afterwards.`),
        I("the_grey", 4, `The bell is the only thing in this tower that has never lied. I love it for that. It is also the only thing I would call a friend, and it has not spoken to me in decades. We understand each other.`)
      ],
      choices: [
        C(`Read the inscription.`, "inscription"),
        C(`Look at the strapped clapper.`, "clapper"),
        C(`Knock on the lip with a knuckle.`, "knock"),
        X(`Leave it be.`)
      ]
    }),

    hub: N("narrator", `The Great Bell hangs over you with the patience of something that has always been about to be rung. The strap on the clapper has not moved. The inscription is still there, dimly gold.`, {
      choices: [
        C(`Read the inscription again.`, "inscription"),
        C(`Look at the strapped clapper.`, "clapper"),
        C(`Knock on the lip.`, "knock"),
        C(`[Brawn] Unlash the clapper and ring it.`, "ring_ask", { cond: "!flag.w_bell_rung" }),
        X(`Leave it be.`)
      ]
    }),

    inscription: N("narrator", `CALL THE CHILDREN HOME, it says round the shoulder, and beneath, in smaller letters, almost lost: WHEN THE HUNGER IS REMEMBERED, LET THIS BELL BE RUNG ONCE FOR EACH WHO WAS NOT. And a date, in the old calendar, thirty years before the Union learned how to count.`, {
      onEnter: [{ xp: 1 }, { thought: "th_quiet_hours" }],
      interjections: [
        I("archive", 4, `"When the Hunger is remembered." Not "when the Hunger is over." Remembered. The founders believed a thing was not finished until it was recalled out loud. The Ministry would call that a mistake in the Articles of Association.`, { effects: [{ set: "w_bell_charter", val: true }], once: true }),
        I("empathy", 4, `Somebody wrote that to be a promise. Somebody else is going to have to keep it.`),
        I("doublethink", 3, `A bell with a sentiment. How quaint. The Union has so many fine, reliable sentiments of its own and they work on a timer.`)
      ],
      choices: [C(`Back.`, "hub")]
    }),

    clapper: N("narrator", `The strap is a belt of black leather, buckled twice, new where the rest is old. The buckle has been polished, the way a man polishes what he is ashamed of. Under the leather the iron tongue is bright; a hand has stroked it every day.\n\nA tag hangs from the buckle: CONTROL OF STRIKING, DISTRICT 9, BY ORDER OF THE MINISTRY OF QUIET HOURS. A signature you have seen before: a neat, rounded hand, the kind that signs forty thousand forms.`, {
      interjections: [
        I("deduction", 4, `Marr's hand. The Principal signed the order muzzling the bell. She did it neatly, the way people do the things they would like to be forgiven for.`, { effects: [{ set: "tower_marr_signed", val: true }], once: true }),
        I("authority", 3, `Someone has decided that this bell will ring when it is told. Not when it wishes.`),
        I("slip", 4, `The buckle is stiff, but it is not locked. It has never been locked. Nobody thought anybody would climb this far.`)
      ],
      choices: [C(`Back.`, "hub")]
    }),

    knock: N("narrator", `You knock on the lip. The bronze gives back a small, sweet, instantly dying note, as if embarrassed. Before it has gone, a second knock answers from behind you: the old man has put a knuckle to the other side. Without looking, he raises two fingers, then cuts the air, flat: that is enough, that is quite enough, we are not going to wake it up.`, {
      interjections: [
        I("senses", 3, `The note has a body. It is not a taped note, not a note of the Bell's ironed silver. It's warm. It's a hand-hammered, local, slightly wrong note. If you had to choose a note to wake up to, it would be this one.`),
        I("charm", 4, `He's amused by you. Keep it, and ask for nothing. It is the only currency he has never counterfeited.`)
      ],
      choices: [C(`Back.`, "hub")]
    }),

    ring_ask: N("narrator", `The strap is stiff, the buckle stiffer. You put both hands on it. The bellringer, from his place by the ropes, goes very still, then very slowly raises one palm toward you: not stop, not yet. Wait.\n\nThe Ministry will hear a ringing bell. Every pole in the district carries a sensor that notices when the Great Bell speaks out of schedule. If you ring it, you ring it now, and you ring it for everyone who is listening.`, {
      interjections: [
        I("adrenaline", 3, `RING IT RING IT RING IT.`),
        I("volition", 4, `Not this morning. Don't spend the one bell on a rehearsal. He has asked you to wait; so wait.`),
        I("archive", 4, `Regulation 14(b): any unscheduled tolling of a District bell is a Class Two Disturbance. Penalty: Surveillance +25 and an invitation. You would be invited to explain yourself in a nice grey room.`)
      ],
      choices: [
        K(`[Brawn] Unbuckle it anyway. Hit it once, softly.`, "brawn", 11, "w_bell_ring", "ring_pass", "ring_fail", { w: 1 }),
        C(`Step back. Not yet.`, "hub")
      ]
    }),

    ring_pass: N("narrator", `You get the clapper loose, take its weight in your arms like an unwilling child, and let it kiss the bronze once, gently, from three inches away. The note is small and low and goes through the tower like a hand through water. Every pigeon on the beams lifts, wheels, and returns.\n\nThe bellringer is looking at you with a face entirely transformed. He has felt it through his boots. He puts his fist to his chest and then, softly, to yours.`, {
      onEnter: [{ set: "w_bell_rung", val: true }, { xp: 2 }, { surv: 6 }, { toast: "The Great Bell spoke. A pole below flickers." }],
      interjections: [
        I("the_grey", 3, `Down in the pipes they are talking about it already. A bell has rung out of turn. Nobody has been told to be afraid. Therefore, everyone is a little afraid. It is how the news travels.`),
        I("solidarity", 4, `That was ours. The first thing in the district that rang because someone chose it. We could feel it all the way down the avenue.`)
      ],
      choices: [C(`Step away from the bell.`, "again")]
    }),

    ring_fail: N("narrator", `The buckle bites a nail. The clapper, half unlashed, swings a hand's width and slams, clumsily, against the bronze. The note that comes out is not a note; it is a bang, a heartless clang like a dropped tray, followed by a cloud of pigeons.\n\nAt the ropes the old man claps both hands to his own chest, not from the sound but from the feel of it. Below, the loudspeakers on the poles click and hiss. Somewhere down in the district a window is slammed.`, {
      onEnter: [{ set: "w_bell_rung", val: true }, { surv: 10 }, { hp: -1 }, { toast: "That was loud. Watched +10." }],
      interjections: [
        I("brawn", 2, `Well. It's definitely moved.`),
        I("composure", 3, `Stand still. Look ordinary. You are a student admiring a bell.`)
      ],
      choices: [C(`Step away from the bell.`, "again")]
    }),

    again: N("narrator", `The Great Bell has settled back into its stillness. The strap is back on the clapper, a little crooked, the way a coat is on a child. Up in the beams, a pigeon walks the length of the yoke with an air of having seen worse.`, {
      choices: [
        C(`Read the inscription.`, "inscription"),
        C(`Look at the clapper again.`, "clapper"),
        X(`Leave it be.`)
      ]
    })
  }
},

// =====================================================================
w_ropes: {
  title: "The Bell Ropes",
  start: [{ cond: "flag.w_ropes_read", node: "hub" }, { node: "look" }],
  nodes: {
    look: N("narrator", `Six ropes drop through the floor to the wheel-room below, each as thick as a wrist and each polished dark by hands. But it is the wall behind them you look at first. Every foot of the brick between the beams is hung with cord: hundreds of lengths of it, hanging in ragged ranks from nails, each knotted from top to bottom. Hundreds of thousands of knots, white, brown, black. A smell of tar and old hemp. A whisper when the wind comes through, like a hand drawn across a lot of small leaves.`, {
      onEnter: [{ set: "w_ropes_read", val: true }],
      interjections: [
        I("senses", 3, `The cords are clean. Dusted. Fresh ones have been added within the week: the hemp is still pale at the cut ends.`),
        I("deduction", 4, `Not decoration. The knots are patterned. Fives, then a long loop, then fives again. It is a calendar, or a ledger, or a language, and it was made for one reader only.`),
        I("rote", 4, `A KNOT FOR EVERY NIGHT. A LOOP FOR EVERY WEEK. A TAR-BLACK STRAND FOR EVERY MONTH. (I know this. I do not know how I know this. I think I have seen it in a dream about my grandmother.)`, { effects: [{ set: "w_ropes_code", val: true }] })
      ],
      choices: [
        C(`Read the cords.`, "read"),
        C(`Look for the one tied for you.`, "yours", { cond: "flag.w_ropes_code || skill('archive') >= 4 || skill('deduction') >= 5" }),
        C(`Touch a rope.`, "touch"),
        X(`Leave them.`)
      ]
    }),

    hub: N("narrator", `The ranks of cords hang in the draught from the open railing, turning very slightly, like a congregation listening for their name.`, {
      choices: [
        C(`Read the cords.`, "read", { cond: "!flag.w_ropes_deep" }),
        C(`Look for the one tied for you.`, "yours", { cond: "(flag.w_ropes_code || skill('archive') >= 4 || skill('deduction') >= 5) && !flag.w_ropes_yours" }),
        C(`Touch a rope.`, "touch", { cond: "!flag.w_ropes_touched" }),
        X(`Leave them.`)
      ]
    }),

    read: N("archive", `A white knot is a night when the Bell rang and the old man remembered nothing in the morning but the evidence. A brown knot is a night he remembered a little. A knot tied with a red thread is a person who came to the tower and went away different. A black cord is a name: tied the morning after somebody went missing from the district and nobody in the district could recall that they had lived.\n\nI count one thousand, one hundred and ninety-one black cords on this wall. Each has a name worked into it in tiny stitched letters. I regret that I can read them.`, {
      onEnter: [{ set: "w_ropes_deep", val: true }, { xp: 2 }, { thought: "th_hob_bell" }],
      interjections: [
        I("empathy", 4, `He doesn't trust his memory. He trusts rope. Every morning he wakes and reads the wall and learns himself again. He is the only man in the district who can prove he exists, and the proof is a very long piece of string.`),
        I("solidarity", 3, `A wall of us. All the ones who were forgotten and the one old man who would not agree.`),
        I("grit", 4, `A thousand names. It's only a wall, but it's a wall you can't look at for long.`)
      ],
      choices: [C(`Look closer at the black cords.`, "names"), C(`Step back.`, "hub")]
    }),

    names: N("narrator", `Some of the names you know. A tiny tag stitched into a cord near the bottom says TOBAR PRESCH, TENOR. A name a few rows above reads LEO DANE, ENGINEER, and the date, in knots, is thirty-one years ago. A cord at head height bears no name at all, only a brass thimble and a twist of yellow chalk-dust in the weave.\n\nLeaning against the wall below is a small, clean ladder: the sort you climb to add a cord to the very top.`, {
      interjections: [
        I("archive", 4, `Leo Dane: Ostrov's father, if the index is correct. Struck from the District Roll thirty-one years ago and never mentioned again, including by the son who inherited his surname and did not know where it had come from.`, { effects: [{ thought: "th_borrowed_memory" }], once: true }),
        I("empathy", 4, `Tobar. The Cook's husband. He came home from the Reading Room and ate her bread and did not know it was hers. The old man tied his name here, a year ago. He has never met the Cook. He loves her anyway, in the way you love someone whose handwriting you have read.`, { effects: [{ set: "w_ropes_tobar", val: true }], once: true }),
        I("the_grey", 3, `Count with me: one thousand, one hundred and ninety-one. It is the only census in the district that includes everybody.`)
      ],
      choices: [C(`Step back.`, "hub")]
    }),

    yours: N("narrator", `It is near the top, within easy reach of a ladder: a single cord the colour of faded navy, wool and not hemp, spun from the thread of a school uniform. Tied into it, tight and well-pulled, are three knots, then a loop, then a fourth knot, set apart. A small tag, written with a steady hand and the wrong spelling, hangs from the end: THE ONE WHO RAN PAST.\n\nThe date in knots is the night before Tuesday. You were here. You ran past the tower with something wrapped in a flag, and the one man in the district who could not hear the Bell saw you do it.`, {
      onEnter: [{ set: "w_ropes_yours", val: true }, { xp: 2 }, { thought: "th_ghost_of_yesterday" }],
      interjections: [
        I("instinct", 4, `That's not a knot for a stranger. It's a knot for someone who was running toward something. He tied it for luck.`),
        I("volition", 4, `You were here and you do not remember it, and a stranger kept the proof for you for three days. Take it as the kindness it is.`),
        I("empathy", 5, `The fourth knot, set apart, is the knot he ties for those he hopes will be back. It is a small tight knot. He wanted very much for you to be back.`)
      ],
      choices: [C(`Step back.`, "hub")]
    }),

    touch: N("narrator", `You put your hand on the nearest rope. It is warm. From below, through the boards, a long slow vibration comes up the hemp into your palm: the wheel-room's old mechanisms, a tremor in the tower's bones, a heart of sorts.\n\nBehind you the bellringer has stopped what he was doing. He crosses the floor, takes the rope from you gently, and puts it back into your hand in a better grip: lower, wrist turned, the way you hold something that is going to be asked to do a great deal.`, {
      onEnter: [{ set: "w_ropes_touched", val: true }],
      interjections: [
        I("reflex", 3, `Hold it lower. He's right. The weight will come from underneath.`),
        I("brawn", 3, `You could ring this. It'd take two. It would take your whole back, and I am very ready.`)
      ],
      choices: [C(`Let go. Nod to him.`, "hub")]
    })
  }
},

// =====================================================================
w_array: {
  title: "The Speaker Array",
  start: [{ cond: "flag.w_array_traced", node: "again" }, { node: "look" }],
  nodes: {
    look: N("narrator", `Twelve horn speakers, bolted in a fan to the east railing and aimed over the district like a firing line. Each is the colour of old teeth and the size of a person. They are brand new in the oldest tower in the district: the paint is still sticky on the brackets. A black trunk cable as thick as your arm drops from the horns to a grey junction box nailed to a beam, and from the box into a hole in the floor.\n\nA stencil on the box: MINISTRY OF QUIET HOURS. PEDAGOGIC HARMONY: GRADE 3. DO NOT TOUCH. AND IF YOU HAVE TOUCHED, THANK YOU FOR YOUR HONESTY.`, {
      interjections: [
        I("rote", 3, `PEDAGOGIC HARMONY: GRADE 3. SCHOOLS ONLY. (GRADE 1 IS THE DISTRICT. GRADE 2 IS BARRACKS. GRADE 3 IS CHILDREN, WHO NEED MORE.)`),
        I("senses", 4, `Warm. The horns are warm, which means the box is live, which means the whole array is being fed even now. At this hour it is carrying silence. A fed silence.`),
        I("authority", 4, `A weapon is a weapon when somebody is told it is a lullaby.`)
      ],
      choices: [
        K(`[Deduction] Trace the cable into the floor.`, "deduction", 9, "w_array_trace", "trace_ok", "trace_bad", { w: 1 }),
        C(`Open the junction box.`, "box"),
        X(`Leave it.`)
      ]
    }),

    trace_ok: N("deduction", `It had to have been done in a hurry: the cable goes into the floor, down the stair-well in a staple-and-tar line, across the Library's rafters, out through the wall and down the Courtyard pole to the ground main. And it comes up again on the far side of the box: a second cable, the same black, running out of the tower's east window on a wire. West, to the District Relay.\n\nTwo feeds. One is the school's: Pedagogic Harmony, nightly, from the Principal's cellar desk. The other is new, run in on Tuesday, installed by men with a ladder: a direct line from the Relay's aerial deck. For tonight. It will carry Grand Harmony straight into this horn array, at full gain, to a tower that was built to call children home.`, {
      onEnter: [{ set: "w_array_traced", val: true }, { xp: 2 }, { note: "task_jubilee", text: "The tower's twelve horns have a new feed from the Relay aerial, run in on Tuesday: tonight they carry Grand Harmony at full gain. The old school feed still runs from the Principal's cellar desk. The junction box sits between them." }],
      interjections: [
        I("archive", 4, `Per Regulation 22: only one feed to a Grade 3 array may be live at a time. A switch on the junction box chooses between them. It is a small brass switch. It is currently thrown to RELAY.`, { effects: [{ set: "w_array_switch_known", val: true }] }),
        I("rhetoric", 4, `Two feeds means two voices can be chosen between. You'd think a Ministry would have thought of that. They did. They thought you would not climb the tower.`)
      ],
      choices: [C(`Open the junction box.`, "box"), C(`Leave it.`, "again")]
    }),

    trace_bad: N("deduction", `The cable goes into the floor. And then it does not come out anywhere you can follow. There are staples, and tar, and it disappears behind a joist and returns, or does not, as the wiring in this Union always has: on faith.\n\nYou take a few more minutes to be sure, and are not sure.`, {
      onEnter: [{ time: 10 }],
      choices: [C(`Look at the box instead.`, "box"), C(`Leave it.`, "again")]
    }),

    box: N("narrator", `The junction box opens with a quarter-turn. Inside: terminal blocks, a transformer in a cage, a brass changeover switch stencilled RELAY / SCHOOL, and, tucked under the lid in a nest of cable-ties, a typed card: INSTALLED BY ENG. T. WEND. IF THIS FAILS, SEE HIM, NOT ME.\n\nThere is a quarter-inch jack socket at the bottom, labelled, in someone's neat pencil, TEST. It is not part of the official wiring. Somebody put it there on purpose.`, {
      onEnter: [{ set: "w_array_box_open", val: true }],
      interjections: [
        I("empathy", 3, `Tomas. A tired man who wired a weapon and then, out of a decency he could not defend, left a back door in it. Somebody leaves a way out in everything, if you look.`),
        I("sleight", 4, `A quarter-inch jack: the same as the Hall's stage patch. Your mic cable would fit. So would any cable with a clean signal and a nervous owner.`, { effects: [{ set: "w_array_jack_known", val: true }] }),
        I("slip", 4, `You could throw the switch to SCHOOL in a second and a half. It would get noticed in about eleven.`)
      ],
      choices: [
        C(`[Mic cable] Patch the jack, ready for tonight.`, "patch", { cond: "has('mic_cable') && !flag.w_array_patched" }),
        C(`Throw the changeover to SCHOOL. Just to see.`, "switch", { cond: "!flag.w_array_switched" }),
        C(`Close the box.`, "again")
      ]
    }),

    patch: N("narrator", `You run the cable from your pocket into the TEST socket and out along the beam, under the bunting, to a hook behind the railing where nobody will glance. It takes four minutes and a vocabulary. When it is done there is a plug at the end of a black cord, a yard from the old man's rope, which can feed anything you like to twelve horns over the whole school grounds and, if the changeover is thrown, down every pole in the district.\n\nThe old man watches, hands motionless, and then, without a word, tucks a bit of burlap over the plug so the pigeons will not be curious.`, {
      onEnter: [{ set: "w_array_patched", val: true }, { xp: 2 }, { note: "task_jubilee", text: "The tower array now has a hidden patch cable, a plug I can feed from anywhere in the tower. The changeover switch decides whether it speaks to the school, or the whole district." }],
      interjections: [
        I("aim", 3, `Straight run. Tight to the beam. The cable has a good line to it, and so, for once, do you.`),
        I("composure", 4, `Pigeons, burlap, hush. Do not look at the plug when anyone is looking at you.`)
      ],
      choices: [C(`Close the box.`, "again")]
    }),

    switch: N("narrator", `You throw the switch with one finger. The horns above you take a breath through the hiss, and every one of them says, very softly, in a woman's voice, "Pedagogic Harmony will begin at the usual hour." Then the whole array falls back into its fed silence. You throw it back. Nothing explodes. Somewhere under your feet a relay clicks like a tongue.\n\nIt works. It is a switch. It is a very small switch with a very large audience.`, {
      onEnter: [{ set: "w_array_switched", val: true }, { xp: 1 }, { surv: 4 }],
      interjections: [
        I("adrenaline", 3, `YOU TOUCHED IT. IT TOUCHED BACK. OH, WONDERFUL.`),
        I("volition", 3, `Enough. You know what it does. Leave it where it was.`)
      ],
      choices: [C(`Close the box.`, "again")]
    }),

    again: N("narrator", `Twelve horns wait over the district in their fan, sticky with new paint and full of nothing. The old man has gone back to his ropes; he does not look at the box. He is a man who knows precisely what he did not see.`, {
      choices: [
        C(`Open the junction box.`, "box", { cond: "!flag.w_array_box_open" }),
        C(`Look at the box again.`, "box", { cond: "flag.w_array_box_open" }),
        X(`Leave it.`)
      ]
    })
  }
},

// =====================================================================
w_view: {
  title: "The View",
  start: "look",
  nodes: {
    look: N("narrator", `The whole district lies in the railing's frame like a map somebody drew while angry. Roofs of School No. 9 below you, green-grey, bunting like a rash. The courtyard, tiny, a statue with a wreath. Karsov Avenue running east, brown and wet, with its tram and its queue and its black car. Chimney stacks. A school of pigeons on the river of cloud. In the farthest distance a flat concrete box with a thin red aerial, humming faintly at the edge of your fillings, as if it were thinking about you.\n\nEvery pole has a speaker. Every speaker has a ribbon. The district is ready for its party and its amnesia.`, {
      interjections: [
        I("the_grey", 3, `Eleven thousand windows. I live in all of them. Tonight they will all be told what to remember, and I will be the one who has to carry the leftovers, in the drains, down to the river. I am used to carrying what people drop.`),
        I("senses", 4, `You can hear everything from up here: the tram's brakes, a Cook clattering a pot, a girl somewhere practising scales, the hum from the Relay. It is a lovely noise. It is, you realise, a noise that will not exist on Friday.`),
        I("instinct", 4, `Three people are looking up at you from the courtyard. Do not wave.`)
      ],
      choices: [
        C(`Look at the Relay.`, "relay"),
        C(`Look at Karsov Avenue.`, "avenue"),
        C(`Look down at the school.`, "school"),
        C(`Look at the sky. What time is it, up here?`, "sky"),
        X(`Turn away from the railing.`)
      ]
    }),

    relay: N("narrator", `District Relay No. 4 sits at the end of the avenue like a grey sugar cube dropped by a god. The aerial on its roof is a red-and-white pole, with a wire running from its tip, in a long slack curve, over the roofs of the district and, you realise, straight toward you. The wire ends at the tower. You are standing on the other end of a thread.\n\nA small figure in a coat stands at the relay's gate: Captain Brune, you suppose, doing a captain's slow circuit. There are two lorries, neither marked.`, {
      onEnter: [{ xp: 1 }, { set: "w_view_relay", val: true }],
      interjections: [
        I("deduction", 4, `Line of sight. The tower sees the relay and the relay sees the tower. That is not an accident: a direct feed needs a clear path. If anything goes wrong with that wire, this is the one place in the district that will be able to see it fail.`),
        I("authority", 4, `A strategic position. Fortunately it is occupied by a student, a bellringer, and several pigeons.`),
        I("rote", 3, `RELAY NO. 4. CAPACITY: ONE DISTRICT. HOURS OF OPERATION: ALL.`)
      ],
      choices: [C(`Look elsewhere.`, "look")]
    }),

    avenue: N("narrator", `Karsov Avenue is a worm of grey at this height. The ration queue stretches round the block, a long chain of shawls and caps, shuffling forward at the rate of a thought. A tram stands at the stop with its trolley-pole up; a woman in a long coat is leaning out of the cab, smoking, doing nothing with great skill. A black car idles by the kerb. A man in a good coat stands beside it with his hands in his pockets and a face turned upward, toward the tower, calmly, as if he had been waiting for the view to wave.\n\nHe raises one hand. A small, polite gesture, the sort you give a neighbour on a balcony.`, {
      onEnter: [{ xp: 1 }, { set: "w_view_avenue", val: true }],
      interjections: [
        I("instinct", 4, `That's him. That's Voss, and he knows exactly where you are standing, and he is not even slightly worried about it.`, { cond: "flag.voss_met" }),
        I("empathy", 4, `A thousand shawls. Not one of them has a plan for the evening except to be present. That is the only thing they have ever been trusted to do.`),
        I("doublethink", 3, `The queue is orderly. See how orderly. A Union is a long line in a good mood.`),
        I("senses", 3, `The tram's bell, the queue's murmur, a baby. And a flat drone from a loudspeaker on the third lamp-post: testing, testing, one, two. Grand, grand harmony.`)
      ],
      choices: [C(`Look elsewhere.`, "look")]
    }),

    school: N("narrator", `School No. 9 from above is a tidy grey hand with a green palm: the courtyard, the Ration Hall roof, the gym's long skylights like a row of closed eyes. Little figures cross the square in ones and twos: a woman limping with a cigarette, a man in overalls looking at the sky as if it owed him money, a girl in a red-brown coat who does not look up at all.\n\nThe Ration Hall's stage has been dressed with bunting. Forty chairs have been set in a fan in front of a lone microphone. Everything you could plausibly ruin is in a single glance.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("authority", 3, `Sightline to the stage: clear. Sightline to the Principal's window: clear. Sightline to the gate: clear. Do not say it aloud, but this is a very good place to lose a war from.`),
        I("empathy", 4, `Look at how small they are. Every one of them is carrying something they cannot say. From up here it's visible, a faint grey tint on the ones who've been awake too long.`),
        I("solidarity", 4, `We are all down there. We are very small and we are standing in the same direction.`)
      ],
      choices: [C(`Look elsewhere.`, "look")]
    }),

    sky: N("narrator", `The clouds have come in low and leaden, the colour of the school's walls. There is a split in the west where the late sun will go, a thin line of orange like a fingernail. The air tastes of wet iron, and something else: a tension, like the second before a glass breaks.\n\nSomewhere down in the district a loudspeaker tries out a single ascending note. E-flat. It sounds, from this height, like a person trying not to cry.`, {
      interjections: [
        I("stamina", 3, `You have the day. It's long. It will pass anyway.`),
        I("the_grey", 4, `Rain by evening. A fine one, fussy. It will take the colour out of the bunting just as the Jubilee begins, and I will be responsible, and I will not apologise.`),
        I("volition", 3, `Twenty hundred is a number. It is also a place. You have been walking toward it since Tuesday. Today, look at it directly, once, and then turn and go downstairs and do the work.`)
      ],
      choices: [C(`Look elsewhere.`, "look")]
    })
  }
},

// =====================================================================
hob: {
  title: "Hob the Bellringer",
  start: [{ cond: "flag.hob_met", node: "hub" }, { node: "seat" }],
  nodes: {
    seat: N("narrator", `He lives in the corner of the tower the wind forgot: an iron stove the size of a hatbox, a kettle with a dented lid, a camp bed made up with military corners, a shelf holding three tin cups and a single book whose spine has been rubbed blank. Everything is clean. He pours something steaming into the nearest cup and holds it out without looking at you, the way you hold out a cup to a stray you have already decided to feed.\n\nNo words. Not one. The kettle talks more than he does, and it has a better accent.`, {
      onEnter: [{ set: "hob_met", val: true }, { xp: 1 }],
      interjections: [
        I("empathy", 3, `Hob. Yes, you know the name; you don't know how. It was in the way he tapped his chest. Three beats on the breastbone: low, low, mid. Ho-ob. It is what a child would shout up a stairwell.`, { effects: [{ set: "hob_named", val: true }] }),
        I("appetite", 2, `A WARM CUP. A WARM CUP, HELD OUT BY A STRANGER, WITHOUT A COUPON. Take it before I do something undignified.`),
        I("instinct", 4, `He doesn't need to talk. A man who has lived for thirty years with a bell has a very good grasp of what is, and isn't, worth a sentence.`)
      ],
      choices: [C(`Take the cup.`, "tea"), C(`Politely decline.`, "hub", { effects: [{ set: "hob_declined_tea", val: true }] })]
    }),

    tea: N("narrator", `It is not tea. It is something hot and brown and faintly sweet that tastes of burnt sugar, chicory, and a late-night decision. You drink it standing. He watches you do it with no expression at all and then, as the cup comes down empty, the smallest nod.\n\nHe turns his own cup in his hands, takes a sip, and sets it on the stove, and in the moment he does it you see his hands properly: scarred, huge, each finger a knuckle. The hands of someone who has spent a lifetime talking to a single enormous thing, and been understood.`, {
      onEnter: [{ set: "hob_tea", val: true }, { hp: 1 }],
      interjections: [
        I("appetite", 3, `Burnt sugar. Warm. Hold on to it. It is the best thing that has happened since the sweet roll.`),
        I("grit", 4, `The hands. Look at the hands. He didn't pick up that scar in an accident. That is a rope burn the shape of a decision.`)
      ],
      choices: [C(`Look at him.`, "hub")]
    }),

    hub: N("narrator", `Hob settles on the iron stool by the stove with his knees apart and his hands loose between them. He looks at you with the calm of a man who has never in his life been in a hurry, and whom the world is about to hurry.`, {
      interjections: [
        I("empathy", 4, `Say less than you want to. He is reading your mouth, your hands, your boots. Everything else is noise to him.`),
        I("the_grey", 3, `The bell is humming again. Not a sound; a rumour of one. He's listening to it with his back.`)
      ],
      choices: [
        C(`Point at the knotted wall. Ask with your face.`, "wall", { cond: "!flag.hob_wall" }),
        C(`Point at yourself, then at him. Ask who he is.`, "who", { cond: "!flag.hob_who" }),
        C(`Mime men with ladders and a stamp. Ask about visitors.`, "men", { cond: "!flag.hob_men" }),
        C(`Tap the mallet. Ask him to teach you the bell.`, "rhythm", { cond: "!flag.hob_rhythm && !flag.hob_rhythm_tried" }),
        C(`Give him something.`, "gift", { cond: "!flag.hob_trust && ((has('thermos') && !flag.bronka_thermos_filled) || has('ration_tea') || has('sweet_roll') || has('cigarettes'))" }),
        C(`[Thermos] Hold out the thermos the Cook refilled.`, "thermos", { cond: "has('thermos') && flag.bronka_thermos_filled && !flag.hob_trust" }),
        X(`Nod to him, and go.`)
      ]
    }),

    wall: N("narrator", `He follows your finger to the wall of cords and his whole face changes. He rises, goes to it, and brushes the hanging knots with his fingertips as if feeling a very long child's hair. Then he turns, takes your hand in both of his, and places it flat against his own chest, over the heart, over the breastbone, where the tapping lives.\n\nBeat. Beat. Beat. A slow solid thump, strong as a gate. He holds it there, patiently, and with his other hand taps the wall.`, {
      onEnter: [{ set: "hob_wall", val: true }, { xp: 1 }],
      interjections: [
        I("empathy", 4, `He is saying: this is the one that stays. The heart is the only memory I trust. The wall is where I keep the rest, in case the heart is asked to forget.`),
        I("rote", 3, `A HEART BEATS SEVENTY TIMES A MINUTE. A BELL BEATS ONCE PER TOLLING. BOTH ARE TIMEKEEPERS. BOTH CAN BE TAMPERED WITH.`),
        I("solidarity", 4, `Put your hand where he put it. That's the only handshake a bell-ringer would ever give.`)
      ],
      choices: [C(`Keep your hand there a moment.`, "hub", { effects: [{ morale: 1 }] })]
    }),

    who: N("narrator", `You point at yourself. You say your name aloud and he watches the shape of it. You point at him, and raise your eyebrows.\n\nHe thinks about it for a long time. Then he goes to the Great Bell and puts the mallet to the lip, three times, soft. Low. Low. Mid. A big round note, another big round note, then one a little higher that rises at the end like a question. He sets the mallet down and points at himself.\n\nIt is the sound of a name. It is the sound a hundred children made, every afternoon for thirty years, across a courtyard, when they wanted the bellringer to open the door.`, {
      onEnter: [{ set: "hob_who", val: true }, { xp: 1 }],
      interjections: [
        I("rhetoric", 3, `His name is a phrase of music. He has told it to you with more eloquence than most people manage with a passport.`),
        I("empathy", 4, `Nobody has called him by that name in a long time. Not in a voice. Say it, even if he can't hear. He'll know by your face what you did.`, { effects: [{ set: "hob_said_name", val: true }], once: true })
      ],
      choices: [
        C(`Say his name aloud.`, "name_said", { cond: "!flag.hob_said_name_ok" }),
        C(`Strike the three notes yourself.`, "name_struck"),
        C(`Nod and let it lie.`, "hub")
      ]
    }),

    name_said: N("narrator", `"Hob," you say, to the air in front of his face. He watches your mouth. It takes his eyes a moment to understand it is the shape he knows: one long round shape, a short one, the lip rising.\n\nHe doesn't nod. He puts a hand to his own mouth, thoughtfully, and holds it there. His shoulders come up and then down. When he lowers his hand his eyes are wet, and he looks irritated about it, which is how you can tell it is real.`, {
      onEnter: [{ set: "hob_said_name_ok", val: true }, { morale: 1 }, { xp: 1 }],
      interjections: [
        I("charm", 4, `Mm. That's the one. That's the real one, and you didn't even have to be good at it.`)
      ],
      choices: [C(`Continue.`, "hub")]
    }),

    name_struck: N("narrator", `You take the mallet and tap the lip: low, low, mid. Not quite right. Too crisp; the third note comes out like a hiccup. He tilts his head, then lifts a finger, takes your wrist, and moves it: slower, softer, let the note rise. You do it again.\n\nThis time he laughs. It's a silent laugh, all in the shoulders. He holds up both hands: well enough. You have just said his name in bronze.`, {
      onEnter: [{ set: "hob_said_name_ok", val: true }, { xp: 1 }],
      interjections: [
        I("aim", 3, `Smooth. Lift on the third, as if throwing something very gentle.`),
        I("senses", 4, `You felt it in the mallet's haft before you heard it. The bell talks in your wrist first. That must be what it's like, for him, all the time.`)
      ],
      choices: [C(`Continue.`, "hub")]
    }),

    men: N("narrator", `You mime: a ladder. Two men. Coats. A stamp coming down on a form. The old man's face closes. He goes to the east railing, points at the twelve new horns and at the grey box, and draws a rope across his own throat. Then he lays a pocket-watch gesture on his wrist, holds up eight fingers, and with a flat terrible movement brings his fist down on the beam, once.\n\nAt eight. One stroke. He is to ring the Great Bell once, at eight tonight, to open the Jubilee. He has been told. He has been told he will be thanked.`, {
      onEnter: [{ set: "hob_men", val: true }, { set: "hob_ordered_ring", val: true }, { xp: 1 }, { note: "task_hob", text: "The Ministry has ordered Hob to ring the Great Bell once, at 20:00, to open the Jubilee. He did not agree. He did not refuse. He took us to the railing and showed us the horns." }],
      interjections: [
        I("deduction", 4, `The first stroke of the bell is the cue. Everything starts on it. The relay, the choir, the horns. It is a gun, and they have put a man's hand on the trigger and called it an honour.`),
        I("authority", 3, `HE WAS NOT ASKED. HE WAS INFORMED. THE DIFFERENCE IS NOT LOST ON HIM.`),
        I("empathy", 4, `Whatever he decides, he decides alone, up here, with his ears stuffed full of wax. He does not need advice. He needs somebody to know.`)
      ],
      choices: [C(`Put your hand on his shoulder.`, "hub", { effects: [{ morale: 1 }, { ideo: "undercurrent", n: 1 }] })]
    }),

    rhythm: N("narrator", `You tap the mallet against your palm and then point at the bell. He studies your hand. Then he walks to a roof-beam and begins to tap, with two fingers, in a pattern: seven strokes, a breath, eleven strokes, a breath. Seven. Eleven. Seven. His whole body is in it, a very slight sway, like a man beside a cradle.\n\nIt is the beat. It is the second tone folded into the Bell: the thing Ilsabet pulled out of the carrier with a soldering iron. He knows it. He has always known it. He cannot hear it; he has felt it, in his feet, every night for thirty years, and he has been tapping the answer on the beams after the Bell, to nobody, to the pigeons, to the dark.`, {
      onEnter: [{ set: "hob_rhythm_tried", val: true }, { xp: 1 }],
      interjections: [
        I("rote", 4, `SEVEN. ELEVEN. SEVEN. (I know it. I learned it in assembly, the second verse, the part where everyone claps and does not know why they are clapping on the seventh beat.)`),
        I("senses", 4, `A hint of syncopation. He's not tapping the Bell's beat. He is tapping the Bell's beat backwards: the 11 first, then the 7. The mirror. The reverse. He has been answering the Bell with its own opposite for thirty years.`, { effects: [{ thought: "th_wake_tone" }], once: true })
      ],
      choices: [
        K(`Match the beat with him. Keep it steady.`, "composure", 10, "hob_match", "rhythm_pass", "rhythm_fail", { w: 1 }),
        C(`Listen. Do not join yet.`, "hub")
      ]
    }),

    rhythm_pass: N("narrator", `You find the groove the way you find a stair in the dark: by trusting your foot. Seven, breath, eleven, breath. Your finger and his fall in together, then his hand rises and stops and yours goes on alone, across the beam, steady as a pulse, and he lets it.\n\nHe turns his head to watch your hand with an expression of such open delight you almost drop the beat. When you finish he thumps his breastbone, once, hard. A sound of agreement. A verdict.`, {
      onEnter: [{ set: "hob_rhythm", val: true }, { xp: 3 }, { morale: 1 }],
      interjections: [
        I("composure", 3, `The face is still. The finger is steady. You are a metronome in a school uniform.`),
        I("solidarity", 4, `Two people who have never exchanged a word keeping time. We would like to make this the national anthem.`)
      ],
      choices: [C(`Continue.`, "hub")]
    }),

    rhythm_fail: N("narrator", `You lose the eleven. The seven is fine, the breath is fine, and the eleven comes out as nine, then thirteen, then something else. His finger stops. His eyes, kind but implacable, rest on your hand until it too stops.\n\nHe taps it out again, slower, as for a very tired child. Then he shrugs: not a rebuke, a weather report. The beat will still be there when you are ready.`, {
      onEnter: [{ xp: 1 }],
      choices: [C(`Continue.`, "hub")]
    }),

    gift: N("narrator", `You offer what you have, holding it out in an open palm. He looks at it for a long time, then at you, the way a man looks at the first coin from a country he has not seen in years. You wait. The wind combs the cords on the wall.`, {
      choices: [
        C(`[Give the ration tea.]`, "gift_done", { cond: "has('ration_tea')", effects: [{ take: "ration_tea" }] }),
        C(`[Give the sweet roll.]`, "gift_done", { cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }] }),
        C(`[Give a few cigarettes.]`, "gift_done", { cond: "has('cigarettes')", effects: [{ take: "cigarettes" }] }),
        C(`[Give the thermos.]`, "gift_done", { cond: "has('thermos') && !flag.bronka_thermos_filled", effects: [{ take: "thermos" }] }),
        C(`Hold on. Think again.`, "hub")
      ]
    }),

    gift_done: N("narrator", `He accepts it without ceremony and puts it on the shelf between the cups. A gift accepted is a small treaty; you feel the room warm by a degree. From the pocket of his brown coat he takes a short cord of waxed hemp with a knot in it, and puts it round your wrist, tying it with a bell-ringer's sure fingers, three turns and a pull.\n\nThen he points at the trapdoor, and at you, and at the stove: you may come up. You may come up again.`, {
      onEnter: [{ set: "hob_trust", val: true }, { set: "tower_open", val: true }, { set: "hob_cord", val: true }, { xp: 2 }, { thought: "th_hob_bell" }, { toast: "Hob tied a cord on your wrist. The tower is open to you." },
        { note: "task_hob", text: "Hob has taken a gift from me, and nodded. He will tolerate me on the tower. That is not nothing in a man who has not spoken in thirty years." }],
      interjections: [
        I("solidarity", 3, `A knot on the wrist. We are in the wall, now, aren't we? Not a black cord. The other sort.`),
        I("volition", 4, `Not a bribe, not a bond. A courtesy. Keep it on.`)
      ],
      choices: [C(`Continue.`, "hub")]
    }),

    gift_cord: N("narrator", `He finishes, screws the cap back on with great tenderness, and from the pocket of his brown coat takes a short cord of waxed hemp. He puts it round your wrist and ties it, three turns and a pull. Then he points at the trapdoor, at you, at the stove: you may come up. You may come up again.`, {
      onEnter: [{ set: "hob_cord", val: true }, { toast: "Hob tied a cord on your wrist. The tower is open to you." }],
      choices: [C(`Continue.`, "hub")]
    }),

    thermos: N("narrator", `The thermos is dented and green and stencilled PROPERTY OF THE GREATER UNION RAIL SERVICE, with a threat underneath in somebody else's hand. But it is the Cook who refilled it, and it is still warm in your hands, wrapped in a clean cloth. Taped to the cap is a scrap of greaseproof the size of a postage stamp. You do not know what it says. He does.\n\nHe unscrews the cap with great ceremony. The smell that rises is rye bread and caramelised onion and something else, like the back of a kitchen on a winter evening. He reads the scrap. He reads it again. His whole big face comes slowly apart, and then, with enormous labour, back together.`, {
      onEnter: [{ take: "thermos" }, { set: "hob_trust", val: true }, { set: "tower_open", val: true }, { set: "hob_thermos", val: true }, { xp: 3 }, { thought: "th_hob_bell" }, { morale: 2 },
        { note: "task_hob", text: "Bronka's thermos reached Hob, with a note I did not read. He drank it slowly, like a man re-learning to taste. I think he will be on our side." }],
      interjections: [
        I("empathy", 3, `He knows who it's from. He's never met her. He has tied her husband's name onto the wall with his own hands, a year ago, in black. She tied her note to a thermos. Somewhere in the Union that is the only way to say: I know about him, and I know you do.`),
        I("senses", 4, `The note says, in a thick, round hand: "For the one who ties the knots. Eat something. B."`),
        I("appetite", 3, `Whatever is in that flask is not fair. I want to be buried in it.`)
      ],
      choices: [C(`Let him finish.`, "gift_cord")]
    })
  }
},

// =====================================================================
hob_d3: {
  title: "Hob the Bellringer",
  start: [{ cond: "!flag.hob_met", node: "d3_meet" }, { cond: "flag.hob_ready", node: "ready_again" }, { node: "hub" }],
  nodes: {
    d3_meet: N("narrator", `He is waiting. That is the first thing: not at the ropes, not by the stove, but standing in the middle of the floor facing the trapdoor, as if he has heard every step of your climb through the soles of his boots. He is old, wide, grey-capped, ears stuffed with honey-coloured wax. When your head comes through the trap, he lifts one hand, flat, palm out, as a man steadies a horse.\n\nThen he points at the sun, at the clock on the Relay, at you. Eight fingers. A fist on a beam. You do not need a word of his language to understand the day.`, {
      onEnter: [{ set: "hob_met", val: true }, { set: "hob_named", val: true }, { xp: 1 }],
      interjections: [
        I("empathy", 3, `Hob. Three notes: low, low, mid. He didn't tell you; the tower did. Somebody told it a long time ago and it has kept the name safe.`),
        I("instinct", 3, `He knows what you are. He's seen the others who came up here: the men with the ladder. You're not them. He knows that, too, from the way you climb: you stop at the top to breathe.`),
        I("rote", 4, `ONE STROKE AT EIGHT TO OPEN THE JUBILEE. IT IS WRITTEN SOMEWHERE. IT IS WRITTEN IN THE MINISTRY'S BEST HAND.`)
      ],
      choices: [C(`Sit with him.`, "hub")]
    }),

    hub: N("narrator", `The stove ticks. The wind off the avenue rattles the wall of cords, and a thousand and some knots turn over against each other like small, patient hands. Hob sits on the iron stool and watches you with the full measure of a man who has all day, and has just found out that it is the last.`, {
      interjections: [
        I("volition", 4, `Remember who you are asking. Fifty years. A man who rings the Bell on command. He has the most to lose and the least reason to speak.`),
        I("empathy", 4, `He's afraid. Not of tonight. Of what the bell becomes if it is rung wrong.`, { cond: "!flag.hob_ready" }),
        I("the_grey", 4, `Far below, in the drains, the first gutter-water of the afternoon is running. A cold storm is coming in over the river. It will be here by nightfall.`)
      ],
      choices: [
        C(`[Thermos] Give him the thermos the Cook refilled.`, "thermos", { cond: "has('thermos') && flag.bronka_thermos_filled && !flag.hob_trust" }),
        C(`Give him a gift.`, "gift3", { cond: "!flag.hob_trust && ((has('thermos') && !flag.bronka_thermos_filled) || has('ration_tea') || has('sweet_roll') || has('cigarettes'))" }),
        C(`Share a cup with him. Say nothing.`, "cup", { cond: "!flag.hob_trust && !flag.hob_cup" }),
        C(`Show him the beat: seven, eleven.`, "beat", { cond: "!flag.hob_rhythm" }),
        C(`Ask him about the ropes, the wall, the names.`, "wall", { cond: "!flag.hob_wall3" }),
        C(`Ask: what will he do at eight?`, "ask", { cond: "flag.hob_trust && !flag.hob_ready" }),
        C(`Show him the knot he tied for you.`, "knot", { cond: "flag.w_ropes_yours && !flag.hob_knot" }),
        C(`Tell him about the Cook, and the black cord near the bottom.`, "tobar", { cond: "(flag.bronka_tobar || flag.w_ropes_tobar) && !flag.hob_tobar" }),
        X(`Go back down.`)
      ]
    }),

    cup: N("narrator", `You sit on the upturned bucket and let him pour. He does not hand you a cup so much as place the full cup in your hands with an air of magnanimous compulsion. The two of you drink, not looking at one another, like two men on a bench in a park in a country with no benches.\n\nIn a little while the wind drops. In a little while after that you realise that you are not afraid. It is the first time in three days.`, {
      onEnter: [{ set: "hob_cup", val: true }, { hp: 1 }, { morale: 1 }, { xp: 1 }],
      interjections: [
        I("charm", 3, `Silence, well used. Make a note: you did not need a single word.`),
        I("volition", 3, `You are allowed this. A cup. An hour with nobody asking. It will make the next thirteen easier.`)
      ],
      choices: [C(`Look at him.`, "hub")]
    }),

    gift3: N("narrator", `You offer what you have. He weighs it in his hand for the length of a long thought and looks at you, and at the bell, and back. The wind combs the cords. You wait.`, {
      choices: [
        C(`[Give the ration tea.]`, "gift3_done", { cond: "has('ration_tea')", effects: [{ take: "ration_tea" }] }),
        C(`[Give the sweet roll.]`, "gift3_done", { cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }] }),
        C(`[Give a few cigarettes.]`, "gift3_done", { cond: "has('cigarettes')", effects: [{ take: "cigarettes" }] }),
        C(`[Give the thermos.]`, "gift3_done", { cond: "has('thermos') && !flag.bronka_thermos_filled", effects: [{ take: "thermos" }] }),
        C(`Think again.`, "hub")
      ]
    }),

    gift3_done: N("narrator", `He puts it on the shelf with the cups and nods, short and complete. The room warms a degree. He takes your wrist, ties a cord of waxed hemp round it, three turns and a pull, and points at the trapdoor. Come up. You may come up again.`, {
      onEnter: [{ set: "hob_trust", val: true }, { set: "tower_open", val: true }, { set: "hob_cord", val: true }, { xp: 2 }, { thought: "th_hob_bell" }, { toast: "Hob tied a cord on your wrist." },
        { note: "task_hob", text: "Hob has accepted a small gift and tied a cord on my wrist. That is as close to an oath as he gets." }],
      choices: [C(`Continue.`, "hub")]
    }),

    thermos: N("narrator", `You unwrap the dented green thermos, the one with the rail-service stencil and the Cook's refill. A scrap of greaseproof is taped to the cap. He reads it without moving, and then reads it again, and then with a big careful hand he pours a cap of the steaming stuff and drinks it, eyes shut, as if drinking a person.\n\nRye. Onion. Caramel. A kitchen in winter. When he opens his eyes he is looking at the wall of cords, the black ones down by the floor, and then back at you. A single movement of the head: it is the nod of a man who has found out that someone else was keeping count.`, {
      onEnter: [{ take: "thermos" }, { set: "hob_trust", val: true }, { set: "tower_open", val: true }, { set: "hob_thermos", val: true }, { xp: 3 }, { thought: "th_hob_bell" }, { morale: 2 },
        { note: "task_hob", text: "Bronka's thermos broke the ice with Hob. He drank it slowly. He has the Cook's note in his breast pocket now, over the heart." }],
      interjections: [
        I("empathy", 4, `A bellringer and a cook who have never met. Each has been keeping a different half of the same wall.`),
        I("solidarity", 4, `Look at that. We are a very bad conspiracy; we communicate in thermoses. But we are not quiet at all.`)
      ],
      choices: [C(`Let him finish the cup.`, "hub")]
    }),

    beat: N("narrator", `You take the mallet and tap the beam: seven, breath, eleven, breath. He is already in motion before you finish: finger on wood, the mirror of it, eleven then seven. The two beats clash and knit. Your hand falls into the lull in his and his into yours until neither of you is sure whose beat is whose.\n\nThen he lets his hand drop and you go on alone, and his lips move: a word, a sound he has not made in decades, a ghost of a syllable. You cannot hear it. You see it. It could be a name, or only a breath.`, {
      onEnter: [{ set: "hob_rhythm", val: true }, { xp: 3 }, { morale: 1 }, { thought: "th_wake_tone" }],
      interjections: [
        I("senses", 4, `Seven eleven, eleven seven. He's the answer. He's been the answer all along, a hundred feet above the school, in the one place the Ministry forgot.`),
        I("rote", 3, `SEVEN. ELEVEN. COUNT IT. COUNT IT BACKWARDS. WE KNEW THE ANTHEM HAD A SECOND VERSE. WE NEVER KNEW IT HAD A SECOND HEART.`),
        I("composure", 4, `Eyes forward. Don't miss. Don't lose him. This is the best thing you will do all day.`)
      ],
      choices: [
        K(`[Aim] Keep the beat true while he strikes the bell-lip in counterpoint.`, "aim", 11, "hob_d3_counter", "beat_pass", "beat_fail", { w: 1 }),
        C(`Stop there. Let it settle.`, "hub")
      ]
    }),

    beat_pass: N("narrator", `You keep your hand steady and he lifts the mallet and, on the quiet between your eleven and your seven, touches the lip of the Great Bell: a small round bronze note, perfectly placed. Then another. The two of you build a rhythm out of a tap and a note and a breath, and the tower fills with a lilt, a heartbeat, something with no right to be in a Ministry building. Pigeons settle on the beams and listen.\n\nIt is the Wake tone, done by hand. It is not the Wake tone yet: it needs a carrier, a mic, a hall. But in a tower above a school, on the day of the Jubilee, two people have made the thing that would break the Bell.`, {
      onEnter: [{ set: "hob_counterpoint", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        I("aim", 3, `Dead on. Every stroke where it ought to be. I could cry, if I were a dial.`),
        I("solidarity", 4, `We have it. We have it in our wrists. Remember this when the tape is gone.`)
      ],
      choices: [C(`Lower the hand. Breathe.`, "hub")]
    }),

    beat_fail: N("narrator", `You drift, a hair, on the eleven. His mallet stops, stays in the air. The bell hums into silence. He does not scold. He walks round, lays his hand over yours on the beam, and turns it: slower. Slower than you think you need to go. It will come.`, {
      onEnter: [{ xp: 1 }],
      choices: [C(`Breathe.`, "hub")]
    }),

    wall: N("narrator", `You point at the wall of cords, and the black ones, and he follows. He walks the whole length of it slowly, running his fingers across the ranks, and stops at a place near the bottom. He takes a pair of cords between thumb and forefinger and holds them up: two black cords, two names, tied together at the neck.\n\nHe taps the first against his own chest, then the second against yours. His eyes ask a question. You cannot tell which.`, {
      onEnter: [{ set: "hob_wall3", val: true }, { xp: 1 }],
      interjections: [
        I("archive", 4, `Two names knotted together: not a mistake. A pair. A husband and a wife, or two brothers, or a teacher and a student who were forgotten on the same morning.`),
        I("empathy", 4, `He's asking whether you will be a third. He's asking it without malice. He just wants you to know there's room.`),
        I("grit", 4, `Look at it. Look at it for a moment. Then be angry, properly, slowly, and keep the anger for later.`)
      ],
      choices: [C(`Take his hand. Say nothing.`, "hub", { effects: [{ morale: -1 }, { ideo: "undercurrent", n: 1 }] })]
    }),

    knot: N("narrator", `You point up at the cord near the top: faded navy, wool, THE ONE WHO RAN PAST. Then at yourself.\n\nHis face does something you do not expect: it opens like a window. He goes to the ladder and climbs, and comes down with the cord in his hand. He sits you on the bucket and takes your wrist and, with three small precise movements, ties a fifth knot into the cord: not set apart, not a hope, but joined to the others. A knot for someone who came back.\n\nHe hangs it again at the top of the wall, among the white ones. It looks, you think, like a thing that belongs.`, {
      onEnter: [{ set: "hob_knot", val: true }, { xp: 3 }, { morale: 3 }, { thought: "th_chosen_family" }],
      interjections: [
        I("empathy", 5, `He's proud of you. He doesn't know what you did, and he's proud of you.`),
        I("volition", 4, `Let him. You don't have to earn it. You can simply be a knot in a wall, for a moment, held.`),
        I("charm", 4, `Don't thank him. He'd hate it. Just stand a little straighter.`)
      ],
      choices: [C(`Continue.`, "hub")]
    }),

    tobar: N("narrator", `You say a name, slowly, so that your mouth does it for him: Tobar. Then: Bronka. You make the shape of a cook's hands kneading, an apron, the round generous curve of a woman who has fed a whole school. You point to the lowest of the black cords.\n\nHe goes very still. Then he takes the cord in both hands, lifts it, and holds it out toward the window, toward the Ration Hall roof, toward a kitchen he has never seen. He puts the cord to his lips. It is a funeral and a vow, and you were not meant to watch, but you are glad you did.`, {
      onEnter: [{ set: "hob_tobar", val: true }, { xp: 2 }, { morale: 1 }, { thought: "th_good_son" }],
      interjections: [
        I("empathy", 5, `He wants to meet her. He is terrified of it. Tonight he will be the man who rings the Bell for all of them, and he would like, first, to have shaken her hand.`),
        I("solidarity", 4, `We are not just a wall. We are a kitchen with a tower on top.`)
      ],
      choices: [C(`Promise, with your hand on your heart, that you will bring her.`, "hub", { effects: [{ set: "hob_promised_bronka", val: true }, { ideo: "undercurrent", n: 1 }] })]
    }),

    ask: N("narrator", `You turn to the east railing and the twelve horns, the grey box, the long wire to the Relay. You hold up eight fingers. You make a fist and bring it down: the stroke. Then you shake your head, gently.\n\nHe understands before you finish. He puts a hand out, flat, to stop you, and looks away across the district: a long look, the look of a man doing a sum. The wind plays with the cords. The bell hums without being struck.\n\nThen he turns back. He has an answer, and he is going to give it to you in the only language he trusts.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("rhetoric", 4, `Do not ask him to do something grand. Ask him for the one thing: that when the hour comes, the bell rings when you say, and how you say.`),
        I("authority", 4, `Do not command him. He would take command as an insult and the bell as an affront.`),
        I("empathy", 5, `He has been asked for thirty years. The Ministry asked, in forms. The children asked, in handfuls. For thirty years no one has asked in a voice. Nobody has ever asked him whether he wanted to.`)
      ],
      choices: [
        K(`Ask him to ring what you teach him, when you give the sign.`, "rhetoric", 10, "hob_d3_ask_rhetoric", "ask_yes", "ask_no", { w: 1 }),
        K(`Say it with your hands, your face, the knot on your wrist: we are in this together.`, "solidarity", 9, "hob_d3_ask_solid", "ask_yes", "ask_no", { w: 1, cond: "flag.hob_cord || flag.hob_knot" }),
        K(`Tell him he does not have to. Mean it. Then ask.`, "empathy", 9, "hob_d3_ask_empathy", "ask_yes", "ask_no", { w: 1 }),
        C(`Not yet.`, "hub")
      ]
    }),

    ask_yes: N("narrator", `He takes the mallet and goes to the Great Bell. He lays his palm on the bronze until the hum runs up into his arm and then, deliberately, unbuckles the strap on the clapper, folds it twice, and hangs it on the nail where it came from. The leather leaves a pale stripe on the iron. The clapper hangs free for the first time since spring.\n\nHe turns and holds up his left hand with three fingers raised. Then he lifts his palm over his head, high, and flings it down: a signal. When you raise your hand, he rings. Whatever you ask. Whenever you give the sign.\n\nFrom somewhere in the tower's old iron a single pigeon takes off, and the whole roof seems briefly to lift.`, {
      onEnter: [{ set: "hob_ready", val: true }, { set: "hob_signal", val: true }, { xp: 4 }, { morale: 3 }, { task: "task_hob", state: "done" }, { thought: "th_hob_bell" },
        { note: "task_hob", text: "At the hour, when I raise my hand from the east railing, Hob will ring the Great Bell. Any rhythm I have taught him. He has taken the strap off the clapper." }],
      interjections: [
        I("authority", 4, `A command post. A signal. A man who will take it. You now possess a bell.`),
        I("solidarity", 4, `We have a bell. We have our own bell. That's not a metaphor; it is a very large piece of bronze, and he's going to hit it.`),
        I("appetite", 2, `The tea's still warm. We should celebrate. Let me know when.`)
      ],
      choices: [C(`Thank him with your hands.`, "ready_again")]
    }),

    ask_no: N("narrator", `He listens to the whole of it. He looks at you, at the bell, at the horns. He shakes his head, once, not unkindly: not yet. He gestures at the east: the Relay. Then at his own ears. He is not afraid of the Ministry. He is afraid of what it would mean to be wrong; a man whose whole life is a bell does not strike it in a mood.\n\nHe pats your shoulder. He is not refusing. He is asking for another way to be sure.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("empathy", 4, `He needs a reason, not an argument. Come back with something he can feel in his hands.`)
      ],
      choices: [C(`Go back to him.`, "hub")]
    }),

    ready_again: N("narrator", `Hob has returned to the ropes. He is polishing the bell's lip with a cloth, slowly, the way a man polishes a medal he will not be wearing. Every so often he stops and looks east. Every so often he taps the beam: seven, eleven.\n\nWhen he sees you he lifts the cloth in a half-salute, and goes back to his work.`, {
      interjections: [
        I("volition", 4, `You have a bell. Don't spend it on anything less than what it was cast for.`),
        I("empathy", 4, `Nobody is going to thank him. That is, in his opinion, the entire art.`)
      ],
      choices: [
        C(`Rehearse the signal with him once.`, "rehearse"),
        C(`Sit a moment by the stove.`, "hub"),
        X(`Go back down.`)
      ]
    }),

    rehearse: N("narrator", `You walk to the east railing and raise your arm. At the far end of the floor he straightens, mallet up. You let your hand fall. He does not ring: he mimes the stroke, swinging in the air an inch from the bronze, a dancer's rehearsal, and then lowers the mallet with great gravity. The tower holds its breath.\n\nHe holds up one finger, then two: you should signal twice. Once to ready him; once to strike. His face is gentle, businesslike. He is, you realise, the best collaborator you have had in three days.`, {
      onEnter: [{ set: "hob_rehearsed", val: true }, { xp: 1 }],
      interjections: [
        I("reflex", 3, `Two signals. Remember. One to ready, one to ring. Mixing them will cost a bell.`),
        I("authority", 4, `A good command is simple. His is simplest.`)
      ],
      choices: [C(`Back to the stove.`, "ready_again")]
    })
  }
},

// =====================================================================
vasha_d3: {
  title: "Lieutenant Kell",
  start: [
    { cond: "flag.vasha_ready", node: "ready_again" },
    { cond: "flag.vasha_betrays", node: "tense" },
    { cond: "flag.vasha_report_burned", node: "after_burn" },
    { cond: "flag.vasha_confession", node: "after_confess" },
    { node: "cold_open" }
  ],
  nodes: {
    cold_open: N("vasha", `She has not slept and she has not smoked, and the second is worse. She is sitting at the end of a bench in the Ration Hall with the notebook flat on her knee and both hands on top of it, like a woman holding down a lid.\n\n'Thursday,' she says, without looking up. 'The Jubilee. Do you know what the Jubilee is, kid? It's the day the Union congratulates itself for what it won't remember doing.' She finally looks at you, and the army has gone out of her face. 'He wants my last report at six. At the black car. In person.'`, {
      interjections: [
        I("empathy", 3, `She hasn't decided. She's been sitting here since the Bell, not deciding, which is a decision too, the kind that gets made for you.`),
        I("instinct", 4, `The notebook. She's pressing on it so hard her knuckles are white. She's afraid it will open by itself.`),
        I("doublethink", 3, `A very easy day, in a way. All you have to do is nothing, and let a lovely man in a lovely coat take care of the rest. (Ssh. We are not listening to that.)`)
      ],
      choices: [C(`Sit beside her.`, "hub")]
    }),

    after_burn: N("vasha", `She is smoking. She is smoking the way people drink water after a long march, unashamed, in short wet pulls. On the bench beside her lies a new notebook, army-issue, plain: the old one is a black curl in the Ration Hall stove, and the whole canteen smells faintly of scorched paper.\n\n'Sit,' she says. 'Don't hover. I'm told hovering is on my list of things to stop doing.' She flicks ash. 'Eleven pages of me being accurate about you. I thought I would feel as if I'd taken off a boot. I feel as if I've taken off a leg. But a lighter one.'`, {
      interjections: [
        I("empathy", 3, `Relief and grief in one breath, and neither one is for you. She is mourning the version of herself that kept those pages.`),
        I("volition", 4, `She did a brave thing and it has left a hole. Do not fill it with praise. Fill it with something to do.`),
        I("archive", 4, `Technically, destruction of a Dossier of a Minor is an offence under Regulation 31(c). I would like it noted that I am delighted, and I will deny it in writing.`)
      ],
      choices: [C(`Sit beside her.`, "hub")]
    }),

    after_confess: N("vasha", `'Don't look at me like that,' she says. 'I'm still standing. I did not expect it. I told a student the worst thing about myself and the ceiling did not come down, and the Bell did not ring, and nobody took me out to the yard.' A short, unnatural laugh. 'I'm told that's what it's like when you stop lying. A bit of a draught.'\n\nThe notebook is still in her pocket; you can see the corner. She has not burned it, or sent it. She has not decided, and she knows you know, and she is letting you.`, {
      interjections: [
        I("empathy", 3, `She's a person who has just put a heavy thing down and is not sure she's allowed to pick up anything else.`),
        I("solidarity", 4, `We are so proud. We are very quiet about it. We would like to bring her tea.`),
        I("rhetoric", 4, `There is a speech available here. Don't make it. It will cost you the draught.`)
      ],
      choices: [C(`Sit beside her.`, "hub")]
    }),

    tense: N("vasha", `'Student.' It is her parade voice, flat, polished, with the knee in it. She is standing at attention beside the serving counter with her hands behind her back, and she does not offer you a place to sit. 'I am to remind you that the Jubilee begins at nineteen-thirty, attendance is mandatory, and the Inspector would like it if you were somewhere he could find you.'\n\nShe has not said 'kid'. She has not said anything with a crack in it. But she has put herself where the corridor camera can see her, and she is looking, steadily, at a spot a hand's-breadth over your shoulder.`, {
      onEnter: [{ surv: 3 }],
      interjections: [
        I("empathy", 3, `That is a person doing an impression of a person she used to be. She is very good, and she is crying behind it.`),
        I("authority", 4, `HER VOICE IS REGULATION. HER KNEE IS NOT. WATCH THE KNEE. IT IS SHAKING.`),
        I("instinct", 4, `She isn't looking at you because the last time she did she changed her mind, and she can't afford that.`)
      ],
      choices: [
        K(`[Empathy] Say it plainly: 'Vasha. It's me.'`, "empathy", 12, "vasha_d3_flip_empathy", "flip_pass", "flip_fail", { w: 1 }),
        K(`[Authority] Meet the parade voice with one of your own.`, "authority", 12, "vasha_d3_flip_authority", "flip_pass", "flip_fail", { w: 1 }),
        C(`'Understood, Lieutenant.' Leave.`, "tense_leave")
      ]
    }),

    tense_leave: N("narrator", `You say it, and she says 'Good,' and neither of you moves. You turn. Behind you there is the small wet sound of someone setting her teeth.`, {
      onEnter: [{ ideo: "quiet", n: 1 }],
      choices: [X(`Go.`)]
    }),

    flip_pass: N("vasha", `Something in her face gives way, slowly, like a seam in old wool. 'I hate that you do that,' she says, still in the parade voice, and then in her own: 'I hate that it works.' Her hands come out from behind her back; they are not steady. 'I told him yes. Yesterday. In the car, with the heater going and a very nice cup of tea. I said I'd give him whatever he asked for at six. And then I went to bed, and I didn't sleep, and every time I shut my eyes I saw the Bell.'\n\nShe breathes. 'I haven't told him anything he can use. Yet.'`, {
      onEnter: [{ set: "vasha_betrays", val: false }, { set: "vasha_wavers", val: true }, { xp: 3 }, { morale: 1 }],
      interjections: [
        I("empathy", 4, `A yes in a warm car. Of course. That's how it's done now. Nobody is dragged. They are offered a seat.`)
      ],
      choices: [C(`Sit beside her.`, "hub")]
    }),

    flip_fail: N("vasha", `'Dismissed,' she says, very quietly. It is not a rebuke. It is a plea. Her eyes close for a second, open again, and are the colour of a locked door.\n\nYou cannot reach her today. Perhaps you will tonight, if either of you is still the person who knows how.`, {
      onEnter: [{ surv: 4 }, { morale: -1 }],
      choices: [X(`Go.`)]
    }),

    hub: N("vasha", `'Ask,' says Lieutenant Kell. 'Or don't. It's a very long day and I have the whole of it to be sorry in.' She is looking at the stage, at the forty chairs somebody has set out in a fan, at the single microphone. 'I always liked the Jubilee. It had a march.'`, {
      interjections: [
        I("volition", 4, `Whatever you need from her, she has to give it. You cannot take it. Remember that you are not a Lieutenant.`),
        I("senses", 3, `A faint smell of cordite, though it has been fifteen years. Of tobacco, though she has stopped. Of paper, burnt or not burnt.`)
      ],
      choices: [
        C(`'Tell me about Reedmarsh.'`, "reed", { cond: "!flag.vasha_reed3" }),
        C(`[Show her the Ledger.] 'Reedmarsh is in here.'`, "ledger_page", { cond: "(has('ledger') || flag.found_ledger || flag.ledger_with_anka) && flag.vasha_reed3 && !flag.vasha_ledger_page" }),
        C(`'What are you going to tell him at six?'`, "voss", { cond: "!flag.vasha_voss3" }),
        C(`'Write the report with me. Make me dull.'`, "false_report", { cond: "flag.vasha_voss3 && !flag.vasha_false_report && !flag.vasha_betrays" }),
        C(`'What are the names in the back of the notebook?'`, "names", { cond: "!flag.vasha_names" }),
        C(`'Tonight. When it comes. Will you stand with me?'`, "choice", { cond: "!flag.vasha_ready && !flag.vasha_asked3" }),
        C(`'Let me ask again.'`, "choice", { cond: "!flag.vasha_ready && flag.vasha_asked3 && !flag.vasha_betrays" }),
        X(`'Nothing more, Lieutenant.'`)
      ]
    }),

    reed: N("vasha", `'You want the pass.' She is looking at her knee. 'Nine days. Spring, eight years ago. Half a battalion on a ridge with the Eastern Command's word that there'd be relief by the fourth morning. There was a lot of weather. There was a lot of... I remember the first three days like a photograph. I remember the ninth, and the tenth; I remember the ridge with the sun on it and nobody on it.'\n\nShe stops. 'Four, five, six, seven, eight. I've got a very neat hole there. Edges like a pair of scissors. And a medal, for the part I don't have.'`, {
      onEnter: [{ set: "vasha_reed3", val: true }, { xp: 2 }],
      interjections: [
        I("rote", 3, `REEDMARSH PASS. 9 TO 14 MARCH. 'A GLORIOUS RESISTANCE.' (Nine days. The record says six days. I do not know which of us is lying.)`),
        I("deduction", 5, `A hole that neat is a cut. She did not lose those five days. Somebody removed them. And the only people who could are the people who have a broadcast tower.`, { effects: [{ thought: "th_borrowed_memory" }], once: true }),
        I("empathy", 4, `Eighty-odd boys she cannot place in a ridge. She is not mourning them. She is mourning the fact that she cannot be sure she mourned them at the time.`)
      ],
      choices: [C(`Stay with her.`, "hub")]
    }),

    ledger_page: N("narrator", `You open the Ledger on the bench between you and turn to the leaf you remember: Ostrov's small tidy hand, columns, dates. HARMONY, FIELD TRIAL: EASTERN COMMAND, REEDMARSH PASS. 9 to 14 MARCH. TRANSMISSION BY MOBILE RELAY, 21:00 NIGHTLY. EFFECT ON TROOPS: FORGETFULNESS OF CASUALTIES. EFFECT ON COMMANDING OFFICER (LT. V. KELL): MOST MARKED. RECOMMENDED FOR DISTRICT ROLLOUT.\n\nShe reads it once with her mouth shut. Then she reads it again. The cigarette goes out in her fingers.`, {
      onEnter: [{ set: "vasha_ledger_page", val: true }, { xp: 3 }, { morale: -1 }],
      interjections: [
        I("archive", 4, `"Most marked." It means she was the best subject. The Ministry gave her a medal for the part of the trial that worked.`),
        I("empathy", 5, `Look away. Not because it is ugly. Because she will want a minute in which nobody sees what her face is doing.`),
        I("grit", 4, `You do not look away. Somebody ought to see it. Make it a kindness: stay.`)
      ],
      choices: [C(`Wait.`, "ledger_after")]
    }),

    ledger_after: N("vasha", `It takes a long time. The Hall clock has the courtesy to be silent. When she speaks it is in the level voice she must once have used to read out lists.\n\n'They didn't die in the pass. They were left in it. The relief came on the fourth morning, and then somebody turned a tap and we were all so very comfortable in our heads that we forgot to ask where the relief had gone.' She folds her hands. 'Ninety-one boys. I had their names. I had them by heart. I woke up on the tenth with a hole where they had been, and a medal, and a very clean knee.'\n\nShe looks at you. 'I'd like to hand somebody something, tonight, before I forget again.'`, {
      onEnter: [{ set: "vasha_knows_reed", val: true }, { xp: 2 }, { thought: "th_last_assembly" }],
      interjections: [
        I("solidarity", 4, `Ninety-one. We would like to be ninety-two. We would like to be a hundred and ninety-two. We would like to stand where they stood and say we were there.`),
        I("authority", 4, `That is not a woman asking permission. That is an officer asking for orders.`)
      ],
      choices: [C(`'Then hand it to me.'`, "hub")]
    }),

    voss: N("vasha", `'I know what the notebook says.' She puts a thumb on the cover. 'It says you're a serious, sleepless child with a talent for being where things are. It says you've gone through the Library and the Boiler and the street. It says you trust a cook and a girl with a radio. It says,' she adds, almost smiling, 'that you smoke. You don't. I put that in as an act of mercy. I couldn't leave you with a spotless page.'\n\n'He wants the last entry. Tonight's plans. Who you'd stand with, and where.'`, {
      onEnter: [{ set: "vasha_voss3", val: true }, { xp: 1 }],
      interjections: [
        I("doublethink", 3, `A last entry! How very official. And it would be so natural to answer. You are, after all, a person who has nothing to hide, aren't you?`),
        I("composure", 4, `Do not look at the notebook. She is watching your eyes go to it, and she'll count what they say.`),
        I("rhetoric", 4, `You could simply tell her what to write. People tend to prefer a script. She might be one of them.`)
      ],
      choices: [
        C(`'Then write him something dull.'`, "false_report", { cond: "!flag.vasha_betrays" }),
        C(`'Tell him the truth if you must.'`, "truth_report"),
        C(`Say nothing.`, "hub")
      ]
    }),

    false_report: N("vasha", `She laughs at last: one cracked, startled bark that surprises both of you. 'A dull report. God. A dull report for the Inspector, about the most interesting child in the district.' She opens the notebook at a clean page and clicks a pencil. 'Dictate.'\n\nYou work on it together for half an hour. Subject rose at seven. Subject took a breakfast of black bread and no remarks. Subject visited the Library, where he read the Index of Regulations from A to F. Subject is, if anything, dull, and has expressed a wish to be present at the Jubilee in the second row, as near to a pillar as is possible. Vasha writes 'pillar' with enormous feeling.\n\n'He'll never believe it,' she says. 'But he'll believe that I believe it. That's a different, smaller lie, and it's one I can keep.'`, {
      onEnter: [{ set: "vasha_false_report", val: true }, { xp: 3 }, { surv: -6 }, { morale: 1 }, { thought: "th_double_agent" }],
      interjections: [
        I("sleight", 4, `A forged diary is a work of art. Four phrases for 'bland': 'unremarkable', 'conforming', 'quiet', 'plausibly asleep'. Use them all.`),
        I("archive", 3, `The correct form is 7-D, 'Interim Statement of Behaviour of a Minor', and the pillar must be identified by number. I recommend Pillar 4.`),
        I("charm", 4, `A laugh in the Ration Hall at nine in the morning. Remember that this was possible, today.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    truth_report: N("vasha", `'The truth.' She turns the word over, the way she turned 'chalk' on Tuesday. 'It's a very big thing to ask an informer for. It has a lot of pages.' She looks at the page. 'If I write it I'll write it all, exactly. I'm very accurate. It's a flaw in a soldier and a vice in a spy.'\n\nShe does not write. She does not close the book. She hangs there, a person on a ledge, and seems very much to want somebody to tell her which way to fall.`, {
      onEnter: [{ surv: 2 }],
      choices: [C(`'I'm not going to tell you.'`, "hub"), C(`'Fall my way.'`, "choice")]
    }),

    names: N("vasha", `She hesitates, then opens the notebook at the back and turns it to face you. The last twenty pages are lines of small block capitals, one name to a line, with a rank or a village. DREZ, TOMASZ, PRIVATE (SALT FLATS). MAREK OLLIN, CORPORAL (A BAKER'S SON). ANIKA VESS, SIGNALS. They run on and on.\n\n'Ninety-one,' she says. 'One a night. Every night since the spring, before the Bell, I write one. And in the morning I read them. They don't come back. But I get to meet them again. It's the only way I know to keep the dead from being tidied away.'`, {
      onEnter: [{ set: "vasha_names", val: true }, { xp: 2 }, { thought: "th_burned_paper" }],
      interjections: [
        I("empathy", 5, `A roll of the dead, kept up nightly, in capitals, so as to be legible to someone who has lost her glasses and her mind. You have never seen anything so brave.`),
        I("rote", 3, `PRIVATE DREZ. CORPORAL OLLIN. SIGNALS-WOMAN VESS. (I will remember these. I will remember these until I am told not to.)`),
        I("solidarity", 4, `Say them. Out loud, once, so there is a crowd.`, { effects: [{ morale: 1 }] })
      ],
      choices: [
        C(`Read three of the names aloud.`, "names_read"),
        C(`Close the book gently.`, "hub")
      ]
    }),

    names_read: N("vasha", `You read three. Your voice does not know how. 'Drez, Tomasz, private.' 'Marek Ollin, corporal.' 'Anika Vess.' You stop.\n\nThe Ration Hall holds its breath. The Cook at the far counter has stopped stirring. The canteen clock ticks once, loudly, in a world which had briefly stopped being timed. Vasha has her hand over her mouth and is not making any noise at all.\n\n'Nobody's said them out loud in eight years,' she says, through her fingers. 'I didn't know they could be.'`, {
      onEnter: [{ xp: 3 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [C(`Close the book gently.`, "hub")]
    }),

    choice: N("vasha", `'Tonight,' she says. She breathes out a long, slow plume of nothing. 'At eight the Bell rings, and everybody I've ever met goes soft, and I go with them, and I wake up tomorrow with a medal and a drawer full of paper and no idea that I once sat on a bench and was asked.' She turns the notebook over in her hands. 'I'm forty-four. I've never once been asked.'\n\n'Say it plainly. What do you need?'`, {
      onEnter: [{ set: "vasha_asked3", val: true }],
      interjections: [
        I("rhetoric", 4, `She wants to be useful. Everything else is trimming. Give her something that fits the shape of the thing she misses: a post, an order, a place to stand.`),
        I("authority", 4, `She is an officer. She follows a plan better than a plea.`),
        I("empathy", 5, `She wants to know she would have been brave if she'd had the choice. Give her the choice.`)
      ],
      choices: [
        C(`'Stand with me. Whatever happens at eight, be in the room.'`, "ask_yes", { cond: "flag.vasha_report_burned || flag.vasha_confession || flag.vasha_ledger_page || flag.vasha_false_report" }),
        K(`[Empathy] Ask her as a friend. Say nothing but the truth.`, "empathy", 11, "vasha_d3_ask_empathy", "ask_yes", "ask_no", { w: 1, cond: "!(flag.vasha_report_burned || flag.vasha_confession || flag.vasha_ledger_page || flag.vasha_false_report)" }),
        K(`[Authority] Give her an order. She'll know what to do with it.`, "authority", 12, "vasha_d3_ask_authority", "ask_yes", "ask_no", { w: 1, cond: "!(flag.vasha_report_burned || flag.vasha_confession || flag.vasha_ledger_page || flag.vasha_false_report)" }),
        K(`[Rhetoric] Argue it: she is already one of us. She just hasn't written it down.`, "rhetoric", 12, "vasha_d3_ask_rhetoric", "ask_yes", "ask_no", { w: 1, cond: "!(flag.vasha_report_burned || flag.vasha_confession || flag.vasha_ledger_page || flag.vasha_false_report)" }),
        C(`'Not yet. I'll come back.'`, "hub")
      ]
    }),

    ask_yes: N("vasha", `She puts the notebook down on the bench with enormous care, as if it were something that might wake. Then she stands, and for a moment her knee does not hurt her; you can see it not hurting.\n\n'Right,' says Lieutenant Kell. It is the voice of an officer on the ridge on the third morning. 'I will be in the Ration Hall at twenty hundred. I will have my back to the door and my hand on a chair. Whoever comes through that door will come through me.' She takes an envelope from her tunic. Three pages, a thumb-smudge on the first. 'I wrote this last night. It isn't pretty. It's the whole of it. If I'm not there to say it, you read it. If the Bell rubs me out, you remind me.'`, {
      onEnter: [{ set: "vasha_ready", val: true }, { set: "vasha_ally", val: true }, { set: "vasha_betrays", val: false }, { give: "vasha_letter" }, { task: "task_vasha", state: "done" }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_vasha", text: "Vasha will be in the Ration Hall at twenty hundred, back to the door. She gave me her letter. If the Bell takes her, I am to read it to her in the morning." }],
      interjections: [
        I("solidarity", 3, `She came back. A soldier came back from a ridge. We have never loved anyone so loudly.`),
        I("authority", 5, `A post. A line of retreat. An officer who knows both. You couldn't ask for a better door.`),
        I("empathy", 4, `She cried at some point in the last minute and tucked it in with the cigarettes. You have the grace to pretend you didn't see.`)
      ],
      choices: [C(`'Thank you, Lieutenant.'`, "ready_again")]
    }),

    ask_no: N("vasha", `'I can't.' It comes out smaller than she wants. 'Not because I don't want to. Because I'm not yet sure I'm somebody who can. I need to see whether I am.' She looks at the notebook. 'Come back after the Inspector, if I'm still here. If I'm not, I'm sorry. It will be a long way to be sorry from.'\n\nShe turns away. It is not rejection. It is a person asking for another hour in which to be afraid.`, {
      onEnter: [{ morale: -1 }, { xp: 1 }],
      interjections: [
        I("volition", 4, `That wasn't a refusal. That was a request for another chance. You are allowed one.`)
      ],
      choices: [C(`Leave her be for now.`, "hub")]
    }),

    ready_again: N("vasha", `Lieutenant Kell is polishing a chair. It is a very ordinary Ration Hall chair, steel and plywood, and she is working at it with a rag and a quiet, steady violence, getting every ring of milk out of the seat.\n\n'Positioning,' she says, without looking up. 'The chair is for the door. You put a chair in front of a door and men go round it. You put a woman in the chair and they stop and ask permission.' She tests its weight. 'I've always liked an excuse for furniture.'`, {
      interjections: [
        I("empathy", 4, `She is happy. It's visible and slightly alarming, like seeing a cat swim.`),
        I("authority", 4, `She is already in position. You don't need to remind her. Remember it later, when the doors start to open.`)
      ],
      choices: [
        C(`'Anything you need from me?'`, "ready_ask"),
        X(`'See you at eight, Lieutenant.'`)
      ]
    }),

    ready_ask: N("vasha", `'A cigarette,' says Lieutenant Kell, 'and a rumour.' She holds out her hand. 'And if you have it: some word of what happens to a man like the Inspector when the lights come up. I'd like to know whether I should be hating him or helping him. It has, I think, been a bit of both.'\n\nShe takes the cigarette if you have one. She lights it with a hand that is, this time, perfectly steady.`, {
      onEnter: [{ xp: 1 }],
      choices: [
        C(`[Give her a cigarette.]`, "ready_again", { cond: "has('cigarettes')", effects: [{ take: "cigarettes" }, { morale: 1 }], once: true }),
        C(`'I'll find out.'`, "ready_again")
      ]
    })
  }
},

// =====================================================================
bronka_d3: {
  title: "Cook Bronka",
  start: [
    { cond: "flag.bronka_ready", node: "ready_again" },
    { cond: "flag.osk_scapegoat && !flag.bronka_forgave", node: "cold" },
    { node: "warm_open" }
  ],
  nodes: {
    cold: N("bronka", `'Number.' She does not turn round. The ladle goes round the pot, round, round. 'There's a queue. You take a number, you wait, and when I call it you tell me what you want and I think about whether you're getting it.'\n\nThere is no queue. There is the smell of rye, and the back of a broad apron, and a silence with a floury edge to it.\n\n'The old man used to come to the back door at four,' she says to the soup. 'I'd leave him the heel of the loaf. He never asked. He'd say the weather was a patriot. This morning I put the heel out at four and nobody took it.'`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("empathy", 3, `She isn't angry with you the way a person is angry at a stranger. She's angry at you the way you are angry at a stove you love.`),
        I("the_grey", 4, `The heel of the loaf has been on the back step since four. The pigeons will have it by noon, and she will watch them do it, and say nothing.`),
        I("volition", 4, `You did it. You know you did. Say so, or go. Do not stand in her kitchen and pretend to be a weather report.`)
      ],
      choices: [
        K(`[Volition] Own it. 'I put him there. I'm not going to say I had no choice.'`, "volition", 11, "bronka_d3_own", "cold_pass", "cold_fail", { w: 1 }),
        K(`[Rhetoric] Tell her what Rhea did, and what you can still do about it.`, "rhetoric", 12, "bronka_d3_argue", "cold_pass", "cold_fail", { w: 1 }),
        C(`Take a number, and go.`, "cold_leave")
      ]
    }),

    cold_leave: N("narrator", `You do not take a number. You stand there until it is plain nobody is going to hand you one, and then you go. Behind you the ladle stops for exactly one second and starts again.`, {
      choices: [X(`Go.`)]
    }),

    cold_pass: N("bronka", `The ladle stops. She turns, finally, and looks at you with a face like a loaf somebody has hit.\n\n'Well,' she says. 'At least you said it in my kitchen. Most of them say it to the walls.' She wipes her hands, for a long time, on a cloth that does not need it. 'I'll not forgive it. Not for him, not for me. That's not a thing you ask a woman to do on a Thursday. But I'll not turn you out. A man who says "I did it" is a man I can feed.'\n\nShe slaps a plate on the counter. 'Eat, crumb. Then tell me what we do.'`, {
      onEnter: [{ set: "bronka_forgave", val: true }, { set: "bronka_osk_vow", val: true }, { xp: 3 }, { morale: 1 }, { thought: "th_weight_of_osk" }],
      interjections: [
        I("empathy", 4, `Not forgiveness. Credit. She's extending you credit, at a rate she'll collect on later.`),
        I("appetite", 3, `A PLATE. A plate, after that. I am not worthy and I will take it.`)
      ],
      choices: [C(`Eat.`, "warm_open")]
    }),

    cold_fail: N("bronka", `'Words,' she says, with great dignity. 'You've got a lot of them. They are very nice words. They do not weigh what a man weighs.' She still has not turned round. 'Go and see the Inspector, crumb. Go and see whoever wants you. My kitchen is shut to a person who has a use for a scapegoat.'\n\nThe ladle goes round and round and round.`, {
      onEnter: [{ morale: -1 }, { surv: 2 }],
      choices: [X(`Go.`)]
    }),

    warm_open: N("bronka", `She is packing a lunch tin. It's a small round tin with a flag on the lid, the kind a boy takes to drill, and she is filling it in layers: black bread, cheese like a thumb, a pickle, one boiled egg wrapped in a cabbage leaf. She does it slowly, with the methodical tenderness of a person packing a parachute.\n\n'Crumb,' she says, without looking up. 'There's tea. There's soup, if you can bear it. There's a boy in the Vanguard who won't eat his egg.' She presses the lid down. 'It's a day for packing, I'm told. Everyone's going somewhere.'`, {
      interjections: [
        I("empathy", 3, `There is a boy. You can hear it in how she says "boy". Who is he?`),
        I("senses", 3, `Rye, caraway, boiled egg, and under it the sharp, particular scent of nerves. She has been cooking since four and not tasted anything.`),
        I("appetite", 3, `I would like the egg. I'm told it's not mine. I would like the egg.`)
      ],
      choices: [C(`'Who's the lunch for?'`, "hub")]
    }),

    hub: N("bronka", `'Out with it.' Bronka sets the tin by the till, squared to the edge. 'My hands are busy. My ears have never been otherwise.'`, {
      interjections: [
        I("solidarity", 4, `She is the hearth of the building. If the building is going to do anything tonight, it'll do it on her bread.`)
      ],
      choices: [
        C(`'The tin. Who's it for?'`, "jorik", { cond: "!flag.bronka_jorik" }),
        C(`'Is it Jorik? Is he in Rhea's squad?'`, "jorik_ask", { cond: "flag.bronka_jorik && !flag.bronka_son_resolved && (flag.knows_rhea || flag.rhea_exposed || flag.rhea_turned || flag.osk_saw_rhea)" }),
        C(`'The notes in the bread. Can they carry one more?'`, "bread_plan", { cond: "!flag.bronka_notes_set" }),
        C(`[Thermos] 'Could you fill this for somebody?'`, "thermos", { cond: "has('thermos') && !flag.bronka_thermos_filled" }),
        C(`'There's a black cord on the tower wall. It says Tobar.'`, "tobar_tower", { cond: "(flag.w_ropes_tobar || flag.hob_tobar) && !flag.bronka_tobar_tower" }),
        C(`'Tonight. When the Bell rings. Will you be with me?'`, "ready", { cond: "!flag.bronka_ready && (flag.bronka_notes_set || flag.bronka_son_resolved || flag.bronka_tobar_tower)" }),
        C(`'I need the boiler key / the coupons.'`, "supplies", { cond: "!flag.bronka_supplies && !has('boiler_key')" }),
        X(`'Nothing, Bronka. Eat something yourself.'`)
      ]
    }),

    supplies: N("bronka", `'A key,' she says, 'is the heaviest thing in this kitchen, and I've got a drawer full.' She fishes among the spoons and brings out the old iron boiler key on its loop of kitchen string, and a handful of ration coupons, stamped TUESDAY, which she rolls into your fist. 'Don't spend them on a Wednesday. They've got an eye for the date.'`, {
      onEnter: [{ set: "bronka_supplies", val: true }, { give: "boiler_key" }, { give: "ration_coupon" }, { xp: 1 }],
      choices: [C(`Thank her.`, "hub")]
    }),

    jorik: N("bronka", `'Jorik.' She says it like a prayer someone has put in a very small box. 'My boy. Sixteen last month. He was a lovely, lazy, chatty child, and then the Vanguard took him for the Hunger Winter drill, and he came home with a cap and a back like a coat-hanger, and a way of saying "Mother" that I didn't like.' She smooths the flag on the lid. 'Rhea's squad. She picked him. She said he had a good voice for a command.'\n\n'He told me once that she's the only person who ever gave him a job.'`, {
      onEnter: [{ set: "bronka_jorik", val: true }, { xp: 2 }],
      interjections: [
        I("empathy", 4, `A mother who is afraid of her son's uniform. Not the boy. The cloth.`),
        I("archive", 4, `Jorik Presch. Cadet, Youth Vanguard, Second Squad. Enrolled at fifteen under the Hunger Winter Scheme. Father: Tobar Presch (re-educated, discharged). A neat little genealogy of the Union's idea of a family.`),
        I("instinct", 4, `Second Squad. Rhea's squad. Three pairs of boots in the big doors at half past one. One of them could be hers.`, { effects: [{ set: "bronka_jorik_hunch", val: true }], once: true })
      ],
      choices: [
        C(`'What time did he come home on Tuesday night?'`, "jorik_home", { cond: "!flag.bronka_jorik_home" }),
        C(`'Rhea is not what she looks like.'`, "hub")
      ]
    }),

    jorik_home: N("bronka", `'He didn't.' The word is very quiet. 'Not Tuesday. Wednesday, at a quarter to four. He doesn't live here: he's in the dormitory, but he's got a key to my back door, from when he was small. I heard it turn. I heard him on the stairs. He stood in the scullery with his boots on, in the dark, and he didn't put the light on. He stood there for maybe ten minutes. And then he washed his hands. He washed them for a long time.'\n\nShe looks at the pot. 'He smelled of orange peel. I've never known a boy smell of orange in this Union.'`, {
      onEnter: [{ set: "bronka_jorik_home", val: true }, { xp: 2 }, { thought: "th_good_son" }],
      interjections: [
        I("deduction", 4, `Orange peel. The Lemmy testimony: Rhea peels one every morning in a single piece. The smell travels on the people who stand near her.`),
        I("empathy", 5, `He washed his hands for a long time in the dark. A boy in a kitchen at four in the morning with nothing to say. That is not a murderer. That is a witness who was never allowed to be one.`),
        I("grit", 4, `Do not look at her. She has said it to the pot so that it would not have to be said to a face.`)
      ],
      choices: [C(`Stay with her.`, "hub")]
    }),

    jorik_ask: N("bronka", `You say it as gently as you know how. She goes on stirring.\n\n'I know what you're asking,' she says. 'Don't. If you're asking whether a woman can look at her own son and decide she'd rather not know, then yes. She can. It is, in my experience, her most common skill.' The ladle stops. 'But I can't do it any more. There's a clean place where my husband used to be and I'll not have another one. So tell me, crumb. You know a thing. I'll have it, and you'll watch what it does.'`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("volition", 4, `There are two kinds of truth you can bring a mother: the kind that is true, and the kind that is useful. This is a rare case where they are the same size.`),
        I("empathy", 5, `She is not asking to be spared. She is asking to be treated as an adult. It's the hardest thing a person can ask of you.`)
      ],
      choices: [
        K(`[Empathy] Tell her the truth. Slowly. Say that he carried, and that he washed his hands.`, "empathy", 10, "bronka_d3_tell", "tell", "tell_fail", { w: 1 }),
        C(`Lie. 'No. He was nowhere near it.'`, "lie"),
        C(`'I don't know. Not yet.'`, "hub")
      ]
    }),

    tell: N("bronka", `She puts the ladle down on the counter, very gently, as if it were something that could break. She puts both her flour-white hands flat on the zinc and looks at them.\n\n'Right,' she says. 'Right. Then he'll hear it from me. Tonight, before the Bell, when he comes for the tin. I'll put an egg in front of him and I'll tell him what he did and what it cost, and I'll tell him there's a loaf for the ones who say it out loud.' She lifts her head. Her face is wet and ferocious. 'He'll be sick, probably. He'll cry. He's a good boy.' A beat. 'He's a good boy who did a thing. I can hold both. It's what a kitchen is for.'`, {
      onEnter: [{ set: "bronka_son_told", val: true }, { set: "bronka_son_resolved", val: true }, { xp: 4 }, { morale: 1 }, { thought: "th_good_son" }, { ideo: "undercurrent", n: 1 },
        { note: "task_rhea2", text: "Told Bronka that Jorik helped carry the Commissar. She'll tell him herself tonight and feed him afterwards. 'He's a good boy who did a thing.'" }],
      interjections: [
        I("solidarity", 4, `We hold both. It is what we're for. A kitchen is an enormous apology and an enormous demand, and sometimes it comes with an egg.`),
        I("empathy", 5, `That was the right call, and it was not kind, and the two are not opposites.`)
      ],
      choices: [C(`Stay a moment.`, "hub")]
    }),

    tell_fail: N("bronka", `It comes out wrong: too many clauses, a clumsy hand in an open wound. She hears the first half and her face shuts like a pantry.\n\n'You've got something there,' she says, 'and you can't hold it, and I'm not going to hold it for you.' She picks the ladle up. 'Come back when you've decided what you're afraid of.'`, {
      onEnter: [{ morale: -1 }],
      choices: [C(`Back to her.`, "hub")]
    }),

    lie: N("bronka", `'Nowhere near it.' She looks at you for a long time, with the light of the stove on her face. Something small and tired goes across it, and is put away.\n\n'You'll make a very good official,' she says, flatly. 'You've got the voice. You say a thing like it was never in doubt.' She turns back to the pot. 'Don't lie to a cook, crumb. We taste it. It's all we do.'\n\nBut she nods. She takes the lie like a coin and puts it in her apron and you both know it is counterfeit and that she'll spend it anyway, because the alternative is a very long Thursday.`, {
      onEnter: [{ set: "bronka_son_resolved", val: true }, { ideo: "quiet", n: 1 }, { morale: -1 }],
      interjections: [
        I("doublethink", 3, `Nobody was hurt. She seems much more comfortable. (We are a kind soul. We are the kindest soul.)`),
        I("volition", 4, `A mercy that you will have to carry. She'll find out. Everyone does.`)
      ],
      choices: [C(`Look away.`, "hub")]
    }),

    bread_plan: N("bronka", `'The bread.' She rubs her hands together, and a small cloud of flour goes up like a thought. 'Four hundred loaves for the Jubilee queue. Four hundred, every one of them stamped GRATEFUL CITIZEN on the crust with a die the size of a thumb. They'd be going out from my ovens at five. At five-thirty they're on every table in District 9.' She looks at you, with a gleam. 'There's room in a loaf for a note. There always was. What does it say?'\n\nYou have about eleven words. A cook has about eleven words of paper.`, {
      interjections: [
        I("rhetoric", 4, `Eleven words. Haiku of the revolution. Make every word hold up a wall.`),
        I("rote", 3, `THE NOTES ARE ROLLED IN GREASEPROOF, THE SIZE OF A THUMBNAIL. THEY HAVE NEVER BEEN FOUND. THIS IS A STATISTICAL MIRACLE.`),
        I("solidarity", 4, `Whatever you say, say it as "we". People will read "you" as an order and "I" as a boast.`)
      ],
      choices: [
        C(`"WHEN THE BELL RINGS TONIGHT, HUM. WE ARE ALL AWAKE."`, "notes_done", { effects: [{ set: "bronka_note_hum", val: true }] }),
        C(`"TUESDAY HAPPENED. A MAN WAS HANGED. ASK YOUR NEIGHBOUR."`, "notes_done", { effects: [{ set: "bronka_note_truth", val: true }, { surv: 3 }] }),
        C(`"THE BELL TAKES YOUR NAMES. SAY ONE ALOUD BEFORE EIGHT."`, "notes_done", { effects: [{ set: "bronka_note_names", val: true }] }),
        C(`Not yet.`, "hub")
      ]
    }),

    notes_done: N("bronka", `She writes it, with the stub of a pencil on a scrap of greaseproof, in her round bold hand, and holds it to the light. It looks like nothing. It looks like a recipe. She folds it small, and again, and from a drawer takes a rack of dough-balls and tucks the paper in with a pair of floury tweezers.\n\n'Four hundred,' she says. 'It'll take me till five. They'll go out tonight in the queue at six, and by eight there won't be a table in the district without one. It's not an uprising. It's a slow dinner.' She slides the first loaf into the oven. 'Anybody can say no to a poster. Nobody says no to bread.'`, {
      onEnter: [{ set: "bronka_notes_set", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_chosen_family" },
        { note: "task_jubilee", text: "Four hundred loaves, each with a note in the crumb, will go out in the Jubilee queue at six. Bronka will have them on every table by eight." }],
      interjections: [
        I("charm", 3, `A beautiful little insurrection in a bread-tin. We should send her flowers.`),
        I("appetite", 3, `Every loaf in the district is going to have an opinion. I have never wanted so much to be a baker.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    thermos: N("bronka", `You hold out the dented green thermos. She turns it over, reads the stencil, reads the threat underneath, and snorts. 'Rail Service. Nadia Fell. That one would sell her own grandmother and give the change back.' But she unscrews the cap and sniffs, and her face softens by a degree.\n\n'Who is it for?'\n\n'A man at the top of the tower who rings the Bell. He doesn't talk.' You say it carefully. 'He's got a wall of cords. One of them has your husband's name on it.'`, {
      onEnter: [{ xp: 1 }],
      choices: [C(`Wait.`, "thermos_fill")]
    }),

    thermos_fill: N("bronka", `Her hands stop on the thermos. They do not shake. They are the steadiest hands in the Hall, and they have stopped, completely, like a clock in a very quiet room.\n\n'Tobar,' she says.\n\nThen she takes the thermos to the stove, and from the big copper pot ladles a black sweet tea thick with chicory, and a spoonful of something from a jar on a high shelf, and caramel. She screws the cap down, takes a stub of pencil, and on a scrap of greaseproof writes, in her round hand: FOR THE ONE WHO TIES THE KNOTS. EAT SOMETHING. B. She tapes it to the cap.\n\n'Go,' she says. 'Before I climb it myself.'`, {
      onEnter: [{ set: "bronka_thermos_filled", val: true }, { xp: 3 }, { morale: 1 }, { thought: "th_good_son" }],
      interjections: [
        I("empathy", 5, `Your husband's name is on a wall in a tower. You learned this from a student at a counter on a Thursday morning. The right response, apparently, is soup.`),
        I("solidarity", 4, `We are passing a thermos from hand to hand across the district. It has never been so heavy.`)
      ],
      choices: [C(`Take it.`, "hub")]
    }),

    tobar_tower: N("bronka", `You tell her, without the thermos, that there is a man at the top of the Library stair who has kept a cord with Tobar's name on it for a year, black, with a tag. That he rings the Bell by hand. That he has never met her and would like to.\n\nShe does not answer. She walks to the back door, opens it, and stands on the step with her hand on the frame. The heel of the loaf is still there, out in the grey. A pigeon has not taken it. Out in the courtyard the loudspeaker plays eleven bars of the march.\n\n'I've never been up the tower,' she says at last. 'It's a hundred and twelve steps, I'm told.' She shuts the door. 'I'll be up at seven.'`, {
      onEnter: [{ set: "bronka_tobar_tower", val: true }, { set: "bronka_will_visit_hob", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        I("empathy", 5, `Not a memorial. A meeting. She'll bring the egg she wouldn't give her son.`),
        I("stamina", 3, `A hundred and twelve steps. She'll make it, and she'll hate every one, and she'll be early.`)
      ],
      choices: [C(`Stay with her.`, "hub")]
    }),

    ready: N("bronka", `She dries her hands, folds the cloth in four, and lays it over the rail of the range. She looks you in the eye for the first time since you came in.\n\n'I'll tell you what I can do,' she says. 'I can feed four hundred in the queue, and the choir after, and anyone who comes through that back door tonight with a story. I can keep the Hall's lights on past the Bell, because the fuse-box is in my pantry and the Principal has never found it. I can stand at the counter at eight o'clock with a ladle, and I'll be there when it's over.' She nods. 'Whatever you do, do it where I can see it.'`, {
      onEnter: [{ set: "bronka_ready", val: true }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_jubilee", text: "Bronka will hold the Ration Hall's lights and counter at eight, with four hundred loaves in the district behind her." }],
      interjections: [
        I("solidarity", 3, `A kitchen is a fortress with a good smell. We are in the kitchen. We're safe in the kitchen.`),
        I("authority", 4, `A strategic asset: the fuse-box. You are, at this moment, the only person in the school aware of it. Do not tell Rhea.`)
      ],
      choices: [C(`'Thank you, Bronka.'`, "ready_again")]
    }),

    ready_again: N("bronka", `Bronka is kneading. The dough has a hundred small notes in it and she is working them in with the flat of her hand, humming something in a low contralto that sounds, you think, like a lullaby that has been taught to count.\n\n'Tin's gone,' she says. 'He came. He took the egg. He didn't say a word, and I didn't ask.' She turns the dough. 'I'll ask later. When it's not so loud.'`, {
      interjections: [
        I("empathy", 4, `The pattern in her humming: seven, then eleven. She doesn't know she's doing it.`, { cond: "flag.hob_rhythm || flag.ilsabet_decoded" })
      ],
      choices: [
        C(`'Anything you need?'`, "ready_need"),
        X(`'Eat something, Bronka.'`)
      ]
    }),

    ready_need: N("bronka", `'Flour,' says Bronka. 'Faith. A second pair of hands.' She considers you. 'The first two I've got. The third, you'll find. Somebody who can fold a letter small.'\n\nIf you have a spare coupon she takes it and writes you a bowl of soup against it. She is a woman who has never been out of the black in her life, and she does not intend to begin now.`, {
      choices: [
        C(`[Give her a coupon.]`, "ready_again", { cond: "has('ration_coupon')", effects: [{ take: "ration_coupon" }, { hp: 2 }, { toast: "Bronka's soup: Body +2." }], once: true }),
        C(`'I'll find someone.'`, "ready_again")
      ]
    })
  }
},

// =====================================================================
ilsabet_d3: {
  title: "Ilsabet Orrin",
  start: [
    { cond: "flag.ilsabet_ready", node: "ready_again" },
    { cond: "flag.ilsabet_betrayed && !flag.ilsabet_forgave", node: "cold" },
    { cond: "flag.counter_tone_built || has('counter_tone')", node: "test_open" },
    { node: "build_open" }
  ],
  nodes: {
    cold: N("ilsabet", `'Oh. It's you.' She does not look up. The little set is in her lap with its green eye blinking, and she is adjusting a dial that does not need adjusting. 'I'd like to say I'd forgotten. It's the one thing the Bell is good for, and it didn't work. I remember exactly what the Principal said to me on Wednesday. "A student has been kind enough to mention your apparatus."'\n\nThe dial turns a hair left. 'You'll want to sit down, because you won't be allowed to stand and apologise. It's a very small room, and I've got the better chair.'`, {
      interjections: [
        I("empathy", 3, `She is not angry the way a person is angry at a stranger. She's angry the way you'd be angry at your own hand.`),
        I("doublethink", 3, `A very reasonable thing to have done! In context! You were under pressure! (We would like to continue to think this. It's a comfort. It's wrong, but it's a comfort.)`),
        I("volition", 4, `You did the thing she was afraid of. The only way back is to say it in the plainest words you own.`)
      ],
      choices: [
        K(`[Empathy] Apologise without a single excuse.`, "empathy", 11, "ilsabet_d3_forgive_empathy", "cold_pass", "cold_fail", { w: 1 }),
        K(`[Charm] Say something so unexpectedly honest she laughs.`, "charm", 12, "ilsabet_d3_forgive_charm", "cold_pass", "cold_fail", { w: 1 }),
        C(`Leave her be.`, "cold_leave")
      ]
    }),

    cold_leave: N("narrator", `You stand. She does not look up. The set in her lap whistles faintly, a fraction of a tone, like a kettle being polite.`, { choices: [X(`Go.`)] }),

    cold_pass: N("ilsabet", `She hears it out. Then she puts the set down on the arm of the chair, takes her glasses off, wipes them on the cardigan the colour of a warning label, and puts them back.\n\n'That,' she says, 'was the worst apology I've ever received, and I'm including the one from the Ministry. You didn't even say "regret".' A pause. 'Thank you.' She holds the set out, sideways, a peace offering with a valve. 'There's a thing I can't do alone. I'd rather do it with someone who knows what it costs to be on the wrong side of the dial.'`, {
      onEnter: [{ set: "ilsabet_forgave", val: true }, { xp: 3 }, { morale: 1 }],
      interjections: [
        I("empathy", 4, `The set isn't a gift. It's an invitation, which is much more dangerous.`)
      ],
      choices: [C(`Take it.`, "hub")]
    }),

    cold_fail: N("ilsabet", `'No,' she says. It's quite gentle. 'I'm sure that cost you something. It cost me a great deal more. Come back when you can say it without wanting me to be the one who ends it.'\n\nShe turns the dial. Static washes the room.`, {
      onEnter: [{ morale: -1 }],
      choices: [X(`Go.`)]
    }),

    build_open: N("ilsabet", `The boiler room has been turned into a laboratory by a girl with no budget. The big table is a field of wire and wax and cannibalised valves, and in the middle of it sits the little set like a patient, with its back open. She has a soldering iron in one hand and a biscuit tin in the other and she is not holding either like a person who expects them to work.\n\n'Eight hours,' she says. 'It's all very well decoding the Bell. It's another thing to run it backwards. I've got the shape of the Wake tone. I've got the tube, the cable, half a cylinder. I haven't got a bench that doesn't run on faith.'`, {
      interjections: [
        I("deduction", 3, `Four things. A radio tube, a cable, a blank cylinder, a case of Gregor's valves. If you have them all she can build it here, on this table, on a hope and a prayer.`),
        I("senses", 3, `Hot wire, hot wax, and an undertone in the air that is the carrier she picked out on Tuesday. She leaves a small speaker running at the lowest volume, to keep her ear in.`),
        I("empathy", 3, `She hasn't slept. She's not afraid. She is the opposite of afraid, which is a thing nobody ever tells you the name of.`)
      ],
      choices: [C(`'What do you need?'`, "hub")]
    }),

    hub: N("ilsabet", `'Go on, Inspector.' She turns her chair a precise quarter to face you. 'You have my full attention and, what's left of it, my sandwich.'`, {
      interjections: [
        I("solidarity", 4, `A girl with a soldering iron, running the biggest operation in the building from a wheelchair, in a basement, with a sandwich. We are going to be sentimental about this one.`)
      ],
      choices: [
        C(`[All four parts.] 'Here. I've got everything. Can you build it?'`, "build", { cond: "!flag.counter_tone_built && !has('counter_tone') && has('radio_tube') && has('mic_cable') && has('cylinder_blank') && has('gregor_tubes')" }),
        C(`'What's missing? Tell me exactly.'`, "missing", { cond: "!flag.counter_tone_built && !has('counter_tone')" }),
        C(`'Test it on me.'`, "test_open", { cond: "(flag.counter_tone_built || has('counter_tone')) && !flag.ilsabet_tested" }),
        C(`'The Little Lamp. Tonight. Will you read a letter?'`, "letter", { cond: "!flag.ilsabet_letter_done" }),
        C(`'Tell me about the stairs again. The seventeen.'`, "stairs", { cond: "flag.ilsabet_chair && !flag.ilsabet_stairs3" }),
        C(`'Where will you be at eight?'`, "ready", { cond: "!flag.ilsabet_ready && (flag.counter_tone_built || has('counter_tone'))" }),
        X(`'Nothing more.'`)
      ]
    }),

    missing: N("ilsabet", `She counts on her fingers, solder-black at the tips. 'A tube: the 6K7, you brought that. A cable for the mic, hand-soldered: that's in the planning table, if the Undercurrent hasn't used it for a clothesline. A cylinder blank, something that'll take a recording and not melt. And a case of proper valves, because mine are held together with sugar and hope.'\n\n'The valves are Old Gregor's. The man on Karsov Avenue with the kiosk. He keeps a bench in the back that I would kill for. Somebody has to ask him nicely.' She points the soldering iron at you. 'Somebody is you.'`, {
      onEnter: [{ xp: 1 }, { note: "task_counter", text: "Ilsabet needs four things to build the Wake tone: the 6K7 tube, a mic cable, a blank wax cylinder, and Old Gregor's spare valves (Gregor's kiosk, Karsov Avenue)." }],
      interjections: [
        I("archive", 3, `Checklist, by item: radio_tube, mic_cable, cylinder_blank, gregor_tubes. The Union approves of lists. Make this one come true.`)
      ],
      choices: [C(`Back to her.`, "hub")]
    }),

    build: N("narrator", `You lay it on the table: the glass tube, the black cable, the cylinder in its sleeve, the box of valves in their newspaper twists. She looks at them as if they were a meal after a siege. Then she rolls her chair up to the bench and the whole room shrinks around her hands.`, {
      choices: [
        K(`[Aim] Hold the iron steady while she threads the filament.`, "aim", 11, "ilsabet_d3_build_aim", "build_pass", "build_fail", { w: 1 }),
        K(`[Sleight] Thread the wires together while she wires the tube.`, "sleight", 11, "ilsabet_d3_build_sleight", "build_pass", "build_fail", { w: 1 }),
        K(`[Deduction] Read her diagram and tell her where it's wrong.`, "deduction", 11, "ilsabet_d3_build_deduction", "build_pass", "build_fail", { w: 1 })
      ]
    }),

    build_pass: N("ilsabet", `It takes forty minutes and a smell of burnt hair. At the end she sits back and holds the black cylinder up to the lamp, and it looks like nothing: a biscuit-tin of wax. Then she sets it on the little set, flicks a switch, and out of the speaker comes a sound you can only describe by what it undoes: a cool, quiet, rising note, like a window being opened by someone who loves the room.\n\n'The Wake tone,' she says. She is crying, and furious at it. 'It runs the beat backwards. Eleven, seven. It goes into the Bell's carrier like a key into a lock.' She wraps the tin in her own scarf and puts it in your hands. 'Don't drop it. Not because it's fragile. Because it's the only one.'`, {
      onEnter: [{ set: "counter_tone_built", val: true }, { give: "counter_tone" }, { take: "radio_tube" }, { take: "cylinder_blank" }, { take: "gregor_tubes" }, { xp: 5 }, { morale: 3 }, { thought: "th_wake_tone" }, { task: "task_counter", state: "done" },
        { note: "task_counter", text: "Ilsabet built the Wake tone: a wax cylinder in a biscuit tin, wrapped in her scarf. It runs the Bell's beat backwards." }],
      interjections: [
        I("senses", 4, `You can feel it in your tinnitus: not a silence. A pause. The ringing in your head takes a breath for the first time in ten years.`),
        I("solidarity", 3, `We built it. We did. Not one of us alone; a girl, a wire, an old man, a student, a boiler.`)
      ],
      choices: [C(`Hold the tin.`, "test_open")]
    }),

    build_fail: N("ilsabet", `Something sparks. A valve pops with a small, sour sound like a bone. 'Damn,' she says, mildly, and blows on it. The cylinder is cracked at one end. She turns it in her hands, lips moving.\n\n'It's recoverable. It isn't dead. We need a steadier hand or a longer minute.' She wipes her forehead with a wrist. 'Try again. I've got the second set in my cardigan.'`, {
      onEnter: [{ xp: 1 }],
      choices: [C(`Try again.`, "build"), C(`Take a breath.`, "hub")]
    }),

    test_open: N("ilsabet", `'It works,' she says, with a face like a child at the edge of a very cold sea. 'It works on the bench. It plays. It makes a sound. What I don't know is whether it works on a person.'\n\nShe looks at you. 'You can't be the test, you know. You've got the tinnitus. The Bell doesn't take on you as well, so you wouldn't notice when it didn't work. A control group of one is useless.' She taps her own chest. 'I'm not Static-proof. I'm exactly as foggy as everyone else. I've got a year in there I can't read.'`, {
      interjections: [
        I("dialectics", 4, `Experimental logic: a subject who is susceptible. She has volunteered. She is the best possible participant and the worst possible person for it to hurt.`),
        I("empathy", 4, `She isn't asking for permission. She's asking for company.`),
        I("volition", 4, `It is her ear and her choice. Don't take it from her by being kind.`)
      ],
      choices: [
        C(`'All right. I'll hold your hand.'`, "test_run"),
        C(`'No. Not you. We'll find someone else.'`, "test_refuse"),
        C(`'Let me hold the dial. You should concentrate.'`, "test_run", { effects: [{ xp: 1 }] }),
        C(`'Not yet. Let me think.'`, "hub")
      ]
    }),

    test_refuse: N("ilsabet", `'Someone else.' She almost laughs. 'There's nobody else. There's me and the ones who can't be asked.' She sets the tin down, very gently. 'I'm not offended. I'd just like it on the record that I offered.'\n\nThe boiler mutters. She does not touch the cylinder again for ten minutes. Then she does.`, {
      onEnter: [{ morale: -1 }, { set: "ilsabet_test_refused", val: true }],
      choices: [C(`'...All right. Do it.'`, "test_run")]
    }),

    test_run: N("narrator", `She puts the headphones on, sets the cylinder on its spindle, and winds the little crank. The needle drops. From the speaker comes, first, the Bell's own carrier, pure E-flat, the evening lullaby, recorded off a pole in the courtyard: the sound that has put eleven thousand people to sleep. You watch her face go slack, slowly, the way a face goes in front of a fire.\n\nThen, under it, the second tone creeps in. The backwards beat. Eleven. Seven. Eleven. You are holding her hand and it goes cold, then very warm, then grips yours with the strength of a drowning person.`, {
      interjections: [
        I("senses", 4, `Her breath has stopped. Her eyes are open and they are not here. Her pupil is a pinhole and then it is a coin.`),
        I("grit", 4, `Stay with her. Do not take the headphones off. If she is falling she must be allowed to arrive.`),
        I("the_grey", 4, `A basement in a school. A girl in a chair. A very old sound coming up through the floor. The whole building holds its breath with her.`)
      ],
      choices: [
        K(`[Composure] Keep your hand still. Don't flinch when she grips.`, "composure", 10, "ilsabet_d3_test_composure", "test_pass", "test_partial", { w: 1 }),
        K(`[Empathy] Talk to her. Say her name, steadily, over and over.`, "empathy", 11, "ilsabet_d3_test_empathy", "test_pass", "test_partial", { w: 1 })
      ]
    }),

    test_pass: N("ilsabet", `She comes up gasping, like someone pulled from a river, and for three whole seconds says nothing at all. The headphones slide to her neck. Her glasses are wet.\n\n'Spring,' she says. 'Last spring. I was on the stairs. Dormitory Four. Not the day I fell: the day before. A man sat down on the ninth step beside me. A tall, tired man with a Commissar's armband, and he said, "I've heard your little lamp." He said he'd been listening for a month. He said it had been the only honest thing on the dial.' She puts her hand over her mouth. 'I told him about the beat. Ostrov. I told him there was a second voice. He took notes on a napkin. He said, "Keep reading, Little Lamp. I'm listening." And then the Bell took it.'\n\nShe laughs, wet, delighted, horrified. 'I started it. The whole thing. The Ledger. It started with a girl under a blanket reading letters to nobody, and somebody was listening.'`, {
      onEnter: [{ set: "ilsabet_tested", val: true }, { set: "ilsabet_memory", val: true }, { xp: 5 }, { morale: 3 }, { thought: "th_what_wakes" }, { thought: "th_wake_tone" }],
      interjections: [
        I("empathy", 5, `She just got a year back. Not a whole year, a piece of one. She has never looked so young or so old.`),
        I("archive", 4, `Ostrov's first note on the Bell was a napkin. The Ledger is eight hundred pages. The reasoning behind it was a napkin and a girl.`),
        I("solidarity", 4, `Somebody was listening. That is the whole of the Undercurrent, in a sentence. Somebody was listening.`)
      ],
      choices: [C(`Hold her hand.`, "needs_choir")]
    }),

    test_partial: N("ilsabet", `It is a bad minute. She comes up with a cry like a startled bird and a thin line of blood from her left nostril, and clamps the heel of her hand over it, laughing in a high strange way.\n\n'It works,' she says. 'It works, it works, it just doesn't hold. I saw something. A staircase. Somebody laughing on it.' She wipes her face. 'That's all. Just a staircase and a laugh. It's the wrong size. The tone's strong enough to wake one person for a minute. It isn't strong enough for the district.' She looks at the tin. 'It needs a carrier. Something bigger than a speaker.'`, {
      onEnter: [{ set: "ilsabet_tested", val: true }, { xp: 2 }, { hp: -1 }],
      interjections: [
        I("empathy", 4, `A staircase and a laugh. It's not nothing. It's a thread, and she'll pull it for the rest of her life.`)
      ],
      choices: [C(`'What kind of carrier?'`, "needs_choir")]
    }),

    needs_choir: N("ilsabet", `'Voices.' She says it as if surprised by the word. 'The Bell's second tone rides inside the choir. It always has: the Anthem has a pedal note, a long held D underneath the verse, and that's where the carrier is hiding. The Wake tone's a whisper beside a loudspeaker's roar. To bring it into the Anthem you need a human voice to hold it, the way a hand holds a candle in the wind.'\n\nShe looks up. 'Fenwick. He's been singing that pedal note for six years, and he can hear it. You tell him it's a key change in the third bar. He'll know what it means. He'll cry. Then he'll write it out in pencil.'`, {
      onEnter: [{ set: "ilsabet_needs_choir", val: true }, { xp: 2 }, { note: "task_choir2", text: "Ilsabet says the Wake tone needs a carrier: the choir's pedal note. A key change in the third bar, held by human voices. Fenwick will know." }],
      interjections: [
        I("rote", 3, `THE ANTHEM, FOUR VERSES, IN D MAJOR, WITH A PEDAL TONE ON THE BELL. (A pedal. A pedal is what you hold down with your foot so a thing can't escape.)`),
        I("rhetoric", 4, `It's perfect and it's obscene. You will have forty children carry the cure inside the poison.`)
      ],
      choices: [C(`'I'll talk to him.'`, "hub")]
    }),

    letter: N("ilsabet", `'The Lamp.' She puts the soldering iron down. 'Read a letter. Tonight. Over what, the mic? The pole?' She looks at the little set, and then at you, and something shy goes across her face. 'Nobody's ever asked me to read one out loud. I only ever read them to the blanket.'\n\n'What would it say?' she asks. 'It has to be a letter. It can't be a speech. A speech is just a threat with a plan. A letter is somebody being honest in a nice voice.'`, {
      interjections: [
        I("rhetoric", 4, `Three kinds of letter: tender, defiant, absurd. Each one is a different promise to the listener. Choose the promise.`),
        I("charm", 4, `The funny one. Always the funny one. People will forgive you anything for a joke they can repeat.`),
        I("empathy", 4, `Let her choose, in the end. It's her voice. You are only the pencil.`)
      ],
      choices: [
        C(`Tender. 'Dear Listeners. You are not alone, and you never were.'`, "letter_done", { effects: [{ set: "ilsabet_letter_tender", val: true }] }),
        C(`Defiant. 'Dear Listeners. Remember Tuesday. They are counting on you not to.'`, "letter_done", { effects: [{ set: "ilsabet_letter_defiant", val: true }, { surv: 3 }] }),
        C(`Absurd. 'Dear Listeners. The weather is a patriot. Please do not be.'`, "letter_done", { effects: [{ set: "ilsabet_letter_absurd", val: true }] }),
        C(`Not yet.`, "hub")
      ]
    }),

    letter_done: N("ilsabet", `She writes it in pencil on the back of a Ministry circular, in a small rapid hand, crossing out and starting again. She reads it aloud once, to the boiler, and it sounds like nothing and like everything, a girl in a basement telling eleven thousand people the weather.\n\n'That'll do,' she says. 'I'll read it in a voice that doesn't tremble. Or I'll read it in one that does and let them decide.' She folds the paper, tucks it into her cardigan next to the heart. 'It's my first real broadcast. Don't you dare tell me it's my last.'`, {
      onEnter: [{ set: "ilsabet_letter_done", val: true }, { xp: 3 }, { morale: 2 }],
      interjections: [
        I("solidarity", 4, `A letter to eleven thousand people, in pencil. We would like very much to be the ones who receive it.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    stairs: N("ilsabet", `'The seventeen.' She looks at her hands. 'I think about them. I think about them every time I come to a flight of anything. People think the chair is the sad part. It's not. The chair's a very good chair. It's the notice that came with it: "On loan, subject to review."'\n\nShe smiles, a small tight thing. 'Do you know what I'm going to do on Friday? If there's a Friday I remember? I'm going to find the man who denied the ramp, and I'm going to build him one. A very long, very beautiful ramp. With a handrail. And I'm going to make him walk down it every morning for the rest of his life.'`, {
      onEnter: [{ set: "ilsabet_stairs3", val: true }, { xp: 1 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        I("empathy", 4, `Not revenge. A very specific kind of mercy that comes with inspection.`),
        I("charm", 3, `Ask if she needs help with the drawings. You will be asked to carry the pencil.`)
      ],
      choices: [C(`Laugh with her.`, "hub")]
    }),

    ready: N("ilsabet", `'At eight?' She looks at the tin in your hands. 'I'll be at the Hall, at the mixing patch behind the stage, where the floor's flat and there's a ramp. It's the only room in the school built for a chair: the Warden's idea of a choir includes a wheelchair row for the photograph.' Her grin is wicked. 'I intend to sit in the photograph.'\n\n'I'll have the cylinder on the spindle and the carrier tuned. When the first note of the Anthem comes through, I'll give it the Wake tone, a hair under. Nobody will hear a thing. They'll just feel like a window's been opened.' She holds out a hand. 'Whatever else you've got to do, do it in the next four hours. After that, I need you to be somewhere I can see you.'`, {
      onEnter: [{ set: "ilsabet_ready", val: true }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_jubilee", text: "Ilsabet will be at the Ration Hall's mixing patch at eight, with the Wake tone on the spindle and the carrier tuned. She wants me where she can see me." }],
      interjections: [
        I("solidarity", 3, `A girl who got to choose where to sit. We're thrilled.`),
        I("authority", 4, `Operational lead: the patch. Ally: ready. You should write that down, if there is going to be a tomorrow.`)
      ],
      choices: [C(`Shake her hand.`, "ready_again")]
    }),

    ready_again: N("ilsabet", `Ilsabet is rolling a spool of cable through her lap, twenty feet at a time, in a long neat figure of eight. She hums under her breath: something tuneless that, a moment later, you realise is the Anthem, one bar a semitone sharp.\n\n'Practising,' she says. 'It's the hardest thing I've ever done. Deliberately sharp. The whole country's been trained to correct it in their heads.' She puts the cable down. 'You've got your face on. The "I should be doing something" face. Go and do it. I've got eight hours of untangling.'`, {
      choices: [
        C(`'Anything else you need?'`, "hub"),
        X(`'See you at eight.'`)
      ]
    })
  }
},

// =====================================================================
fenwick_d3: {
  title: "Choirmaster Alder",
  start: [
    { cond: "flag.fenwick_ready", node: "ready_again" },
    { cond: "flag.choir_wake_arrangement", node: "rehearsal_open" },
    { node: "first_d3" }
  ],
  nodes: {
    first_d3: N("fenwick", `'Ah! Ah, my, ah, my student.' The thin man in the shabby suit is on the podium, but he is not conducting; he is holding the baton in both hands like a candle in a draught. The risers behind him are empty, forty small chairs in a fan, and in front of the lone microphone stands a music-stand with nothing on it.\n\n'It is, ah, Thursday,' he says, as if reporting a death. 'The Ministry's man came at six. A tape, a form and a run-through at seven. We are to sing the official arrangement, note for note, under, ah, supervision.' He looks at the baton. 'I have been awake all night. Do you know I wrote a key change in the margin and tore it out three times?'`, {
      interjections: [
        I("empathy", 3, `He is terrified in the way brave people are: loudly, privately, and about the wrong thing. He isn't afraid of the Ministry. He is afraid of being asked.`),
        I("rote", 4, `THE ANTHEM, FOUR VERSES, D MAJOR. THE THIRD BAR OF THE LAST VERSE HOLDS A LONG PEDAL ON THE D. (A CHOIRMASTER'S LIFE IS FIVE NOTES AND A GHOST.)`),
        I("senses", 3, `A pencil behind his ear. A music-stand with ghost-grooves on it where a page has been taped, torn off, taped again.`)
      ],
      onEnter: [{ xp: 1 }],
      choices: [
        C(`'Fenwick. The pedal note. I know what hides in it.'`, "persuade_open", { cond: "!flag.fenwick_persuaded3" }),
        C(`[Choir score.] 'Is this the page you tore out?'`, "persuade_open", { cond: "has('choir_score') && !flag.fenwick_persuaded3" }),
        C(`Sit with him.`, "hub")
      ]
    }),

    rehearsal_open: N("narrator", `The Ration Hall has become a hall for something else. The risers are full: forty children in dark blazers, small, scrubbed, hair slicked with water, holding their sheets in both hands like trays. Fenwick stands above them on the podium in his best suit, baton raised, and looks, for once, entirely unafraid.\n\nThey are in the middle of a run. The Anthem rolls through the vaulted canteen like a good clean tide; you know every word of it, and so does every pillar. Then the third bar of the last verse arrives. The pedal D holds, and, on top of it, the whole choir drops a half-step and lifts, softly, up: a rising, uncertain, tender, wrong note that makes the hair on your neck stand and then lie down again, as if it had been told it could.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("senses", 4, `Forty children and the note is almost in tune. The one in the second row is a hair flat. Forty is the number of people it takes to make a sound that is not a person.`),
        I("solidarity", 3, `We are a choir. We have a conductor. We have a note.`),
        I("empathy", 4, `Look at the faces. Look at how not-afraid they are. It's almost frightening.`)
      ],
      choices: [C(`Wait for the end of the run.`, "rehearsal_end")]
    }),

    rehearsal_end: N("fenwick", `The last note rings and dies. Fenwick holds the baton in the air for a long moment, eyes shut, and the children hold with him; then he lets his arm fall and the whole choir breathes out together.\n\n'Ah!' He turns, beaming, his face lit with the particular brightness of a man who has found out what he is for. 'My student! You must, ah, you must hear it, from the, ah, the floor. Children, break! Water, five minutes, no whispering about the third bar until, ah, until the, until tonight.' He bounds down off the podium with a vigour you have not seen in him. 'It is, ah, quite right, isn't it? It rises. Like a question.'`, {
      interjections: [
        I("empathy", 4, `He's alive. Whatever happens at eight, he'll have had this.`),
        I("charm", 3, `Tell him it's right. It is, and he needs to hear it from somebody who isn't forty and holding a hymn-sheet.`)
      ],
      choices: [C(`'It is. It's perfect.'`, "hub", { effects: [{ morale: 1 }] }), C(`'Can I hear it again?'`, "rehearsal", { cond: "!flag.fenwick_rehearsed3" })]
    }),

    hub: N("fenwick", `'Ah. Yes.' Fenwick adjusts his tie, which does not need adjusting, and then adjusts his spectacles. 'What can, ah, what can the arts do for you? On the last day.'`, {
      interjections: [
        I("empathy", 4, `He says "the last day" and means it as a joke. He doesn't know it's true.`)
      ],
      choices: [
        C(`'Tell me about the second verse. The one nobody sings.'`, "second", { cond: "!flag.fenwick_second" }),
        C(`'Let me conduct the third bar. I want to understand it.'`, "rehearsal", { cond: "flag.choir_wake_arrangement && !flag.fenwick_rehearsed3" }),
        C(`'The small girl in the front row. What's her name?'`, "pia", { cond: "flag.choir_wake_arrangement && !flag.fenwick_pia" }),
        C(`'You said "I can't be brave on a Thursday." It's Thursday.'`, "thursday", { cond: "flag.fenwick_choir_ready === undefined && !flag.fenwick_thursday" }),
        C(`'Osk used to tune your piano, didn't he.'`, "osk", { cond: "flag.osk_scapegoat && !flag.fenwick_osk3" }),
        C(`'At eight. Will you be on the podium?'`, "ready", { cond: "flag.choir_wake_arrangement && !flag.fenwick_ready && (flag.fenwick_rehearsed3 || flag.fenwick_pia)" }),
        X(`'Nothing, Maestro. Carry on.'`)
      ]
    }),

    persuade_open: N("fenwick", `He goes very still. He lowers the baton as if someone had told him it was loaded.\n\n'What, ah, what hides in it,' he says. 'I, ah. I have always, always known. Every night at nine, at the, ah, the Bell, in the pedal tone. A second voice underneath the first one. The, the shape of a, a, a hand over a mouth.' He looks at the empty risers. 'I thought I was going mad. I wrote it down as a, as a musical problem. A beat in the, in the fundamental. Seven against eleven. It was, ah, it was a, a, quite beautiful, if one did not think what it, what it was for.'\n\nHe swallows. 'Tell me what you want me to do, and I will tell you why I cannot.'`, {
      onEnter: [{ set: "fenwick_asked3", val: true }],
      interjections: [
        I("rote", 3, `SEVEN AGAINST ELEVEN. (A POLYRHYTHM. THE ONE THING THE ANTHEM CANNOT ARRANGE: IT HAS NO TIME SIGNATURE FOR IT.)`),
        I("rhetoric", 5, `He is a man who has always wanted to be asked and has never been able to answer. Ask him in a way that gives him somewhere to put the fear.`),
        I("empathy", 4, `Do not ask him to be brave. Ask him to be a musician.`)
      ],
      choices: [
        K(`[Rhetoric] 'You wrote a line in the score last spring. Write another. It's only music.'`, "rhetoric", 11, "fenwick_d3_persuade_rhet", "persuade_pass", "persuade_fail", { w: 1 }),
        K(`[Empathy] 'You don't have to do it. You only have to let the children decide.'`, "empathy", 10, "fenwick_d3_persuade_emp", "persuade_pass", "persuade_fail", { w: 1 }),
        K(`[Rote] Sing him the second verse. The one nobody knows.`, "rote", 10, "fenwick_d3_persuade_rote", "persuade_pass", "persuade_fail", { w: 1, cond: "flag.fenwick_second || skill('rote') >= 5" }),
        C(`Give him time.`, "hub")
      ]
    }),

    persuade_pass: N("fenwick", `He puts down the baton. He picks up a pencil, a fat blunt carpenter's pencil from behind his ear, and without a word draws five lines on the back of the Ministry's tape-form. His hand moves like a man reciting a poem he had thought he'd forgotten. A key change in the third bar. A held D. A rise, a half-step, a question. When he is done he looks at it for a long time.\n\n'Four voices,' he says, quietly. 'The, ah, the sopranos hold the top. The altos carry the pedal. The, ah, small ones, the first-years, they hum. They, ah, they can't hurt it.' He tears the page free and presses it into your hand. 'There. It's a, a score. It's only music.' His laugh is shaky. 'God help us. It's the best thing I've written.'`, {
      onEnter: [{ set: "fenwick_persuaded3", val: true }, { set: "choir_wake_arrangement", val: true }, { give: "choir_score" }, { xp: 4 }, { morale: 3 }, { thought: "th_what_wakes" },
        { note: "task_choir2", text: "Fenwick wrote the Wake arrangement: a held D, a half-step lift in the third bar of the last verse. The choir will hum the carrier. It's only music." }],
      interjections: [
        I("solidarity", 4, `Forty small voices and a pencil. We could cry.`),
        I("archive", 4, `Note for the Record: the arrangement has been drawn on the back of Ministry Form 12-T, 'Request for Tape Authorisation'. It is, therefore, technically, a Ministry document.`)
      ],
      choices: [C(`Hold the page carefully.`, "rehearsal_open")]
    }),

    persuade_fail: N("fenwick", `'No,' he says, 'ah, no.' It is a very small word and it comes out very large. 'I, I can't. Not on a, on a Thursday. I'm, I am sorry. I am a, a coward and a musician and they are, as it turns out, ah, the same thing.' He picks the baton up again, and for a moment it is a thing for which he has no use.\n\n'Ask me again,' he says, 'when I've had a, a cup of tea and a, a sleep. Or when the children are here. They, ah, they make me braver. They have no idea how.'`, {
      onEnter: [{ morale: -1 }, { xp: 1 }],
      choices: [C(`Leave him a while.`, "hub")]
    }),

    second: N("fenwick", `'The second verse.' He says it as if looking over his shoulder. 'Pelham wrote it. The composer. He was a dreadful man but he had one good idea in his life and it was this. The first verse, ah, praises the Warden. The second, the original second, goes: "Let the bell be only a bell, / Let the hour be only an hour / Let him who sleeps be let wake / And him who wakes be let tell." The censors cut it in the, ah, the third year. It was thought, ah, thought to be subversive.'\n\nHe is very pale. He is singing it under his breath, as you listen. It is, you realise, very beautiful. 'It's, ah, it is the same tune,' he says. 'Just a note higher at the end.'`, {
      onEnter: [{ set: "fenwick_second", val: true }, { xp: 3 }, { thought: "th_wake_tone" }],
      interjections: [
        I("rote", 4, `LET THE BELL BE ONLY A BELL. LET THE HOUR BE ONLY AN HOUR. (I KNEW THIS. I KNEW THIS. THE SECOND VERSE NOBODY KNOWS. I KNEW IT FROM THE FIRST NIGHT.)`),
        I("rhetoric", 4, `It's the original text. The Ministry cut a verse because it said something the tone was built to prevent. The cure was in the anthem all along.`),
        I("archive", 5, `Note: "him who wakes be let tell." That is, strictly speaking, the founding charter of the Undercurrent. Written by a state composer.`)
      ],
      choices: [C(`Hum it with him.`, "hub", { effects: [{ morale: 1 }] })]
    }),

    rehearsal: N("fenwick", `'You, ah, would like to, to conduct?' He looks delighted and appalled. 'Well. It is not, ah, hard. You, ah, listen. You raise your arms like a, like a man lifting a very light box. When the sopranos reach, ah, the top, you lower your left hand. That is the pedal. That is the, ah, the whole thing. The children do the rest.'\n\nHe presses the baton into your hand. It weighs nothing. The forty children have reassembled and are looking at you with the terrible patience of the very young.`, {
      onEnter: [{ set: "fenwick_rehearsed3", val: true }],
      interjections: [
        I("composure", 3, `Do not wobble. Children smell wobble.`),
        I("rhetoric", 3, `A conductor is an orator who is not allowed to speak. Be eloquent with your elbows.`),
        I("charm", 4, `A smile. A real one. The little ones can tell. They cannot tell anything else, but they can tell that.`)
      ],
      choices: [
        K(`[Composure] Lead the third bar. Don't blink.`, "composure", 10, "fenwick_d3_conduct_comp", "rehearsal_pass", "rehearsal_fail", { w: 1 }),
        K(`[Charm] Lead it with a smile and let them carry you.`, "charm", 10, "fenwick_d3_conduct_charm", "rehearsal_pass", "rehearsal_fail", { w: 1 }),
        K(`[Solidarity] Don't lead. Breathe with them. Let the room do it.`, "solidarity", 9, "fenwick_d3_conduct_solid", "rehearsal_pass", "rehearsal_fail", { w: 1 })
      ]
    }),

    rehearsal_pass: N("narrator", `You raise your arms like a man lifting a very light box. The sopranos reach for the top. You lower your left hand, and forty children hold a note you can feel in your breastbone, hold it with a stern, shining attentiveness that is not, quite, sound; it is more like the stillness before a bell. The half-step rises. A question, held up, and left in the air.\n\nWhen it dies away nobody in the Ration Hall moves. The cook has stopped. A first-year in the front row is crying and trying to hide it behind the sheet.\n\n'Ah,' says Fenwick, very softly, behind you. 'That, ah. That is it.'`, {
      onEnter: [{ xp: 4 }, { morale: 3 }, { set: "fenwick_rehearsed_ok", val: true }],
      interjections: [
        I("senses", 4, `Your tinnitus stopped. For nine seconds. The ringing that has been there since you were four just... held its breath.`),
        I("solidarity", 3, `We hold the note. It is the easiest thing we ever did and the hardest, and we would like to do it again and again.`)
      ],
      choices: [C(`Hand back the baton.`, "hub")]
    }),

    rehearsal_fail: N("narrator", `You lower the hand a beat late. The pedal wobbles; a bass voice, a fourteen-year-old with a cracked and over-eager instrument, goes through the floor of it and the whole note collapses into giggles. Somebody drops a sheet.\n\nFenwick takes the baton back with a quick, kind hand. 'Again from the, ah, from the ninth bar,' he says, and the children, to your surprise, are not unkind. They've all done it wrong, once. It is, you realise, a wonderfully safe place to get it wrong.`, {
      onEnter: [{ xp: 1 }, { set: "fenwick_rehearsed3", val: false }],
      choices: [C(`Step down.`, "hub")]
    }),

    pia: N("fenwick", `'Pia.' He nods toward a tiny girl in the front row, ten at most, whose blazer is two sizes too large and whose hair has been drawn back so tight it has lifted her eyebrows. 'First year. A, ah, a very strong little voice. She holds the pedal when the older ones, ah, run out of breath.'\n\nThe girl has seen you looking. She comes over with great dignity and stops at precisely the polite distance. 'Is it true,' she says, 'that it won't hurt?'\n\nShe says it to you, not to him. She has decided you are the sort who knows.`, {
      onEnter: [{ set: "fenwick_pia", val: true }, { xp: 1 }],
      interjections: [
        I("empathy", 4, `She doesn't want to be reassured. She wants to be told the truth in a size she can carry.`),
        I("charm", 4, `A child. A real one. Do not be glib.`),
        I("volition", 4, `You cannot promise. You can say what is true: you don't know, and you'll be there.`)
      ],
      choices: [
        C(`'I don't know. But I'll be in the room.'`, "pia_honest"),
        C(`'It won't hurt. I promise.'`, "pia_promise"),
        K(`[Empathy] Crouch to her height and ask what she's afraid of.`, "empathy", 9, "fenwick_d3_pia_emp", "pia_honest", "pia_promise", { w: 1 })
      ]
    }),

    pia_honest: N("narrator", `Pia considers it with grave attention, the way a magistrate considers a plea. 'That's better than a promise,' she says. 'Promises are what they say before the Bell.' She nods, once, briskly. 'I'll hold the D. I've held it before. I do it by counting my buttons.'\n\nShe goes back to her place in the front row and counts them, visibly, all six. Behind you Fenwick makes a small sound and then pretends it was a cough.`, {
      onEnter: [{ xp: 3 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }, { thought: "th_chosen_family" }],
      choices: [C(`Go on.`, "hub")]
    }),

    pia_promise: N("narrator", `'Okay,' says Pia, with an air of having expected it. She looks at you a moment longer than is comfortable, nods, and goes back to her place. You have said the thing, and it has been received, and filed in the drawer where a child keeps what adults say and what they mean.\n\nShe does not look at you again. Fenwick, behind you, has gone still. 'Ah,' he says, very quietly. 'They always know.'`, {
      onEnter: [{ morale: -1 }, { ideo: "quiet", n: 1 }],
      choices: [C(`Go on.`, "hub")]
    }),

    thursday: N("fenwick", `'Ah.' He has the grace to laugh. 'I said that. Didn't I? I did.' He taps the baton against his palm, one, two, three. 'It is a thing, ah, a person says in March, with, ah, nothing in front of him. It is not a thing one expects to, to be quoted.' He is silent a while. 'I find, ah, that the Thursday has, has been put in front of me. I'd like to, to say I had a fine speech. I have a pencil.'`, {
      onEnter: [{ set: "fenwick_thursday", val: true }, { xp: 1 }],
      choices: [C(`'A pencil's plenty.'`, "persuade_open", { cond: "!flag.fenwick_persuaded3" }), C(`'Think it over.'`, "hub")]
    }),

    osk: N("fenwick", `His face goes still. 'He, ah, did,' he says. 'Every September. A man in overalls with a tuning fork in his, ah, breast pocket, who, I am quite sure, could not read music. He used to listen to it. He used to put his ear to the, the case and say, "She's flat in the middle, Maestro." And she was.'\n\nHe lays the baton down. 'I heard what, what was done to him. I did not say anything. I am a, a man who says "ah" for a living.' He looks at you, and it is not accusation; it is a plain, tired fact. 'I will sing your song, student. But I do not think a song forgives. I think it, ah, only reminds.'`, {
      onEnter: [{ set: "fenwick_osk3", val: true }, { morale: -1 }, { thought: "th_weight_of_osk" }],
      interjections: [
        I("empathy", 5, `He is not scolding. He is telling you what the song is for.`),
        I("the_grey", 4, `A piano in a school hall, flat in the middle. A man who knew exactly where.`)
      ],
      choices: [C(`'I know. It's a reminder I need.'`, "hub")]
    }),

    ready: N("fenwick", `He takes off his spectacles and cleans them on his tie, a ritual of some years' standing. When they are back on he is somebody else: a head taller, with a plainer voice.\n\n'I will be on the, the podium at, ah, twenty hundred,' he says. 'I will conduct, ah, what is on the page. The children will sing it and I will not look at the Ministry's man. When the, the pedal arrives I will hold it.' He folds the score into his breast pocket, over the heart. 'I would like, ah, if it is not too much, if, if there is a, a way to see them home after.'\n\nYou promise it, which is a thing you do now.`, {
      onEnter: [{ set: "fenwick_ready", val: true }, { set: "fenwick_choir_ready", val: true }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_choir2", text: "Fenwick will conduct the Wake arrangement at twenty hundred. He asks that someone see the children home after." }],
      interjections: [
        I("solidarity", 3, `A choir. A baton. A promise.`),
        I("authority", 4, `A conductor who knows his orders. Everything else is rehearsal.`),
        I("volition", 4, `You promised to see forty children home. Write that on your hand.`)
      ],
      choices: [C(`'Thank you, Maestro.'`, "ready_again")]
    }),

    ready_again: N("fenwick", `Fenwick is on the podium with his back to you, his arms moving in small economical circles: practising the lift. When he hears you he turns, in the ah-ing quiet of a man who has been interrupted in prayer.\n\n'Ah! My, ah, student. The children are at, ah, dinner. They will return at, at six, and I will, ah, iron their collars myself. It has always been, I find, the, the part that calms them.' He holds up a collar-stud. 'One must have a ritual. Even in the, ah, the face of the, the very large thing.'`, {
      interjections: [
        I("empathy", 4, `He's happy, and a little drunk on it. Let him be.`)
      ],
      choices: [X(`'See you at eight.'`)]
    })
  }
},

// =====================================================================
lemmy_d3: {
  title: "Lemmy Tarsk",
  start: [
    { cond: "flag.lemmy_redeemed", node: "ready_again" },
    { cond: "flag.lemmy_informs", node: "fallen" },
    { node: "open" }
  ],
  nodes: {
    open: N("lemmy", `He is ironing his armband. It is on a hotplate-warmed towel on the end of his bunk, and he is going over it with a flat iron as if there were something under the cloth that wanted out. His hair is oiled, his boots shine, his satchel is packed. He looks like a boy dressed for his own execution by a tailor who adores him.\n\n'Citizen-student!' He springs to attention, drops the iron, retrieves it. 'Good morning! Per Regulation Twelve, a morning is good unless otherwise. I am, ah, on duty at nineteen-thirty. At the Hall doors. With the list.' His voice cracks on 'list'. 'I have been told it is a very great honour.'`, {
      interjections: [
        I("empathy", 3, `He has been ironing the same sleeve for twenty minutes. He is not pressing it. He is trying to iron out whatever's underneath.`),
        I("instinct", 4, `The satchel. A folded paper sticks out of the flap, typed, official, with a red stamp. He has not looked at it since you walked in.`, { effects: [{ set: "lemmy_list_seen", val: true }] }),
        I("doublethink", 3, `A list, a door, a good uniform. The best possible life. (We are very envious. We have never been trusted with a list.)`)
      ],
      choices: [C(`'Lemmy. Sit down.'`, "hub")]
    }),

    hub: N("lemmy", `He sits on the very edge of the bunk with his hands on his knees. His knuckles are the colour of boiled eggs.\n\n'Yes, citizen-student? A complaint? A query? I am not permitted social calls but I have been told, by someone, that one should always, ah, be prepared to be flexible.' He looks at the armband on the towel and then very quickly away from it.`, {
      interjections: [
        I("volition", 4, `He will tell you in his own time. The best thing you can do is not look at the satchel.`),
        I("senses", 3, `He smells of starch, iron and the particular cold sweat of a boy who has not slept in the same shirt for two days.`)
      ],
      choices: [
        C(`'What's on the list?'`, "list", { cond: "!flag.lemmy_list" }),
        C(`'Who gave you the list, Lemmy?'`, "who", { cond: "flag.lemmy_list && !flag.lemmy_who" }),
        C(`'Still paying dues to Rhea?'`, "dues", { cond: "!flag.lemmy_dues3" }),
        C(`'Do you remember the ticket you didn't write me?'`, "ticket", { cond: "(flag.lemmy_ticket_off || flag.lemmy_spared) && !flag.lemmy_ticket3" }),
        C(`[Take off the armband you took from him.] 'I don't want this. I want you.'`, "armband", { cond: "(flag.lemmy_armband_worn || has('vanguard_armband')) && !flag.lemmy_redeemed && !flag.lemmy_informs" }),
        C(`'Lemmy. What are you going to do?'`, "choice", { cond: "flag.lemmy_list && flag.lemmy_who" }),
        X(`'Nothing. Good luck with the iron.'`)
      ]
    }),

    list: N("lemmy", `He fishes it out and hands it over with two fingers, like a dead mouse. A typed sheet, three columns, a red stamp. Names, each with a small empty box. At the top: DISTRICT 9 YOUTH COMPLEMENT, JUBILEE ATTENDANCE (PRIORITY). Under it, in capitals: PERSONS OF INTEREST: PLEASE NOTE ARRIVAL, DEMEANOUR AND COMPANIONS.\n\nThe sixth name is Orrin, I. The ninth is Kell, V. The fourteenth is yours. After yours someone has added, in ink, a note: 'Especially if humming.'`, {
      onEnter: [{ set: "lemmy_list", val: true }, { xp: 2 }, { surv: 2 }],
      interjections: [
        I("archive", 3, `Form J-1, 'Attendance and Demeanour'. It is counter-signed by a Ministry stamp I know: the lidded eye. This is not the school's list. This is Voss's.`),
        I("deduction", 4, `"Especially if humming." They know about the Wake tone or something like it. Somebody in the Ministry has been very attentive to what the Undercurrent hums.`),
        I("empathy", 4, `He has been carrying your name in his satchel since Wednesday. He hasn't been able to put it down.`)
      ],
      choices: [C(`Hand it back.`, "hub")]
    }),

    who: N("lemmy", `'The, ah, a gentleman.' He lowers his voice. 'In a grey coat. He came in the morning, when I was doing the corridors, and asked whether I took my duties seriously, and I said Per Regulation Twelve I did, and he said, "Of course you do. You have the eyes for it." And he gave me the list, and a, a sweet.' He looks at his hand. 'A toffee. It was a very good toffee. It's been, ah, in my pocket since. I can't eat it. I can't throw it away.'\n\n'He said it was a chance for a boy like me to be of use.'`, {
      onEnter: [{ set: "lemmy_who", val: true }, { xp: 2 }],
      interjections: [
        I("empathy", 5, `A toffee. They bought him with a toffee, and he hasn't been able to swallow it, and that is the whole of his moral position.`),
        I("instinct", 3, `A grey coat, a kind voice and a sweet. They know their trade.`),
        I("rhetoric", 4, `Use the toffee. A boy who can't eat it is a boy who can still be reached.`)
      ],
      choices: [C(`Stay with him.`, "hub")]
    }),

    dues: N("lemmy", `'The dues.' He flinches. 'Twelve a Thursday.' A short silence. 'I paid. I mean, I took them, from the Hall till. I'm... I don't know what I am. In the Vanguard I'm a sort of treasurer. In the Hall I'm a monitor. In the dormitory I'm...' He opens his hands. 'I am three people. They all wear the same armband.'\n\nHe adds, with the horrid dignity of a child quoting something he's been taught: 'Rhea says a man with three jobs has no time to be anything else.'`, {
      onEnter: [{ set: "lemmy_dues3", val: true }, { xp: 1 }],
      interjections: [
        I("solidarity", 4, `We are three people, too. We are a cook, a girl, a bellringer. It's not a flaw. It's a way of being many.`, { cond: "flag.rhea_turned || flag.rhea_exposed" }),
        I("empathy", 4, `He's too busy to be a person. That's what the Vanguard calls efficiency.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    ticket: N("lemmy", `For a second his face does something unbearable. 'Per Regulation Zero,' he says. 'The Unwritten Mercy Clause.' He opens his notebook and, with a trembling finger, turns it to a page near the back, folded, soft with handling. On it, in his neat hand, is a drawing of a paper dove.\n\n'I keep it,' he says. 'Nobody had ever made me a dove. I am not sure it is within the Regulations. I think it is a Class Three Sentiment.' He closes the book. 'I would like to be somebody who gives people doves.'`, {
      onEnter: [{ set: "lemmy_ticket3", val: true }, { xp: 2 }, { morale: 1 }],
      interjections: [
        I("charm", 4, `A paper dove, kept in a notebook for two days. You are the most important person in this boy's week.`),
        I("empathy", 4, `He doesn't need a speech. He needs the dove back.`)
      ],
      choices: [C(`'You can be.'`, "hub", { effects: [{ ideo: "undercurrent", n: 1 }] })]
    }),

    armband: N("narrator", `You take the red armband off your sleeve, the stiff one he pinned on you with his own trembling hands, and fold it once, twice, and lay it in his lap.\n\n'I wore this because you wanted me to,' you say. 'It was kind of you. It is not me.'\n\nLemmy stares at it as if it were a letter. The iron on the towel ticks as it cools. For a long time nothing in the room moves, and then his shoulders go, slowly, down, and he puts both hands over the armband like somebody over a small bird.`, {
      onEnter: [{ xp: 3 }, { set: "lemmy_armband_returned", val: true }, { take: "vanguard_armband" }],
      interjections: [
        I("empathy", 5, `You gave it back. He wasn't expecting that. He had been waiting to be told he was a good boy and what he got was a boy being given a choice.`),
        I("authority", 4, `Don't say anything else. Let the silence have its say.`)
      ],
      choices: [
        C(`'Whose side are you on, Lemmy?'`, "redeem", { cond: "true" }),
        C(`Let him think.`, "hub")
      ]
    }),

    choice: N("lemmy", `He looks at the toffee on the blanket, at the list, at the armband, at you. His mouth works soundlessly. Eventually he says, in a very small voice:\n\n'If I, ah, if I stand at the door and do as I am, I am a good boy. I have a record. I am promoted, perhaps. They said so. I would be a Hall Warden at seventeen.' He swallows. 'If I, if I don't, then Rhea and the grey coat and the Principal all look at me, and I haven't a, a regulation that says what happens. I looked. I looked all morning. There isn't one.'\n\nHe is not asking you what to do. He is asking whether there is a page for it.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("archive", 4, `There isn't one. There is no regulation for courage. It's the one omission in the whole of the Code, and it is deliberate.`),
        I("rhetoric", 5, `Offer him a page. A tiny, absurd, perfect regulation. He'll take the form before he'll take the courage.`),
        I("authority", 4, `You could order him. He would obey. It would be the worst thing you could do to him.`)
      ],
      choices: [
        K(`[Rhetoric] Draft the missing regulation with him. Regulation Zero, Subsection Nerve.`, "rhetoric", 11, "lemmy_d3_regulation", "redeem", "fall_soft", { cond: "!flag.lemmy_chose" }),
        K(`[Empathy] Tell him what you saw in his dove: that he's already the person he's afraid not to be.`, "empathy", 10, "lemmy_d3_empathy", "redeem", "fall_soft", { cond: "!flag.lemmy_chose" }),
        K(`[Authority] Order him to lose the list. Make it an inspection.`, "authority", 11, "lemmy_d3_order", "coerce", "fall_soft", { cond: "!flag.lemmy_chose" }),
        C(`'It's your call. I won't tell you what to do.' Leave him with it.`, "fall_soft", { cond: "!flag.lemmy_chose" }),
        C(`Back off for now.`, "hub")
      ]
    }),

    redeem: N("lemmy", `He takes a pen from his pocket and opens his notebook to a clean page. He writes at the top, in his best capitals: REGULATION ZERO, SUBSECTION NERVE. Under it, painfully, laboriously, he draws up a clause:\n\n"A citizen who has been given a list of names may, in the exercise of his duties, discover that the ink has run."\n\nHe looks at it. He looks at you. 'That, ah, is a very bad regulation,' he says, in a voice that wobbles halfway up and then does not come down. 'Nobody would ever pass it.' He tears the page out, folds it, and puts it in his pocket, with the toffee. 'I am going to be sick,' he adds, calmly. 'And then I am going to be at the door. With the list. It is a, ah, a very wet list. The ink has run.'`, {
      onEnter: [{ set: "lemmy_chose", val: true }, { set: "lemmy_redeemed", val: true }, { set: "lemmy_ready", val: true }, { task: "task_lemmy", state: "done" }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_lemmy", text: "Lemmy will stand at the Hall door at 19:30 with a list whose ink has run, and let in everyone who needs to come in. He wrote a regulation for it." }],
      interjections: [
        I("solidarity", 3, `A boy who has never had a regulation to be brave under has just written one. We are going to put it on the wall.`),
        I("charm", 3, `A paper dove, a bad regulation and a toffee. That's how a revolution begins: with stationery.`),
        I("authority", 4, `He'll be at the door. He'll hold it. He doesn't know how much that matters, and neither do you, yet.`)
      ],
      choices: [C(`Shake his hand.`, "ready_again")]
    }),

    coerce: N("lemmy", `He goes white, nods, and says 'Yes, citizen-student' in the voice of a boy who has been given an order and, for once, would have liked a choice. 'The list will, ah, be mislaid.' He is already folding it into smaller and smaller squares. 'It's not, ah, my fault if it's mislaid.'\n\nHe does it. He does it quite perfectly, and with such dead eyes that you know it is an order and not a decision, and that the difference will matter at about twenty past seven, when Rhea asks him what he did with it.`, {
      onEnter: [{ set: "lemmy_chose", val: true }, { set: "lemmy_coerced", val: true }, { xp: 2 }, { ideo: "vanguard", n: 1 }, { surv: -3 }],
      interjections: [
        I("empathy", 4, `You made a decision for him. It's the only thing the Union has ever done to him. You've done a kind one, but you have done the same thing.`),
        I("authority", 3, `Efficient. Clean. And you will think of it again.`)
      ],
      choices: [C(`Go.`, "ready_again")]
    }),

    fall_soft: N("lemmy", `He stares at the page for a long time, and then at his hands, and then at the door. 'I can't,' he says in a very quiet voice. 'I, ah, I'd like to. I would like to so very much. But I looked, and there isn't a, there's no page.' He puts the list in his satchel and buckles it, buckle by buckle. 'I'm sorry. I'm so sorry. I'm going to do what's, ah, what's on it. Because it's on it.'\n\nHe stands. He puts the armband on his sleeve. He pins it very carefully, from habit, and then looks at the pin as though it had gone off.`, {
      onEnter: [{ set: "lemmy_chose", val: true }, { set: "lemmy_informs", val: true }, { task: "task_lemmy", state: "failed" }, { surv: 8 }, { morale: -2 }, { thought: "th_good_son" },
        { note: "task_lemmy", text: "Lemmy chose the list. At 19:30 he will stand at the Hall door and tick us off. He is not a bad boy. There was no page." }],
      interjections: [
        I("empathy", 5, `It isn't cowardice. It's that he's never been taught anything else. There was no page, and you did not give him one.`),
        I("volition", 4, `Whatever happens at the door tonight, remember that you were the one who left him alone with it.`)
      ],
      choices: [X(`Go.`)]
    }),

    fallen: N("lemmy", `He is at his post by the dormitory door, boots polished, armband pinned, notebook out. He does not meet your eye. When you pass he says, 'Citizen-student,' in a voice with all the colour taken out, and writes something down.\n\n'It's nothing personal,' he adds, to the notebook. 'It's what I'm for.'`, {
      onEnter: [{ surv: 2 }],
      interjections: [
        I("empathy", 4, `A child standing very straight so as not to fall. There is no scolding him for it. There is only the keeping of him in mind.`),
        I("solidarity", 3, `We've lost one. We would like it noted that we didn't mean to.`)
      ],
      choices: [X(`Go.`)]
    }),

    ready_again: N("lemmy", `Lemmy has taken the iron to his collar and is working it with the ferocity of a person ironing out an old argument. He has the list unfolded on his bunk, face up, and has spilled, with deliberate care, half a mug of tea across the first column. The names are going blue and soft.\n\n'It was an accident,' he tells you, solemnly. 'A, ah, a regulation accident. I am going to be very upset about it.' He holds up the iron. 'Do you think I'm convincing?'`, {
      interjections: [
        I("charm", 3, `Don't lie. He's terrible at it. It is the best thing about him.`),
        I("empathy", 4, `He is happy. He has never been this frightened or this happy.`)
      ],
      choices: [
        C(`'Very convincing. Be sick first.'`, "ready_again", { effects: [{ morale: 1 }] }),
        X(`'See you at the door.'`)
      ]
    })
  }
},

// =====================================================================
osk_d3: {
  title: "Janitor Osk",
  start: [
    { cond: "flag.osk_ready", node: "ready_again" },
    { cond: "has('osk_keys') || flag.osk_keys", node: "keys_after" },
    { node: "open" }
  ],
  nodes: {
    open: N("osk", `He is sweeping the same three feet of cobble he swept on Tuesday and every day before it, with the same slow, heavy, tender strokes, and the bunting hangs above him like a lot of small flags for a very small country. When you come up he stops, leans the broom against his hip, and takes off his cap, which he has never done.\n\n"{name}," he says. "You didn't have me taken." He says it as one says a thing to be sure the sky is still above. "I've been thinking about that for two days. A man isn't used to being spared. It leaves him with nothing to push against."`, {
      interjections: [
        I("empathy", 3, `He is not thanking you. He's telling you what it did to him. There's a difference.`),
        I("the_grey", 4, `A man who has swept the same floor for thirty-one years. He knows every crack by its first name and every footstep by its weight. Today he has put on a clean shirt.`),
        I("solidarity", 3, `We are glad. We are so glad it's him. We are glad, and we're not going to say it, because it's the wrong sort of glad.`)
      ],
      choices: [C(`'What have you been thinking?'`, "hub")]
    }),

    hub: N("osk", `"Ask," says Osk, and takes the broom up again, because his hands cannot be trusted with themselves. "I'm only a janitor. But I've keys to every door in this school and ears for the rest. It's Thursday. A man tends to be forthcoming on a Thursday, if only so as to have said it."`, {
      interjections: [
        I("authority", 4, `This is a man who can open doors. Ask for what you need and then don't thank him: it embarrasses him.`)
      ],
      choices: [
        C(`'Tell me about Tuesday night. What did you really see?'`, "saw", { cond: "!flag.osk_saw3" }),
        C(`'The keys. Could the keys open the tower stair?'`, "keys", { cond: "!has('osk_keys')" }),
        C(`'What did you do before the school?'`, "past", { cond: "!flag.osk_past" }),
        C(`'Marta. You said your wife swept here.'`, "marta", { cond: "flag.osk_past && !flag.osk_marta" }),
        C(`'What if I need every door open at eight?'`, "ready", { cond: "has('osk_keys') && !flag.osk_ready" }),
        X(`'Nothing, Osk. Thank you for the broom.'`)
      ]
    }),

    saw: N("osk", `"Half past one." He looks at the broom. "I said so, on Tuesday, a little. I'll say it properly, because I can. Three pairs of boots in the big doors. The first, in the red-brown coat, walking light. Two behind, carrying something between them that wanted to swing. The smaller one on the left had a bad back for a boy of his years. A hitch on every third step. I know a hitch. I've swept up after a hundred of them."\n\nHe wipes his mouth. "I stood in the stove-room with the door shut and a poker in my hand. And I did not come out."`, {
      onEnter: [{ set: "osk_saw3", val: true }, { xp: 2 }, { thought: "th_weight_of_osk" }],
      interjections: [
        I("deduction", 4, `A smaller boy with a hitch in his step. A bad back in the Vanguard cadets: Jorik Presch, Second Squad. The Cook's boy, if it's him.`, { cond: "flag.bronka_jorik" }),
        I("empathy", 5, `He has been apologising to a poker for two days.`),
        I("volition", 4, `Do not tell him it was the right thing, staying hidden. It was the only thing. But it was not the right thing, and he knows.`)
      ],
      choices: [C(`'You'd have died.'`, "hub"), C(`'You can come out now.'`, "hub", { effects: [{ morale: 1 }, { ideo: "undercurrent", n: 1 }] })]
    }),

    keys: N("osk", `"The stair." He looks away over the roofs, then back. "The Library's tower door has had a bolt on it since the Warden's Jubilee of '78. It's my bolt. I'm the only man who knows it's been oiled." He reaches under his coat and brings out a ring the size of a saucer, eighty-odd keys on a loop of brass, each hand-labelled in capitals. CLASSROOMS (MOST). STORE (HAUNTED). DO NOT.\n\n"They've never been out of my pocket in thirty-one years. Not for the Principal. Not for the Inspectorate." His hand shakes a little. "I've decided to be a person who hands things over."`, {
      onEnter: [{ give: "osk_keys" }, { set: "osk_keys", val: true }, { set: "tower_open", val: true }, { task: "task_osk2", state: "done" }, { xp: 4 }, { morale: 2 }, { thought: "th_chosen_family" },
        { note: "task_osk2", text: "Osk gave me his keys: eighty-odd, labelled. The tower stair, the Principal's cellar, the Hall fuse-room. 'I've decided to be a person who hands things over.'" }],
      interjections: [
        I("authority", 4, `Eighty keys. Every door in the school, including the ones the Principal doesn't know exist. You are, as of this moment, the most dangerous student in District 9.`),
        I("empathy", 5, `He's crying a little and pretending it's the wind.`),
        I("slip", 4, `The cellar. The mixing desk. The Hall fuse-room. Three doors you couldn't have opened yesterday.`)
      ],
      choices: [C(`'Thank you, Osk.'`, "hub")]
    }),

    keys_after: N("osk", `Osk is leaning on his broom by the plinth, staring up at the statue with an expression of patient, unfinished contempt. The garland on its shoulder has slipped, and he has fixed it, twice.\n\n"Thirty-one years of keeping a man tidy," he says, not turning. "And never once told him what I thought. I could say it now, I suppose. But he's only stone. It would be a very lopsided conversation." He turns the broom over. "Ask, {name}. The ring's yours. Ask what else I know."`, {
      interjections: [
        I("the_grey", 3, `The statue's plinth is hollow. He knows. He sounded it once, as a young man, with the broom-handle. It rang like a drum. It is the only joke he has ever told.`)
      ],
      choices: [C(`Ask.`, "hub")]
    }),

    past: N("osk", `"Before?" He thinks. "I was a stoker, on the lake boats. Coal and a shovel. Then I was a bad husband for a while, and then I was a good one, and then I was a widower, and then somebody found me a broom." He sweeps. "There's a dignity in a broom, if you don't look at it for long. It does exactly what it's told, and when it's done the floor is cleaner than it was."\n\nHe looks up. "Do you know what I've swept up in this school? Teeth. Notes. Coupons. Once a wedding ring. Two hundred and eleven Vanguard pins, Union-issue, ah, brass. Nobody ever comes back for the pins."`, {
      onEnter: [{ set: "osk_past", val: true }, { xp: 1 }],
      interjections: [
        I("archive", 3, `Osk Dremm, born in the lake provinces. Employed by the Ministry of Schools these thirty-one years. Pension: pending. Pension: always pending.`),
        I("the_grey", 4, `A broom and a man. Between them, thirty-one years of what the district drops.`)
      ],
      choices: [C(`'Tell me about your wife.'`, "marta"), C(`Go on.`, "hub")]
    }),

    marta: N("osk", `"Marta." The broom goes still. "She swept here before me. Twenty years. She had the same little route: Hall, gym, Library, the stairs. She did it in a headscarf and sang. Nobody ever heard what; it was under her breath. And one night in the spring she went home after the Bell and did not know me."\n\nHe says it very evenly. "Not rudely. She was very polite. She said, 'You are very kind. Are you the janitor?' She's in a home in the east now. They say she is happy. I go every second Sunday." A beat. "Every second Sunday, she asks if I'm the janitor."\n\nHe looks at the broom. "I'd like to have a Thursday where nobody asks."`, {
      onEnter: [{ set: "osk_marta", val: true }, { xp: 3 }, { morale: -1 }, { ideo: "undercurrent", n: 1 }, { thought: "th_good_son" }],
      interjections: [
        I("empathy", 5, `Every second Sunday for a year. A man visiting a wife who asks if he is the janitor. And he says yes.`),
        I("solidarity", 4, `We wish to be the ones who do not forget him. We will be at the door, at eight, with a broom.`)
      ],
      choices: [C(`'I'm sorry.'`, "hub"), C(`'We'll try to change that.'`, "hub", { effects: [{ morale: 1 }] })]
    }),

    ready: N("osk", `He weighs the ring in his hand, and then holds it out to you, and then, thoughtfully, takes it back.\n\n"I'll open them myself," he says. "You'll want every door, and you'll want them quiet, and you'll want a man who knows which one sticks." He nods. "The Hall's fuse-room. The Principal's cellar, where the mixing desk is. The tower stair, which has a loose third step I oiled for forty years and never fixed. At twenty hundred I will be in the Courtyard by the old bell, with the keys in my pocket and a broom in my hand, looking like a man with nothing to do."\n\nHis eyes are very bright. "If you need the bell rung, I'll ring it. I've always wondered what it sounded like when somebody meant it."`, {
      onEnter: [{ set: "osk_ready", val: true }, { xp: 4 }, { morale: 3 },
        { note: "task_jubilee", text: "Osk will be in the Courtyard at eight with every key in the school. He'll open any door and, if asked, ring the old school bell." }],
      interjections: [
        I("authority", 4, `Doors. Doors are all a plan is, in the end: places a person is, and places she is allowed to go.`),
        I("solidarity", 4, `We have a man with a broom and a ring and every door. He'll be exactly where he's needed, and look as if he'd never been anywhere else.`)
      ],
      choices: [C(`'Thank you, Osk.'`, "ready_again")]
    }),

    ready_again: N("osk", `Osk is sweeping. He has swept the same patch of cobble clean so many times that it shines, a little, in the grey light, like a coin that has been through a hundred hands. When you pass he lifts two fingers from the broom handle, a salute so small you could miss it.\n\n"Twenty hundred," he says, to the cobbles. "I'll be here."`, {
      choices: [X(`'So will I.'`)]
    })
  }
},

// =====================================================================
rhea_d3: {
  title: "Rhea Vantage",
  start: [
    { cond: "flag.rhea_ready", node: "ready_again" },
    { cond: "flag.rhea_turned", node: "turned_open" },
    { cond: "flag.rhea_allied || flag.rhea_deal || flag.verdict_good_student", node: "allied_open" },
    { node: "hostile_open" }
  ],
  nodes: {
    turned_open: N("narrator", `She is sitting on the kerb of Karsov Avenue with her boots in the gutter and an orange in her lap, unpeeled. The Jubilee bunting overhead flutters, red and gold, and a ration-queue shuffles by on the far pavement without looking at her. She has taken off the armband. It lies on the kerb beside her, folded square, like something she is trying out the absence of.\n\nShe does not look up. 'You came,' says Rhea Vantage, to the orange. 'I wasn't sure you'd want to see me in daylight.'`, {
      interjections: [
        I("empathy", 3, `She is very, very still. It's the stillness of a person who has set down a weight and is waiting for her arms to understand.`),
        I("senses", 3, `Citrus, faintly. An orange in the Union is a miracle. She gets one a day; nobody knows how. She hasn't peeled this one.`),
        I("the_grey", 4, `The kerb is cold. She has sat on it for an hour. The pavement is trying to be gentle with her and doesn't know how.`)
      ],
      choices: [C(`Sit beside her on the kerb.`, "hub_t")]
    }),

    hub_t: N("rhea", `"I've been trying to work out," she says, "which of the things I did was the worst. I made a list. It's quite short. It's the same thing on every line." She turns the orange over. "It's strange. I always thought remorse would be a feeling. It's a sort of arithmetic."`, {
      interjections: [
        I("volition", 4, `Don't forgive her. Don't punish her. Be in the same place. That's the only thing she's asking.`),
        I("empathy", 4, `She isn't looking for absolution. She wants a witness who won't flinch.`)
      ],
      choices: [
        C(`'What did Ostrov say, at the end?'`, "last_words", { cond: "!flag.rhea_lastwords" }),
        C(`'Jorik Presch. Your cadet with the bad back.'`, "jorik", { cond: "(flag.bronka_jorik || flag.bronka_son_told) && !flag.rhea_jorik" }),
        C(`'The Homes. The children you write to.'`, "homes", { cond: "!flag.rhea_homes" }),
        C(`'What do you want to do tonight?'`, "tonight", { cond: "flag.rhea_lastwords && !flag.rhea_ready" }),
        X(`Sit in silence a while longer.`)
      ]
    }),

    last_words: N("rhea", `"He wasn't afraid." She says it flatly. "He had a rope round his neck by then, and I had the other end, and he looked at me and he said, 'Rhea, you don't have to be a fist.' And then, because I didn't answer: 'I'm not afraid of you. I'm afraid of what they'll tell you tomorrow.'"\n\nShe puts the orange down very carefully on the kerb. "I didn't understand. I thought it was a plea. It was a prediction. Because tomorrow I woke up and I'd been told I'd done something necessary, and it was true, and it was a lie, and I couldn't tell the two apart. He knew. He knew exactly what the Bell would do to me, and he said it to my face, and I pulled."`, {
      onEnter: [{ set: "rhea_lastwords", val: true }, { xp: 3 }, { morale: -1 }, { thought: "th_loyal_rhea" }],
      interjections: [
        I("empathy", 5, `Do you see it? He wasn't pleading. He was trying to warn her. The last act of the man she killed was to tell her what would be done to her.`),
        I("grit", 5, `Stay. Stay where you are. Don't look at the road.`),
        I("rote", 3, `SHE DOES NOT HAVE TO BE A FIST. (The ninth Virtue: DISCIPLINE. The tenth, unprinted: DOUBT.)`)
      ],
      choices: [C(`Say nothing. Stay.`, "hub_t")]
    }),

    jorik: N("rhea", `"Jorik." Her head comes up. "Second Squad. A good voice for a command, and a back like a broken umbrella. I picked him because he was always last in the line and always the first to stay behind and carry whatever had been left. I needed one who'd carry." She flinches, saying it. "He did. He carried the Commissar's feet. All the way across the Hall and up the steps and to the hoop, and he didn't say a word, and he didn't look. And when it was over he asked if he could go home and wash."`, {
      onEnter: [{ set: "rhea_jorik", val: true }, { xp: 2 }, { thought: "th_good_son" }],
      interjections: [
        I("empathy", 5, `She chose him because he'd carry. She knows exactly what she did. She is telling you in the plainest words she has.`),
        I("solidarity", 4, `His mother is a cook who writes notes in bread. There's a loaf with his name on it, somewhere. Think about that.`, { cond: "flag.bronka_son_told" })
      ],
      choices: [
        C(`'Will you tell him?'`, "jorik_tell"),
        C(`'Leave him out of it.'`, "hub_t")
      ]
    }),

    jorik_tell: N("rhea", `"I will." She stares at her knees. "Before eight. It's the only thing I can do that is of use to him. Not the Vanguard's way. Not an order. I'll go and find him, and I'll say, 'It was me. You carried because I told you to. It wasn't a crime to carry. It was a crime to ask.'" She takes a breath that she has plainly been saving up. "He'll hate me. That's all right. It's rather the point."`, {
      onEnter: [{ set: "rhea_will_tell_jorik", val: true }, { xp: 2 }, { morale: 1 }],
      choices: [C(`Stay with her.`, "hub_t")]
    }),

    homes: N("rhea", `"The Homes." Something loosens. "Sixty-two children in the Vanguard Home on Cinder Street. Between four and eleven. I write to them. Every Sunday, in pencil, so they can erase the spelling. I send my rations, a coupon each, an orange when I can. They call me Big Sister. It's the only name I've ever answered to without thinking."\n\nShe laughs: a small, awful, tender sound. "Do you know what I tell them? 'Be good. The Warden hears you.' It's what I was told. I never knew it was a threat until yesterday. I thought it was comfort."\n\nShe looks at you. "On Friday I'll write the same letter. And it will mean something else. And I won't know why."`, {
      onEnter: [{ set: "rhea_homes", val: true }, { xp: 3 }, { thought: "th_loyal_rhea" }, { note: "task_rhea2", text: "Rhea writes to sixty-two children in the Vanguard Home on Cinder Street. 'Be good. The Warden hears you.' She thought it was comfort." }],
      interjections: [
        I("empathy", 5, `Sixty-two children and a big sister who loves them with the only words she was given. It's not an excuse. It is the shape of the harm.`),
        I("archive", 4, `Cinder Street Home for Children of the Hunger Winter. Founded under the Vanguard Scheme. Capacity: 40. Occupancy: 62. A statistic with a face.`)
      ],
      choices: [C(`'We'll keep them in mind.'`, "hub_t")]
    }),

    tonight: N("rhea", `"Tonight." She picks up the orange and weighs it. "At eight the district forgets, and I forget with it, and in the morning I'm clean. A girl with a pin and a purpose. It would be so easy to let it. It's the thing I'm best at."\n\nShe turns and looks you full in the face for the first time. "I'd like to not be clean."\n\n"I can do two things. I can stand up in front of the Hall and say what I did, in a clear voice, to the whole district, and they'll take me away, and it will be on the record that I said it. Or I can live. And carry it. And every morning wake up and read it off a card in my own pocket." Her mouth twists. "I don't know which one's braver. I think the second. I'm afraid it's the first."`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("volition", 5, `Neither is the brave one. Both are expensive. Let her pick, and then hold her to it.`),
        I("rhetoric", 4, `A public confession is a gift to the audience. A private one is a gift to the person. She is offering you both. Think about which you need.`),
        I("authority", 4, `She would do it. She would stand there and say it, and she would not flinch. Know that, whichever you choose.`)
      ],
      choices: [
        C(`'Live. Carry it. I'll write it on a card for you.'`, "ready_live"),
        C(`'Stand up and say it. The district needs to hear it.'`, "ready_public"),
        C(`'I can't choose for you.'`, "hub_t")
      ]
    }),

    ready_live: N("rhea", `She nods slowly. She takes a pencil stub from her breast pocket and the back of a ration form and writes, in a hand like a ruler: I KILLED OSTROV DANE ON TUESDAY AT 01:40. HE SAID I DID NOT HAVE TO BE A FIST. I DID NOT LISTEN. READ THIS EVERY MORNING. SHE SAID IT WAS NECESSARY. IT WAS NOT.\n\nShe folds it in four and tucks it into the lining of her cap. 'And Second Squad,' she says. 'At eight I'll have them stand at the Hall doors. Not against anyone. With. Wearing their pins and holding the doors. If anyone wants in, they'll have to go through the Vanguard. And the Vanguard, tonight, will be extremely hard of hearing.'\n\nShe holds out the orange. 'Peel it. Please. I never let anyone.'`, {
      onEnter: [{ set: "rhea_ready", val: true }, { set: "rhea_to_live", val: true }, { task: "task_rhea2", state: "done" }, { xp: 5 }, { morale: 3 }, { thought: "th_good_son" }, { ideo: "undercurrent", n: 1 },
        { note: "task_rhea2", text: "Rhea has written a card for her own pocket: she will carry what she did. At eight, Second Squad will hold the Hall doors with us, not against." }],
      interjections: [
        I("empathy", 5, `She asked you to peel it. It's the closest thing to a hug she has.`),
        I("solidarity", 4, `We hold the door with the squad that did the killing. It is not forgiveness. It is something harder and more useful.`),
        I("authority", 4, `A card in a cap. A squad at the door. A girl who has chosen to keep it. It's what an officer does after a battle.`)
      ],
      choices: [C(`Peel the orange.`, "orange")]
    }),

    ready_public: N("rhea", `"All right." She says it as if she'd been handed a sentence. "I'll say it. At the stage, after the Anthem. In front of the choir and the Principal and whoever is listening." She sets her cap straight. "And then I'll go with whoever comes. It's not a martyrdom. It's a deposition. I want it entered."\n\nShe stands, a straight small figure in red-brown, and in the half-second before she turns away you see how much she is afraid and how much she is not going to let it show. "Second Squad will hold the doors until I'm done. After that they can decide."`, {
      onEnter: [{ set: "rhea_ready", val: true }, { set: "rhea_confess_public", val: true }, { task: "task_rhea2", state: "done" }, { xp: 4 }, { morale: 1 }, { surv: 4 }, { ideo: "undercurrent", n: 1 },
        { note: "task_rhea2", text: "Rhea will confess on the Hall stage after the Anthem, before the whole district, and go with whoever comes. Second Squad will hold the doors until she's done." }],
      interjections: [
        I("adrenaline", 3, `YES. A confession into a live mic. It's the loudest thing in the district and it will cost her everything.`),
        I("empathy", 5, `You asked a girl to give up a future so a crowd could hear. Hold the thought. You'll want it later.`)
      ],
      choices: [C(`'Thank you.'`, "ready_again")]
    }),

    orange: N("narrator", `You peel it. The skin comes away in one slow spiral under your thumbs, the way hers does, a continuous ribbon of bright oil, and the smell goes through the street like a small bell. A ration-queue woman turns her head in wonder and then, politely, away.\n\nRhea takes the first segment and eats it with her eyes shut. She does not say anything at all. When she has finished she takes the peel from your hand, rolls it, and puts it in her pocket with the card, as if it were a thing worth keeping.`, {
      onEnter: [{ xp: 2 }, { morale: 2 }],
      choices: [C(`Stand.`, "ready_again")]
    }),

    allied_open: N("rhea", `"There you are." She is at the barrier by the ration queue, uniform pressed, armband straight, and the whole length of the avenue seems to be arranged around the fact of her. She is smiling, very slightly. It is not the smile of Tuesday. It is the smile of a person who has been proved right and is trying not to look pleased.\n\n"I'm told you've been very helpful," she says. "The Inspector asked after you. The Principal's delighted. There's an honour-guard formation at the Relay at nineteen-thirty and I've a place in it that's got your name on it. A front-rank place. You'd stand beside me."`, {
      interjections: [
        I("doublethink", 3, `A place in the front rank! Honour! A seat at the table of the Union! We do so want to be in the front rank. (We have always known we were meant for better than a mop.)`),
        I("empathy", 4, `She means it. She is offering you the best thing she has. That is what's terrible.`),
        I("instinct", 4, `The smile is a hair too fixed. Behind it she has doubts of her own. Poke, and see.`)
      ],
      choices: [C(`'Tell me about the formation.'`, "allied_hub")]
    }),

    allied_hub: N("rhea", `"Nineteen-thirty. The Relay gate. Forty cadets, ranked by height, and a banner." She straightens an armband that does not need it. "When the first stroke of the Bell comes, we present arms. The Inspector says it'll be broadcast. It's the biggest thing the Vanguard has ever been given to do."`, {
      choices: [
        C(`'I'll stand beside you.'`, "allied_armband", { cond: "!flag.rhea_expects_you" }),
        K(`[Empathy] 'Rhea. Do you ever wonder what's in the glue?'`, "empathy", 12, "rhea_d3_doubt_empathy", "allied_doubt_pass", "allied_doubt_fail", { w: 1, cond: "!flag.rhea_doubt3" }),
        K(`[Dialectics] Find the contradiction in what she believes. Say it out loud.`, "dialectics", 13, "rhea_d3_doubt_dialectics", "allied_doubt_pass", "allied_doubt_fail", { w: 1, cond: "!flag.rhea_doubt3" }),
        C(`'What happened to Osk?'`, "allied_osk", { cond: "flag.osk_scapegoat && !flag.rhea_osk3" }),
        X(`'I'll think about it.'`)
      ]
    }),

    allied_armband: N("rhea", `"Good." She takes a spare armband from her belt and fastens it on your sleeve herself, with a quick, practised hand. "I knew you'd see sense." Her eyes are bright. "I'm going to be so proud of you tonight."\n\nThe cloth is stiff as a board, and a little warm, and it does something to your shoulders. You feel the whole avenue tilt a degree toward you.`, {
      onEnter: [{ set: "rhea_expects_you", val: true }, { give: "vanguard_armband" }, { ideo: "vanguard", n: 2 }, { surv: -5 }, { xp: 1 }],
      interjections: [
        I("doublethink", 3, `Doesn't it feel right? Doesn't it feel exactly right? (Say it. It's easier than not.)`),
        I("volition", 4, `You can take it off. You're allowed to take it off. Remember that you put it on with your eyes open.`)
      ],
      choices: [C(`Straighten your shoulders.`, "allied_hub")]
    }),

    allied_doubt_pass: N("rhea", `The smile stops. It doesn't fall; it stops, like a clock. For a moment she looks at the ration queue, the shuffling shawls, a woman in a headscarf trying to keep a small boy from the gutter.\n\n"Glue," she says. "From the wallpaper. The whole street. I was seven. My mother put me on her knee and said 'It's sweet, it's only flour,' and she ate the first piece to show me." She laughs, and it is not a laugh. "She was lying. I knew she was lying. And I ate it, because she wanted me to. And it was the kindest thing she ever did."\n\nShe looks at you. Her face is white and open. "Ostrov told me the Bell was glue. I thought he was a liar."`, {
      onEnter: [{ set: "rhea_doubt3", val: true }, { set: "rhea_turned", val: true }, { xp: 4 }, { morale: 1 }, { thought: "th_loyal_rhea" },
        { note: "task_rhea2", text: "Rhea heard the glue, and for a second there was no Vanguard in her face. 'Ostrov told me the Bell was glue. I thought he was a liar.' She has turned." }],
      interjections: [
        I("empathy", 5, `She's falling. Be there. Don't catch her. Just be there.`),
        I("dialectics", 4, `The argument is not that she is wrong. It's that she has been so right for so long that she forgot to be sorry.`)
      ],
      choices: [C(`Take her armband off. Gently.`, "turned_open")]
    }),

    allied_doubt_fail: N("rhea", `"I don't know what you mean." It comes out flat and quick. Her eyes close for a fraction of a second and open again, a degree harder, like a door shut and then bolted. "You're tired. We all are. You'll be better after the Jubilee." She does the thing with her sleeve. "Nineteen-thirty, front rank. Don't be late."\n\nShe turns away. You have said something that went in, and she's walled it off with a very good mortar. It will come out, one day, like a splinter. Not today.`, {
      onEnter: [{ set: "rhea_doubt3", val: true }, { surv: 3 }],
      choices: [X(`Go.`)]
    }),

    allied_osk: N("rhea", `"The janitor." She waves it off. "He's been processed. He'll get a short sentence, and a long rest, and a lesson in respecting boundaries." She looks at you steadily. "It was a good plan. It was your plan, in the end. I only suggested it."\n\nSomething in her eye flickers. "He did see us, you know. He was in the stove-room. I knew he was there. I let him hear."\n\nShe says it with a strange, hungry look, as if she would like you to tell her it was kind.`, {
      onEnter: [{ set: "rhea_osk3", val: true }, { xp: 2 }, { thought: "th_weight_of_osk" }],
      interjections: [
        I("empathy", 5, `She let him hear. She wanted someone, anyone, to know. It's what she's been trying to do the whole time.`),
        I("grit", 4, `You made a deal with somebody who wanted to be caught. You do not have to forgive yourself for it.`)
      ],
      choices: [C(`Back.`, "allied_hub")]
    }),

    hostile_open: N("narrator", `She is at the barrier at the head of the ration queue, ramrod straight, with a clipboard and a face like a lacquered box. A cordon of cadets stands behind her in the red-brown. The loudspeaker on the third lamp-post is playing the Jubilee March, a bar behind itself, and she is keeping the beat with one finger on the clip.\n\nWhen she sees you she does not smile and does not frown. She makes a small mark on the clipboard. "Thursday," says Rhea Vantage. "I told you that you had until the Bell. I'm told that's tonight. I wonder what you'll do with the last ten hours."`, {
      interjections: [
        I("empathy", 3, `Underneath the lacquer she looks tired. Not afraid. Tired, the way a very good machine is tired just before the part wears through.`),
        I("authority", 4, `SHE IS ON DUTY. SHE IS ARMED WITH FORTY CADETS AND A CLIPBOARD. DO NOT DUEL HER HERE.`),
        I("instinct", 4, `She has a card in her cap. A very small corner of paper, folded. You don't know why you notice. You do.`, { cond: "flag.rhea_exposed" })
      ],
      choices: [
        C(`'Rhea. I'd like to talk.'`, "hostile_talk"),
        C(`Walk on.`, "hostile_leave")
      ]
    }),

    hostile_leave: N("narrator", `You walk on. She watches you go with an expression you cannot read, and makes another small mark on the clipboard.`, {
      onEnter: [{ surv: 2 }],
      choices: [X(`Go.`)]
    }),

    hostile_talk: N("rhea", `"Talk." She looks at the clock on the Relay. "I have six minutes. The Inspector is very precise." She lowers her voice. "I've been told to detain persons of interest at nineteen-thirty. You're on the list. It's alphabetical, so you're quite near the end, which is a mercy."\n\nHer eyes meet yours. "I don't enjoy it. I want you to know. I think the world is better with fewer people in it who think they know best. I include myself."`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("dialectics", 4, `"The world is better with fewer people who think they know best, and I am one of them." That's a contradiction in a hat. Pull the thread.`),
        I("empathy", 4, `She has said the most honest thing she's ever said to you, and she hasn't noticed.`)
      ],
      choices: [
        K(`[Dialectics] 'If you include yourself, then you have to stop. Say what that costs.'`, "dialectics", 14, "rhea_d3_hostile_dial", "hostile_pass", "hostile_fail", { w: 1 }),
        K(`[Empathy] Say 'Big Sister' and watch her face.`, "empathy", 13, "rhea_d3_hostile_emp", "hostile_pass", "hostile_fail", { w: 1, cond: "flag.rhea_homes || flag.rhea_exposed" }),
        C(`'I'll be in the Hall at eight. Come and arrest me there.'`, "hostile_defy"),
        C(`'Forget it.'`, "hostile_leave")
      ]
    }),

    hostile_pass: N("rhea", `Her pen stops. The clipboard lowers by an inch. For a long, long moment she looks like a girl standing at the edge of a swimming-pool. Then, in a voice you have never heard, she says: "Say that again."\n\nYou do. She listens. Her jaw works. When she speaks she is not looking at you, but at the Relay, at the thin red aerial and the sky behind it.\n\n"Ostrov said the same thing." She closes the clipboard. "I'll have to take off the armband for this. And I'll want to sit down."`, {
      onEnter: [{ set: "rhea_turned", val: true }, { xp: 5 }, { morale: 2 }, { thought: "th_loyal_rhea" },
        { note: "task_rhea2", text: "Rhea heard her own sentence handed back to her and stopped. She is taking off the armband. She wants to sit down." }],
      choices: [C(`Sit with her.`, "turned_open")]
    }),

    hostile_fail: N("rhea", `"You're very clever," says Rhea, and makes a small mark on the clipboard. "It's a pity. I really did like you." She does not raise her voice. "Six minutes. I'd suggest you use them to go somewhere quiet."\n\nShe turns away. You have said something, and she has heard it, and has put it in a drawer marked Later. There may not be a Later.`, {
      onEnter: [{ surv: 6 }, { set: "rhea_hostile", val: true }],
      choices: [X(`Go.`)]
    }),

    hostile_defy: N("rhea", `A brief, hard smile. "The Hall. At eight." She writes it on the clipboard. "I'll be there." A pause. "I'd rather you weren't."\n\nShe says it without malice, almost with tenderness, the way a doctor says it to a patient who has refused the treatment. She does not touch her whistle. She turns back to her queue.`, {
      onEnter: [{ set: "rhea_hostile", val: true }, { surv: 8 }, { xp: 1 }],
      choices: [X(`Go.`)]
    }),

    ready_again: N("rhea", `Rhea is not at the barrier. She is at the far end of the avenue, standing at ease with her squad in a ragged line, giving what looks like a stern lecture and is, you realise as you pass, a long list of names: each cadet, one by one, saying something small aloud: a village, a mother, a favourite food. A boy with a bad back says 'bread' in a voice you can hear from here.\n\nShe sees you. She does not stop what she is doing. She lifts two fingers to the peak of her cap, and goes on.`, {
      interjections: [
        I("empathy", 4, `She is teaching them to say who they are. It's the first lesson the Vanguard never taught.`),
        I("solidarity", 4, `We hold the doors with them. It is the strangest and best thing we've ever planned.`)
      ],
      choices: [X(`Go.`)]
    })
  }
},

// =====================================================================
marr_d3: {
  title: "Principal Odalys Marr",
  start: [
    { cond: "flag.marr_ready", node: "ready_again" },
    { cond: "flag.marr_turned", node: "turned_open" },
    { node: "cold_open" }
  ],
  nodes: {
    cold_open: N("marr", `"Ah. The student who looks. Sit, if you must." Principal Marr does not rise. The office is the colour of a cold pea, the desk is clear but for a stack of printed forms, three pens in a row, and a seal. The Warden's portrait looks down from the wall with the benign, listening expression of a man who is paid to.\n\n"It is the Jubilee," she says. "Every child in the district will sign the Pledge before the Bell. 'I will remember this day as one of gladness.' It is a modest request. It is a request, I am told, that history will find entirely reasonable." She slides a form across the blotter. "I have signed four hundred and six this morning. My wrist is quite tired."`, {
      interjections: [
        I("empathy", 3, `Her hand is cramping. She hasn't noticed. She has been signing for six hours and each signature is a very small neat apology.`),
        I("senses", 4, `A locked drawer, bottom left. A key on a ribbon at her throat. Beside the blotter a pencil, sharpened at both ends: a woman who has stopped trusting the one.`, { effects: [{ set: "marr_drawer_seen", val: true }] }),
        I("doublethink", 3, `A pledge! A modest request! We love a form. We should sign it, shouldn't we? It would be the simplest, nicest thing.`)
      ],
      choices: [C(`'Principal.'`, "hub")]
    }),

    hub: N("marr", `"Do go on." She has put her glasses back on, and behind them her eyes are two small clean rooms. "I find that students always come to me with something they would rather say to a window."`, {
      interjections: [
        I("volition", 4, `She is tired. Do not take the tiredness for weakness. A tired Marr is merely a Marr who has stopped pretending to have time.`)
      ],
      choices: [
        C(`'The Pledge. What happens if I don't sign?'`, "pledge", { cond: "!flag.marr_pledge" }),
        C(`'Inspector Voss. What does he want from you?'`, "voss", { cond: "!flag.marr_voss3" }),
        C(`'The drawer. The one with the key on the ribbon.'`, "drawer", { cond: "flag.marr_drawer_seen && !flag.marr_drawer_open" }),
        C(`'You signed the muzzle on the Great Bell. I saw the tag.'`, "muzzle", { cond: "flag.tower_marr_signed && !flag.marr_muzzle" }),
        C(`'Tonight. Will you be at the Hall?'`, "ready_cold", { cond: "flag.marr_drawer_open && !flag.marr_ready" }),
        X(`'Nothing, Principal.'`)
      ]
    }),

    pledge: N("marr", `"What happens." She takes off her glasses and polishes them. "In practice? Nothing. A mark. A small neat mark in a column. In theory, a student who does not pledge to remember the Jubilee as glad is a student who has declared an intention to remember it otherwise, which is, you will agree, an unusual intention." She puts the glasses back. "It is not a threat. I am describing a mechanism."\n\nShe nudges the form an inch toward you. "I would prefer you signed. I would prefer a great many things."`, {
      onEnter: [{ set: "marr_pledge", val: true }, { xp: 1 }],
      interjections: [
        I("archive", 4, `The Jubilee Pledge is a legal instrument, Annex C of the Quiet Hours Act. It is also, if you read the small print, an advance waiver of the right to recall the event.`),
        I("dialectics", 4, `"Remember this day as gladness." A person cannot be required to remember gladness. They can only be required to forget everything else.`)
      ],
      choices: [
        C(`Sign it.`, "pledge_sign"),
        C(`Slide it back, unsigned.`, "pledge_refuse")
      ]
    }),

    pledge_sign: N("marr", `You sign. She takes it and blots it with the soft pad, and her face does something swift and complicated that is gone before you can name it.\n\n"Thank you," she says, a shade too carefully. "That is... most conscientious." She files it. Her hand, as it passes over the pile, pauses; she looks as if she might say something. She does not.`, {
      onEnter: [{ ideo: "quiet", n: 1 }, { surv: -8 }, { morale: -1 }, { set: "marr_signed_pledge", val: true }],
      interjections: [
        I("empathy", 5, `She didn't want you to sign. She's relieved you did, and ashamed of the relief. It's a very full face.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    pledge_refuse: N("marr", `She regards the form lying between you and does not take it back. For a long moment nothing happens.\n\n"Ah," she says. "I see. Yes." The faintest crease between her brows. "I have signed four hundred and six. You are, I believe, the first to refuse. I'll note it as 'deferred'." She writes it. It is a very kind word. It is the word that will be used at your hearing.`, {
      onEnter: [{ ideo: "undercurrent", n: 1 }, { surv: 5 }, { xp: 1 }],
      choices: [C(`Go on.`, "hub")]
    }),

    voss: N("marr", `"The Inspector." She says it like a weather front. "He is, I understand, my supervisor, in the sense that the tide is the supervisor of the harbour. He arrives at seven, to audit the Hall. A sound-check at six-thirty, the choir, the microphone, the patch. He is meticulous. He was, I'm told, once rather a gifted man."\n\nShe taps a pen on the blotter. "I'll tell you something, since you ask so nicely. He has never once raised his voice to me. That is not a courtesy. It's the way a tailor measures a dead man."`, {
      onEnter: [{ set: "marr_voss3", val: true }, { set: "marr_gave_schedule", val: true }, { xp: 2 }, { note: "task_jubilee", text: "Marr says Voss audits the Hall at seven: choir, microphone and patch. Sound-check at six-thirty." }],
      interjections: [
        I("rhetoric", 4, `A tailor measures a dead man. She's very good. She is also, in her own way, saying: I know what's in the suit.`),
        I("instinct", 4, `She's warning you. Under the polish, she's telling you where the Inspector will be and when. She doesn't know she is.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    muzzle: N("marr", `Her pen stops. "The bell." It comes out softly. "Yes. I signed that. It's a form, 'Control of Striking, District Bells'. It came by courier on Tuesday with a note saying it was a courtesy. I read it twice. And then I signed it, in this chair, with that pen." She looks at the pen. "It is such a very small thing, a pen. It took no effort at all."\n\nShe replaces it very precisely in the row. "I have been signing things for nine years, student. I have never once been asked whether I minded. It would be a great relief to be asked."`, {
      onEnter: [{ set: "marr_muzzle", val: true }, { xp: 2 }],
      interjections: [
        I("empathy", 5, `"It would be a great relief to be asked." She has just told you what she wants. It is the most naked sentence she has ever said.`),
        I("volition", 4, `Ask. Not as an interrogator. Ask as a person. Ask whether she minds.`)
      ],
      choices: [
        C(`'Do you mind, Principal?'`, "mind"),
        C(`Leave it.`, "hub")
      ]
    }),

    mind: N("marr", `The office is entirely silent. A pigeon outside the window thinks better of it. The clock on the wall clears its throat and doesn't go on.\n\n"Yes," says Principal Marr. It comes out as a single dry syllable, like a leaf. "Yes. I mind."\n\nShe sits with her hands flat on the blotter, looking at them, as if they had belonged to someone else and been returned. Then, without looking up, she reaches for the ribbon at her throat and draws it over her head. On the end of it hangs a small brass key.`, {
      onEnter: [{ set: "marr_minded", val: true }, { xp: 3 }, { morale: 1 }],
      interjections: [
        I("empathy", 5, `Look at what she's doing. She's decided. She doesn't know it yet; her hands do.`)
      ],
      choices: [C(`Take the key.`, "drawer_open", { effects: [{ set: "marr_drawer_open", val: true }] })]
    }),

    drawer: N("marr", `Her hand goes to the ribbon at her throat before she can stop it. "That," she says. "That is a private drawer. Principals are permitted one." Her voice has dropped by a very small fraction. "There is nothing in it you will find useful."\n\nShe is lying. She does it well, and for the first time since you walked in, she does not meet your eye.`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("instinct", 4, `She is terrified of that drawer. It isn't a secret she's hiding. It's one she cannot bear to open herself.`),
        I("empathy", 4, `Whatever's in it has her handwriting on it. It is the saddest kind of evidence: the kind you wrote yourself.`)
      ],
      choices: [
        K(`[Empathy] 'You don't have to open it. You only have to stop locking it.'`, "empathy", 12, "marr_d3_drawer_emp", "drawer_open", "drawer_fail", { w: 1 }),
        K(`[Archive] Quote her a regulation: private papers must be inventoried at the end of every term.`, "archive", 11, "marr_d3_drawer_archive", "drawer_open", "drawer_fail", { w: 1 }),
        K(`[Rhetoric] 'What would you say to the woman who put it there?'`, "rhetoric", 12, "marr_d3_drawer_rhet", "drawer_open", "drawer_fail", { w: 1 }),
        C(`Leave it.`, "hub")
      ]
    }),

    drawer_fail: N("marr", `"That will do." The cold comes down like a blind. "A private drawer is a private drawer. I think we have, ah, exhausted the subject." She picks up the pen, and her hand is not quite steady. "I am very busy. You will excuse me."\n\nIt is not a dismissal. It is a plea.`, {
      onEnter: [{ surv: 3 }],
      choices: [C(`Back off.`, "hub")]
    }),

    drawer_open: N("narrator", `The key turns easily. It has been oiled. Inside, tied in tidy bundles with black ribbon, are letters: dozens, perhaps a hundred, each in a cream envelope with the same four words on the front, in a small, neat, upright hand: DEAR ODALYS. PLEASE READ.\n\nEvery one of them is sealed.`, {
      onEnter: [{ set: "marr_drawer_open", val: true }, { xp: 2 }, { thought: "th_double_agent" }],
      interjections: [
        I("archive", 4, `Nine years of Thursdays. Fifty-two a year, less holidays. A hundred and sixteen letters. Not one opened.`),
        I("empathy", 5, `Every Thursday she writes to herself, and every Friday she forgets she did. The Bell takes the letter with the rest.`),
        I("the_grey", 4, `A drawer in an office in a school. A hundred and sixteen small attempts to remember. The paper is soft where a thumb has gone over the seals, and not once broken them.`)
      ],
      choices: [C(`'Why have you never read them?'`, "why_unread")]
    }),

    why_unread: N("marr", `"I don't know that they exist." She says it quietly, to the open drawer. "Not on a Friday. On a Friday I find the key on a ribbon round my neck and I think it's a keepsake. I find a drawer I never open, and I think it's a drawer. On Thursday, at about five, I find the pen in my hand and a sheet of cream paper in front of me and a very strong feeling that there is something to be said. I write it. I seal it. I lock it. And then the Bell comes, and by morning I have never written a thing in my life."\n\nShe looks up. "I am the longest-serving rebel in the district, student. I have never once remembered it."`, {
      onEnter: [{ xp: 3 }, { morale: -1 }],
      interjections: [
        I("empathy", 5, `Nine years of resistance, forgotten each night. It is the most heroic and the most wasted thing you've ever heard of.`),
        I("rote", 3, `THE LONGEST-SERVING REBEL IN THE DISTRICT. (This is not in the Orthodoxy. We think it should be.)`)
      ],
      choices: [
        C(`'Read one. Now. Out loud.'`, "letters"),
        C(`'You don't have to.'`, "hub")
      ]
    }),

    letters: N("narrator", `She chooses one from the top of the pile. The date on the envelope is last Thursday. She breaks the seal, and the sound is very loud in the green room, like a small bone.\n\nThe letter is one page. She reads it aloud in her precise, even Principal's voice, and as she reads, the voice begins, very slightly, to fail.\n\n"Dear Odalys. Don't. They will tell you it is for the children. It is for the tape. You were a teacher once; you taught a boy called Ostrov to read the small print. He is going to be killed in the gym on Tuesday and you are going to pass on the name of the room. Don't. I am sorry. I have written this every Thursday for nine years and I know that you will not read it. Please read it. Please. Odalys."`, {
      onEnter: [{ set: "marr_letters3", val: true }, { xp: 3 }, { morale: -2 }, { thought: "th_last_assembly" }],
      interjections: [
        I("empathy", 5, `Last Thursday: a full week before the gym. She knew the order was coming, and wrote to herself about it, and the Bell took the warning with the rest. She always knows. She just cannot hold it overnight.`),
        I("deduction", 5, `"You are going to pass on the name of the room." So the order came to her, and she relayed it. She is the hinge on which Ostrov's door swung.`),
        I("grit", 5, `She just read aloud the fact of her own part in a man's death, in her own handwriting, on the wrong day. Do not look at the window. Look at her.`)
      ],
      choices: [C(`Stay with her.`, "turn")]
    }),

    turn: N("marr", `She folds it along its creases and sets it on the blotter, squared to the edge. When she lifts her head she is a different shape: smaller, plainer, and more upright.\n\n"I passed on the name of the room," she says. "I signed the order for the gym lights to be switched off at one-thirty. I told myself it was an administrative matter." She takes off her glasses. "I have been very good at being useful. I would like, now, to be something else for a few hours, before the Bell tidies it up."\n\nShe opens a second drawer, takes out a stamped card, a laminated pass with a photograph of someone almost you, and lays it on the blotter. "The Relay. Visitor class. It's for 'maintenance, inspection or lunch'. I find that I would like very much to arrange a lunch."`, {
      onEnter: [{ set: "marr_turned", val: true }, { give: "relay_pass" }, { set: "relay_access", val: true }, { task: "task_marr", state: "done" }, { xp: 5 }, { morale: 2 }, { surv: -4 },
        { note: "task_marr", text: "Marr read her own letter aloud and turned. She gave me a Relay visitor pass. She would like to arrange a lunch." }],
      interjections: [
        I("authority", 4, `A Principal turned. That is not a school, it is a castle with a door and a key. Be careful of the weight.`),
        I("solidarity", 4, `We would like to say welcome. We would like to say it very gently, and then give her something to do.`)
      ],
      choices: [C(`'Thank you, Principal.'`, "ostrov_letter")]
    }),

    turned_open: N("narrator", `The Warden's portrait has been taken down. It leans against the wall by the window, face to the plaster, and where it hung there is a pale rectangle on the green paint, perfectly clean. On the desk are three pens, and for the first time they are not in a row.\n\nPrincipal Marr is standing at the window with a cigarette, which she is not smoking: she is holding it, a long white thing between two fingers, and watching the Courtyard with the expression of a woman who is trying to remember the shape of the sky.\n\n"Student," she says. "I'm told the Jubilee is in eleven hours. I should like to be useful."`, {
      interjections: [
        I("empathy", 3, `She isn't smoking it. She's holding it the way you'd hold a hand.`),
        I("senses", 3, `Dust, a little. The room is airier. Without the portrait the microphone's absence is a draught.`),
        I("doublethink", 3, `Oh dear. Oh no. We are going to miss the portrait. It was so very attentive.`)
      ],
      choices: [C(`'There's something you wanted to give me.'`, "turned_hub")]
    }),

    turned_hub: N("marr", `"Several things," says Principal Marr. She turns from the window. She looks remarkably well, for a woman who has, within two days, dismantled the whole of her profession. "Ask."`, {
      choices: [
        C(`'The letter you never sent.'`, "ostrov_letter", { cond: "!flag.marr_letter_given" }),
        C(`'Read me one of the Thursday letters.'`, "letters", { cond: "!flag.marr_letters3 && flag.marr_drawer_open" }),
        C(`'What will you do at eight?'`, "ready_cold", { cond: "!flag.marr_ready" }),
        X(`'Nothing, Principal. Thank you.'`)
      ]
    }),

    ostrov_letter: N("marr", `"There is one more." She takes it from the inner pocket of her jacket: a single cream envelope, addressed in the neat upright hand: TO OSTROV DANE. UNSENT.\n\n"I wrote it on Wednesday night," she says. "In the dark, so I would not see the words. It says that I am sorry and that I am a coward. It says that I passed on a room number and kept the receipt." She holds it out. "I should like it read at the Jubilee, if there's a place for it. Or put with the Ledger. Or burnt, in front of me. I find I have no preference, as long as it isn't me who decides."\n\nShe lights the cigarette at last, with a steady hand, in the school office, for the first time in fifteen years. The smoke goes up past the pale rectangle on the wall, and nothing happens. Nothing happens at all.`, {
      onEnter: [{ set: "marr_letter_given", val: true }, { set: "marr_letter", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_burned_paper" }],
      interjections: [
        I("empathy", 5, `Dear Ostrov. Unsent. It's addressed to a dead man, and it's the most honest thing she's ever written. Keep it safe.`),
        I("authority", 4, `A confession in your pocket is a weapon and a burden. Decide what to do with it before eight.`),
        I("appetite", 2, `She lit it. I never thought I'd feel so happy about a cigarette that isn't mine.`)
      ],
      choices: [C(`'I'll keep it safe.'`, "turned_hub")]
    }),

    ready_cold: N("marr", `"At eight." She considers it with the care she gives the weather. "At eight, I am supposed to be on the dais, at the Inspector's left hand, in my good suit. I am to say a few words about discipline. I have a text."\n\nShe takes it from the blotter and tears it down the middle, evenly, with a clean ripping sound. "I shall be on the dais. I shall not say those words. I shall say, if I can find them, a different few. And I shall see to it that the attendance register is mislaid, the doors to the Hall are propped open, and the Inspector's chair is a good way from the microphone." She puts the halves in the bin. "It is not very much. It is, for me, practically a coup."`, {
      onEnter: [{ set: "marr_ready", val: true }, { xp: 4 }, { morale: 3 }, { surv: -3 },
        { note: "task_jubilee", text: "Marr will sit on the dais at eight and not read the Ministry's text. The register will go missing, the Hall doors will be propped open, and Voss's chair will be a long way from the mic." }],
      interjections: [
        I("authority", 4, `The Principal's authority over the Hall is the one real power in the building. She's just lent it to you.`),
        I("charm", 4, `A woman tearing up a speech is the most beautiful sound in a school.`)
      ],
      choices: [C(`'Thank you, Principal.'`, "ready_again")]
    }),

    ready_again: N("marr", `Principal Marr is writing. She doesn't look up, but she has left her glasses off, and the pen moves with an unfamiliar rhythm, slower, less sure: the pen of a woman writing something that isn't a form.\n\n"The Thursday letter," she says, to the paper. "I thought I should write it early, today. In case I'm needed." A small, dry noise that might be a laugh. "It begins, 'Dear Odalys. Do.'"`, {
      interjections: [
        I("empathy", 5, `Dear Odalys. Do. It is the only letter that matters and she has written it. You will keep it for her.`)
      ],
      choices: [X(`'See you at eight, Principal.'`)]
    })
  }
},

// =====================================================================
anka_d3: {
  title: "Mother Anka",
  start: [
    { cond: "flag.anka_ready", node: "ready_again" },
    { cond: "flag.cell_active || flag.ledger_with_anka || flag.verdict_ledger", node: "briefing_open" },
    { node: "thin_open" }
  ],
  nodes: {
    briefing_open: N("anka", `The chairs are in a circle again, the unsanctioned ones, and for once somebody has swept. A dozen tin mugs stand on the planning table in a row. The kettle sings. On the boiler door, in yellow chalk, is a list in a hand you know: names and times, and beside each a single word. SOUP. TYPEWRITER. VALVES. DOOR. TRAM. PIPES.\n\n"Sit," says Mother Anka. She does not look up from the list. "This is the last briefing. Tomorrow I will not remember giving it, and tomorrow's you will not remember hearing it, and we shall both have to be taught by our sleeves." She taps the chalk. "So we do it properly. Ten minutes. Tea first."`, {
      interjections: [
        I("solidarity", 3, `A circle of chairs. A list. A kettle. This is the whole of our army and it is perfect.`),
        I("empathy", 4, `She is not tired today. She is something quieter, with its sleeves rolled. A woman who has finally been given the day she planned for.`),
        I("archive", 3, `Eleven names on the door. Last week it was nine. The Undercurrent is growing at the unheard-of rate of two persons a fortnight.`)
      ],
      choices: [C(`Sit and take the tea.`, "hub")]
    }),

    thin_open: N("anka", `The chairs are in a circle and nobody is sitting in them. There are fewer mugs than there should be. Mother Anka is at the table alone with a cigarette and a very small stack of paper, and the kettle sings to nobody.\n\n"Ah," she says. "The student. I'd hoped you might come by before the end of the world." She waves at the chairs. "As you see, the Undercurrent is in a state of recess. Without the book, a cell is only a tea party. People came on Tuesday and Wednesday. They are afraid, and they are right to be, and they are in the Library and the kitchen and the street, holding what they can."`, {
      interjections: [
        I("empathy", 4, `She's not angry. She's too old and too practical. She is looking at the Ledger-shaped hole in the table.`),
        I("deduction", 4, `No copies in progress. No typewriters in the room. The cell never got the proof. It has been waiting for you, and you have not come.`)
      ],
      choices: [
        C(`[Give her the Ledger.] 'Here. Please. It's yours.'`, "hand_now", { cond: "has('ledger')" }),
        C(`'I haven't got it. Not with me.'`, "hub", { cond: "!has('ledger')" }),
        C(`'Tell me what's left.'`, "hub")
      ]
    }),

    hand_now: N("anka", `She does not take it at once. She puts her palms flat on the table on either side of it. Her chin comes up. She looks at the green cloth book, at the nervous handwriting, at you, and her face, which is a very old and very dry face, does something it has not done in public for thirty years.\n\n"It will be copied tonight," she says. "Nine times. Nine typewriters. Before the Bell. I have a woman in the mills who types eighty words a minute with her eyes closed." She picks it up as you pick up a sleeping child. "Thank you. I know you wanted to keep it. It is a very heavy thing to hand over. It's heavier to carry."`, {
      onEnter: [{ take: "ledger" }, { set: "ledger_with_anka", val: true }, { set: "cell_active", val: true }, { xp: 5 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { task: "task_anka", state: "done" }, { thought: "th_chosen_family" },
        { note: "task_anka", text: "Handed the Ledger to Mother Anka on Thursday morning. She will have it copied nine times before the Bell." }],
      interjections: [
        I("volition", 4, `You did it. A day late, perhaps, but it counts.`),
        I("solidarity", 4, `We are the cell now. We are an actual cell. We have an actual book.`)
      ],
      choices: [C(`Sit and take the tea.`, "hub")]
    }),

    hub: N("anka", `"Ask, and be quick," says Mother Anka, and pours. "A briefing is a conversation that has been told the time. I find that students always have exactly one question more than I have minutes."`, {
      interjections: [
        I("authority", 4, `Briefing is the Undercurrent's drill. Treat it as one.`),
        I("senses", 3, `A smell of hot pipe, chicory, old cigarette, a little chlorine from the sink. The room is working.`)
      ],
      choices: [
        C(`'Who are the eleven? What does each one do?'`, "eleven", { cond: "!flag.anka_eleven" }),
        C(`'What about the Ledger? What happens to the copies?'`, "copies", { cond: "(flag.cell_active || flag.ledger_with_anka) && !flag.anka_copies" }),
        C(`'The Inspector. Has he been here?'`, "voss", { cond: "!flag.anka_voss3" }),
        C(`'The pipes. What did you mean by PIPES?'`, "pipes", { cond: "!flag.anka_pipes_asked" }),
        C(`'Tell me about Ostrov, as a boy.'`, "ostrov", { cond: "!flag.anka_ostrov3" }),
        C(`'What happens to us tomorrow, when the Bell takes this?'`, "sleeve", { cond: "!flag.anka_sleeve_done" }),
        C(`'I could take the tram, Anka.'`, "tram", { cond: "!flag.anka_tram3" }),
        C(`'At eight. What can the cell do?'`, "ready", { cond: "flag.anka_pipes_asked && !flag.anka_ready" }),
        X(`'That's enough for now.'`)
      ]
    }),

    eleven: N("anka", `She counts them off on fingers stained with nicotine and chalk. "Bronka. Bread: she has four hundred loaves and a note in each. Ysolde, in the Library: paper, and the Forbidden Stacks. Quill: history, a reading-room and a cough. Gregor, on the avenue: valves, solder and discretion. Nadia: the tram. Tomas, at the Relay, who doesn't yet know he's one of us. Wren: the legs. Osk," she hesitates, "if he'll have us. A boy in the Vanguard who doesn't know what he's become. Your Ilsabet: she's the first of the next lot. And myself."\n\nShe taps the table. "That is eleven. Somebody is always about to become twelve."`, {
      onEnter: [{ set: "anka_eleven", val: true }, { xp: 2 }],
      interjections: [
        I("archive", 3, `Bronka, Ysolde, Quill, Gregor, Nadia, Tomas, Wren, Osk, a boy, Ilsabet, Anka. It's eleven. It's also a seating plan.`),
        I("empathy", 5, `She said "if he'll have us" about Osk, and her mouth went still. She is thinking of the corridor with the mop. She will not mention it.`, { cond: "flag.osk_scapegoat" }),
        I("solidarity", 4, `Eleven. Look at us. We are a Thursday.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    copies: N("anka", `"Nine," she says. "A woman in the mills types it onto onion-skin. A man in a post office at Gravel Cross has a franking machine and a talent for indifference. A girl on the tram line. A priest who is not, strictly, a priest. They go out in nine suitcases on the night tram, and by Saturday it is in nine provinces, in handwriting, in the margins of the Catechism." She pauses. "The Bell cannot reach what isn't in the district."\n\nShe looks at you with great steadiness. "The copies make the Ledger undeletable. They do not make anyone remember. That, my dear, is the other part, and it is yours."`, {
      onEnter: [{ set: "anka_copies", val: true }, { xp: 2 }, { note: "task_jubilee", text: "Anka will have the Ledger copied nine times and sent out on the night tram. The copies make it undeletable. Making people remember is the other half, and it's mine." }],
      interjections: [
        I("rhetoric", 4, `"The Bell cannot reach what isn't in the district." That is the thesis of the Undercurrent, and also, as it happens, a rather beautiful sentence.`),
        I("archive", 4, `If you hold the relay logbook as well, the copies would have a second witness. Her typists would be glad of a fresh page.`, { cond: "has('relay_log') || flag.relay_log_found" })
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    voss: N("anka", `She smiles with one side of her mouth. "Hale Voss. Yes. He came down this morning at six, alone, in a good coat, with two cups of tea. He sat in that chair. He said, 'Mrs Brodsky, I am going to ask you to go home.' Not an order. A request. He said he would like the whole of this room to go back to its own kitchens and put the kettle on and not think about the Jubilee. He said it'd be kinder to everyone."\n\nShe drinks her tea. "He did not take a name. He didn't need to. He knows them all. He sat there, drank half a cup, and left the other half. I thought: there is a man who is trying to save me from something and cannot tell whether it's the Ministry or himself."`, {
      onEnter: [{ set: "anka_voss3", val: true }, { xp: 2 }],
      interjections: [
        I("empathy", 5, `Two cups of tea. He was in this room for half an hour and he didn't threaten anyone. That frightens her more than a gun.`),
        I("instinct", 4, `Hale Voss is a man who wants to be talked out of it. He is hoping somebody in the building will.`, { cond: "flag.voss_met" }),
        I("doublethink", 3, `He was so kind. It's wonderful that a man like that exists. (He exists to dissolve us. Oh, but kindly.)`, { cond: "flag.voss_ally || flag.voss_invited" })
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    pipes: N("anka", `"Pipes." Her face lights, quite suddenly, with the wicked glee of a chemistry teacher who has been waiting all term to do the practical. "The school's heating was laid in the old Warden's time, with a main trunk running from this boiler to every radiator in every wing. It's iron. It's two inches thick. It is, if you knock on it, the loudest telegraph in the district. We've used it for forty years. Knock twice in the cellar and the Library hears it. Knock a rhythm and it carries from the dormitory to the gym."\n\n"Put a tone down it and it rings the building like a bell," she says. "Every radiator is a speaker. They hum. If you've a sound that wants to be everywhere at once and doesn't want a loudspeaker, that is the cheapest, ugliest, most beautiful way I know."`, {
      onEnter: [{ set: "anka_pipes_asked", val: true }, { xp: 3 }, { thought: "th_wake_tone" }],
      interjections: [
        I("deduction", 4, `The radiators in the dormitory. They hum when the boiler's on. A pipe's an organ. A school's a pipe-organ made of grievance.`),
        I("the_grey", 4, `YES. Finally. Somebody has noticed that I'm iron and I am connected to everything. I would like to carry this one, please.`),
        I("senses", 4, `Hob's tapping on the beams. The same beat, on a different pipe. The tower and the cellar could talk if somebody would introduce them.`, { cond: "flag.hob_rhythm" })
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    ostrov: N("anka", `"Ostrov." She sits back. "He was twelve. In the second row, the clever one, the one who read the small print on the exam. He'd put up his hand and say, 'Mrs Brodsky, the question says "which of the following is NOT"; is that a trick?' And I'd say it was a test of reading, and he'd say, 'Then it's a trick on people who read.' He would have made a very good chemist."\n\n"I told him once that everything is a reaction. That the Union is just a precipitate: dissolved, then settled out of grief. He said, 'Then you could dissolve it again.' I said yes, in principle. And he looked at me with such terrible hope that I changed the subject."`, {
      onEnter: [{ set: "anka_ostrov3", val: true }, { xp: 2 }, { morale: 1 }],
      interjections: [
        I("empathy", 5, `She changed the subject. It is the thing she regrets most. Not what she did. What she did not say to a twelve-year-old.`),
        I("rote", 3, `EVERYTHING IS A REACTION. (This is not in the Orthodoxy. It is, however, in the Periodic Table, which the Ministry has not yet found a way to ban.)`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    sleeve: N("anka", `"Tomorrow." She does not flinch. "At nine tonight, or at eight if the Jubilee has its way, the Bell will pass over the district like a broom, and in the morning we shall be a lot of nice, hazy persons who have lost an afternoon." She pushes up the sleeve of her lab coat. On the inside of her forearm, in yellow chalk, in a firm round hand, is written: ASK THE STUDENT ABOUT TUESDAY.\n\n"We write it on the skin," she says. "On the forearm, in chalk. It's the one place the Bell has never found. You wake up and you look at your arm, and it says what to do. It's very crude. It has worked for years." She takes a stub of chalk from her pocket and holds it out to you. "Write mine. And let me write yours."`, {
      onEnter: [{ xp: 2 }],
      interjections: [
        I("empathy", 5, `A woman who writes her own instructions on her skin so as not to lose herself. Do it. Take the chalk.`),
        I("sleight", 4, `Your hand knows how to hold the chalk. Write small. Write neatly. Write something you'll believe.`),
        I("solidarity", 4, `We are tattooing a revolution in chalk. It's the only kind the Bell can't scrub.`)
      ],
      choices: [
        C(`Write: "ASK ME ABOUT THE LEDGER. IT WAS ME."`, "sleeve_done", { effects: [{ set: "anka_sleeve_ledger", val: true }] }),
        C(`Write: "YOU WERE BRAVE. THEY WERE KIND. BOTH ARE TRUE."`, "sleeve_done", { effects: [{ set: "anka_sleeve_kind", val: true }] }),
        C(`Write: "SHE LIKED YOUR TEA."`, "sleeve_done", { effects: [{ set: "anka_sleeve_tea", val: true }] })
      ]
    }),

    sleeve_done: N("anka", `She takes your forearm in her cool dry hand and writes along it, in chalk the colour of margarine: WAKE UP. LOOK AT THE BOILER ROOM. ASK THE OLD WOMAN WHY SHE'S SMILING. You hold hers, and write, and the two of you stand for a moment with your arms side by side, chalked, in the yellow light, like two children comparing a summer.\n\n"It'll come off in the wash," she says briskly. "Don't wash." She pulls her sleeve down. "There. We are now, technically, a cell. Eleven chalk arms and a kettle."`, {
      onEnter: [{ set: "anka_sleeve_done", val: true }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" }],
      interjections: [
        I("senses", 4, `Chalk on the skin. It smells of classrooms and of school-chalk, and it's the nicest smell in the world.`),
        I("volition", 4, `Whatever the Bell takes, this is on your arm. You will wake up and look.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    tram: N("anka", `"The tram." She sets the kettle down very carefully. "You think I haven't thought of it. Nadia is a thief and a patriot and her tram leaves at twenty-forty. There's a seat for you, if you want it. There is a seat for Wren, and for the clever ones, and a suitcase with the Ledger in it, and a province at the end of the line with different slogans."\n\n"I am not going to tell you to take it. I am not going to tell you to stay." She meets your eye. "I will tell you that I have watched eleven of my best students die brave, and I did not once think that brave was the same as useful. I want you to survive. I want that more than I want a district that wakes. I'm not ashamed of it. I want you to know it's allowed."`, {
      onEnter: [{ set: "anka_tram3", val: true }, { xp: 2 }],
      interjections: [
        I("volition", 5, `It is allowed. Say it to yourself in the voice you'd use to a friend.`),
        I("grit", 4, `She has said "allowed." It's the heaviest word in the district.`),
        I("empathy", 5, `She doesn't want you to be a hero. She has wanted that, every day, for thirty years, for every child that walked through that door.`)
      ],
      choices: [
        C(`'If it comes to it, I'll take the seat. Thank you.'`, "hub", { effects: [{ set: "anka_blessed_exit", val: true }, { morale: 1 }] }),
        C(`'I'm not going anywhere.'`, "hub", { effects: [{ set: "anka_blessed_stay", val: true }, { ideo: "undercurrent", n: 1 }] }),
        C(`'Ask me again at eight.'`, "hub")
      ]
    }),

    ready: N("anka", `"What the cell can do." She taps the chalk on the boiler door, one item at a time. "SOUP: Bronka feeds the district. TYPEWRITER: the Ledger goes out in nine suitcases. VALVES: Gregor stays on the avenue, holding the line. DOOR: Osk, if you've kept him. TRAM: Nadia holds it as long as she can. PIPES." She looks at the last word and her face loosens. "That is me."\n\n"At eight I'll be in this cellar with a wrench on the main, knocking seven, eleven, seven, eleven, on every pipe in the school, as loud as an old woman can. Every radiator in the dormitory, the Library, the gym, the Hall will take it up. If the choir carries the tone and the horns carry the tape and a tower carries the bell, it will want a skeleton to hold on to." She puts the chalk down. "I'll be the skeleton."`, {
      onEnter: [{ set: "anka_ready", val: true }, { set: "anka_pipes", val: true }, { xp: 5 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_jubilee", text: "Anka will be in the cellar at eight with a wrench on the main, knocking seven-eleven on every pipe in the school. Every radiator becomes a speaker." }],
      interjections: [
        I("authority", 4, `A cell leader, formally in position, in the one place in the school nobody ever goes. She's thought about this longer than you've been alive.`),
        I("solidarity", 4, `Skeleton. It is a lovely word. We are all one big, noisy skeleton.`),
        I("the_grey", 4, `Iron, hot, humming. I will carry it. I will carry it to every room. I have waited a century for a reason.`)
      ],
      choices: [C(`'Thank you, Mother Anka.'`, "ready_again")]
    }),

    ready_again: N("anka", `Mother Anka is under the boiler on her back on a bit of cardboard, her white hair full of dust, doing something to a valve with a wrench. A voice emerges from beneath the machine.\n\n"If you've come to help, hold the lamp. If you've come to worry, go and worry elsewhere; the boiler dislikes it." The wrench clinks. "The tea is on the table. Drink it. A person should have something warm in her before a revolution. I was taught that by a man who didn't have one."`, {
      interjections: [
        I("empathy", 4, `She's happy. Quite alarmingly happy. She's finally been handed a wrench.`)
      ],
      choices: [
        C(`Hold the lamp for a minute.`, "ready_again", { effects: [{ xp: 1 }, { morale: 1 }], once: true }),
        X(`'See you at eight.'`)
      ]
    })
  }
},

// =====================================================================
matron_d3: {
  title: "Matron Pritt",
  start: [
    { cond: "flag.matron_ready", node: "ready_again" },
    { cond: "flag.matron_informs", node: "informer_open" },
    { cond: "flag.matron_bribed", node: "bribed_open" },
    { node: "open" }
  ],
  nodes: {
    open: N("matron", `"Stand up straight, dear. It's the Jubilee." Matron Hallow Pritt is on her rounds with a clipboard, a pencil on a string, and a cardigan the colour of boiled ham. Down the dormitory the bunks have been made so tight you could bounce a coupon off them. "Collars. Cuffs. Shoes. I'll be doing you in a minute. And I have your name down for a hot-water ration, which is a very great privilege."\n\nShe gives you the full, slow, ferocious once-over of someone who has been inspecting children for fourteen years and has never once found them satisfactory, and has never once stopped hoping.`, {
      interjections: [
        I("senses", 3, `Sherry, very faint, under the lavender. She has had a small one. She has had a small one every morning for fourteen years, and the whole dormitory knows, and it's the kindest thing about her.`),
        I("empathy", 4, `She looks at each of you the way you'd look at a row of lamps. Checking they're lit.`),
        I("instinct", 3, `The clipboard. Not the one on top. The one beneath it: a fat green book, stubby corners worn, which she touches twice for luck each time she turns a page.`)
      ],
      choices: [C(`'Matron.'`, "hub")]
    }),

    bribed_open: N("matron", `"Ah, there you are." She makes a small neat tick in the margin of the clipboard, and her whole face does something unauthorised: a very slight softening, like a stiff collar that someone has undone a button on. "My favourite delinquent. I've saved you a cup." There is, on the table by the hotplate, a cup of tea and a biscuit.\n\n"Don't make a fuss. It's Thursday." Her eyes slide, once, toward the fat green book on the shelf and then away. "I've had a funny morning. I've been thinking about footsteps."`, {
      interjections: [
        I("empathy", 4, `She likes you. She'd be appalled to be accused of it. A woman who has never had an ally is trying out the word on the inside of her cheek.`),
        I("appetite", 3, `A BISCUIT. She has saved a biscuit. It's enormous. It's the moral centre of the dormitory.`)
      ],
      choices: [C(`Take the tea.`, "hub")]
    }),

    informer_open: N("matron", `She is waiting at the door with the clipboard and a fixed, pleased little smile, and does not move aside. "There you are. I was just saying to the Inspector's gentleman how very regular you've been in your comings and goings." She tilts her head. "Wednesday, ten past one. Left. Eleven twenty. Returned. Wet shoes."\n\nShe says it with such perfect pleasantness that for a moment you think it is a compliment. "I do like a tidy record. It is such a comfort. I'm told it's going to be needed this evening."`, {
      onEnter: [{ surv: 3 }],
      interjections: [
        I("empathy", 4, `She is not malicious. That's the horror. She believes that a ledger kept faithfully for the right reader is a form of love.`),
        I("authority", 4, `She's passed your times to Voss's man. You know it. Don't let her see you know it. Make her look at what she's doing.`),
        I("composure", 4, `Hands still. She notes hands. Everything is noted.`)
      ],
      choices: [
        K(`[Empathy] 'Who do you write it for, Matron? Who's the reader?'`, "empathy", 12, "matron_d3_turn_emp", "turn_pass", "turn_fail", { w: 1 }),
        K(`[Archive] Quote her the regulation: informers must be bonded, and she hasn't been.`, "archive", 12, "matron_d3_turn_arch", "turn_pass", "turn_fail", { w: 1 }),
        C(`'Of course, Matron.' Move past her.`, "informer_pass")
      ]
    }),

    informer_pass: N("narrator", `You move past her. She lets you. At your back there is the small, round, satisfied sound of a pencil being licked.`, {
      onEnter: [{ ideo: "quiet", n: 1 }],
      choices: [X(`Go.`)]
    }),

    turn_pass: N("matron", `Her smile stays where it was for three seconds after the rest of her has left it. The pencil stops. "Who," she says. "Who is the reader." She says it as though it were a word from another language, and she was just now hearing it spoken by somebody who knew.\n\n"I've never asked," says Matron Pritt. "In fourteen years. I send it to the Office and it goes off in an envelope, and I take it as read that someone's reading. I've never thought: is it a person? Is it, ah, somebody with a face?" She looks at the green book. "I think I might be writing to a drawer."\n\nShe takes a step back from the door.`, {
      onEnter: [{ set: "matron_informs", val: false }, { set: "matron_turned3", val: true }, { xp: 4 }, { morale: 1 }, { thought: "th_matron_eyes" }],
      interjections: [
        I("empathy", 5, `She's afraid, now. Not of you. Of the reader being nobody. Be gentle. She's only just found out what she's been living in.`)
      ],
      choices: [C(`Go in.`, "hub")]
    }),

    turn_fail: N("matron", `"Regulations," says the Matron, with immense and chilly relish. "My dear. I know them all. I was a clerk in the Ministry before they gave me a dormitory." She taps the clipboard. "It's very sweet. It's rather like a child explaining a joke." She shifts, and does not move aside. "I would think about your shoes."\n\nYou cannot get through. You can go round. She watches you do it with her pencil raised.`, {
      onEnter: [{ surv: 4 }, { morale: -1 }],
      choices: [X(`Go.`)]
    }),

    hub: N("matron", `"Well, dear? I haven't all day. I have forty-one pairs of shoes and a Jubilee." She puts the clipboard down on the table and her hand rests on the fat green book without her seeming to notice.`, {
      interjections: [
        I("volition", 4, `She is a lonely woman with a fixation. Do not mistake her for a monster; it makes you less careful.`)
      ],
      choices: [
        C(`'Tell me about the ledger. How does it work?'`, "ledger", { cond: "!flag.matron_ledger3" }),
        C(`'Does it have my name in it?'`, "your_entry", { cond: "flag.matron_ledger3 && !flag.matron_entry" }),
        C(`'Share a drop of sherry, Matron. It's a hard morning.'`, "sherry", { cond: "!flag.matron_sherry" }),
        C(`'The first page. What is the first page?'`, "first_page", { cond: "flag.matron_sherry && flag.matron_ledger3 && !flag.matron_first" }),
        C(`'Could I borrow the ledger? Only for the day.'`, "ask_ledger", { cond: "(flag.matron_first || flag.matron_bribed || flag.matron_turned3) && !has('matron_ledger')" }),
        C(`'There are names in there that shouldn't be.'`, "burn", { cond: "flag.matron_first && !flag.matron_burned" }),
        C(`'Tonight. Could the dormitory be left unwatched?'`, "ready", { cond: "!flag.matron_ready && (flag.matron_first || flag.matron_bribed || flag.matron_turned3)" }),
        X(`'Nothing, Matron.'`)
      ]
    }),

    ledger: N("matron", `"The ledger." She fondles the corner. "Who comes in. Who goes out. What they were wearing, what they were carrying, whether they looked left or right at the door. Fourteen years of footsteps. I keep it in three colours: blue for the regular, red for the irregular, green for what I haven't made up my mind about." She smiles with what is very nearly shyness. "Everybody laughs at the green. They shouldn't. It's the only colour that's honest."\n\n"The Office reads the red. I read the lot. I find I can't sleep without it. If I didn't write them down, dear, how would I know I'd been there?"`, {
      onEnter: [{ set: "matron_ledger3", val: true }, { xp: 2 }, { thought: "th_matron_eyes" }],
      interjections: [
        I("archive", 4, `A triple-coded ledger of ingress and egress. In any other country this would be a masterpiece of social science.`),
        I("empathy", 5, `"How would I know I'd been there?" She isn't spying. She is leaving herself notes, like you, like Marr, like Anka. The whole district is writing to itself.`),
        I("deduction", 4, `Not "for the Office." She writes for herself first. The Office merely reads her diary. That is a very different crime.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    your_entry: N("matron", `"Yours?" She leafs through. "Oh, a good many, dear. Blue mostly. A little red." She stops. "Here. Tuesday night. Ten past eleven. Left. Student V., with a parcel, wrapped in a flag. A little, ah, stiff in the gait. In the margin I've written: said 'I'm going to forgive somebody.' I put a green mark. I didn't know what it meant." She turns her head, and for once she looks at you as at a person. "Did you? Forgive somebody?"\n\nYou do not know. Somewhere in the Static there is a lit window, and you were on the other side of it.`, {
      onEnter: [{ set: "matron_entry", val: true }, { xp: 3 }, { thought: "th_ghost_of_yesterday" }],
      interjections: [
        I("empathy", 5, `"I'm going to forgive somebody." That's the third note. That is you, in your own voice, in a cardigan's handwriting, from the night you forgot. You were not afraid.`),
        I("archive", 4, `Entry: Tuesday, 23:10. It's the only independent corroboration of the night. Anka says midnight. Hob has a knot. Now a ledger. Three witnesses and not one of them knew what they saw.`)
      ],
      choices: [C(`'Thank you, Matron.'`, "hub")]
    }),

    sherry: N("matron", `She hesitates, and then, with the exaggerated stealth of a woman who has done it forty times and been seen at each, she opens the third drawer and brings out a small bottle and two enamel mugs. "Medicinal," she says. "For the nerves. Not a word."\n\nIt is dreadful. It tastes of cough-drops and honest regret. She drinks hers in two efficient swallows and sits very upright, a little pink about the ears. "I shall tell you something," she says. "I'm not made for this. I'm made for knitting. But somebody has to look after them."`, {
      onEnter: [{ set: "matron_sherry", val: true }, { xp: 2 }, { hp: -1 }, { morale: 1 }],
      interjections: [
        I("appetite", 3, `Sherry. Cheap, warm, a little frightening. I would like another and would not like to be seen to.`),
        I("charm", 4, `The Matron has a soft side. Don't poke it. Let her find you at the edge of it.`)
      ],
      choices: [C(`Raise the mug.`, "hub")]
    }),

    first_page: N("matron", `She opens the ledger at the very first leaf, and there is no entry at all. A date, fourteen years old, in a much younger hand: then a name, scored through so hard that the nib has torn the paper. Under it, in small capitals: SOMEONE LEFT.\n\n"I don't know who," she says. "That's why I started. A girl, I think. In my care. Went out one night after the Bell, and in the morning there was a gap in the bunks and a gap in my head, and nobody in the building could say who." She closes her hand over the page. "So I wrote down everyone who came and went. Every one. So that it could never happen again. So that I could always say who."\n\nShe looks at the shut book. "I've never found her. I've found, I think, about eleven thousand other people."`, {
      onEnter: [{ set: "matron_first", val: true }, { xp: 4 }, { morale: -1 }, { thought: "th_counting_footsteps" }],
      interjections: [
        I("empathy", 5, `Fourteen years of watching so she'd never lose another child. The surveillance state's chief informer is a woman keeping a vigil.`),
        I("the_grey", 4, `A scratched-out name. A gap in the bunks. I carry that one. It is a long way down in the drains and it's still there.`),
        I("solidarity", 4, `We are all that girl, a little. We are all someone who left, and somebody wrote it down.`)
      ],
      choices: [C(`Stay with her.`, "hub")]
    }),

    ask_ledger: N("matron", `"My book." She does not snatch it back. She holds it to her chest, both arms folded round, and looks at you as if you'd asked for a kidney. "I have never let it out of this room. Not for the Office. They get copies."\n\nThen, slowly: "What would you do with it?"`, {
      interjections: [
        I("rhetoric", 4, `Tell her the truth: a record of footsteps is a record of who was where, and where is a thing the Inspector will use.`),
        I("empathy", 5, `Do not ask for it as a favour. Ask for it as a trust.`)
      ],
      choices: [
        K(`[Rhetoric] 'Put it where Voss can't read it. Put it where it's safe, and put it with someone who writes it too.'`, "rhetoric", 11, "matron_d3_book_rhet", "book_pass", "book_fail", { w: 1 }),
        K(`[Empathy] 'You've been the only one who wrote down that we were here. Let me carry it for you tonight.'`, "empathy", 10, "matron_d3_book_emp", "book_pass", "book_fail", { w: 1 }),
        C(`'Never mind.'`, "hub")
      ]
    }),

    book_pass: N("matron", `She holds it out. Both hands, like a tray. Her lip trembles and is mastered. "You will bring it back." Not a question. "You will bring it back on the morning, and read me every entry from Tuesday, and tell me who's in it. Because I won't know. I'll have a tidy gap and a ledger in somebody else's handwriting." She presses it into your arms. "It's the only thing I've got. Mind the corners."`, {
      onEnter: [{ give: "matron_ledger" }, { set: "matron_gave_book", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        I("empathy", 5, `She just handed over her memory. Don't treat it as a trophy.`),
        I("authority", 3, `Fourteen years of footsteps, indexed. A weapon, or a mercy. Choose which.`)
      ],
      choices: [C(`'I'll mind them.'`, "hub")]
    }),

    book_fail: N("matron", `"No." It comes out kind and absolute. "I'm sorry, dear. You mean well. But I've put my life in it and I'm too old to be talked out of that by a pretty argument." She sets it on the shelf, out of reach. "Come back when you've had your shoes inspected."`, {
      onEnter: [{ morale: -1 }],
      choices: [C(`Back off.`, "hub")]
    }),

    burn: N("matron", `She doesn't ask which. She opens the book at the page for last Tuesday and runs a thick finger down the green column. Her mouth has gone narrow. "The Wren child. The girl in the chair. Corvin Hale, whom I have always disliked. The Brodsky woman, in the cellar." She looks at you. "Fifteen. Sixteen. You've all, ah, turned up as green. I never knew what green meant. I thought it was just a mood."\n\nShe tears the page out. The sound is like a very small thunderclap. She holds it over the hotplate with two fingers and it blackens at the edge and curls and goes. Then she does the next. And the next.\n\n"There," she says. "A tidy gap."`, {
      onEnter: [{ set: "matron_burned", val: true }, { set: "burned_something", val: true }, { xp: 4 }, { morale: 2 }, { surv: -8 }, { thought: "th_burned_paper" }],
      interjections: [
        I("empathy", 5, `She's burning her own life's work, with a steady hand, to protect people she never admitted to liking.`),
        I("composure", 4, `Smoke. Smoke. The dormitory smells of toast. Nobody will mention it.`)
      ],
      choices: [C(`'Thank you.'`, "hub")]
    }),

    ready: N("matron", `She looks at the long room with its forty-one bunks, and her mouth goes into a line you recognise as a decision.\n\n"At nineteen-thirty I do a roll-call. I will go down the length of the room and say 'All present and correct,' to an empty dormitory, in a firm voice, to the radiator. I will lock the main door from the inside and leave it, in a manner of speaking, unlocked. I will make a very great deal of cocoa. And the green book," she nods to it, "will say, in my own hand, that every child in this room was tucked up at eight."\n\nShe straightens her cardigan. "I have never in my life told a lie in a ledger. It's going to be wonderful."`, {
      onEnter: [{ set: "matron_ready", val: true }, { xp: 4 }, { morale: 3 }, { surv: -3 }, { thought: "th_chosen_family" },
        { note: "task_matron", text: "The Matron will log every child as in bed at eight and leave the dorm door unwatched. She'll have cocoa for whoever comes home." }],
      interjections: [
        I("slip", 4, `An empty dormitory with a perfect alibi. You couldn't hope for a better stage.`),
        I("charm", 4, `Cocoa. In a revolution. We would like it on the flag.`)
      ],
      choices: [C(`'Thank you, Matron.'`, "ready_again")]
    }),

    ready_again: N("matron", `Matron Pritt is putting out forty-one mugs. She does it with her own hands, one at a time, along the length of the long table, setting each one on a saucer and turning the handle just so. A pan of milk steams on the hotplate. The room smells of cocoa and carbolic and, faintly, of fear being managed.\n\n"If anyone asks," she says, not turning, "I was never here. I have never been anywhere. I'm a dormitory." She straightens a mug. "Go on, dear. I've a great deal of nothing to be doing."`, {
      choices: [X(`'See you after.'`)]
    })
  }
},

// =====================================================================
dov_d3: {
  title: "Dov Kessel",
  start: [
    { cond: "flag.dov_ready", node: "ready_again" },
    { cond: "flag.dov_leaving", node: "leaving_again" },
    { cond: "flag.dov_ally", node: "ally_prev" },
    { node: "open" }
  ],
  nodes: {
    ally_prev: N("dov", `"Don't look at me like that." Dov is sitting on the footlocker with the lid up and the parcels out, counting a stack of forged passes into sixteen neat heaps. "I was going to be on the tram. I had a seat. I had a hat." He licks his thumb. "And then I thought: who's going to hand these out? Nadia? She'd charge. So I'm staying, till the last one's on. Twenty past eight, the platform. I want it noted that it's your fault."\n\nHe presses a pass into your hand without looking. "On the house. Don't read anything into it. I'm a dealer. We do not do sentiment. We do goodwill, which is different, and has a much better margin."`, {
      onEnter: [{ set: "dov_ready", val: true }, { give: "forged_pass" }, { set: "dov_free_pass", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_chosen_family" },
        { note: "task_dov", text: "Dov is staying. He'll be on the tram platform at 20:20, handing out sixteen free passes, until Nadia rings the bell." }],
      interjections: [
        I("empathy", 4, `A man who was always early has decided to be on time. It's the bravest thing he's ever done and he has priced it as a favour.`),
        I("sleight", 3, `Sixteen heaps. Sixteen names. The stamps are perfect.`)
      ],
      choices: [C(`'Thank you, Dov.'`, "ready_again")]
    }),

    open: N("dov", `"Don't touch the blue box. Touch the blue box and I'll have to charge you for the privilege of having touched it." Dov Kessel is kneeling on the floor of the dormitory in his shirtsleeves with the footlocker open, packing: shirts rolled like cigars, a tin of boot-polish that is not boot-polish, three kilos of brown paper parcels each with a price pencilled on it in his looping hand. He doesn't look up.\n\n"It's Thursday," he says, "and I have a theory about Thursdays. They are the day before the day the district wakes up and discovers it has been burgled. I would like to be in a different postcode when that happens. Don't make a face. I'm not running. I'm relocating, with commercial intent."`, {
      interjections: [
        I("sleight", 3, `The blue box has a false bottom. The parcels have false labels. The shirts have false pockets. The whole footlocker is a nest of small, helpful lies.`),
        I("charm", 3, `He's very funny. Don't forget he's also afraid. He's using the first to hide the second, as all the good ones do.`),
        I("senses", 3, `Tram-ticket glue. Cheap soap. The faint metal of tokens, somewhere. And, under the cigarettes, the smell of a boy who hasn't slept.`)
      ],
      choices: [C(`'You're leaving tonight.'`, "hub")]
    }),

    hub: N("dov", `"Leaving, relocating, expanding into new markets." He closes the lid on a flap of paper and leans on it. "What can I do you for? I give a discount to friends and a lecture to enemies, and I haven't yet decided which you are."`, {
      choices: [
        C(`'What've you got?'`, "price_list", { cond: "!flag.dov_prices" }),
        C(`'Why tonight? Why the tram?'`, "why", { cond: "!flag.dov_why" }),
        C(`'The brown parcels. What's in them?'`, "parcels", { cond: "flag.dov_why && !flag.dov_parcels" }),
        C(`'Stay, Dov. We need what you can do.'`, "stay_ask", { cond: "flag.dov_parcels && !flag.dov_leaving && !flag.dov_ready" }),
        C(`'Fine. Go. Take care of yourself.'`, "let_go", { cond: "flag.dov_why && !flag.dov_leaving && !flag.dov_ready" }),
        X(`'Nothing. Good luck with the box.'`)
      ]
    }),

    price_list: N("dov", `He unfolds a card from his breast pocket, a grubby thing in four colours of pencil. "Menu." He clears his throat. "Tram token, one coupon. Two for a pair, because I'm not a monster. Forged pass, three coupons, and it's the best in the district; Nadia stamps them herself. Cigarettes, by the pair. Reassurance, by the hour. Advice, free, and worth every penny."\n\nHe taps the bottom. "And under 'Other': the thing you actually want. Ask me. It's not on the card."`, {
      onEnter: [{ set: "dov_prices", val: true }, { xp: 1 }],
      interjections: [
        I("archive", 3, `A price list is a political document. Note the "reassurance". Hallmark of the black-market economy: the most valuable good is the one that cannot be forged.`),
        I("appetite", 3, `Cigarettes. Pairs. I can be brought to the point where I would pay three coupons for the second one.`)
      ],
      choices: [
        C(`[Buy a tram token. One coupon.]`, "hub", { cond: "has('ration_coupon') && !has('tram_token')", effects: [{ take: "ration_coupon" }, { give: "tram_token" }, { toast: "Tram token acquired." }], once: true }),
        C(`[Buy a forged pass. Three coupons.]`, "hub", { cond: "has('ration_coupon') && !has('forged_pass') && !flag.dov_free_pass", effects: [{ take: "ration_coupon" }, { give: "forged_pass" }, { toast: "Forged pass acquired." }], once: true }),
        C(`'Fine. Menu noted.'`, "hub")
      ]
    }),

    why: N("dov", `"Why tonight." He laughs, and it is a good laugh, quick and white. "Because it's the Jubilee. Because on the evening of the Jubilee every guard in the district is looking at a loudspeaker. The tram stop will have three men on it and every one of them will be watching the sky. You could take an elephant." He sits back on his heels. "Because I'm not brave, you know. I'm early. It's a talent, being early. I have never once been in a building when it burned. I've always, always left five minutes before."\n\nHe is smiling. He is also not looking at you.`, {
      onEnter: [{ set: "dov_why", val: true }, { xp: 2 }],
      interjections: [
        I("empathy", 4, `"I'm not brave, I'm early." He's been saying it for years. It is how he forgives himself for the buildings.`),
        I("instinct", 3, `A man leaving is trying to tell you something. He is leaving because he'd like to be asked not to.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    parcels: N("dov", `"Those." He hesitates. His hand goes to the nearest parcel, brown paper and string, with a pencilled 14 on it. "Don't laugh. You can't tell anyone. It would ruin me."\n\nHe opens it. Inside, wrapped in newspaper, are passes: sixteen, in a neat rubber-banded stack, every one a forged district movement pass with a different name in careful blue. Under them, a rank of tram tokens in a twist of cloth. On the slip of paper at the top is written, in his looping hand: FOR THE LITTLE ONES. NO CHARGE.\n\n"Eighty per cent of my stock," says Dov Kessel, in a small flat voice, "is charity. I am the worst dealer in the Union. I've been giving them away since the spring. To the ones who need out. A first-year with a baby sister. A girl whose father was taken. I keep a list. I keep a very short list of reasons I've never been caught, and it's mostly luck."`, {
      onEnter: [{ set: "dov_parcels", val: true }, { xp: 3 }, { morale: 1 }, { thought: "th_chosen_family" }],
      interjections: [
        I("empathy", 5, `The most hardened cynic in the dormitory is a one-man railway for the children of the Hunger Winter. He has hidden it behind a price list.`),
        I("sleight", 4, `Sixteen forgeries in a stack. The work is exquisite. It's the best work you've ever seen, and he does it for nothing.`),
        I("solidarity", 4, `We would like to throw our arms around him, and he would charge us for it.`)
      ],
      choices: [C(`'You're leaving them.'`, "hub")]
    }),

    stay_ask: N("dov", `"Stay." He says it like a word in a dead language. "And do what? Get caught? Be a hero? I have a perfectly lovely cowardice, and a seat on a tram." He looks at the parcels. "Who'd get them there? Somebody has to hand these out at the stop. Somebody who knows which child, which stamp. The Union doesn't do it. Nadia's busy being a criminal. It would have to be me. And I'd have to stay until the last one's on."\n\nHe shakes his head. "I am so very, very early."`, {
      interjections: [
        I("rhetoric", 4, `He's already thought it through. The only thing missing is permission.`),
        I("empathy", 4, `Don't tell him to be brave. Tell him he's already been.`),
        I("solidarity", 4, `Tell him we'd carry him if he fell. Tell him we'd be at the stop, at eight.`)
      ],
      choices: [
        K(`[Empathy] 'You've been brave for a year. You just did it in small change.'`, "empathy", 10, "dov_d3_stay_emp", "stay_pass", "stay_fail", { w: 1 }),
        K(`[Charm] Make him laugh. Make it a deal: he runs the platform, you owe him one.`, "charm", 10, "dov_d3_stay_charm", "stay_pass", "stay_fail", { w: 1 }),
        K(`[Solidarity] 'We'll be there. Everybody on that list. We won't leave you holding it.'`, "solidarity", 11, "dov_d3_stay_solid", "stay_pass", "stay_fail", { w: 1 }),
        C(`'Never mind.'`, "hub")
      ]
    }),

    stay_pass: N("dov", `He stares at the footlocker for a long moment. Then he laughs again, quite differently, a cracked unhappy delighted noise, and puts a hand over his eyes.\n\n"Damn you," he says. "I had a lovely cowardice." He takes his hand away. "All right. All right. I'll be on the platform at eight-twenty. I'll hand them out myself, name by name, with my own ugly hands, and I'll stay till Nadia pulls the bell. And you'll owe me a favour, a very big one, and I'll collect it in a year when you least expect it." He pushes the first parcel into your arms. "Here. A forged pass. For you. On the house. Don't read anything into it."`, {
      onEnter: [{ set: "dov_ally", val: true }, { set: "dov_ready", val: true }, { give: "forged_pass" }, { set: "dov_free_pass", val: true }, { task: "task_dov", state: "done" }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_dov", text: "Dov will be on the tram platform at 20:20, handing out sixteen free passes to the children on his list, and staying until Nadia rings the bell. He gave me a forged pass, on the house." }],
      interjections: [
        I("charm", 4, `A dealer, given a reason to be a hero, is a very rare creature. Enjoy him.`),
        I("solidarity", 4, `We are not leaving the little ones. We never were.`)
      ],
      choices: [C(`'Thank you, Dov.'`, "ready_again")]
    }),

    stay_fail: N("dov", `"No." He picks up the parcel and puts it back in the box with great gentleness, as if it might break. "No. I'm sorry. I'd like to. I really would. But I've been saved by being early for nineteen years and I don't know how to be late." His smile is a poor, bright thing. "I'll leave the sixteen at the platform with Nadia. She knows the faces. I won't wait."\n\nHe closes the lid.`, {
      onEnter: [{ set: "dov_leaving", val: true }, { morale: -1 }],
      choices: [X(`Leave him to it.`)]
    }),

    let_go: N("dov", `"Go." He looks stung. Then, honestly relieved, then, ashamed of being relieved. "Right. Well. Good. I'll, ah, leave the sixteen at the platform with Nadia. She'll know the faces." He picks up a roll of shirts and puts it down again. "You're a very decent person. I always did think that. It's a rotten trait in a revolutionary."\n\nHe presses something into your hand: a brass tram-token, warm from his pocket. "For the road. In case."`, {
      onEnter: [{ set: "dov_leaving", val: true }, { give: "tram_token" }, { xp: 1 }],
      choices: [X(`'Take care, Dov.'`)]
    }),

    leaving_again: N("dov", `Dov's footlocker is shut and strapped. He sits on it in his good coat with a cap pulled down over his eyes, and a paper bag of boiled sweets. He does not meet your eye.\n\n"Don't," he says. "I know the face. It's the look people give a man at a station." He shakes the bag. "Have a sweet. They're no good, but they're free."`, {
      choices: [
        C(`[Take a sweet.]`, "leaving_again", { effects: [{ morale: 1 }, { toast: "A boiled sweet. Nerve +1." }], once: true }),
        X(`'Good luck, Dov.'`)
      ]
    }),

    ready_again: N("dov", `Dov is in the middle of the dormitory floor with a lamp and a magnifying glass, putting the last touches to a rubber stamp. He does it with the dexterity of a watchmaker, breathing through his nose. The parcels are stacked by the door with the list on top.\n\n"Twenty past eight," he says, without looking up. "Platform. Don't be late. I'll be the one in the very obvious cap." He blows on the stamp. "I've never been so nervous. I've never been so busy. I think I'm in love with the administration."`, {
      interjections: [
        I("sleight", 4, `Watch the thumb on the stamp. A clean impression, a quarter-turn. It's like watching someone play the piano.`)
      ],
      choices: [X(`'See you on the platform.'`)]
    })
  }
},

// =====================================================================
wren_d3: {
  title: "Wren",
  start: [
    { cond: "flag.wren_ready", node: "ready_again" },
    { cond: "flag.wren_caught", node: "caught" },
    { node: "open" }
  ],
  nodes: {
    open: N("wren", `A small figure is sitting cross-legged on top of the wardrobe, ten feet up, eating a jam sandwich. A satchel hangs from a nail. She is about twelve. She has the haircut of somebody who cut it herself in a mirror in a hurry, and the unnervingly steady gaze of a creature who has seen the inside of every cupboard in the building.\n\n"Hello," says Wren, with her mouth full. "You're late. I've had the whole morning to be bored and I did a lot of crimes." She pats the satchel. "It's the Jubilee. Nobody notices a kid on a Jubilee. I've had nineteen offers of work since breakfast and I've said yes to all of them. Do you want in? I've got a big one."`, {
      interjections: [
        I("instinct", 3, `A very small, very dangerous creature. She's quick, and she's honest in the way that cannot be taught.`),
        I("empathy", 4, `Under the grin she is waiting for you to say no. She's heard it from everyone else.`),
        I("charm", 3, `Be nice. Don't be patronising. She'd smell it and charge you for it.`)
      ],
      choices: [C(`'What's the big one?'`, "hub")]
    }),

    hub: N("wren", `"Sit." She doesn't come down. She doesn't need to. "I'll tell you what I know, and then you'll tell me whether I'm allowed to do it. I'm going to do it anyway, but it is polite to ask."`, {
      choices: [
        C(`'Tell me about the big job.'`, "job", { cond: "!flag.wren_job" }),
        C(`'The man in the black car. Your note.'`, "car", { cond: "(has('wren_note') || flag.wren_ally) && !flag.wren_car" }),
        C(`'How old are you, Wren?'`, "age", { cond: "!flag.wren_age" }),
        C(`[Accept.] 'All right. You carry for us tonight.'`, "accept", { cond: "flag.wren_job && !flag.wren_ready && !flag.wren_caught" }),
        C(`[Refuse.] 'It's too dangerous. You're a child.'`, "refuse", { cond: "flag.wren_job && !flag.wren_ready && !flag.wren_refused" }),
        X(`'Later.'`)
      ]
    }),

    job: N("wren", `"A run." She lowers her voice to the volume of a hot rumour. "Five messages, five people, between seven and eight. When the first stroke comes, they've all got to know. You can't tell them aloud. There are poles with ears. So I carry a word to each, in my head, and I run: the Cook, the cellar, the girl with the radio, the choir, the old man at the kiosk. Four minutes between each. I've timed it. I take the stair behind the Library and the pipe-gap behind the Hall."\n\nShe leans forward. "I'll be a little late for the last one. It's the Relay. Somebody has to go through the Vanguard cordon on the avenue. I've got a plan for that." She grins. "It involves a rabbit."`, {
      onEnter: [{ set: "wren_job", val: true }, { xp: 2 }],
      interjections: [
        I("deduction", 4, `Five stops, four minutes each, and a stair nobody uses. It's a very good route. It will fail only if one person on it is in the wrong place at the wrong time.`),
        I("volition", 4, `She is twelve. She has a plan that involves a rabbit. Do not talk yourself into thinking that is safe.`),
        I("authority", 3, `A courier line is exactly what the cell needs. The children are the only people in the Union who can walk through a barrier carrying a secret.`)
      ],
      choices: [C(`'A rabbit?'`, "rabbit"), C(`Go on.`, "hub")]
    }),

    rabbit: N("wren", `"His name's Colonel," says Wren, and lifts the lid of the satchel. Inside, on a nest of newspaper, a very large grey rabbit regards you with deep, contemptuous calm. "He's got a pass. It's a real one, from the Vanguard, for a Pet of Merit. He's been on the roll for two years. Nobody checks a rabbit. If I'm stopped I say I'm taking Colonel to the Jubilee to be honoured, and I cry a bit, and they let me through." She strokes his ear. "He has never once been arrested."`, {
      onEnter: [{ set: "wren_rabbit", val: true }, { xp: 1 }, { morale: 1 }],
      interjections: [
        I("charm", 4, `Pet of Merit. It's the best forged document in the Union and it's real.`),
        I("archive", 3, `Vanguard Pet of Merit, Class Two. The regulation exists. It has been used four times in history. Three of them were Wren.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    car: N("wren", `"Oh, that." Her face changes, and for a moment she is the age she is. "I climbed in. Yesterday, on the avenue. The black car. The door was open and the man was asleep in the back with his coat over his face, and I thought, I'll take his pen. I got as far as the pen." She picks at the sandwich. "He was crying. Not loud. In his sleep, like a baby. He said a name. A girl's name, I think, just the one word, over and over, like something you say so as not to lose the shape of it."\n\nShe looks at you. "I put the pen back. I put a boiled sweet on his chest. I don't know why. He's the man who's going to make everyone forget, and he was crying in his sleep, and I gave him a sweet." She shrugs, very hard. "I'm not sorry."`, {
      onEnter: [{ set: "wren_car", val: true }, { set: "wren_saw_voss_cry", val: true }, { xp: 3 }, { thought: "th_inspector_charm" }],
      interjections: [
        I("empathy", 5, `A girl's name, said over and over in his sleep. The girl he forgot, or the girl who forgot him. Whichever way it goes, he keeps saying it so as not to lose the shape.`),
        I("instinct", 4, `Wren gave him a sweet. That's what a child would do. He'll find it in his pocket tonight and not know why he's moved.`),
        I("solidarity", 4, `We are not so different from him. That's the most dangerous thought we have ever had.`)
      ],
      choices: [C(`'You did the right thing.'`, "hub", { effects: [{ morale: 1 }] })]
    }),

    age: N("wren", `"Eleven. And three-quarters. I'm not telling people twelve any more, because they nod, and at eleven they don't." She finishes the sandwich with great seriousness. "I was in the Home before I was here, the Vanguard one. They taught me to count. I can count anything. I've counted every step in this building: three hundred and forty-two to the tower, ninety-one to the cellar, nineteen to the kitchen. I count so I don't get lost."\n\nShe looks at her crusts. "My mum used to say that. 'Count, so you don't get lost.' I don't remember the rest of her. Just that."`, {
      onEnter: [{ set: "wren_age", val: true }, { xp: 2 }, { morale: -1 }],
      interjections: [
        I("empathy", 5, `Eleven and three-quarters. She is counting so as not to disappear. You are listening to the quietest sentence in the dormitory.`),
        I("archive", 3, `Wren, ward of the Vanguard Home, Cinder Street. Admitted at age six. Mother: not recorded. Father: not recorded. Everything else: counted.`, { cond: "flag.rhea_homes || flag.rhea_turned" })
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    accept: N("wren", `"Right." She slides down the wardrobe as though it were a banister, lands like a cat, and shoulders the satchel. Colonel makes a noise like a small disapproving engine. "Five messages. I need the words." She looks up at you with total attention. "Say them once. I'll remember. I always do."\n\nYou choose five short sentences. She says them back, perfect, each one in the right voice. Then she holds out her hand, small, ink-stained, ferociously clean. "Deal," says Wren. "If I get caught I'll tell them I was only taking Colonel to be honoured."`, {
      onEnter: [{ set: "wren_ready", val: true }, { set: "wren_ally", val: true }, { task: "task_wren", state: "done" }, { xp: 4 }, { morale: 2 }, { thought: "th_chosen_family" },
        { note: "task_wren", text: "Wren will carry five messages between seven and eight: the Cook, the cellar, Ilsabet, the choir, and Gregor. She will go through the Vanguard cordon with a rabbit named Colonel." }],
      interjections: [
        I("volition", 4, `You've said yes to an eleven-year-old. You'll want to be the one to see her home.`),
        I("solidarity", 4, `A courier. A rabbit. We have never had a better line of communication.`),
        I("reflex", 3, `Run, then. Keep running. Nobody catches a kid who knows the pipe-gap.`)
      ],
      choices: [C(`Shake her hand.`, "ready_again")]
    }),

    refuse: N("wren", `The grin goes out like a light. "I'm not a child." She puts the satchel on very slowly. "I've never been one. I was a number in a Home and then a thief in a dormitory. Nobody asked if I was too young for that." She looks at you with an old, level, wounded look. "You're not going to stop me. You know that. You're only going to make me do it without anybody knowing where I am."\n\nShe shoulders the satchel.`, {
      onEnter: [{ set: "wren_refused", val: true }, { morale: -1 }],
      interjections: [
        I("empathy", 5, `She's right. You are only choosing whether someone knows where she is.`),
        I("volition", 5, `Say yes, or say you'll go with her. Don't let her go alone.`)
      ],
      choices: [
        C(`'...All right. But I go with you to the first stop.'`, "accept", { effects: [{ ideo: "undercurrent", n: 1 }] }),
        C(`'Do as you like, then.'`, "caught_fall")
      ]
    }),

    caught_fall: N("narrator", `She slides off the wardrobe, shoulders the satchel and goes, without a word, through the door and down the stairs, small boots drumming. You hear her all the way to the courtyard. Then you don't.\n\nAt the window, a half-hour later, you see the Vanguard cordon at the avenue's end, a small figure with a rabbit in her arms, and a hand coming down on her collar.`, {
      onEnter: [{ set: "wren_caught", val: true }, { task: "task_wren", state: "failed" }, { surv: 5 }, { morale: -3 }],
      interjections: [
        I("volition", 5, `You said "as you like." She did. That is the whole of it.`),
        I("empathy", 5, `Look away from the window. Not because it isn't yours. Because you will need your eyes for the evening.`)
      ],
      choices: [X(`Go.`)]
    }),

    caught: N("wren", `The top of the wardrobe is empty. The nail where the satchel hung is empty. The dormitory has the clean, still, wrong silence of a room with one fewer person in it than the Bell would have you believe.\n\nOn your pillow someone has left a boiled sweet, and a folded square the size of a matchbox. On the front, in a child's capital letters: SORRY. I TOOK COLONEL.`, {
      interjections: [
        I("empathy", 5, `She's in a cell with a rabbit. She's not afraid. She will be, later.`),
        I("authority", 4, `If you want her back, the price is the Inspector. He's the only one with the authority to release a child from a cordon.`, { cond: "flag.voss_met" })
      ],
      choices: [X(`Go.`)]
    }),

    ready_again: N("wren", `Wren is lying on her back on the dormitory floor with her feet up on the bed and Colonel on her stomach, reciting under her breath: "Cook, cellar, Lamp, choir, kiosk. Cook, cellar, Lamp, choir, kiosk." Colonel looks at the ceiling as if it had insulted him.\n\n"I'm resting," she says, without opening her eyes. "A courier has to be rested. It's in the Rules." She lifts one hand. "Don't worry about me. I've counted every step. I always come home."`, {
      interjections: [
        I("empathy", 4, `"I always come home." She's saying it for the room. She's saying it to the part of herself that counts.`)
      ],
      choices: [
        C(`[Give her a sweet roll or a biscuit.]`, "ready_again", { cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }, { morale: 2 }, { toast: "Wren eats the roll in two bites. Colonel gets the crumbs." }], once: true }),
        X(`'Run safe, Wren.'`)
      ]
    })
  }
},

// =====================================================================
ysolde_d3: {
  title: "Librarian Crane",
  start: [
    { cond: "flag.ysolde_ready", node: "ready_again" },
    { cond: "flag.library_stacks_open", node: "open_hub" },
    { node: "closed_open" }
  ],
  nodes: {
    closed_open: N("ysolde", `"The reading room is open to readers," says Ysolde Crane, without raising her eyes from the catalogue card she is correcting. "The back stacks are open to Authorised Readers. You are, I regret, a reader." She slots the card into its drawer with the click of a small door closing. "It is the Jubilee. Nobody will read today. Yet I have never seen the Library so full of people pretending not to need a book."\n\nThe rope across the back stacks says AUTHORISED READERS in the font of someone who is not worried. Behind it, in the dimness, shelves rise to the ceiling like the ribs of something that is breathing very quietly.`, {
      interjections: [
        I("archive", 3, `Ah. A true librarian. Nothing so thrilling as a woman with a catalogue and a rope. Ask her the right question, in the right classmark. It's a password disguised as a cataloguing error.`),
        I("senses", 3, `Dust, vellum, glue, old tea. Something faintly electrical from the back stacks: a lamp left on, a long way in.`),
        I("empathy", 4, `She is waiting for you to ask. She has been waiting two days. It's why she hasn't looked up.`)
      ],
      choices: [
        K(`[Archive] 'I'd like to consult Classmark 000: Facts, Reclassified.'`, "archive", 9, "ysolde_d3_classmark", "stacks_open", "stacks_fail", { w: 1 }),
        C(`[The Quiet Hours.] Show her the plain brown book.`, "stacks_open", { cond: "has('banned_book') || flag.quill_book_read" }),
        C(`'Just browsing.'`, "closed_hub")
      ]
    }),

    closed_hub: N("ysolde", `"Browsing." She says it with delicate scepticism. "In a library, on the Jubilee. Well. Everything is permitted in moderation, except of course what isn't." She sets her pencil down at precisely the right angle. "Is there anything I can find you?"`, {
      choices: [
        K(`[Archive] 'Classmark 000: Facts, Reclassified.'`, "archive", 9, "ysolde_d3_classmark2", "stacks_open", "stacks_fail", { w: 1, cond: "!flag.ysolde_classmark_tried" }),
        C(`[The Quiet Hours.] Show her the plain brown book.`, "stacks_open", { cond: "has('banned_book') || flag.quill_book_read" }),
        X(`'No. Thank you.'`)
      ]
    }),

    stacks_fail: N("ysolde", `"I'm afraid that classmark does not exist," says Ysolde, pleasantly. "You will find it is a mistake, probably yours." She resumes the card. "Do come back when you have the correct form of words. I'm told it is a lovely word. Nobody has said it to me for years."\n\nIt was not the right wording. It was, you realise, close. She is not offended. She is, in a dry way, disappointed for you.`, {
      onEnter: [{ set: "ysolde_classmark_tried", val: true }],
      choices: [X(`Go.`)]
    }),

    stacks_open: N("ysolde", `The pencil stops. She lifts her head, and for the first time looks at you properly through her round glasses, and her face is entirely different: bright, dry, delighted.\n\n"Well," she says. "There it is." She unhooks the rope from its post with a tiny, ceremonious flick, and the AUTHORISED READERS sign swings and turns its blank back. "I have been waiting for somebody to ask for three years. Do mind the step. It's a very old step and it has seen worse than you."\n\nThe back stacks open before you in the lamplight like the nave of a church built by people who preferred accuracy to God.`, {
      onEnter: [{ set: "library_stacks_open", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_forbidden_page" }, { task: "task_stacks", state: "done" }],
      interjections: [
        I("archive", 4, `The shelves are labelled in four hands. FICTION is on the upper level. FACTS are on the lower level, and have been reclassified as fiction. Quite the neatest piece of dissidence I have ever seen.`),
        I("senses", 4, `Warm. Not cold, as a forbidden room should be. Somebody has been airing these books for years, in secret, one shelf at a time.`),
        I("solidarity", 4, `We would like to live here. We would like to put a small bed between Geography and Revolt.`)
      ],
      choices: [C(`Walk in.`, "open_hub")]
    }),

    open_hub: N("ysolde", `"Welcome to the sort of library a library should be." Ysolde Crane stands with her hands clasped at her waist, between rows of shelves bowed under the weight of everything the Ministry has been trying to lose. "Fiction is upstairs. Facts are down here. I have catalogued forty thousand, one hundred and twelve items and read eleven. A librarian who reads is a deviant. A librarian who doesn't is a clerk. I chose a middle path."`, {
      interjections: [
        I("archive", 3, `Forty thousand, one hundred and twelve. Eleven read. The ratio is a quiet scandal. I am so happy for her.`),
        I("empathy", 4, `She says it as a joke. It's a confession. She has spent a lifetime walking past the things she most wanted to read.`)
      ],
      choices: [
        C(`'What's in the Index? The one you keep in the drawer.'`, "index", { cond: "!flag.ysolde_index" }),
        C(`'The stair to the tower. Could you open it?'`, "tower", { cond: "!flag.tower_open && !flag.ysolde_tower" }),
        C(`'Why did you become a librarian?'`, "why", { cond: "!flag.ysolde_why" }),
        C(`'If the Vanguard comes for the Index, what happens?'`, "raid", { cond: "flag.ysolde_index && !flag.ysolde_raid" }),
        C(`'Where should the Index be tonight?'`, "hide", { cond: "flag.ysolde_index && !flag.ysolde_hidden" }),
        C(`'At eight, will you help?'`, "ready", { cond: "flag.ysolde_index && !flag.ysolde_ready" }),
        X(`'Thank you, Miss Crane.'`)
      ]
    }),

    index: N("ysolde", `She opens the drawer of the oak catalogue and lifts out a card, one of thousands, in black ink. A small neat hand: HUNGER WINTER, DAY 1. CITY-WIDE. SEE ALSO: NOT HAPPENED. The next: REEDMARSH PASS, 9 TO 14 MARCH. SEE ALSO: GLORIOUS. The next: TOBAR PRESCH, TENOR, ENROLMENT 11 YEARS, WITHDRAWN. SEE ALSO: CORRECTIVE COURSE.\n\n"The Counter-Catalogue," she says. "Everything the Ministry took out of the record, indexed by date, in the order it was removed. I add a card every morning, from the fragments people bring me: a name, a street, a smell. I started it the day I noticed I'd forgotten to be sad about something. I didn't know what. I simply noticed the gap."\n\n"It is the only history of this district that is not a lie, and it's on three-by-five cards."`, {
      onEnter: [{ set: "ysolde_index", val: true }, { xp: 3 }, { thought: "th_forbidden_page" }],
      interjections: [
        I("archive", 5, `Indexed by date of removal. That is a work of staggering genius. No one has ever indexed what was lost. You can read the shape of the forgetting.`, { effects: [{ xp: 1 }], once: true }),
        I("rote", 3, `SEE ALSO: GLORIOUS. SEE ALSO: NOT HAPPENED. (SEE ALSO: ME. ME. ME. I'M ON A CARD. SOMEWHERE I'M ON A CARD.)`),
        I("empathy", 5, `She began it because she noticed she'd forgotten to be sad. That's the whole of the Undercurrent in a card-index drawer.`)
      ],
      choices: [C(`Look for a card with your name.`, "your_card", { cond: "!flag.ysolde_yours" }), C(`Go on.`, "open_hub")]
    }),

    your_card: N("ysolde", `She nods, quite gravely, and with one finger draws a card from a drawer near the back. It is newer than the rest, in the same small hand: THE ONE WITH THE RINGING. TUESDAY, 23:10 TO 02:10. SEE ALSO: THE LEDGER. SEE ALSO: HOB'S KNOT. SEE ALSO: MATRON'S GREEN. SEE ALSO: FORGIVENESS (UNSPECIFIED).\n\n"I began it Wednesday," she says. "From the people who'd seen you. I don't know what you did. Everybody who saw you has the same hole in the same place, and the same warm feeling. It's the strangest card I own." She turns it over. "In the morning, if the Bell takes it, you'll want to read it. Please do. It's a very decent card."`, {
      onEnter: [{ set: "ysolde_yours", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_ghost_of_yesterday" }],
      interjections: [
        I("empathy", 5, `Forgiveness (unspecified). She's catalogued a thing she doesn't understand and filed it under the only word she could find.`),
        I("volition", 4, `You were somebody. It is on a card. Nobody can take a card away from a librarian.`)
      ],
      choices: [C(`Go on.`, "open_hub")]
    }),

    tower: N("ysolde", `"The stair." She goes to a bookcase that is not, strictly, a bookcase, and takes down a very large atlas of the Eastern Provinces. A key hangs behind it on a hook. A plain iron key, polished by fingers. "Spiral staircase, a hundred and twelve steps, a bolt with an oil can on a string. The Ministry thinks it was bricked up after the Jubilee of '78. It was, in a sense. We bricked it up with a book."\n\nShe presses it into your palm. "There's a bellringer at the top. He doesn't speak. Bring him something warm."`, {
      onEnter: [{ set: "ysolde_tower", val: true }, { set: "tower_open", val: true }, { xp: 3 }, { note: "task_hob", text: "Ysolde gave me the key to the tower stair, hidden behind an atlas of the Eastern Provinces. 'Bring him something warm.'" }],
      interjections: [
        I("archive", 3, `"Bricked up with a book." The most accurate description of Ministry architecture I have encountered.`),
        I("appetite", 3, `Something warm. Yes. Yes. I have a thermos situation. It can be resolved.`, { cond: "has('thermos') || has('ration_tea')" })
      ],
      choices: [C(`Take the key.`, "open_hub")]
    }),

    why: N("ysolde", `"Why." She smiles at the shelf rather than at you. "My mother kept a library in a cupboard. A cupboard under the stairs. It had thirty-one books. She called it the Reading Room. When I was seven, men came and took the cupboard door off its hinges and the books out of the cupboard and my mother out of the house, and she didn't come back. I remember the door. I remember it as the best door we had."\n\nShe straightens a spine that did not need it. "I thought: someone ought to keep the cupboard. I just made it larger."`, {
      onEnter: [{ set: "ysolde_why", val: true }, { xp: 2 }, { morale: 1 }],
      interjections: [
        I("empathy", 5, `She built a library out of a cupboard. It's the only reason anyone builds one.`),
        I("the_grey", 4, `A door taken off its hinges. I remember the sound. It went through the whole street and I was a street.`)
      ],
      choices: [C(`Go on.`, "open_hub")]
    }),

    raid: N("ysolde", `"The Vanguard." She glances at the door. "Corvin Hale, among others, has taken to the stacks of late with a notebook and a face like a hungry hen. If he reads the right card he will understand it. If he understands it he'll tell. It is, ah, a matter of degree." She taps the oak. "I've a procedure. The Index is on cards. Cards can be moved. A librarian is, in the last resort, a professional mover of paper."\n\nShe lowers her voice. "At five past seven, the Inspector's people will come for a 'routine inspection'. They'll find a very dull library."`, {
      onEnter: [{ set: "ysolde_raid", val: true }, { xp: 2 }],
      interjections: [
        I("deduction", 4, `If Corvin informs, the raid is at seven. If he doesn't, it may never come. Either way, move the cards.`, { cond: "flag.corvin_informs || flag.corvin_ally === undefined" }),
        I("sleight", 4, `Forty thousand cards. A small satchel. A coat with a lining. It can be done in an hour with two pairs of hands.`)
      ],
      choices: [C(`'Where do they go?'`, "hide")]
    }),

    hide: N("ysolde", `"Three places," she says, ticking them off on the long thin fingers. "The tower: up among the bellringer's cords, a thousand names on a wall, and a card-index would look like a very tidy rope. The Boiler: Mother Anka's cellar, where it's warm and dry and nobody looks. Or the stove." She doesn't look at the stove. "I don't want to burn it. I'd do it. I'd do it if I had to. But it would be the end of a very small, very stubborn thing."`, {
      onEnter: [{ xp: 1 }],
      interjections: [
        I("volition", 4, `Whichever you choose, someone else will have to know where. It has to be a person who can be trusted not to forget.`),
        I("empathy", 4, `She does not want to burn it. Don't make her say so.`)
      ],
      choices: [
        C(`'The tower. Give them to Hob.'`, "hidden_tower", { cond: "flag.tower_open" }),
        C(`'The boiler. Anka will keep them.'`, "hidden_boiler"),
        C(`'Burn them. Keep them in your head.'`, "hidden_burn"),
        C(`Think about it.`, "open_hub")
      ]
    }),

    hidden_tower: N("ysolde", `"The tower." Her eyes shine. "Among the cords. A bellringer who doesn't speak and a wall of names he's already begun, and now a drawer of cards beside it." She takes down the first drawer, six hundred cards in a long dark tray, and puts her hand on the lid. "I'll carry the first load now. In my coat. It's a hundred and twelve steps and I've not been up them in thirty years."\n\nShe is crying, a little, and very quietly. "Do you know it was always meant for a tower? The whole history of the Union, on a wall, seen from a long way off."`, {
      onEnter: [{ set: "ysolde_hidden", val: true }, { set: "ysolde_index_tower", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_hob_bell" }],
      interjections: [
        I("solidarity", 4, `A wall of names and a drawer of cards: the two halves of the same memory, in the same place. It's what we are. A tower with an index.`),
        I("archive", 4, `Hob's cords, one thousand, one hundred and ninety-one. Her cards: forty thousand. Together, a census of the dead and a chronology of the forgetting.`)
      ],
      choices: [C(`Help her carry the first tray.`, "open_hub")]
    }),

    hidden_boiler: N("ysolde", `"The boiler. Of course." She nods briskly, with a slightly rueful smile. "A drawer in the cellar. It's warm there. The paper will curl a little at the edges but it'll keep." She fetches a flat leather satchel and begins to lay the cards in it, layer by layer, with the delicate tenderness of someone loading a coffin. "Anka will have forty thousand cards to look after. She'll hate me for a week."`, {
      onEnter: [{ set: "ysolde_hidden", val: true }, { set: "ysolde_index_boiler", val: true }, { xp: 2 }, { morale: 1 }],
      choices: [C(`Help her load the satchel.`, "open_hub")]
    }),

    hidden_burn: N("ysolde", `She does not say anything for a very long time. She puts both hands on the oak catalogue. Then, in the small voice of a person asked to cut down a tree she planted, she says: "Yes. All right." She walks to the stove. She opens the iron door. She takes out the first card, and reads it, and puts it in.\n\nIt takes an hour. She reads every one. By the end, she is sitting on the floor with a pile of ash in front of her and a very straight back. "I have them in my head," she says. "I think. I'll know in the morning."`, {
      onEnter: [{ set: "ysolde_hidden", val: true }, { set: "ysolde_index_burned", val: true }, { set: "burned_something", val: true }, { xp: 1 }, { morale: -3 }, { time: 40 }, { thought: "th_burned_paper" }],
      interjections: [
        I("empathy", 5, `Forty thousand cards. You asked her to burn forty thousand cards. She did it.`),
        I("volition", 4, `That was necessary, perhaps. It was not nothing. Remember that you asked.`)
      ],
      choices: [C(`Sit with her on the floor.`, "open_hub")]
    }),

    ready: N("ysolde", `"At eight." She considers the Library with its long shelves and its lamp-lit stacks. "I'm told the Library's reading-room speaker is one of the few in the building not on the district feed. It was put in for the reading hour, in the Warden's father's time. I can read into it, from the desk." She takes a card from her sleeve. HUNGER WINTER, DAY 1. SEE ALSO: NOT HAPPENED.\n\n"I shall read the dates. The ones that were removed. In order. It'll go out over the Library and the courtyard, to anyone who is near enough to hear. It won't reach the district. But it will reach the ones who need to be reminded that it's possible." She squares the card. "A roll-call. Of everything we were told we hadn't done."`, {
      onEnter: [{ set: "ysolde_ready", val: true }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_jubilee", text: "Ysolde will read the Counter-Catalogue aloud over the Library speaker at eight: a roll-call of every removed date." }],
      interjections: [
        I("rhetoric", 4, `A roll-call of what was lost. It is a very old form, and it has never once failed to move a room.`),
        I("archive", 4, `Ordered by date of removal. Hunger Winter first. Reedmarsh next. Osk's wife. Tobar. Ostrov. A litany.`)
      ],
      choices: [C(`'Thank you, Miss Crane.'`, "ready_again")]
    }),

    ready_again: N("ysolde", `Ysolde is at the desk with a card in each hand, reading each in turn under her breath in a soft, level, practising voice. Date. Place. See also. The lamp makes a gold circle on the blotter. The back stacks are open behind her, and a few readers have crept in, one at a time, to stand among the shelves with the stunned look of people entering a church they were told did not exist.\n\n"Mm?" she says, not looking up. "Yes. It's very hard to do it well. One has to mean each one."`, {
      choices: [X(`'See you at eight.'`)]
    })
  }
},

// =====================================================================
quill_d3: {
  title: "Ambrose Quill",
  start: [
    { cond: "flag.quill_ready", node: "ready_again" },
    { cond: "flag.quill_lectured", node: "after_lecture" },
    { node: "open" }
  ],
  nodes: {
    open: N("quill", `"Ah. An audience. How very unexpected." Ambrose Quill has been arranged in the reading room's biggest armchair like a coat on a hook, with a rug over his knees, a cough in his chest and a stack of forty index cards tied in a bootlace on the table at his elbow. Two first-years sit cross-legged by the radiator, a girl with a plait and a boy with a runny nose, pretending to read.\n\n"I am told the reading room closes for the Jubilee at three," he says, "and I am told that a retired historian of no fixed department may not give instruction on a day of national gladness. It is a pity. I was about to give my last lecture." He folds his hands. "I have never given a last one before. I understand one gets to say anything. Do sit."`, {
      interjections: [
        I("rote", 3, `DR AMBROSE QUILL: LECTURER IN THE MODERN HISTORY OF THE UNION, RETIRED. REASON FOR RETIREMENT: NOT AVAILABLE. REASON FOR RETIREMENT: SEE ALSO, ME, BEING FIRED.`),
        I("empathy", 4, `He is dying, or he thinks he is. He's chosen to be funny about it, and he's doing it for two children and a radiator.`),
        I("senses", 3, `The cough has a wet little rattle at the bottom. Camphor, tobacco, ink. The rug has a scorch mark in the shape of a small continent.`)
      ],
      choices: [C(`Sit with the first-years.`, "hub")]
    }),

    hub: N("quill", `"Now," says Quill. He rubs his hands. "There are three things a lecturer may do: begin, continue, or beg. I propose to do the first two and, if the coughing gets out of hand, the third." He looks over his half-moon glasses. "Would you care to hear about the Bell?"`, {
      interjections: [
        I("archive", 3, `A man who has been waiting two years to deliver this exact lecture. He's drafted it, and redrafted it, and sat with it in his lap.`)
      ],
      choices: [
        C(`'Yes. Begin.'`, "lecture_1", { cond: "!flag.quill_l1" }),
        C(`'Go on to the second part.'`, "lecture_2", { cond: "flag.quill_l1 && !flag.quill_l2" }),
        C(`'The last part. Please.'`, "lecture_3", { cond: "flag.quill_l2 && !flag.quill_l3" }),
        C(`'Dr Quill, you said "I wish I had written it." About the book.'`, "author", { cond: "(has('banned_book') || flag.quill_book_read) && !flag.quill_author" }),
        C(`'Could I borrow the cards?'`, "cards", { cond: "!has('quill_notes') && flag.quill_l3" }),
        X(`'Thank you, Doctor. Another time.'`)
      ]
    }),

    lecture_1: N("quill", `"The Bell was a kindness." He lets that sit. "I know. I see the faces. The girl has stopped doodling, which is a record. It was a kindness. After the Hunger Winter, in the first spring, there were two hundred thousand people in the district who could not sleep. They could not sleep because they could not stop eating the glue in their heads, if you follow me. They were unwell. Not in the stomach. In the night."\n\n"A physician at the Tarnov sanatorium devised a tone. A very gentle tone, with a beat folded into it, played softly in the wards at nine. They slept. For the first time in four months, whole wards slept. It was, my dears, one of the most humane inventions of the century. I cannot say it enough. It was for them."`, {
      onEnter: [{ set: "quill_l1", val: true }, { xp: 2 }, { thought: "th_quiet_hours" }],
      interjections: [
        I("archive", 4, `The Convalescent Tone, Tarnov Sanatorium, spring of the First Thaw. That part is true. The Ministry's pamphlets cite it constantly, with a photograph of a sleeping child.`),
        I("empathy", 5, `Rhea's mother and the glue. They were not liars. They were people who did a kind thing and then could not stop.`, { cond: "flag.rhea_homes || flag.rhea_turned" }),
        I("dialectics", 4, `A kindness. Not a crime in origin. A crime in duration. The deepest sort of tyranny starts as a lullaby.`)
      ],
      choices: [C(`'And then?'`, "hub")]
    }),

    lecture_2: N("quill", `"And then it was adopted." He coughs. "A ministry was formed to administer it, the Ministry of Quiet Hours, whose original brief was entirely clear: the tone was to be played 'for the duration of national grief'. I have the Act." He taps the cards. "Article Nine. It is a very short Article. 'The Quiet Hours shall be broadcast nightly so long as the public grief requires, to be reviewed at each Jubilee of the Warden, and shall lapse upon the day on which the public memorial of the Winter is restored to the people.'"\n\nHe takes off his spectacles. "Restored. Not 'completed'. Restored. It is a law that requires itself to end, if anyone had the nerve to read it aloud."`, {
      onEnter: [{ set: "quill_l2", val: true }, { set: "quill_clause_known", val: true }, { xp: 3 }, { thought: "th_grand_harmony" }, { note: "task_jubilee", text: "Quill: Article Nine of the Quiet Hours Act says the broadcasts lapse on 'the day on which the public memorial of the Winter is restored to the people'. Reviewed each Jubilee. Tonight's Grand Harmony is the renewal." }],
      interjections: [
        I("archive", 5, `Article Nine, quiet-hours sunset clause. It is real. I have a copy in my head, which is a rotten place to keep a law. It is, however, in perfect order.`, { effects: [{ xp: 1 }], once: true }),
        I("rhetoric", 5, `A law that requires itself to end if the public memorial is restored. Say it aloud in a hall with the lights on and the Warden's Ministry is, by its own statute, a corpse.`),
        I("dialectics", 5, `Tonight's Grand Harmony is the "review at each Jubilee". Seventy-two hours of forgetting is the renewal ceremony. Which means the Ministry must erase the memorial, every time, so as not to lapse. That is the whole machine in a sentence.`)
      ],
      choices: [C(`'That's why they erase the Winter.'`, "hub")]
    }),

    lecture_3: N("quill", `"Now," says Quill, "a question. Hands up." The first-years look at each other. "No? Then I shall pick on the visitor." He fixes you with an eye like a tired owl. "What is the one thing a bell cannot do?"\n\nThe radiator ticks. The boy with the runny nose has stopped sniffing. It is, you realise, a very good question. There is a right answer. It has been waiting two years for somebody to give it.`, {
      interjections: [
        I("rote", 3, `A BELL CANNOT BE UNRUNG. (This is in the Orthodoxy. It is the proverb of a nation that would like it to be true.)`),
        I("rhetoric", 4, `Don't give the first answer. Give the one that surprises him.`),
        I("the_grey", 4, `A bell cannot choose who hears it. I think. I'm a city. We've been hit by a great many bells.`)
      ],
      choices: [
        K(`[Rhetoric] 'It cannot be rung quietly. A bell that tries is a bell that isn't.'`, "rhetoric", 10, "quill_d3_quiz_rhet", "quiz_pass", "quiz_fail", { w: 1 }),
        K(`[Dialectics] 'It cannot say what it was rung for. Only that it was rung.'`, "dialectics", 10, "quill_d3_quiz_dial", "quiz_pass", "quiz_fail", { w: 1 }),
        K(`[Rote] 'It cannot be unrung.' (The proverb.)`, "rote", 8, "quill_d3_quiz_rote", "quiz_pass", "quiz_fail", { w: 1 })
      ]
    }),

    quiz_pass: N("quill", `A smile spreads across his face like a slow sunrise on a bad lake. He taps the arm of the chair, three times, with a very small and very proud hand.\n\n"Gold star," he says. "Gold star, and I do not give them. A bell cannot be rung quietly. Quite so. A silence is a thing that happens between bells. A Bell that is meant to produce silence is an instrument of the opposite principle." He coughs for some time, and wipes his mouth, and beams. "Girl with the plait. Did you hear? That's what a mind does. It rings."\n\nHe presses the stack of forty cards, bound in a bootlace, into your hands. "My notes. You'll find them accurate. You'll find them, I'm afraid, funny."`, {
      onEnter: [{ set: "quill_l3", val: true }, { set: "quill_lectured", val: true }, { give: "quill_notes" }, { xp: 4 }, { morale: 3 }, { thought: "th_forbidden_page" }],
      interjections: [
        I("charm", 4, `He gave you a gold star. In front of children. It's the most beautiful thing he's ever done.`),
        I("solidarity", 4, `We would like to say it was all of us who answered. We would like to say we are not alone in the classroom.`)
      ],
      choices: [C(`Take the cards.`, "hub")]
    }),

    quiz_fail: N("quill", `"Ah. Not quite." He is not disappointed. He lifts a hand, gentle, like a man correcting a child's grip on a pencil. "Close. Very close. A good first attempt. You'll be right by Friday, if there is a Friday." He coughs; the girl with the plait brings him water. "A bell cannot be unrung, they say, and it is a very good answer, and a very wrong one. Because the whole of this district has been unrung nightly for thirty years, and it is rung again every morning. The whole point of the Bell is that it can."\n\nHe squeezes your hand, once. "It's the answer of a person who is tired. I recognise it. I have given it myself."`, {
      onEnter: [{ set: "quill_l3", val: true }, { set: "quill_lectured", val: true }, { give: "quill_notes" }, { xp: 2 }, { morale: 1 }],
      interjections: [
        I("empathy", 4, `He isn't scolding. He's reassuring. A good teacher is someone who can fail you and make it feel like a hand on the shoulder.`)
      ],
      choices: [C(`Take the cards, and go on.`, "hub")]
    }),

    author: N("quill", `He goes quiet. The first-years look from one of you to the other. He picks up the brown-covered book from the table, turns it over, and runs a thumb along the spine, quite slowly.\n\n"I did say that." His voice is a thread. "Every time I read it. 'I wish I had written it.' It's such a good book, you see. It has a voice I recognise: the little rhetorical cough before a joke, the way the footnotes get angrier as they go. I've always thought it was written by someone who was very like me. Only braver."\n\nHe looks at it. "I have a very odd feeling in my chest that is not the cough. 'See also: me, being fired.' I wrote that on the cards. I wrote it in a hand that is the same as the hand on the flyleaf."`, {
      onEnter: [{ set: "quill_author", val: true }, { xp: 3 }, { morale: 1 }, { thought: "th_borrowed_memory" }],
      interjections: [
        I("deduction", 5, `He wrote it. A Ministry clerk who was wiped for writing it, and then, evidently, unwiped by someone who thought it funny. He is the clerk. He has been reading his own book for two years and admiring the author.`, { effects: [{ xp: 1 }], once: true }),
        I("empathy", 5, `Don't tell him. Or do. He has already told himself, in a hand he recognises. It's the loneliest piece of detective work in the school.`),
        I("archive", 4, `Ministry clerk, Third Grade. Struck from the roll. Wiped. Unwiped. The Undercurrent has a very particular sense of humour about its recruits.`)
      ],
      choices: [
        C(`'You did write it, Doctor. It's yours.'`, "author_yes"),
        C(`'It's a very good book. That's all.'`, "hub")
      ]
    }),

    author_yes: N("quill", `He looks at you for a long time. Then he laughs, a wet, helpless, wheezing laugh that sets off the cough, and the girl with the plait pats his back, and the boy with the runny nose goes to find a handkerchief.\n\n"Well," he says, at last, wiping his eyes. "Well. How extremely vain." He puts the book to his chest. "I had thought myself so modest. I find I am the author of a bestseller that no one has read." He holds it out. "Would you like it signed?"\n\nHe does it with a fountain pen, in an old man's hand. To the student who told me. From the author, who forgot.`, {
      onEnter: [{ set: "quill_author_told", val: true }, { xp: 3 }, { morale: 3 }, { thought: "th_chosen_family" }],
      interjections: [
        I("charm", 4, `A signed copy. From a man who found out he was the author three minutes ago. It will be worth a fortune on Friday, or nothing at all.`),
        I("solidarity", 4, `We love him. We would like it known.`)
      ],
      choices: [C(`Take it.`, "hub")]
    }),

    cards: N("quill", `"Of course, my dear." He lifts the stack by its bootlace and presses it into your palm. "Forty cards. First test broadcast to the eve of the Jubilee. Dates, call-signs, a footnote or two. Rigorous, funny, almost completely illegal." He hesitates. "If you're caught with them, say you found them in a book. It's the only defence a historian has ever had."`, {
      onEnter: [{ give: "quill_notes" }, { xp: 1 }],
      choices: [C(`Thank him.`, "hub")]
    }),

    after_lecture: N("quill", `The first-years have gone. The reading room is quiet, gold, dusty. Quill is in his armchair with his eyes closed and a rug up to his chin, listening, you think, to the radiator. When your shadow crosses the book-stack he opens one eye.\n\n"I have decided," he says, "that I should like to read Article Nine aloud. Tonight. Somewhere with a microphone, in a hall, with the lights on. I am told it is the only thing I have left to say, and I have been told that by myself."`, {
      interjections: [
        I("empathy", 4, `He's smiling. The cough is bad today. He's telling you he can do this, and that it will cost him.`),
        I("rhetoric", 3, `Article Nine, read aloud into a live mic by a dying man with a rug. It is the best closing argument in the history of the district.`)
      ],
      choices: [
        C(`'Would you, Doctor? In the Hall, at eight?'`, "ready", { cond: "flag.quill_clause_known" }),
        C(`'Rest. Think about it.'`, "hub")
      ]
    }),

    ready: N("quill", `"The Hall." He opens both eyes. "There will be a chair? A small one, with a back to it? I can stand for about four minutes. I can read for six if I'm sitting. It is a very short Article. I can read it in forty seconds." He coughs. "I'd like to read it very slowly."\n\nHe holds out a trembling hand, and you shake it. It is cold and dry and weightless as a leaf. "At eight, then. If I'm late, someone should check the radiator. I may have fallen asleep."`, {
      onEnter: [{ set: "quill_ready", val: true }, { xp: 4 }, { morale: 3 }, { thought: "th_last_assembly" },
        { note: "task_jubilee", text: "Quill will read Article Nine of the Quiet Hours Act aloud in the Ration Hall at eight, slowly, from a chair. He needs a small chair with a back to it." }],
      interjections: [
        I("authority", 4, `A lawful argument, in an old man's voice, in a lit hall. Voss will know he has lost the minute it's read.`),
        I("empathy", 5, `Find him a chair. Find him the best chair in the school.`)
      ],
      choices: [C(`'I'll find you a chair.'`, "ready_again")]
    }),

    ready_again: N("quill", `Quill is practising. He has the Act in his lap, the page held very close, and he is reading it to himself under his breath, in a voice nothing like his own: slower, rounder, an actor's voice for a very small stage. "Shall lapse." A pause. "Shall lapse. Shall lapse."\n\n"There is a great deal in a verb," he says, without looking up. "Particularly one that has been waiting thirty years to be read."`, {
      choices: [X(`'See you at eight, Doctor.'`)]
    })
  }
},

// =====================================================================
corvin_d3: {
  title: "Corvin Hale",
  start: [
    { cond: "flag.corvin_ready", node: "ready_again" },
    { cond: "flag.corvin_informs", node: "informed_again" },
    { cond: "flag.corvin_ally", node: "ally_prev" },
    { node: "open" }
  ],
  nodes: {
    ally_prev: N("corvin", `"Ah. My benefactor." Corvin is on a library chair with a sheet of paper held out at arm's length, but the paper is not the old speech; it is a crumpled draft with half the lines crossed out. "I have, ah, a new speech. I have been thinking about what I owe you. I think what I owe you is a first line." He clears his throat. "'I was told to be a loyal and grateful child of the Warden. I would like instead to be a person.'" He stops. "I haven't got a second line. I'll pin at eight, in front of the Inspector and everyone, and I will say it. Even if my voice goes."`, {
      onEnter: [{ set: "corvin_ready", val: true }, { xp: 3 }, { morale: 2 }, { thought: "th_chosen_family" },
        { note: "task_corvin", text: "Corvin will say a different speech when he is pinned at eight: 'I would like instead to be a person.'" }],
      interjections: [
        I("rhetoric", 4, `A first line is the hardest. He's got it. Give him a second, one day.`),
        I("empathy", 4, `He's repaying a debt by being braver than he is. That is how all courage begins.`)
      ],
      choices: [C(`'That's a good first line.'`, "ready_again")]
    }),

    open: N("corvin", `"Citizen-student! Observe!" Corvin Hale is standing on a library chair, one hand on his heart, the other holding a sheet of paper at arm's length, reciting to a row of encyclopaedias. He has a red-brown armband that is a size too large and a haircut that was done in the dark by someone who loved him. "'I am, in the whole of my being, a loyal and grateful child of the Warden.' Is that too much? It feels like a great deal. Should I weep at the word 'child'?"\n\nHe looks down at you. "Tonight is my Initiation. The Vanguard pins me at the Jubilee, in front of the whole district. I will be the youngest Pioneer in the Hall to be pinned in a decade." He swallows. "I have a speech. I have also a, ah, a dilemma."`, {
      interjections: [
        I("empathy", 3, `He wants so badly to be loved that he has memorised the shape of what the Union will love. It's an exhausting way to live.`),
        I("rhetoric", 3, `The speech is bad. Not in grammar. In sincerity. He has put in every gesture he's seen and none he's felt.`),
        I("instinct", 4, `A dilemma. Under his sleeve, tucked into his armband, a folded paper. Not his speech. Something stolen.`, { effects: [{ set: "corvin_paper_seen", val: true }] })
      ],
      choices: [C(`'What dilemma?'`, "hub")]
    }),

    hub: N("corvin", `He climbs down off the chair with enormous dignity, and almost falls off it. "A dilemma of conscience. Of civic duty. Of... of appetite." He sits on the table, and the paper crackles under his sleeve. "Ask me what you came to ask, and then I will ask you what to do."`, {
      interjections: [
        I("doublethink", 3, `A dilemma. A beautiful word. There is, of course, only one correct answer, and it is whatever the biggest person in the room says.`)
      ],
      choices: [
        C(`'What's under your sleeve?'`, "paper", { cond: "!flag.corvin_paper" }),
        C(`'Read me the speech. I'll tell you honestly.'`, "speech", { cond: "!flag.corvin_speech" }),
        C(`'You've got a list. Whose names are on it?'`, "list", { cond: "flag.corvin_paper && !flag.corvin_list" }),
        C(`'What do you actually want, Corvin?'`, "want", { cond: "flag.corvin_list && !flag.corvin_want" }),
        C(`'Choose, then. Tell me what you'll do.'`, "choice", { cond: "flag.corvin_want && !flag.corvin_ready && !flag.corvin_informs" }),
        X(`'Nothing, Corvin. Practise your weeping.'`)
      ]
    }),

    paper: N("corvin", `He goes pink, pale, then pink again, and slowly removes the folded sheet from his sleeve. "I took it from Miss Crane's drawer. The Index, a page of it. I only meant to look. I read, ah, three lines. I read, ah, 'Reedmarsh Pass, 9 to 14 March, see also glorious.'" His voice drops. "There was a boy on that list. A corporal. Marek Ollin. He was my father's friend."\n\nCorvin stares at the page. "My father says he died gloriously. In a ravine, firing, with a smile. He told it at my sixth birthday. And here is a card that says, 'see also glorious', as though glory was a footnote."`, {
      onEnter: [{ set: "corvin_paper", val: true }, { xp: 2 }, { thought: "th_borrowed_memory" }],
      interjections: [
        I("empathy", 4, `Marek Ollin, a baker's son. Vasha has his name in the back of her notebook. A friend of a Vanguard hopeful's father. It's a very small district.`, { cond: "flag.vasha_names || flag.vasha_ledger_page" }),
        I("deduction", 4, `He took the page for reasons of ambition and read it for reasons of grief. He doesn't know which is which, and neither does his armband.`)
      ],
      choices: [C(`'What does it say?'`, "hub")]
    }),

    speech: N("corvin", `He climbs back onto the chair and delivers it again, full voice, with both arms spread, and it is dreadful: all clauses and gestures and capitalised nouns, a statue of Loyalty in a size too large. At the climax he places a hand on his heart and a tear actually does, with great precision, slide down his cheek.\n\nHe looks at you, shining, quivering. "Well?"`, {
      onEnter: [{ set: "corvin_speech", val: true }, { xp: 1 }],
      interjections: [
        I("charm", 4, `Be kind. He rehearsed the tear. That's an act of love.`),
        I("rhetoric", 4, `Technically, it's accomplished. Spiritually, it's a man doing an impression of a loudspeaker.`),
        I("authority", 3, `Honest feedback is what an officer owes a cadet. Do not flinch.`)
      ],
      choices: [
        C(`'It's very moving. Don't change a word.'`, "hub", { effects: [{ ideo: "vanguard", n: 1 }, { surv: -2 }] }),
        C(`'It's dreadful. You don't mean a word of it.'`, "speech_hurt"),
        C(`'The tear was good. The rest isn't you.'`, "speech_kind", { effects: [{ xp: 1 }] })
      ]
    }),

    speech_hurt: N("corvin", `He deflates in stages, like a bouncy castle in a wind. The arms come down. The shoulders come down. "I do not," he says, and stops, quite appalled, "I do not mean a word of it. I've never meant a word of it. I was told, at eight, that if one said it often enough, one would."\n\nHe sits down on the chair, which is the right way up for once. "How did you know?"`, {
      onEnter: [{ xp: 2 }, { morale: -1 }, { set: "corvin_honest", val: true }],
      choices: [C(`'Because you checked if you should weep.'`, "hub")]
    }),

    speech_kind: N("corvin", `"The tear was good," he says, hopefully. "I practised the tear." He looks at the speech, a long bureaucratic document crumpled in his fist. "And the rest isn't me. Is that, ah, allowed? Is there, ah, a rest that is me?" He looks, suddenly, like a very young boy in a very large armband. "I don't know what it would say."`, {
      onEnter: [{ xp: 2 }, { set: "corvin_honest", val: true }, { morale: 1 }],
      interjections: [
        I("empathy", 5, `That's the question. He's never been asked what the rest would say.`)
      ],
      choices: [C(`'We'll find out.'`, "hub")]
    }),

    list: N("corvin", `"A list." He winces. "Of the persons of interest, in order. I had the grey coat's man ask me, quite nicely, whether I'd seen anyone in the Library who 'hummed'. I had to say I hadn't. It was a lie. It was my first. I felt it go down like a swallowed key." He holds the page out. "And I've got these. From the card index. Eleven names that appear on both lists. The Inspector's and Miss Crane's. I could, ah, I could write the matches on one side of the paper and hand it in at the Jubilee, and be pinned a Pioneer First Class."\n\nHe looks up. "I could. I'm not saying I would."`, {
      onEnter: [{ set: "corvin_list", val: true }, { xp: 2 }, { surv: 2 }],
      interjections: [
        I("deduction", 4, `Eleven names on both lists. He has done the matching. He is, whatever else, an excellent clerk. Voss would have loved him.`),
        I("empathy", 4, `He isn't threatening you. He's telling you what he's tempted by, because nobody has ever listened to a temptation.`),
        I("instinct", 4, `The paper in his hand is shaking. He wants somebody to take it away from him.`)
      ],
      choices: [C(`'What do you actually want?'`, "want")]
    }),

    want: N("corvin", `"I want," he says, and for a moment he is just a boy, "to be on a list that is a good one. I have been on the waiting list for the Vanguard since I was nine. I have been on the list for a good conduct certificate. I've been a first reserve for the debating team. I should like to be, once, on a list because someone wanted me. Not because I'd done the thing that would get me on it."\n\nHe looks at the page. "The Vanguard wants me for what I'll say. I don't think the Undercurrent has ever been asked. It's a dreadful thing to say, but the other lot did ask first."`, {
      onEnter: [{ set: "corvin_want", val: true }, { xp: 3 }],
      interjections: [
        I("empathy", 5, `He wants to be wanted. It's the whole of him. The Vanguard asked first. The Undercurrent never did.`),
        I("solidarity", 4, `We would like to ask him now. We would like him very much on our list.`),
        I("rhetoric", 5, `A person who wants to be asked can be asked. It is the oldest pitch in history, and the only one that is not a lie, if you mean it.`)
      ],
      choices: [C(`Go on.`, "hub")]
    }),

    choice: N("corvin", `"So." He folds the page along its creases, once, twice, and holds it between thumb and forefinger as if it were a very small, very hot coal. "It's quarter to two. I pin at eight. I could put this in an envelope for the grey coat's man at six, or into the stove, or in the, ah, the pocket of the person who asked me what I'd like." He swallows. "It's your move. I'm told it's customary to bribe a boy at this point. Please don't. I'd rather be, ah, persuaded."`, {
      interjections: [
        I("authority", 4, `He's offering you the move. Any answer that sounds like an order will lose him.`),
        I("charm", 4, `Be honest. He is the first person all week who has asked to be persuaded rather than managed.`),
        I("solidarity", 4, `Ask him. Ask him as we would. Ask him to come.`)
      ],
      choices: [
        K(`[Solidarity] 'Come with us. Be on our list. We'd like you. We'd ask you properly.'`, "solidarity", 10, "corvin_d3_choice_solid", "ally", "inform", { w: 1 }),
        K(`[Rhetoric] 'Give a different speech. Make the Union listen to the one you don't mean.'`, "rhetoric", 11, "corvin_d3_choice_rhet", "ally", "inform", { w: 1 }),
        K(`[Dialectics] Show him the contradiction in "loyal child" and "I read it and was sad".`, "dialectics", 11, "corvin_d3_choice_dial", "ally", "inform", { w: 1 }),
        C(`'It's your decision. I won't ask.'`, "inform")
      ]
    }),

    ally: N("corvin", `He tears the page across. Once, twice, four times, with the stiff solemnity of a Pioneer disposing of a flag. The pieces go into his pocket, not the stove: "evidence," he explains, "of my moral development."\n\n"I'll give the speech," he says. "But I'll give a different one. I wrote the first line on the way here." He clears his throat. "'I was told to be a loyal and grateful child of the Warden. I would like instead to be a person.' I haven't got a second line." He grins, like a boy who has jumped off a roof and found out about landing. "I'll be on the dais, in front of the Inspector and everybody. I think I'll be sick. But I think they'll listen. They always listen to the one in the armband."`, {
      onEnter: [{ set: "corvin_ally", val: true }, { set: "corvin_ready", val: true }, { task: "task_corvin", state: "done" }, { xp: 4 }, { morale: 3 }, { thought: "th_chosen_family" },
        { note: "task_corvin", text: "Corvin tore up the list. At eight, pinned in the Hall before the Inspector, he'll give a different speech: 'I would like instead to be a person.'" }],
      interjections: [
        I("rhetoric", 4, `The most dangerous orator in the district is a boy who has just been told it's allowed. He will say the first line in a voice that hasn't broken yet.`),
        I("solidarity", 4, `He's on the list. He's on ours. He doesn't have a second line. We'll write him one.`)
      ],
      choices: [C(`'Thank you, Corvin.'`, "ready_again")]
    }),

    inform: N("corvin", `He stands there a long moment with the page between his fingers. His face does one thing, and then, regretfully, another. "I see," he says. "Well. It's, ah, a decision. One must be decisive." He folds the page into his armband and straightens it. "I'm sorry. I like you. I like you more than anyone I've met this year. It's only that I've never been liked by the other side."\n\nHe holds out his hand, and you shake it, and the whole length of his arm is shaking. "I'll put it in the envelope at six. I hope you've got somewhere to be."`, {
      onEnter: [{ set: "corvin_informs", val: true }, { task: "task_corvin", state: "failed" }, { surv: 10 }, { morale: -2 },
        { note: "task_corvin", text: "Corvin will hand the list to the Inspector's man at six. Eleven names. I don't blame him; I didn't give him a reason not to." }],
      interjections: [
        I("empathy", 5, `He is going to do the thing he hates, with a handshake, because nobody gave him a page to be brave on.`),
        I("volition", 4, `Eleven names. You have until six. Tell them.`)
      ],
      choices: [X(`Go.`)]
    }),

    informed_again: N("corvin", `Corvin is polishing his armband pin on his sleeve, and does not look up. He has the red-faced concentration of a boy at a recital who has been told the audience is not watching.\n\n"I put it in the envelope," he says to the pin. "I'd, ah, rather not discuss it. I'm told one doesn't, with an envelope." He breathes on the metal. "I'll be pinned at eight. I'm told it is the best day of a Pioneer's life. I'd, ah, I'd like you not to be there. If it's not too much."`, {
      interjections: [
        I("empathy", 5, `He is a very small boy in a very large mistake.`),
        I("authority", 3, `The names are with the grey coat. You have, perhaps, hours.`)
      ],
      choices: [X(`Go.`)]
    }),

    ready_again: N("corvin", `Corvin is on the chair again, reciting to the encyclopaedias, but the speech is different. He's doing it quietly this time, under his breath, trying phrases out like new shoes. "I would like to be a person. I would like to be, ah, a person. I would like to be a person *on purpose*." He stops. "Is that better? Is it worse? It feels dreadful. I think it's good."\n\nHe looks down at you with hopeful, terrified, glowing eyes. "I haven't got a second line."`, {
      interjections: [
        I("rhetoric", 4, `Give him a second line. "And I would like everyone else to be one too." It's not good. It's perfect.`),
        I("charm", 3, `Tell him it's good. He needs to hear it from somebody who isn't an encyclopaedia.`)
      ],
      choices: [
        C(`'Try: "And I'd like everyone else to be one, too."'`, "ready_again", { effects: [{ xp: 1 }, { morale: 1 }, { set: "corvin_second_line", val: true }], once: true }),
        X(`'See you at eight, Corvin.'`)
      ]
    })
  }
},

};

})();
