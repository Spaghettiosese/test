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
        C(`'Let me hold the dial. You should concentrate.'`, "test_run", { effects: [{ xp: 1 }] })
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

};

})();
