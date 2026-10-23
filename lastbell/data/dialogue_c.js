(function(){ const GD = (window.GD = window.GD || {});

// LAST BELL — Acts II/III, story-c: daybreaks (Day 1), Wednesday morning, dormitory, library, Day-2 variants of set-A NPCs.
GD.dialoguesC = {

// ============================================================ DAYBREAK SCENES (Day 1 -> Day 2)
daybreak_good_student: {
  title: "The Good Student",
  start: [{ cond: "flag.rhea_allied", node: "a_rhea" }, { node: "a" }],
  nodes: {
    a: {
      speaker: "narrator",
      text: `News travels the dormitory stairs faster than you do. You climb them at twenty to ten with a brass Warden pinned to your lapel and meet, on the first landing, a boy who has pressed himself flat against the wall so that you will not have to brush him. On the second, two girls who have become deeply interested in a fire bucket. Nobody is rude. That is the horror of it. They are courteous. They make a corridor of themselves, and you walk down it, and it closes behind you like a mouth that has said nothing.\n\nThe janitor's name was Osk Brannic. Thirty-one years. Somebody in the stairwell is saying it softly, over and over, to learn it before it is withdrawn.`,
      voices: 3,
      interjections: [
        { skill: "doublethink", min: 2, text: `Listen to that silence. That is respect, friend. That is the sound of a whole floor deciding you are somebody. It is so much warmer on this side of the glass.` },
        { skill: "empathy", min: 3, text: `His broom is leaning against the plinth in the Courtyard. Nobody has told it. I keep thinking somebody should tell it.` },
        { skill: "solidarity", min: 3, text: `We are not speaking to you. Not as a punishment. We simply do not know yet which of us you are.` },
        { skill: "authority", min: 4, text: `YOU HAVE BEEN ACCEPTED. NOTE HOW THE CORRIDOR OBEYS. NOTE HOW IT COSTS NOTHING. NOTE THAT IT COSTS NOTHING THAT YOU CAN SEE.` },
        { skill: "volition", min: 4, text: `You are going to feel fine in about nine minutes. I want you to remember, right now, that you are not fine. Put it somewhere the Bell cannot reach. Pocket. Shoe. Anywhere.` }
      ],
      choices: [{ text: `Reach your door.`, goto: "b" }]
    },
    a_rhea: {
      speaker: "narrator",
      text: `Rhea Vantage is waiting on the third-floor landing, which is not hers, in a uniform that has already been tailored for a rank she will not hold until Monday. She is peeling an orange. In one long curl. 'Congratulations,' she says, and divides it with her thumbnail, and gives you the larger half. 'We are the same now. I wanted you to hear that from somebody who means it.'\n\nThe corridor behind her has emptied itself. The brass Warden on your lapel catches the light. The orange is very sweet, and you eat all of it, and she watches you do so with the open, pleased attention of a person feeding a bird.`,
      voices: 3,
      interjections: [
        { skill: "instinct", min: 3, text: `Do not look at the knife. Look at the peel. A single piece, unbroken. She has been practising that on people.` },
        { skill: "doublethink", min: 2, text: `A friend. At last, a real one. Isn't it good to be chosen by the strongest person in the building? You were so alone this morning.` },
        { skill: "empathy", min: 4, text: `She means it. That is what makes the orange so hard to swallow. She truly believes she has rescued you.` },
        { skill: "the_grey", min: 3, text: `Citrus and cold stone. Same smell as the gym mats. I would say something about that, but I am only the weather.` }
      ],
      choices: [{ text: `Nod, and go into your room.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `Dov Kessel looks up from his bunk, sees the badge, and begins, very smoothly, to make himself unavailable: a cough, a book, an inventory of his own socks. Across the room, Wren sits cross-legged on her blanket, hands in her lap, watching you the way small children watch a dog that has bitten someone. Matron Pritt appears in the doorway with a cup of cocoa nobody ordered and a face of regulation delight. 'A credit to the third floor,' she says, and writes it down.\n\nYou realise she has been writing it down since the stairs.`,
      onEnter: [{ ideo: "vanguard", n: 1 }, { set: "day2_hero", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `Wren is not afraid of the badge. Wren is afraid of what you did to earn it, and she has the look of someone who already knows.` },
        { skill: "appetite", min: 2, text: `Cocoa. Real. With sugar. Drink it. It is a bribe, and bribes are the only warm things in this building. Drink it.` },
        { skill: "rote", min: 3, text: `A CREDIT TO THE FLOOR. A CREDIT TO THE DISTRICT. A CREDIT TO THE UNION. THE ACCOUNT IS KEPT BY SOMEBODY ELSE.` }
      ],
      choices: [{ text: `Lie down with the badge still on.`, goto: "c" }]
    },
    c: {
      speaker: "narrator",
      text: `At twenty-one hundred the Bell begins. It comes through the plaster, through the pipes, through the little horn above the door, round and golden and terribly kind. You hold the badge in your fist so the pin bites. You try to keep one thing. Osk's face, hearing the verdict, wiping his hands on his overalls as if they were still the problem. You hold it. You hold it with everything you have, and the tone finds the edges of it and folds them, tenderly, like laundry.\n\nBy the third verse you cannot remember what he did that was so wrong. By the fifth you are sure you were right. Somewhere very deep, in a place with a hole in the floor, a small tin kettle keeps whistling that you were not.\n\nTomorrow there will be an Inspector. You will not know why your hand aches.`,
      onEnter: [{ thought: "th_weight_of_osk" }, { surv: 4 }],
      interjections: [
        { skill: "doublethink", min: 2, text: `There. Doesn't that feel light? You did nothing. It was done. Say it softly and it will stay done.` },
        { skill: "volition", min: 3, text: `Keep the ache. Whatever else goes, keep the ache. It is the only receipt you will have.` },
        { skill: "the_grey", min: 2, text: `The Bell passes through me as well. I do not forget. I only get wetter.` }
      ]
    }
  }
},

daybreak_ledger: {
  title: "The Seed",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `You come up out of the boiler room with your hands empty and your coat lighter by one green book, and the whole Courtyard looks different, the way a house looks different when you know where the spare key is. At the dormitory door the matron has her book open on the lectern. 'Out at twenty to six,' she writes. 'In at nine thirty-one. Boots clean. Pockets,' and here she lifts her eyes to you for a very long second, 'unremarkable.' She says unremarkable like a woman handing back a coat she has not looked inside. 'Cocoa on your bunk. Don't thank me.'\n\nYou don't.`,
      voices: 3,
      interjections: [
        { skill: "solidarity", min: 2, text: `We carried it. We, all of us: the cook with her loaves, the old woman with her tea, the boy with a screwdriver in the cardigan. You were only the part of us that had legs.` },
        { skill: "instinct", min: 3, text: `The matron knows something. Not what. Only that you are carrying one less thing than you did this morning, and that this is the only thing in the building worth writing down.` },
        { skill: "archive", min: 3, text: `Nine copies, Mother Anka said. Nine hands, nine typewriters, nine Catechisms. A bureaucracy of resistance is, I must say, the only kind I can truly admire.` },
        { skill: "volition", min: 4, text: `Tonight you will forget. Not the book: the deciding. Be gentle with the person who wakes up tomorrow. He or she will feel strangely proud and will not know why.` }
      ],
      choices: [{ text: `Climb the last stair.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `On your pillow, a folded square of greaseproof paper no bigger than a fingernail. Wren is already in bed, back to the room, breathing the careful breath of a child who is not asleep. The note is in a baker's pencil, in capitals: THE BREAD SAYS YOU WERE NEVER HERE. THE BREAD SAYS THANK YOU. EAT THIS NOTE.\n\nYou do. It tastes of caraway and relief. Under the bunk, the slats of the bed creak as Dov turns over and murmurs, to nobody, 'Whatever it was, it was good, whatever it was.' Beside the radiator, a cup of tea steams on the sill, which nobody will own up to making.`,
      onEnter: [{ set: "cell_active", val: true }, { ideo: "undercurrent", n: 1 }, { set: "day2_seeded", val: true }],
      interjections: [
        { skill: "appetite", min: 2, text: `Caraway. Greaseproof. A note you are allowed to eat. I could weep. This is the best postal system ever devised.` },
        { skill: "empathy", min: 3, text: `Three people in this room know something and are being kind enough not to say it. That is not a secret. That is a lullaby.` }
      ],
      choices: [{ text: `Drink the tea.`, goto: "c" }]
    },
    c: {
      speaker: "narrator",
      text: `The Bell begins at nine. You are ready, this time: not for the forgetting, which is not a thing you can be ready for, but for the shape of it. You lie flat and let the E-flat come over you and, inside it, you try to count the pulse. Seven. Eleven. Seven. It is the first time in your life you have heard the second tone as a voice instead of a weather. It says, patiently, and in a number of languages, rest. You listen to the sound of a hand over a mouth, and for as long as you can, you do not mind.\n\nIn the boiler room, an old woman closes a book and opens another. She will have no recollection by morning of why she is smiling. She will leave two cups out anyway.`,
      interjections: [
        { skill: "the_grey", min: 2, text: `The pipes carried it down. I carried it down. Everything goes down in the end; it only needs somebody to hold the lamp while it does.` },
        { skill: "senses", min: 4, text: `Seven, eleven, seven. You almost have it. You will not remember having almost had it. Almost is stored in a different drawer.` }
      ]
    }
  }
},

daybreak_static: {
  title: "What They Took",
  start: [{ cond: "flag.stage_ragged", node: "a_ragged" }, { node: "a" }],
  nodes: {
    a: {
      speaker: "narrator",
      text: `They do not keep you. That is the first surprise. They take you down the Ration Hall steps at nine past nine, still holding the paper, and a man in a good grey coat looks at you with an expression of enormous tired courtesy, and somebody on the telephone says the word *sedative*, and somebody else says *minor*, and by one in the morning you are walking up the dormitory stairs between two sentries who deliver you to the matron like a parcel with a postmark.\n\nThe Principal has vouched for you. You are not sure which of you has been more frightened by that.`,
      voices: 3,
      interjections: [
        { skill: "adrenaline", min: 3, text: `YOU DID IT. Say it again! You did it! Whatever they say tomorrow, there was nine minutes when every speaker in the district said your sentence!` },
        { skill: "empathy", min: 3, text: `Her hand shook on the telephone. The Principal's. She did not vouch for you because she is kind. She did it because she needs you where she can see you. It is the closest thing to love the building has.` },
        { skill: "composure", min: 3, text: `Your hands are shaking. Put them in your pockets. Do not let the matron see them shake. Do not let her see anything. She will write it down.` },
        { skill: "doublethink", min: 2, text: `A fever, friend. It will be written up as a fever. Wouldn't that be kinder? Wouldn't you rather have had a fever?` }
      ],
      choices: [{ text: `Go to your bunk.`, goto: "b" }]
    },
    a_ragged: {
      speaker: "narrator",
      text: `Your voice gave out at minute six. It is a small, private shame, a thing you will carry up the stairs and into bed: the broadcast went out, every loudspeaker in the district carried it, and by minute six it was a hoarse whisper reading numbers off a page, and by minute eight it was mostly breathing. The man in the good grey coat said afterwards that it had been *very brave and quite impossible to follow*, which is the kindest thing a government has ever said to you.\n\nNobody has kept you. The Principal has vouched. The dormitory stairs are long and you climb them on your hands, nearly.`,
      voices: 3,
      interjections: [
        { skill: "volition", min: 3, text: `It went out. Hear me. A voice that fails halfway is still a voice that began. Nobody who heard it will ever be quite as certain again.` },
        { skill: "grit", min: 2, text: `Your throat is a sandpit. Lie down. Hold your hurts like you hold your breath: for exactly as long as it is useful.` },
        { skill: "solidarity", min: 3, text: `We heard the breathing. Do you know how many of us held our own breath to match? We were all running that last minute with you.` }
      ],
      choices: [{ text: `Go to your bunk.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `The dormitory is awake. Not sitting up: awake the way a field is awake when the wind has dropped. In the dark, a voice you recognise as Wren's says, in the tone of a child listing dangers on her fingers, 'Sixteen of the first-years woke up and can't stop saying *ledger*. Matron says it is the flu.' Across the room, Dov: 'It is not the flu.' A creak of springs. 'I sold nobody anything tonight. I want that on the record.'\n\nSomebody has put a spare blanket on your bunk. Nobody will say who.`,
      onEnter: [{ set: "day2_notorious", val: true }, { surv: 8 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "solidarity", min: 2, text: `A blanket. We do not have anything to give but blankets. It turns out to be quite a lot.` },
        { skill: "senses", min: 4, text: `Under the dormitory snore, on the far side of the room, a faint hiss. Somebody has a set under a blanket. Three in the morning is a long way off yet, but she is practising.` },
        { skill: "empathy", min: 3, text: `Dov is lying about the flu and Wren is not. They are two different kinds of terrified. You can hear which is which.` }
      ],
      choices: [{ text: `Lie still and wait for the Bell.`, goto: "c" }]
    },
    c: {
      speaker: "narrator",
      text: `The Bell, when it comes, is late: a quarter past one, a special Pedagogic Harmony for the Third Floor, which the matron announces at the door with a smile and a clipboard. It is shorter than usual and harder at the edges. It does not take the whole night. It takes the middle of it: the paper, the sentence, the faces of the children in the aisle. But somewhere deep in the folded cloth of the day, one number survives. 9 minutes 12 seconds. It will mean nothing at breakfast. It will mean everything at noon.\n\nTomorrow there is to be an Inspector. You will not remember being told.`,
      interjections: [
        { skill: "the_grey", min: 2, text: `I kept it. I keep everything. Somebody should ask me what I know about numbers.` },
        { skill: "volition", min: 3, text: `9:12. Say it twice. Put it in the shoe.` }
      ]
    }
  }
},

daybreak_quiet: {
  title: "Ration Tea",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The tea is warm. It tastes of cloves and orange peel and a sweetness under the sweetness that you do not examine, and the number 9 bus goes round the district exactly as it has always gone round, past the Relay depot, past the bread queue, past the tram-wire lamps, each one a small yellow sum. You count them. At nineteen the bus stops, and the doors fold open, and the stop is, as it has always been, at the foot of the dormitory gate.\n\nYou have, you realise, never had another home. The mother in the soup-and-slippers of your memory has your own matron's hands. A very slight wrongness passes over you, like the shadow of a bird, and is gone.`,
      voices: 3,
      interjections: [
        { skill: "appetite", min: 2, text: `Warm. Sweet. Nobody asking anything. Don't you feel just lovely? Don't you? Look: a plate of soup, waiting.` },
        { skill: "empathy", min: 3, text: `You said "my mother" on the bus and nobody asked which one. The bus loops. The dormitory is where the bus ends. These two facts are very close together, and the tea is working hard to keep them apart.` },
        { skill: "archive", min: 4, text: `Route 9: Cinder Street, Karsov Avenue, the Relay depot, the tram interchange, the school, and then straight back to Cinder Street. It has never been to a house. I have checked the timetable seventeen times. There are no houses on it.` },
        { skill: "volition", min: 3, text: `You chose this. I will not take it from you: you chose it. But the person who wakes tomorrow did not, and he or she should be told.` }
      ],
      choices: [{ text: `Go in.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `Matron Pritt has soup. She stands at the dormitory hotplate in a cardigan the colour of boiled sweets and ladles it into the tin bowl as though she does it for everyone, which she does, which is why it feels so private. 'You're in early,' she says, and writes something. 'Tea at the gate? Good. Sleeping's best done warm.' She watches you drink the soup. 'You were looking a bit peaky. Something on your mind, dear?' Her pen waits.\n\n'No,' you say, and it is true. Your mind is as empty and well-lit as a stage after the play.`,
      onEnter: [{ ideo: "quiet", n: 2 }, { set: "day2_tea_fog", val: true }, { morale: -1 }],
      interjections: [
        { skill: "doublethink", min: 2, text: `No, nothing. Lovely word, 'nothing.' So round. Like a bowl. Say it again.` },
        { skill: "instinct", min: 3, text: `She asked. She waited. She wrote it down. Every night she asks, and every night you are an empty page, and every night the page is worth something to someone.` }
      ],
      choices: [{ text: `Finish the soup. Go to bed.`, goto: "c" }]
    },
    c: {
      speaker: "narrator",
      text: `At nine the Bell rings, and you do not mind. You lie in the narrow bed with the little horn over the door, and the tone arrives like a long exhale, and everything you were carrying leaves, not violently, but with the gentle gait of guests who have remembered another engagement. You wave them off. A boy with a broom. A girl with an orange. A cold green book. A voice saying *then I'll do it*.\n\nYou do not remember who said that. You do not remember that you are the sort of person who might have.\n\nThere is a sort of triumph in it. There is a sort of grave. It is warm in either case.\n\nIn the morning, somebody will tell you there is an Inspector. It will seem like weather.`,
      interjections: [
        { skill: "the_grey", min: 2, text: `I am not angry at the ones who take the tea. I am very old and very wet and I have seen entire cities take the tea. It is a long road back from it, and it begins with a headache.` },
        { skill: "solidarity", min: 3, text: `We will be here. We will still be here, in the morning, with the other cup. Come back when you can.` }
      ]
    }
  }
},

daybreak_curfew: {
  title: "Twenty-One Hundred",
  start: [{ cond: "flag.vasha_ally", node: "a_vasha" }, { cond: "flag.osk_seen_you && !flag.osk_scapegoat", node: "a_osk" }, { node: "a" }],
  nodes: {
    a: {
      speaker: "narrator",
      text: `Nine o'clock comes the way a tax comes. In the corridor, the loudspeakers click, and the golden tone begins, and you stand with an unfinished thought in your hand, and the thought is a good one, and it goes out of you like a coin down a drain.\n\nWhen you come back, it is a different quality of dark. A ceiling of stained plaster. A radiator ticking. A bunk, a blanket, a hand not yours drawing the blanket up. Somebody has carried you, and put you to bed with your boots on, and left a cup of water on the sill. You are in the dormitory. You do not remember arriving. There is a sentence written in blue ballpoint on your forearm, in your own hand, and you can tell by the pressure it was written in daylight, by somebody who knew exactly what would happen next.`,
      voices: 3,
      interjections: [
        { skill: "volition", min: 3, text: `Breathe. You are in a bed. Somebody put you in it. That is two good facts. Add a third by reading your arm.` },
        { skill: "the_grey", min: 2, text: `The Bell took the night; I kept the cold. You were carried up three flights, and the stairs have the scuffs to prove it, and I am telling you in case anyone asks.` },
        { skill: "deduction", min: 3, text: `Boots on. Water on the sill. Blanket tucked left-handed. Someone brought you here who has put a great many people to bed, and who was in a hurry.` },
        { skill: "doublethink", min: 2, text: `Nothing happened. Didn't you sleep? Don't you feel rested? Look how nicely the ceiling is stained.` }
      ],
      choices: [{ text: `Read your arm.`, goto: "b" }]
    },
    a_vasha: {
      speaker: "narrator",
      text: `Nine o'clock comes, and the golden tone begins, and something very firm takes you under the elbow. 'Walk,' says a voice you know, quite low. 'Left, right, left. Don't think. Keep walking. You'll thank me tomorrow, and then you'll forget.' You walk. The corridor goes in and out of focus like a lens being adjusted. A hand with nicotine-stained fingers drags a blanket over your shoulders.\n\nWhen you come back it is a different quality of dark. The ceiling of the dormitory. A cup of water on the sill. On the pillow, a grey tracksuit jacket, folded, smelling of smoke, and on your forearm a line in blue ballpoint, in your own hand, written in daylight by someone who knew precisely what would happen.`,
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She carried you. A woman with a bad knee carried a seventeen-year-old up three flights of stairs, and she will not remember it, and she did it anyway.` },
        { skill: "solidarity", min: 2, text: `We do that. We carry. It is the only thing we have ever been really good at.` },
        { skill: "volition", min: 3, text: `Fold the jacket. Keep it. Tomorrow it is a debt.` }
      ],
      choices: [{ text: `Read your arm.`, goto: "b" }]
    },
    a_osk: {
      speaker: "narrator",
      text: `Nine o'clock comes, and the golden tone begins, and the last thing you feel is a hand the size of a shovel closing around your elbow. 'Up,' says a voice that smells of coal and floor polish. 'Not here, young one. You'll be found here.' You walk, half-carried, down three flights and up four, with a broom handle knocking against your shin like a metronome. 'I've done this before,' the voice says. 'Not for you. For the other ones. There are always some.'\n\nWhen you come back, you are in the dormitory. A cup of water on the sill. A pair of cracked work gloves left on the blanket, as a calling card nobody could object to. On your forearm, in blue, in your hand, a line written in daylight by somebody who knew what the dark was going to do.`,
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `He did not have to. He is a man who has been blamed for things for thirty-one years, and still he carried the child who might have blamed him.` },
        { skill: "the_grey", min: 3, text: `A caretaker knows the hundred places in a building a body can be left without being found. It is a professional obligation. It is also, quietly, love.` },
        { skill: "solidarity", min: 2, text: `Ours. He is ours. He mopped our floors and he carried us home.` }
      ],
      choices: [{ text: `Read your arm.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `Blue ballpoint, pressed hard, in a hurried version of your own handwriting.\n\nTHERE IS AN INSPECTOR COMING WEDNESDAY. DON'T LIKE HIM. HE WILL BE KIND TO YOU. THAT IS HOW YOU KNOW.\nTHE BELL IS AT THE END OF KARSOV AVENUE. (I THINK. SOMEBODY SAID. I LOST THE REST.)\nGET UP AT SEVEN. MATRON COUNTS HEADS AT 7:05.\n\nBelow that, smaller: YOU ARE NOT AS ALONE AS YOU FEEL. THIS IS NOT COMFORT. IT'S A WARNING.\n\nThe ringing is very loud tonight. You lie back and listen to it, and for the first time in your life it feels less like a fault than a signature.`,
      onEnter: [{ set: "day2_forearm", val: true }, { thought: "th_second_day" }, { note: "task_yesterday", text: `The day ran out and the Bell took it. My own handwriting told me: there is an Inspector coming Wednesday, and the Bell lives at the end of Karsov Avenue.` }],
      interjections: [
        { skill: "archive", min: 3, text: `Handwriting: yours, but slanted forty degrees to the left. That is the way you write when you are being watched over your shoulder. You wrote this in a toilet cubicle with the door shut. I can tell by the grammar.` },
        { skill: "instinct", min: 4, text: `'He will be kind to you. That is how you know.' Underline it. Underline it twice. Some people do their worst work with a smile.` }
      ]
    }
  }
},

// ============================================================ ENTER DAY 2
enter_day2: {
  title: "Wednesday",
  start: "wake",
  nodes: {
    wake: {
      speaker: "narrator",
      text: `A note. One note, high and thin, held so long it has become a place. You are lying in it. Beneath the note there are other things: a radiator ticking, springs complaining, someone's sock hung over a rail like a surrender, and a ceiling you will, on reflection, recognise. The dormitory. Seven in the morning. Somewhere below, a bell is ringing the hour in a tone like a spoon on a cup, and the plaster smells of damp socks and old soup.\n\nYour head has been rinsed. That is the only way to say it. The night has gone through it with a wet cloth, wringing, and left it clean and a little raw. You know it was a day. You know you were in it. What you cannot find is the floor under the knowledge.`,
      voices: 3,
      interjections: [
        { skill: "the_grey", min: 2, text: `Good morning. Seventeen degrees and the pipes are thinking. I have you in my hand, as I always do, and I would like you to know I held you all night.` },
        { skill: "senses", min: 3, text: `Cabbage, from the stairwell. Cheap cocoa. Chalk, somewhere under the pillow, and a faint smell of cigarette in the blanket that is not yours.` },
        { skill: "volition", min: 4, text: `Slowly. You are alive and horizontal. Those were good facts yesterday and they are good facts today. Build from them.` }
      ],
      choices: [{ text: `Listen to the ringing.`, goto: "roll1" }]
    },
    roll1: {
      speaker: "narrator",
      text: `The ringing steps aside, as it did before, and the committee wakes up one chair at a time. There are grumbles. Somebody has been missing since last night; somebody else has been talking to itself in the dark. They are not as you left them: you can hear the places where the Bell has sanded them down.`,
      voices: 3,
      interjections: [
        { skill: "dialectics", min: 1, text: `Dialectics. Do not thank me. I was awake all night, constructing a syllogism, and I have forgotten the conclusion, which is itself the most eloquent possible premise.` },
        { skill: "rote", min: 1, text: `ROTE. ARTICLE TWO: THE CITIZEN SHALL BE CHEERFUL. ARTICLE FOUR: THE CITIZEN SHALL BE CHEERFUL ON WEDNESDAYS TOO. THERE IS A FIFTH ARTICLE. I CANNOT FIND IT. I HAD IT YESTERDAY.` },
        { skill: "deduction", min: 1, text: `Deduction. Single bed, wrong side of the room, boots on. A young person was put to bed by someone with larger hands. I shall write that up when I have had a coffee. I shall not have a coffee.` },
        { skill: "rhetoric", min: 1, text: `Rhetoric. Friends, citizens, fellow sufferers of the third floor, I come before you this morning with a headache and a proposal.` },
        { skill: "doublethink", min: 1, text: `Doublethink. Good morning, friend. Isn't it nice that nothing happened? A clean slate. Don't worry about the odd smear on it. Smears are what slates are for.` },
        { skill: "archive", min: 1, text: `Archive. Wednesday. Day two of the autumn term, Form 3-W, 'Morning Roll-Call, Dormitory (Third Floor)'. I recall, with some distress, that I knew yesterday's date by heart. I appear to have lost the year.` }
      ],
      choices: [{ text: `Let the others wake.`, goto: "roll2" }]
    },
    roll2: {
      speaker: "narrator",
      text: `The next row of the committee clears its throat: the warmer ones, the ones that live in your chest and stomach and the back of your knees. They are cross. They have a few hours less of you than they were promised.`,
      voices: 3,
      interjections: [
        { skill: "empathy", min: 1, text: `Empathy. Oh. You're awake. I'm so sorry, I was lying very still, in case you needed the quiet. The pillow is sorry too. We've all been very sorry all night.` },
        { skill: "authority", min: 1, text: `AUTHORITY! ON YOUR FEET! IT IS OFFICIALLY A WEDNESDAY AND THE ROOM IS NOT AT ATTENTION!` },
        { skill: "instinct", min: 1, text: `Instinct. Something came in last night. A man, a car, a cold sort of kindness. I smelled it on the wind. Don't ask me how. I'm a nose.` },
        { skill: "charm", min: 1, text: `Charm, darling. Smile before you open your eyes. If anybody is watching, you will have looked fresh. If nobody is, you'll have practised.` },
        { skill: "solidarity", min: 1, text: `We are here. Count us. Eleven bunks, twelve heartbeats, one of us under a blanket with a radio. We are all here, and it is morning, and it is going to be a long one.` },
        { skill: "stamina", min: 1, text: `Stamina. Heart's fine. Knees are fine. One more day. You have done one. A body can do two.` },
        { skill: "grit", min: 1, text: `Grit. Your hand aches and you do not know why. Good. Pain is a witness; I do not argue with it.` },
        { skill: "brawn", min: 1, text: `Brawn. I can lift this bed. I do not know why you would want me to. I am just letting you know.` },
        { skill: "appetite", min: 1, text: `Appetite. Whatever that smell is, I am for it. Breakfast, bread, cocoa, tea, a banned spice. Is there tea? There is always tea somewhere.` },
        { skill: "adrenaline", min: 1, text: `ADRENALINE! OUT OF BED! SOMEBODY IS COMING! I DON'T KNOW WHO! GO! GO!` }
      ],
      choices: [{ text: `Let the last of them wake.`, goto: "roll3" }]
    },
    roll3: {
      speaker: "narrator",
      text: `The last voices are the small ones, the quiet ones that sit in your fingers and the corners of your eyes. They have been awake all night. They are always awake. They have been waiting politely at the back for the others to finish.`,
      voices: 3,
      interjections: [
        { skill: "aim", min: 1, text: `Aim. The sock is, as measured, two point six metres from your face. You could hit the window with it. I am not suggesting it. I am only saying.` },
        { skill: "reflex", min: 1, text: `Reflex. Duck. No: Matron has not come in yet. Duck anyway. It never hurts.` },
        { skill: "composure", min: 1, text: `Composure. Hair. Collar. Face. The face first. If you have only got one thing ready when she walks in, make it the face.` },
        { skill: "slip", min: 1, text: `Slip. Quiet. Don't make the springs sing. Roll to the left; the left slat never squeaks. We have been doing this since we were nine.` },
        { skill: "sleight", min: 1, text: `Sleight. There is something in your left sleeve. A pen, a folded paper, a button. You put it there last night. Your hands remember. Your head does not. It is the only honest division of labour you have.` },
        { skill: "senses", min: 1, text: `Senses. Seven twelve. Footsteps on the stair: heavy, deliberate, in slippers. The slippers have a limp in them. Four seconds to the door.` }
      ],
      choices: [{ text: `Sit up.`, goto: "dorm" }]
    },
    dorm: {
      speaker: "narrator",
      text: `You sit up. The dormitory unfolds: twelve bunks, five of them slept in, the rest stripped to the springs like the ribs of an argument. A hotplate on a table. A window painted shut. By the radiator, on the next bunk, a boy sitting cross-legged amid a small hillside of tin cans, shirt-cuffs, and one bright new lanyard, counting something under a blanket. And on a bunk three along, a small girl in a uniform two sizes too big, sitting bolt upright and staring at you with an expression of sovereign interest.\n\n'He's up,' says the small girl. 'You owe me a sweet.'`,
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She is not asking for the sweet. She is asking whether you are the same person who promised it.` },
        { skill: "deduction", min: 3, text: `A boy with a ledger-hand and a hot-blooded accountant's squint: he is doing sums, with a blanket over the sums. A girl who knows the exact time. Neither of them has been to bed. That is professional, not personal.` }
      ],
      choices: [{ text: `'What sweet?'`, goto: "banter1" }, { text: `'Who are you two?'`, goto: "banter1b" }]
    },
    banter1: {
      speaker: "wren",
      text: `'The one you swore on Monday,' says the girl. 'In front of witnesses. Witness one,' she counts, holding up a finger, 'Dov. Witness two. The gerbil.' There is, in fact, a gerbil. It sits on her pillow with a bored, administrative air. 'It was a sweet roll. With cinnamon. Cinnamon is banned. You said, and I quote, *I'd lay down my skin for a roll that illegal*.' She leans forward. 'I'm Wren. First-year. You really don't remember anything, do you?'\n\nDov, without looking up from his blanket: 'Leave him. He's the Bell's, this morning. We all are.'`,
      onEnter: [{ set: "met_wren", val: true }],
      interjections: [
        { skill: "appetite", min: 2, text: `A sweet roll. With cinnamon. I do not remember promising it and I swear it with my whole mouth.` },
        { skill: "archive", min: 3, text: `Cinnamon: Sensitive List, Item 31(b), 'Spices of Immoderate Association'. There is, I will admit, an appendix on nutmeg that I have always found rather racy.` }
      ],
      choices: [{ text: `'I'll find you a roll.'`, goto: "banter2", effects: [{ set: "wren_roll_promised", val: true }] }, { text: `'Is the gerbil also a witness to the Bell?'`, goto: "banter2" }]
    },
    banter1b: {
      speaker: "dov",
      text: `'Dov Kessel,' says the boy without lifting his eyes from a ledger the size of a prayer-book, 'your roommate for two years, creditor for eleven weeks. Wren, first-year, courier, and probably, in some paperwork, a hazard.' The girl bows from the waist, sitting down. 'We have had this conversation before,' Dov adds. 'Last Monday. In slightly more detail. There was a lot more crying from you.'\n\n'That is a lie,' says Wren. 'It was a lot more crying from *him*.'`,
      onEnter: [{ set: "met_wren", val: true }, { set: "met_dov", val: true }],
      interjections: [
        { skill: "rhetoric", min: 3, text: `'Eleven weeks.' You owe him something. You do not know what. Never let a creditor name the figure first.` },
        { skill: "solidarity", min: 2, text: `Two children in a cold room being rude to each other at dawn. It is the nearest thing to a family the third floor has ever managed.` }
      ],
      choices: [{ text: `'Let's start again. Good morning.'`, goto: "banter2" }]
    },
    banter2: {
      speaker: "dov",
      text: `'Good morning, comrade.' Dov slides the blanket off the hillside of tins; under it are three neat stacks of metal discs the size of a thumbnail, stamped with a tram. 'Do me a favour and don't look at these. They're not mine. They are, however, in my possession, and I'm told that is a very different legal state.' He puts a finger to his lips. 'Also. If you're going to ask what you owe me, it's on the card.' He flicks a card across the blankets. It reads, in a draughtsman's hand: S., ONE (1) PASS, WED. ADVANCE PAID. DO NOT ASK, DO NOT DISCUSS.\n\n'You paid in advance, {name},' he says. 'I never forget a customer. I just apparently forget every Tuesday.'`,
      onEnter: [{ set: "dov_card_seen", val: true }, { note: "task_dov", text: `Dov's card reads: S., ONE (1) PASS, WED. ADVANCE PAID. DO NOT ASK, DO NOT DISCUSS. I seem to have ordered a pass and forgotten what it was for.` }],
      interjections: [
        { skill: "sleight", min: 3, text: `The card's writing is Dov's. The red tick in the corner is not. That is a tick for 'forgery commissioned from a third party'. Somebody else is making your pass.` },
        { skill: "dialectics", min: 3, text: `You paid in advance for a pass you cannot recall wanting. Either you were a very forward-thinking customer, or you were a very frightened one. These are not mutually exclusive.` }
      ],
      choices: [{ text: `Pocket the card. 'Later.'`, goto: "matron" }]
    },
    matron: {
      speaker: "matron",
      text: `The slippers arrive. A limp, a clipboard, a smell of liniment and boiled sweets. 'Heads!' says the figure in the doorway, in a voice like a drawer being shut, and counts them with a pencil. 'One. Two. Three. Four. Four and a half,' (this is Wren, on the bunk's edge) 'five. The gerbil is not on the roll.' She stops at you. Matron Hallow Pritt, a short heavy woman in a cardigan the colour of a bruise, spectacles, an enormous soft face with small pale eyes in it, like raisins in dough. 'You were out until nine-thirty-one, {name}. Boots clean. Pockets unremarkable. That is a night I can respect.'\n\nShe writes it down. 'Inspection is at two,' she says to the room. 'A real one. Beds, lockers, tins. I want the third floor looking like a hymn.'`,
      onEnter: [{ set: "met_matron", val: true }, { task: "task_matron", state: "active" }, { note: "task_matron", text: `Matron Pritt will inspect the dormitory at 14:00 (beds, lockers, tins). Dov has contraband. So, probably, do I.` }],
      interjections: [
        { skill: "instinct", min: 3, text: `She counted your heartbeat, not your head. She knows exactly when you came in. She knew yesterday what you would do today. Do not mistake the slippers for slowness.` },
        { skill: "authority", min: 3, text: `SHE OUTRANKS ALL OF YOU. NOT BY RANK. BY KNOWING WHICH BUNK EACH OF YOU SLEEPS IN.` },
        { skill: "rote", min: 2, text: `DORMITORY REGULATION NINE: A CLEAN BED IS A CLEAN CONSCIENCE. REGULATION TEN: SEE REGULATION NINE.` }
      ],
      choices: [{ text: `Nod. Say nothing.`, goto: "announce" }, { text: `'Yes, Matron. We'll be a hymn.'`, goto: "announce", effects: [{ surv: -1 }] }]
    },
    announce: {
      speaker: "narrator",
      text: `The horn above the door clears its throat with a wet little click, and a voice you have never heard before, deep, unhurried, delightfully tired, speaks to the third floor as though it had come across a puppy.\n\n'Good morning, comrade students. This is the Principal's Office. I am asked to tell you that a member of the State Inspectorate, Inspector Hale Voss, has arrived at School Number Nine to bring the unfortunate events of Tuesday to a close with the minimum of fuss. He will be available for interview from nine. You will be kind to him. He is very tired, and has come a long way, by car.' A pause. 'The unfortunate circumstance of Tuesday has been resolved. The remains have been removed overnight. The gymnasium will reopen at noon. Please do not, ah, speculate. Speculation is a cough that spreads.'`,
      voices: 3,
      interjections: [
        { skill: "archive", min: 3, text: `'Voss.' Same surname as the Warden's Father on the plaque downstairs. Probably coincidence. In the Union, coincidence is the plural of 'file'.` },
        { skill: "deduction", min: 3, text: `'Removed overnight.' Between the end of the broadcast and dawn. Somebody had a van, and keys, and a reason not to wait for the District coroner. A tidy body is a body that has been decided on.` },
        { skill: "empathy", min: 4, text: `The voice on the horn is the Principal's. It has been practised flat. Under the flatness: dread, folded very small, like a love-letter in a boot.` },
        { skill: "doublethink", min: 2, text: `Resolved. What a restful word. Say it. *Resolved.* Isn't that so much nicer than the other things you could say?` },
        { skill: "the_grey", min: 3, text: `A man arrived by car. I felt the tyres on the cobbles at four, ahead of the dawn. He drove very slowly. I like the careful ones least.` }
      ],
      choices: [{ text: `'An Inspector.'`, goto: "inspector" }]
    },
    inspector: {
      speaker: "dov",
      text: `'Hale Voss,' says Dov, trying the name like a coin. 'State Inspectorate. I know a man who sells to a man whose cousin got an Inspector once. He was *very* polite. He took the entire lorry.' He whispers that last part. 'They say he does not shout. That is the bad sign. In the Union, the ones who shout are the ones who do not know what they are going to do.'\n\n'The car's parked on Karsov Avenue,' says Wren, hugging her knees. 'Outside the gate. Black. Shiny. A man stands beside it and watches the end of the street, where the Relay is. Everyone watches him watching. It is very theatrical.'\n\n'What Relay?' says Dov, too quickly.\n\n'*The* Relay,' says Wren. 'Number Four. The one that hums.'`,
      voices: 3,
      onEnter: [{ set: "day2_started", val: true }, { task: "task_voss", state: "active" }, { note: "task_voss", text: `Inspector Hale Voss of the State Inspectorate arrived overnight to 'close' the Ostrov case. His black car is parked on Karsov Avenue, outside the school gate. The Bell comes from District Relay No. 4, at the end of that street.` }],
      interjections: [
        { skill: "instinct", min: 3, text: `A man who watches the end of a street is a man who knows what is at the end of it. And the end of Karsov Avenue is the only place your ringing has ever pointed.` },
        { skill: "slip", min: 3, text: `Gate. Avenue. Relay. Three doors in a row. None of them locked, exactly. Each of them needing a different kind of silence.` },
        { skill: "archive", min: 4, text: `District Relay No. 4. Built in the Year of Steady Hands. Maintained by the Ministry of Quiet Hours, whose name appears in no school directory and every pay envelope. The Bell is not played here. It is *sent* from there.` }
      ],
      choices: [{ text: `'Karsov Avenue.' Say it quietly. Keep it.`, goto: "plan" }]
    },
    plan: {
      speaker: "volition",
      text: `Right. The day, then. You have, by the dormitory clock, twelve hours and some change before the Bell rings again, and one more before you start to forget. There is an Inspector who is going to be kind to you. There is a woman with a clipboard who will inspect every drawer at two. There is a boy who has sold you a pass you do not remember buying, and a girl who wants a sweet roll, and, on the horn over the door, an announcement that sounded like a nurse with a syringe behind her back.\n\nThere is also a street. Past the gate. You can see the first twenty metres of it from the painted-over window if you stand on the bunk. It looks, as streets do, like nothing at all.`,
      choices: [
        { text: `Get up. Let the day begin.`, end: true }
      ]
    }
  }
},

// ============================================================ ENTER DORM / LIBRARY
enter_dorm: {
  title: "The Dormitory",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `Third floor, east wing. The dormitory is a long cold room that was a ward once, and a store before that, and has kept the smells of both. Twelve iron bunks stand in two ranks, five made, seven stripped, as if the room had been told to expect guests and then forgotten. A hotplate sits on a table like an altar. The window is painted shut with more faith than skill. Above the door, a small brass horn waits for night.\n\nAt the far end, by the radiator, there is one bunk with a faded blanket that is, you realise with a small shock, yours.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `The damp has put its hand up the north wall and stopped, politely, at the Warden's portrait. It does not climb the Warden. I find that interesting.` },
        { skill: "senses", min: 3, text: `Liniment. Chicory. Cheap cocoa. Wet wool. Under it, very faint, a smell like a struck match. Somebody has been burning paper in here.` },
        { skill: "empathy", min: 3, text: `Eleven bunks' worth of sleeping people, all of them holding their breath. You can feel it in the room even empty: it is the place where children learn to be quiet in their sleep.` },
        { skill: "archive", min: 4, text: `Dormitory Three: capacity twenty-four; occupied twelve. The others were 'transferred' under Circular 41. The register has not been amended. The beds are still made for them in the matron's head.` }
      ],
      choices: [{ text: `Look at the rest of the room.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `A rug in the middle, the colour of tea. A table with two chairs. A corridor board by the door, pinned thick with notices. A wardrobe the size of a sentry box. A small iron footlocker at the foot of your bunk. A portrait of the Warden high on the wall, flanked by a notice that says THE WARDEN HEARS and, below it in someone's hand, AND DOES NOT ALWAYS APPROVE.\n\nA woman in a cardigan is already in the doorway before you have finished looking, with a clipboard held at the exact angle of a hymn-book.`,
      interjections: [
        { skill: "instinct", min: 3, text: `The portrait over the bunks. The Warden looks straight at the third bed from the door. At the *window* end, where there is no bed. Somebody moved the bunks to leave one bed in the Warden's eyeline. Whose is the one that is always empty?` },
        { skill: "composure", min: 3, text: `Eyes front. She is watching you decide where to look. A person who looks straight at the portrait is trained; a person who looks away from it is guilty. Look at the floor instead, like a normal person.` }
      ],
      choices: [{ text: `Turn to face her.`, end: true }]
    }
  }
},

enter_library: {
  title: "The Library",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `Silence arrives before you do. It is a particular silence, the sort one keeps with stamps and fines. The library is a tall brown cathedral of shelves, a vault of dust that has been sorted by someone who loved it, with a card catalogue at its heart like the pipes of an organ and a green-shaded lamp on every third table. In the back, behind a velvet rope that says AUTHORISED READERS in a hand that is not worried, the shelves go on into the dark. Somewhere high up, a spiral stair coils into the ceiling toward the tower.\n\nA woman at the desk raises one finger, without looking up. You are being shushed before you have made a sound.`,
      voices: 3,
      interjections: [
        { skill: "archive", min: 2, text: `YES. Oh, YES. Tarnov School No. 9, Collection of the Warden Aurel Memorial Library, 41,000 volumes, 3,200 withdrawn. This is the only room in the Union where I am not the most pedantic person present.` },
        { skill: "senses", min: 3, text: `Paper, tea, binding glue, a hint of lamp-oil. And, at the back, behind the rope, a colder, older smell: mushrooms and mouse and something like ink after rain.` },
        { skill: "empathy", min: 3, text: `A room full of people being quiet for different reasons. The old man at the table in the corner is quiet because he is sad. The boy by the window is quiet because he is rehearsing. The woman at the desk is quiet because she is counting.` },
        { skill: "the_grey", min: 3, text: `Books breathe. Did you know? In winter they exhale a sort of damp. This building has been exhaling for sixty years. I like to think I help.` },
        { skill: "rote", min: 3, text: `LIBRARY REGULATION ONE: SILENCE. REGULATION TWO: SILENCE. REGULATION THREE: A BOOK IS THE PROPERTY OF THE STATE ON LOAN TO THE CITIZEN FOR THE DURATION OF ITS HARMLESSNESS.` }
      ],
      choices: [{ text: `Look at the people.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `The librarian is slim, in a navy cardigan, with a bun and a pair of round glasses on a chain. She has a rubber stamp in one hand and the other is lifted in permanent reproach. At the reading table, a very old man in a rusty suit is annotating a book that is, you notice, not open. Beside him a boy with a Vanguard pin and a stiff collar is writing, with his tongue between his teeth, a very large title: THE DUTY OF VIGILANCE: AN ESSAY. And in the shadows of the back stacks, you see, or think you see, a tall shape standing perfectly still, and then not there.\n\nThe librarian's finger lowers. 'Welcome,' she says, in a whisper that carries like a wire. 'Please do not touch the globe.'`,
      interjections: [
        { skill: "instinct", min: 4, text: `Something in the back stacks. Not a person. Not nothing. A place where the quiet is a different grade.` },
        { skill: "charm", min: 3, text: `The librarian is lonely. Not shy: lonely. It is the loneliness of someone who is the best-informed person in the room and has been obliged to keep still about it for years.` },
        { skill: "deduction", min: 3, text: `A boy writing a title he has not yet got an essay for; an old man annotating a closed book; a librarian whose desk has no *Lost and Found* but has a *Found*. Everybody in here is lying about what they are reading.` }
      ],
      choices: [{ text: `Whisper something.`, end: true }]
    }
  }
},

// ============================================================ THE TOWER DOOR
tower_door: {
  title: "The Spiral Stair",
  start: [{ cond: "day >= 3", node: "d3" }, { cond: "day >= 2", node: "d2" }, { node: "d1" }],
  nodes: {
    d1: {
      speaker: "narrator",
      text: `A spiral stair of cast iron winds up out of the library's far corner, into the dark. At the foot, a door of black oak with a Ministry padlock the size of a fist and a brass plate: BELL TOWER. STRICTLY NO ADMITTANCE. BY ORDER. Beyond the wood, something a long way up creaks, once, like a ship in a harbour.\n\nIt is not locked in any way that a student could solve. It is locked in the way that a church is locked at night: as an argument.`,
      interjections: [
        { skill: "archive", min: 3, text: `Bell Tower, constructed in the Year of Steady Hands, access restricted to the Bellringer, the Principal and 'such persons as the Warden may designate'. The Warden has never designated anybody. It is an absence engineered to stay empty.` },
        { skill: "the_grey", min: 3, text: `I am up there as well. A building is a long vertical argument with the sky. The top is where it loses.` }
      ],
      choices: [{ text: `Rattle the door.`, goto: "rattle" }, { text: `Leave it.`, end: true }]
    },
    rattle: {
      speaker: "narrator",
      text: `The padlock does not so much as shiver. From very high above, something answers: one slow, heavy knock, like a knuckle on the inside of a skull. It is the Bell, or the idea of the Bell, or a person who has spent a long time among bells and thinks of door-knocks as a sort of conversation.\n\nYou wait. You are not given another.`,
      onEnter: [{ set: "tower_knocked", val: true }],
      choices: [{ text: `Step back.`, end: true }]
    },
    d2: {
      speaker: "narrator",
      text: `The Ministry padlock is still on the oak. A fresh card is pinned beside it: TOWER CLOSED TO ALL PERSONNEL PENDING JUBILEE PREPARATIONS (THURSDAY). KEYS WITH THE BELLRINGER. THE BELLRINGER IS NOT TO BE DISTURBED. Under it, in a child's pencil: HE IS NOT DEAF. HE IS JUST NOT TALKING. Under that, in an adult's pen: NOBODY SAID HE WAS.\n\nFrom above, on the hour, a long, mournful chord of knocks comes down the stair: three slow, two quick, three slow. Not a tune. A greeting.`,
      voices: 3,
      interjections: [
        { skill: "slip", min: 4, text: `The padlock is Ministry-issue, but the hasp is school-issue and the screws are rusted. Today, you could take the door off its hinges with a coin. You would be noticed doing it. By tomorrow, they will want it open anyway.` },
        { skill: "senses", min: 4, text: `Three slow, two quick, three slow. It is a pattern with a repeat. It is somebody saying hello in the only language they have left.` },
        { skill: "authority", min: 3, text: `THERE IS NOTHING UP THERE YOU NEED YET. THERE WILL BE. TRUST THE PATIENCE OF A CLOSED DOOR.` }
      ],
      choices: [
        { text: `Knock back: three slow, two quick, three slow.`, goto: "knock_back", cond: "!flag.tower_greeted" },
        { text: `Examine the padlock.`, goto: "lock" },
        { text: `Leave it for now.`, end: true }
      ]
    },
    knock_back: {
      speaker: "narrator",
      text: `You rap the oak with a knuckle: three slow, two quick, three slow. For a long moment nothing moves. Then, from a very great height, a single note falls down the stair, bright as a coin on stone: the smallest bell in the tower, struck once, lightly. It sounds like surprise. Then like pleasure. Then, tentatively, like a question you cannot answer.\n\nYou have been heard. There is, up there, a person who has not been answered by a human knock in a very long time.`,
      onEnter: [{ set: "tower_greeted", val: true }, { xp: 2 }, { thought: "th_hob_bell" }],
      interjections: [
        { skill: "solidarity", min: 2, text: `We. We are not alone in this building. There is somebody at the top of it, ringing, hoping, and nobody has told us. We should have asked.` },
        { skill: "empathy", min: 3, text: `A lonely man at the top of a tower with a bell for a voice. Whatever he is guarding, he has been waiting for a visitor longer than he has been guarding it.` }
      ],
      choices: [{ text: `Step away from the door.`, end: true }]
    },
    lock: {
      speaker: "narrator",
      text: `A Ministry padlock, regulation black, with a keyhole the shape of a stylised bell. It is a good lock. The hasp, however, was fitted by the school's own caretaker, and is hanging by three screws that have been losing a long argument with the damp. A proper lockpick would not even be needed; a dessert spoon would do. The door is only closed against people who respect the padlock.`,
      choices: [
        { text: `[Take the hasp off with a bent spoon.]`, check: { skill: "slip", diff: 13, id: "tower_door_hasp", white: false, pass: "hasp_ok", fail: "hasp_bad" }, cond: "has('bent_spoon')" },
        { text: `[Shoulder the door.]`, check: { skill: "brawn", diff: 15, id: "tower_door_shoulder", white: false, pass: "hasp_ok", fail: "hasp_bad" } },
        { text: `Leave it.`, end: true }
      ]
    },
    hasp_ok: {
      speaker: "narrator",
      text: `The screws come out with a soft rust-coloured sigh. The oak gives an inch, then a foot. A stair of black iron winds up out of the light, and a smell of old rope and pigeon and cold brass comes down it like a held breath let go. Somewhere far above, a bell shifts its weight.\n\nYou have opened the door to the tower a day before the day it was meant to be opened.`,
      onEnter: [{ set: "tower_open", val: true }, { xp: 3 }, { surv: 6 }],
      choices: [{ text: `Climb.`, end: true }]
    },
    hasp_bad: {
      speaker: "narrator",
      text: `Something gives, and it is not the hasp. A very loud, very flat clack goes up the stairwell and comes back down in six echoes, and in the reading room, a chair scrapes. The librarian looks up. She does not say anything. She does not need to. The silence that follows is a form of fine.`,
      onEnter: [{ surv: 8 }, { hp: -1 }],
      choices: [{ text: `Retreat to the shelves.`, end: true }]
    },
    d3: {
      speaker: "narrator",
      text: `The padlock hangs open from the hasp, as if it had decided of its own accord. The black oak door stands ajar by a hand, and from the stairwell above comes the dry cold smell of rope and brass and pigeon, and the sound of a person walking very slowly in felt slippers on a floor that has been walked for forty years. Someone has swept the stair. Someone has chalked an arrow on the lowest step: UP.\n\nIt is the Jubilee. It is Thursday. The tower, apparently, has been told.`,
      onEnter: [{ set: "tower_open", val: true }],
      interjections: [
        { skill: "the_grey", min: 3, text: `Up. Everything up here is up. All the weather of the district comes to rest at the end of this stair and takes its hat off.` },
        { skill: "volition", min: 4, text: `Whatever happens at the top, it will be loud, and you will be tired, and you will do it anyway. That is the whole of the day. Climb.` }
      ],
      choices: [{ text: `Climb.`, end: true }]
    }
  }
},

// ============================================================ MATRON PRITT
matron: {
  title: "Matron Pritt",
  start: [
    { cond: "day < 2", node: "d1" },
    { cond: "day >= 2 && time >= 810 && !flag.matron_inspection_done", node: "inspect_start" },
    { cond: "flag.matron_talked", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    d1: {
      speaker: "matron",
      text: `'Daytime access to the dormitory is not permitted, dear.' The woman with the clipboard stands in the doorway like a decent sort of boulder. 'Beds are aired between eight and six. It is in the Regulations. Everything good is in the Regulations, and everything in the Regulations is good.' Her pencil hovers over a page that already has your name on it. 'Run along. Come back when it's dark, and you shall have cocoa.' She says *cocoa* in a way that makes the whole building seem to lean.\n\nShe writes something. She doesn't say what. It is, you suspect, the time.`,
      interjections: [
        { skill: "instinct", min: 3, text: `She did not ask who you were. She knew. She has known everybody's name since before they arrived. The book in her hand is not for remembering. It is for confirming.` },
        { skill: "archive", min: 4, text: `Matron Hallow Pritt, Dormitory Matron since the Year of the Long Frost. Four commendations, all for 'diligent observation'. No reprimands, which in this school means nobody has ever looked.` }
      ],
      choices: [{ text: `'Of course. Sorry to disturb you.'`, end: true }, { text: `Slip past anyway.`, end: true, effects: [{ surv: 2 }] }]
    },
    first: {
      speaker: "matron",
      text: `'Do sit, dear.' She does not, herself; she stands behind her lectern, which is a school music stand with a ledger on it and a pencil on a string. 'I like to get to know the third floor. Not the faces. Faces are for the Vanguard. I like to know what a person does between a door and a bed.' She turns a page without looking at it. 'You came in at nine-thirty-one on Tuesday. Muddy knees. Chalk on both hands. Said nothing to anybody, and then you slept like the dead. I put the blanket back on you twice.'\n\nShe smiles, a soft complicated smile with a great many reasons in it. 'It's the little things, you see. If somebody doesn't keep them, they go.'`,
      onEnter: [{ set: "matron_talked", val: true }, { thought: "th_matron_eyes" }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She means it. The little things. She says it the way you say a name in a prayer. This is not a gossip. This is a woman who is afraid of what happens when nobody writes it down.` },
        { skill: "deduction", min: 3, text: `Muddy knees. Chalk on both hands. She has noted the chalk. She has noted it for a reason other than hygiene. It is going into somebody else's file by the end of the week.` },
        { skill: "doublethink", min: 2, text: `A lovely woman. An angel of the third floor. Whatever she writes down, it is only ever to protect you. Tell her everything, friend. She will put it in the right drawer.` },
        { skill: "the_grey", min: 3, text: `Her book smells of pencil and liniment. That is all it smells of. It is the book that is the most dangerous thing on this floor, and it smells like a nursery.` }
      ],
      choices: [
        { text: `'What do you write in the book, Matron?'`, goto: "book" },
        { text: `'I'll try to keep my knees clean.'`, goto: "hub" },
        { text: `Say nothing. Wait.`, goto: "hub", effects: [{ xp: 1 }] }
      ]
    },
    hub: {
      speaker: "matron",
      text: [
        `'Yes, dear?' The pencil lifts a quarter-inch, which is her way of saying she is, for the moment, listening instead of writing. 'I have forty minutes before the nine o'clock Harmony notice, and a long list of other people's trouble. Choose.'`,
        `Matron Pritt takes her glasses off to polish them on the hem of her cardigan, which is a threat if you know the grammar. 'Well?'`
      ],
      interjections: [
        { skill: "composure", min: 4, text: `Her pencil has not moved. A pencil that does not move is waiting for you to give it a reason.` },
        { skill: "senses", min: 4, text: `A faint wax-and-cotton smell at the side of her head. Earplugs, in a little tin, in her left pocket. She does not hear the Bell. She hears everything else.` }
      ],
      choices: [
        { text: `'Tell me about the book.'`, goto: "book", cond: "!flag.matron_book_asked" },
        { text: `'The Inspector. Has he asked about me?'`, goto: "voss_list", cond: "day >= 2 && !flag.matron_voss_asked" },
        { text: `[Offer her something sweet. Ask a favour.]`, goto: "bribe", cond: "!flag.matron_bribed && (has('ration_coupon') || has('sweet_roll') || has('cigarettes') || has('ration_tea'))" },
        { text: `'I found a card in the library catalogue. It has a name on it.'`, goto: "irris_card", cond: "flag.catalog_irris_card && !flag.matron_irris_closed" },
        { text: `'Matron, who is Irris?'`, goto: "irris", cond: "flag.matron_book_pressed && !flag.matron_irris_known" },
        { text: `'Why do you plug your ears at night?'`, goto: "earplugs", cond: "flag.matron_book_asked && !flag.matron_ears_asked" },
        { text: `[Try to take the book from the lectern.]`, goto: "steal_try", cond: "!flag.matron_steal_tried && !has('matron_ledger')" },
        { text: `'What time is the inspection?'`, goto: "rounds_hint", cond: "day >= 2 && !flag.matron_inspection_done && !flag.matron_hinted" },
        { text: `'Nothing, Matron. Good day.'`, end: true }
      ]
    },
    book: {
      speaker: "matron",
      text: `'Oh, everything.' She turns the ledger round so that you can see the page, which is a trick: the page is perfectly innocent. *Wed, 06:55 Kessel D. to bathroom. 07:10 returned. 07:40 Orrin I. to Library (wheelchair, ramp). 08:15 Wren, to kitchen. 08:20 Wren, to boiler stair (?).* 'Who comes, who goes. Boots, in and out. Who leaves their light on. Who talks in their sleep.' She taps the question mark. 'I have been keeping a book since the day the bed-rolls came. Twelve years. Forty-one volumes. You would be amazed how little anyone needs to be told, if you simply keep the times.'\n\nShe looks up. 'It is a kindness. Somebody has to remember when you were small.'`,
      onEnter: [{ set: "matron_book_asked", val: true }, { xp: 1 }, { note: "task_matron", text: `Matron Pritt keeps forty-one volumes of who comes and goes. She calls it a kindness. I think she also sells it.` }],
      interjections: [
        { skill: "archive", min: 3, text: `Forty-one volumes, twelve years. That is a fire-code violation and a treason in several languages. It is also the single most accurate record of the third floor in existence. Every dormitory in the Union has a Matron. Every Matron has this.` },
        { skill: "rote", min: 3, text: `DORMITORY REGULATION THIRTY: THE MATRON SHALL KEEP A REGISTER. REGULATION THIRTY-ONE: THE REGISTER SHALL BE SURRENDERED TO ANY OFFICER OF THE STATE ON REQUEST. REGULATION THIRTY-TWO: THE MATRON SHALL NOT READ HER OWN REGISTER.` },
        { skill: "empathy", min: 4, text: `'Somebody has to remember.' Note the grammar: not *I*, not *we*. Somebody. She wishes it were somebody else.` }
      ],
      choices: [
        { text: `[Press her: who reads the book besides you?]`, check: { skill: "rhetoric", diff: 10, id: "matron_book_press_rhetoric", white: true, pass: "book_press", fail: "book_deflect" } },
        { text: `[Read her: what is she afraid of?]`, check: { skill: "empathy", diff: 9, id: "matron_book_press_empathy", white: true, pass: "book_press", fail: "book_deflect" } },
        { text: `'It sounds like very careful work.'`, goto: "hub", effects: [{ surv: -1 }] }
      ]
    },
    book_deflect: {
      speaker: "matron",
      text: `'Who reads it?' She laughs, a soft clucking laugh. 'Dear, who reads anything? I write; the days pass; the volumes go in a box.' She closes the ledger. The pencil, you notice, has come to rest pointing at you. 'You are a very curious child. That is not a criticism. I am only noting it.'\n\nShe notes it. The scratching of the lead is quite distinct.`,
      onEnter: [{ surv: 2 }],
      choices: [{ text: `Back off.`, goto: "hub" }]
    },
    book_press: {
      speaker: "matron",
      text: `The pencil stops. She is looking at the music-stand as though she had never seen it before. 'A gentleman collects them,' she says, in a quite different voice. 'On the first of the month. A grey coat. He signs for them on a slip. He has never once asked me to read them. He doesn't need to. I'm not the reader, you see. I'm the pen.' Her hand moves to her throat, to a small cameo brooch of a woman's face. 'In return he tells me if there's anyone. Anyone on the transfer lists. He says he is looking. It has been two years and eight months. He is still looking.'\n\nShe takes a breath that does not go all the way down. 'Don't tell me what you think of that.'`,
      onEnter: [{ set: "matron_book_pressed", val: true }, { xp: 2 }, { note: "task_matron", text: `A grey-coated man collects Matron Pritt's books on the first of every month. In exchange he promises to look for 'anyone on the transfer lists'. She wears a cameo of a woman's face.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `A cameo. A woman's face. Not her own. The brooch is worn flat where a thumb has rubbed it, forty times a day, for two years and eight months.` },
        { skill: "dialectics", min: 3, text: `She informs on children to find a child. That is a perfectly coherent position. It is the position of every person who has ever kept a book for the State.` },
        { skill: "solidarity", min: 3, text: `We are all pens, at some time. The thing is to notice whose hand.` }
      ],
      choices: [
        { text: `'I won't tell you what I think.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] },
        { text: `'That man is lying to you. He has been for two years.'`, goto: "book_blunt", effects: [{ morale: -1 }] }
      ]
    },
    book_blunt: {
      speaker: "matron",
      text: `She does not flinch. That is the worst of it. She straightens the ledger on the stand with the exact fussiness of someone tidying a coffin. 'I know,' she says. 'Of course I know. Do you think I don't know? I'm not a fool, dear. I have forty-one volumes of knowing.' Her lower lip does something small. 'But if I say it out loud, there is nothing left to wait for. Do you understand that? It is the waiting that keeps her alive.'\n\nShe turns to the page and writes, in her small round hand, the time. 10:47. You watch her write it, and you realise it is the last thing she does, every time she cannot go on.`,
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "empathy", min: 2, text: `Don't. Don't make her say it twice. You have done enough harm for one morning with a good intention.` }
      ],
      choices: [{ text: `'I'm sorry, Matron.'`, goto: "hub" }]
    },
    irris: {
      speaker: "matron",
      text: `The name goes through her like a draught. 'Where did you hear that?' She has sat down, quite suddenly, on the edge of the nearest bunk, and the pencil has gone slack on its string. 'No. Don't say. I'll tell you.' The cameo. 'Irris Pritt. My sister's girl. Twelve years old, front-bunk, left of the door, a cough in the winter. She used to climb the radiator pipe to look at the street. She was taken by the Reading Room in the second week of term, for 'chalk on the wall'. It was chalk on *my* wall, dear. In *her* handwriting. She drew a little house.'\n\nShe looks at her own hands. 'She isn't on any list. I have checked twice. But I have never been given the *wrong* list. Only the empty ones.'`,
      onEnter: [{ set: "matron_irris_known", val: true }, { xp: 2 }, { thought: "th_chosen_family" }],
      interjections: [
        { skill: "empathy", min: 3, text: `A little house. In chalk. She has kept that wall unpainted for two years. It is under the portrait. It is the only part of the room that is not clean.` },
        { skill: "archive", min: 4, text: `Pritt, I. Form 41-C, 'Corrective Transfer (Minor)', dated the second week of the autumn term, two years back. Destination field: blank. Not 'classified'. *Blank*. A person who is not sent anywhere has nowhere to be found.` }
      ],
      choices: [{ text: `'I'll see what I can find.'`, goto: "hub", effects: [{ set: "matron_irris_promised", val: true }, { note: "task_matron", text: `Matron Pritt's niece Irris was taken to the Reading Room two years ago for chalk on a wall. Matron keeps the book to find her. If I can find a card, a record, anything: it would change her.` }] }]
    },
    irris_card: {
      speaker: "narrator",
      text: `You tell her about the catalogue, the long drawers of cards in the librarian's hand, the Index nobody is supposed to know exists. You tell her about the card with PRITT, IRRIS on it and the line beneath: *Reading Room, Ward 3. Static-resistant. Asks for her aunt. Asks for the house.*\n\nMatron Pritt makes no sound at all. She sits with the ledger open on her knees and her pencil on its string, and she lifts her hand, and she puts it flat on the page, and the page is the kind of white that a page is when somebody has stopped writing on it. 'Ward three,' she says. 'Asks for the house.' She laughs, a single astonished note. 'She remembers the *house*.'`,
      onEnter: [{ set: "matron_irris_closed", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { surv: -3 }],
      interjections: [
        { skill: "solidarity", min: 2, text: `We. We did that. We put a name where a name was missing. It is the whole of our politics and it takes one card.` },
        { skill: "empathy", min: 3, text: `She is not crying. She is doing arithmetic with her face. Two years and eight months. She is, for the first time, counting forward.` }
      ],
      choices: [{ text: `Wait.`, goto: "give_ledger" }]
    },
    give_ledger: {
      speaker: "matron",
      text: `She closes the ledger and holds it a moment against her chest the way you would hold a sleeping thing. Then she lifts the pencil off its string and puts both of them in your hands. 'The grey man's collecting on the first. I'll tell him the volume's gone astray. Tell him a child took it.' A small steely sound in her voice. 'Tell him a child with chalk on its hands.'\n\n'It's all in there. Every time anybody went through that door, for twelve years. Somebody should remember it who isn't afraid to.' She touches the cameo. 'And if you hear a line, a *single* line about a house, you will tell me. At any hour. I sleep with a very light conscience now.'`,
      onEnter: [{ give: "matron_ledger" }, { set: "matron_gave_ledger", val: true }, { set: "matron_informs", val: false }, { task: "task_matron", state: "done" }, { thought: "th_burned_paper" }, { toast: "Received: Matron's Ledger" }],
      interjections: [
        { skill: "archive", min: 3, text: `Forty-one volumes and, at the end of the row, the *current* one. The dates will tell you who was where when. It is the most thorough witness in the school. It simply never had anybody to testify to.` },
        { skill: "deduction", min: 4, text: `Whoever else was out on Tuesday night will be in this book. Rhea's boots on the stairs. A man in a grey coat at the side door. Your own muddy knees. Read it. It contains the shape of an alibi.` }
      ],
      choices: [{ text: `'Thank you.'`, goto: "hub" }]
    },
    voss_list: {
      speaker: "matron",
      text: `'Has he asked about you?' The pencil makes a decisive little tick. 'He asked for a list of anybody who sleeps badly, dear. And anybody who *complains of ringing.*' The word sits in the room. 'He had the most gentle voice. He took tea in my office at six this morning. He asked after my feet. I told him about my feet. And then I told him about the third floor.'\n\nShe says it as a statement of fact, without apology. 'You were on the list. I put you on it before he asked. It is better to be on the list from the matron than from the Vanguard, don't you think? I write kindly.'`,
      onEnter: [{ set: "matron_voss_asked", val: true }, { surv: 3 }, { note: "task_voss", text: `Inspector Voss asked Matron Pritt for a list of students who complain of ringing. I am on it. She says she wrote it kindly.` }],
      interjections: [
        { skill: "instinct", min: 3, text: `He asked about the ringing. Not the Commissar, not the portrait. The ringing. He is looking for the exact thing you are.` },
        { skill: "authority", min: 3, text: `YOU CANNOT STOP THE LIST. YOU CAN ONLY CHANGE WHO HOLDS THE PENCIL.` },
        { skill: "doublethink", min: 2, text: `A kindly list! A list is a promise that someone is thinking about you. Wouldn't it be lovely to be thought about?` }
      ],
      choices: [
        { text: `'Take me off it.'`, goto: "off_list" },
        { text: `'Thank you for being gentle.'`, goto: "hub", effects: [{ surv: -2 }, { ideo: "vanguard", n: 1 }] },
        { text: `Say nothing. Leave.`, end: true }
      ]
    },
    off_list: {
      speaker: "matron",
      text: `'Off?' She sounds as though you had asked her to un-bake a cake. 'My dear, one doesn't go *off*. A name, once written, is simply a name. I can only put *another* line underneath it, and say it was a mistake.' A thoughtful tap of the pencil. 'It would take a favour. Several.'\n\nShe lets the sentence sit. In her hands a single sheet of rubber-stamped paper appears, as if it had been up her sleeve all the time. 'There is a way to make a person very difficult to read.'`,
      choices: [
        { text: `[Persuade her: you are a student, not a case.]`, check: { skill: "charm", diff: 11, id: "matron_off_list_charm", white: true, pass: "off_ok", fail: "off_bad" } },
        { text: `[Offer her a trade: something she's missing.]`, goto: "hub", cond: "flag.matron_irris_known && !flag.matron_irris_closed", effects: [{ set: "matron_trade_offered", val: true }] },
        { text: `'Never mind.'`, goto: "hub" }
      ]
    },
    off_ok: {
      speaker: "matron",
      text: `She regards you for a long while, a stout woman in a cardigan, and slowly, softly, she tuts. 'You've a sweet way about you. Forty-one volumes and I never learned that.' The pencil goes down and, beneath your name on the page, a second line appears in her round hand: *Struck. Clerical error. Sleeps very well.* 'There,' she says. 'Nobody will read past it.' A wink, quite terrible. 'Don't make me regret it.'`,
      onEnter: [{ xp: 2 }, { surv: -6 }, { set: "matron_struck", val: true }],
      choices: [{ text: `'Thank you, Matron.'`, goto: "hub" }]
    },
    off_bad: {
      speaker: "matron",
      text: `'Oh dear.' She sounds sincerely disappointed. 'You tried a smile on me. I have been smiled at by Commissars.' The pencil makes a note, and you notice that it is a longer note than the last. 'I don't mind, dear. Only: if you are the sort of person who is going to be charming, I have to be the sort who writes it down.'`,
      onEnter: [{ surv: 4 }],
      choices: [{ text: `Retreat.`, goto: "hub" }]
    },
    earplugs: {
      speaker: "matron",
      text: `'Ah.' She takes a little tin from her cardigan, a tobacco tin with a bird on it, and opens it: two grey pellets of wax and cotton. 'My mother's trick, from the factory. A girl could work through a siren with these.' She sets them down on the stand as one sets down a pair of cufflinks. 'The Bell comes at nine. At ten past, I am hearing the pipes and my own pulse. And I write it all down, dear, the time it begins, the time it ends, who is wide awake in their bed, who is humming, who is pretending to hum.'\n\nHer face is quite calm. 'And every morning I read what I wrote the night before, and I do not recognise the hand.'`,
      onEnter: [{ set: "matron_ears_asked", val: true }, { xp: 2 }, { thought: "th_matron_eyes" }],
      interjections: [
        { skill: "the_grey", min: 3, text: `Wax and cotton against an E-flat that is built to go through bone. I admire her optimism. She hears nothing and forgets anyway. The tone goes in by the teeth.` },
        { skill: "empathy", min: 4, text: `She does not recognise her own hand in the morning. So the book is not for the Ministry. It is for her. It is the only way she can meet herself at breakfast.` },
        { skill: "dialectics", min: 3, text: `She informs to be remembered. The State informs to forget. The same pen, the same paper, two opposite uses. Both are called diligence.` }
      ],
      choices: [{ text: `Say nothing. Nod.`, goto: "hub" }]
    },
    bribe: {
      speaker: "matron",
      text: `You put a little something on the lectern's edge, with the nonchalance of a child leaving a note for a god. The pencil stops dead. 'Is that...' She does not finish. She does not touch it. 'I don't take things, dear.' A pause. 'I *accept*, in certain circumstances. It is a distinction. A tin of biscuits for the Spring Fete. A donation to the Home. Which would you like it to be?'`,
      choices: [
        { text: `Give her a ration coupon. 'For the Spring Fete.'`, goto: "bribe_ok", cond: "has('ration_coupon')", effects: [{ take: "ration_coupon" }] },
        { text: `Give her the sweet roll. 'For the Home.'`, goto: "bribe_ok", cond: "has('sweet_roll')", effects: [{ take: "sweet_roll" }] },
        { text: `Give her a cigarette. 'For nothing in particular.'`, goto: "bribe_cig", cond: "has('cigarettes')" },
        { text: `Give her the ration tea. 'To keep you warm at night.'`, goto: "bribe_ok", cond: "has('ration_tea')", effects: [{ take: "ration_tea" }] },
        { text: `Take it back. 'On reflection, no.'`, goto: "hub" }
      ]
    },
    bribe_ok: {
      speaker: "matron",
      text: `The gift vanishes into the cardigan as smoothly as a coin into a collection plate. 'How thoughtful,' she says. 'I shall put you down for *generous*.' She writes it. 'At two o'clock, when I make my little round of the beds, I will be, shall we say, *thorough but brief*. A woman of my age gets tired in the corners. It would be a pity to trouble everyone with the corners.' She smiles. It is a smile with no softness in it whatever. 'You didn't hear that from me.'`,
      onEnter: [{ set: "matron_bribed", val: true }, { xp: 1 }, { surv: 2 }, { set: "matron_informs", val: true }],
      interjections: [
        { skill: "doublethink", min: 2, text: `A gift to a public servant is simply good manners. Don't think of it as a bribe. Think of it as a very small tax paid voluntarily.` },
        { skill: "instinct", min: 3, text: `Now she owns something of yours. It is not the coupon. It is the line in the book that says *generous*. It will cost you later.` }
      ],
      choices: [
        { text: `Continue.`, goto: "inspect_bribed", cond: "day >= 2 && time >= 810 && !flag.matron_inspection_done" },
        { text: `Continue.`, goto: "hub", cond: "!(day >= 2 && time >= 810 && !flag.matron_inspection_done)" }
      ]
    },
    inspect_bribed: {
      speaker: "matron",
      text: `The Matron's round is, as promised, thorough but brief. She does the east bunks with a flick of the pencil, opens one locker and shuts it with a murmur of approval, lifts the lid of a tin and finds that she is, at that moment, *unaccountably tired.* 'Well,' she says, to the room. 'A good hymn, mostly. A little flat in the corners.' Her eyes rest on Dov's blanket for exactly as long as it takes to decide not to see it. 'Third floor, satisfactory.' At the door she turns and gives you a very small, very private nod, the nod of a woman who has just added a line to a ledger that you will never be permitted to read.\n\nThe door shuts. Dov, from the bunk, breathes: 'Whatever you paid, I owe you *double.*'`,
      onEnter: [{ set: "matron_inspection_done", val: true }, { task: "task_matron", state: "done" }, { xp: 2 }, { set: "day2_inspection_bribed", val: true }, { set: "dov_stash_saved", val: true }],
      choices: [{ text: `Exhale.`, end: true }]
    },
    bribe_cig: {
      speaker: "matron",
      text: `She looks at the cigarette for a very long time. Then, with the gravity of a woman picking up a dead mouse, she puts it back. 'I do not smoke,' she says, 'and the Regulation against them is the only one I have ever enjoyed.' She writes something. 'Next time, dear, try a sweet.'`,
      onEnter: [{ surv: 3 }],
      choices: [{ text: `Retreat.`, goto: "hub" }]
    },
    rounds_hint: {
      speaker: "matron",
      text: `'Two o'clock sharp.' She says it with considerable satisfaction. 'I do the east bunks first, then the lockers, then the tins. Always the tins last, because boys hide things where they think I am too polite to look.' A sharp little nod. 'And I always bring a cadet to hold the clipboard, so that nobody can say I was alone.' She smiles. 'You may tell the others. Fair warning is the whole of my method.'\n\nIt is, you realise, a lie. Or it is the truth in the shape of a lie. Either way it is information.`,
      onEnter: [{ set: "matron_hinted", val: true }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 3, text: `East bunks, lockers, tins. In that order. Which means, if she means it, the tins are the last thing she touches. The radiator vent is under the *east* window. She'll have walked past it twice before she looks at anything else.` },
        { skill: "slip", min: 3, text: `There is a window of eleven minutes while she does the bunks. Eleven minutes is a very long time to a person whose profession is not being there.` }
      ],
      choices: [{ text: `'Thank you, Matron.'`, goto: "hub" }]
    },
    steal_try: {
      speaker: "narrator",
      text: `The ledger lies open on its music stand, sixty pages ahead of the ribbon, on a line that begins *Wed*. The pencil hangs from its string at the exact length that allows her to write and prevents you from running with it. She is at the window. She is, for the moment, looking at nothing. You could, with two fingers and a cough, make the book very shy.`,
      onEnter: [{ set: "matron_steal_tried", val: true }],
      choices: [
        { text: `[Lift the book while she watches the window.]`, check: { skill: "sleight", diff: 14, id: "matron_steal_sleight", white: false, pass: "steal_ok", fail: "steal_bad" } },
        { text: `[Wait for her to turn her back.]`, check: { skill: "slip", diff: 13, id: "matron_steal_slip", white: false, pass: "steal_ok", fail: "steal_bad" } },
        { text: `Think better of it.`, goto: "hub" }
      ]
    },
    steal_ok: {
      speaker: "sleight",
      text: `Ten cheerful thieves in a trench coat. The pencil string, the lectern's tilt, the book's one inch of weight against the stand: one cough, one gesture, one lean. The ledger is under your jumper before she has finished frowning at the window. It is heavier than a book should be. It is very, very warm.\n\nShe will notice by the afternoon. She is, after all, a woman who notices everything but the thing in front of her.`,
      onEnter: [{ give: "matron_ledger" }, { xp: 4 }, { surv: 6 }, { set: "matron_ledger_stolen", val: true }, { toast: "Received: Matron's Ledger" }],
      choices: [{ text: `Slip away.`, end: true }]
    },
    steal_bad: {
      speaker: "matron",
      text: `Her hand is on the book before yours is. It does not snatch; it simply rests, plump and sure, on the page, as a hand rests on a sleeping child. 'No, dear,' she says. 'No.' She does not look at you. She is looking at the line she was in the middle of writing. 'I shall have to put that down. Fourteen-fifty, boy in the third bunk, hand on the book. I shall have to put it down *accurately*.' The pencil moves.\n\nFor the first time all morning, her voice has nothing kind left in it.`,
      onEnter: [{ surv: 10 }, { morale: -1 }, { set: "matron_informs", val: true }],
      choices: [{ text: `Retreat.`, end: true }]
    },

    // ----- THE INSPECTION SET-PIECE
    inspect_start: {
      speaker: "narrator",
      text: `Two o'clock arrives in the dormitory like a bailiff. The door opens without a knock, and Matron Pritt enters, clipboard at her chest, cardigan buttoned to the throat, with a cadet in tow, a stiff-necked boy with a Vanguard pin and the soul of a lamp-post. 'Hands out of pockets,' she says brightly. 'Beds. Lockers. Tins. A hymn, I said. I want to see a hymn.'\n\nShe begins on the east bunks. Behind her, Dov is sitting very upright on his blanket, holding the corner of it with the unmistakable air of a man sitting on a body. Wren has put the gerbil inside her jumper. The gerbil is making a very small noise.`,
      voices: 3,
      onEnter: [{ set: "matron_inspection_started", val: true }, { task: "task_matron", state: "active" }],
      interjections: [
        { skill: "adrenaline", min: 3, text: `NOW! Hide everything! No: don't move! No: move! WHAT ARE YOU DOING WITH YOUR HANDS?!` },
        { skill: "composure", min: 3, text: `Face. Posture. Do not look at the radiator. Do not look at the gerbil. Do not look at Dov. You are an innocent bed, surrounded by guilty furniture.` },
        { skill: "slip", min: 3, text: `You have eleven minutes while she does the east bunks. Move like you are already somewhere else.` },
        { skill: "reflex", min: 3, text: `The gerbil is about to escape. Watch the jumper. The jumper is about to give.` }
      ],
      choices: [
        { text: `[Take a position. Make a plan.]`, goto: "inspect_hub" },
        { text: `Offer the Matron a small something to be brief.`, goto: "bribe", cond: "!flag.matron_bribed && (has('ration_coupon') || has('sweet_roll') || has('ration_tea'))" },
        { text: `Do nothing. Let it come.`, goto: "res_check", effects: [{ surv: 3 }] }
      ]
    },
    inspect_hub: {
      speaker: "narrator",
      text: `Three things are in danger. In Dov's blanket: a hillside of tram tokens, a roll of half-finished passes, and a rubber stamp that says EXIT in a font only the State possesses. In Wren's jumper: a gerbil named Corporal Fluff and, behind the radiator grille, the shell of a crystal set. In your own footlocker, at the foot of your bunk: whatever Yesterday-You thought was safe.\n\nThe Matron has done the first two bunks. At this rate she will reach yours in five minutes. She works, you notice, left to right.`,
      voices: 3,
      interjections: [
        { skill: "deduction", min: 3, text: `Left to right, east to west. Dov's bunk is third from the east. Wren's is fourth. Yours is last. The tins are on the table, which she saves for the end. You have, as it were, the whole of the aisle to yourself.` },
        { skill: "volition", min: 3, text: `You cannot save all three. You can try for all three. Those are different decisions and you should know which one you are making.` },
        { skill: "empathy", min: 3, text: `Dov is not afraid of the Matron. He is afraid of what the stash is *for*. Wren is not afraid at all. That is the thing to watch.` }
      ],
      choices: [
        { text: `Save Dov's stash.`, goto: "stA", cond: "!flag.ins_A" },
        { text: `Save Wren's gerbil and her set.`, goto: "stB", cond: "!flag.ins_B" },
        { text: `Save your own footlocker.`, goto: "stC", cond: "!flag.ins_C" },
        { text: `The Matron has finished the bunks. Face the results.`, goto: "res_check", cond: "flag.ins_A && flag.ins_B && flag.ins_C" },
        { text: `Stop. You cannot do any more. Stand there.`, goto: "res_check", cond: "!(flag.ins_A && flag.ins_B && flag.ins_C)" }
      ]
    },
    stA: {
      speaker: "dov",
      text: `'The vent,' Dov hisses, not moving his lips. 'The radiator vent. Under the window. It's a gap the size of a loaf. If somebody, *anybody*, who was not me, put a blanket over their shoulder and sat down on that radiator, and something happened to be in the blanket.' He is vibrating very slightly. 'I can't. She watches me. She watches me like a hawk watches a statue. You, though. You have a face like a closed shop.'\n\nThe three stacks of tokens, the passes, the EXIT stamp. He pushes them across the blankets toward you with one foot, as one shoves a dog under a table.`,
      onEnter: [{ set: "ins_A", val: true }, { xp: 1 }],
      choices: [
        { text: `[Slip the stash into the vent while she works.]`, check: { skill: "slip", diff: 11, id: "matron_ins_slip", white: false, pass: "stA_pass", fail: "stA_fail" } },
        { text: `[Palm it into your sleeve: the oldest hiding place.]`, check: { skill: "sleight", diff: 11, id: "matron_ins_sleight", white: false, pass: "stA_pass", fail: "stA_fail" } },
        { text: `[Throw it, in one go, into the stairwell through the open window-top.]`, check: { skill: "aim", diff: 12, id: "matron_ins_aim", white: false, pass: "stA_pass", fail: "stA_fail" } },
        { text: `'No. I'm not hiding that for you.'`, goto: "stA_refuse", effects: [{ set: "ins_A_lost", val: true }] }
      ]
    },
    stA_pass: {
      speaker: "narrator",
      text: `The vent swallows the whole hillside without a clink. You are back on your bunk before the gerbil has finished panicking, with a blanket over your knees like an old man waiting for a train. When the Matron reaches the table she lifts each tin in turn, peers into it, sniffs, and finds only buttons. 'Buttons,' she says, with faint disappointment. 'A button is not a crime.' Dov, across the aisle, goes the colour of a boiled egg and begins very quietly to breathe.\n\nHe does not look at you. He does not need to. A debt has just gone up the stairs in the dark.`,
      onEnter: [{ add: "ins_ok", n: 1 }, { xp: 2 }, { set: "dov_stash_saved", val: true }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stA_fail: {
      speaker: "narrator",
      text: `A single token escapes the blanket, a small bright disc with a tram stamped on it, rolling across the floorboards at the speed of a guilty conscience. It rings against the leg of the Matron's lectern and stops. Everybody in the room looks at it. 'Oh,' says the Matron, softly, bending. 'What have we here?'\n\nDov closes his eyes. There is a short and awful silence in which the whole business of a boy's autumn goes into a pocket of a cardigan.`,
      onEnter: [{ add: "ins_bad", n: 1 }, { surv: 4 }, { set: "dov_stash_lost", val: true }, { morale: -1 }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stA_refuse: {
      speaker: "dov",
      text: `'Right.' Dov nods slowly, with the awful courtesy of the betrayed. 'Right. That's, yes. That's reasonable. I am only a market. I have no claim on anybody's character.' He draws the blanket tight over his knees and stares straight ahead. 'I'd just like it on the record that I would have done it for you.'\n\nHe means it. That is the knife. Behind you, the Matron has finished the second bunk.`,
      onEnter: [{ add: "ins_bad", n: 1 }, { set: "dov_stash_lost", val: true }, { ideo: "vanguard", n: 1 }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stB: {
      speaker: "wren",
      text: `'Corporal Fluff has a *rank*,' Wren whispers, with deep injury, as the jumper writhes. 'If she finds him she will put him *in the Home.* I know about the Home. It's got a washing-machine.' She digs a hand into the jumper and retrieves, with the face of a surgeon, a shivering ginger gerbil. 'And the set is in the radiator. I put it there on purpose, because it's warm, and because nobody looks *inside* a radiator.' She pauses. 'Nobody except a matron.'\n\nCorporal Fluff regards you with large dark eyes. He is an excellent judge of character and he has not made up his mind.`,
      onEnter: [{ set: "ins_B", val: true }, { xp: 1 }],
      choices: [
        { text: `[Distract the Matron with a sweet question.]`, check: { skill: "charm", diff: 10, id: "matron_ins_charm", white: false, pass: "stB_pass", fail: "stB_fail" } },
        { text: `[Catch the gerbil when he bolts.]`, check: { skill: "reflex", diff: 11, id: "matron_ins_reflex", white: false, pass: "stB_pass", fail: "stB_fail" } },
        { text: `[Make the Matron believe the gerbil is a government mascot.]`, check: { skill: "rhetoric", diff: 12, id: "matron_ins_rhetoric", white: false, pass: "stB_pass", fail: "stB_fail" } },
        { text: `'It's a gerbil. Put it in the corridor.'`, goto: "stB_corridor" }
      ]
    },
    stB_pass: {
      speaker: "narrator",
      text: `The gerbil goes up a sleeve, comes down a trouser, and ends in your jacket pocket as if the whole of the manoeuvre had been rehearsed on a stage. Matron Pritt lifts the radiator grille, peers in, and withdraws, with a handkerchief, a smear of soot. 'Filthy,' she says. 'Someone should write a letter.' She does not look at your pocket, which is, at that moment, very busy.\n\nWren, across the aisle, says without a sound: *Thank you*. Then, with a sound: 'You owe me a sweet *and* a gerbil.'`,
      onEnter: [{ add: "ins_ok", n: 1 }, { xp: 2 }, { set: "wren_gerbil_saved", val: true }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stB_fail: {
      speaker: "narrator",
      text: `The gerbil bolts. It travels along the length of the aisle at a speed that does Corporal Fluff credit, up the Matron's trouser-leg, around her ankle, and then, in a final gesture of great artistry, over the toe of her slipper. 'ARGH,' says the Matron, with real surprise, and then, very evenly, 'Cadet. Close the door. Nobody leaves.' She picks up Corporal Fluff by the scruff. He regards her with the grave dignity of a prisoner.\n\n'Pets,' she says, in a voice like a closing cupboard, 'are Regulation Sixty-One.'`,
      onEnter: [{ add: "ins_bad", n: 1 }, { surv: 3 }, { set: "wren_gerbil_lost", val: true }, { morale: -1 }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stB_corridor: {
      speaker: "narrator",
      text: `You scoop the gerbil into your palm, cross the room and drop him gently into the corridor, with a whispered instruction to run to the boiler stair and not to ask questions. The Matron, who has seen you do it, writes something. Wren, over your shoulder, gives you a look of such open, undefended love that the whole room seems to go quiet.\n\n'He'll be fine,' she says, quite certain. 'He knows the way.'`,
      onEnter: [{ add: "ins_ok", n: 1 }, { xp: 1 }, { surv: 2 }, { set: "wren_gerbil_saved", val: true }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stC: {
      speaker: "narrator",
      text: `Your footlocker. Iron-cornered, small, dented, locked with a hook. The Matron will do it last, after the table, because she is a woman of method. You have a moment, thirty seconds, to decide what in it you can bear her seeing. You lift the lid. A change of shirt, a school cap, a wooden comb with three teeth missing, a half-eaten crust of Bronka's rye. And at the bottom, under a folded blanket, a thermos with your mother's initials, and something you did not put there: a small hard bundle, wrapped in a school scarf.`,
      onEnter: [{ set: "ins_C", val: true }, { xp: 1 }],
      interjections: [
        { skill: "sleight", min: 3, text: `A scarf. The same scarf you carried on Tuesday night, I think. You wrapped something in it. It is not the Ledger. It is the *other* thing, the small thing, the thing you did not tell yourself.` },
        { skill: "instinct", min: 3, text: `Whatever it is, do not let her touch it. It is not dangerous. It is *personal*. There is a difference, and the Matron collects the second kind.` }
      ],
      choices: [
        { text: `[Stand in front of it with a flat, unreadable face.]`, check: { skill: "composure", diff: 10, id: "matron_ins_composure", white: false, pass: "stC_pass", fail: "stC_fail" } },
        { text: `[Swap the bundle for the Matron's own spare cardigan on the chair.]`, check: { skill: "sleight", diff: 12, id: "matron_ins_swap", white: false, pass: "stC_pass", fail: "stC_fail" } },
        { text: `[Bluff: say the Inspector himself asked that it not be opened.]`, check: { skill: "authority", diff: 12, id: "matron_ins_authority", white: false, pass: "stC_pass", fail: "stC_fail" }, cond: "flag.matron_voss_asked || has('warden_badge') || has('vanguard_armband')" },
        { text: `Open it yourself, now, to know.`, goto: "stC_open", cond: "!flag.ins_C_opened" }
      ]
    },
    stC_open: {
      speaker: "narrator",
      text: `You undo the scarf with the care of a person defusing a very small bomb. A slim brass key, no larger than a thumb, tied to a card. The card says, in your hand, in your own stubborn ink: *IF I WAKE UP SOFT: THE LIBRARY. THE ROPE. THE LADY WITH THE STAMP. TELL HER THE HOURS ARE QUIET.* The key is stamped with a tiny open book and the numeral 0.\n\nThere is no time to think what a key marked with a book is the key to. You pocket it. Behind you, the cadet clears his throat.`,
      onEnter: [{ set: "ins_C_opened", val: true }, { set: "stacks_hint_from_self", val: true }, { xp: 2 }, { note: "task_stacks", text: `A note from Yesterday-You in my own footlocker: IF I WAKE UP SOFT: THE LIBRARY. THE ROPE. THE LADY WITH THE STAMP. TELL HER THE HOURS ARE QUIET. A small brass key stamped with an open book and the numeral 0.` }],
      interjections: [
        { skill: "archive", min: 3, text: `'The hours are quiet.' It is a code-phrase, and an excellent one: so mild a clerk would not stop to parse it. It is also, if I am not mistaken, the title of a banned book.` }
      ],
      choices: [{ text: `Close the lid. Face the room.`, goto: "stC_pass" }]
    },
    stC_pass: {
      speaker: "narrator",
      text: `The Matron arrives at the foot of your bunk at the end of the aisle, runs a finger along the rail, and checks it for dust. She lifts the lid. A shirt. A comb. A crust. She lifts the shirt. She finds nothing under it but a thermos with initials on it, and she holds the thermos up to the light with an expression of an entire biography. 'Your mother's,' she says, and for a moment she is very gentle. 'Don't let it get dented.' She sets it back as though it were an egg.\n\nIt is the first time in two days that someone has touched something of yours with care.`,
      onEnter: [{ add: "ins_ok", n: 1 }, { xp: 2 }, { set: "ins_C_ok", val: true }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    stC_fail: {
      speaker: "narrator",
      text: `The Matron's thumb finds the knot of the scarf before you can speak. 'What is this?' Not unkind, only interested. She turns the bundle over twice, weighing it. The cadet leans in. 'It is a *scarf*, dear. With a *knot* in it. People knot things for a reason.' Her plump fingers pick it open with the leisurely certainty of a woman who has been opening things for thirty years.\n\nWhatever was in it ends up on her clipboard, written down, in a column called *Unexplained*.`,
      onEnter: [{ add: "ins_bad", n: 1 }, { surv: 5 }, { set: "ins_C_lost", val: true }],
      choices: [{ text: `Continue.`, goto: "inspect_hub" }]
    },
    res_check: {
      speaker: "narrator",
      text: `The Matron reaches the table. She lifts each tin in turn and peers into it. She takes her time. A great stillness falls on the dormitory, the stillness of a firing party waiting for the hat to come off. At last she sets the clipboard down on the lectern, lifts her pencil, and, looking at no one, writes a single line, and sits.\n\n'Well,' she says. 'Well.'`,
      choices: [
        { text: `Wait for the verdict.`, goto: "res_clean", cond: "(flag.ins_ok || 0) >= 3 || flag.matron_bribed" },
        { text: `Wait for the verdict.`, goto: "res_minor", cond: "!flag.matron_bribed && (flag.ins_ok || 0) === 2" },
        { text: `Wait for the verdict.`, goto: "res_busted", cond: "!flag.matron_bribed && (flag.ins_ok || 0) < 2" }
      ]
    },
    res_clean: {
      speaker: "matron",
      text: `'A hymn,' says Matron Pritt, and for a moment the whole room breathes out like an organ. 'A genuine hymn. Third floor, clean. I shall say so to the Inspector.' She tidies her papers. 'There are certain beds that look so tidy it makes me suspicious, and one or two in which I have found the cleanest conscience in the district.' Her eyes rest briefly on yours. 'Don't let it go to your head.' She sweeps out, cadet in tow. The door shuts. Nobody moves for six seconds. Then Dov says, very softly, 'Oh, thank God and the gerbil,' and puts his head between his knees.`,
      onEnter: [{ set: "matron_inspection_done", val: true }, { task: "task_matron", state: "done" }, { xp: 4 }, { morale: 2 }, { surv: -3 }, { set: "day2_inspection_clean", val: true }],
      choices: [{ text: `Exhale.`, end: true }]
    },
    res_minor: {
      speaker: "matron",
      text: `'Not quite a hymn,' says Matron Pritt, tapping the pencil. 'A *chorus*. One flat note.' She tears the top sheet from her clipboard and hands it to Dov without looking at him. 'Six demerits to the third floor, to be worked off in the stairwells. Whatever it was I did not see, I shall not have seen.' She sweeps out with the cadet. In the silence, Wren says, 'Corporal Fluff is *still alive*', and Dov, from the edge of his bunk, says, to nobody, 'I've lost three hundred tokens, but I'm alive.'`,
      onEnter: [{ set: "matron_inspection_done", val: true }, { task: "task_matron", state: "done" }, { xp: 2 }, { surv: 2 }, { set: "day2_inspection_minor", val: true }],
      choices: [{ text: `Exhale.`, end: true }]
    },
    res_busted: {
      speaker: "matron",
      text: `'Oh, dear,' says Matron Pritt, and the dormitory goes cold. 'Oh, dear, dear, dear.' She tears three sheets from her clipboard, one for each of you. 'A pet. A quantity of tin discs. A scarf with a *knot*.' Her voice is gentle and the pencil is not. 'I shall be filing a report. A *kind* one. I want you all to hear that I am being kind.' She picks up whatever was on the lectern and holds it against her cardigan. 'The Inspector will be interested in the third floor. He likes to *understand*.' She sweeps out. The door shuts. Dov lies back on his bunk and stares at the ceiling. 'Well,' he says to it. 'That was a quite substantial amount of money.'`,
      onEnter: [{ set: "matron_inspection_done", val: true }, { task: "task_matron", state: "failed" }, { surv: 10 }, { morale: -2 }, { set: "day2_inspection_busted", val: true }, { set: "matron_informs", val: true }],
      choices: [{ text: `Exhale. It could have been worse. It will be.`, end: true }]
    }
  }
},

// ============================================================ DOV KESSEL
dov: {
  title: "Dov Kessel",
  start: [
    { cond: "day < 2", node: "d1" },
    { cond: "flag.dov_talked", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    d1: {
      speaker: "dov",
      text: `'Comrade!' The boy on the bunk does not look up from his ledger. 'You're early. I'm not open. I'm closed, unavoidably detained, and in no way a business.' He turns a page, writes a figure, crosses it out. 'If you're looking for tram tokens, I have none. If you're looking for a pass, I have never heard the word. If you are looking for the *Inspector*, I am told he is in another building, entirely.' He glances up. His eyes are black and quick and a little bloodshot. 'You look like a man whose Tuesday has been unkind.'\n\nHe does not say 'Tuesday' like a day. He says it like a bad joke in a language he is not fluent in.`,
      interjections: [
        { skill: "deduction", min: 3, text: `A boy with ink to the wrist and a blanket full of lumps. He has not slept. He is *counting*.` },
        { skill: "charm", min: 3, text: `A salesman. He is already pricing your face. Be careful: the smile is the opening bid.` }
      ],
      choices: [{ text: `'Not today. Good luck.'`, end: true }]
    },
    first: {
      speaker: "dov",
      text: `'Right.' Dov swings his legs off the bunk, and a small avalanche of tram tokens falls from the blanket and, with great self-possession, he does not look at it. 'Business. Let us do business, in the sense that we do not call it that.' He sticks out a hand. It is ink-stained to the knuckle. 'Dov Kessel. Provisioner. Facilitator. I find things for people who have lost them, at fair prices, which is also what the Inspectorate does, but they charge in years.' He gestures at the blanket. 'It's not stolen. It's *redistributed*. The Union has so many words for me and I have only the one for it.'\n\n'The card,' he adds. 'You still owe me nothing and I owe you a pass. I'm *scrupulously* fair.'`,
      onEnter: [{ set: "dov_talked", val: true }, { set: "met_dov", val: true }, { task: "task_dov", state: "active" }, { note: "task_dov", text: `Dov Kessel sells tram tokens and forged passes out of his blanket. I paid him in advance for a pass I don't remember ordering. He says he owes me.` }],
      voices: 3,
      interjections: [
        { skill: "rhetoric", min: 3, text: `He has pre-empted the argument. Admiring: he has said everything you'd have said and charged for the pause.` },
        { skill: "empathy", min: 3, text: `A boy who talks very fast because the silence has a shape he does not want to look at.` },
        { skill: "sleight", min: 3, text: `He has a way of tidying his hands: a wipe on the trouser, a little shuffle of the cuff. It is a *professional* tidy. You know it because you do it yourself.` },
        { skill: "appetite", min: 2, text: `Does he have food? Does a market have food? Ask. Ask nicely. Look wounded.` }
      ],
      choices: [
        { text: `'What kind of pass?'`, goto: "pass" },
        { text: `'What do you sell?'`, goto: "wares" },
        { text: `'You look nervous.'`, goto: "nervous" }
      ]
    },
    hub: {
      speaker: "dov",
      text: [
        `'Comrade.' Dov holds up a hand without looking up from the ledger. 'Customer, creditor, or concerned citizen? I have three different prices.'`,
        `Dov leans back against the bedpost, the way a man leans on an unspoken limit. 'Spit it out. I've got a lot of numbers and none of them are in a good mood.'`
      ],
      interjections: [
        { skill: "instinct", min: 4, text: `He keeps glancing at the matron's end of the room. He is counting *her* too.` },
        { skill: "senses", min: 4, text: `A faint clink from the radiator vent when he moves. It is not the radiator.`, cond: "!flag.dov_stash_saved" }
      ],
      choices: [
        { text: `'About my pass.'`, goto: "pass2", cond: "!flag.dov_pass_ready && !flag.dov_ally && !flag.dov_pass_given" },
        { text: `'Is my pass ready?'`, goto: "pass_ready", cond: "(flag.dov_pass_ready || flag.dov_ally) && !flag.dov_pass_given" },
        { text: `'I found a note from Mina. In the library globe.'`, goto: "mina", cond: "flag.globe_mina_found && !flag.dov_mina_told" },
        { text: `[Buy a tram token.]`, goto: "wares", cond: "!flag.dov_token_bought" },
        { text: `'Matron's inspection. We should move the stash.'`, goto: "inspection_plan", cond: "day >= 2 && !flag.matron_inspection_done && !flag.dov_stash_saved && !flag.dov_plan_heard" },
        { text: `'Who owes you? Who do *you* owe?'`, goto: "debt", cond: "!flag.dov_debt_heard" },
        { text: `'What happens to the people you sell passes to?'`, goto: "dots", cond: "flag.dov_debt_heard && !flag.dov_dots" },
        { text: `'I need a forged bell schedule. For the evening patrols.'`, goto: "schedule", cond: "flag.corvin_roster_seen && !has('fake_bell_schedule')" },
        { text: `'Did we square things about last night? With Nadia?'`, goto: "nadia", cond: "flag.dov_debt_heard && !flag.dov_debt_cleared" },
        { text: `'See you later, Dov.'`, end: true }
      ]
    },
    pass: {
      speaker: "dov",
      text: `'*Which* pass.' He says it with flat professional despair. 'You paid for the standard Class Two, Authority of the District Warden's Secretariat, valid for a single movement between a School and a State Facility. Blank destination field. The destination was *yours* to fill. You said, and I quote, *I'll know when I need it*.' He hands you the card again. 'I'll tell you the good news. The paper is genuine. The bad news is that the *stamp* is not. I've a man who does stamps. I have not been able to reach the man.'\n\nHe lowers his voice. 'He's been in the Reading Room since last Friday.'`,
      onEnter: [{ xp: 1 }, { set: "dov_pass_heard", val: true }],
      interjections: [
        { skill: "archive", min: 3, text: `Class Two Movement Pass: School to State Facility. A State Facility is any building with a flag on it. Where in District Nine is there a building with a flag on it that your ringing keeps pointing at?` },
        { skill: "dialectics", min: 3, text: `'I'll know when I need it.' A pass with a blank destination is the most honest document ever printed: it states only that the bearer will, in some sense, arrive.` }
      ],
      choices: [{ text: `'When will it be ready?'`, goto: "pass2" }]
    },
    pass2: {
      speaker: "dov",
      text: `'When the inspection's over,' says Dov. 'When I'm not sitting on a hill of evidence. When the stamp-man comes out of the Reading Room.' He pauses. 'Or when somebody else has a stamp. The matron has one. EXIT. For night passes. It is a *good* stamp. It is a stamp from the *source*.' His eyes drift, wistfully, to the table where, between the sugar-bowl and the clipboard, the EXIT stamp sits, with an innocence it has not earned.\n\n'I'm not asking,' he says. 'I'm only noting there's a stamp. And there's a window. And there's a boy with a face like a closed shop.'`,
      onEnter: [{ set: "dov_wants_stamp", val: true }, { note: "task_dov", text: `Dov needs a genuine EXIT stamp to finish my pass. The matron has one on her table.` }],
      choices: [
        { text: `[Take the stamp from the matron's table.]`, check: { skill: "sleight", diff: 12, id: "dov_stamp_sleight", white: false, pass: "stamp_ok", fail: "stamp_bad" } },
        { text: `'I'll think about it.'`, goto: "hub" }
      ]
    },
    stamp_ok: {
      speaker: "sleight",
      text: `Between the sugar-bowl and the clipboard, a small brass stamp, as heavy as a thumb. You leave the sugar-bowl a quarter-inch to the left. You leave the clipboard exactly where it was. The stamp leaves the table the way breath leaves a mirror. Dov receives it in the palm of his hand without looking at it. 'Beautiful,' he breathes. 'That is, that is the *neatest* theft I have ever *not seen*.'\n\nHe turns it over, inks it on a blotter, presses it to a clean card. EXIT. Three days from now, in a perfect violet. 'Give me an hour,' he says.`,
      onEnter: [{ xp: 3 }, { surv: 3 }, { set: "dov_pass_ready", val: true }, { set: "dov_stamped", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    stamp_bad: {
      speaker: "narrator",
      text: `Your fingers close on the sugar-bowl by mistake. It rattles. It rattles like a drum in a crypt. Across the room, a head turns. 'Hm?' says Matron Pritt, and her pencil lifts. She does not move. She only looks, and in the looking, the sugar-bowl and the clipboard and the stamp and you all arrange themselves, instantly, into the exact picture. 'The stamp lives *there*,' she says mildly. 'Not in anybody's pocket.'\n\nShe makes a note. You do not need to see it.`,
      onEnter: [{ surv: 5 }, { morale: -1 }],
      choices: [{ text: `Back away.`, goto: "hub" }]
    },
    wares: {
      speaker: "dov",
      text: `'Menu.' He holds up a finger for each, with relish. 'One, tram tokens, genuine, minted in the Fourth Foundry, one fare, one direction. Two, a Class Two pass, forged, but with *taste*. Three, information, Cheap, but it spoils. Four, nothing.' He taps his temple. 'Four's the most expensive. It means I forget you walked in.'\n\nHe looks up, bright and wary, a boy of seventeen holding the entire economy of a dormitory in his lap. 'Tokens are two ration coupons, or a pack of cigarettes, or a sweet roll. I take barter. The State takes everything else.'`,
      interjections: [
        { skill: "appetite", min: 3, text: `Buy a token. Buy two. A token is a promise that you could leave. It is the cheapest hope in the Union.` },
        { skill: "rote", min: 3, text: `TRAM TOKEN: ONE (1) FARE, DISTRICT NINE TO ANYWHERE WITHIN THE RING. NOT VALID BEYOND THE RING. THE RING IS NOT SHOWN ON MAPS.` }
      ],
      choices: [
        { text: `[Trade a ration coupon for a token.]`, goto: "buy_token", cond: "has('ration_coupon') && !flag.dov_token_bought", effects: [{ take: "ration_coupon" }] },
        { text: `[Trade the cigarettes for a token.]`, goto: "buy_token", cond: "has('cigarettes') && !flag.dov_token_bought", effects: [{ take: "cigarettes" }] },
        { text: `[Trade a sweet roll for a token.]`, goto: "buy_token", cond: "has('sweet_roll') && !flag.dov_token_bought", effects: [{ take: "sweet_roll" }] },
        { text: `'Nothing today.'`, goto: "hub" }
      ]
    },
    buy_token: {
      speaker: "dov",
      text: `The token arrives in your palm with the click of a very small door. It is warm from his blanket and stamped with a tiny tram that has no wheels. 'One fare,' says Dov solemnly, 'valid until the Union ends, or you do.' He wipes his hand on his trouser. 'You're not the first to go quiet when you hold one. People look at them for a long time. I think it is the first honest-looking thing they have owned.'`,
      onEnter: [{ give: "tram_token" }, { set: "dov_token_bought", val: true }, { xp: 1 }, { toast: "Received: Tram Token" }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    nervous: {
      speaker: "dov",
      text: `'Nervous?' A short bright laugh. 'I'm *always* nervous. It's my brand.' He tucks the blanket tighter. 'It's the Tuesday thing. Everybody's gone a bit Tuesday. I have a list of everything I sold on Tuesday and, you see, I have not written a *single word of it down*, because that would be careless. I keep it in my head. And I woke up and the head was, ah.' He knocks on his skull, twice. 'Shut for repairs.'\n\nHe opens the ledger. The Tuesday page is blank except for a tiny printed bell and a single word, in his hand, written as though somebody else had dictated it: *sorry.*`,
      onEnter: [{ set: "dov_nervous", val: true }, { xp: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `Sorry. He wrote *sorry* on a page and cannot remember to whom. That is the worst kind of apology: the kind you owe to a hole.` },
        { skill: "the_grey", min: 3, text: `A blank page with a bell on it. I know that kind of page. It is the colour of the inside of a pipe.` }
      ],
      choices: [{ text: `'I lost Tuesday too.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }, { text: `'Maybe you're better off.'`, goto: "hub", effects: [{ ideo: "quiet", n: 1 }] }]
    },
    inspection_plan: {
      speaker: "dov",
      text: `'Right.' He drops his voice to something like conspiratorial thunder. 'Two o'clock. East bunks, lockers, tins. If I *had* anything, which I have not, I'd have it in three places: here, there and a third. I want the *third*. You see the radiator under the window? The vent has a gap the size of a loaf. A man could hide an empire in it.' His eyes are enormous. 'If a *friend* were to help, in the two minutes before she reaches the third bunk. Since I'm the third bunk. I would owe that friend *everything*. In the business sense.'\n\nHe holds out a hand, flat, palm up, like a bank.`,
      onEnter: [{ set: "dov_plan_heard", val: true }, { xp: 1 }, { note: "task_dov", text: `Dov wants me to hide his stash in the radiator vent before Matron Pritt's inspection at 14:00. He'd owe me 'everything, in the business sense'.` }],
      choices: [{ text: `'I'll see what I can do at two.'`, goto: "hub" }, { text: `'You hide it. I'm not your accomplice.'`, goto: "hub", effects: [{ ideo: "vanguard", n: 1 }] }]
    },
    debt: {
      speaker: "dov",
      text: `'Everyone owes someone,' he says, in the tones of a man quoting a catechism he doesn't believe in. 'I owe Nadia. Nadia Fell. Tram conductor. Karsov Avenue. She runs the whole ring: tokens, tickets, ration queue favours. I buy in bulk and she doesn't care for it when I'm late. Twelve tokens by tonight, or I pay the difference in *attention*.' He taps the ledger. 'Which is a polite way of saying she'll put me on a tram and I will not get off at my stop.'\n\nHe smiles. It is a wretched, optimistic smile. 'I've been working on getting off at a different stop.'`,
      onEnter: [{ set: "dov_debt_heard", val: true }, { xp: 1 }, { note: "task_dov", text: `Dov owes Nadia Fell (tram conductor, Karsov Avenue) twelve tokens by tonight. 'Or I pay the difference in attention.'` }],
      interjections: [
        { skill: "archive", min: 3, text: `Nadia Fell. Conductor, Ring Line Nine. Known to the Inspectorate as 'a person of interest to the Ration Bureau'. Known to the district as 'the only one who will give you change'.` },
        { skill: "instinct", min: 3, text: `'Not get off at my stop.' He has said that exactly the way an old soldier says *I'll go to the front*. He believes it.` }
      ],
      choices: [{ text: `'How can I help?'`, goto: "debt_help" }, { text: `'That sounds like your problem.'`, goto: "hub" }]
    },
    debt_help: {
      speaker: "dov",
      text: `'Twelve tokens is eight coupons,' he says, quickly, as if he had been practising the number in the mirror. 'If I could scrape eight coupons together, I could settle on the Avenue and be, well, *square*. If you had a way to the Avenue.' He leans closer. 'You do. Past the gate. Wednesday and Thursday only, the sentry takes his tea at noon.'\n\nHe adds, apologetically, 'Or you could talk to Bronka. She's got a till that's full of coupons, since Tuesday, because *someone* stopped taking twelve of them every Thursday.' A glance, sidelong, quite innocent. 'Somebody is a good influence.'`,
      onEnter: [{ xp: 1 }, { set: "dov_debt_help", val: true }, { note: "task_coupons", text: `Dov needs eight ration coupons to square his debt with Nadia. Bronka's till may have some. So might a deal.` }],
      choices: [{ text: `'I'll see what I can find.'`, goto: "hub" }]
    },
    nadia: {
      speaker: "dov",
      text: `'Have you the coupons?' His eyes are very wide. 'I'm not asking *how*. I'm only asking *whether*.'`,
      choices: [
        { text: `[Give him eight coupons.]`, goto: "nadia_paid", cond: "has('ration_coupon')" },
        { text: `'Not yet.'`, goto: "hub" }
      ]
    },
    nadia_paid: {
      speaker: "dov",
      text: `He receives them as he would receive holy relics. Not eight, in fact: three, and a promise. 'It will do. It *will* do.' He counts them twice, out loud, and writes in the ledger with a flourish: *D. Kessel owes N. Fell:* and then, with a flourish like a skater's, *nothing.* 'Nothing,' he says, wondering. 'What a beautiful word. What a *shape*. I shall have it framed.'\n\nHe clasps your hand. His hand is trembling. 'I'm yours. In every sense that doesn't involve a signature.'`,
      onEnter: [{ take: "ration_coupon" }, { set: "dov_debt_cleared", val: true }, { set: "dov_ally", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }, { task: "task_dov", state: "done" }, { thought: "th_chosen_family" }, { note: "task_dov", text: `I covered Dov's debt to Nadia. He is mine now, in every sense that doesn't involve a signature.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    dots: {
      speaker: "dov",
      text: `A very long pause. The ledger is closed on his thumb. 'There's a pencil dot,' he says. 'In the corner of every pass. A little dot. When I sell one, I put a dot. A year ago I decided the dot meant *delivered*, so that I'd know I'd done my job.' His voice is quite flat. 'And then, one spring, I found a dot on a pass I'd sold to a girl called Mina. It was in the *lost property*. In the matron's box. With the dot. And I didn't know, I *still* don't know, if that dot means she got through, or if it means she didn't.'\n\nHe stares at the ledger. 'The Bell doesn't leave you the answer. It only leaves you the dot.'`,
      onEnter: [{ set: "dov_dots", val: true }, { xp: 3 }, { morale: -1 }, { thought: "th_tram_wires" }],
      interjections: [
        { skill: "empathy", min: 3, text: `A dot. Not a record, not a name. A tick on a page. He has been marking off the vanished, one dot at a time, without ever being allowed to say they were vanished.` },
        { skill: "solidarity", min: 3, text: `Mina. Remember it. We will say it for him until he can say it himself.` },
        { skill: "the_grey", min: 4, text: `Everything leaves a dot. The Bell cannot reach the dot. It has been trying for years.` }
      ],
      choices: [
        { text: `'Mina got through. I'd bet my life on it.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }, { morale: 1 }] },
        { text: `Say nothing. Sit with him.`, goto: "hub", effects: [{ xp: 1 }, { morale: 1 }] }
      ]
    },
    pass_ready: {
      speaker: "dov",
      text: `'Ready.' He produces it from inside the lining of a library book as a conjuror produces a dove: a stiff grey card, a Ministry crest, a violet stamp so fresh it smells of violets. CLASS TWO MOVEMENT PASS. BEARER MAY PROCEED FROM SCHOOL NO. 9 TO: and then a blank, beautifully ruled, waiting. 'You fill the destination,' he says. 'In ink, not pencil. Pencil looks like a hope. Ink looks like an order.' He presses it into your hand and closes your fingers on it. 'Monday-You paid for this. I'm only the courier between the two of you.'\n\nHe looks away. 'Whatever the place is that the ringing points at: come back from it. I have a policy of not losing customers twice.'`,
      onEnter: [{ give: "forged_pass" }, { set: "dov_pass_given", val: true }, { xp: 3 }, { toast: "Received: Forged Pass" }, { note: "task_dov", text: `Dov delivered my forged Class Two pass, destination blank. 'Ink looks like an order.'` }, { note: "task_relay", text: `I have a forged Class Two Movement Pass from Dov: School No. 9 to a State Facility, destination blank. It might get me through the Relay gate.` }],
      interjections: [
        { skill: "sleight", min: 3, text: `Feel the card. The crest is raised, the stamp sunk. A forgery is a document that has been loved more carefully than the original.` },
        { skill: "slip", min: 3, text: `A blank destination. A gate on Karsov Avenue. A guard who reads the crest and not the blank. Very well.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    mina: {
      speaker: "dov",
      text: `You give him the tissue from the globe. He reads it standing up. Then he sits down on the bunk without seeming to decide to, and reads it again. *I got through. The tram goes further than you think. Tell D. the dot means YES.* For a long time Dov Kessel, provisioner, facilitator, the market, says nothing at all. Then he takes the ledger from under the blanket and opens it to a page you have not seen, a column of tiny pencil dots, forty or fifty of them, and very slowly, with the stub of a pencil, next to the first dot he writes a single word: *yes.*\n\n'One,' he says, in a voice nobody on the third floor has ever heard him use. 'One is a number. You can build on one.'`,
      onEnter: [{ set: "dov_mina_told", val: true }, { set: "dov_ally", val: true }, { xp: 5 }, { morale: 3 }, { ideo: "undercurrent", n: 1 }, { thought: "th_tram_wires" }, { note: "task_dov", text: `Told Dov about Mina's note. Next to the first dot in his ledger he wrote: yes.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `Forty dots. One yes. He will spend the rest of his life hoping the others match it, and that is a far better way to spend a life than the one he had.` },
        { skill: "solidarity", min: 2, text: `We got one through. Write it down. Write it in ink.` }
      ],
      choices: [{ text: `Sit with him a while.`, goto: "hub" }]
    },
    schedule: {
      speaker: "dov",
      text: `'A bell schedule.' He sits up like a hound. 'The district patrol timetable. The *real* one, the one the Vanguard use to pace themselves around the school and the Avenue. And you want me to *fake* it.' He rubs his hands. 'You've brought a model. Good. A forgery wants a template and a very patient man.' He lays your source beside a fresh sheet and a ruler, and goes still, in the way of a craftsman beginning. 'A fake schedule tells a guard to be at the *wrong end* of the street at the *right* time. It is the most elegant lie in the world. It doesn't say anything. It just moves a man.'\n\nTwenty minutes later, in perfect copperplate, it lies on the blanket: FAKE, in the only sense that matters. 'On the house,' he says. 'Considering.'`,
      onEnter: [{ give: "fake_bell_schedule" }, { set: "dov_made_schedule", val: true }, { xp: 3 }, { time: 20 }, { toast: "Received: Fake Bell Schedule" }],
      interjections: [
        { skill: "sleight", min: 3, text: `Watch the hand. A forger's hand never lifts. It writes the entire page in a single, slightly different breath.` },
        { skill: "archive", min: 4, text: `Patrol timetable: District Nine, Evening Roster, Ministry of Quiet Hours (Field). Revision Seven. The word *Field* does not appear in any civil service handbook. It is the word they use when they mean *armed*.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    }
  }
},

// ============================================================ WREN
wren: {
  title: "Wren",
  start: [
    { cond: "day < 2", node: "d1" },
    { cond: "flag.wren_talked", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    d1: {
      speaker: "wren",
      text: `'Rule one,' says the small girl on the bunk, without preamble. 'Never ask a first-year what she's carrying. Rule two: if you ask, she will tell you, and that is *your* fault.' She is perhaps eleven, twelve, in a uniform cut for a taller child, with a bob like a helmet and large, grave, quite tireless eyes. 'I'm Wren. I run messages. Sweets are payment, rumours are credit. What have you got?'\n\nShe holds out one hand, palm up, and with the other she holds a tiny gerbil to her chest as if it were a briefcase.`,
      interjections: [
        { skill: "empathy", min: 3, text: `Eleven years old and she has a price list. She learned early that being useful is the only form of safety a small person can afford.` },
        { skill: "charm", min: 3, text: `A fellow professional. Take her seriously: she is the first person in this building who has asked what you've got instead of what you've done.` }
      ],
      choices: [{ text: `'Nothing yet. Ask me later.'`, end: true }]
    },
    first: {
      speaker: "wren",
      text: `'Rule one,' says Wren, sitting cross-legged on her blanket and counting on her fingers as if the rules were a rosary. 'Never ask a first-year what she's carrying. Rule two: if you ask, she will tell you, and that is *your* fault. Rule three: sweets are payment, rumours are credit, secrets are a separate fee. Rule four: I have never seen anything.' She considers. 'Rule five: I see everything.'\n\nShe is twelve, perhaps, a thin small person in a uniform two sizes too big, with a bob like a helmet and very straight eyebrows. The gerbil on her pillow, Corporal Fluff, has an ear missing and an air of tremendous seniority. 'You *really* don't remember Monday,' she says, in the tone of a doctor. 'I could tell you. It would be four sweets.'`,
      onEnter: [{ set: "wren_talked", val: true }, { set: "met_wren", val: true }, { thought: "th_chosen_family" }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `Rules, in a list, with numbers. A child's way of making a world that behaves. The fifth rule was the only one she did not say loudly.` },
        { skill: "instinct", min: 3, text: `She sees everything. That is the dangerous part. She also tells everything, and that is the *more* dangerous part, because she will tell it to anybody with a lemon drop.` },
        { skill: "deduction", min: 3, text: `A first-year in a dormitory of third-years. No parents' photograph on the locker. A suitcase that has never been unpacked, because she has never believed in the room. She has been moved around.` },
        { skill: "appetite", min: 2, text: `She said *sweets*. Is there a sweet? There is always a sweet. Check your pockets.` }
      ],
      choices: [
        { text: `'What happened on Monday?'`, goto: "monday" },
        { text: `'You'll have your sweet roll. I swear it.'`, goto: "roll", cond: "flag.wren_roll_promised" },
        { text: `'Who are you really, Wren?'`, goto: "who" }
      ]
    },
    hub: {
      speaker: "wren",
      text: [
        `'Yes?' Wren does not look up from the ledger she keeps on her knees, in which, in pencil, in a childish round hand, appear the movements of the entire third floor to the quarter hour. 'Credit or payment?'`,
        `Wren is feeding Corporal Fluff a sunflower seed with the delicacy of a priest handling a communion wafer. 'One minute. He's having a moment.'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `A faint hiss from under her pillow: a crystal set, a quarter-inch of earphone. She listens, evenings, to someone else's weather.` },
        { skill: "solidarity", min: 3, text: `Eleven. Twelve? A small person with a very large heart who has been trained to price it. Treat her as an equal and she will be one.` }
      ],
      choices: [
        { text: `'About that sweet roll.'`, goto: "roll", cond: "flag.wren_roll_promised && !flag.wren_roll_paid" },
        { text: `'Have you got a job for me?'`, goto: "errands", cond: "!flag.wren_errands_open" },
        { text: `'About the note for Ysolde.'`, goto: "e1_status", cond: "flag.wren_errands_open && !flag.wren_e1_done" },
        { text: `'About the roof key.'`, goto: "e2", cond: "flag.wren_e1_done && !flag.wren_e2_done" },
        { text: `'Wren. Rhea Vantage.'`, goto: "rhea", cond: "flag.wren_e2_done && !flag.wren_rhea_heard" },
        { text: `'What are the rules again?'`, goto: "rules", cond: "!flag.wren_rules" },
        { text: `'What is the gerbil's story?'`, goto: "gerbil", cond: "!flag.wren_gerbil_story" },
        { text: `'What did you hear about the Inspector?'`, goto: "inspector", cond: "day >= 2 && !flag.wren_inspector" },
        { text: `'Later.'`, end: true }
      ]
    },
    monday: {
      speaker: "wren",
      text: `'Four sweets,' says Wren. 'But since you're a friend, I'll do a sample.' She closes her eyes and recites it like a shop-list. 'Monday. 21:40. You came in with a face like a held breath. You gave Dov a card. You didn't take your tea. You sat on your bunk and wrote a very long thing on three pages and then you ate one of the pages.' A pause. 'The *other* two you put under the mattress. At 22:15 you said, to the wall, in a voice like a prayer, *I'm going to need a very good liar*. And then you looked at me. And you said, *not her*.' She opens her eyes. 'I was a bit hurt.'\n\nShe holds out her hand. 'That's one sweet's worth. The rest costs more.'`,
      onEnter: [{ xp: 2 }, { set: "wren_monday", val: true }, { note: "task_yesterday", text: `Wren says on Monday at 21:40 I wrote three pages, ate one, and hid two under the mattress. I said: 'I'm going to need a very good liar.' Then, looking at her: 'Not her.'` }],
      interjections: [
        { skill: "deduction", min: 3, text: `Three pages. Two under the mattress. Your bunk is a few metres away. You *wrote letters to yourself* and stored them in the most obvious hiding place in the Union.` },
        { skill: "empathy", min: 3, text: `*Not her.* You wanted to keep her out of it. She heard you say so. She has been carrying that sentence like a splinter for a day and a half.` }
      ],
      choices: [
        { text: `'Not her, because you're twelve. That was the reason.'`, goto: "hub", effects: [{ morale: 1 }, { xp: 1 }] },
        { text: `'I'm sorry. I'd forget it too.'`, goto: "hub" }
      ]
    },
    who: {
      speaker: "wren",
      text: `She considers the question the way one considers whether to cross a frozen river. 'I'm a first-year,' she says. 'That's the true thing and the easy one. The *other* true thing is I was in the Vanguard Home at Cinder Street from three until this autumn, and then a Matron decided I had a talent for staircases, and sent me here.' She shrugs one shoulder. 'It's fine. There are worse places than a school with a lock. At the Home there was nobody to be rude to. Here there's Dov.'\n\nShe lowers her voice. 'There was a girl in the Home who peeled an orange for me every Sunday. In one long piece. She said it was an *exercise in patience*.' The straight eyebrows come together. 'She's called Rhea. I'm not supposed to say her name aloud. I am saying it very quietly.'`,
      onEnter: [{ set: "wren_who", val: true }, { xp: 2 }, { thought: "th_loyal_rhea" }, { task: "task_rhea2", state: "active" }, { note: "task_rhea2", text: `Wren grew up in the Vanguard Home at Cinder Street. Rhea Vantage peeled an orange for her every Sunday, in one long piece: 'an exercise in patience'. Wren isn't supposed to say her name.` }],
      voices: 3,
      interjections: [
        { skill: "instinct", min: 3, text: `An orange. Peeled in a long piece. Rhea's calling card on the gym mats and the girl who learned it from her is sitting on this bunk, feeding a gerbil a seed.` },
        { skill: "empathy", min: 4, text: `She is not afraid of Rhea. She is afraid *for* her. It is the hardest feeling to hold and she holds it as lightly as the gerbil.` },
        { skill: "dialectics", min: 3, text: `A killer taught a child patience with fruit. Both facts are true. The mind would like to choose one. Don't let it.` }
      ],
      choices: [
        { text: `'You love her.'`, goto: "hub", effects: [{ xp: 1 }, { ideo: "undercurrent", n: 1 }] },
        { text: `'I won't say her name.'`, goto: "hub" }
      ]
    },
    rules: {
      speaker: "wren",
      text: `'All of them?' She counts out on her fingers, then runs out of fingers and starts again on the other hand. 'One: never ask. Two: you'll be told. Three: sweets, rumours, secrets. Four: I've seen nothing. Five: I see everything. Six: doors are for people who aren't me. Seven: if a grown-up smiles, count their teeth. Eight: if a grown-up doesn't smile, count the exits. Nine: the Bell is only a noise if you're asleep. Ten: don't ever tell Matron you love her; she'll put it in the book.' A pause. 'Eleven: a secret you keep for a friend is worth more than a hundred sweets.'\n\nShe puts down her hands. 'Eleven is new. I only decided it this morning.'`,
      onEnter: [{ set: "wren_rules", val: true }, { xp: 1 }],
      interjections: [
        { skill: "rote", min: 3, text: `WREN'S RULES, ONE THROUGH ELEVEN. SOURCE: UNKNOWN. STATUS: BINDING. NOTE: ARTICLE NINE IS FACTUALLY INCORRECT AND I FIND I LIKE IT ANYWAY.` },
        { skill: "solidarity", min: 3, text: `Rule eleven. That is the best law that has been drafted in this building in sixty years. We should chalk it on a wall.` }
      ],
      choices: [{ text: `'Rule eleven. I'll keep it.'`, goto: "hub", effects: [{ set: "wren_rule11", val: true }, { morale: 1 }] }, { text: `'Ten is the best one.'`, goto: "hub" }]
    },
    roll: {
      speaker: "wren",
      text: `'The roll,' says Wren, and her whole face narrows, gloriously, to the width of one thought. 'Cinnamon. You *swore*.'`,
      choices: [
        { text: `[Hand over the sweet roll.]`, goto: "roll_paid", cond: "has('sweet_roll')" },
        { text: `'I don't have it yet. Soon.'`, goto: "hub" }
      ]
    },
    roll_paid: {
      speaker: "wren",
      text: `She holds the roll in both hands for a long moment, like a very small, very serious priest receiving a miracle. She smells it. She does not eat it. 'Cinnamon,' she says, in a tiny voice. 'Banned.' She divides it, with a ruler-straight tear, in two exact halves, and eats one with her eyes shut, and then, with great ceremony, pushes the other half toward you. 'Rule twelve. A real friend shares the roll.'\n\nHer eyes are suspiciously bright. 'I haven't had one since the Home.'`,
      onEnter: [{ take: "sweet_roll" }, { set: "wren_roll_paid", val: true }, { xp: 2 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "appetite", min: 2, text: `HALF a sweet roll. A deliberate, voluntary half. Eat it. Eat it with your whole face.` },
        { skill: "empathy", min: 3, text: `She did not need to share. She did, because it is a rule, and the rule is hers, and a child who writes her own rules can make them kind.` }
      ],
      choices: [{ text: `Eat your half.`, goto: "hub", effects: [{ hp: 1 }] }]
    },
    gerbil: {
      speaker: "wren",
      text: `'Corporal Fluff,' says Wren. 'Ex-Vanguard. He was the Home's mascot. He was due to be, well.' Her mouth makes a very small straight line. 'He was in a box. The box was going to the incinerator. Somebody left the lid unlatched. I'm not saying who.' The gerbil regards you with one eye, with such commanding seniority that you find you are standing straighter. 'He's got a rank. I gave it to him because the Home never gave him one, and a person ought to have a title if they've survived something.'\n\nShe strokes his one ear. 'Everyone in here is a corporal. They just don't know it.'`,
      onEnter: [{ set: "wren_gerbil_story", val: true }, { xp: 1 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `A rank for the survived. We should do that for everybody. Corporal Dov. Sergeant Matron. General Osk, Order of the Broom.` }
      ],
      choices: [{ text: `'Salute.'`, goto: "hub", effects: [{ morale: 1 }] }]
    },
    inspector: {
      speaker: "wren",
      text: `'He had tea in the Matron's office,' says Wren, rattling it off like a train timetable. 'Six-oh-eight to six-forty. Two sugars, which is un-patriotic. He told her she had lovely handwriting. She wrote *lovely handwriting* in the book. I saw it.' A careful pause. 'He looked at the corridor board for a long time. Then he came up here, to the third floor, to look at the beds. He stood by *yours*.'\n\nShe looks at you, quite steadily. 'He touched the pillow. Then he wiped his fingers on his handkerchief. It was a very *clean* handkerchief.' She lowers her voice. 'He didn't *look* like a person who hurts people. That's what I didn't like.'`,
      onEnter: [{ set: "wren_inspector", val: true }, { xp: 1 }, { note: "task_voss", text: `Wren saw Voss in the dormitory early this morning. He stood by my bunk, touched the pillow, wiped his fingers on a very clean handkerchief.` }],
      interjections: [
        { skill: "instinct", min: 3, text: `He stood by *your* bed. Not the dead boy's. Not the Matron's. Yours. He already knows which bed is yours. He does not need a list.` },
        { skill: "archive", min: 4, text: `Two sugars is a violation of Ration Memorandum 8. In a government inspector it is also a signal. The Inspectorate sends the sort of person who can afford to be seen breaking the rules.` }
      ],
      choices: [{ text: `'Thank you, Wren.'`, goto: "hub" }]
    },
    errands: {
      speaker: "wren",
      text: `'Work.' She says it as one says *treasure*. 'I've got three. They're all errands. Errands are different from jobs: you don't need to know why.' She ticks them off on her fingers. 'One. A note to the librarian. Ysolde. She doesn't like me, but she likes the note. Two. A key. It's on the Matron's belt and I can't take it, because she checks me, but you've got a *face*. Three.' She pauses. 'Three is a secret. It's rule-eleven stuff.'\n\nShe wipes her nose on her cuff. 'It's four sweets for the lot. Or the roll. Or just, you know, a friend.'`,
      onEnter: [{ set: "wren_errands_open", val: true }, { task: "task_wren", state: "active" }, { note: "task_wren", text: `Wren has three errands for me: a note to Ysolde in the library; Matron's roof key; and a secret ('rule-eleven stuff').` }],
      choices: [{ text: `'Give me the first one.'`, goto: "e1" }, { text: `'I'll think about it.'`, goto: "hub" }]
    },
    e1: {
      speaker: "wren",
      text: `She produces a note from inside a sock, which is where she keeps everything that matters. It is folded into a triangle, sealed with candle-wax in the shape of a small thumb. 'To the lady at the desk,' she says. 'Ysolde. You say: *the first-year says the hours are quiet.* And you wait. Then she'll give you something and you give it to me.' She stops. 'Don't read it.' A long considering look. 'You'll read it. You're the type. But if you read it you have to un-read it. That is Rule Eleven, subsection A.'`,
      onEnter: [{ give: "wren_note" }, { xp: 1 }, { toast: "Received: Wren's Note" }],
      choices: [{ text: `'I'll deliver it.'`, goto: "hub" }]
    },
    e1_status: {
      speaker: "wren",
      text: `'Did you give her the note?' Wren is leaning forward so far that the gerbil has to hold on. 'Did she say anything? Did she do the thing with her mouth?'`,
      choices: [
        { text: `'Not yet. I'm on my way.'`, goto: "hub" },
        { text: `[Tell her Ysolde's reply.]`, goto: "e1_done", cond: "flag.ysolde_reply_for_wren" }
      ]
    },
    e1_done: {
      speaker: "wren",
      text: `You pass on the reply. She listens to it with her head on one side, her expression perfectly neutral, and then, once you have finished, she pulls the sock off her left foot and, with enormous dignity, writes the sentence on the inside of it in indelible pencil. 'That's the best place,' she says. 'Nobody ever looks in a sock.' A pause. She seems about to cry and then, firmly, does not. 'Thank you,' she says. 'Now it's two.'\n\nShe pulls the sock back on. 'One more and you're a courier. Not a *good* courier. A courier.'`,
      onEnter: [{ set: "wren_e1_done", val: true }, { xp: 3 }, { note: "task_wren", text: `Delivered Wren's note to Ysolde and brought back the reply. Two errands to go.` }],
      choices: [{ text: `'What's the second one?'`, goto: "e2" }]
    },
    e2: {
      speaker: "wren",
      text: `'The roof key.' She says it in a whisper loud enough to be a shout. 'It's on the Matron's belt, on a brown cord, between the cough-sweets and a very old rosary. I can't take it, because she checks my hands when I come in from the stair. But *you*. Nobody checks you. You're a Good Student.' She lowers her voice to a hiss. 'From the roof you can see all of Karsov Avenue. The black car. The Relay. The guards. If I know when they change over, I can tell you. And if I tell you, you owe me *rule eleven*.'\n\nShe watches you with the whole enormous patience of the very small.`,
      onEnter: [{ xp: 1 }, { note: "task_wren", text: `Wren wants the Matron's roof key from her belt (brown cord, between the cough-sweets and a rosary). From the roof you can see the guards on Karsov Avenue.` }],
      choices: [
        { text: `[Lift the key from the Matron's belt.]`, check: { skill: "sleight", diff: 12, id: "wren_key_sleight", white: false, pass: "e2_ok", fail: "e2_bad" } },
        { text: `[Keep the Matron busy while Wren takes it.]`, check: { skill: "charm", diff: 11, id: "wren_key_charm", white: false, pass: "e2_ok", fail: "e2_bad" } },
        { text: `[Ask Dov's help: a diversion.]`, goto: "e2_dov", cond: "flag.dov_ally" },
        { text: `'Not now.'`, goto: "hub" }
      ]
    },
    e2_dov: {
      speaker: "dov",
      text: `'A diversion,' says Dov, delighted. 'The oldest trade in the world. A man drops a tin, a woman looks at it.' He is already unbuttoning something. 'Leave it to me. In four minutes the Matron will find that all my socks are *in alphabetical order* and be too appalled to move.' He winks. 'It's a thing I do when I'm lying. Go.'\n\nIn the corridor, an enormous clatter. A scream of recognition. The Matron's slippers go, flap-flap-flap, toward the noise. Wren's hand slides out from behind the doorframe, like a snake into a hole, and returns, a moment later, with the key.`,
      onEnter: [{ xp: 2 }],
      choices: [{ text: `Continue.`, goto: "e2_ok" }]
    },
    e2_ok: {
      speaker: "wren",
      text: `Twenty minutes later, you are on the roof. It is a flat grey expanse of tar and pigeon, with a view that goes on a very long way. Karsov Avenue is a ribbon below you: a tram wire, a queue, a black car with a man beside it, and at the end, a squat concrete box with a single red lamp that blinks as slowly as a sleeper's pulse. 'That's the Relay,' Wren whispers, lying flat. 'The guards change at five and eleven. There's a back gate, behind the bins, that they never lock because the cook who runs it has *opinions* about the locks.' She counts on her fingers again. 'Four on the gate, one on the roof, one inside who doesn't come out. And a man in a coat who goes in at midnight. Every night. And doesn't come out until it's quiet.'\n\nShe sits up. 'That's the whole of it. That's what I owe you.'`,
      onEnter: [{ set: "wren_e2_done", val: true }, { set: "relay_guard_shift_known", val: true }, { xp: 4 }, { time: 20 }, { note: "task_wren", text: `From the roof: the Relay guards change at 05:00 and 11:00 (hours of the day, by Wren's count). Back gate behind the bins is never locked. A man in a coat goes in at midnight and doesn't come out until it's quiet.` }, { note: "task_relay", text: `Wren's roof intel: four guards at the Relay gate, one on the roof, one inside. They change at five and eleven. The back gate behind the bins is never locked. A man in a coat goes in every midnight.` }],
      interjections: [
        { skill: "senses", min: 3, text: `From up here you can hear it: the Relay's hum, at the very edge of hearing, in the key of your ringing. It sounds like a very large, very patient animal humming itself to sleep.` },
        { skill: "the_grey", min: 3, text: `The whole district from above. You have never seen it like this. It looks like a diagram of itself.` },
        { skill: "slip", min: 3, text: `Behind the bins. A gate that is never locked is a gate that somebody has decided to be absent from. Remember its colour.` }
      ],
      choices: [{ text: `Climb down.`, goto: "hub" }]
    },
    e2_bad: {
      speaker: "narrator",
      text: `The cord is brown, the key is brass, and the Matron's hand is, without warning, on your wrist. 'Dear,' she says. 'It is a very rude thing to touch a woman's belt.' She does not shout. She looks at you with infinite regret, and then she writes, in her round hand, with her free hand, *Boy at belt, 11:52*.\n\nWren, in the corridor, has vanished, as only a first-year can. When you see her later she will say, quite cheerfully, 'I told you she checks.'`,
      onEnter: [{ surv: 6 }, { morale: -1 }, { set: "wren_e2_failed_once", val: true }],
      choices: [{ text: `Retreat.`, goto: "hub" }]
    },
    rhea: {
      speaker: "wren",
      text: `She does not answer at first. She takes from the sock a small flat tin with a bird on it and opens it. Inside are seven neatly folded postcards of the Warden, each with a few words in a handwriting you recognise from a certain note on the gym mats. *Eat your bread. — R.* *Do not talk to the cadets. — R.* *You are a very good listener, Wren, and that will save you. — R.* The last card is dated Tuesday. *If anything happens to the Home, go to the dormitory and be small. — R.*\n\n'She wrote that on Tuesday,' says Wren. 'Before. I don't know *what happens*. I only know she wrote it with her left hand, which is how she writes when she is scared.' Her voice is perfectly flat. 'I know what she did. Everybody knows. It's in the way the Vanguard walks. But she is still the one who peeled the orange.'`,
      onEnter: [{ set: "wren_rhea_heard", val: true }, { xp: 3 }, { thought: "th_loyal_rhea" }, { note: "task_rhea2", text: `Wren keeps seven postcards from Rhea. The last, dated Tuesday: 'If anything happens to the Home, go to the dormitory and be small. — R.' Written in her left hand, which is how she writes when scared.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `Seven postcards. The killer of the Commissar wrote to a child on the day before: *go and be small*. Whatever she was, she was not only that.` },
        { skill: "deduction", min: 4, text: `Tuesday. Before. Rhea knew something was coming to the Home. Not the gym: the *Home*. She was not afraid of a murder. She was afraid of a consequence.` },
        { skill: "solidarity", min: 3, text: `She is one of ours who got taken by the other side. It happens. It is the second most common way to lose a person.` },
        { skill: "rote", min: 3, text: `THE VANGUARD HOMES: FOR THE RELIEF OF ORPHANS OF THE STATE. ORPHANS ARE HONOURABLE. ORPHANS ARE AVAILABLE. ORPHANS ARE, ON REVIEW, A RENEWABLE RESOURCE.` }
      ],
      choices: [
        { text: `'I won't hurt her. If I can help it.'`, goto: "rhea_promise", effects: [{ set: "wren_ally", val: true }, { ideo: "undercurrent", n: 1 }] },
        { text: `'She killed a man, Wren.'`, goto: "rhea_hard", effects: [{ morale: -1 }] },
        { text: `Say nothing. Hand the tin back.`, goto: "hub", effects: [{ set: "wren_ally", val: true }, { xp: 1 }] }
      ]
    },
    rhea_promise: {
      speaker: "wren",
      text: `'*If I can help it.*' She turns the phrase over like a coin of doubtful value. 'That's a very good lie. It's honest about being one.' She puts the tin away. 'All right. You're in the book.' She flips open the ledger on her knee and, very carefully, in the round childish hand, writes a line you are not permitted to read. 'Friends,' she says. 'Capital F. Not like the Matron's. Mine are the other kind. I give a thing back.'\n\nShe is, for the first time, smiling: a small, startled, crooked thing. 'I'll tell you what I know about the Home. When you need it. Not before.'`,
      onEnter: [{ set: "wren_ally", val: true }, { xp: 3 }, { morale: 2 }, { task: "task_wren", state: "done" }, { note: "task_rhea2", text: `Told Wren I won't hurt Rhea 'if I can help it'. Wren has put me in her book of Friends, capital F.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    rhea_hard: {
      speaker: "wren",
      text: `'I know,' says Wren, very calmly. 'She told me she would do it, one day. She said it like you say *I'll walk the dog*.' She closes the tin. 'I know what she did. It doesn't change that she peeled the orange.' She regards you with unchildlike steadiness. 'You can think two things. That's allowed. It's *Rule Thirteen*, I've decided. I have decided it just now.'\n\nShe looks away. 'If you hurt her I'll know. I know everything.' The straight eyebrows crumple. 'But I *would* like it if somebody tried to stop her *first*.'`,
      onEnter: [{ xp: 2 }, { set: "wren_rhea_hard", val: true }],
      choices: [{ text: `'Then I'll try that.'`, goto: "hub", effects: [{ set: "wren_ally", val: true }] }]
    }
  }
},

// ============================================================ D_BUNK
d_bunk: {
  title: "Your Bunk",
  start: [{ cond: "flag.d_bunk_letter", node: "again" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `An iron bunk, lower berth, by the radiator: a grey blanket with a hole the shape of a coin, a pillow with a sag in it that is the exact shape of your head, a mattress that has been slept on by seven previous inhabitants and has opinions about each. The blanket has been tucked at the corners in a manner you did not do. On the sill beside it, a cup of cold tea, and a small neat pile of the things you were wearing yesterday, folded, by someone with large hands and more tact than you.\n\nIt is, you realise, the most personal place you have been in two days. It smells like you, and you do not remember what that smells like.`,
      interjections: [
        { skill: "senses", min: 3, text: `Skin, soap, sleep, a faint trace of chalk. Under the mattress: paper. Not new paper. Something that has been folded and unfolded a number of times.` },
        { skill: "empathy", min: 3, text: `Somebody has made your bed. Somebody who did not need to. It is the kind of small mercy the building mostly keeps in a drawer.` },
        { skill: "deduction", min: 3, text: `The mattress seam on the left side has been unpicked and re-sewn with a different thread. The knots are *yours*: a left-handed double-loop. Somebody who knows how you sew put something in there, and sewed it shut.` }
      ],
      choices: [
        { text: `Search the mattress.`, goto: "search" },
        { text: `Lie down for a while.`, goto: "nap" },
        { text: `Leave it.`, end: true }
      ]
    },
    search: {
      speaker: "narrator",
      text: `You find the seam by feel. A line of stitches in dark thread, your own double-loop, bunched at the end where the sewer ran out of patience. A few tugs and the mattress opens like a mouth. Inside, tucked between the horsehair and the ticking: two folded pages of squared exercise paper, creased soft, written on both sides in a hand that is very obviously yours and is very obviously frightened.\n\nThe first line says: *DEAR ME (MONDAY, 21:50). IF THIS IS WEDNESDAY AND YOU ARE SOFT, READ ON. IF YOU ARE NOT SOFT, BURN IT.*`,
      onEnter: [{ set: "d_bunk_letter", val: true }, { xp: 2 }],
      choices: [
        { text: `Read it.`, goto: "letter" },
        { text: `Burn it. Don't read it.`, goto: "burn", effects: [{ ideo: "quiet", n: 1 }] }
      ]
    },
    letter: {
      speaker: "narrator",
      text: `*DEAR ME,*\n*I am going to carry something for him tonight. You'll know who. You will not know why and you will think I was stupid. I was not stupid. I was scared and sure, which is nearly the same.*\n*I've ordered a pass off Dov. It is for the place the ringing points. Do not go there alone. Do not go there before you have the notes.*\n*The matron counts heads at 7:05, so be in bed. The Inspector, whoever he is, will be kind. It will be a trap with a nice voice. Find the Lady with the Stamp. Tell her the hours are quiet. She will understand what I did.*\n*I am sorry about the next bit. I am going to lose it all. I'm writing this so that one of us remembers that we were not a coward.*\n*Yours, with a ringing in both ears, ME.*`,
      onEnter: [{ set: "d_bunk_letter_read", val: true }, { set: "day2_monday_letter", val: true }, { thought: "th_borrowed_memory" }, { xp: 3 }, { morale: 1 }, { note: "task_yesterday", text: `A letter from Monday-Me under the mattress: I carried something for Ostrov; I ordered a pass off Dov for 'the place the ringing points'; do not go alone; find the Lady with the Stamp and say 'the hours are quiet'; the Inspector 'will be kind: a trap with a nice voice'.` }, { note: "task_stacks", text: `Monday-Me: 'Find the Lady with the Stamp. Tell her the hours are quiet. She will understand what I did.' (The librarian, Ysolde Crane?)` }],
      voices: 3,
      interjections: [
        { skill: "volition", min: 3, text: `You were not a coward. Look at that sentence. You wrote it to yourself because you knew the next person to read it would need it.` },
        { skill: "archive", min: 3, text: `A letter dated before the events, addressed to a person who would not remember. In the language of the Inspectorate this is called a *prospective deposition*. It is evidence for nothing and for everything.` },
        { skill: "empathy", min: 4, text: `It is the saddest thing you have read, and it is not sad. It is *organised*. A frightened person making a plan for a stranger with her face.` },
        { skill: "doublethink", min: 2, text: `Don't take this seriously, friend. A scared child scribbling in the dark. We have all done it. Put it back. Put it all back.` }
      ],
      choices: [{ text: `Fold it. Keep it close.`, goto: "again" }]
    },
    burn: {
      speaker: "narrator",
      text: `You hold a corner to the hotplate across the room and it goes up like a moth, in a quick yellow flicker, and is a ribbon of grey in your palm. For a second, as it curls, you can see a single line in your own hand: *you were not a coward.* Then even that goes. You blow the ash off the sill. In the quiet of the dormitory you can hear, somewhere behind your breastbone, a very small tin kettle begin to whistle.\n\nYou have just done what the Bell does. You did it with your own match.`,
      onEnter: [{ set: "d_bunk_burned", val: true }, { morale: -1 }, { thought: "th_burned_paper" }],
      interjections: [
        { skill: "doublethink", min: 2, text: `There. Clean. Isn't that so much lighter? You'll sleep wonderfully.` },
        { skill: "volition", min: 4, text: `You burned a letter from a person who trusted you to read it. I will remember it. I am the only one who will.` }
      ],
      choices: [{ text: `Continue.`, end: true }]
    },
    again: {
      speaker: "narrator",
      text: `Your bunk. The sag in the pillow, the hole in the blanket, the seam on the left of the mattress that has been opened and closed, a little more roughly each time. The smell is still yours, and you are slowly getting used to it.`,
      interjections: [
        { skill: "deduction", min: 4, text: `Wait. The pillow. There are three hairs on it that are not yours: grey, fine, straight. Somebody with a very good barber lay their head here, or leaned across it, for a long time.`, cond: "day >= 2 && !flag.d_bunk_hair", effects: [{ set: "d_bunk_hair", val: true }, { note: "task_voss", text: `Three fine grey hairs on my pillow. Voss touched it this morning (Wren says). He wiped his hand after. He was looking for something. Perhaps the ringing.` }] }
      ],
      choices: [
        { text: `Lie down for a while.`, goto: "nap" },
        { text: `Leave it.`, end: true }
      ]
    },
    nap: {
      speaker: "narrator",
      text: `You lie on your back and look at the underside of the bunk above, which has been written on, in pencil, by seven successive occupants. *VOTE FOR NOBODY*. *HERE LIES DENIS, 14, OF TIREDNESS*. *DO NOT TRUST THE SOUP*. *SOMEBODY LOVES YOU (NOT ME)*. *IF YOU CAN READ THIS YOU ARE ALSO AWAKE.* Under it, in a looping, newer hand: *I AM STILL HERE.*\n\nFor half an hour you do not think. The radiator ticks. You feel the weight of the day settle in the places a day can settle. It is the nearest thing to rest you have had.`,
      onEnter: [{ time: 30 }, { hp: 1 }, { morale: 1 }],
      interjections: [
        { skill: "stamina", min: 3, text: `A body is not a hammer. It needs the occasional rest from being hit. Lie flat. I'll count the breaths.` },
        { skill: "solidarity", min: 3, text: `We left these. *I am still here.* We always do, in small pencil, under the next person's bed.` }
      ],
      choices: [{ text: `Get up.`, end: true }]
    }
  }
},

// ============================================================ D_FOOTLOCKER
d_footlocker: {
  title: "Footlocker",
  start: [{ cond: "flag.d_foot_open", node: "again" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `A small iron footlocker at the foot of your bunk, bound at the corners with riveted tin, with a hasp and a hook where a padlock was once meant to go. Somebody has stuck a label on the lid: {name} (OR WHOEVER). RETURN TO THIRD FLOOR. Under it, in your own handwriting: *MINE.*\n\nIt is not locked. In a dormitory a lock is an admission.`,
      interjections: [
        { skill: "archive", min: 3, text: `Issue footlocker, boys, Type 4. Interior dimensions: forty by twenty by twenty. Capacity: one school uniform, one spare, one Bible, one conscience. The last two are, for administrative purposes, the same article.` },
        { skill: "slip", min: 3, text: `No lock, no seal, no thread across the lid. It has been opened since you last were here. It has been opened *neatly*, by somebody who put everything back in the right order. That is the signature of a professional.` }
      ],
      choices: [
        { text: `Open it.`, goto: "open" },
        { text: `Leave it.`, end: true }
      ]
    },
    open: {
      speaker: "narrator",
      text: `A spare shirt. A school cap, folded flat. A wooden comb with three teeth gone. A crust of Bronka's rye, wrapped in a handkerchief. A stub of pencil. A small tin ring that you can't remember buying. And under a folded blanket at the bottom, wrapped in a stocking, something heavy and cold: a steel thermos, dented at the shoulder, with a single initial scratched in the base with a nail. *E.*\n\nYour mother's. You know it by the weight, by the way the dent sits in the hand, before you know it by the letters. The thermos is cold and slightly warm at once, the way a very old thing is.`,
      onEnter: [{ set: "d_foot_open", val: true }, { give: "thermos" }, { xp: 1 }, { toast: "Received: Thermos" }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `E. Her name is gone from your head. The initials are not. You know exactly where she kept it: on the shelf above the stove, next to the salt.` },
        { skill: "appetite", min: 2, text: `A thermos. Tea goes in a thermos. Take it with you. Somebody, somewhere, will be cold, and you will have a thermos.` },
        { skill: "the_grey", min: 3, text: `Steel remembers heat. This one has been warm every morning for twenty years. That is a form of love, if you are a thermos.` }
      ],
      choices: [
        { text: `Look under the shirt.`, goto: "under" },
        { text: `Close the lid.`, end: true }
      ]
    },
    under: {
      speaker: "narrator",
      text: `Beneath the shirt, a heavy spanner of the kind used on a tram's coupling, two feet of dull-grey steel with a smear of grease on the jaw. It is not your size or your style. A tag on a string says: *PROPERTY OF D. KESSEL. HOLD FOR N.F. DO NOT USE ON TEACHERS.* Under it, a postcard of the Warden's Father's statue, on whose back somebody has written in capital letters, with a very fine nib: *YOUR MOTHER WRITES EVERY SUNDAY. YOU HAVE NEVER ONCE WRITTEN BACK. I'VE BEEN ANSWERING. — D.*\n\nYou stand holding both of these for a long time.`,
      onEnter: [{ give: "wrench" }, { set: "d_foot_postcard", val: true }, { xp: 2 }, { toast: "Received: Wrench" }],
      interjections: [
        { skill: "empathy", min: 3, text: `Dov has been writing to your mother in your handwriting every Sunday. A forger's most tender crime. He did not tell you because he did not want to be thanked.` },
        { skill: "sleight", min: 3, text: `The postcard is in Dov's hand. The capitals are his. The kindness is *also* his, and is much harder to forge.` },
        { skill: "brawn", min: 2, text: `Heavy. Good. A wrench is the only honest argument a person can carry in their trousers.` }
      ],
      choices: [{ text: `Put the postcard back. Keep the wrench.`, goto: "again" }, { text: `Keep the postcard too.`, goto: "again", effects: [{ morale: 1 }] }]
    },
    again: {
      speaker: "narrator",
      text: `The footlocker, open, with its modest pile of the self: shirt, cap, comb, a crust, a pencil, a tin ring. The lid has a dent where somebody once kicked it, and a sticker that says RETURN TO THIRD FLOOR. It is, you decide, the cleanest evidence of a life that you have found yet.`,
      choices: [
        { text: `Look in the cap.`, goto: "cap", cond: "!flag.d_foot_cap" },
        { text: `Close the lid.`, end: true }
      ]
    },
    cap: {
      speaker: "narrator",
      text: `Inside the school cap's sweatband: a slip of paper, no bigger than a tram ticket, folded very small. It reads, in a looping hand you do not know: *Visiting hour: ask for the plain one. She'll bring you down. — A.* On the other side, in your hand: *A = ANKA??*\n\nIt is an invitation. It is old. It might have been intended for Tuesday. You tuck it back where it came from, under the sweatband, against your own temple, the way you would carry a pulse.`,
      onEnter: [{ set: "d_foot_cap", val: true }, { xp: 1 }],
      choices: [{ text: `Continue.`, goto: "again" }]
    }
  }
},

// ============================================================ D_WINDOW
d_window: {
  title: "The Painted-Shut Window",
  start: [{ cond: "flag.d_window_open", node: "open_again" }, { cond: "flag.d_window_peep", node: "peep_again" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `The window is painted shut with eleven coats of institutional green, applied by a series of caretakers each of whom believed that the previous one had not done it properly. The sash is a solid piece of paint. The glass is a solid piece of dust. Through a clear patch about the size of a coin, near the bottom left corner, a sliver of the world is visible: a bit of wall, a bit of sky, and a wire running to a post that is not the school's.\n\nSomebody has scratched, into the paint at eye-level, a very small rectangle, and under it, in letters the size of a flea: LOOK.`,
      interjections: [
        { skill: "deduction", min: 3, text: `A scratch in the paint at eye level, repeated. Seven times, at seven different heights. Seven different children, each of whom found out for themselves that they were just the right size.` },
        { skill: "the_grey", min: 3, text: `I am on the other side of that glass. I have been looking in for sixty years. You are, I'm sorry to say, a very minor interruption.` }
      ],
      choices: [
        { text: `[Scrape the paint from the peep-hole.]`, check: { skill: "sleight", diff: 8, id: "d_window_peep_sleight", white: true, pass: "peep", fail: "peep_fail" } },
        { text: `[Put your eye to the coin-sized patch.]`, goto: "peep" },
        { text: `[Force the sash.]`, check: { skill: "brawn", diff: 12, id: "d_window_force", white: false, pass: "open", fail: "open_fail" } },
        { text: `Leave.`, end: true }
      ]
    },
    peep_fail: {
      speaker: "narrator",
      text: `The paint comes away in one thin curl with a sound like a throat clearing, and takes a thumbnail with it. Someone in the corridor stops walking. You do not move. After a very long time the footsteps resume. You have a small, clean hole in the green, and a small, clean pain in the thumb, and the satisfaction of a child who has scratched a wall.`,
      onEnter: [{ hp: -1 }, { surv: 1 }],
      choices: [{ text: `Look through it.`, goto: "peep" }]
    },
    peep: {
      speaker: "narrator",
      text: `You put your eye to the hole. Below, past the courtyard wall and the school gate, lies Karsov Avenue: a grey vein of tarmac with a tram wire along it, a queue of women with string bags, a kiosk, a stall under a striped awning. At the far end, a block of concrete the colour of a tooth, with a single red lamp on top that blinks, slowly, like somebody trying to remember a name. Near the gate, parked against the kerb, a black car with a man in a grey coat leaning against it. He is looking at the sky, as if reading it.\n\nHe turns his head, slowly, and for a very long moment looks directly at your window.`,
      onEnter: [{ set: "d_window_peep", val: true }, { xp: 2 }, { note: "task_voss", text: `From the dormitory window: Karsov Avenue, a queue, a kiosk, a stall, a black car with a grey-coated man leaning on it (Voss?). At the far end, a concrete block with a blinking red lamp: the Relay.` }, { note: "task_relay", text: `District Relay No. 4 is a concrete block at the end of Karsov Avenue with a single slowly blinking red lamp. It is visible from the dormitory window.` }],
      voices: 3,
      interjections: [
        { skill: "instinct", min: 3, text: `He looked straight at the window. At the hole. At *you*. It is only a coincidence if you decide it is.` },
        { skill: "senses", min: 4, text: `A very low hum, at the bottom of hearing. The tram wire is singing, a note under the note, steady, in the same key as your ringing.` },
        { skill: "archive", min: 4, text: `Red lamp, one: Standard Ministry Beacon, Type R. The regulation says it flashes once every seven seconds. This one is flashing once every eleven. I do not care for that. It is not the number I expected and it makes me anxious.` },
        { skill: "empathy", min: 3, text: `The queue is long, and quiet, and none of them are looking at the car. Not looking is the loudest thing a crowd can do.` }
      ],
      choices: [{ text: `Step back from the window.`, end: true }]
    },
    peep_again: {
      speaker: "narrator",
      text: `The hole in the paint, the size of a coin. The grey vein of the Avenue, the queue, the black car. The red lamp at the end of it all, blinking at its own pace, indifferent. The man by the car is no longer looking up. He is smoking, with a patience that seems to hold the street in place.`,
      interjections: [
        { skill: "aim", min: 3, text: `Gate, forty metres. Car, ninety. Relay, three hundred and ten. I am not saying anything. I am only measuring.` },
        { skill: "slip", min: 4, text: `The gate has a gap between the post and the wall. Too narrow for an adult. Not, I think, for a first-year. Or a person who has not had breakfast.` }
      ],
      choices: [
        { text: `[Force the sash. See what the window does.]`, check: { skill: "brawn", diff: 12, id: "d_window_force2", white: false, pass: "open", fail: "open_fail" }, cond: "!flag.d_window_open" },
        { text: `Step back.`, end: true }
      ]
    },
    open_fail: {
      speaker: "narrator",
      text: `The sash does not move. The window answers you with a small, dry crack, as if paint had decided to be sarcastic. Your shoulder complains. Somewhere in the stairwell a door shuts, softly, and you stand very still until you are certain nobody is coming.`,
      onEnter: [{ hp: -1 }, { surv: 2 }],
      choices: [{ text: `Leave it.`, end: true }]
    },
    open: {
      speaker: "narrator",
      text: `The paint goes in a long dry rip, like a bandage, and the sash lifts. Cold air comes in from the roof of the world, smelling of rain and tram-grease and a thousand chimneys. The window opens onto a narrow iron fire-ledge, a drainpipe, and a flat stretch of roof that runs along the dormitory wing toward the courtyard wall. It is not a safe route. It is a route.\n\nYou could, at night, with a coat and a good reason, leave this room without passing a single matron.`,
      onEnter: [{ set: "d_window_open", val: true }, { xp: 3 }, { surv: 3 }, { set: "dorm_window_route", val: true }],
      interjections: [
        { skill: "slip", min: 3, text: `Fire-ledge, drainpipe, roof, wall. Eleven metres. The ledge is wet and the pipe is warm. You can be down in forty seconds and nobody counting heads will ever think to look for you on a wall.` },
        { skill: "reflex", min: 3, text: `Three-point contact at all times. Never trust a pipe that is warm for no reason. It might be a boiler. It might be a person.` },
        { skill: "the_grey", min: 3, text: `There. That is better. The first breath of fresh air this room has had since it was a ward.` }
      ],
      choices: [{ text: `Close it again before somebody notices.`, end: true }]
    },
    open_again: {
      speaker: "narrator",
      text: `The window, open an inch, a crack of dark air along the sill. The fire-ledge, the pipe, the long flat run of roof. A route that would not appear in the Matron's book unless somebody saw it. You could take it at night. You could take it now. You are not sure what the difference is.`,
      choices: [{ text: `Close it.`, end: true }]
    }
  }
},

// ============================================================ D_HOTPLATE
d_hotplate: {
  title: "The Hotplate",
  start: [{ node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `A single-ring electric hotplate on a table, black with the ghosts of a thousand burnt soups. A dented kettle. A tin tray. Three mugs, one of which has a chip in the shape of a country. A hand-lettered card, in Matron's round hand: HOTPLATE: EXCEPTIONAL USE ONLY (SEE REGULATION 19). Under it, in the same hand but a different pen: *Except on Wednesdays. — H.P.*\n\nIt is, you decide, the warmest object in the dormitory by about eleven degrees. It has the quiet dignity of the only thing in a room that gets used.`,
      interjections: [
        { skill: "appetite", min: 2, text: `A kettle. A hotplate. Three mugs. Is there tea? There is always tea in a person who has ever loved a hotplate.` },
        { skill: "empathy", min: 3, text: `A card in the Matron's hand: *Except on Wednesdays*. She breaks her own rule on Wednesdays, because that was the day the girl with the cough would come back from the Reading Room, if she were ever returned.` }
      ],
      choices: [
        { text: `Brew some ration tea.`, goto: "brew", cond: "has('ration_tea')" },
        { text: `Put a small pan of water on to boil anyway.`, goto: "boil" },
        { text: `Examine the hotplate's underside.`, goto: "under", cond: "!flag.d_hot_under" },
        { text: `Leave it.`, end: true }
      ]
    },
    boil: {
      speaker: "narrator",
      text: `Hot water, then, and nothing to put in it. You stand holding a mug of it. The steam rises; the dormitory fills slowly with the smell of nothing, and of company. After a moment Dov drifts over and wordlessly adds a sugar-lump from some secret pocket, and Wren, from her bunk, says without looking up, 'You've got the mug with the country on it. That's the *best* one.'\n\nIt is a small, warm, stupid happiness. It lasts for the length of a mug.`,
      onEnter: [{ time: 10 }, { morale: 1 }, { set: "d_hot_boiled", val: true }],
      choices: [{ text: `Drink.`, end: true }]
    },
    brew: {
      speaker: "narrator",
      text: `You tear the twist of paper and drop the black leaves into the kettle. Three minutes. The smell comes up out of it: chicory, dust, something fruity and sad in the background, as if the leaves were remembering a tree. Dov appears at your shoulder with the mug that has the chip. Wren is cross-legged on the nearest bunk, pretending not to look. The Matron's rule says *exceptional use only*, and it is, you think, exceptional.\n\nYou pour. Three mugs. Nobody says anything. For a few minutes it is the nearest thing to a family you have seen in a school.`,
      onEnter: [{ take: "ration_tea" }, { time: 10 }, { morale: 3 }, { hp: 1 }, { set: "d_hot_shared_tea", val: true }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "solidarity", min: 2, text: `A shared cup. We have never organised anything better than a shared cup. It does the work of eleven pamphlets.` },
        { skill: "appetite", min: 2, text: `TEA. Hot. Black. Bitter. In a mug with a country-shaped chip. It is the most beautiful thing I have ever tasted and I have tasted bread.` },
        { skill: "empathy", min: 3, text: `Dov holds the mug with both hands, as if it were an animal. Wren drinks hers in tiny sips, the way you drink something you know you will not be given again.` }
      ],
      choices: [{ text: `Drink.`, end: true }]
    },
    under: {
      speaker: "narrator",
      text: `You tip the hotplate on its side. Taped to the underside with a strip of surgical tape is a cigarette-paper packet, containing two grey pills, a carefully folded note, and a tiny flat key. The note says, in the Matron's round hand: *For the girl who asks for the house.* The pills, you suspect, are for sleeping. The key you cannot place.\n\nYou tape it all back exactly as it was, and set the hotplate down on its feet, and stand for a while with your hands flat on the warm table. Some secrets are not for you. They are only for you to know are there.`,
      onEnter: [{ set: "d_hot_under", val: true }, { xp: 2 }, { set: "matron_house_note", val: true }],
      interjections: [
        { skill: "deduction", min: 3, text: `*The girl who asks for the house.* There is a girl, somewhere, who asks. And there is a woman here who has kept a bed, and a pill, and a key, in a hotplate, for the day she is returned.` },
        { skill: "empathy", min: 4, text: `Don't use this. Don't use it for leverage. It is the only prayer in the building that has been answered by its own author's patience.` }
      ],
      choices: [{ text: `Leave it.`, end: true }]
    }
  }
},

// ============================================================ D_BOARD
d_board: {
  title: "The Corridor Board",
  start: [{ node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `A cork board three layers deep, pinned thick with paper of every date and status, like a geological cross-section of the school's opinion of itself. At the top, in the regulation typeface: DORMITORY THREE: NOTICES. Below, a hierarchy: official circulars on blue paper, Vanguard bulletins on red, hand-lettered *Lost* and *Found* on whatever came to hand. A piece of string with a pencil on it hangs from a pin, so that anybody who wishes may write *seen* beside an item.\n\nNo one has written anything beside any of them.`,
      voices: 3,
      interjections: [
        { skill: "archive", min: 3, text: `A notice board is a primary source of exquisite quality: the layers carry their own dates in the pin-holes. Let me read it from the bottom. Four layers down is the Circular that renamed this dormitory twice.` },
        { skill: "rote", min: 3, text: `NOTICES ARE POSTED FOR YOUR INFORMATION. INFORMATION IS POSTED FOR YOUR SAFETY. SAFETY IS POSTED FOR YOUR OBEDIENCE.` },
        { skill: "senses", min: 4, text: `The pins are all new, and all identical. Somebody replaces them each week. Somebody cares very much what this board looks like.` }
      ],
      choices: [
        { text: `Read the Jubilee notice.`, goto: "jubilee" },
        { text: `Read the Inspector's notice.`, goto: "inspector", cond: "day >= 2" },
        { text: `Read the small blue circular.`, goto: "quiet", cond: "!flag.d_board_quiet" },
        { text: `Read the handwritten ads.`, goto: "ads" },
        { text: `Leave.`, end: true }
      ]
    },
    jubilee: {
      speaker: "narrator",
      text: `THE WARDEN'S JUBILEE. The notice is printed on heavy cream paper, with a gilt bell at the head and a border of wheat. *In grateful recognition of the Warden's fortieth year of Steady Hands, THURSDAY at 20:00 the whole District will receive GRAND HARMONY, to be broadcast in a special and extended form from the Bell Tower of every School. Attendance at the tower square is COMPULSORY. Forgetting is OPTIONAL.* Underneath, in a very small italic: *Participants will find the experience restful.*\n\nSomebody has pencilled across the bottom, in a hurry: *FORGETTING IS NOT OPTIONAL. READ THE SMALL PRINT. THE SMALL PRINT IS THE BELL.*`,
      onEnter: [{ set: "d_board_jubilee", val: true }, { xp: 1 }, { thought: "th_grand_harmony" }, { note: "task_jubilee", text: `Thursday 20:00: the Warden's Jubilee, GRAND HARMONY broadcast over the whole District from the Bell Tower of every school. 'Attendance compulsory. Forgetting optional.' Someone has pencilled: 'Forgetting is not optional. The small print is the Bell.'` }],
      voices: 3,
      interjections: [
        { skill: "dialectics", min: 3, text: `Attendance is compulsory. Forgetting is optional. Therefore the audience will attend and, being unable to refuse a thing that is optional, will forget. The syllogism is complete and the logic is beautiful and the conclusion is a silence the shape of a district.` },
        { skill: "instinct", min: 3, text: `Grand. Not Great. Grand. A word that means *we are going to do this very loudly.*` },
        { skill: "archive", min: 4, text: `A broadcast 'in special and extended form'. The Harmony usually runs nine minutes. 'Extended' is not defined. I should like to see the definition. I suspect the definition is *all of it.*` },
        { skill: "the_grey", min: 3, text: `Tomorrow night. Twenty hundred. I feel it the way a drain feels rain that is on its way.` }
      ],
      choices: [{ text: `Step back.`, goto: "look" }]
    },
    inspector: {
      speaker: "narrator",
      text: `A single sheet, pinned dead centre, stamped STATE INSPECTORATE (DISTRICT LIAISON). *INSPECTOR HALE VOSS WILL BE RECEIVING STATEMENTS FROM STAFF AND STUDENTS IN THE PRINCIPAL'S OFFICE FROM 09:00. ATTENDANCE IS VOLUNTARY. NON-ATTENDANCE WILL BE NOTED. THE INSPECTOR WISHES TO REASSURE ALL THAT HE IS ON THE SIDE OF THE TRUTH. THE TRUTH, HE ASSURES US, IS ON THE SIDE OF THE UNION.* A signature in a pleasant, rounded hand. A little pen-drawing beside it, a small paper boat.\n\nSomebody has drawn a dotted line round the boat and written beside it, in a child's pencil: *WHAT IS THE BOAT?*`,
      onEnter: [{ set: "d_board_voss", val: true }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 4, text: `A boat. A paper boat, hand-drawn, with the creases right. Somebody who has folded a great many. Somebody with a child, or the habit of one. A man does not draw that unless he has made it a thousand times.` },
        { skill: "empathy", min: 4, text: `He signs it with a boat. Under the paperwork, under the Inspectorate, there is a man whose hand wants to fold paper. It is a small and unforgivable thing to learn about a stranger.` }
      ],
      choices: [{ text: `Step back.`, goto: "look" }]
    },
    quiet: {
      speaker: "narrator",
      text: `A small blue circular, creased with age, in the faded typeface of an older regime. *NOTICE 77. THE QUIET HOURS: A PUBLIC GOOD. Between 21:00 and 06:00, the citizen is entitled to REST FROM RECOLLECTION. The State provides this entitlement free of charge. Persons who object to Quiet Hours on grounds of conscience may apply in writing to the Ministry of Quiet Hours (Field Office), whose address is ON REQUEST.*\n\nIt has been pinned here for twenty years. The corners have been rubbed to felt by the thumbs of children trying to work out what it means. At the bottom, in the margin, in an elderly, upright hand: *YES. I WROTE THAT SENTENCE. FORGIVE ME. — A.Q.*`,
      onEnter: [{ set: "d_board_quiet", val: true }, { xp: 2 }, { thought: "th_quiet_hours" }, { note: "task_stacks", text: `Notice 77 ('The Quiet Hours: A Public Good') carries a marginal note: 'YES. I WROTE THAT SENTENCE. FORGIVE ME. — A.Q.' A.Q. is, presumably, Ambrose Quill.` }],
      voices: 3,
      interjections: [
        { skill: "archive", min: 3, text: `A.Q. Ambrose Quill, Official Historian to the Ministry of Quiet Hours, 'Retired'. Author of *The Quiet Hours: A Philosophy of Merciful Forgetting*. The book is banned. The author is in the reading room. They have not, as it were, got round to each other.` },
        { skill: "rhetoric", min: 3, text: `'Rest from recollection.' Magnificent. They have turned an amputation into a spa. I would be proud, if I were not its victim.` },
        { skill: "doublethink", min: 2, text: `A *right*. To rest. A free service. How generous. Wouldn't you like to have rested?` },
        { skill: "solidarity", min: 3, text: `Somebody wrote *forgive me*. Do you know how rare that is? On a government form? Find him.` }
      ],
      choices: [{ text: `Step back.`, goto: "look" }]
    },
    ads: {
      speaker: "narrator",
      text: `Between the circulars, the real economy. *WANTED: SPOON, BENT (NOT A PERSON). APPLY D.K.* *LOST: ONE GERBIL, ONE EAR, ANSWERS TO RANK. DO NOT RETURN TO THE HOME.* *SELLING: PERFECT ATTENDANCE (USED). APPLY C.H. IN LIBRARY. NO QUESTIONS.* *FOR THE GIRL IN THE CHAIR: A TUBE, IF ANYONE HAS ONE. — O.* *HAS ANYONE SEEN A MAN CALLED TOBAR? HE SINGS TENOR. — B.* *WE ARE STILL HERE. — 3RD FLOOR.*\n\nThe last one is in a dozen different handwritings, each line a different hand, as if the whole dormitory had taken turns.`,
      onEnter: [{ set: "d_board_ads", val: true }, { xp: 1 }],
      interjections: [
        { skill: "solidarity", min: 2, text: `We are still here. Twelve hands, one sentence. This is the whole of the argument and it fits on a postcard.` },
        { skill: "empathy", min: 3, text: `*Has anyone seen a man called Tobar?* Pinned beside a notice about spoons. There is no hierarchy of grief on a corridor board.` },
        { skill: "deduction", min: 3, text: `*Perfect attendance (used)*. C.H. is Corvin Hale. He is selling his own attendance record. That is the single most revealing thing anyone has ever pinned to a wall.` }
      ],
      choices: [{ text: `Step back.`, goto: "look" }]
    }
  }
},

// ============================================================ YSOLDE CRANE
ysolde: {
  title: "Librarian Crane",
  start: [
    { cond: "day < 2", node: "d1" },
    { cond: "flag.ysolde_talked", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    d1: {
      speaker: "ysolde",
      text: `'Shh.' It arrives before you have opened your mouth, like a stamp coming down on a form. The librarian lifts her eyes by a grudging degree. 'You are a three-seven-two: *Schooling, general; student, adolescent, unaccompanied.* Do not look so hurt. Everyone is a number here. It is the kindest thing the Dewey system does.' Her voice is a whisper with a spine in it. 'Borrowing is by ticket. Reading is by permission. Thinking, I am obliged to point out, is not catalogued.' A very small, very dry smile. 'Yet.'\n\nShe stamps something. You have not given her anything to stamp.`,
      interjections: [
        { skill: "charm", min: 3, text: `She is joking. She is joking so quietly and so completely that eleven years of students have mistaken it for a regulation.` },
        { skill: "archive", min: 4, text: `Ysolde Crane. Librarian, Grade One, thirty-one years. Her stamp reads RETURNED. It is the only RETURNED stamp in the school that is ever actually used for that.` }
      ],
      choices: [{ text: `'I'm only looking.'`, end: true }]
    },
    first: {
      speaker: "ysolde",
      text: `'Shh.' The librarian does not lift her eyes. She finishes the card she is writing, blots it, stamps it, files it, and only then, as though all of that had been a form of grace, looks up. Round glasses on a chain, a navy cardigan, a bun so exact it might have been engraved. 'You are a three-seven-two,' she whispers, 'but I have been told you are also a *problem*. I am Ysolde Crane. I keep the books. I do not keep the *people*, though I am occasionally asked.'\n\nHer eyes drop to your left hand, to the faint grey ghost of chalk still in the creases. 'You have not been in since Monday,' she says. 'Monday was a *great deal* of noise. In the sense that there was none.'`,
      onEnter: [{ set: "ysolde_talked", val: true }, { set: "met_ysolde", val: true }],
      voices: 3,
      interjections: [
        { skill: "instinct", min: 3, text: `She said *Monday*. She said it as if you were returning something. Do not correct her. Let her think you remember.` },
        { skill: "empathy", min: 4, text: `She is shushing you the way a person pats a pocket to check a key is still there. It is not for you. It is for the room.` },
        { skill: "senses", min: 3, text: `Beneath the lavender and paste, a trace of wax from a candle, snuffed an hour ago. Somebody has been reading by candle in here. Somebody who does not want the lamps on.` },
        { skill: "doublethink", min: 2, text: `A librarian. Perfectly safe. A librarian is only a person who has read the dangerous books *for* you. Let her. It is such a relief to be spared the reading.` }
      ],
      choices: [
        { text: `'The first-year says the hours are quiet.' (Give her the note.)`, goto: "note_deliver", cond: "has('wren_note')" },
        { text: `'The hours are quiet.' (Say the phrase from your own handwriting.)`, goto: "phrase", cond: "flag.day2_monday_letter || flag.stacks_hint_from_self" },
        { text: `'What was Monday?'`, goto: "monday" },
        { text: `'I'd like to read something.'`, goto: "hub" }
      ]
    },
    monday: {
      speaker: "ysolde",
      text: `'Monday?' She sets down her pen with the precision of a diplomat. 'You were here at twenty past four. You asked for the Index. I told you there was no Index. You said *then I'd like the key to no Index*. It was a very good line.' She pauses. 'You signed the visitors' book. Look.' The ledger turns on the desk, and the last entry is in your handwriting: *S. — to see the lady with the stamp. For a friend, who isn't able to.* The *for a friend* is underlined three times.\n\n'You did not say who the friend was,' she says gently. 'I did not ask. In a library it is considered rude.'`,
      onEnter: [{ xp: 2 }, { set: "ysolde_monday", val: true }, { note: "task_yesterday", text: `Ysolde says I came to the library at 16:20 on Monday and signed the visitors' book: 'to see the lady with the stamp. For a friend, who isn't able to.' I asked for 'the key to no Index'.` }],
      interjections: [
        { skill: "deduction", min: 3, text: `*For a friend, who isn't able to.* Who could not come to the library? Someone housebound. Someone in a chair who cannot manage the ramp. Someone with a radio.` },
        { skill: "archive", min: 3, text: `The visitors' book. Signatures going back to the Year of Steady Hands. At the head of the page, in violet, a column header: NAME, PURPOSE, RETURNED. Nobody has ever filled in RETURNED.` }
      ],
      choices: [{ text: `Ask her what she thinks it meant.`, goto: "hub" }]
    },
    note_deliver: {
      speaker: "ysolde",
      text: `She breaks the wax thumb with a fingernail and reads, and the whole of her face does something it has not done in your presence: it softens at the edges, like a page held too close to a lamp. 'The first-year,' she says. 'Of course.' She takes up a pen, writes four words on a slip, blots it, folds it. 'Tell her: *the lamp is lit*. She'll understand. She sends me a request every Wednesday, on the stroke of ten. *A book about the sea*, she writes. Last week it was *a book about a bird that does not live in this country.*' A pause. 'I send her what I can. In the covers of Orthodoxy, Volume Six. It is thick enough to hide a whole *world.*'\n\nShe slides the slip across the desk with one finger. 'That is the entire, deplorable extent of my crimes.'`,
      onEnter: [{ take: "wren_note" }, { set: "ysolde_reply_for_wren", val: true }, { xp: 3 }, { thought: "th_chosen_family" }, { note: "task_wren", text: `Ysolde's reply for Wren: 'The lamp is lit.' She sends Wren books in Orthodoxy covers, for the children of the Home: a book about the sea, a bird not found in this country.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `A lonely librarian and a lonely child, exchanging a single sentence a week through the postal system of a sock. It is the smallest, most defiant library in the Union.` },
        { skill: "solidarity", min: 3, text: `She sends books in disguise. Orthodoxy, Volume Six: the volume that nobody reads past page 60. Ilsabet's radio. Wren's sea. We are a nation of hollowed-out hymn-books.` }
      ],
      choices: [{ text: `'I'll tell her.'`, goto: "hub" }]
    },
    phrase: {
      speaker: "ysolde",
      text: `The word *quiet* goes through her like a pin through a map. For a long time she says nothing at all, which in a library is the loudest thing a person can do. Then she lays the pen in the groove of the blotter, stands, takes the velvet rope from its brass hook, and lets it fall.\n\n'It is you,' she says, so quietly that the dust itself seems to listen. 'You came on Monday and asked me to keep something. I told you it was impossible. You said, *then keep me instead*.' She adjusts her glasses with a hand that is not entirely steady. 'You've lost it. Of course you have. I have been telling myself for two days that I would be calm.' A very small, helpless laugh. 'Come in. Mind the third step. It's a lie.'`,
      onEnter: [{ set: "library_stacks_open", val: true }, { set: "ysolde_trust", val: true }, { set: "stacks_via_phrase", val: true }, { xp: 4 }, { task: "task_stacks", state: "active" }, { note: "task_stacks", text: `The phrase 'the hours are quiet' made Ysolde drop the velvet rope. The Forbidden Stacks are open to me. She says I came on Monday and said: 'Then keep me instead.'` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She has been waiting for you. For two days, with a hand on the rope. This is not a woman opening a door. This is a woman exhaling.` },
        { skill: "solidarity", min: 3, text: `We kept each other. That is the entirety of the Undercurrent: people keeping each other because we cannot be kept by anything else.` },
        { skill: "volition", min: 4, text: `You are about to learn what you gave away on Monday. You will, I promise you, be able to bear it.` }
      ],
      choices: [{ text: `Step over the rope.`, goto: "hub" }]
    },
    hub: {
      speaker: "ysolde",
      text: [
        `'Shh.' It is mostly punctuation. Then, in her ordinary whisper: 'Yes? I have forty-one thousand questions and I am only going to answer yours.'`,
        `The librarian does not look up from the card she is writing. 'A question is a form of borrowing. Please return it in good condition.'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `From behind the rope comes a hush so complete it has a texture: not a silence but a *thickness*, like a coat.` },
        { skill: "archive", min: 4, text: `The shelves behind the rope are lined, you notice, with thick felt, and the felt with lead foil. This is not a book-room. It is an anechoic chamber with a reading list.` }
      ],
      choices: [
        { text: `[Give her Wren's note.]`, goto: "note_deliver", cond: "has('wren_note')" },
        { text: `'Tell me about the Forbidden Stacks.'`, goto: "stacks_ask", cond: "!flag.ysolde_stacks_asked && !flag.library_stacks_open" },
        { text: `[Present your credentials: a slip and a shelfmark.]`, goto: "stacks_present", cond: "flag.ysolde_stacks_asked && flag.stacks_slip && flag.stacks_shelfmark && !flag.library_stacks_open" },
        { text: `'What do I still need for the Stacks?'`, goto: "stacks_need", cond: "flag.ysolde_stacks_asked && !flag.library_stacks_open && !(flag.stacks_slip && flag.stacks_shelfmark)" },
        { text: `'Why are the Stacks lined with felt?'`, goto: "deaf", cond: "flag.library_stacks_open && !flag.ysolde_deaf" },
        { text: `'You said I asked you to keep something on Monday. What?'`, goto: "kept", cond: "flag.stacks_via_phrase && !flag.ysolde_kept" },
        { text: `'The card catalogue. It has an Index, doesn't it?'`, goto: "index", cond: "flag.catalog_index_seen && !flag.ysolde_index_talked" },
        { text: `'The Inspector. Has he been here?'`, goto: "voss", cond: "day >= 2 && !flag.ysolde_voss" },
        { text: `'Ilsabet Orrin is using one of your tables.'`, goto: "ilsabet", cond: "day >= 2 && !flag.ysolde_ilsabet" },
        { text: `'The spiral stair. The Tower.'`, goto: "tower", cond: "!flag.ysolde_tower" },
        { text: `[Ask to spend the night among the books.]`, goto: "shelter", cond: "flag.library_stacks_open && time >= 1000 && !flag.ysolde_shelter" },
        { text: `'Thank you, Miss Crane. Shh.'`, end: true }
      ]
    },
    stacks_ask: {
      speaker: "ysolde",
      text: `'The back stacks are the Withdrawn Collection.' She says it with such precise neutrality that it sounds like a funeral. 'Three thousand, two hundred volumes. Withdrawn from circulation by Circular, not by me, at various dates. *Withdrawn* is a lovely word. It implies they went of their own accord.' She folds her hands. 'Access is for Authorised Readers. An Authorised Reader has three things. *A signature*, from a teacher of standing, who is willing to be on the record. *A shelfmark*: the number in the catalogue that proves you know what you are asking for, and that you know it has a number. And *a reason*, which I judge.' A beat. 'I am a very hard judge of reasons. I have heard them all. *Curiosity.* *Research.* *It's for a friend.*'\n\nHer mouth does something fractionally less than a smile. 'It is nearly always for a friend.'`,
      onEnter: [{ set: "ysolde_stacks_asked", val: true }, { task: "task_stacks", state: "active" }, { xp: 1 }, { note: "task_stacks", text: `Ysolde guards the Withdrawn Collection (the Forbidden Stacks): 3,200 volumes. To be an Authorised Reader I need a teacher's signature, a shelfmark from the card catalogue, and a reason she believes.` }],
      interjections: [
        { skill: "rhetoric", min: 3, text: `A reason. Not a *good* reason. A reason *she believes.* There is a difference and it is the entire art of my profession.` },
        { skill: "archive", min: 3, text: `Withdrawn Collection: 3,200 volumes. Circular 41, Circular 52, Circular 61. At the front of each: a green slip reading WITHDRAWN: FOR THE READER'S OWN PROTECTION. They are very well looked after, the protected.` }
      ],
      choices: [{ text: `'Who can sign?'`, goto: "stacks_need" }, { text: `'I'll be back.'`, goto: "hub" }]
    },
    stacks_need: {
      speaker: "ysolde",
      text: `'A signature,' she says, ticking it off on a finger. 'From a teacher of *standing*. The Principal's would do, but I do not think it will be offered. Mr Quill in the reading room has been a teacher of standing since before the Principal was a teacher of anything.' A second finger. 'A shelfmark. The card catalogue. Find the card for the thing you want. It will not be under the thing you want. It will be under the thing the thing *rhymes with*.' A third finger. 'And a reason.'\n\nShe taps the desk. 'I have a reading table in the corner. The old gentleman at it will sign what he is persuaded is worth signing. He is also missing a few pages of his own notes. If a person were to find them, I should think he'd be very grateful.'`,
      onEnter: [{ set: "ysolde_need_heard", val: true }, { xp: 1 }],
      choices: [
        { text: `[The signature.] Ask about Quill.`, goto: "quill" },
        { text: `[The shelfmark.] 'Rhymes with?'`, goto: "rhyme" },
        { text: `'I'll gather them.'`, goto: "hub" }
      ]
    },
    quill: {
      speaker: "ysolde",
      text: `'Mr Quill taught history here for thirty years,' she says. 'Then he was *rested*. The word is *rested*. He sits at the corner table and annotates a book that he has not opened since the Ministry took his name off the spine.' She lowers her voice. 'His lecture notes, the complete chronology, forty-one years, were taken from his table on Tuesday by someone with very nice handwriting and no conscience. I shan't say who. A librarian notes; she does not accuse. But the boy next to him has been writing an essay of remarkable fluency, with several very good dates in it, and a great many words that were not his.'`,
      onEnter: [{ set: "ysolde_quill_hint", val: true }, { xp: 1 }, { note: "task_stacks", text: `Quill's chronology notes were taken from his table on Tuesday. Ysolde hints that Corvin Hale, who is writing an essay with remarkable dates, has them. Return the notes and Quill will sign my slip.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    rhyme: {
      speaker: "ysolde",
      text: `'The Index of Subjects is arranged by *association*,' she whispers, with the sad enthusiasm of a woman describing her own invention. 'Not by what a book is *about*, because the Ministry has been very thorough about *about*. By what it is *near.* A book about forgetting is shelved beside a book about gardening. A book about the Hours is under *Horticulture, Winter.*' She straightens a pencil. 'The catalogue is the large oak thing in the middle. It is not a beautiful thing. It is a *clever* one. Try *Hours*. Try *Quiet*. Try, if you are feeling reckless, *Mercy*.'`,
      onEnter: [{ set: "ysolde_rhyme", val: true }, { xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    stacks_present: {
      speaker: "ysolde",
      text: `'A signature, a shelfmark.' She turns your slip over, checks the ink, sniffs the paper as one sniffs a wine, and sets it on her blotter. 'Both in order. That leaves *the reason*.' She leans on her elbows. 'I am going to ask you one question. You may answer however you like. I am going to tell you *now* that I will know if you are lying, and that I will let you through anyway if the lie is a *good* one.'\n\nShe takes off her glasses. Without them her eyes are much younger and very tired. 'Why do you want to read what has been withdrawn?'`,
      voices: 3,
      interjections: [
        { skill: "volition", min: 3, text: `Say it true, if you can. It will cost you something and cost you nothing, and she will be able to tell which.` },
        { skill: "rhetoric", min: 4, text: `A lie must be better than the truth, or it is only a confession with makeup on.` },
        { skill: "instinct", min: 3, text: `She is not testing your argument. She is testing whether you flinch when you say the word *read*.` }
      ],
      choices: [
        { text: `[Tell her the truth: you woke up empty and you want to know what was taken.]`, check: { skill: "empathy", diff: 9, id: "ysolde_reason_empathy", white: true, pass: "reason_ok", fail: "reason_fail" } },
        { text: `[Cite the Regulations: Circular 41, Article 9(c), 'Reasonable Scholarly Curiosity'.]`, check: { skill: "archive", diff: 10, id: "ysolde_reason_archive", white: true, pass: "reason_ok", fail: "reason_fail" } },
        { text: `[Say it as one of us: 'So that somebody remembers.']`, check: { skill: "solidarity", diff: 9, id: "ysolde_reason_solidarity", white: true, pass: "reason_ok", fail: "reason_fail" } },
        { text: `[Charm her: tell her she has the most beautiful stamp in the Union.]`, check: { skill: "charm", diff: 12, id: "ysolde_reason_charm", white: true, pass: "reason_ok", fail: "reason_fail" } }
      ]
    },
    reason_ok: {
      speaker: "ysolde",
      text: `She puts her glasses on again, slowly, like a woman completing a sentence. 'Yes,' she says. 'That is a reason.' She rises, takes the velvet rope from its brass hook and lays it carefully on the desk, folded, like a flag. 'In forty years not one student has said it to me *aloud*. They say it with their faces. It is a very different thing.' Her voice cracks on *different*, once, and she coughs to cover it. 'Come. I'll show you where we keep what the world withdrew. It is a good deal bigger than you think.'`,
      onEnter: [{ set: "library_stacks_open", val: true }, { set: "ysolde_trust", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }, { note: "task_stacks", text: `Ysolde judged my reason acceptable and lowered the rope. The Forbidden Stacks are open.` }],
      interjections: [
        { skill: "solidarity", min: 2, text: `We. Forty years of children who could not say it and one who could. That is how a library is opened: one reader at a time.` },
        { skill: "empathy", min: 3, text: `She has not cried in a library in twenty years. She is going to do it somewhere between the C's and the D's, in the dark, where nobody will mind.` }
      ],
      choices: [{ text: `Follow her.`, goto: "hub" }]
    },
    reason_fail: {
      speaker: "ysolde",
      text: `'No.' She says it kindly. 'That is a very *good* answer. It simply is not yours.' She replaces the glasses. 'I can hear when a sentence has been rehearsed. A reason is a thing that has not been practised.' She slides the slip back across the desk with a single finger. 'Come back when you have one. I shall be here. I am always here. It is rather the point of me.'\n\nThe rope hangs at its usual exact angle. You have, you gather, been very politely refused.`,
      onEnter: [{ morale: -1 }],
      choices: [{ text: `Retreat.`, goto: "hub" }]
    },
    deaf: {
      speaker: "ysolde",
      text: `'Felt, lead foil, forty years of reference books.' She runs a hand along a shelf. 'Paper is the best sound-absorbent ever devised. It was not designed to be. It was designed to keep a secret, and it turns out that a secret and a silence are the same architecture.' She looks at you. 'There is one room in this district where the Bell does not reach. This is it. I do not know why; Mr Quill has a theory involving the thickness of Volume Eleven. I have never been Static. Not once. I remember *everything*. You have no idea what an appalling thing that is.'\n\nShe turns to face the shelves. 'I have the whole of the last thirty-one years. Every name. Every child. I sit here and I hold it, and nobody can ask me to put it down.'`,
      onEnter: [{ set: "ysolde_deaf", val: true }, { xp: 3 }, { thought: "th_forbidden_page" }, { note: "task_stacks", text: `The Stacks are lined with felt and lead foil. The Bell does not reach them. Ysolde has never been Static: she remembers thirty-one years, every name.` }],
      voices: 3,
      interjections: [
        { skill: "the_grey", min: 3, text: `Paper. I admit it. I am impressed. A substance made of trees, which have never in their lives been persuaded of anything.` },
        { skill: "empathy", min: 4, text: `*An appalling thing.* She carries the memory the rest of the district was relieved of. She has become the dead room's one living witness.` },
        { skill: "archive", min: 3, text: `A closed acoustic volume with forty thousand pages of paper in it. A better Static-shelter than any bunker. I want, very much, to hold a lecture on this. Nobody will let me.` },
        { skill: "solidarity", min: 3, text: `If you are inside at nine, you keep the day. That is all you need to know. It is the best shelter in the Union.` }
      ],
      choices: [{ text: `'You've held all of it, alone.'`, goto: "hub", effects: [{ morale: 1 }, { ideo: "undercurrent", n: 1 }] }]
    },
    kept: {
      speaker: "ysolde",
      text: `'A *cylinder*.' The word is a whisper under the whisper. 'Wax. Blank. You asked whether I had any left from the Sound Archive: the old phonograph recordings, from before the Decree on Voices. They were withdrawn for their *content*, but the *cylinders* are rather versatile. A friend of yours, you said, wanted to record something very short and very *clean*.' She taps her lip. 'You took one. And then you asked me to keep *you*. I told you that was not a loan I could make.'\n\nShe turns toward the shelves. 'The cylinders are on the fourth shelf of the Sound Archive. If you want them. I think, on reflection, you came for them.'`,
      onEnter: [{ set: "ysolde_kept", val: true }, { xp: 2 }, { note: "task_counter", text: `On Monday I asked Ysolde for blank wax cylinders from the Sound Archive in the Stacks, for a friend who wanted to record something short and clean (Ilsabet?).` }],
      interjections: [
        { skill: "deduction", min: 3, text: `A blank cylinder, for a friend who wanted to record something short. A radio girl. A tone. You were building the counter before you lost the reason.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    index: {
      speaker: "ysolde",
      text: `'Ah.' She does not look at the catalogue. She does not need to. 'The thing in the middle with all the drawers. Yes. I keep one *other* sort of card, in my own hand, in the bottom three rows. I started it in the Year of the Long Frost, when a girl in the third form was *transferred* in the night and nobody on the whole of the floor could say her name.' She says it without drama. 'I thought somebody ought to be able to. So I made her a card. Then another. A name. A date. What it is that they were not allowed to carry out.'\n\n'It isn't an *index*,' she adds. 'An index is for finding. This is for *keeping*.'`,
      onEnter: [{ set: "ysolde_index_talked", val: true }, { xp: 2 }, { thought: "th_chosen_family" }],
      interjections: [
        { skill: "empathy", min: 3, text: `A card for every child nobody could name. That is the oldest act of love there is: to make something that will not be stopped from saying who was here.` },
        { skill: "solidarity", min: 3, text: `We keep. We are the ones who keep. If we keep nothing else, we keep the names.` }
      ],
      choices: [{ text: `'May I look for someone?'`, goto: "hub", effects: [{ set: "ysolde_index_allowed", val: true }] }]
    },
    voss: {
      speaker: "ysolde",
      text: `'Mr Voss.' She says the title with the neutral grace of a bishop handing back a hymnal. 'He came at seven, before I had opened the shutters. Very polite. Very *tired.* He asked for the loan register, Monday through Tuesday, the entire district. I told him it was, regrettably, lost.' She smooths a card. 'He thanked me. He said it must be dreadful to lose a thing that important. And then he asked the oddest thing. He asked if I had ever read a book that *I wished* I had forgotten.'\n\nHer face does not change. 'I told him that is the only sort worth keeping.'`,
      onEnter: [{ set: "ysolde_voss", val: true }, { xp: 2 }, { note: "task_voss", text: `Voss came to the library at seven, asked for the loan register (Mon–Tue). Ysolde said it was lost. He asked whether she'd ever read a book she wished she'd forgotten.` }],
      interjections: [
        { skill: "empathy", min: 4, text: `*A book I wished I had forgotten.* He was not asking her. He was asking himself aloud, to a person who would not tell.` },
        { skill: "instinct", min: 3, text: `A man who asks a librarian that question has already read the book. He is looking for somebody to tell him it was worth it.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    ilsabet: {
      speaker: "ysolde",
      text: `'Miss Orrin.' A rare, real, short smile, quickly folded away. 'She has Table Four, which has a ramp, and the window with the best cable-run. She reads my wireless manuals. I bind them in Orthodoxy. She thinks I do not know she is wiring something *under* the table.' She taps the desk. 'I do. I put an old pair of carpet-slippers on the cable so it would not trip the Matron. I am not an accomplice. I am a *conservator*.'\n\nShe looks, for one second, nearly happy. 'She has a thing she wants to build. A tone. A *counter*. It needs a tube and a cable and something to record on. I have two of those three things in the Stacks.'`,
      onEnter: [{ set: "ysolde_ilsabet", val: true }, { xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    tower: {
      speaker: "ysolde",
      text: `'The stair.' She regards it across the whole length of the room, as one regards a distant relation. 'Locked since the spring. The Bellringer has the key and does not come down. He is called Hob. He rings the hours and the Harmony and, I suspect, a number of things that are neither. He has lived at the top of this school for forty years and I have spoken to him twice. Once, I believe, he waved.' A thoughtful pause. 'On Thursday they will open it. I should not like to be in the library when that happens. They will bring a great deal of equipment, and a person with a clipboard, and it will not be a book.'`,
      onEnter: [{ set: "ysolde_tower", val: true }, { xp: 1 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `A man who lives at the top of a building for forty years is a part of the building. It would be like asking the weather to come down for tea.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    shelter: {
      speaker: "ysolde",
      text: `'You would like to stay.' It is not a question; she has the grammar of someone who has made this offer to others before. 'In the Stacks, after nine, when the Bell begins.' A long silence. 'It is the one place in the district where you may keep the day. I have a cot behind Geography. It is not comfortable. It has the advantage of being *real*.' She straightens a pen. 'You will remember what you did today, and tomorrow you will be the only person in the building who does.'\n\nShe adds, very softly: 'You should know what that costs. I have been the only person for thirty-one years. It is quite a *lot of the same face*.'`,
      onEnter: [{ set: "ysolde_shelter", val: true }, { xp: 2 }, { note: "task_stacks", text: `Ysolde has offered a cot behind Geography in the Stacks for the night: the one place the Bell does not reach. If I am inside at nine I will keep the day.` }],
      interjections: [
        { skill: "volition", min: 4, text: `It would be real. You would hold the day. You would also hold what it contains. That is not a mercy, it is a responsibility, and you may choose not to accept it.` },
        { skill: "empathy", min: 4, text: `She wants company. She would never say so. It is the loudest sentence in the room.` }
      ],
      choices: [
        { text: `'Yes. I'll be here at nine.'`, goto: "hub", effects: [{ set: "day2_sheltered", val: true }, { ideo: "undercurrent", n: 1 }] },
        { text: `'I'll think about it.'`, goto: "hub" }
      ]
    }
  }
},

// ============================================================ AMBROSE QUILL
quill: {
  title: "Ambrose Quill",
  start: [
    { cond: "day < 2", node: "d1" },
    { cond: "flag.quill_talked", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    d1: {
      speaker: "quill",
      text: `'Young colleague!' The old man looks up from the closed book with the delight of a lighthouse spotting a boat. 'Do sit, do sit, there is a chair, it is not the Principal's chair, it has all four legs. I was just reminding myself of the Treaty of Reedmarsh. Do you know it? No. Nobody does. It has been *postponed*.' He taps the closed volume. 'Come back when you have the time. I have, as it happens, nothing *but*.'\n\nHe winks. His eyes are very clear and very blue and a long way back.`,
      interjections: [
        { skill: "empathy", min: 3, text: `A lonely man in a rusty suit, delighted to be spoken to. He has been *rested* so long he has forgotten that it was a punishment and thinks of it as a hobby.` },
        { skill: "archive", min: 4, text: `Ambrose Quill, History, 1st Class (Retired). Author of seven books. Six were withdrawn. The seventh was the one they wanted withdrawn. They have not yet decided what to do with the author.` }
      ],
      choices: [{ text: `'Another time, sir.'`, end: true }]
    },
    first: {
      speaker: "quill",
      text: `'Young colleague!' The old man puts down the closed book, which, you notice, he has been annotating with a pencil in a margin that does not exist. 'It is a *great* kindness to be disturbed. I am Ambrose Quill. Doctor, formerly. History, formerly. *Rested*, currently, by the order of a Ministry whose name I helped to draft, which is the sort of thing a fellow should keep to himself.' A wheezing laugh. 'I teach the past to the reading room. It has been *postponed* of late, but I find it very patient.'\n\nHe leans forward, conspiratorial. 'You look like a person who has lost a Tuesday. You are in excellent company. I have lost forty-one.'`,
      onEnter: [{ set: "quill_talked", val: true }, { set: "met_quill", val: true }, { thought: "th_quiet_hours" }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `He apologises with his whole face, constantly, to nobody. It is not a mannerism. It is a *mortgage.*` },
        { skill: "archive", min: 3, text: `*A Ministry whose name I helped to draft.* Notice 77. *YES. I WROTE THAT SENTENCE.* That is him. He is the margin note.` },
        { skill: "rhetoric", min: 3, text: `Beautiful. He has begun with a confession disguised as a joke, so that you may choose whether to hear it. I have used that. It works about one time in two.` },
        { skill: "doublethink", min: 2, text: `An old man. Muddled. A very kind old man with a very slight and very understandable confusion about the past. We should not, I think, be unkind.` }
      ],
      choices: [
        { text: `'Forty-one Tuesdays?'`, goto: "tuesdays" },
        { text: `'What did you draft?'`, goto: "drafted" },
        { text: `'I'd like to hear about the past, sir.'`, goto: "hub" }
      ]
    },
    hub: {
      speaker: "quill",
      text: [
        `'Colleague!' Quill lifts his pencil as if to conduct. 'You find me in a mood to lecture. I'm *always* in a mood to lecture. It is only the audiences that vary.'`,
        `The old historian peers over his spectacles with an expression of grave, mischievous benevolence. 'Ask, ask. History is a very forgiving subject. It has had to be.'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `The closed book under his hand is warm. Not from sunlight. From being held.` },
        { skill: "instinct", min: 3, text: `The boy at the next table keeps looking over at the old man's papers, and at *you*, and then back at his essay. A mouse with a pen.` }
      ],
      choices: [
        { text: `'Tell me about the Cinder Winter.'`, goto: "cinder", cond: "!flag.quill_cinder" },
        { text: `'The Ministry. What did you actually write?'`, goto: "drafted", cond: "!flag.quill_drafted" },
        { text: `'Your notes were taken. I think I know where they are.'`, goto: "notes", cond: "flag.ysolde_quill_hint && !flag.quill_notes_returned && !flag.quill_notes_asked" },
        { text: `[Return Quill's lecture notes.]`, goto: "notes_back", cond: "has('quill_notes') && !flag.quill_notes_returned" },
        { text: `'Would you sign a reader's slip for the Stacks?'`, goto: "slip", cond: "flag.ysolde_stacks_asked && !flag.stacks_slip" },
        { text: `'The book. *The Quiet Hours*. You still have a copy.'`, goto: "book", cond: "flag.quill_drafted && !has('banned_book') && !flag.quill_gave_book" },
        { text: `'Do you know Inspector Voss?'`, goto: "voss", cond: "day >= 2 && !flag.quill_voss" },
        { text: `[Take his history test.]`, goto: "quiz", cond: "!flag.quill_quiz_done" },
        { text: `'Thank you, Doctor Quill.'`, end: true }
      ]
    },
    tuesdays: {
      speaker: "quill",
      text: `'Forty-one,' he says, with the air of a man naming his children. 'Not *lost*. I do not lose them; I *count* them. A Tuesday is never entirely wiped. The Harmony is a very *good* instrument but it is a very blunt one. What it takes is the *sense* of the day, not its *date*. You know it happened, you just do not know *what*.' He taps a thin finger on the table. 'So I keep a chronology. A list of *the days I should know and do not.* It runs to forty-one entries in twelve years. Do you know what that means, if the Harmony were once a week?'\n\nHe waits. 'It is not once a week.' His voice goes soft. 'It is *every night.* And I only notice the ones I wrote down.'`,
      onEnter: [{ set: "quill_tuesdays", val: true }, { xp: 2 }, { thought: "th_second_day" }],
      interjections: [
        { skill: "dialectics", min: 3, text: `Premise: he can count the days he cannot remember. Premise: he has only counted forty-one. Conclusion: he has forgotten every *other* day, and cannot know how many that is. The argument is airtight and the room is cold.` },
        { skill: "archive", min: 3, text: `A *list of days you should know and don't*. It is the most beautiful document I can think of. It has no content. It is nothing but edges.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    drafted: {
      speaker: "quill",
      text: `He looks at the closed book for a long time. 'It was a *good* idea,' he says, at last, very quietly. 'You must understand that. After the Cinder Winter, when every second household had denounced the other half, and the cellars were full, I wrote a paper. *The Quiet Hours: A Philosophy of Merciful Forgetting.* The proposal was a single night, once a decade, in which the whole country would be given leave to forget what it had done to itself. A national mercy. A *reconciliation by amnesia.*' He lifts his hand. 'They took the second half out. The *once a decade* and the *leave.* They kept the *forgetting.*'\n\nHe looks at you. 'I was thirty-one. I thought I was drafting a lullaby.'`,
      onEnter: [{ set: "quill_drafted", val: true }, { xp: 4 }, { thought: "th_quiet_hours" }, { note: "task_stacks", text: `Quill wrote 'The Quiet Hours' as a proposal for one night of national forgetting once a decade, after the Cinder Winter. The Ministry kept the forgetting and dropped the 'once a decade' and the 'leave'.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `He is not asking for forgiveness. He is asking for a witness. That is a different and more difficult request.` },
        { skill: "dialectics", min: 4, text: `A mercy that is compulsory, nightly and unannounced is not a mercy. It is a procedure. The error lay in the second clause. It always does.` },
        { skill: "rhetoric", min: 3, text: `*A national mercy.* What a fine phrase. I would have given anything for it. That is the problem with fine phrases: they do not care who uses them.` },
        { skill: "the_grey", min: 3, text: `The Cinder Winter. I remember it. Concrete never forgets a freeze. The whole of this city was a cold, hard thing that year.` }
      ],
      choices: [
        { text: `'It wasn't a lullaby. But it wasn't only your fault.'`, goto: "hub", effects: [{ morale: 1 }, { xp: 1 }, { set: "quill_forgiven", val: true }] },
        { text: `'You wrote the sentence on Notice 77.'`, goto: "notice77", cond: "flag.d_board_quiet" },
        { text: `'People are still being wiped because of you.'`, goto: "hard", effects: [{ morale: -1 }] }
      ]
    },
    notice77: {
      speaker: "quill",
      text: `'You've seen it.' He closes his eyes. 'On the third-floor board. I went up with a pencil, at night, in the winter, to write *forgive me* in the margin. A lunatic thing to do. A fellow of sixty in carpet-slippers on a dormitory landing at one in the morning. I had thought no one would ever read it.' His hand trembles around the pencil. 'It has been there nine years. Not one student has crossed it out. That is the thing I cannot stop thinking. They've all *read* it. They've all left it be.'\n\nHe opens his eyes. 'I do not know whether that is a forgiveness or a sort of *shrug*.'`,
      onEnter: [{ xp: 2 }, { set: "quill_notice77", val: true }],
      choices: [{ text: `'It's a forgiveness. Mostly.'`, goto: "hub", effects: [{ morale: 1 }] }, { text: `'I think it's a shrug.'`, goto: "hub" }]
    },
    hard: {
      speaker: "quill",
      text: `'Yes.' The word comes out with no resistance in it whatever. 'Yes, they are. And a great many were wiped *before* because of me, and a great many after, and I should like it on the record that I knew.' He sits very straight. 'I should like it on the record that I have thought of nothing else for twelve years. It does not help. It is not meant to.' A long breath. 'Thank you. It is a great relief to be told the truth by a child. Do you know, no adult has done it?'\n\nHe smiles, unsteadily. 'I am going to be very *difficult* about it for the next hour. Do not take it personally.'`,
      onEnter: [{ xp: 1 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    cinder: {
      speaker: "quill",
      text: `'The Cinder Winter.' He settles back, the pencil like a baton. 'Eighteen years ago. A winter so cold that the coal ran out in November and the *informing* began in December. A neighbour reported a neighbour for burning a chair; the neighbour reported a cousin for burning *another* chair; in six weeks there was not a household in District Nine that did not have a man *fewer* than at the start of the winter, and a *name* on a list they could not explain.' His voice is a lecturer's, level and dry, and underneath it is a very long silence. 'And in the spring, everybody was so *ashamed.* Of the chairs. Of the lists. Of each other.'\n\nHe turns the closed book over in his hands. 'That is when we reached for forgetting. Not in malice. In a very *exhausted shame.*'`,
      onEnter: [{ set: "quill_cinder", val: true }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `A winter of burned chairs and informing. A country so ashamed that it asked to be anaesthetised. That is a human thing. It is a very human thing, and that is why it cannot be forgiven.` },
        { skill: "solidarity", min: 3, text: `Eighteen years. Some of us were born into the spring after. We have never had a winter that was our own.` },
        { skill: "rote", min: 3, text: `THE CINDER WINTER: A PERIOD OF EXCEPTIONAL WEATHER. NO FURTHER INFORMATION IS REQUIRED. NO FURTHER INFORMATION IS AVAILABLE.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    notes: {
      speaker: "quill",
      text: `'My *chronology*?' He sits bolt upright, spectacles askew. 'My dear colleague, if you could. Forty-one years of dates, in my own hand, corrected, annotated, cross-referenced, thrice-struck, the *only* surviving edition. It was on this table on Tuesday and *then* on Tuesday it was *not.* I assumed the Ministry, naturally. They are the sort of people who would steal a chronology.' He lowers his voice. 'But then I noticed the boy.'\n\nHe does not look at the boy. He is looking, very carefully, at his own hands. 'He writes with my *commas*. I would know my commas anywhere. I have been defending them for forty years.'`,
      onEnter: [{ set: "quill_notes_asked", val: true }, { xp: 1 }, { note: "task_stacks", text: `Quill wants his chronology back. He recognises his own commas in Corvin Hale's essay.` }],
      choices: [{ text: `'I'll get them back for you.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }]
    },
    notes_back: {
      speaker: "quill",
      text: `He receives the pages as another man might receive a sleeping infant. He does not look at them for a long moment. Then he takes up the top sheet, holds it to the light, and mouths a single date. 'Yes,' he says. 'Yes. *That* is correct.' His whole face loosens. 'Thank you, colleague. You have restored to me the single greatest private grievance of my life.'\n\nHe smooths the sheets flat and, after a moment's struggle with a drawer, finds a bundle of small slips, pale green, printed READER'S AUTHORISATION. He signs one with a flourish like a bad cough. 'There,' he says. 'A teacher of standing. Whatever *that* is worth, it is yours.'`,
      onEnter: [{ take: "quill_notes" }, { set: "quill_notes_returned", val: true }, { set: "stacks_slip", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }, { note: "task_stacks", text: `Returned Quill's chronology. He signed my Reader's Authorisation slip: a signature from a teacher of standing.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `He is not crying over the pages. He is crying over the *commas.* A person's whole self can live in a punctuation mark.` },
        { skill: "archive", min: 3, text: `Form 12-A, Reader's Authorisation (Withdrawn Collection). One signature required; the signatory is held responsible for any consequence of the reading. He did not hesitate. He did not read the footnote.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    slip: {
      speaker: "quill",
      text: `'A slip!' He is delighted and then, in an instant, wary, as an old man is wary of a gift. 'My dear colleague. I would sign *anything* for you. I am afraid I have a habit of signing things and being told afterwards what they were.' He folds his hands. 'The thing is, I have not got a *reason.* My reasons are in my chronology, which is not in my possession.' He gestures at the boy at the next table. 'Return that, and I will sign you a slip for *Mars*.'`,
      onEnter: [{ xp: 1 }],
      choices: [
        { text: `[Persuade him: sign now, I'll fetch the notes.]`, check: { skill: "rhetoric", diff: 12, id: "quill_slip_rhetoric", white: true, pass: "slip_ok", fail: "slip_fail" } },
        { text: `'Then I'll fetch the notes first.'`, goto: "hub" }
      ]
    },
    slip_ok: {
      speaker: "quill",
      text: `'You are a persuasive child,' says Quill, uncapping a fountain pen with a *pop*. 'It is a regrettable quality in a person under sixty.' He signs the slip with a flourish, blows on it, and hands it across. 'On the understanding that you bring me my notes. I am trusting you. It is an extraordinary sensation. I had quite forgotten it.'\n\nHe watches you with something that is not quite hope and is not quite regret. 'Don't let me down, colleague. I have so very few Tuesdays left.'`,
      onEnter: [{ set: "stacks_slip", val: true }, { xp: 2 }, { set: "quill_trusts_you", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    slip_fail: {
      speaker: "quill",
      text: `'No, no. A very elegant argument, and quite unsound.' He taps the blotter. 'I have heard Rhetoric before. I *taught* it, in the Second Form. A man who signs a slip on a promise is a man who has already signed away his notes.' A kindly shake of the head. 'Bring me the pages, colleague. I shall be here. I have, as I say, nothing but time.'`,
      onEnter: [{ morale: -1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    book: {
      speaker: "quill",
      text: `He looks at you very steadily. 'Ah.' The pencil goes still. 'You know. Of course you do. Ysolde has told you, or the board, or the walls.' He draws up his chair. 'It is a very dangerous thing to give a person a book. It is the most intimate transfer that exists. It tells them what you thought, in a language you chose.' He opens his jacket and from an inside pocket takes a slim volume wrapped in brown paper, marked in ink ORTHODOXY (VOL. VI): 'UNITY OF THE CITIZEN'. 'It is only the cover that is Orthodoxy. Inside, it is the thing I regret *most* and am *proudest* of.'\n\n'On one condition,' he says. 'Read it *all.* Not for the facts. For the sentences. Find the one I would give anything to take back.'`,
      choices: [
        { text: `'I'll read all of it.'`, goto: "book_give", effects: [{ give: "banned_book" }, { set: "quill_gave_book", val: true }, { xp: 3 }, { toast: "Received: The Quiet Hours" }] },
        { text: `'Not yet. I'm not ready for it.'`, goto: "hub" }
      ]
    },
    book_give: {
      speaker: "narrator",
      text: `The book is small and warm and slightly damp, as if it had been held in a very anxious hand for a very long time. On the flyleaf, a dedication in a younger hand: *For the winter. For the ones who didn't get to be sorry.* On the next page, a diagram: a wheel with seven spokes, labelled in a neat italic, *The Seven Quiet Hours, 21:00–04:00*, and at the hub, in a tiny, angry block capital, a word added in a later pen: *OFF.*\n\nQuill does not look at you as you turn it over. 'Page forty-one,' he says, to the window. 'The footnote. That is where it begins to go wrong.'`,
      onEnter: [{ thought: "th_quiet_hours" }, { set: "quill_book_read", val: true }, { xp: 2 }, { note: "task_stacks", text: `Read Quill's banned book, The Quiet Hours. A wheel of seven Quiet Hours, 21:00-04:00. Page 41, the footnote: where it begins to go wrong.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    voss: {
      speaker: "quill",
      text: `The pencil falls. It rolls across the table and off the edge and neither of you moves to pick it up. 'Hale Voss,' says Quill. 'Hale. Of course. He came in at eight o'clock this morning and stood at the end of the table for a very long time. Do you know, I did not recognise him? And then I did.' A tremor. 'A boy in the Second Form, twenty years ago. Quiet. Careful. A paper boat in every margin. He asked me once, at the end of a lesson, *Sir, what if a person wanted to remember something on purpose?* And I gave him an A, God forgive me, for the *wrong* reason.'\n\n'He looked at me this morning,' he says, 'and he said *Professor*. And I could see in his eyes that he had no idea why he had said it.'`,
      onEnter: [{ set: "quill_voss", val: true }, { xp: 3 }, { thought: "th_inspector_charm" }, { note: "task_voss", text: `Quill taught Hale Voss twenty years ago: a quiet boy who drew paper boats in the margins and asked 'what if a person wanted to remember something on purpose?' This morning Voss said 'Professor' and didn't know why.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 4, text: `The boat. The boy. The question. The man in the black car folds boats because a boy once wanted to remember. You can feel the shape of a hole in him that has been *tended*.` },
        { skill: "deduction", min: 3, text: `Twenty years ago a boy who asked about remembering on purpose. Today the Ministry's officer who comes to make people forget. It is the same person. It has to be the same person. What happened between the two?` },
        { skill: "archive", min: 4, text: `A man is said to have been 'wiped' if his recollection of a specified period has been reduced below recognition. A man who has been wiped *four* times has nothing to do with his past but guess. Voss, H., Field Officer. The file is thicker than the others. It is, interestingly, thicker at the *beginning.*` }
      ],
      choices: [{ text: `'Do you think he's a good man, Doctor?'`, goto: "voss2" }]
    },
    voss2: {
      speaker: "quill",
      text: `'A *good* man.' He sits back. The spectacles catch the lamp. 'I do not think such a thing exists, colleague, as a good man. There are men who do good things for a very long time and are never found out. Hale was not a bad boy. He was *careful*, which in this country is almost the same.' A pause. 'He is the sort of man who will be very kind to you, and at the end of it will do exactly what he was sent to do, and be sad for a week.' He picks up the fallen pencil. 'I should like you to be very careful with him. I should also like you to be kind. I do not think I can have both, and I think I am asking for both.'`,
      onEnter: [{ xp: 2 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    quiz: {
      speaker: "quill",
      text: `'A test!' He claps his hands. 'The first in eleven years. I shall be fair. I shall be a *monster.* Question the first: in the Year of Steady Hands, the Warden's Father unveiled a statue. Of whom?' He peers at you over his spectacles. 'And be cautious. It is a trick question, because the correct answer is a lie, and the true answer is a crime.'`,
      choices: [
        { text: `[The true answer. Say it out loud.]`, check: { skill: "archive", diff: 9, id: "quill_quiz_archive", white: true, pass: "quiz_ok", fail: "quiz_fail" } },
        { text: `[The official answer, recited with perfect conviction.]`, check: { skill: "rote", diff: 7, id: "quill_quiz_rote", white: true, pass: "quiz_rote", fail: "quiz_fail" } },
        { text: `[Refuse to answer a trick question on principle.]`, check: { skill: "dialectics", diff: 10, id: "quill_quiz_dialectics", white: true, pass: "quiz_ok", fail: "quiz_fail" } }
      ]
    },
    quiz_ok: {
      speaker: "quill",
      text: `'*Himself!*' He leaps up and sits down again in a manner that suggests his knees are a separate nation. 'The Warden's Father unveiled a statue *of himself*, in the Year of Steady Hands, having first, it was said, had the sculptor *retired.* It was a perfect piece of modesty: a man erecting a monument to the only reliable source for the monument.' He beams. 'You are the first student in twenty years to say it without looking round the room. Full marks. I give you an A, for the *right* reason.'\n\nHe looks, for a second, almost young.`,
      onEnter: [{ set: "quill_quiz_done", val: true }, { xp: 3 }, { morale: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    quiz_rote: {
      speaker: "quill",
      text: `'THE STATUE OF THE WARDEN'S FATHER WAS UNVEILED BY THE WARDEN IN HONOUR OF HIS FATHER, A MAN OF STEADY HANDS AND STEADFAST VISION.' It comes out perfectly, in a voice you did not know you owned. Quill listens with his head cocked, nodding. 'Immaculate,' he says. 'Word for word. It is, of course, a *lie*. But a lie delivered with such *sincerity* is a very pure form of art.' He writes something on a slip, blows on it. 'B-plus. For the lie. I take half a mark off for the *joy.*'`,
      onEnter: [{ set: "quill_quiz_done", val: true }, { xp: 1 }, { surv: -1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    quiz_fail: {
      speaker: "quill",
      text: `'Oh dear.' He sounds genuinely sorry. 'An F. I am so *sorry.* I do dislike giving them, but it is a duty.' He writes it on a slip, folds it very small, and puts it in his breast pocket, where, you suspect, a thousand others rest. 'It is very hard to answer a trick question. I have been wrong in front of the Ministry *twice.* The first time cost me a book. The second, a career.' He pats your hand. 'Try again, if you like. Failing is a *lecture of its own.*'`,
      onEnter: [{ set: "quill_quiz_done", val: true }, { morale: -1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    }
  }
},

// ============================================================ CORVIN HALE
corvin: {
  title: "Corvin Hale",
  start: [
    { cond: "day < 2", node: "d1" },
    { cond: "flag.corvin_talked", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    d1: {
      speaker: "corvin",
      text: `'*Halt* and *state your purpose,*' says the boy at the reading table, without raising his eyes from a sheet of foolscap. 'The library is a place of *Order.*' He underlines something with a quick, vicious stroke. 'I am Cadet-Aspirant (Provisional, Third Rank, Pending) Corvin Hale, and I am in the *act* of composing a document of *national significance.* Interruption is a form of treason.' A sniff. 'A *minor* form.' His pin is on upside down. 'Also, if you are looking for the lavatory, it is *not* here.'\n\nHe goes back to the essay. His ears have turned a bright, resigned red.`,
      interjections: [
        { skill: "charm", min: 3, text: `A fifteen-year-old in an ill-fitting soul. Do not laugh; do not smile; do not blink too much. Find the door in the pomposity and wait for it to open.` },
        { skill: "empathy", min: 3, text: `The pin is on upside down. He pinned it in the dark, alone, in the dormitory, and was too proud to ask anyone to check.` }
      ],
      choices: [{ text: `'No lavatory. Understood.'`, end: true }]
    },
    first: {
      speaker: "corvin",
      text: `'*Halt,*' says Corvin Hale, and rises, which is a mistake, because the table is a little too close and the foolscap flutters to the floor. 'State your *purpose.* The library is a place of *Order,* and I am in the act of composing a document of *national significance.*' He retrieves the page with the enormous dignity of the humiliated. 'Cadet-Aspirant (Provisional, Third Rank, Pending) Corvin Hale. You have the honour, if you wish to call it that, of addressing the future Vanguard Sergeant of this establishment.'\n\nHis pin is on upside down. His collar is two sizes too stiff. The essay on the table is titled THE DUTY OF VIGILANCE and, beneath it, in a smaller hand, *(DRAFT FOUR)*. There are six crossed-out titles above it.`,
      onEnter: [{ set: "corvin_talked", val: true }, { set: "met_corvin", val: true }, { task: "task_corvin", state: "active" }, { note: "task_corvin", text: `Corvin Hale, Vanguard hopeful, is writing an initiation essay, 'The Duty of Vigilance' (draft four, six crossed-out titles). He wants it ready by evening.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `Six crossed-out titles. A boy who has been trying to be a certain kind of person for so long that he has outgrown three drafts of it.` },
        { skill: "deduction", min: 3, text: `The prose on the page is *not* his. It is too good in the third paragraph and too bad in the second. Somebody else's commas. Somebody *older.*` },
        { skill: "authority", min: 3, text: `A BOY WITH A PIN AND A PEN. HE HAS BEEN WAITING HIS WHOLE LIFE FOR SOMEBODY TO SAY *AT EASE.* DO NOT SAY IT. NOT YET.` },
        { skill: "doublethink", min: 2, text: `A fine young man. An example to the others. Applaud him, friend. It is such a *comfort* to be applauded, and he has so little of it.` }
      ],
      choices: [
        { text: `'What's the essay for?'`, goto: "essay" },
        { text: `'Your pin is upside down.'`, goto: "pin" },
        { text: `'At ease, Cadet.'`, goto: "at_ease", effects: [{ ideo: "vanguard", n: 1 }] }
      ]
    },
    pin: {
      speaker: "corvin",
      text: `He looks down at it. For a moment his whole face goes through the stages of a very small catastrophe. 'It is *not,*' he says. 'It is *ornamental.* It is a *modified* orientation.' He turns it, with fingers that shake, to the right way up, and straightens his collar, and puts his chin out. 'It is a thing I am *testing.* For the *Vanguard.*' A sniff. 'Thank you,' he adds, very low. 'Nobody tells you. They just look.'`,
      onEnter: [{ xp: 1 }, { set: "corvin_pin", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    at_ease: {
      speaker: "corvin",
      text: `He goes slack with such abruptness that you half expect the sound of a loosened string. 'Thank *God,*' he says, and then, instantly, 'I mean, *thank the Warden.*' He sits back down, with a thud. 'Nobody ever says it. They all say *Halt.* I am so tired of *halting.*' He rubs his eyes under his glasses. 'I have been in the Vanguard Reserve for two years and *nobody* has told me I might stand at ease. I thought it was a *trap.*'\n\nHe looks, very briefly, his age.`,
      onEnter: [{ xp: 1 }, { set: "corvin_ease", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    hub: {
      speaker: "corvin",
      text: [
        `'Citizen,' says Corvin, without quite turning, with the studied indifference of a man holding a pen at exactly the right angle. 'State your *business.* Be concise.'`,
        `The boy has acquired a new frown since you last spoke, and a smear of ink on one earlobe. 'I am *extremely* busy being a model of vigilance. What do you want?'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `Under the foolscap, the corner of a second set of papers: foxed, yellow-brown, in a different and rather elderly handwriting. He has covered them with a blotter.` },
        { skill: "instinct", min: 4, text: `He keeps looking at your *pockets.* He is trying to see what you are carrying.` }
      ],
      choices: [
        { text: `'The essay. How's it going?'`, goto: "essay", cond: "!flag.corvin_essay_heard" },
        { text: `[Offer to help with the essay.]`, goto: "help", cond: "flag.corvin_essay_heard && !flag.corvin_essay_done" },
        { text: `[Look at the papers under the blotter.]`, goto: "notes", cond: "flag.corvin_essay_heard && !has('quill_notes') && !flag.quill_notes_returned && !flag.corvin_notes_taken" },
        { text: `'Why do you want to join the Vanguard?'`, goto: "why", cond: "flag.corvin_essay_heard && !flag.corvin_why" },
        { text: `'What do the Vanguard do tonight?'`, goto: "roster", cond: "flag.corvin_ally && !flag.corvin_roster_seen" },
        { text: `'You're writing a very long list of the people around you.' (Notice his notebook.)`, goto: "informer", cond: "flag.corvin_essay_heard && !flag.corvin_informer" },
        { text: `'Never mind, Cadet.'`, end: true }
      ]
    },
    essay: {
      speaker: "corvin",
      text: `'*The Duty of Vigilance.*' He holds up the page, and in his hands it is a flag. 'It is the condition of my *admission.* Every aspirant to the Vanguard Reserve must submit, before the Jubilee, a three-thousand-word essay in which he demonstrates, by *personal example*, the application of Vigilance to *Daily Life.* It is to be read aloud before the Vanguard Sergeant.' His voice goes up half an octave. 'On Thursday. In front of *Rhea Vantage.*' He swallows. 'I have a title. I have an introduction. I have, ah, a *conclusion*, in the sense of a place where one would go.' He gestures at the blank middle. 'It needs a *story.* A thrilling, true, personal story about *vigilance.* I have not *had* one.'\n\nThe paper trembles very slightly in his fist.`,
      onEnter: [{ set: "corvin_essay_heard", val: true }, { xp: 1 }, { note: "task_corvin", text: `Corvin's essay must be read aloud on Thursday before Rhea Vantage. He needs 'a thrilling, true, personal story about vigilance'. He has not had one.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `He is not afraid of the essay. He is afraid of Rhea. Everybody in this building who has to stand in front of that stare feels the same.` },
        { skill: "rhetoric", min: 3, text: `The middle of an essay is where the argument lives. He has outsourced it. I can fill a middle in my sleep. I have filled middles in other people's sleep.` }
      ],
      choices: [
        { text: `[Offer to help.]`, goto: "help" },
        { text: `'I'm sure you'll think of something.'`, goto: "hub" }
      ]
    },
    why: {
      speaker: "corvin",
      text: `'Why?' He puts down the pen. 'Why. Because it is an honour. Because it is *right.* Because the Vanguard maintain Order, and Order is the foundation of the Union, and I am a *stickler.*' It is rehearsed. It has a tune. Then, to his own surprise, he stops and says, quite differently: 'My father was a postal clerk. A good one. In the Cinder Winter somebody wrote a letter about him, and the letter was true, and it was only about *chairs*, and they took him away for six weeks. And he came back and sat at the table and *thanked* them.' He stares at the foolscap. 'A Vanguard family does not get visits. That is all. That is the *whole of my reason.* It is a very bad essay topic.'`,
      onEnter: [{ set: "corvin_why", val: true }, { xp: 3 }, { morale: -1 }, { thought: "th_good_son" }, { note: "task_corvin", text: `Corvin wants the Vanguard because 'a Vanguard family does not get visits'. His father was taken for six weeks after a letter about chairs. He came home and thanked them.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `He is not a fanatic. He is a *hostage*, who has learned to be proud of the uniform of the people holding the other end of the rope.` },
        { skill: "solidarity", min: 3, text: `We take them in this way. Not by force. We take them by making the alternative unbearable.` },
        { skill: "dialectics", min: 3, text: `A boy joins the force that harms his father to keep the force from harming his father. It is a perfectly logical position and it is the engine of the state.` }
      ],
      choices: [
        { text: `'I'm sorry. That's not a bad reason.'`, goto: "hub", effects: [{ xp: 1 }, { set: "corvin_trust", val: true }] },
        { text: `'There are other ways to keep your father safe.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }, { set: "corvin_trust", val: true }] }
      ]
    },
    help: {
      speaker: "corvin",
      text: `'*Help.*' He tries the word as one tries a hot spoon. 'I do not, as a rule, *accept* help. Help is a form of debt. The Vanguard prefers *self-sufficiency* in its cadets.' He looks at the essay, at you, at the essay. 'However. I recognise a *strategic partnership.* You will not *write* it. You will *advise.* And it will be understood that I did the *thinking.*'\n\nHe pushes the foolscap across the table with two fingers, as though it had grown hot. 'The middle. A thrilling story about vigilance. You have until the *Bell.*'`,
      choices: [
        { text: `[Write a speech so persuasive it will convince Rhea herself.]`, check: { skill: "rhetoric", diff: 11, id: "corvin_essay_rhetoric", white: true, pass: "essay_good", fail: "essay_flat" } },
        { text: `[Write it as the State would: seamless, sincere, a masterpiece of belief.]`, check: { skill: "doublethink", diff: 10, id: "corvin_essay_doublethink", white: true, pass: "essay_perfect", fail: "essay_flat" } },
        { text: `[Write it with a hidden acrostic only a careful reader will find.]`, check: { skill: "archive", diff: 12, id: "corvin_essay_archive", white: true, pass: "essay_acrostic", fail: "essay_flat" } },
        { text: `'Do it yourself, Cadet.'`, goto: "hub" }
      ]
    },
    essay_good: {
      speaker: "corvin",
      text: `You write for forty minutes, in a rapid running hand. When you have done, you read it aloud, softly, and Corvin, listening, goes the colour of a boiled sweet. 'That is,' he says, 'that is *very* good.' He takes the page and reads it with his lips moving. 'It has a *rhythm.* It has a *turn.* It says *vigilance is love in a uniform.*' He sets it down with infinite care. 'I could not have written that. I should like it to be known that I *could* have.' He does not smile. He nearly weeps. 'Thank you, comrade.'\n\nHe is, you realise, completely sincere. He believes it. That is the horror and the hope of it.`,
      onEnter: [{ set: "corvin_essay_done", val: true }, { set: "corvin_ally", val: true }, { task: "task_corvin", state: "done" }, { xp: 4 }, { time: 40 }, { ideo: "vanguard", n: 1 }, { note: "task_corvin", text: `Wrote Corvin's essay: 'vigilance is love in a uniform.' He thinks it's wonderful. He's my friend, I think.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    essay_perfect: {
      speaker: "doublethink",
      text: `Doublethink takes the pen the way a master takes a violin. The sentences arrive already agreed with: *To be vigilant is to love the Union more than one loves oneself, and to love oneself exactly as the Union loves one.* It is seamless. It is a work of art. Every clause means two things and neither of them is false. You write the story of a student who notices a stranger, and reports him, and is *thanked*, and finds that gratitude is the single warmest sensation a person can feel.\n\nWhen you read it aloud, Corvin is crying openly. 'That is the *truest* thing I have *ever* heard,' he says.\n\nThe terrible part is that, for the length of the page, so did you.`,
      onEnter: [{ set: "corvin_essay_done", val: true }, { set: "corvin_ally", val: true }, { set: "corvin_essay_perfect", val: true }, { task: "task_corvin", state: "done" }, { xp: 3 }, { time: 40 }, { ideo: "vanguard", n: 2 }, { surv: -4 }, { note: "task_corvin", text: `Wrote Corvin an essay so seamless that I half-believed it myself. He is devoted to me. I am not proud of how easy it was.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    essay_acrostic: {
      speaker: "archive",
      text: `Per Regulation 62(b), a document submitted in honour of the Union may not contain 'any rhetorical device whose intent is to conceal'. An acrostic is, technically, an *ornament.* The first letter of each paragraph, read downward: T. H. E. B. E. L. L. L. I. E. S. You write it in an hour. The prose is immaculate, patriotic, devout; no clerk on Earth would find fault. It simply, to anyone who looks at the left-hand margin, says *the Bell lies.*\n\nCorvin reads it with shining eyes. 'The left margin is very *neat,*' he says. 'I admire the *discipline.*' He has not seen it. He will read it aloud to Rhea Vantage on Thursday.`,
      onEnter: [{ set: "corvin_essay_done", val: true }, { set: "corvin_ally", val: true }, { set: "corvin_essay_acrostic", val: true }, { task: "task_corvin", state: "done" }, { xp: 5 }, { time: 40 }, { ideo: "undercurrent", n: 2 }, { surv: 3 }, { note: "task_corvin", text: `Wrote Corvin's essay with an acrostic in the left margin: THE BELL LIES. He'll read it aloud before Rhea on Thursday. He doesn't know.` }],
      interjections: [
        { skill: "solidarity", min: 3, text: `A message in a margin. A bread-note in prose. We have always known how to hide a thing in plain sight; we simply never had a boy to carry it into the room.` },
        { skill: "volition", min: 4, text: `You have put a boy in danger without telling him. It is a clever act and a quiet cruelty. Remember it, and decide, before Thursday, what you owe him.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    essay_flat: {
      speaker: "corvin",
      text: `You write for forty minutes. When you have finished, Corvin reads it, and slowly folds it, and slowly, quite calmly, puts it to one side. 'It's, ah,' he says. 'It's *competent.*' He does not look up. 'It is *not*, I think, a thing that will make Rhea Vantage feel anything.' He picks up his pen. 'I am sure that is a *virtue.* I shall, ah, take it under advisement.'\n\nHe starts a fifth draft. He does not look at you again.`,
      onEnter: [{ morale: -1 }, { time: 40 }, { set: "corvin_essay_failed", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    notes: {
      speaker: "narrator",
      text: `Under the blotter, a thick bundle of foxed papers in a fine upright hand, with the cheerful marginalia of a lifetime's pedantry. At the head of the first sheet: *CHRONOLOGY OF THE DAYS I SHOULD KNOW AND DO NOT: A. QUILL, DR.* Corvin has copied half of it into his essay, with the care of a monk and the conscience of a magpie. He is, at this moment, looking at the ceiling, with an expression of studied nonchalance.\n\nHe has not yet noticed that you have seen them.`,
      onEnter: [{ set: "corvin_notes_seen", val: true }, { xp: 1 }],
      choices: [
        { text: `[Lift the bundle while he's distracted.]`, check: { skill: "sleight", diff: 11, id: "corvin_notes_sleight", white: false, pass: "notes_ok", fail: "notes_bad" } },
        { text: `[Confront him. 'Those aren't yours.']`, check: { skill: "authority", diff: 10, id: "corvin_notes_authority", white: true, pass: "notes_confront", fail: "notes_bad" } },
        { text: `[Trade: 'I'll write your middle if you give them back.']`, goto: "help", cond: "!flag.corvin_essay_done" },
        { text: `Say nothing. Walk away.`, goto: "hub" }
      ]
    },
    notes_ok: {
      speaker: "sleight",
      text: `Ten cheerful thieves in a trench coat. He leans to sharpen a pencil; the blotter lifts; the bundle goes; the blotter lowers; he looks up and sees nothing but an interested person with a book. The papers weigh almost nothing and are very warm. Forty-one years of dates in your jacket. It is the easiest thing you have stolen all day, and it is the one that feels most like a rescue.`,
      onEnter: [{ give: "quill_notes" }, { set: "corvin_notes_taken", val: true }, { xp: 3 }, { surv: 2 }, { toast: "Received: Quill's Notes" }],
      choices: [{ text: `Slip away.`, goto: "hub" }]
    },
    notes_confront: {
      speaker: "corvin",
      text: `'Those are not yours, Cadet.' You say it with the exact weight of a very small bell. He wilts. It is one of the saddest sights of the morning: a boy in a pin and a collar, caught, and entirely certain that he deserves it. 'I *borrowed* them,' he whispers. 'For *research.* I was going to put them back.' He slides the papers across the table, face down, as one slides an unwelcome bill. 'Please don't tell the Lieutenant. Please don't tell *Rhea.*'\n\nYou take the pages. He does not look at you.`,
      onEnter: [{ give: "quill_notes" }, { set: "corvin_notes_taken", val: true }, { set: "corvin_owes", val: true }, { xp: 3 }, { toast: "Received: Quill's Notes" }],
      choices: [{ text: `'I won't tell.'`, goto: "hub", effects: [{ set: "corvin_trust", val: true }, { ideo: "undercurrent", n: 1 }] }, { text: `'I'll think about it.'`, goto: "hub", effects: [{ surv: -1 }] }]
    },
    notes_bad: {
      speaker: "corvin",
      text: `'*Hands,*' says Corvin Hale, very quietly, very sharply, and the whole of the library hears it. His own hand is flat on the blotter. 'Those are *Vanguard papers.* Confidential. Under *review.*' His voice shakes with the effort of being terrifying. 'I shall be *noting* this.' He picks up a small black notebook, and writes in it with a precise, unfriendly hand. You do not need to see what.\n\nAcross the library Ysolde's stamp comes down once, very softly, on nothing.`,
      onEnter: [{ surv: 6 }, { morale: -1 }, { set: "corvin_noted_you", val: true }],
      choices: [{ text: `Back off.`, goto: "hub" }]
    },
    informer: {
      speaker: "corvin",
      text: `He covers the notebook with his forearm so fast that the pen goes flying. 'It is a *ledger of Observations,*' he says, high and fast. 'It is mandatory for all cadets. *Vigilance* requires *record.* It does not *mean* anything. I merely note. I note *everything.* It is the *job.*' He retrieves the pen from the floor and, with the air of a boy who has had a bad day, adds: 'You were in it. On Tuesday. *Ten past one, stage door, hurrying.* I did not *report* it.' A hard swallow. 'I *wanted* to. I have the form. I took it out and I put it back four times.'\n\nHe looks at you, appalled at himself. 'I do not know why I did not.'`,
      onEnter: [{ set: "corvin_informer", val: true }, { xp: 3 }, { thought: "th_informer_in_me" }, { note: "task_yesterday", text: `Corvin's Observations notebook has me at the stage door, ten past one on Tuesday, hurrying. He took the report form out four times and put it back.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `He did not report you because he could not make himself. That is not weakness. That is a conscience, still working, in the wrong uniform.` },
        { skill: "instinct", min: 3, text: `He will report you eventually. Not out of malice: out of arithmetic. His family needs the credit. Give him a better sum.` }
      ],
      choices: [
        { text: `'Thank you for not reporting me.'`, goto: "hub", effects: [{ set: "corvin_trust", val: true }, { ideo: "undercurrent", n: 1 }] },
        { text: `'You'd better burn the page, Corvin.'`, goto: "hub", effects: [{ surv: -2 }] },
        { text: `'If you do report me, I'll remember.'`, goto: "hub", effects: [{ surv: 3 }, { ideo: "vanguard", n: 1 }] }
      ]
    },
    roster: {
      speaker: "corvin",
      text: `He glances left, then right, like a man crossing a very quiet street. 'The patrol roster,' he says, in a whisper that carries to the back of the stacks. 'It is *confidential.* It is also on my person, in the second pocket, because I am required to memorise it.' He takes a folded sheet out of his blazer, flicks it open, and spreads it flat under his hand. 'Evening patrols. Courtyard at six. Avenue at eight. The Relay *rota*, which is a different sheet, which I was not *meant* to see, but I have *very* sharp eyes.' He lets you look. It takes two minutes. It is, in its way, a complete map of where a person should *not* be.\n\n'I have not shown you this,' says Corvin. 'I have a *terrible* memory.'`,
      onEnter: [{ set: "corvin_roster_seen", val: true }, { xp: 3 }, { note: "task_relay", text: `Corvin showed me the Vanguard's evening patrol roster: Courtyard at six, Avenue at eight, plus the Relay rota. I could give it to Dov to copy.` }],
      interjections: [
        { skill: "archive", min: 3, text: `Vanguard Patrol Roster, District Nine, Revision Seven. Six sentries on the Avenue at eight. Four at the Relay gate. Two at the back gate until eleven. A clean, regular timetable. It would be so easy to move a man on it.` }
      ],
      choices: [{ text: `'Thank you, Corvin.'`, goto: "hub" }]
    }
  }
},

// ============================================================ L_CATALOG
l_catalog: {
  title: "The Card Catalogue",
  start: [{ node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `The catalogue stands in the middle of the library like the pipes of a church organ, three metres of dark oak drawers with brass handles, each with a card-holder bearing a letter, and above them a carved frieze of a bird holding a scroll. Every drawer smells of paper and thumb. There is a pencil on a string and a little pad headed *SUBJECT WANTED*. The bottom three rows have no letters on them at all, and are slightly less polished than the rest, as though they were used more often.\n\nA brass plate reads: *THE COLLECTION IS ARRANGED BY ASSOCIATION. CONSULT THE LIBRARIAN. DO NOT CONSULT YOUR CONSCIENCE.*`,
      voices: 3,
      interjections: [
        { skill: "archive", min: 3, text: `Four hundred and eight drawers. Fifty cards each, on average. That is twenty thousand cards in the visible range. I will be here until the Bell. Please do not disturb me. I may weep.` },
        { skill: "senses", min: 3, text: `The bottom drawers are warm. Not warm like a radiator: warm like a hand has been on them all day. And one handle has been polished by *thumbs*, not by cloths.` },
        { skill: "deduction", min: 4, text: `Three unmarked rows. A different wood, a newer varnish, an extra lock on the lowest. The unlabelled drawers are the ones she has built herself.`, effects: [{ set: "catalog_index_seen", val: true }] }
      ],
      choices: [
        { text: `Search by subject: *Hours, Quiet*.`, goto: "subject", cond: "!flag.stacks_shelfmark" },
        { text: `Try the unmarked bottom drawers.`, goto: "index_gate", cond: "!flag.catalog_index_open" },
        { text: `[Read the cards in the Index.]`, goto: "index_hub", cond: "flag.catalog_index_open" },
        { text: `Step away.`, end: true }
      ]
    },
    subject: {
      speaker: "narrator",
      text: `You pull the drawer marked H. It slides open with an expensive sound, and a smell of old glue rises. *Hours, Canonical. Hours, Church. Hours, Working. Hours, Quiet*: no card. A gap in the alphabet the width of a thumb, where a card has been removed so neatly it left no trace. Ysolde was right: it will not be under what you want. It will be under what it *rhymes* with.\n\nThe pencil on its string waits. The pad says SUBJECT WANTED.`,
      choices: [
        { text: `[Think: what is the *neighbour* of quiet? Work it out.]`, check: { skill: "archive", diff: 9, id: "l_catalog_hours_archive", white: true, pass: "hours_ok", fail: "hours_fail" } },
        { text: `[Look for a pattern in the thumb-wear on the drawers.]`, check: { skill: "senses", diff: 10, id: "l_catalog_hours_senses", white: true, pass: "hours_ok", fail: "hours_fail" } },
        { text: `[Ask the drawer: *Mercy*.]`, check: { skill: "empathy", diff: 9, id: "l_catalog_mercy", white: true, pass: "mercy_ok", fail: "hours_fail" } },
        { text: `Give up for now.`, goto: "look" }
      ]
    },
    hours_ok: {
      speaker: "archive",
      text: `*Hours* is adjacent to *Horticulture*. *Quiet* is the opposite of *Winter* in the library's perverse scheme of rhyme. The card is therefore in the drawer marked HORT. W., under the heading *Winter, Gardens of: A Meditation on Rest and Forgetting in Plant Life*. You find it with a pleasant jolt of vertigo: a yellowed card, in a small neat hand: *HORT.W-0. See: Withdrawn Collection, Sound Archive (shelf 4), Ministry Pamphlets (shelf 9), and the Seventh Volume, p. 41.*\n\nThe shelfmark is HORT.W-0. A nought, as if the Stacks began *before* the beginning.`,
      onEnter: [{ set: "stacks_shelfmark", val: true }, { xp: 3 }, { note: "task_stacks", text: `Found the shelfmark in the catalogue: HORT.W-0, under 'Winter, Gardens of'. Sound Archive on shelf 4, Ministry Pamphlets on shelf 9.` }],
      interjections: [
        { skill: "rote", min: 3, text: `HORT.W-0. HORT.W-0. HORT.W-0. THREE REPETITIONS TO MEMORISE. A FOURTH TO RECITE IN SLEEP.` },
        { skill: "deduction", min: 3, text: `*Seventh Volume, p. 41.* The Quiet Hours. Quill's footnote. He told you where it begins to go wrong. It is in the shelfmark.` }
      ],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    mercy_ok: {
      speaker: "narrator",
      text: `You think of the word *Mercy*, and you open the drawer M, not looking for the subject but for the *place* where it hides. *Mercy, Corporal Works of. Mercy, Quality of. Mercy, Seasons of.* And behind that last card, folded double, filed backward: a tiny slip in Ysolde's hand. *For those who come asking for Mercy: HORT.W-0. Mind the third step.*\n\nShe has left a path for the right sort of question. You do not remember learning how to ask it.`,
      onEnter: [{ set: "stacks_shelfmark", val: true }, { xp: 3 }, { note: "task_stacks", text: `Found the shelfmark under 'Mercy': HORT.W-0. Ysolde leaves a path for the right sort of question.` }],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    hours_fail: {
      speaker: "narrator",
      text: `You run through the drawers, but the alphabet does not rhyme for you. *Hours*, *Hounds*, *Hours*, *Humility*. A card for *Hush* that says only *see: Silence*. A card for *Silence* that says *see: Hush.* The catalogue has the bleak sense of humour of a very old woman.\n\nSomewhere behind you, a throat is cleared, a short, tactful *ahem.* It is not the librarian. It is a boy with a pin, watching over the top of a foolscap sheet, writing in a small black notebook.`,
      onEnter: [{ surv: 2 }, { morale: -1 }],
      choices: [{ text: `Try something else.`, goto: "subject" }, { text: `Step away.`, goto: "look" }]
    },
    index_gate: {
      speaker: "narrator",
      text: `The bottom drawers have no labels, no handles polished by thumbs that belong to the public, and one small brass escutcheon in the form of a keyhole. They are locked. Not heavily: with the particular lock a librarian would choose, a lock that signals *please* more than it signals *no*. Through the gap at the top of the nearest, a card edge, a corner in violet ink, a line of tiny upright script.`,
      choices: [
        { text: `[Pick the little lock.]`, check: { skill: "slip", diff: 10, id: "l_catalog_pick", white: false, pass: "index_open", fail: "index_caught" } },
        { text: `'Ysolde said I might look.'`, goto: "index_open", cond: "flag.ysolde_index_allowed || flag.ysolde_trust" },
        { text: `Leave it.`, goto: "look" }
      ]
    },
    index_caught: {
      speaker: "narrator",
      text: `The pick turns, and a tiny click goes through the library like a gunshot in a church. From the desk, with no change in her expression whatsoever, comes the word *Shh*. It is not a rebuke. It is a promise: that she has seen, and will remember, and will be waiting.\n\nThe lock does not open.`,
      onEnter: [{ surv: 4 }, { morale: -1 }],
      choices: [{ text: `Retreat.`, goto: "look" }]
    },
    index_open: {
      speaker: "narrator",
      text: `The lowest drawer slides out with a sigh. Inside, packed upright and in perfect order, are cards: not white but cream, not printed but handwritten, in Ysolde's tiny violet script. Each carries a name, a date, and a line or two of observation. They are alphabetical. They go back, drawer after drawer, to the Year of the Long Frost. At the front, on a divider, a single line: *THE INDEX OF THOSE WHO WERE NOT ALLOWED TO CARRY IT OUT.*\n\nThere are, by a rough count, nine hundred of them. You find, with a feeling like falling, that you can read your own name from here.`,
      onEnter: [{ set: "catalog_index_open", val: true }, { xp: 4 }, { thought: "th_chosen_family" }, { note: "task_stacks", text: `The unmarked bottom drawers of the catalogue are Ysolde's Index: nine hundred handwritten cards, a name, a date, and what each person was not allowed to carry out of the Bell.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `Nine hundred names. Each one is a person who has been forgotten by the state and remembered by one woman in a navy cardigan. This is the most important document in the district and it has a hairpin in it.` },
        { skill: "solidarity", min: 3, text: `We. Nine hundred of us. Written down, in violet, so that the next one of us to wake up empty can find the shape of the hole.` },
        { skill: "archive", min: 3, text: `Cross-referenced. *Annotated.* A system of indexing that would make the Ministry weep with envy, and which exists only because one person could not bear to stop.` }
      ],
      choices: [{ text: `Read the cards.`, goto: "index_hub" }]
    },
    index_hub: {
      speaker: "narrator",
      text: `The cards are in order. You may take only a few: a person with a clipboard might be here at any moment. Each name is a door. You can only open some of them.`,
      choices: [
        { text: `Look under {name}.`, goto: "c_self", cond: "!flag.catalog_self" },
        { text: `Look under KELL.`, goto: "c_kell", cond: "!flag.catalog_kell" },
        { text: `Look under PRITT.`, goto: "c_irris", cond: "flag.matron_irris_known && !flag.catalog_irris_card" },
        { text: `Look under TOBAR.`, goto: "c_tobar", cond: "(flag.bronka_tobar || flag.d_board_ads) && !flag.catalog_tobar" },
        { text: `Look under VOSS.`, goto: "c_voss", cond: "day >= 2 && (flag.quill_voss || flag.d_board_voss) && !flag.catalog_voss" },
        { text: `Look under BRANNIC.`, goto: "c_osk", cond: "flag.osk_seen_you && !flag.catalog_osk" },
        { text: `Close the drawer.`, goto: "look" }
      ]
    },
    c_self: {
      speaker: "narrator",
      text: `A card, newer than the others, in violet ink: *{name}. Student, third form. Static-resistant (ringing, from childhood; cause unknown). Tuesday, 23:40–02:15: carried. Does not remember. Is not meant to. Asked on Monday: 'Keep me instead.' Answered: 'I cannot.' Instruction left for the next reader: LET THEM FIND IT. DO NOT TELL THEM WHAT IT IS.*\n\nThere is a pin-hole where the card was once clipped to something. You are being, you realise, protected from yourself, by yourself, by a woman in a cardigan, in violet.`,
      onEnter: [{ set: "catalog_self", val: true }, { xp: 3 }, { thought: "th_ghost_of_yesterday" }],
      interjections: [
        { skill: "volition", min: 4, text: `Let them find it. Do not tell them what it is. Do you hear that? Two people who love you decided you would rather discover your own life than inherit it. They may be right.` },
        { skill: "empathy", min: 3, text: `*Keep me instead.* You said it to a woman you barely knew. It is the most trusting sentence you have ever uttered and you have no memory of uttering it.` }
      ],
      choices: [{ text: `Back to the drawer.`, goto: "index_hub" }]
    },
    c_kell: {
      speaker: "narrator",
      text: `*KELL, Vasha. Lieutenant, Eastern Brigades (ret.). Reedmarsh Pass, three days. Nights: the song. Does not know the song. Recognises it on hearing. Reports on students to the District Office. Reason: a promised knee. Symptoms: hums in the shower, then stops herself. Instruction for the next reader: BE KIND. SHE IS ALREADY DOING IT TO HERSELF.*\n\nYou read it twice. It is a very small, very exact kindness, in violet, in pencil, about a woman who does not know she has been seen.`,
      onEnter: [{ set: "catalog_kell", val: true }, { xp: 2 }, { set: "vasha_card_read", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `Be kind. She is already doing it to herself. Someone watched her carry the whole thing and wrote that down so another person would not have to guess.` }
      ],
      choices: [{ text: `Back to the drawer.`, goto: "index_hub" }]
    },
    c_irris: {
      speaker: "narrator",
      text: `The P drawer is thick with names. You find it in the middle, like a pressed flower. *PRITT, Irris. Age 12. Dormitory Three, front bunk by the door. 'Transferred' (Form 41-C), second week of term, for chalk on a wall: a drawing of a house. Reading Room, Ward 3. Static-resistant; remembers the house. Asks for her aunt. Asks to be told if the house is still there.*\n\nThere is a last line, in a different pen, added later, very small: *The house is still there. Matron has kept the wall.*`,
      onEnter: [{ set: "catalog_irris_card", val: true }, { xp: 4 }, { morale: 1 }, { note: "task_matron", text: `Ysolde's Index has a card for Irris Pritt: Reading Room, Ward 3, Static-resistant, remembers the house, asks for her aunt. I should tell the Matron.` }],
      interjections: [
        { skill: "solidarity", min: 2, text: `*The house is still there.* Somebody wrote that to a child who may never read it. Do you know how many things a person will do for a stranger because there is nobody else to do it?` },
        { skill: "empathy", min: 4, text: `Go and tell her. Do it now, before you think about what it will cost her to hear.` }
      ],
      choices: [{ text: `Back to the drawer.`, goto: "index_hub" }]
    },
    c_tobar: {
      speaker: "narrator",
      text: `*TOBAR, (cook's husband; surname withheld on request). Choir, tenor. Reading Room, six weeks ('corrective'). Returned. Does not recognise his wife. Hums when folding sheet-music: the LANTERN SONG, nine verses, of which he has five. The remainder is in the Withdrawn Collection: HORT.W-0, Sound Archive, shelf 4, cylinder 17. Instruction for the next reader: THE COOK KNOWS. THE COOK DOES NOT KNOW SHE KNOWS.*\n\nSomewhere behind the paper a very small wind is moving: a choir, in the wax, in the dark, waiting for a needle.`,
      onEnter: [{ set: "catalog_tobar", val: true }, { xp: 3 }, { set: "lantern_score_known", val: true }, { note: "task_choir2", text: `Ysolde's Index: Tobar (Bronka's husband) hums the Lantern Song but has only five verses. The other four are in the Withdrawn Collection: Sound Archive, shelf 4, cylinder 17.` }, { note: "task_stacks", text: `The full Lantern Song (nine verses) is on wax cylinder 17, Sound Archive, shelf 4, in the Stacks.` }],
      interjections: [
        { skill: "solidarity", min: 3, text: `Five of nine. A song that has been passed hand to hand like a burning coal, and each hand has dropped four verses. The rest were in the Stacks. They were always in the Stacks.` },
        { skill: "senses", min: 4, text: `*Cylinder 17.* You can almost hear it: a thin warm scratch, a woman's voice, folding sheet-music.` }
      ],
      choices: [{ text: `Back to the drawer.`, goto: "index_hub" }]
    },
    c_voss: {
      speaker: "narrator",
      text: `The V drawer is thin. A single card is filed under VOSS, and it is the oldest in the Index: soft, brown at the edges, in a hand slightly more cramped than Ysolde's present one. *VOSS, Hale. Field Officer (Ministry of Quiet Hours), formerly Student, Second Form. Wiped: four times, by his own request. Each time returns to the same question: 'Did I have a daughter?' Each time is told: 'No record.' Each time does not believe it. Folds paper boats. Does not know why.*\n\nBelow, in a newer pen: *He is the one who asks every morning. He is also the one who makes the morning come. Do not hate him. Do not trust him. Both are required.*`,
      onEnter: [{ set: "catalog_voss", val: true }, { xp: 5 }, { thought: "th_inspector_charm" }, { note: "task_voss", text: `Ysolde's oldest card: VOSS, Hale. Wiped four times by his own request; each time asks 'Did I have a daughter?' Is told 'No record.' Folds paper boats. 'Do not hate him. Do not trust him. Both are required.'` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 4, text: `*By his own request.* He asked them to take it. Four times. And each time he woke up and asked the same question, because the question is the one thing the Bell cannot reach.` },
        { skill: "dialectics", min: 3, text: `A man requests forgetting to escape a grief, and the forgetting leaves behind the shape of the grief, and he asks to be wiped again. The loop is perfect. It has a daughter in the middle of it.` },
        { skill: "instinct", min: 3, text: `He will not be your enemy. He will not be your friend. He is a hole that walks. Treat him as you would a person standing very close to the edge of a roof.` }
      ],
      choices: [{ text: `Back to the drawer.`, goto: "index_hub" }]
    },
    c_osk: {
      speaker: "narrator",
      text: `*BRANNIC, Osk. Caretaker (31 yrs). Student, this school, 1948 (nine pupils in the form; one survives). Saw the Commissar's death through a keyhole (not the killing; the after). Does not speak of it. Was asked on Tuesday: 'Do you wish to forget?' Replied: 'I wish to *sweep*.' Instruction for the next reader: DO NOT LET THEM MAKE HIM A STORY.*\n\nThe card has been handled more than any other in the drawer. The edges are soft as a glove.`,
      onEnter: [{ set: "catalog_osk", val: true }, { xp: 3 }, { note: "task_osk", text: `Ysolde's Index on Osk: 'Asked: Do you wish to forget? Replied: I wish to sweep. DO NOT LET THEM MAKE HIM A STORY.'` }],
      interjections: [
        { skill: "empathy", min: 3, text: `*I wish to sweep.* He chose the broom over the oblivion. It is the most dignified sentence in the Index.` }
      ],
      choices: [{ text: `Back to the drawer.`, goto: "index_hub" }]
    }
  }
},

// ============================================================ L_STACKS
l_stacks: {
  title: "The Withdrawn Collection",
  start: [{ cond: "flag.library_stacks_open", node: "inside" }, { node: "outside" }],
  nodes: {
    outside: {
      speaker: "narrator",
      text: `A velvet rope on two brass posts, and a card on a string: AUTHORISED READERS. Beyond it, the back stacks go into the dark: shelves, shelves, a corridor of spines. The air that comes out is cooler than the room's, flat and still, with a smell of old glue and felt. It does not have a draught. It has a *depth.*\n\nThe librarian, at her desk, does not look up. Her pen has stopped moving. In a library, that is a sentence.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `That air has not moved in sixty years. It is the stillest air in the district. I find I am a little afraid of it. I am a drizzle. I am not built for stillness.` },
        { skill: "senses", min: 4, text: `Even the sound of your own breath dies a metre in. Felt. Foil. A great weight of paper. A room that has been built to keep one thing out.` }
      ],
      choices: [
        { text: `Ask Ysolde about getting in.`, dialogue: "ysolde" },
        { text: `[Duck under the rope while she turns a page.]`, check: { skill: "slip", diff: 14, id: "l_stacks_sneak", white: false, pass: "sneak_ok", fail: "sneak_bad" } },
        { text: `[Forge Quill's signature on a blank slip.]`, check: { skill: "sleight", diff: 12, id: "l_stacks_forge", white: false, pass: "forge_ok", fail: "forge_bad" }, cond: "!flag.stacks_slip" },
        { text: `Step back from the rope.`, end: true }
      ]
    },
    sneak_ok: {
      speaker: "slip",
      text: `A whisper in the doorframe. *Not yet. Not yet. Now.* The librarian's pen comes down on the exact stroke of a comma; the rope lifts a centimetre under your fingers; the shadow takes you in like water taking a coin. Three paces in, the sound of the library vanishes as if a lid had been shut. It is, instantly, a different country. A corridor of spines. A light you cannot find the source of. A very deep silence.\n\nSomewhere at your back, a pen resumes writing. She knows. She has *decided* not to.`,
      onEnter: [{ set: "library_stacks_open", val: true }, { set: "stacks_sneaked", val: true }, { xp: 4 }, { surv: 5 }, { task: "task_stacks", state: "active" }, { note: "task_stacks", text: `Slipped under the rope into the Forbidden Stacks. Ysolde knows and has chosen not to.` }],
      choices: [{ text: `Go in.`, goto: "inside" }]
    },
    sneak_bad: {
      speaker: "narrator",
      text: `The rope lifts, and a brass post tips. It falls on the parquet with the sound of a small cannon. 'Shh,' says Ysolde, very quietly, very close, and then, with infinite politeness: 'That is a *loan*, I think, that was not authorised.' She does not raise her voice. She lifts the post, and rehangs the rope, and straightens the card. 'You may try again with a signature,' she says. 'In a library, we are very forgiving. We simply *note* it.'\n\nAcross the room, an old man looks up from a closed book. The boy at the next table writes something, very fast.`,
      onEnter: [{ surv: 9 }, { morale: -1 }, { set: "stacks_sneak_failed", val: true }],
      choices: [{ text: `Retreat.`, end: true }]
    },
    forge_ok: {
      speaker: "sleight",
      text: `The old man's flourish is a gift: all curl and cough. Ten cheerful thieves in a trench coat reproduce it on a blank green slip in under four seconds, by the light of a reading lamp, with a pen borrowed from the pencil-string. It is a *very* good *A*. It says *A. Quill, Dr.* and underneath, in the smaller type of the Form, *teacher of standing.* The ink is still wet.\n\nIt is also, you realise, a crime, which is a funny word for something that took four seconds and a little tact.`,
      onEnter: [{ set: "stacks_slip", val: true }, { set: "stacks_slip_forged", val: true }, { xp: 3 }, { surv: 3 }, { note: "task_stacks", text: `Forged Quill's signature on a Reader's Authorisation slip. A very good A.` }],
      choices: [{ text: `Continue.`, end: true }]
    },
    forge_bad: {
      speaker: "narrator",
      text: `The A comes out with a tremor. The curl goes the wrong way. It looks, you realise with a lurch, like a very careful *impression* of an old man's signature, and it is not even close. You crumple the slip into a ball and put it in your cuff. Across the room, at the corner table, an old man has stopped annotating a closed book and is looking, with an expression of grave and tender amusement, directly at your hand.`,
      onEnter: [{ surv: 3 }, { morale: -1 }],
      choices: [{ text: `Retreat.`, end: true }]
    },
    inside: {
      speaker: "narrator",
      text: `The silence is the first thing. Not an absence: a *thickness*, as if someone had wrapped the air in cloth. Your footsteps die at the ball of the foot. The ringing in your ears, which has been a thread of tin since you were six, goes quiet, for the first time in your life. You stand and listen to the place where it used to be.\n\nThe shelves run away into the dark in long straight rows, felt-lined, foil-backed, packed to the ceiling with spines that have lost their titles. A green card on each: WITHDRAWN: FOR THE READER'S OWN PROTECTION. At the far end a single lamp, a cot behind a stack labelled GEOGRAPHY, and a hand-lettered sign, carefully hung: *PLEASE TOUCH.*`,
      onEnter: [{ set: "stacks_entered", val: true }, { xp: 2 }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `The ringing has stopped. You did not know how loud it had been until it went. Do you feel that? That is what quiet is. It is a rather frightening thing.` },
        { skill: "archive", min: 3, text: `THE WITHDRAWN COLLECTION. Sound Archive (shelf 4), Ministry Pamphlets (shelf 9), Atlases (shelf 12), Banned Verse (shelf 15). I can feel my own heartbeat. It is the most beautiful sound I have ever heard. I wish to be buried here.` },
        { skill: "the_grey", min: 3, text: `I cannot get in. The foil keeps me out. It is the first room I have ever been refused. I am, I find, rather impressed.` },
        { skill: "volition", min: 3, text: `The Bell cannot reach you here. That is the first fact. The second is that you are alone with whatever is on these shelves.` }
      ],
      choices: [
        { text: `Shelf 4: the Sound Archive.`, goto: "sound", cond: "!flag.stacks_took_cylinder" },
        { text: `Shelf 4: the cylinder for the Lantern Song.`, goto: "score", cond: "flag.stacks_took_cylinder && !flag.stacks_took_score" },
        { text: `Shelf 9: Ministry Pamphlets.`, goto: "pamphlets", cond: "!flag.stacks_pamphlets" },
        { text: `Shelf 12: Atlases.`, goto: "atlas", cond: "!flag.stacks_atlas" },
        { text: `Shelf 15: Banned Verse.`, goto: "verse", cond: "!flag.stacks_verse" },
        { text: `Sit on the cot behind Geography. Be quiet.`, goto: "cot" },
        { text: `Take stock. Is that everything you came for?`, goto: "done", cond: "flag.stacks_took_cylinder && flag.stacks_took_score && !flag.stacks_done" },
        { text: `Go back out.`, end: true }
      ]
    },
    sound: {
      speaker: "narrator",
      text: `The Sound Archive is a single tall shelf of felt-lined drawers, each holding a row of fat brown wax cylinders in cardboard tubes, with dates and a handful of words on the lid. *Eighth March Parade, Reedmarsh Pass (Official).* *Warden's Fortieth Address, take 11.* *Lullabies, Provincial (withdrawn).* *A Woman Folding Sheet Music (unsigned, dated the Cinder Winter).* And at the bottom, in a dusty open box, two dozen *blanks*, new, unused, the pale yellow of old cheese, with a card: FOR THE SOUND ARCHIVE. TO BE USED WHEN SOMETHING IS WORTH KEEPING.\n\nOne is missing. You know where it went. You took it on Monday.`,
      onEnter: [{ give: "cylinder_blank" }, { set: "stacks_took_cylinder", val: true }, { xp: 3 }, { toast: "Received: Blank Cylinder" }, { note: "task_counter", text: `Took a blank wax cylinder from the Sound Archive in the Stacks. Ilsabet will need it for the counter-tone.` }],
      interjections: [
        { skill: "senses", min: 4, text: `Wax has a scent. Honey, rosin, a hint of tallow. It is the smell of something that was once alive and is willing to be again.` },
        { skill: "aim", min: 3, text: `Cylinder: eleven centimetres. A steady hand. A steady needle. One take. You would get one.` }
      ],
      choices: [{ text: `Continue.`, goto: "inside" }]
    },
    score: {
      speaker: "narrator",
      text: `Cylinder 17 is in a drawer labelled, in Ysolde's violet, *A Woman Folding Sheet Music.* Beside it, a score, handwritten on yellowing manuscript paper, with a pencil note at the head: *The Lantern Song. Nine verses. Folk, provincial, banned 14 yrs. Reason given: 'Sentiment.' Stored here by a person who could not bear it to be lost.* You turn the pages. Nine verses, each in four-part harmony, with a dozen alternative modulations in the margin in a different, tiny, loving hand.\n\nOn the last page, written under verse nine, in the unmistakable cramped capitals of someone who had to hurry: *If the whole choir sings the last line at once, the Bell will not be able to answer it.*`,
      onEnter: [{ give: "choir_score" }, { set: "stacks_took_score", val: true }, { set: "lantern_score_found", val: true }, { xp: 4 }, { thought: "th_wake_tone" }, { toast: "Received: Choir Score" }, { note: "task_choir2", text: `Found the full Lantern Song (nine verses, four-part score) in the Stacks. A margin note says: 'If the whole choir sings the last line at once, the Bell will not be able to answer it.' Fenwick needs this.` }],
      voices: 3,
      interjections: [
        { skill: "solidarity", min: 3, text: `Nine verses. We have been singing five. The last four were in the dark, waiting for a choir to be brave enough to need them.` },
        { skill: "rote", min: 3, text: `LIGHT A LANTERN IN THE HALL, LIGHT ANOTHER FOR THE WALL. THE SIXTH VERSE I DO NOT KNOW. THE SIXTH VERSE I WILL NOW KNOW. I AM *OVERJOYED*.` },
        { skill: "archive", min: 4, text: `'The Bell will not be able to answer it.' That is not a musical instruction. That is a *technical specification.* Somebody who understood the carrier wrote this, in the margin of a lullaby.` }
      ],
      choices: [{ text: `Continue.`, goto: "inside" }]
    },
    pamphlets: {
      speaker: "narrator",
      text: `Shelf nine is a long run of thin stapled booklets in dull blue, all alike, each stamped MINISTRY OF QUIET HOURS (FIELD OFFICE): INTERNAL. *Pedagogic Harmony: A Guide for Headteachers.* *The Quiet Hours: Operational Notes.* *Relay Station Number Four: Standing Orders for Staff* (with a floor plan on the back cover, folded, with a cross where the tape vault is). *Grand Harmony: A Preliminary Memorandum.* The last is the thinnest. It has a single paragraph: *The Grand Harmony will be transmitted once, on the master tape, at the Jubilee. Duration: ninety minutes. Effect: all personnel resident in the District will experience recall-fade across the preceding seventy-two hours. The Ministry anticipates no complaint. The affected will, of course, not be aware of it.*`,
      onEnter: [{ set: "stacks_pamphlets", val: true }, { set: "stacks_relay_plan", val: true }, { xp: 4 }, { thought: "th_grand_harmony" }, { note: "task_relay", text: `Ministry pamphlet in the Stacks: 'Relay Station Number Four: Standing Orders', with a floor plan (cross marks the tape vault).` }, { note: "task_tape", text: `'Grand Harmony: A Preliminary Memorandum': transmitted once, on the master tape, at the Jubilee; ninety minutes; all personnel in the District lose the preceding seventy-two hours.` }],
      voices: 3,
      interjections: [
        { skill: "archive", min: 3, text: `Seventy-two hours. Tuesday, Wednesday, Thursday. Everything you have done this week, the whole of it, in a single ninety-minute sleeve. 'The affected will not be aware of it.' It is the most efficient sentence ever written.` },
        { skill: "dialectics", min: 3, text: `A person cannot object to what they will not know has happened. Therefore no one has been wronged. It is the complete moral philosophy of the Union in a paragraph.` },
        { skill: "authority", min: 3, text: `NINETY MINUTES. TWENTY HUNDRED. THE ROOM IS A STAGE. THE STAGE IS THE DISTRICT. THIS IS NOT A BROADCAST; IT IS A *SIEGE.*` },
        { skill: "deduction", min: 4, text: `The cross on the plan: the tape vault, east wall. The relay is a single concrete box. One door. One back gate. One roof. A person who studied this plan for twenty minutes could walk the whole building in the dark.` }
      ],
      choices: [{ text: `Continue.`, goto: "inside" }]
    },
    atlas: {
      speaker: "narrator",
      text: `Shelf twelve holds the atlases. The Union fills the front half of each, in fresh colour. In the back half, where the other countries live, the colour is old, and has been painted over, and painted over again, until some of the borders have the texture of scar tissue. In the largest atlas, on the last page but one, a country has been gently erased and relabelled in a careful tiny hand: *ELSEWHERE.* Beneath it, in pencil: *The tram goes to the Ring. Past the Ring, on foot, eleven days. There are people there. They have *chairs*.*\n\nSomebody has drawn a very small arrow from the school to the edge of the page, and, at the arrow's end, a stick-figure with a bag.`,
      onEnter: [{ set: "stacks_atlas", val: true }, { xp: 3 }, { thought: "th_tram_wires" }, { note: "task_exodus", text: `An atlas in the Stacks: 'ELSEWHERE'. In pencil: 'The tram goes to the Ring. Past the Ring, on foot, eleven days. There are people there. They have chairs.'` }],
      interjections: [
        { skill: "empathy", min: 3, text: `*They have chairs.* It is the most hopeful sentence you have read all week. It has no ideology. It is only a description of somewhere you could sit down.` },
        { skill: "stamina", min: 4, text: `Eleven days on foot. I can do eleven days on foot. I can do twelve, if there is bread.` }
      ],
      choices: [{ text: `Continue.`, goto: "inside" }]
    },
    verse: {
      speaker: "narrator",
      text: `Shelf fifteen is thin, an entire shelf of poems that the Ministry could not decide whether to burn. Each has a green slip: WITHDRAWN: SENTIMENT. You take one down at random: a pamphlet, folded, of eleven lines, written by a woman who signed herself only *A MOTHER.* It is called *To the Girl With the Chalk.* It is eleven lines long and it is about a girl who draws a little house on a wall and is told it is not allowed. The last line reads: *Draw it anyway. Draw it where they will have to walk past.*\n\nThere is a single, uncanny pencil mark beside it, in a hand you know: *Matron P. read this. Wept. Replaced it.*`,
      onEnter: [{ set: "stacks_verse", val: true }, { xp: 2 }, { thought: "th_forbidden_page" }, { set: "stacks_house_poem", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: `*Draw it anyway.* The Matron has read this. She keeps a wall unpainted in the dormitory because of eleven lines of verse.` }
      ],
      choices: [{ text: `Continue.`, goto: "inside" }]
    },
    cot: {
      speaker: "narrator",
      text: `The cot behind Geography is narrow, with a grey blanket, a reading lamp, a tin mug, and, on the pillow, a note in violet ink: *If you lie here at nine, you will remember tomorrow. That is the whole of what I have to offer. It is more than the Ministry does.* You sit. The silence closes round you, and for the first time since you woke on a stage, you hear nothing at all, not even the ringing. It is the loneliest and most generous thing you have ever felt. You could stay.\n\nBut it is only a place. It will still be here at nine. The question is whether you will.`,
      onEnter: [{ set: "stacks_cot_seen", val: true }, { time: 5 }, { morale: 1 }],
      interjections: [
        { skill: "volition", min: 3, text: `Rest for a moment. You are allowed. A person who never rests is not brave, they are only *unplugged*.` },
        { skill: "solidarity", min: 3, text: `We have all lain on cots like this. In basements. In cellars. In the backs of buses. Rest is a kind of defiance, if you do it on purpose.` }
      ],
      choices: [{ text: `Get up.`, goto: "inside" }]
    },
    done: {
      speaker: "narrator",
      text: `A wax cylinder in one pocket and a bundle of manuscript paper in the other. You have what you came for. What you did not come for is also with you: a plan of a concrete box, a sentence about seventy-two hours, an atlas with a country on its last page labelled *Elsewhere*. The Stacks, which were forbidden on Tuesday, are only a room on Wednesday. The books are only books. It is the people who made them dangerous.\n\nAt the end of the aisle, in the lamp-light, Ysolde stands with her hands folded, saying nothing. She does not need to.`,
      onEnter: [{ set: "stacks_done", val: true }, { task: "task_stacks", state: "done" }, { xp: 5 }, { morale: 2 }],
      choices: [{ text: `Go back out.`, end: true }]
    }
  }
},

// ============================================================ L_TABLE
l_table: {
  title: "The Reading Table",
  start: [{ node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `A long oak reading table, scarred and stained and inked, with a green-shaded lamp at each end and a runner of cracked leather down the middle. Generations of children have carved their initials into it with compasses and pen-nibs. In the middle, a spread of papers has been left by someone in a hurry: a pile of Ministry circulars, a sheet of foolscap with the first three paragraphs of an essay, a pair of spectacles with one arm missing, and, running along the floor under the table in a long careful loop, a flex of wire in a pair of carpet-slippers.\n\nThe wire goes to Table Four. At Table Four a girl is not looking at it.`,
      voices: 3,
      interjections: [
        { skill: "senses", min: 3, text: `Candle-wax, pencil lead, old leather. Under it, a faint hot-metal tang. A soldering iron has been used within the hour, somewhere near the window.` },
        { skill: "slip", min: 3, text: `The wire in the slippers. If you step on it, it hums. If you step over it, you are an accomplice. Choose.` },
        { skill: "deduction", min: 4, text: `The spectacles: Quill's, with the arm missing, left on the Vanguard side of the table. He has been trying to read the essay across the gap. He is going blind a little in that eye.` }
      ],
      choices: [
        { text: `Read the Ministry circulars.`, goto: "circulars", cond: "!flag.l_table_circulars" },
        { text: `Look at the carved initials.`, goto: "initials", cond: "!flag.l_table_initials" },
        { text: `Read the first paragraphs of the essay.`, goto: "essay", cond: "!flag.l_table_essay" },
        { text: `Step over the wire to Table Four.`, goto: "wire", cond: "!flag.l_table_wire" },
        { text: `Leave.`, end: true }
      ]
    },
    circulars: {
      speaker: "narrator",
      text: `A thin pile of blue-and-white paper, each stamped with a number. *Circular 109: Preparation of Schools for the Jubilee. Circular 110: Care of the Warden's Portrait (Annual). Circular 111: On the Prevention of Idleness by Architecture (Revised). Circular 112: Pedagogic Harmony, Special Extended Form.* This last has been annotated in pencil by someone who has read it very carefully: *The Tower Array will carry the master tape at 20:00. The Bellringer will strike the Great Bell on the final beat. The Bell is the carrier: the sound that makes the rest of it go in.* An arrow, circled twice, points at *the final beat.* Beside it a single pencilled word: *HERE.*`,
      onEnter: [{ set: "l_table_circulars", val: true }, { xp: 3 }, { thought: "th_grand_harmony" }, { note: "task_jubilee", text: `Circular 112: the Tower Array will carry the master tape at 20:00; the Bellringer strikes the Great Bell on the final beat. An unknown annotator: 'The Bell is the carrier. HERE.'` }],
      interjections: [
        { skill: "dialectics", min: 3, text: `If the Bell is the carrier, then the Bell is the weak point. If the Bell is the weak point, then somebody who rings it differently changes the whole message. That somebody lives at the top of a tower and does not speak.` },
        { skill: "archive", min: 4, text: `Circular 111 is the ramp denial. Ilsabet's. It was in the same pile. Somebody has put them side by side. Not the Ministry: somebody who *wanted you to see them together.*` }
      ],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    initials: {
      speaker: "narrator",
      text: `A century of children on a single table. *R.V. + ?* *D.K. WAS HERE. OWES.* *LET ME OUT.* *1951: T.W. (HE KNOWS).* *W. + CORPORAL FLUFF.* In the leather at the centre, in newer, deeper gouges: *O.B. + A BROOM, 1948.* The O is a circle, the B a pair of ears, and the broom a straight line with a flourish at the bottom. It was cut, by the depth of it, with great seriousness by a child who intended to be remembered for something.\n\nYou find yourself putting your thumb in the O. It fits exactly.`,
      onEnter: [{ set: "l_table_initials", val: true }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `*O.B. + A BROOM.* He was a student here. He carved the thing he would become before he knew he would become it. It is a very sad, very dignified, very small act of prophecy.` },
        { skill: "solidarity", min: 2, text: `We all leave a mark. In compass-point, in pencil, in thumbs on a handle. The district is nothing but a long argument in graffiti about who was here.` },
        { skill: "the_grey", min: 3, text: `I know that table. I am the grain under the varnish. They carved into me. I did not mind. A person who leaves a mark is a person who intended to stay.` }
      ],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    essay: {
      speaker: "narrator",
      text: `The first three paragraphs of THE DUTY OF VIGILANCE (DRAFT FOUR). *It is the privilege of the young to observe, and the duty of the observant to report.* *A citizen who sees and does not say is a window painted shut.* *Let us therefore, at all hours, be a window.* It is competent, ardent and inert, a boy's idea of what an essay sounds like. Halfway down the second page the prose grows suddenly fluent: a paragraph about the Cinder Winter of astonishing delicacy, in a voice that does not belong to a fifteen-year-old. *There is a kind of silence that is not peace but pressure.* You have read that sentence before. It was on a card in a drawer.`,
      onEnter: [{ set: "l_table_essay", val: true }, { xp: 1 }, { set: "corvin_notes_seen", val: true }],
      interjections: [
        { skill: "deduction", min: 3, text: `The fluent paragraph is Quill's. The comma-splice in the third line is Quill's. Corvin has transcribed it, with the faithful clumsiness of a boy copying a dead language.` }
      ],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    wire: {
      speaker: "narrator",
      text: `You step over the slippers, over the wire, to Table Four, where a girl in an orange cardigan is reading a book that is upside down. She does not look up. 'If you've come to tell me the cable is a trip hazard,' says Ilsabet Orrin, in the rapid murmur of a person speaking under a scream, 'I know. It is also the only thing in this room that works.' She taps the underside of the table. A tiny glass tube glows blue in a nest of copper. 'I'm *recording* the Relay's carrier off the tram wires. Every night, between two and three. If I get a clean pass, I can start to build the counter.'\n\nShe glances up, finally. 'Have you got the tube? Or the cylinder? Or anything I can *solder*?'`,
      onEnter: [{ set: "l_table_wire", val: true }, { xp: 2 }],
      choices: [{ text: `Talk to Ilsabet properly.`, dialogue: "ilsabet" }, { text: `'Not yet. Keep recording.'`, goto: "look" }]
    }
  }
},

// ============================================================ L_GLOBE
l_globe: {
  title: "The Globe",
  start: [{ cond: "flag.globe_mina_found", node: "empty" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: `A school globe the size of a pumpkin, on a brass stand, its varnish gone brown. The Union, fresh and green, takes up most of the northern hemisphere; the other continents huddle in the south like the leftovers of a very large dinner. A strip of brass at the equator, loose at one end, has been pressed back down so many times by so many thumbs that it has acquired a groove. A card on the stand says PLEASE DO NOT TOUCH THE GLOBE. Under it, in a different hand: *(THIS MEANS YOU. — Y.C.)*\n\nIt is, you realise, the most handled object in the room.`,
      interjections: [
        { skill: "archive", min: 3, text: `Terrestrial Globe, Type 11. Union: 41% of the surface. Original proportion in the Year of Steady Hands: 23%. The difference is the fresh paint.` },
        { skill: "instinct", min: 3, text: `A loose strip of metal on a toy. Somebody has been in this globe. Someone small, very patient, who needed somewhere to put a thing.` }
      ],
      choices: [
        { text: `Spin it.`, goto: "spin" },
        { text: `Look for Reedmarsh Pass.`, goto: "reedmarsh", cond: "!flag.globe_reedmarsh" },
        { text: `Look for the part where it says *Elsewhere*.`, goto: "elsewhere", cond: "!flag.globe_elsewhere" },
        { text: `[Open the loose brass strip.]`, goto: "hollow", cond: "!flag.globe_hollow_tried" },
        { text: `Leave it.`, end: true }
      ]
    },
    spin: {
      speaker: "narrator",
      text: `The globe turns with a whisper of dry bearings, and the Union goes by, a long green smear, and then a stretch of old blue, and then the Union again. It is a very small world to hold up on a stand. The Warden's name has been stamped on the north pole in gilt, and the meridian lines run to it like a cobweb to a spider. For a moment you feel the entire country whirling gently under your hand, as heavy and as weightless as a thought.\n\nThen the strip at the equator pings, and a hair of rust drifts onto the table.`,
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "the_grey", min: 3, text: `A globe is a very comforting thing to spin. It is a world that does what you tell it. It is all the power most people will ever hold, and it is made of papier-mâché.` }
      ],
      choices: [{ text: `Stop it.`, goto: "look" }]
    },
    reedmarsh: {
      speaker: "narrator",
      text: `You search the north-east border with a fingertip, where the Union rubs against its neighbour in a smudge of brown hills. There is no Reedmarsh. There is a slight roughness in the paper, a place where the varnish has been sanded and re-laid, and under the new coat, if you tilt your head to the lamp, the faint ghost of a name: *REEDMARSH PASS (14 DAYS).* It has been painted out with the same green as the rest of the Union. It has been made, by a very patient hand, into a field.\n\nA lieutenant with a bad knee could find her way to that exact spot in the dark, blindfolded, by the tremor in her hand.`,
      onEnter: [{ set: "globe_reedmarsh", val: true }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `A pass where half a battalion did not come down. They have painted it as a meadow. It is the most beautiful lie on the table.` },
        { skill: "rote", min: 2, text: `REEDMARSH PASS. 14 DAYS. A GLORIOUS RESISTANCE. FINAL CASUALTIES: NOT AVAILABLE FOR PUBLIC DISCLOSURE. THE GRASS IS VERY GREEN THIS TIME OF YEAR.` }
      ],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    elsewhere: {
      speaker: "narrator",
      text: `You rotate the globe to the south and east, where a very pale country huddles under a coat of old blue. In the bottom corner of the Pacific is a tiny, hand-lettered label, in violet, glued down with a dot of paste. *ELSEWHERE.* It has no border. It has no colour. It is the only part of the globe that has not been repainted, because nobody has ever thought it worth the paint.\n\nSomeone has put a pin in it. The pin has a very small flag, no bigger than a grain of rice, made of red thread. You do not know who put it there. You find that you would like to meet them.`,
      onEnter: [{ set: "globe_elsewhere", val: true }, { xp: 2 }, { note: "task_exodus", text: `The globe has a label at the bottom corner: ELSEWHERE, with a pin and a tiny red thread flag. Somebody wants to go.` }],
      interjections: [
        { skill: "solidarity", min: 3, text: `A pin in a pale corner. A child's pin. A small red flag for a place that has no name, so that someone would know where to look.` }
      ],
      choices: [{ text: `Continue.`, goto: "look" }]
    },
    hollow: {
      speaker: "narrator",
      text: `The brass strip at the equator comes away at the loose end like the lid of a tin. Behind it, a cavity: the globe is hollow, in the way a school globe is, and the hollow has been *used.* You see, in the dim, a gleam of silver, a fold of paper. Your fingertips are too thick to reach in.`,
      onEnter: [{ set: "globe_hollow_tried", val: true }],
      choices: [
        { text: `[Slip two fingers in and draw it out.]`, check: { skill: "sleight", diff: 10, id: "l_globe_sleight", white: false, pass: "hollow_ok", fail: "hollow_bad" } },
        { text: `[Tilt the globe so it slides out.]`, check: { skill: "aim", diff: 11, id: "l_globe_aim", white: false, pass: "hollow_ok", fail: "hollow_bad" } },
        { text: `Put the strip back.`, goto: "look" }
      ]
    },
    hollow_ok: {
      speaker: "narrator",
      text: `It comes out in your palm: a folded square of tissue and a tiny silver tram-token, the kind with a pencil dot on the rim. You smooth the tissue. A looping, determined hand, a child's, in pencil: *To whoever finds the globe. I got through. The tram goes further than you think. I left this so somebody would know. Tell D. the dot means YES. — M.*\n\nThe M is shaped like a pair of wings. There is, at the bottom, a tiny drawing of a tram with legs.`,
      onEnter: [{ set: "globe_mina_found", val: true }, { give: "tram_token" }, { xp: 5 }, { morale: 2 }, { thought: "th_tram_wires" }, { note: "task_dov", text: `Found Mina's note in the hollow globe: 'I got through. Tell D. the dot means YES.' I must tell Dov.` }, { toast: "Received: Tram Token" }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `*The dot means yes.* She left it in a globe, in a library, for a boy who sells passes and cannot sleep. It is the longest postal route in the district and it took one child nine weeks.` },
        { skill: "solidarity", min: 2, text: `We got one through. One. And she turned back, in a note, to tell the ones who stayed. That is the most beautiful thing a runaway has ever done.` },
        { skill: "the_grey", min: 3, text: `A globe full of hope. It is only a hollow thing. It has always been a hollow thing. That is the point of a globe.` }
      ],
      choices: [{ text: `Put the strip back. Carry the news.`, goto: "empty" }]
    },
    hollow_bad: {
      speaker: "narrator",
      text: `The strip slips and the globe spins, and the hollow tilts, and something inside slides *away*, a small silver slither, out of reach. The whole assembly squeals on its bearings. Across the room Ysolde's pen stops. She looks at the globe. She looks at you. She says, very gently, 'Shh', and returns to her card. You have been *noted.* You have not been stopped.`,
      onEnter: [{ surv: 3 }, { morale: -1 }],
      choices: [{ text: `Put the strip back.`, goto: "look" }]
    },
    empty: {
      speaker: "narrator",
      text: `The globe turns easily under your hand. The strip at the equator sits flat. The hollow is empty, and a little warm, as though it had just been held. You find you are smiling, at a school globe, in a library, for no reason you could give to a clerk.`,
      choices: [{ text: `Leave it.`, end: true }]
    }
  }
},

// ============================================================ VASHA, DAY 2
vasha_d2: {
  title: "Lieutenant Kell",
  start: [
    { cond: "flag.vasha_report_burned && flag.vasha_d2_met", node: "hub_burned" },
    { cond: "flag.vasha_d2_met", node: "hub" },
    { cond: "flag.verdict_good_student || flag.osk_scapegoat", node: "open_good" },
    { cond: "flag.verdict_static", node: "open_static" },
    { cond: "flag.verdict_ledger", node: "open_ledger" },
    { cond: "flag.verdict_quiet", node: "open_quiet" },
    { node: "open_other" }
  ],
  nodes: {
    open_good: {
      speaker: "vasha",
      text: `She is leaning on the end of a table in the Ration Hall with an unlit cigarette in her fingers, and when she sees you she does not straighten. 'The caretaker,' she says. 'Brannic. They fetched him from his stove at eleven last night. I was told to witness the statement. I witnessed it.' She turns the cigarette over. 'He asked if he could finish the stove first. I said yes, because it was the only thing I was permitted to say.' A pause like a held breath. 'And you have a brass Warden on your coat. Don't tell me it was complicated. I know that it was. I was *there*. I want to be sure you know it too.'\n\nHer eyes are red-rimmed and perfectly steady. She is giving you the whole of her disgust and the whole of her sympathy, and she has made no attempt to separate them.`,
      onEnter: [{ set: "vasha_d2_met", val: true }, { surv: -1 }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She is as ashamed as you are. She is simply the one who said it aloud. That is the difference between you, and she does not want to be better for it.` },
        { skill: "doublethink", min: 2, text: `A good student. A pillar of the school. Don't let her make you feel unclean, friend. She signed the paper herself.` },
        { skill: "volition", min: 3, text: `She is not accusing you. She is offering you the one thing nobody else on this floor will: a witness who will not pretend.` }
      ],
      choices: [
        { text: `'I did what I had to.'`, goto: "voss_news", effects: [{ ideo: "vanguard", n: 1 }, { set: "vasha_ashamed", val: true }] },
        { text: `'I know. I can't stop knowing.'`, goto: "good_honest", effects: [{ morale: -1 }] },
        { text: `'Then you signed it too.'`, goto: "good_hard", effects: [{ xp: 1 }] }
      ]
    },
    good_honest: {
      speaker: "vasha",
      text: `'No,' she says. 'You can't. That's the cost of the thing: you only get to be sorry for what you remember.' She finally lights the cigarette. 'Tonight the Bell will take some of it. Not all. A bit of the *shape.* You'll wake with a stone in your boot you can't find.' Her mouth does a small crooked thing. 'I've been waking with that stone for twelve years. Come and find me when you want company with it. It's a very small club.'\n\nShe means it, and that is more terrible than if she hadn't.`,
      onEnter: [{ xp: 2 }, { set: "vasha_stone", val: true }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Continue.`, goto: "voss_news" }]
    },
    good_hard: {
      speaker: "vasha",
      text: `'Yes.' It comes out flat as a drill. 'I signed it. I held the pen they gave me. I thought of the Reedmarsh Pass the entire time, which is a thing I do. Do you know what the first rule of soldiering is, kid? It is that somebody else is always holding the *other end.*' She looks at the hand that signed. 'I am not clean. I am only *not pretending.* There is a world of difference and it is exactly one inch wide.'\n\nShe puts the unlit cigarette behind her ear. 'Let's both be unclean together, then. It saves on soap.'`,
      onEnter: [{ xp: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Continue.`, goto: "voss_news" }]
    },
    open_static: {
      speaker: "vasha",
      text: `'*There* you are.' She has a cup of tea in each hand and gives you one without ceremony. 'Sit. Drink. You look like a man who spent last night being read aloud.' There is a smudge under each of her eyes like a thumb-print. 'Nine minutes, twelve seconds. I counted. I was in the Hall doorway with a sentry on each arm, and I mouthed the numbers, and they thought I was praying.' She sits. 'Sixteen of the first-years woke up saying *ledger.* The Principal has had two of them taken to the infirmary, and the other fourteen are in my gym, doing star-jumps, so nobody can ask them anything.' A flicker. 'It's the best thing I've ever done with a P.E. lesson.'\n\nShe lifts her cup, as a soldier lifts a cup at a wake. 'To the unauthorised.'`,
      onEnter: [{ set: "vasha_d2_met", val: true }, { morale: 1 }],
      voices: 3,
      interjections: [
        { skill: "solidarity", min: 3, text: `Fourteen children in a gym, jumping, so that nobody can make them stop saying a word. It is the most Undercurrent thing I have ever heard of and it was a PE lesson.` },
        { skill: "empathy", min: 3, text: `She mouthed the numbers in the doorway. She was part of it. She was never in the cell and she was never out of the room.` },
        { skill: "authority", min: 3, text: `A LIEUTENANT HAS RAISED A CUP. THIS IS A SALUTE. RETURN IT.` }
      ],
      choices: [
        { text: `'To the unauthorised.'`, goto: "voss_news", effects: [{ ideo: "undercurrent", n: 1 }, { morale: 1 }] },
        { text: `'Is the Principal furious?'`, goto: "static_marr" }
      ]
    },
    static_marr: {
      speaker: "vasha",
      text: `'The Principal,' says Vasha, 'is the colour of a candle.' She sets her cup down very carefully. 'She did not shout. She does not shout. She spent eleven minutes on the telephone with a man who kept saying *regrettable*, and at the end she said, in a voice I have never heard from her, *I will deal with it myself.* And then she vouched for you.' A long, odd look. 'She vouched for you to *save* you, or to *keep* you. I haven't made up my mind which. I'd treat her as a woman who has just lost a bet with herself.'`,
      onEnter: [{ xp: 1 }, { note: "task_voss", text: `Vasha says Marr spent eleven minutes on the phone with a man who said 'regrettable', then said 'I will deal with it myself' and vouched for me. To save or to keep? Vasha can't tell.` }],
      choices: [{ text: `Continue.`, goto: "voss_news" }]
    },
    open_ledger: {
      speaker: "vasha",
      text: `'Morning.' She does not look at you. She is looking, with great interest, at the soup. 'Slept well? I did. I'm told I snored. There was a *very* odd smell in the stairwell last night: bread. Caraway. It followed me up three flights.' She finally glances over, with an expression of infinite innocence. 'I've the strangest feeling that I've been up and about on someone else's business and nobody told me what it was. I'm not going to write that down.'\n\nShe lowers her voice to the pitch of a conspirator being careful. 'I've not been asked to say where *you* went at twenty to six. I've not been asked. I want that understood. I've never been so grateful not to be asked something.'`,
      onEnter: [{ set: "vasha_d2_met", val: true }, { surv: -2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She knows something. Not what. She is delighted to be spared the rest. A soldier who has learned to enjoy not being told.` },
        { skill: "instinct", min: 3, text: `Bread. Caraway. In the stairwell. She followed the smell of Bronka's notes up three flights and did not look for the source.` }
      ],
      choices: [{ text: `'Good. Keep not asking.'`, goto: "voss_news", effects: [{ ideo: "undercurrent", n: 1 }] }, { text: `'Lieutenant, I can't tell you.'`, goto: "voss_news" }]
    },
    open_quiet: {
      speaker: "vasha",
      text: `'Morning, kid.' She looks at you for a long time, the way one looks at a patient one has been told to expect to recover. 'You went home. Via the gate. Via the tea.' She says it neither as a charge nor a comfort. 'I saw you go. I was at the window of the gym, and I thought: *good.* And then I thought: *oh, no.* And I could not tell which was the one I meant.' She turns the unlit cigarette in her fingers. 'You look rested. That's the worst of it. You look, I think, the way I did the first winter. It's a very good look and it takes about twelve years to rub off.'\n\nHer voice goes gentle and quite hopeless. 'I'm not angry. I'd have done the same. I *did* the same, for a decade.'`,
      onEnter: [{ set: "vasha_d2_met", val: true }, { morale: -1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is not scolding. She is grieving, gently, in advance, for a thing she knows how to miss.` },
        { skill: "the_grey", min: 3, text: `The tea does that to a face. It smooths. I should know: I have been smoothing the same faces for sixty years.` }
      ],
      choices: [{ text: `'I don't remember why I should feel bad.'`, goto: "quiet_honest" }, { text: `'I'm fine, Lieutenant.'`, goto: "voss_news", effects: [{ ideo: "quiet", n: 1 }] }]
    },
    quiet_honest: {
      speaker: "vasha",
      text: `'No,' she says. 'You wouldn't.' She sits, which is a concession. 'That's what it's for. It takes the *why* and leaves you the *weight.*' She taps her sternum. 'I'll tell you how to hold it. You don't try to remember. You try to *notice.* Something will itch. A name. A smell. You don't scratch it. You write it on the inside of your wrist, small, in biro, before the Bell. In the morning there's a word on your wrist and you wonder who put it there.' She almost smiles. 'That's the whole of my method. It is not much of a method. It has kept me alive.'`,
      onEnter: [{ xp: 2 }, { set: "vasha_method", val: true }],
      choices: [{ text: `Continue.`, goto: "voss_news" }]
    },
    open_other: {
      speaker: "vasha",
      text: `'Kid.' She is at the long table in the Ration Hall with her notebook open on her knee and a stub of pencil, and she shuts it, slowly, as you approach, with the practised courtesy of someone closing a door they hope you didn't hear open. 'You look like something the cat refused.' A flash of her old dry humour. 'Sit. There's a heel of bread that's nobody's.' She pushes it across. 'It's Wednesday. There's an Inspector. There's a body that isn't. I'm told to be pleased. I'm *relieved*, which is a different thing and probably also a crime.'\n\nShe taps the closed notebook with her pencil. 'He wants these. Daily. He said *please.*'`,
      onEnter: [{ set: "vasha_d2_met", val: true }],
      interjections: [
        { skill: "instinct", min: 3, text: `He said *please.* A man who says please to a soldier is a man who has decided she will say yes.` },
        { skill: "empathy", min: 3, text: `She taps the notebook the way a person taps a sore tooth to find out if it still hurts.` }
      ],
      choices: [{ text: `'He wants the notebook?'`, goto: "voss_news" }]
    },
    voss_news: {
      speaker: "vasha",
      text: `'He sent for me at six this morning.' She says it carefully, with a little drag, like a person describing a dentist. 'Before the shutters were up. A small room off the Principal's office. A kettle. He made *me* tea. He remembered that I take it without.' She rubs her knee. 'He talked about Reedmarsh. He knew the numbers, kid. The *right* numbers, the ones that aren't published. Fourteen days, nine hundred and six dead, a hundred and two who came down. He said them as though they were a prayer. And then he asked me to *bring him the notebook, in person, every evening.* So that he could *understand* the child.' A tremor. 'That's you.'\n\nShe does not look at the notebook. 'It was the kindest anyone has been to me in years. I want you to know how much I hated it.'`,
      onEnter: [{ xp: 2 }, { set: "vasha_voss_met", val: true }, { task: "task_vasha", state: "active" }, { note: "task_vasha", text: `Voss has asked Vasha to bring him her notebook of reports on me every evening, 'so he can understand the child'. He knows the Reedmarsh numbers by heart. She hated how kind he was.` }, { note: "task_voss", text: `Voss summoned Vasha at six: made her tea (without sugar, as she takes it), recited the Reedmarsh casualties, asked for the notebook every evening.` }],
      voices: 3,
      interjections: [
        { skill: "doublethink", min: 2, text: `A very kind man. Isn't it nice to be understood? You could be understood so thoroughly you would not need to be anyone.` },
        { skill: "empathy", min: 4, text: `*I hated it* is the worst sentence in the language. It means she liked it, and cannot forgive herself the liking.` },
        { skill: "instinct", min: 3, text: `Fourteen days, nine hundred and six dead, one hundred and two who came down. He knew the unpublished numbers. He has read the file that does not exist.` },
        { skill: "archive", min: 4, text: `906 and 102. Total 1,008. Reedmarsh Pass: Official Strength, 1,000. Eight men who were never on the roll. Eight whom the pass took, quietly, who were not even counted as having been there.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    hub: {
      speaker: "vasha",
      text: [
        `'Kid.' Vasha shifts her weight off the bad knee and onto a worse one. 'Go on. There's a quarter of an hour of the morning left, and I intend to spend it badly.'`,
        `Lieutenant Kell is turning her unlit cigarette over in her fingers, end for end, like a metronome. 'Ask. I'll tell you what I can. I'm told I'm a *reliable witness.*' She snorts.`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `The left breast pocket. The notebook's corner is showing. She has not adjusted the zip in two hours. She wants somebody to notice.` },
        { skill: "volition", min: 5, text: `She is waiting for you to decide what you are to each other. That is a harder question than the one you came here with.` }
      ],
      choices: [
        { text: `'What does the notebook say about me, Lieutenant?'`, goto: "notebook", cond: "!flag.vasha_confession && !flag.vasha_report_burned" },
        { text: `[Take her hand. 'You don't have to give him the pages.']`, goto: "confess", cond: "flag.vasha_notebook_pressed && !flag.vasha_confession" },
        { text: `'Burn them, Vasha. Burn the reports.'`, goto: "burn", cond: "flag.vasha_confession && !flag.vasha_report_burned" },
        { text: `'Would you sign a Reader's Authorisation for me? For the library.'`, goto: "slip", cond: "flag.ysolde_stacks_asked && !flag.stacks_slip && (flag.vasha_confession || flag.vasha_ally)" },
        { text: `'Reedmarsh Pass is on the library globe. Painted out.'`, goto: "globe", cond: "flag.globe_reedmarsh && !flag.vasha_globe" },
        { text: `'Have you heard the Lantern Song, Lieutenant?'`, goto: "song", cond: "(flag.fenwick_lantern || flag.lantern_score_found) && !flag.vasha_song_shared" },
        { text: `'What happened to the body?'`, goto: "body", cond: "!flag.vasha_body" },
        { text: `'Is the Inspector going to arrest me?'`, goto: "arrest", cond: "flag.vasha_voss_met && !flag.vasha_arrest" },
        { text: `'If he asks, will you tell him?'`, goto: "betray", cond: "flag.vasha_confession && !flag.vasha_betray_asked" },
        { text: `'Thank you, Lieutenant.'`, end: true }
      ]
    },
    hub_burned: {
      speaker: "vasha",
      text: [
        `'Kid.' Vasha has the unlit cigarette in her mouth and nothing in her hands, which looks, on her, like a different person. 'Nothing in the pocket. Feels light. I keep reaching for it.'`,
        `She leans on the table, notebook-less and breathless in a way you have not seen. 'Ask. I've nothing to hide, except what I've hidden *better.*'`
      ],
      interjections: [
        { skill: "empathy", min: 3, text: `A person who has put down a weight keeps shifting her shoulders. It will be some days before she stops reaching for the pocket.` }
      ],
      choices: [
        { text: `'What will you tell Voss?'`, goto: "blank_pages", cond: "!flag.vasha_blank_asked" },
        { text: `'Would you sign a Reader's Authorisation for me?'`, goto: "slip", cond: "flag.ysolde_stacks_asked && !flag.stacks_slip" },
        { text: `'Have you heard the Lantern Song?'`, goto: "song", cond: "(flag.fenwick_lantern || flag.lantern_score_found) && !flag.vasha_song_shared" },
        { text: `'Reedmarsh Pass is painted out on the library globe.'`, goto: "globe", cond: "flag.globe_reedmarsh && !flag.vasha_globe" },
        { text: `'What happened to the body?'`, goto: "body", cond: "!flag.vasha_body" },
        { text: `'Thank you, Lieutenant.'`, end: true }
      ]
    },
    notebook: {
      speaker: "vasha",
      text: `She does not even pretend to be surprised. 'Everything,' she says. 'It says what you eat. It says when you go to bed. It says you hum, which you do, a little, when you are thinking, and don't know it.' She taps the pocket. 'It says what you said at the gym door, and what I think you meant. I am a very *thorough* reporter, kid. I was trained to be.' A rapid breath. 'And last night, when I wrote it up, I got to the last page and the pencil stopped. I put it down. I picked it up. I had nothing more to say that was *true* and also *safe.* So I wrote *Nothing to report.* And I have never in my life written a lie on an official form, and it was the cleanest thing I did all day.'`,
      onEnter: [{ set: "vasha_notebook_pressed", val: true }, { xp: 2 }, { note: "task_vasha", text: `Vasha's notebook records everything: what I eat, when I sleep, that I hum when thinking. Last night she wrote 'Nothing to report': her first lie on an official form.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `*The cleanest thing I did all day.* A lie as the only honest act left in a day made entirely of truths she was told to tell.` },
        { skill: "dialectics", min: 3, text: `She cannot report truthfully without harming you. She cannot lie without harming herself. The notebook is a closed system. The only exit is to open it.` }
      ],
      choices: [
        { text: `[Take her hand. 'You don't have to give him the pages.']`, goto: "confess" },
        { text: `'Then keep writing nothing.'`, goto: "hub" }
      ]
    },
    confess: {
      speaker: "vasha",
      text: `For a while she says nothing. The cigarette goes behind her ear again, and her hand lies in yours like a thing she has been told to carry and has no instructions for. 'I wrote for six weeks,' she says at last, very low. 'Every day. They promised my knee. A man came in a grey coat in the spring and said, *Lieutenant, there is a surgeon in the capital who could make you walk like a girl*, and I thought, *yes, God, yes*. I didn't think about *who* I'd be writing about. It was a *student.* An *anonymous* student.' She looks at you, at last. 'Then it was a *name.* Then it was a name who hummed. And I could not write the humming, so I wrote *quiet.* Then I could not write *quiet*, so I wrote *nothing.*'\n\nShe squeezes your fingers. 'I am so sorry. I have been sorry in the most useless possible way since March.'`,
      onEnter: [{ set: "vasha_confession", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { thought: "th_double_agent" }, { note: "task_vasha", text: `Vasha confessed: six weeks of daily reports in exchange for a surgeon for her knee. She began writing 'quiet', then 'nothing'. She is sorry 'in the most useless possible way since March'.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She is not asking for absolution. She is asking you not to leave while she says it. It is the humblest request in the world.` },
        { skill: "solidarity", min: 2, text: `We. She has said *we* with her whole hand. She has been outside us for so long she has forgotten the word fits.` },
        { skill: "volition", min: 4, text: `Don't forgive her yet. Don't refuse. Hold both. A confession is a door; keep your foot in it.` }
      ],
      choices: [{ text: `'Thank you for telling me.'`, goto: "hub", effects: [{ set: "vasha_ally", val: true }] }]
    },
    burn: {
      speaker: "vasha",
      text: `'Burn them.' She tries the words as one tries a cold bath. 'There are six weeks of them. The grey man has copies of the first four. I could say the rest were lost. In *fire.* A very respectable death for a notebook.' She stands, and takes the little green book out of her breast pocket for the first time in two days, and holds it in both hands as one holds a bird that might fly or might not. 'If I do this, I can never go back. They will notice the pages are blank.'\n\n'Yes,' she says, to herself. 'Yes. Do you have a match?'`,
      choices: [
        { text: `[Light the matches. Burn them together in the canteen's stove.]`, goto: "burn_do", effects: [{ set: "vasha_burn_started", val: true }] },
        { text: `'Not yet. Keep them until you're sure.'`, goto: "hub" }
      ]
    },
    burn_do: {
      speaker: "narrator",
      text: `The canteen's black iron stove is warm, and unwatched; Bronka, in the next room, has begun to sing, loudly and off-key, a thing that sounds like an anthem but is in fact a recipe. Vasha feeds the pages into the door of the stove one by one, without reading them, and you watch the writing curl: *Subject: Student. Behaviour: quiet. Complains of ringing.* *Hums when thinking.* *Contact with Commissar Dane.* Each page lifts and darkens and goes up in a thin gold flap. When the last one goes, she holds the empty green cover for a moment, and then, with a decision visible in her shoulders, throws that in too.\n\nThe smoke smells of paper, and pencil, and an awful lot of relief.`,
      onEnter: [{ set: "vasha_report_burned", val: true }, { take: "vasha_notebook" }, { task: "task_vasha", state: "done" }, { thought: "th_burned_paper" }, { xp: 5 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { surv: -3 }, { note: "task_vasha", text: `We burned six weeks of reports in the canteen stove. Vasha threw the empty cover in last.` }],
      voices: 3,
      interjections: [
        { skill: "solidarity", min: 2, text: `We. Fire. A very old thing. A small clean light in a kitchen, and a woman who could breathe.` },
        { skill: "empathy", min: 3, text: `She is crying and she does not know it yet. Do not tell her. She will find out when she lights the cigarette.` },
        { skill: "authority", min: 3, text: `A SOLDIER HAS SET FIRE TO AN ORDER. NOTE THE POSTURE. IT IS BETTER THAN THE ONE SHE HAD THIS MORNING.` }
      ],
      choices: [{ text: `Continue.`, goto: "blank_pages" }]
    },
    blank_pages: {
      speaker: "vasha",
      text: `'What do I tell him,' she says, slowly. 'Voss. He'll want the evening report.' She lights the cigarette, at last, with a hand that is not entirely steady. 'I'll bring him *blank pages.* I'll say the pencil snapped in the night and I wrote it up in my head. It's a thin lie. He'll see through it.' A thoughtful drag. 'But he *will* let me. That's what I can't work out. He has a way of looking at you as if he's already forgiven everything you are about to do.'\n\nShe exhales. 'It's the nicest thing about him. It's also, I think, the most dangerous.'`,
      onEnter: [{ set: "vasha_blank_asked", val: true }, { xp: 2 }, { set: "vasha_blank_pages", val: true }],
      interjections: [
        { skill: "instinct", min: 3, text: `He will let her. He will let everybody. A man who forgives you in advance is a man who has already added you to the account.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub_burned" }]
    },
    slip: {
      speaker: "vasha",
      text: `'A Reader's Authorisation?' She turns the green slip over in her fingers. 'I haven't read a book since the Army. I have been, shall we say, *physically* cultured.' She holds out a pencil. 'Do I have standing? I am a teacher. Of a *sort.* I teach children to fall over without breaking.' Her mouth twists. 'If anybody asks, I'll say you were researching the Reedmarsh Pass.'\n\nShe signs it in a square, military hand, *V. KELL, Lt. (ret.), Physical Culture,* and blows on it like a woman who has put her name to a thousand sentences she did not write. 'There. Whatever it is, I've stood behind it.'`,
      onEnter: [{ set: "stacks_slip", val: true }, { xp: 3 }, { note: "task_stacks", text: `Vasha signed my Reader's Authorisation slip: 'V. KELL, Lt. (ret.), Physical Culture'. A teacher of standing, of a sort.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    globe: {
      speaker: "vasha",
      text: `She stands very still. 'Painted out?' The cigarette is halfway to her mouth, and stops. 'In the library. On a *globe.*' She does not speak for what seems a long time. 'Fourteen days,' she says, very quietly. 'I did not think anyone had kept a single record of it. I thought it was only in my body.' She sets the cigarette down on the table. 'Do you know, kid, I have never once seen it on a map. I believed, truly, that I had made it up. That I had *dreamed* a pass.' She looks at her hands. 'It is a great and terrible relief to be told you did not.'\n\nHer face is a very long way down. She puts a hand over her mouth, and in the quiet of the hall, a muscle moves under it, once.`,
      onEnter: [{ set: "vasha_globe", val: true }, { xp: 3 }, { morale: 1 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `A soldier told that her war was real. It is not a comfort. It is a *return*, which is a different and much heavier thing.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    song: {
      speaker: "vasha",
      text: `'The song,' says Vasha. She does not move. 'You mean the one in the dream.' You hum the first line, soft, as Fenwick gave it. She closes her eyes. The tune goes through her like water through a sieve, and her lips, without her, move after it. *Light a lantern in the hall.* 'Oh,' she says. 'Oh, that's it. That's the one.' The cigarette burns down in the ashtray. 'It's a *lullaby.* A mother sang it. A woman folding sheet music, in the bad winter, in a house with no heat.' Her voice is full of dust and gold. 'I thought it was my mother. It was somebody else's. It is everybody's.'\n\nShe opens her eyes. 'Teach it to me properly. If there's a choir.'`,
      onEnter: [{ set: "vasha_song_shared", val: true }, { xp: 3 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }, { thought: "th_collective_pulse" }],
      interjections: [
        { skill: "solidarity", min: 2, text: `We are singing. We are all singing. A woman in a tracksuit, a man in a shabby suit, a cook in an apron. It is not much of a choir. It is a start.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    body: {
      speaker: "vasha",
      text: `'The body.' Her face loses all expression, as if she has been told to stand at ease. 'They came at three. A van. Plain grey, Inspectorate plates, two men in mackintoshes with a stretcher and a bag. I was *asked* to be present. Signed for him.' She taps the table. 'They took the rope. They took the portrait, the whole frame, torn and all. They took the *floor mat*, the one I know had the pin on it, and left me a spare. They knew what to take. A man who has done this before is a man who is careful about the order.' A pause. 'They did *not* take his chalk. The Commissar had a stub in his waistcoat, which I found afterwards in the gym, in a crack in the floor. It must have rolled. I put it back in the crack. I thought: *someone may want that.*'\n\nShe looks at you. 'I think it was meant for you.'`,
      onEnter: [{ set: "vasha_body", val: true }, { xp: 2 }, { note: "task_case", text: `Voss's men removed Ostrov's body at 03:00: a grey Inspectorate van, two men in mackintoshes. They took the rope, the portrait frame and the mat with Rhea's pin. Vasha left a stub of the Commissar's chalk in the floor crack in the gym.` }],
      interjections: [
        { skill: "deduction", min: 3, text: `They took the rope, the portrait, the mat. The three pieces of evidence that would show a hanging was staged. They knew exactly what the gym knew.` },
        { skill: "instinct", min: 3, text: `A man who removes the evidence in the correct order is not hiding a murder. He is *tidying a procedure.* He has done it before.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    arrest: {
      speaker: "vasha",
      text: `'Arrest you?' She almost smiles. 'Voss? No. Arrest is for people who have not been made to *want* to be helpful.' She jabs the cigarette in your direction. 'He's going to be *kind.* He's going to offer you tea. He's going to ask you about the ringing. And at the end of it he will tell you, in the most considerate voice you have ever heard, that you are an unusually *gifted* student, and that there are places in the Union that have need of such gifts.' A beat. 'It's a job offer, kid. It's the only kind of arrest that doesn't leave a mark.'`,
      onEnter: [{ set: "vasha_arrest", val: true }, { xp: 2 }, { thought: "th_inspector_charm" }],
      interjections: [
        { skill: "instinct", min: 3, text: `A job offer is a leash with a nicer collar. She has worn one. She knows the stitching.` },
        { skill: "doublethink", min: 2, text: `Gifted! A place of your own! A purpose! Isn't that what you have always wanted?` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    betray: {
      speaker: "vasha",
      text: `She does not answer at once. She turns the cigarette over, and the whole of her face goes into the question and comes back out. 'If he asks me, plainly,' she says, 'in that voice, with that boat in his pocket: I don't know.' The honesty hurts her more than it will you. 'I'd *like* to say no. I'd like it so much I can taste it. But I have a *knee*, kid, and a pension, and a very old habit of doing as I am told.' She looks up. 'Don't ask me to promise. I would only be promising the person I am today. I can't speak for the one he'll meet at six o'clock.'\n\nIt is, you think, the most truthful thing anyone has said all day.`,
      onEnter: [{ set: "vasha_betray_asked", val: true }, { xp: 3 }, { set: "vasha_wavers", val: true }, { note: "task_vasha", text: `Vasha: 'If he asks me plainly, in that voice, with that boat in his pocket: I don't know.' She won't promise. She can't speak for the person Voss will meet at six.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `An honest refusal to be reliable. It is the rarest form of loyalty. She will not lie to you even to comfort you.` },
        { skill: "volition", min: 4, text: `You cannot save her from herself. You can only make it cheaper for her to be brave than to be safe. Think about what that costs, and who pays it.` }
      ],
      choices: [{ text: `'Then I'll make it easier for you to say no.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }, { morale: 1 }] }, { text: `'I understand.'`, goto: "hub" }]
    }
  }
},

// ============================================================ BRONKA, DAY 2
bronka_d2: {
  title: "Cook Bronka",
  start: [
    { cond: "flag.bronka_d2_talked", node: "hub" },
    { cond: "flag.osk_scapegoat", node: "open_osk" },
    { cond: "flag.verdict_ledger", node: "open_ledger" },
    { cond: "flag.verdict_static", node: "open_static" },
    { cond: "flag.verdict_quiet", node: "open_quiet" },
    { node: "open_other" }
  ],
  nodes: {
    open_osk: {
      speaker: "bronka",
      text: `The plate that arrives on the zinc is cold, and has been set down so softly that you almost hear the plate being kind about it. 'Bread,' says Bronka, to the pot. 'Eat. It's the same as it was yesterday.' She does not turn round. 'Osk Brannic ate here every day for thirty-one years, at the back, standing, with his cap on his chest. Never took seconds. Always said *thank you for the soup*, to the soup.' She stirs. 'They took him at eleven last night. I was not asked for a statement. Do you know why they did not ask me? Because I was *peeling.* A woman peeling is a woman who is not a witness.'\n\nHer voice does not rise. It simply *stops, a little, at the end*, as when a person is walking and meets a step that isn't there. 'I'll feed you, crumb. I feed anyone who stands in front of me. It doesn't mean I forgive.'`,
      onEnter: [{ set: "bronka_d2_talked", val: true }, { morale: -1 }, { set: "bronka_cold", val: true }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She will feed you until you die, and she will never look you in the eye. It is a hard sort of love, and you are the one it is aimed at.` },
        { skill: "doublethink", min: 2, text: `It's only bread. She is a very good cook and a very sentimental woman. Eat. Everything will be all right. It was only a janitor.` },
        { skill: "the_grey", min: 3, text: `A cold plate. A ladle laid down in exactly the wrong place. In a kitchen, that is a funeral.` }
      ],
      choices: [
        { text: `Eat the bread. Say nothing.`, goto: "hub", effects: [{ hp: 1 }] },
        { text: `'I'm sorry, Bronka.'`, goto: "osk_sorry" },
        { text: `'It was him or the school.'`, goto: "osk_hard", effects: [{ ideo: "vanguard", n: 1 }] }
      ]
    },
    osk_sorry: {
      speaker: "bronka",
      text: `'Sorry.' She sets the ladle down in its groove, and for the first time looks at you, her small hard eyes full of flour and fury. 'That is a very light word, crumb. It weighs the same as the one you used on the form.' But she does not look away. 'I am going to say one thing, and then I am going to give you your soup. If you are *sorry*, you will do something about it. You will be *useful.* I have never met a decent person who was only sorry.'\n\nShe turns back to the pot. 'Eat.'`,
      onEnter: [{ xp: 2 }, { set: "bronka_demand", val: true }, { thought: "th_weight_of_osk" }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    osk_hard: {
      speaker: "bronka",
      text: `'*The school.*' She says it as if tasting something that has turned. 'A school is a building. A building does not need you to put an old man in it.' Her mouth works. 'I fed that school for thirty years, and I will tell you what it is: it is eleven hundred children and a roof. You gave it a man. It did not ask for one. *You* offered.' She wipes her hands on her apron, hard, as though they were not clean. 'The bread is on the counter. I would not insult a loaf by saying I was too angry to give it to you.'\n\nShe does not speak again for some time.`,
      onEnter: [{ morale: -1 }, { surv: 1 }],
      choices: [{ text: `Take the bread. Go.`, goto: "hub" }]
    },
    open_ledger: {
      speaker: "bronka",
      text: `'Crumb.' She does not look round, but a plate arrives at your elbow with a speed that suggests she has been holding it ready: bread, the yellow slab that is cheese by intention, and on top, tucked into a crust, a twist of greaseproof the size of a fingernail. 'Eat everything. Especially the crust.' A wink, enormous and terrible, in a face that has not winked in years. 'It's a *good* loaf. It's got a *story* in it.' She leans over the counter, eyes bright. 'A certain lady in a laboratory coat sends her *regards.* She says tea is on, and that she doesn't remember why, and that the second cup is for the stranger.'\n\nShe slides a hand over yours on the zinc. It is warm, and floury, and shaking. 'Whatever you did,' she says, very low, 'it was *loved.* We felt it all night in the oven.'`,
      onEnter: [{ set: "bronka_d2_talked", val: true }, { give: "bread_note" }, { morale: 2 }, { hp: 1 }, { set: "bronka_note_d2", val: true }, { toast: "Received: Bread Note" }],
      interjections: [
        { skill: "solidarity", min: 2, text: `A hand on a hand over a counter. This is how a revolution starts: with a loaf and a wink.` },
        { skill: "appetite", min: 2, text: `A *story* in a loaf. EAT. CRUST FIRST. THE NOTE IS PART OF THE FIBRE.` },
        { skill: "empathy", min: 3, text: `She knows. She is not asking. A woman who has been waiting for fifteen years to be thanked is suddenly being thanked by a school.` }
      ],
      choices: [{ text: `Eat the loaf.`, goto: "hub" }]
    },
    open_static: {
      speaker: "bronka",
      text: `She has been crying, and has dealt with it by making a very great deal of dough. 'Crumb.' She does not wipe her hands. 'I was in the Hall. I heard it. Every pot in the kitchen heard it. I thought, *well, there it goes.* And then I thought, *no, that's him.*' She wipes her nose with the back of a floury wrist, leaving a white streak. 'They've got sixteen of the little ones in the gym and I can't *reach* them. I sent bread. Lemmy took it. He's been very *useful* this morning. It's quite alarming.' She puts a plate in front of you. 'Eat. You're an idiot. You are a *lovely* idiot.'\n\nShe leans across the counter and grips your wrist. 'My Tobar would have *sung.*'`,
      onEnter: [{ set: "bronka_d2_talked", val: true }, { hp: 1 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `*My Tobar would have sung.* It is the first time she has said his name in the present conditional. It is a very large and very small sentence.` },
        { skill: "solidarity", min: 3, text: `Every pot in the kitchen heard it. We were all listening. That is what it means to be a community: the cutlery has an opinion.` }
      ],
      choices: [{ text: `Eat. Hold her hand.`, goto: "hub", effects: [{ xp: 1 }] }]
    },
    open_quiet: {
      speaker: "bronka",
      text: `She puts down the plate and then does not let go of it. 'You drank it,' she says. 'The tea. At the gate.' It is not a reproach. She is looking at you the way one looks at a loaf one had hoped would rise. 'They give the leavers a cup. I've watched them drink it for twenty years. They get a look.' She lets go of the plate. 'Good bread, crumb. You've lost a little weight in the face. It happens.' She pushes the plate nearer. 'I won't ask you what you remember. It would only embarrass one of us.'\n\nShe lays a floury hand on your forehead, once, briefly, as a mother checks for fever. 'You're warm. That's good. That's *all* good. Come back to me when you're ready, and I'll still be here, with the bread.'`,
      onEnter: [{ set: "bronka_d2_talked", val: true }, { hp: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She is not giving up on you. She is simply allowing for the timetable. She has seen people take much longer to come back.` },
        { skill: "appetite", min: 2, text: `It's good bread. It was always good bread. Eat it and be alive.` }
      ],
      choices: [{ text: `Eat. Say thank you.`, goto: "hub" }]
    },
    open_other: {
      speaker: "bronka",
      text: `'Crumb.' Bronka does not look round; there is already a plate on the zinc. 'Wednesday. Eat first.' She stirs a pot the size of a font. 'We have an Inspector. We have a very *special* lunch to prepare for him. Three courses. *Butter.*' She says *butter* as one says the name of a dead dictator. 'The Principal sent a requisition at seven. The Ministry pays in coupons I haven't got, for butter I'd have to *steal*, for a man who will, I am told, *taste* it.'\n\nShe jabs the ladle toward the till. 'Tuesday's dues didn't come in. That boy of Rhea's has stopped bringing them, and I could kiss him, and I've no coupons.' A small, bleak laugh. 'God and sugar, what a day for it.'`,
      onEnter: [{ set: "bronka_d2_talked", val: true }, { note: "task_coupons", text: `Bronka must cook a three-course lunch with real butter for Inspector Voss. The Ministry pays in coupons she hasn't got. She's short.` }],
      interjections: [
        { skill: "appetite", min: 2, text: `BUTTER. Real butter. A whole three-course lunch. I would sell my own left leg to be in the same room as the butter.` },
        { skill: "archive", min: 3, text: `Ration Memorandum 8(c): the butter allocation for a State visitor is eleven grams per course. The Principal's requisition says *forty.* Somebody is padding the account.` }
      ],
      choices: [{ text: `Eat first.`, goto: "hub" }]
    },
    hub: {
      speaker: "bronka",
      text: [
        `'Well, crumb?' Bronka is up to her elbows in something pale and unhappy. 'Out with it. Today I have a lunch, an Inspector, and a hip.'`,
        `'Talk to the soup.' She nods at the pot. 'The soup's the only one in this hall that has never lied to me.'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `Under the cabbage and the yeast, a faint smell of warm metal: the old stove, and under it, in the cellar, something quite different. Tobar's folded sheet-music, drying on a rail.` }
      ],
      choices: [
        { text: `'The coupons. How short are you?'`, goto: "coupons", cond: "!flag.bronka_d2_coupons" },
        { text: `[Give her a ration coupon for the butter.]`, goto: "coupon_pay", cond: "has('ration_coupon') && flag.bronka_d2_coupons && !flag.bronka_butter_paid" },
        { text: `'Put me on the kitchen. I'll work off what you need.'`, goto: "shift", cond: "flag.bronka_d2_coupons && !flag.bronka_butter_paid && !flag.bronka_shift_done" },
        { text: `'Fill my thermos?'`, goto: "thermos", cond: "has('thermos') && !flag.bronka_filled_thermos" },
        { text: `'Bronka. Tobar. I saw a card.'`, goto: "tobar_card", cond: "flag.catalog_tobar && !flag.bronka_tobar_card" },
        { text: `'Tell me about your son.'`, goto: "son", cond: "flag.bronka_tobar && !flag.bronka_son" },
        { text: `'Did the Inspector eat here?'`, goto: "voss", cond: "!flag.bronka_voss" },
        { text: `'Is there a note in today's loaf?'`, goto: "note", cond: "flag.bronka_trust && !has('bread_note') && !flag.bronka_note_d2 && !flag.bronka_note_d2b" },
        { text: `'Thank you, Bronka.'`, end: true }
      ]
    },
    coupons: {
      speaker: "bronka",
      text: `'Twelve for the butter. Four for the sugar, which the Ministry has decided is *a courtesy.* Six for the *good* flour, which is what you call flour that has not been mixed with something.' She jabs the ladle. 'Twenty-two coupons, crumb, by the Bell. If I haven't got them, the lunch is bread-and-dripping and the Inspector sees what the Hall really is, and Marr loses a feather, and *I* lose the kitchen.' She does not say what happens after that. 'I used to have the dues from Lemmy, God forgive me for a fool, all the Thursday coupons he stole, I counted on the *thieving.*'\n\nShe laughs, a short bitter bark. 'What a thing to rely on.'`,
      onEnter: [{ set: "bronka_d2_coupons", val: true }, { task: "task_coupons", state: "active" }, { xp: 1 }, { note: "task_coupons", text: `Bronka needs 22 coupons by the Bell for Voss's lunch (12 butter, 4 sugar, 6 good flour). If she can't, the Hall is exposed and she loses the kitchen.` }],
      interjections: [
        { skill: "archive", min: 3, text: `Twenty-two coupons. Twelve plus four plus six. Four times over, the figure in the Ministry's budget for Third Floor *heating.* The Inspector will eat a month of children's warmth in three courses.` },
        { skill: "dialectics", min: 3, text: `She relied on the stealing. That is the whole of the economy in a sentence: a thief the system was too lazy to stop becomes a pillar of the budget.` }
      ],
      choices: [
        { text: `'I'll find what I can.'`, goto: "hub" },
        { text: `'Put me on the kitchen. I'll work it off.'`, goto: "shift" }
      ]
    },
    coupon_pay: {
      speaker: "bronka",
      text: `You put the coupon on the zinc. She looks at it. She looks at you. She does the sum on her fingers and, to your surprise, does not shout. 'One,' she says. 'It's one in twenty-two. It's what a man gives when he's got one.' She tucks it into her bosom as one tucks a blessing. 'It's the *sort* of one that makes the other twenty-one begin to come. You'd be astonished.'\n\nShe nods slowly. 'I've never known a favour of one that didn't breed. Give me an hour. I'll have a word in the right ears.'`,
      onEnter: [{ take: "ration_coupon" }, { set: "bronka_butter_paid", val: true }, { xp: 3 }, { morale: 1 }, { task: "task_coupons", state: "done" }, { set: "bronka_trust", val: true }, { note: "task_coupons", text: `Gave Bronka a coupon toward the Inspector's lunch. She says one begets twenty-one.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    shift: {
      speaker: "bronka",
      text: `'Work?' She sizes you up. 'Apron. Gloves. Over there. You will peel, you will carry, you will ladle, you will not *taste.*' She shoves a bucket of potatoes at your chest. 'If you can stand ninety minutes at a Ration Hall counter with the Principal's *butter* in the room and not eat a single gram, I will call the debt quits. I will call you *comrade.* I have not called anybody that since the Cinder Winter.'\n\nShe says it as a threat. It is, you realise, the warmest invitation you have been offered in two days.`,
      choices: [
        { text: `[Peel, carry and ladle for ninety minutes.]`, check: { skill: "stamina", diff: 10, id: "bronka_shift_stamina", white: true, pass: "shift_ok", fail: "shift_bad" } },
        { text: `[Resist the butter. Not a single gram.]`, check: { skill: "volition", diff: 10, id: "bronka_shift_volition", white: true, pass: "shift_ok", fail: "shift_bad" } },
        { text: `'Not now.'`, goto: "hub" }
      ]
    },
    shift_ok: {
      speaker: "narrator",
      text: `Ninety minutes of potato, steam and ladle, under the unblinking eye of a cook who sees every motion of your hands. Your forearms ache. Your face is wet. The butter sits in its dish on the sideboard like a small golden idol, and you pass it forty times and look at it once. At the end Bronka looks at the clock, then at you, then, without speaking, at the butter. She cuts a heel of bread, spreads it, thin as a whisper, and puts it in your hand.\n\n'There,' she says. 'That one is *mine.* Not the Inspector's. It doesn't count.' She grins. 'You've got hands, crumb. I can use hands.'`,
      onEnter: [{ set: "bronka_shift_done", val: true }, { set: "bronka_butter_paid", val: true }, { task: "task_coupons", state: "done" }, { time: 90 }, { xp: 4 }, { hp: 1 }, { morale: 2 }, { give: "sweet_roll" }, { toast: "Received: Sweet Roll" }, { note: "task_coupons", text: `Worked ninety minutes in Bronka's kitchen and did not touch the butter. She calls me comrade.` }],
      interjections: [
        { skill: "appetite", min: 2, text: `A heel of bread with butter. *Her* butter. It is, I believe, the single best thing I have ever tasted in my life and I should like it noted.` },
        { skill: "solidarity", min: 3, text: `Comrade. She said it like a prayer she had never expected to say again. It is a word with a lot of salt in it.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    shift_bad: {
      speaker: "bronka",
      text: `You make it to minute sixty-eight. The butter sits at the corner of your eye like a bad idea. Then your hand, without consulting you, drifts to the dish, and a golden curl of it goes into your mouth, and the world stops. 'There,' says Bronka. She does not sound angry. She sounds like a woman who had set a trap for her own affections. 'I knew it. God and sugar. Twenty minutes more and you'd have been *saved.*'\n\nShe puts a hand on your shoulder. 'Go on. Out. You've done honest work and a little dishonest eating. It is the usual proportion.'`,
      onEnter: [{ time: 70 }, { xp: 1 }, { hp: 1 }, { morale: 1 }, { set: "bronka_shift_done", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    thermos: {
      speaker: "bronka",
      text: `'*That.*' She takes the thermos from you as a priest takes a relic, and weighs it. 'Steel. Dented. Good.' She unscrews the cap, sniffs, and her whole face softens at the smell of someone else's kitchen. 'Your mother's,' she says. 'I knew a woman with one just like it. Always had it filled before the early shift.' She pours in strong black tea from the urn, a measure of sugar nobody has been issued, and, in an act of open rebellion, a thumb of rum from a bottle in the flour-bin. 'There. For the long hours. It'll keep hot till midnight.' She screws the cap down hard. 'Keep it close. A thing that's warm is a thing that's still alive.'`,
      onEnter: [{ set: "bronka_filled_thermos", val: true }, { xp: 2 }, { morale: 2 }, { toast: "Your thermos is filled: hot tea until midnight." }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    tobar_card: {
      speaker: "bronka",
      text: `You tell her about the library, the unmarked drawers, the card in Ysolde's violet hand. *TOBAR. Choir, tenor. Hums when folding sheet-music: the Lantern Song. THE COOK KNOWS. THE COOK DOES NOT KNOW SHE KNOWS.* Bronka does not move. The ladle, in her hand, turns very slowly in the pot, and then, quite gently, stops.\n\n'He folds the sheet-music,' she says. 'He does. In the cellar. He's been doing it since he came home, six years. Every evening. He takes the old choir parts out of the box and folds them, over and over, into little *boats.*' She puts her hand over her mouth. 'I thought it was grief. I thought it was a thing his hands had decided. He *hums.* It's very quiet. I never *asked* what.'\n\nShe takes the apron from her neck, very carefully, as if she were going to fold it too. 'I know what the tune is now.'`,
      onEnter: [{ set: "bronka_tobar_card", val: true }, { xp: 4 }, { morale: 1 }, { thought: "th_chosen_family" }, { note: "task_choir2", text: `Bronka's husband Tobar folds old choir parts into little boats in the cellar and hums the Lantern Song. He could teach Fenwick the other verses, if anybody asked him.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `Folded boats. He has been folding paper boats for six years and nobody asked what they were for. They were for crossing over.` },
        { skill: "solidarity", min: 2, text: `We hold on. We hold on in our hands when we cannot in our heads. A fold. A hum. It is how the music has survived.` }
      ],
      choices: [{ text: `'He knows the song. Bring him to the choir.'`, goto: "hub", effects: [{ set: "bronka_offers_tobar", val: true }, { ideo: "undercurrent", n: 1 }] }, { text: `'I'm sorry.'`, goto: "hub" }]
    },
    son: {
      speaker: "bronka",
      text: `'Danil.' She says it in the voice one uses for a country one can no longer cross. 'Fourteen. Sixteen now. Big for his age. Hands like shovels, and a very nice singing voice when it isn't breaking.' The ladle rests on the pot's rim. 'After his father came back soft, he joined the Vanguard Cadets. For *protection*, he said. He said no one touches a Cadet's mother. He was *right.* No one has touched me in six years.' She wipes the ladle with her thumb. 'He was assigned to the *Cinder Street Home.* To a squad of older children. Her squad.' A tight breath. 'Rhea Vantage's.'\n\nShe looks at you, at last. 'He writes once a month. In a *very* correct hand. *I am well. Rhea is kind. Mother, do not bake for me.*'`,
      onEnter: [{ set: "bronka_son", val: true }, { xp: 3 }, { thought: "th_good_son" }, { task: "task_rhea2", state: "active" }, { note: "task_rhea2", text: `Bronka's son Danil (16) is a Vanguard cadet in Rhea's squad at the Cinder Street Home. He writes monthly: 'I am well. Rhea is kind. Mother, do not bake for me.'` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `*Do not bake for me.* It is not a message. It is a warning, delivered through the only door the Vanguard allow: a cook's heart.` },
        { skill: "instinct", min: 3, text: `Rhea's squad. A boy who sings. A girl who peels oranges. The Home is a very small house with a great many weather systems.` },
        { skill: "solidarity", min: 3, text: `A mother feeding a school because she cannot feed her son. It is the oldest transfer of the heart in the world and it is made of bread.` }
      ],
      choices: [{ text: `'If I meet Rhea, I'll ask about him.'`, goto: "hub", effects: [{ set: "bronka_son_promise", val: true }, { ideo: "undercurrent", n: 1 }] }, { text: `Say nothing. Hold her hand.`, goto: "hub", effects: [{ morale: 1 }, { xp: 1 }] }]
    },
    voss: {
      speaker: "bronka",
      text: `'Eat?' Bronka snorts. 'He *took tea.* At six. Stood at the counter like a man at a bar who doesn't drink. Asked for a biscuit. A very particular biscuit.' She makes a shape in the air with her flour-white fingers. 'Boat-shaped. I said I haven't made a boat-shaped biscuit since the Cinder Winter. He said, *I know. I only wondered if anyone still remembered the mould.*' She stirs. 'I remembered. I have the mould in a drawer. I said nothing.' She frowns into the soup. 'He held the cup like a man holding a letter he's afraid to open.'\n\nShe looks up, sharp. 'Don't trust him, crumb. And don't hate him either. Both are mistakes. Mistakes I've made.'`,
      onEnter: [{ set: "bronka_voss", val: true }, { xp: 2 }, { note: "task_voss", text: `Voss took tea at the Hall counter at six and asked for a boat-shaped biscuit: 'I only wondered if anyone still remembered the mould.' Bronka does. She held her tongue.` }],
      interjections: [
        { skill: "instinct", min: 3, text: `A boat. He is looking for a *boat.* There is a mould, in a drawer, and a man who has been trying to find it for years.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    note: {
      speaker: "bronka",
      text: `She breaks a roll in two, and from the crumb draws a twist of greaseproof the size of a fingernail. 'Today's,' she says. 'Meant for the cellar, but I think you're *due* one.' The pencil is a baker's pencil, the capitals neat. *NOBODY KNOWS WHO'S LISTENING. BE KIND. THE BREAD IS WATCHING.* She watches you read it. 'That's all I've got today. It's an *advisory* note. For the nervous.'`,
      onEnter: [{ give: "bread_note" }, { set: "bronka_note_d2b", val: true }, { xp: 1 }, { toast: "Received: Bread Note" }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    }
  }
},

// ============================================================ ILSABET, DAY 2
ilsabet_d2: {
  title: "Ilsabet Orrin",
  start: [
    { cond: "flag.ilsabet_d2_met", node: "hub" },
    { cond: "flag.ilsabet_betrayed", node: "open_betrayed" },
    { cond: "flag.verdict_good_student || flag.osk_scapegoat", node: "open_good" },
    { cond: "flag.verdict_static", node: "open_static" },
    { cond: "flag.verdict_ledger", node: "open_ledger" },
    { cond: "flag.verdict_quiet", node: "open_quiet" },
    { node: "open_other" }
  ],
  nodes: {
    open_betrayed: {
      speaker: "ilsabet",
      text: `She does not look up from Table Four. 'The Matron came by at eight,' she says, to the screwdriver in her hand. 'She did the east bunks and the lockers and she did the library *twice.* She asked me, very politely, about my hobby. *My hobby.* I said I collect hymn-books.' A turn of the little screwdriver. 'She knew about the set. She knew it was behind the radiator in Four. She did not *find* it. She just stood very close to it and *smiled*.' The wheelchair squeaks a precise quarter-turn. 'There are three people who knew where the set lived. One of them is a gerbil.'\n\nShe looks at you now, and her face is perfectly blank, which on Ilsabet is a form of shouting.`,
      onEnter: [{ set: "ilsabet_d2_met", val: true }, { morale: -1 }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `She is not angry yet. She is *measuring.* The anger comes after, and it is the sort that does a great deal of quiet damage with a soldering iron.` },
        { skill: "instinct", min: 3, text: `She knows. She hasn't got proof. She is giving you the chance to say it first. It is the kindest thing she will do today.` },
        { skill: "doublethink", min: 2, text: `Say it was a mistake! Say you did it for her own good. Say it was the Lieutenant! Friend: there are so many lovely things to say.` }
      ],
      choices: [
        { text: `'It was me. I told the Lieutenant. I'm sorry.'`, goto: "betrayed_confess", effects: [{ morale: -1 }] },
        { text: `[Deflect. 'It could have been Wren, or Dov, or the gerbil.']`, check: { skill: "composure", diff: 12, id: "ilsabet_d2_deflect", white: false, pass: "betrayed_lie_ok", fail: "betrayed_lie_bad" } },
        { text: `'I don't know what you're talking about.'`, goto: "betrayed_lie_bad" }
      ]
    },
    betrayed_confess: {
      speaker: "ilsabet",
      text: `For a long time there is only the tick of the cooling soldering iron. 'Thank you,' she says, quite evenly. 'For saying it.' The braid goes over one shoulder. 'I would have *preferred* a lie. I could have *used* a lie. A lie is something you can plan around.' She lays the screwdriver on the table very precisely. 'I'm going to be honest, because I think you've earned it: I'm *furious.* I'm going to be furious for about a day. I will not tell you where the set is. I will not tell you the schedule. I will be *civil.* And at the end of the day, if you have done *one* thing that I can use, I will decide whether you are a person who made a mistake or a mistake who is a person.'\n\nA pause. 'I would like very much for it to be the first.'`,
      onEnter: [{ xp: 2 }, { set: "ilsabet_confessed", val: true }, { set: "ilsabet_probation", val: true }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `'I'll earn it.'`, goto: "hub" }]
    },
    betrayed_lie_ok: {
      speaker: "ilsabet",
      text: `She studies you. A thin, cold look, with a very precise quarter-turn of the head. 'A gerbil,' she says. 'Yes. That is a *plausible* gerbil.' She lets a silence run, a good clean one. 'All right. I choose not to know. I'm not stupid; I have simply decided to *be* stupid, for now, for strategic reasons.' She taps the table. 'I will still not tell you where the set is.'\n\nShe does not forgive you. She simply *defers* the question, which in the circumstances is a better outcome than you had any right to expect.`,
      onEnter: [{ xp: 2 }, { set: "ilsabet_probation", val: true }, { surv: -1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    betrayed_lie_bad: {
      speaker: "ilsabet",
      text: `'*Don't.*' The word is small and flat and falls like a dropped spanner. 'You do that with your jaw. I've watched you do it to the Lieutenant.' She turns the chair away. 'I'm not going to scream. I'm going to say this: I told you *Cripples don't do stairs* and you took it for a joke. It was not a joke. It was an *inventory.* Of *how much I could not afford to be seen with a radio.* And you used it.' Her back is very straight. 'Don't speak to me today. I will let you know when you can.'\n\nShe puts her headphones on. It is, in its way, a very final sort of door.`,
      onEnter: [{ morale: -2 }, { set: "ilsabet_cold", val: true }, { set: "ilsabet_probation", val: true }],
      choices: [{ text: `Retreat.`, end: true }]
    },
    open_good: {
      speaker: "ilsabet",
      text: `'Take it off.' It comes from Table Four, without preamble, over the top of an oscilloscope. 'The badge. It has the Warden's face on it. I can see the face from here. It's looking at my *cable.*' She has not raised her voice. She has not raised anything. 'Brannic taught me to read, you know. In the second year. When the Principal said a girl in a chair did not *need* to. He'd come at four in the afternoon with a stove-brush and a primer. He said the primer was *for the stove.*' She stares at the screen. 'I am not going to be nice to you. I am going to be *civil*, in the sense that I'm going to keep using your name.'\n\nShe lowers her eyes. 'If you want to talk to me, you will have to put it somewhere I can't see.'`,
      onEnter: [{ set: "ilsabet_d2_met", val: true }, { set: "ilsabet_cold", val: true }, { morale: -1 }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `Osk taught her to read. With a primer he said was for the stove. Nobody told you that. It was not the sort of fact that survives a Static.` },
        { skill: "solidarity", min: 2, text: `We do not say we. She has withdrawn it. It is not a punishment. It is a door she is leaving ajar.` }
      ],
      choices: [
        { text: `[Take off the badge. Put it in your pocket.]`, goto: "good_badge", effects: [{ surv: 2 }, { ideo: "undercurrent", n: 1 }] },
        { text: `'It was necessary, Ilsabet.'`, goto: "good_hard", effects: [{ ideo: "vanguard", n: 1 }] }
      ]
    },
    good_badge: {
      speaker: "ilsabet",
      text: `The badge goes into the pocket with a small cold clink. She watches the gesture, tilting her head, exactly like a person watching a lamp go off. 'There,' she says. 'That's something.' She turns the chair a precise quarter. 'It's not enough. It's a start. A start is a better thing than an ending.' She picks up the screwdriver. 'I can be a good enemy. I would very much rather be a poor friend. I'm in a *very* difficult position.'\n\nThere is, for a moment, a ghost of the old grin. 'So. What do you want?'`,
      onEnter: [{ xp: 2 }, { set: "ilsabet_probation", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    good_hard: {
      speaker: "ilsabet",
      text: `'*Necessary.*' She says it like a coin, bitten. 'I hear it from the Principal, the Matron, the radio. It is a word with a great deal of weight and not much *use.*' She puts on her headphones. 'I'll tell you what is necessary, since you're so *au fait*: the Bell. The Jubilee. The thing that makes everybody forget a janitor in the first place. If you want to be necessary, be necessary to *that.*'\n\nShe turns up the dial. It is a perfectly civil way of ending a conversation. You are not sure you will be able to start another.`,
      onEnter: [{ xp: 1 }, { set: "ilsabet_cold", val: true }],
      choices: [{ text: `Retreat.`, goto: "hub" }]
    },
    open_static: {
      speaker: "ilsabet",
      text: `'*Nine minutes and twelve seconds.*' She has not stopped smiling since you came in. It is a worrying smile, with a great many teeth in it, and her braid has come undone. 'I had the set on, under the table, at the foot of the stage. I heard the carrier *stutter.* For the first time in my whole life, the Bell *hiccuped.* There was a gap in the pulse, a *real* one, at minute four, where your voice was louder than the E-flat.' She taps the oscilloscope. 'I have it *recorded.* On the *screen.* A *wound* in the signal.' Her voice trembles with joy. 'Do you know what that *means?* It means the Bell can be *interrupted.* It is not a law of nature. It's a *machine.*'\n\nShe takes your hand and holds it, for a moment, in both of hers. Her fingers are cold, and inky, and entirely steady.`,
      onEnter: [{ set: "ilsabet_d2_met", val: true }, { morale: 2 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      voices: 3,
      interjections: [
        { skill: "dialectics", min: 3, text: `If the carrier can be interrupted by a voice, then it is a machine. If it is a machine, it can be stopped. The syllogism is short and the conclusion runs to ninety minutes.` },
        { skill: "empathy", min: 4, text: `She has spent a year reading to nobody. Last night, somebody read to *everybody.* She has the face of a person who has been answered.` },
        { skill: "the_grey", min: 3, text: `A wound in the signal. I felt it in the pipes at nine-oh-four. Something moved in me that had not moved since the Cinder Winter.` }
      ],
      choices: [{ text: `'Then it can be built against.'`, goto: "hub" }]
    },
    open_ledger: {
      speaker: "ilsabet",
      text: `'Hello, stranger.' She does not look away from the oscilloscope, but the corner of her mouth has a certain tilt. 'You've got the look of someone who gave something to somebody and *doesn't remember doing it.* It's a very good look. It suits you.' She slides a cup of cold tea across the table. 'I've been recording since two. I picked up something odd on the tram wires: a very faint *answer* to a very faint broadcast. Somebody in the boiler room has been *transmitting* on a handheld with a bad crystal. Reading numbers.' She taps a headphone. 'Dates. Durations. A column headed *WHAT THEY TOOK.* In a woman's voice. Old. Calm. Unhurried.'\n\nA smile, slow and quite delighted. 'I do not think she knows she is doing it.'`,
      onEnter: [{ set: "ilsabet_d2_met", val: true }, { xp: 2 }, { morale: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `An old woman reading numbers into a bad crystal, in her sleep, because the Ledger would not let her go. It is the most beautiful and most dangerous sleepwalking in the Union.` },
        { skill: "solidarity", min: 3, text: `We broadcast without knowing. In our sleep. The Bell takes the memory and not the muscle.` }
      ],
      choices: [{ text: `'She's sending it out.'`, goto: "hub" }]
    },
    open_quiet: {
      speaker: "ilsabet",
      text: `'Hello,' says Ilsabet, with a very careful brightness. 'You look *well.* That's nice. People are meant to look well.' She sets down her pencil. 'I'm going to say something and I want you to know it's not a reproach. It's a *weather report.* Last night you visited Table Four at twenty to nine, looking for me, and asked me, quite sincerely, what I was working on. And I realised: you *meant* it. You didn't remember. You'd given up the whole *of* it, in a cup.' She is quite steady. 'I told you it was a crossword.'\n\nShe looks at you. 'It's all right. I would've drunk the tea, if I were you. I'd have had *two.* But I should like to know whether I can speak freely, or whether I should say *crossword* again.'`,
      onEnter: [{ set: "ilsabet_d2_met", val: true }, { morale: -1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `She told you it was a crossword. A kind lie, for a stranger who had once been her friend. It is the saddest thing anyone has done for you today.` },
        { skill: "volition", min: 3, text: `You can say *crossword.* You can say *tell me.* One of those people will wake up tomorrow with a broken heart and the other with a plan. Choose.` }
      ],
      choices: [
        { text: `'Tell me. Tell me what it is, properly.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }, { xp: 1 }] },
        { text: `'A crossword. That's fine.'`, goto: "quiet_xword", effects: [{ ideo: "quiet", n: 1 }] }
      ]
    },
    quiet_xword: {
      speaker: "ilsabet",
      text: `'A crossword,' she says, and her face is entirely gentle. 'Seven across: *What you do with the thing you cannot bear.* Seven letters.' She turns back to the screen. 'I'll leave you in peace. I'll be here. I'm always here: it's in the Inventory.' A quiet, wry, wrenching smile. 'Come back when you've a word for seven across.'\n\nShe goes back to her cable. She doesn't pretend to be working. She pretends, quite beautifully, not to be waiting.`,
      onEnter: [{ xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    open_other: {
      speaker: "ilsabet",
      text: `'There you are.' She does not so much look up as *swivel.* Table Four is a nest: a hymn-book with its spine cut away, a thicket of copper wire, a lamp with its shade off, a pair of carpet-slippers on the floor with a cable poking out of one like a tail. 'I moved. The Hall was getting *watchy.* The Inspector's car is on the Avenue, and the Matron has a cadet, and Lemmy has *notes.* The library is the one place in the building where *everyone is too polite to look.*' She taps the table. 'Ysolde says the cable is an *archival conduit.* I think she may be a saint.'\n\nShe sets down the soldering iron. 'I have news. And a list. And, I'm afraid, a request. In that order.'`,
      onEnter: [{ set: "ilsabet_d2_met", val: true }, { xp: 1 }],
      interjections: [
        { skill: "senses", min: 3, text: `Rosin, solder, hot copper. The soft electrical tick of an oscilloscope. A faint hiss: the library, ironically, is the noisiest room in the school if you listen to what is *underneath* it.` }
      ],
      choices: [{ text: `'News first.'`, goto: "hub" }]
    },
    hub: {
      speaker: "ilsabet",
      text: [
        `'Mm?' Ilsabet does not look up. A fine blue arc jumps in the dark under the table. 'Don't touch the lamp. Don't touch the cable. Don't touch the *slippers*; they are structural.'`,
        `'Ask. Quickly. I've got a very small window of time and the oscilloscope has opinions.' She wipes her hands on the cardigan. 'Is it a *progress* question or a *morale* question?'`
      ],
      interjections: [
        { skill: "empathy", min: 4, text: `Under the wisecracks, she's grateful. Not for the help: for being asked a question in which she is the expert.` },
        { skill: "senses", min: 4, text: `The hiss from under the table has a pattern now: seven, eleven, seven. She has isolated the pulse on tape. She is *listening to the Bell* the way one listens to a patient.` }
      ],
      choices: [
        { text: `'What is the counter-tone, exactly?'`, goto: "explain", cond: "!flag.ilsabet_counter_plan" },
        { text: `'What do we still need to build it?'`, goto: "status", cond: "flag.ilsabet_counter_plan && !flag.counter_tone_built" },
        { text: `[Give her the blank wax cylinder.]`, goto: "cylinder", cond: "has('cylinder_blank') && flag.ilsabet_counter_plan && !flag.ilsabet_has_cylinder" },
        { text: `'Can the counter be built? I have what you need.'`, goto: "build", cond: "flag.ilsabet_counter_plan && has('cylinder_blank') && has('gregor_tubes') && flag.gregor_bench && !flag.counter_tone_built" },
        { text: `'Tell me about the voice. The one that answered, last October.'`, goto: "tomas", cond: "flag.ilsabet_lamp && !flag.ilsabet_heard_tomas" },
        { text: `'The Choirmaster's collar. Can you take it off?'`, goto: "device", cond: "flag.fenwick_voice && flag.ilsabet_decoded && !flag.ilsabet_device_offered" },
        { text: `'The Inspector. What do you make of him?'`, goto: "voss", cond: "day >= 2 && !flag.ilsabet_voss" },
        { text: `'How are you, Ilsabet?'`, goto: "lonely", cond: "!flag.ilsabet_lonely" },
        { text: `'Not now.'`, end: true }
      ]
    },
    explain: {
      speaker: "ilsabet",
      text: `'Right.' She pulls a sheet of graph paper from under the cardigan and flattens it. A wave, a second wave, a third. 'The Bell is an E-flat, flat by a comma, with a hidden third a minor third *under* it, riding a pulse of seven and eleven. That pulse is the *instruction.* The tone is the *envelope* it's mailed in.' She draws a line. 'A counter-tone is the *same* envelope, with the instruction *turned over.* Not silence: that would only sound like a missing bell, and the brain would *notice* and the Static would rush in to fill the gap.' She taps the page. 'You do not cancel the Harmony. You *replace it.* With a tone that means the opposite. Seven, eleven, *wake.*'\n\nShe looks up. 'It's a lullaby with a reveille underneath. It's the best thing I've ever designed. It is also, I should say, *illegal in eleven ways.*'`,
      onEnter: [{ set: "ilsabet_counter_plan", val: true }, { task: "task_counter", state: "active" }, { xp: 4 }, { thought: "th_wake_tone" }, { note: "task_counter", text: `Ilsabet's counter-tone: the Bell's envelope (E-flat flat by a comma) with the 7-11 instruction turned over, so that the Harmony says WAKE. She needs: the blown tube (done), a blank wax cylinder (Ysolde's Stacks), Gregor's repair bench and tubes (Karsov Avenue), and, ideally, a choir to carry the pedal tone.` }],
      voices: 3,
      interjections: [
        { skill: "dialectics", min: 3, text: `You cannot cancel a forgetting. The mind rushes into silence. You can only replace it. It is the nearest thing to a theorem in the whole of politics.` },
        { skill: "rhetoric", min: 3, text: `Seven, eleven, *wake.* If I could put that on a poster. If I could put that on a *flag.*` },
        { skill: "archive", min: 4, text: `Eleven ways illegal. I counted: the Radio Act (4), Decree on Voices (2), Ministry of Quiet Hours Statute (3), Regulation 62(b) (the acrostic one), and the general prohibition on feelings.` },
        { skill: "solidarity", min: 3, text: `It is a lullaby with a reveille underneath. That is us. That is exactly us.` }
      ],
      choices: [{ text: `'What do you need?'`, goto: "status" }]
    },
    status: {
      speaker: "ilsabet",
      text: `She counts on her fingers, the solder-burned ones. 'One: the tube. You gave me that, a day ago, God knows how. *Done.* Two: a *medium.* A thing to put the counter on that can be played back through the Tower's array without a human hand. Wax cylinder, blank. Ysolde has them in the Stacks, I'm told, but she has not yet let me *in.*' A glance at the rope. 'Three: tubes. *Good* ones. Not the sort the Ministry stamps. Gregor, at the kiosk on the Avenue, has a bench, and a drawer of the real thing. He's not a man who gives them to *kids*.' Four fingers. 'Four: a pitch reference. Somebody who can *carry* the tone in a human voice. The Choirmaster. He doesn't know it yet.' A fifth. 'Five: nerve. That one I can supply myself.'\n\nShe lets her hand drop. 'And *time.* I need to build on a bench, and I need an hour that nobody is watching.'`,
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "deduction", min: 3, text: `Cylinder: the Stacks, behind the rope. Tubes: Gregor, Karsov Avenue. Pitch: Fenwick, in the Hall. Three people, three places, one day. That is a *plan*, in the sense that it is a *list.*` }
      ],
      choices: [{ text: `'I'll bring you what I can.'`, goto: "hub" }]
    },
    cylinder: {
      speaker: "ilsabet",
      text: `She takes the cylinder in both hands, as a cellist takes a bow. It is fat, pale, a little waxy, an artefact of a very different age. 'Oh,' she says. 'Look at *that.*' She turns it under the lamp, sniffs it, runs a fingernail down the seam. 'It's from the *Sound Archive.* It is *pristine.* There is nothing on it. There has been nothing on it for forty years.' She holds it to her cheek. 'I am going to put the thing I love best on it.'\n\nShe sets it, very carefully, in a nest of cardigan on the table. 'One take. I get *one.* I should like it to be a good one.'`,
      onEnter: [{ set: "ilsabet_has_cylinder", val: true }, { xp: 3 }, { morale: 1 }, { note: "task_counter", text: `Gave Ilsabet the blank cylinder. She needs Gregor's tubes and his bench to cut the counter-tone onto it.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    build: {
      speaker: "ilsabet",
      text: `She looks at the tubes you put on the table: a handful of small glass bulbs the colour of beer, each with a neat blue-white filament, each in its own tissue. 'Real,' she breathes. 'Gregor's.' She does not touch them for a long moment. 'He'll have a *price.* He always has a price. Whatever it was, you paid it, and you did not tell me, and I will not ask.' She takes one up between finger and thumb and the light goes through it like a mouthful of honey. 'Right. Give me ninety minutes and your *silence.*'\n\nShe works. You hold the lamp. She does not speak. At the end of ninety minutes a needle comes down on the wax and a tone goes into the cylinder, a plain E-flat flat by a comma, and under it, quiet as a pulse, a seven and an eleven and then, very softly, a *third* number, that does not belong. It is not a sound you can describe. It sounds like the moment before you open your eyes.`,
      onEnter: [{ take: "cylinder_blank" }, { take: "gregor_tubes" }, { give: "counter_tone" }, { set: "counter_tone_built", val: true }, { task: "task_counter", state: "done" }, { time: 90 }, { xp: 8 }, { morale: 3 }, { ideo: "undercurrent", n: 2 }, { thought: "th_wake_tone" }, { note: "task_counter", text: `Ilsabet and I built the counter-tone onto the wax cylinder: the Bell's envelope with a third number that means WAKE.` }, { toast: "Received: The Counter-Tone" }],
      voices: 3,
      interjections: [
        { skill: "senses", min: 3, text: `The needle drops. The wax sings. It is not music. It is *permission.* The kind of sound you hear in the half-second after a door is unlocked.` },
        { skill: "solidarity", min: 3, text: `We built a thing. A tiny, fat, yellow cylinder that says *wake.* It weighs less than a sandwich and it can outvote a Ministry.` },
        { skill: "empathy", min: 4, text: `She is crying quietly onto the cardigan and does not want it noticed. Look at the oscilloscope. Give her a minute.` },
        { skill: "the_grey", min: 3, text: `I felt it go in. A little knot of wake in the district's old throat. It will not hold forever. It does not need to. It needs only to be *played.*` }
      ],
      choices: [{ text: `'It's beautiful, Ilsabet.'`, goto: "hub", effects: [{ morale: 1 }] }]
    },
    tomas: {
      speaker: "ilsabet",
      text: `She goes very still. 'Last October,' she says. 'Yes.' She reaches under the cardigan and takes out the little set, no bigger than a hymn-book, and holds it in her lap. 'It happened again. At *three.* This morning. A very faint, very *tired* voice. A man's. He said: *Lamp, I hear you.* Then he said: *This is Four.* He said: *I can't stop it. I've tried. I'm in the vault. Come.* And then, very quickly: *If anybody asks, the lamp is lit.*' She looks at you. 'He's at the *Relay.* He's the *operator.* He's been listening to me read the weather for a year, from inside the *Bell.*'\n\nHer voice is odd, quite high. 'The man who answered me is the man who rings it. I have been reading *poems* to the Ministry.'`,
      onEnter: [{ set: "ilsabet_heard_tomas", val: true }, { set: "lamp_phrase", val: true }, { xp: 5 }, { thought: "th_double_agent" }, { note: "task_relay", text: `Ilsabet heard the voice again at 03:00: a tired man, 'This is Four. I can't stop it. I've tried. I'm in the vault. Come. If anybody asks, the lamp is lit.' The Relay operator has been listening to Little Lamp for a year. Password: 'the lamp is lit.'` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `A man alone in a concrete box for a year, listening to a girl read the weather to nobody. He was not an enemy. He was her only audience.` },
        { skill: "deduction", min: 3, text: `'I can't stop it. I've tried.' So he *knows.* The man at the console is not a believer. He is a prisoner with the only key to the room.` },
        { skill: "instinct", min: 3, text: `*The lamp is lit.* It is a password, and a plea, and the first thing he ever said that was not a duty.` }
      ],
      choices: [{ text: `'If I go to the Relay, I can use that.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }, { text: `'It might be a trap.'`, goto: "tomas_trap" }]
    },
    tomas_trap: {
      speaker: "ilsabet",
      text: `'It might.' She nods at once. 'I *thought* of that. I've spent two days thinking of nothing else. A man with a voice like a damp towel, inside the transmitter, asking a girl in a chair to *come.*' A bleak, brisk smile. 'It's exactly the sort of bait an Inspectorate would use. It's *also* exactly what a lonely man would say. I can't tell the difference. I'm told that's a *feature* of loneliness.' She puts the set away. 'Make up your own mind. I trust you with it. That is a whole sentence, from me, in the present tense.'`,
      onEnter: [{ xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    device: {
      speaker: "ilsabet",
      text: `'The collar.' Her eyes go sharp. 'The little ring they put against the larynx. A *resonator.* It hums at the same frequency as the muscles that sing, and the muscles lose the argument.' She is already sketching on the graph paper. 'I've never seen one. But if it is what I think, it is a very simple thing: a coil, a crystal, a battery the size of a pill. A man with a tuning fork and a patient hand could *detune* it, without a scar.' She puts down the pencil. 'He'd have to *consent.* I do not do things to people's throats without a signed note. But if he asked me, if he came, with the thing in his hand, I think he could sing a *full voice* for about an hour.'\n\nShe looks up. 'It'd be the best hour he's had since the spring.'`,
      onEnter: [{ set: "ilsabet_device_offered", val: true }, { xp: 3 }, { note: "task_choir2", text: `Ilsabet says she could detune Fenwick's resonator collar with a tuning fork: a full voice for about an hour, if he consents.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `A man who has not been able to sing since the spring, restored for an hour by a girl in a chair. It is the single most beautiful trade you will be offered this week.` }
      ],
      choices: [{ text: `'I'll ask him.'`, goto: "hub" }]
    },
    voss: {
      speaker: "ilsabet",
      text: `'The Inspector.' She wrinkles her nose. 'He came by the library at seven-forty. He stood at the door of the reading room. He did not come *in.* He stood there, very *quiet*, with his hat in his hand, looking at my cable.' She pulls the slippers a little closer, protectively. 'He looked at it for about a minute. And then he looked at *me.* And then he nodded, once. Like a man at a funeral who sees someone he knows. And left.' She hunches. 'He *knew.* He knew what the cable was for. And he didn't say a word, and I've been *waiting* for that word all morning.'\n\nShe taps the table. 'I'd like to know what kind of man gives me a day. It's the sort of thing a person does when they are *planning to take two.*'`,
      onEnter: [{ set: "ilsabet_voss", val: true }, { xp: 2 }, { note: "task_voss", text: `Voss stood at the reading-room door at 07:40 with his hat in his hand and looked at Ilsabet's cable for a minute. Nodded once. Left without a word. 'A man who gives you a day is planning to take two.'` }],
      interjections: [
        { skill: "instinct", min: 3, text: `He knew. He gave her a day. He is counting. He likes to give people just enough time to hang themselves very comfortably.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    lonely: {
      speaker: "ilsabet",
      text: `The question catches her off-guard. For a second she doesn't know what to do with her hands. 'I'm,' she says. 'I'm *fine.* I have a cable. I have *work.*' She laughs, once, quite badly. 'I'm *tired.* Of being useful. Of being the one who has the plan.' She looks at the screen. 'I have been the only person who *remembers* things for so long. Not the Static. I'm Static like everyone. But I *write it down.* I write down everything. I have eleven notebooks. Every morning I read them, and I'm *astonished.* It's like reading about a very brave girl who is not me.'\n\nA small, crooked breath. 'It's nice to be asked. Nobody asks. They ask if I have a *tube.*'`,
      onEnter: [{ set: "ilsabet_lonely", val: true }, { xp: 3 }, { morale: 1 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `A girl who writes everything down because nobody else will. She is the Ministry's most efficient enemy and its loneliest.` },
        { skill: "empathy", min: 3, text: `*Like reading about a very brave girl who is not me.* She does not believe she is her own heroine. Someone should tell her. Probably more than once.` }
      ],
      choices: [{ text: `'You are the brave girl.'`, goto: "hub", effects: [{ morale: 1 }, { set: "ilsabet_ally", val: true }] }, { text: `Sit with her. Say nothing.`, goto: "hub", effects: [{ xp: 1 }, { set: "ilsabet_ally", val: true }] }]
    }
  }
},

// ============================================================ FENWICK, DAY 2
fenwick_d2: {
  title: "Choirmaster Alder",
  start: [
    { cond: "flag.fenwick_d2_met", node: "hub" },
    { cond: "flag.osk_scapegoat", node: "open_good" },
    { cond: "flag.verdict_static", node: "open_static" },
    { cond: "flag.fenwick_choir_ready", node: "open_ready" },
    { node: "open_other" }
  ],
  nodes: {
    open_good: {
      speaker: "fenwick",
      text: `'Ah.' The thin man's baton comes down, a little too fast, and he turns away. 'My, ah, my student. The, ah, the one with the *badge.*' He studies the empty choir risers. 'Brannic used to bring me tea. Every morning, at ten to eight, from the stove. In the *tin cup.* He never said anything. He only put it on the piano and went to *sweep.*' His voice is a strained thread. 'I did not know that he was a, ah, a *listener.* He used to stand at the back, behind the last pillar, and *hum.* Very softly. Under the *Anthem.* I never turned round. I did not want to *frighten* him.'\n\nHe takes out the handkerchief and does not use it. 'I should have turned round.'`,
      onEnter: [{ set: "fenwick_d2_met", val: true }, { morale: -1 }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `A man who never turned round to look at a man who was humming behind him, because the humming was the point. He has never forgiven himself the respect.` },
        { skill: "solidarity", min: 3, text: `Osk hummed under the Anthem. For years. A choir of one, behind a pillar. We never knew he was ours.` },
        { skill: "doublethink", min: 2, text: `A sentimental old man. These things happen. A janitor, a hum. It will all be so much tidier by Friday.` }
      ],
      choices: [
        { text: `'I'm sorry I took him from you.'`, goto: "hub", effects: [{ xp: 2 }, { morale: -1 }, { set: "fenwick_cold", val: true }] },
        { text: `'He'd want the song sung.'`, goto: "hub", effects: [{ xp: 2 }, { ideo: "undercurrent", n: 1 }] }
      ]
    },
    open_static: {
      speaker: "fenwick",
      text: `'My student!' He catches you by both elbows, a frail, trembling grip. 'I was, ah, I was *conducting.* In the Hall. During the, the broadcast. I did not *decide* to. My hand *went up.*' His whole face is wet and shining. 'I conducted the *numbers.* Each figure had a little *lift* to it, you see, a *shape*, and the Anthem went on underneath, under your voice, a kind of drone, and I thought: *they are in the same key.* They were. For nine minutes your voice and the Bell were in the *same key.*' He laughs, a cracked, wild sound. 'And at minute six the choir, the *fourteen*, joined in. In *parallel fifths.* It was *appalling.* It was *glorious.* I have never been prouder of a musical error.'\n\nHe lets go and wipes his eyes. 'They have taken my baton. I do not care. I have *another.*'`,
      onEnter: [{ set: "fenwick_d2_met", val: true }, { morale: 2 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "solidarity", min: 3, text: `The choir joined in. Fourteen children in parallel fifths. It was the first time in six years they had sung something that was not a recording.` },
        { skill: "empathy", min: 3, text: `He conducted your numbers. A choirmaster found the music in a column of figures. It is the closest thing to a love poem the Ledger will ever get.` }
      ],
      choices: [{ text: `'You're a hero, Mr Alder.'`, goto: "hub" }]
    },
    open_ready: {
      speaker: "fenwick",
      text: `'My student,' says Fenwick, and he is standing quite differently: shoulders back, chin up, the baton held like a pen. 'It is, ah, *progress.* I have had, ah, *seven* of the children in at six this morning. I told them it was a *remedial pitch exercise.* Which it was. We hummed. For an hour.' His eyes are very clear. 'I did not tell them what. I only gave them the *first line* and let their mouths do the rest. By seven they had all five verses. And they did not ask *why.* Do you see? They did not ask *why.* The ones in the third row were *crying* and did not know it.'\n\nHe adjusts his tie. 'We have a rehearsal at noon. It is, ah, I think, a *commission.*'`,
      onEnter: [{ set: "fenwick_d2_met", val: true }, { xp: 1 }, { morale: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `Crying and not knowing why. That is what the song does. It goes round the head and in at the heart.` },
        { skill: "solidarity", min: 3, text: `Seven children humming a song they were never taught. It is the oldest form of resistance and it takes about an hour.` }
      ],
      choices: [{ text: `'A commission?'`, goto: "commission" }]
    },
    open_other: {
      speaker: "fenwick",
      text: `'Ah! My, ah, my student.' The thin man turns on the podium. 'You find me in a, ah, a *state.* Do you know that I have been *commissioned?*' He says it as one might say *I have been bitten.* 'The Principal. At seven. A telegram from the *Inspectorate.* The choir is to *sing at the Jubilee.* Thursday. Twenty hundred. From the *Tower.* The Anthem, with the Bell. In *front* of the District. In front of the *Inspector.*' He is pale. He is, simultaneously, radiant. 'I have waited six years for someone to ask the choir to sing in public. I had not foreseen it would be *this.*'\n\nHe fumbles with the baton. 'It is a very great honour. It is also, I rather suspect, the *last thing* I shall be asked to do.'`,
      onEnter: [{ set: "fenwick_d2_met", val: true }, { xp: 1 }],
      interjections: [
        { skill: "instinct", min: 3, text: `A commission to sing at the Jubilee. From the Tower. With the Bell. That is not a coincidence. That is a *carrier.* They are going to put the choir inside the Harmony.` },
        { skill: "empathy", min: 3, text: `He is happy and terrified in the same breath. It is the rarest and most exhausting combination there is.` }
      ],
      choices: [{ text: `'What do they want you to sing?'`, goto: "commission" }]
    },
    commission: {
      speaker: "fenwick",
      text: `'The Anthem.' He presses the baton against his chest. 'Four verses, in D, with the pedal tone on the Bell. They want it *arranged.* For the occasion.' He takes a sheet of score paper from the music stand and holds it out, pencilled, annotated, covered in anxious crossings-out. 'The *Ministry* has sent a *note.* A suggestion. *The final chord is to be held for ninety seconds, to allow the Grand Harmony to take effect.*' His voice is flat. 'I am to hold a *chord.* For a minute and a half. So that a *tone* can slide under it.'\n\nHe looks at you. 'It is, ah, the same tone. Isn't it? That I hear. At nine. The seven, and the eleven.' A very small, steady voice. 'They want my *choir* to carry it.'`,
      onEnter: [{ set: "fenwick_commission", val: true }, { task: "task_choir2", state: "active" }, { xp: 3 }, { thought: "th_grand_harmony" }, { note: "task_choir2", text: `Fenwick's choir has been commissioned to sing the Anthem from the Tower at the Jubilee (Thursday 20:00). The Ministry's note: hold the final chord for ninety seconds 'to allow the Grand Harmony to take effect'. They want the choir to carry the Bell's tone.` }],
      voices: 3,
      interjections: [
        { skill: "dialectics", min: 3, text: `The choir is the carrier. A chord held for ninety seconds is the *vehicle.* The Ministry has asked the only man in the district who can hear the tone to deliver it. It is, as a piece of cruelty, rather elegant.` },
        { skill: "rhetoric", min: 3, text: `And what if the vehicle were loaded with something else? A chord is only a container. The question is who fills it.` },
        { skill: "empathy", min: 4, text: `He has understood. In one breath he has gone from honoured to complicit. He is waiting for somebody to tell him it is not too late.` }
      ],
      choices: [
        { text: `'What if the chord said something else?'`, goto: "idea" },
        { text: `'Don't sing it.'`, goto: "dont" }
      ]
    },
    idea: {
      speaker: "fenwick",
      text: `He stands very still. The baton slowly lowers. 'Something else.' He says it as one tests a bridge. 'A chord has a root. A third. A fifth. The Bell sits on the root: E-flat, flat by a comma. And underneath it, the *seven and eleven*, a rhythm on the minor third.' He walks to the piano, one hand out, the way a blind man finds a wall. 'If the third were *major.* If the whole choir sang a major third where the Bell has the minor. *Held.* It would change what the tone *meant.* Not the pitch. The *colour.*' He strikes a chord, softly. 'Minor says: *sleep.* Major says...'\n\nHe strikes it again. 'It says *wake.*'`,
      onEnter: [{ set: "fenwick_idea", val: true }, { xp: 4 }, { thought: "th_wake_tone" }, { note: "task_choir2", text: `Fenwick's idea: if the whole choir sang a major third where the Bell has the minor and held it, the tone would mean WAKE instead of sleep. It needs the choir's nerve, Ilsabet's numbers, and a score they can all read.` }],
      interjections: [
        { skill: "solidarity", min: 2, text: `Minor says sleep. Major says wake. The whole of the revolution in one semitone. We have always been about a semitone from freedom.` },
        { skill: "senses", min: 4, text: `You can hear it as he plays it: the shadow of the chord changes colour. A cold room warming by half a degree.` }
      ],
      choices: [{ text: `'Can the choir do it?'`, goto: "hub" }]
    },
    dont: {
      speaker: "fenwick",
      text: `'Not sing it.' He tries the phrase like a stale biscuit. 'My dear student. If I do not sing it, the Principal will find someone who will. A recording. A, ah, a *machine.* And the tone will go out regardless.' He sets the baton down. 'The thing about refusing, ah, is that it does not stop what you refused. It only *removes your hands.*' A pale, shaky smile. 'I should rather be *inside* it. With my hands on it. It is, I think, the only form of courage that a man of my build can afford.'`,
      onEnter: [{ xp: 2 }, { set: "fenwick_refusal_heard", val: true }],
      choices: [{ text: `'Then use your hands.'`, goto: "idea" }, { text: `'I understand.'`, goto: "hub" }]
    },
    hub: {
      speaker: "fenwick",
      text: [
        `'Ah, my student.' Fenwick lowers the baton the width of a hair. 'Forgive me. I am, ah, in the *middle* of a modulation. What can the arts do for you?'`,
        `He taps the score. 'Eleven days ago I should have said I had nothing left to give the world. I have, I find, a *chord.*'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `Rosin, pencil, and under it, a smell of fresh tea. Somebody has been keeping his tin cup full. It is a small thing. It makes his hand less unsteady.` },
        { skill: "empathy", min: 4, text: `He is not afraid. He is *nervous*, which is a different thing and a good one: he has something to lose, and he is not losing it.` }
      ],
      choices: [
        { text: `[Show him the full Lantern Song score.]`, goto: "score", cond: "has('choir_score') && !flag.fenwick_score_shown" },
        { text: `[Run a rehearsal of the arrangement with the choir.]`, goto: "rehearsal", cond: "flag.fenwick_idea && flag.fenwick_score_shown && !flag.choir_wake_arrangement" },
        { text: `'The Choirmaster's collar. Ilsabet could take it off.'`, goto: "device", cond: "flag.ilsabet_device_offered && !flag.fenwick_voice_freed" },
        { text: `'Who could we ask to join the choir?'`, goto: "recruit", cond: "flag.fenwick_idea && !flag.fenwick_recruit_asked" },
        { text: `[Bring Tobar to the rehearsal.]`, goto: "tobar", cond: "flag.bronka_offers_tobar && !flag.fenwick_tobar_joined" },
        { text: `'Did the Inspector come to the rehearsal?'`, goto: "voss", cond: "day >= 2 && !flag.fenwick_voss" },
        { text: `'Would the choir sing it the way you've arranged it, if it came to it?'`, goto: "ready", cond: "flag.choir_wake_arrangement && !flag.fenwick_ready_said" },
        { text: `'Not now, Mr Alder.'`, end: true }
      ]
    },
    score: {
      speaker: "fenwick",
      text: `You lay the manuscript on the lid of the piano. For a long time he does not touch it. Then he lowers himself onto the stool, as if the stool were a very old and respected relative, and turns the first page with one finger. 'Verse six,' he murmurs. 'Verse six. I have been trying to remember verse six for *fourteen years.*' His lips move. The tune is in his mouth like a boiled sweet. 'It goes *up.* I always thought it went *down.* It goes up, on *wake*: *and the lantern shall be wakened.*' A cracked, astonished laugh. 'I have been singing the wrong *direction* of hope.'\n\nHe turns another page, and a third, and when he comes to the margin note, *If the whole choir sings the last line at once, the Bell will not be able to answer it*, he sits motionless for a very long time.`,
      onEnter: [{ set: "fenwick_score_shown", val: true }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }],
      voices: 3,
      interjections: [
        { skill: "solidarity", min: 2, text: `We have been singing it downhill for fourteen years. It turns out it was meant to climb.` },
        { skill: "archive", min: 3, text: `'And the lantern shall be wakened.' *Wake.* The word was in the verse before it was in the counter-tone. Somebody who wrote a lullaby also wrote the key to waking up from it.` },
        { skill: "empathy", min: 4, text: `He is not reading. He is *listening*, through the page, to a woman folding sheet-music in a cold house. His whole body leans toward her.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    rehearsal: {
      speaker: "fenwick",
      text: `The choir arrives in ones and twos, in the dark blazers they are not permitted to wear outside the Hall, and assembles on the risers with the quiet haste of children who have been told something will not be repeated. There are twelve. Fenwick stands before them with the baton and the score, with no one watching but you, and says, in a voice that has not been heard in this Hall for six years, *'From the first line. Softly. As though you are afraid to wake someone.'*\n\nThey begin. It is ragged. It is *terribly* out of tune. But under the raggedness, from the third row, a thread of something rises: a pitch, a *colour*, a major third where it should not be.\n\nHe lifts his hand. He does not know yet that you are holding your breath.`,
      voices: 3,
      interjections: [
        { skill: "senses", min: 3, text: `Twelve children, a major third. It is wrong in the *right* way: wrong the way a window is wrong in a wall.` },
        { skill: "empathy", min: 3, text: `The smallest one in the front row is mouthing along and hasn't a note, but she holds her chin up like a standard-bearer.` }
      ],
      choices: [
        { text: `[Hold the choir's attention while they find the third.]`, check: { skill: "authority", diff: 10, id: "fenwick_d2_rehearse_authority", white: true, pass: "rehearse_ok", fail: "rehearse_flat" } },
        { text: `[Sing the line under them; be the floor they stand on.]`, check: { skill: "solidarity", diff: 9, id: "fenwick_d2_rehearse_solidarity", white: true, pass: "rehearse_ok", fail: "rehearse_flat" } },
        { text: `[Find the pitch in your own ringing, and give it to the front row.]`, check: { skill: "senses", diff: 11, id: "fenwick_d2_rehearse_senses", white: true, pass: "rehearse_ok", fail: "rehearse_flat" } }
      ]
    },
    rehearse_ok: {
      speaker: "narrator",
      text: `It happens on the third pass. A single child, a boy of eleven with enormous ears, finds the third and *holds* it, and the child beside him hears it and goes to it, and then the next, like a row of lamps being lit along a corridor. The sound locks. It is *wrong.* It is wrong in the sweetest way: a chord that leans toward morning. The ringing in your ears, which has been a thread of tin since you were six, answers it, rises to it, and for a moment you are not alone in your own head.\n\nFenwick's hand drops. His baton drops. He does not seem to notice. He is crying, quite quietly, in the full light of the Hall, with the unashamed face of a man whose instrument has just come back to him. 'There,' he whispers. 'There it is. *There it is.*'`,
      onEnter: [{ set: "choir_wake_arrangement", val: true }, { set: "choir_rehearsed", val: true }, { xp: 8 }, { morale: 3 }, { ideo: "undercurrent", n: 2 }, { thought: "th_wake_tone" }, { note: "task_choir2", text: `Rehearsed the choir. On the third pass they found the major third and held it. The arrangement works: the Anthem will carry WAKE under the Bell.` }],
      voices: 3,
      interjections: [
        { skill: "solidarity", min: 2, text: `We. That is the sound of it. A child hears another child and goes to her. It is what we have always done, and we have never had a chord for it.` },
        { skill: "the_grey", min: 3, text: `The plaster rang. I felt it. For the first time in this building a chord went into the walls and *stayed.*` },
        { skill: "volition", min: 4, text: `Remember this. Whatever the Bell takes tonight, a boy of eleven with enormous ears held a major third in a Ration Hall. That is a fact. It has been *done.*` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    rehearse_flat: {
      speaker: "fenwick",
      text: `It is, regrettably, a mess. The third dissolves into the fifth and the fifth into somebody's cough, and the boy with the enormous ears bursts into tears and has to be consoled by two girls with handkerchiefs. 'Ah,' says Fenwick, gently. 'Ah. Well. That is, ah, *how it goes.* The first time. It is always a *noise* the first time.' He claps his hands. 'We shall do it again. After lunch. Everybody *eat.* A choir is a stomach with a voice.'\n\nHe turns to you and says, privately, 'It is not your fault. It is *physics.* We need more of us, and more of the, ah, *nerve.*'`,
      onEnter: [{ morale: -1 }, { time: 20 }, { xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    device: {
      speaker: "fenwick",
      text: `He touches his collar, instinctively, as a man touches a bruise. 'A girl in a chair,' he says. 'With a *screwdriver.*' He tries not to laugh and fails. 'My dear student. It has been *six years.* I had given up asking whether it could be, ah, *removed.* The surgeon said *not without a scar to match.*' He undoes the top button. The ring of shiny skin catches the light. 'If I were to say *yes*, and it were *wrong*, I should not have a voice at all. If I were to say *yes* and it were *right*...' He stops. 'Is it a very great risk?'\n\nYou tell him the truth: it is a girl, a tuning fork, an hour, and a promise. He listens. He buttons the collar. He unbuttons it again.`,
      choices: [
        { text: `[Persuade him: this is the hour he'll have a voice for.]`, check: { skill: "rhetoric", diff: 10, id: "fenwick_d2_device_rhetoric", white: true, pass: "device_yes", fail: "device_no" } },
        { text: `[Appeal to the child who hums behind the pillar.]`, check: { skill: "empathy", diff: 9, id: "fenwick_d2_device_empathy", white: true, pass: "device_yes", fail: "device_no" } },
        { text: `'It's your decision.'`, goto: "hub" }
      ]
    },
    device_yes: {
      speaker: "fenwick",
      text: `'Yes,' he says. 'Yes, I think. *Yes.*' He takes a steadying breath. 'Tell the young lady, ah, to bring the fork. Tell her to bring *two.* In case I am *loud.*' He looks at his own hands. 'I have been, ah, *careful*, for six years, you see. I have been so careful that I have forgotten what it is for.'\n\nLater, in the library, under Table Four, a tuning fork sings against a ring of brass, and a tiny ping goes through the room, and a thin man in a shabby suit sings, quite softly, a single note: an E-flat, flat by a comma, *clear.* It goes through the cracks in the shelves and is gone. Ysolde looks up from her stamp. Nobody says a word. The whole library is a held breath.`,
      onEnter: [{ set: "fenwick_voice_freed", val: true }, { xp: 6 }, { morale: 3 }, { ideo: "undercurrent", n: 2 }, { thought: "th_collective_pulse" }, { time: 30 }, { note: "task_choir2", text: `Ilsabet detuned Fenwick's collar. He sang a single clear E-flat in the library. He will have a full voice for about an hour. We must choose the hour.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `He sang one note. It took six years. Don't tell him it was beautiful. He knows. He is standing very still so as not to spoil it.` },
        { skill: "solidarity", min: 2, text: `One note in a library, and a whole room stopped. That is what a voice is for. It is a very small thing that cannot be stopped from being large.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    device_no: {
      speaker: "fenwick",
      text: `'No,' he says, with real pain. 'No. I, ah. I am *sorry.* I cannot do it today.' He buttons the collar, and his fingers are shaking. 'It is the *risk.* If I lose the little I have, I shall not be able to conduct the *breath.* It is not *cowardice*, I hope. It is *arithmetic.* The choir needs a man who can *stand* more than it needs one who can *sing.*' He looks at you, ashamed. 'Ask me again, ah, tomorrow. When I have thought of it enough to be *afraid* properly.'`,
      onEnter: [{ morale: -1 }, { xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    recruit: {
      speaker: "fenwick",
      text: `'Voices.' He sinks onto the piano stool and counts on his fingers. 'I have twelve, of whom nine can hold a pitch. I should like *twenty.* I should like, ah, a *bass.* A true one. And a very good *tenor.* A *loud* one.' He lowers his voice. 'It must be *volunteers.* I will not recruit children into a *danger.* But if there are, ah, *persons*, who would sing for the *sake* of it...' He gazes into the middle distance. 'The small one in the dormitory, Wren, I understand, has a *very* clear head-voice. A, ah, *soprano* of unusual penetration. And the Hall monitor, Tarsk, once sang a *solo* in the Second Form that made the Warden's portrait *flinch.*'\n\nHe looks at you hopefully. 'If you were to *mention* it.'`,
      onEnter: [{ set: "fenwick_recruit_asked", val: true }, { xp: 2 }, { note: "task_choir2", text: `Fenwick wants volunteers for the choir: a bass, a loud tenor. He mentions Wren (soprano of 'unusual penetration') and Lemmy Tarsk (once made the Warden's portrait flinch). Tobar, perhaps.` }],
      choices: [{ text: `'I'll mention it.'`, goto: "hub" }]
    },
    tobar: {
      speaker: "narrator",
      text: `He arrives at noon, in his late forties, round, quiet, in a cook's husband's cardigan, led by the hand by a woman in an apron who looks at nobody. He has a face like warm butter. He stops at the foot of the risers. Fenwick, on the podium, goes entirely still. 'Tobar,' he says. 'Tobar *Hask.* *Tenor.*' The round man tilts his head, politely, a man at a bus stop being addressed by a stranger. 'Excuse me,' he says. 'I'm not sure that I...' Then he sees the choir's music-stand. He takes a step toward it. He puts out a hand, and picks up the sheet-music, and, without thinking, folds it into a little boat.\n\nThen, standing quite alone in the middle of the Ration Hall, he hums. Verse six. *Up.*`,
      onEnter: [{ set: "fenwick_tobar_joined", val: true }, { set: "tobar_sings", val: true }, { xp: 6 }, { morale: 3 }, { ideo: "undercurrent", n: 2 }, { thought: "th_chosen_family" }, { add: "choir_voices", n: 4 }, { note: "task_choir2", text: `Tobar Brodsky came to the Hall and, with no memory, folded the music into a boat and hummed verse six: up. Fenwick wept. Bronka did not look up from the zinc.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `He doesn't know her. He doesn't know the choir. He knows the music. The body is the last thing the Bell can reach, and the first thing love gets back.` },
        { skill: "solidarity", min: 2, text: `Bronka is not looking. She is standing at the counter with her back to the room and her shoulders shaking. Let her have that. It is her privacy and it is also her prayer.` },
        { skill: "the_grey", min: 3, text: `I know a hum when I hear one. It sounds like a house settling after a winter. I think it is, in fact, a man coming home.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    voss: {
      speaker: "fenwick",
      text: `'The Inspector.' Fenwick's baton stops. 'He came at ten to seven. Alone. He sat in the back row of the empty Hall, with his hat on his knee. He did not speak. I did the Anthem, because it was what I had.' A thoughtful pause. 'At the end he said, *Thank you. That was very correct.* And then, ah, he asked if I knew another song. Not an *Anthem.* A *lullaby.* He said, *Something a woman might sing while folding sheet-music.*' He swallows. 'I said I did not know it.'\n\nHis hand trembles on the baton. 'He said, *Of course you don't.* And he hummed the first four bars. Quite softly. *Perfectly in tune.* And then he stood up and left.'\n\nThe silence is long. 'He knows the Lantern Song, my student. I should very much like to know how.'`,
      onEnter: [{ set: "fenwick_voss", val: true }, { xp: 4 }, { thought: "th_inspector_charm" }, { note: "task_voss", text: `Voss sat in the back of the Hall at 06:50 and asked Fenwick for 'a lullaby, something a woman might sing while folding sheet-music'. Fenwick denied it; Voss hummed the first four bars perfectly in tune. He knows the Lantern Song.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 4, text: `The Lantern Song. A man who folds paper boats and hums a lullaby he cannot place. There is a woman in this story. There is a child.` },
        { skill: "deduction", min: 3, text: `*Something a woman might sing while folding sheet-music.* He is describing a specific woman. He has *seen* her do it. A voice that is not yet his own is guiding him.` },
        { skill: "instinct", min: 3, text: `He isn't the enemy of the song. He is its *last* listener. If the choir sings it right, he will not be able to stop himself from remembering.` }
      ],
      choices: [{ text: `'Then he's the one it will reach.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }]
    },
    ready: {
      speaker: "fenwick",
      text: `'If it came to it.' He folds his hands. 'I shall be, ah, *honest.* There are, I think, twelve who would sing it. And perhaps eight more who would sing it if they saw the first twelve do so.' He looks up. 'That is not an army. It is a *choir.* But a choir is a thing the Bell has never had to *answer.* It can silence a person. It can scramble a crowd. It has no plan, as far as I know, for a *chord.*' A small, firm smile. 'Yes. We will sing it. Whatever it costs. I have, ah, been very *quiet* for six years. I should like to try being the other thing.'`,
      onEnter: [{ set: "fenwick_ready_said", val: true }, { xp: 3 }, { morale: 2 }, { set: "choir_ready_d2", val: true }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    }
  }
},

// ============================================================ LEMMY, DAY 2
lemmy_d2: {
  title: "Lemmy Tarsk",
  start: [
    { cond: "flag.lemmy_d2_met", node: "hub" },
    { cond: "flag.lemmy_spared || flag.lemmy_confessed", node: "open_spared" },
    { cond: "flag.lemmy_armband_worn || has('vanguard_armband')", node: "open_armband" },
    { node: "open_other" }
  ],
  nodes: {
    open_spared: {
      speaker: "lemmy",
      text: `'Citizen!' He starts to salute, remembers he is not supposed to, and ends up doing a sort of nervous wave. 'I wasn't, that is, I have *not* paid the dues. I have not paid them *twice.* I want you to know. I have been, ah, *standing in the corridor* since six o'clock waiting for Rhea Vantage to come and stand and *look* at me.' He swallows. 'She has not come. I do not know what that means. It is like waiting for a *weather.*' His pen shakes. 'And the Inspector has *noticed* me.'\n\nHe lowers his voice. 'He gave me a *job.*'`,
      onEnter: [{ set: "lemmy_d2_met", val: true }, { xp: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: `He is more afraid of the absence of Rhea than he was of her presence. A child who has been hit for years does not know what to do with a quiet room.` },
        { skill: "instinct", min: 3, text: `*The Inspector has noticed me.* He is not frightened of Voss. He is delighted. It is the first time anyone with a good coat has looked at him as if he were useful.` }
      ],
      choices: [{ text: `'What job?'`, goto: "job" }]
    },
    open_armband: {
      speaker: "lemmy",
      text: `'*Sergeant!*' He comes to attention so hard that his heels clap. 'I mean: *Cadet.* I mean: *citizen.* I mean: the armband is *regulation.* It sits *beautifully.*' His eyes shine at the sight of it. 'The Inspector said that a *well-turned* armband is the mark of an orderly mind.' He catches himself and lowers his voice. 'He gave me a *job.* I am meant to *log.* Everyone who goes into the Principal's office. I have a *pen* and a *form.*' He pats his satchel. 'I have, ah, a *very* long list already.'\n\nHe looks at you, uncertainly. 'You're on it. Twice. I did not *mean* to put you down. It is a very *difficult* pen.'`,
      onEnter: [{ set: "lemmy_d2_met", val: true }, { surv: 2 }],
      interjections: [
        { skill: "authority", min: 3, text: `A BOY WITH A FORM. A FORM WITH YOUR NAME. THE PEN IS A VERY SMALL WEAPON AND HE IS HOLDING IT BY THE WRONG END.` },
        { skill: "doublethink", min: 2, text: `He's a good boy. A good boy with a good list. You should be glad to be on it. Think how awful to be *missing.*` }
      ],
      choices: [{ text: `'What job?'`, goto: "job" }]
    },
    open_other: {
      speaker: "lemmy",
      text: `'HALT, citizen-student.' He barely has the energy to say it. He has a new pen, a bright steel one, with a clip. 'Per Regulation Twelve: *Interrogatory Greeting*.' He pauses. 'Oh, I don't know the rest. I *did.* I knew all of them on Tuesday.' His ears are a little red. 'I'm very tired. I stood in the Hall last night through the *whole* broadcast, I mean the *Bell* broadcast, and when I woke up I had a *list* in my pocket. In *my* handwriting. Of names. I do not know *why.*'\n\nHe holds up a sheet of foolscap, folded very small. 'And the Inspector has noticed me. He gave me a *job.*'`,
      onEnter: [{ set: "lemmy_d2_met", val: true }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 3, text: `A list in his own handwriting, in his pocket, that he doesn't remember writing. Yesterday-Lemmy was *doing something.* He kept notes.` },
        { skill: "empathy", min: 3, text: `He is so very tired. A fifteen-year-old standing guard at a corridor with a new pen, wondering what he did in the night.` }
      ],
      choices: [{ text: `'What job?'`, goto: "job" }]
    },
    job: {
      speaker: "lemmy",
      text: `'The Inspector said that I have *an unusual aptitude for observation.*' He is so proud that he can barely get it out. 'He said I was to be a *Student Liaison, Grade Zero.* I have a *form.* I record who goes in, who comes out, how long they stay, and what they, ah, *look like* when they leave.' He taps the satchel. 'I am to bring it to him at six. In *person.* He has promised, ah.' He lowers his voice and his eyes go very bright. 'He has promised that if I do it *well*, he will see that my mother is *moved.* To a flat with a *window.*'\n\nHis whole face is hope. It is quite unbearable to look at. 'Isn't that *kind?*'`,
      onEnter: [{ task: "task_lemmy", state: "active" }, { xp: 2 }, { note: "task_lemmy", text: `Voss has made Lemmy a 'Student Liaison, Grade Zero': he logs everyone who enters the Principal's office, with a form, to be handed to Voss at six. In return Voss promised Lemmy's mother a flat with a window.` }, { note: "task_voss", text: `Voss recruited Lemmy as a 'Student Liaison, Grade Zero' to log who visits the Principal. He promised Lemmy's mother a flat with a window.` }],
      voices: 3,
      interjections: [
        { skill: "empathy", min: 3, text: `A flat with a window. That is all it costs. A mother, a window, a boy with a pen. It is the cheapest price the Ministry has ever paid for a soul and it will still be too high.` },
        { skill: "instinct", min: 3, text: `He believes it. That is the horror. Voss will keep the promise. He keeps all his promises. It is the most effective thing about him.` },
        { skill: "rhetoric", min: 3, text: `Never bribe a person with something they want for someone else. They will never forgive you for how well it worked.` }
      ],
      choices: [
        { text: `'That's very kind, Lemmy. Be careful.'`, goto: "hub" },
        { text: `'What's he asked you to write about me?'`, goto: "log" },
        { text: `'He's using you.'`, goto: "using" }
      ]
    },
    hub: {
      speaker: "lemmy",
      text: [
        `'Citizen.' Lemmy has taken to holding his clipboard over his chest like a shield. 'Is this a *social* call? I am *permitted* a social call when it is, ah, *between engagements.*'`,
        `He glances at the Principal's door. 'You've, ah, *seen* the log. I, I should not *discuss* it. But I *might.*'`
      ],
      interjections: [
        { skill: "senses", min: 4, text: `Under the starch, a smell of fear and mint. He is sucking a peppermint to keep his hands from trembling.` }
      ],
      choices: [
        { text: `'What have you written about me?'`, goto: "log", cond: "!flag.lemmy_log_seen" },
        { text: `'Voss is using you.'`, goto: "using", cond: "!flag.lemmy_using" },
        { text: `[Offer to write him a ticket: Regulation Zero, the Unwritten Mercy Clause.]`, goto: "ticket", cond: "flag.lemmy_using && !flag.lemmy_redeemed && !flag.lemmy_ticket_d2" },
        { text: `'Do you still have the coupons? Bronka needs them.'`, goto: "coupons", cond: "(flag.lemmy_confessed || flag.lemmy_coupons_done) && !flag.lemmy_coupons_d2" },
        { text: `[Tear the page about you out of his log.]`, goto: "tear", cond: "flag.lemmy_log_seen && !flag.lemmy_torn" },
        { text: `'Rhea hasn't come for you, has she?'`, goto: "rhea", cond: "!flag.lemmy_rhea_d2" },
        { text: `'Fenwick wants a bass. You're a bass.'`, goto: "choir", cond: "flag.fenwick_recruit_asked && !flag.lemmy_choir" },
        { text: `'Good luck, Lemmy.'`, end: true }
      ]
    },
    log: {
      speaker: "lemmy",
      text: `He opens the satchel with enormous reluctance and takes out a long ruled form headed STUDENT LIAISON LOG (GRADE ZERO). Each line has a time, a name, a duration and a column called *Demeanour.* He turns it toward you with his thumb over most of it. *07:12. Matron P. 14 min. Calm.* *07:40. Choirmaster A. 3 min. Agitated (cheerful).* *08:05. Librarian C. 9 min. Neutral (very).* And, a third of the way down: *07:55. {name}. Dormitory to Hall. 6 min. Hungry. Hums when thinking.* He stares at the page. 'I put *hums when thinking.* I don't know why. It was just *true.*'\n\nHe looks up. 'I am not sure whether it will be *good* for you.'`,
      onEnter: [{ set: "lemmy_log_seen", val: true }, { xp: 2 }, { surv: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `*Hums when thinking.* Everybody who has ever watched you has written that down. It is the one detail that betrays you every time, because it is the most harmless.` },
        { skill: "archive", min: 3, text: `Student Liaison Log (Grade Zero): Form 90-Z. A form that is not in the Index of Forms. A form that exists only by Inspectorate fiat. A paper *ghost.*` }
      ],
      choices: [
        { text: `[Tear the page about you out.]`, goto: "tear" },
        { text: `'Thanks for being honest.'`, goto: "hub", effects: [{ xp: 1 }] }
      ]
    },
    using: {
      speaker: "lemmy",
      text: `'*Using* me.' He tries the word as one tries a hot dish. 'He has been, ah, *kind.* He spoke to me for *nine minutes.* In that time he did not *once* say *citizen.* He said *Lemmy.* He asked about my *mother.*' His fists tighten on the clipboard. 'He knew her *name.* He knew what *floor* she lives on. He knew that the stairs are *difficult.*' His voice drops to a whisper. 'Nobody has ever, ah, remembered the stairs.'\n\nHe looks away. 'I *know* that a man who remembers the stairs is a man who has read a file. I'm not *stupid.* I only wish that, ah, *both* things could be true. That he has a file. *And* that he is kind.'\n\nA beat. 'Both things *are* true. Aren't they.'`,
      onEnter: [{ set: "lemmy_using", val: true }, { xp: 3 }, { thought: "th_inspector_charm" }],
      interjections: [
        { skill: "empathy", min: 3, text: `*Both things are true.* It is the wisest thing a fifteen-year-old has said in this building, and he has said it as a question.` },
        { skill: "dialectics", min: 3, text: `A man can read a file and be kind. A man can be kind because he has read a file. The two are not opposites. That is what makes the system so durable.` }
      ],
      choices: [
        { text: `'Yes. Both are true. It's the worst thing about him.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }, { morale: 1 }] },
        { text: `[Offer him a way out: a ticket.]`, goto: "ticket" }
      ]
    },
    ticket: {
      speaker: "narrator",
      text: `You take out your own small pad and pen, and, in the most official hand you possess, you write: *VIOLATION: Excessive Obedience. FINE: One Mercy, payable on demand. AUTHORITY: Regulation Zero, The Unwritten Mercy Clause.* You tear the sheet off and hold it out to him with the unshakeable gravity of a tax collector. 'Sign here,' you say.\n\nLemmy stares at it. His mouth opens. For a long, wobbling moment he looks as if he might cry or arrest you. Then he reads it again, slowly, and a thing happens to his face that has not happened to it in living memory: the corners of his mouth go up, quite against his will, and stay.`,
      voices: 3,
      interjections: [
        { skill: "charm", min: 3, text: `Delightful. You have turned his own weapon into a gift. It is the best joke in the school and he is the only one who can appreciate it.` },
        { skill: "rhetoric", min: 3, text: `Never fight a bureaucrat. Out-form him.` }
      ],
      choices: [
        { text: `[Make him laugh with it. Persuade him to take the Mercy.]`, check: { skill: "charm", diff: 9, id: "lemmy_d2_ticket_charm", white: true, pass: "redeem", fail: "ticket_flat" } },
        { text: `[Be firm: 'Sign it. That is an order.']`, check: { skill: "authority", diff: 10, id: "lemmy_d2_ticket_authority", white: true, pass: "redeem", fail: "ticket_flat" } }
      ]
    },
    redeem: {
      speaker: "lemmy",
      text: `He signs. It takes four attempts, because the pen is shaking. When he hands it back, he has a *peculiar* expression: that of a person who has put down a very heavy bag in a place where somebody might step on it. 'I'll,' he says. He swallows. 'I'll still do the *log.* I have to. He *promised* about my mother.' His voice breaks very slightly. 'But I'll write it, ah, *badly.* I'll put *Calm* for everyone. I'll put *Neutral (very).* I'll put that you all had *very nice posture.*' A hiccup that is also a laugh. 'It's the first time I've ever *lied* on a form. It feels, ah, *delicious.*'\n\nHe salutes, properly, with the wrong hand. 'Thank you for the ticket, citizen. It's the only one I've been *glad* to get.'`,
      onEnter: [{ set: "lemmy_redeemed", val: true }, { set: "lemmy_ticket_d2", val: true }, { task: "task_lemmy", state: "done" }, { xp: 6 }, { morale: 3 }, { ideo: "undercurrent", n: 2 }, { thought: "th_chosen_family" }, { note: "task_lemmy", text: `Gave Lemmy a ticket for Excessive Obedience. He'll keep the log, but write 'Calm' for everyone. His first lie on a form. 'Delicious.'` }],
      interjections: [
        { skill: "solidarity", min: 2, text: `A boy lied on a form. It will outlast the Ministry. It is the smallest act of sabotage that has ever been performed and it is *exactly* as large as a boy.` }
      ],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    ticket_flat: {
      speaker: "lemmy",
      text: `He reads the ticket twice. Then he folds it, with great ceremony, and puts it in the satchel. 'I, ah. I will *consider* it,' he says. 'It is a very, ah, *creative* piece of paperwork. I shall have to *check* it.' He straightens his armband, which does not need it. 'Per Regulation Twelve. The Unwritten Mercy Clause is, ah, subject to *interpretation.*'\n\nHis eyes drift to the Principal's door. 'I should like to think about my mother's flat,' he adds, very small.`,
      onEnter: [{ set: "lemmy_ticket_d2", val: true }, { morale: -1 }, { xp: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    coupons: {
      speaker: "lemmy",
      text: `He flushes to the roots of his ironed hair. 'The, ah, *coupons.*' He unbuttons the cuff of his blazer and takes out, from a pocket sewn inside it with surprisingly neat stitches, a small, flat bundle of printed squares. 'I *kept* them. Not for Rhea. For *Bronka.* I did not know how to put them back.' He counts them, aloud, with his lips. 'Six. I only had six left. The other six, ah, I *paid.* Earlier.' He holds them out. 'Please. Take them to her. Say they're from, ah, *Anonymous Charity.*'\n\nHe adds, in a whisper, 'She will know.'`,
      onEnter: [{ give: "ration_coupon" }, { set: "lemmy_coupons_d2", val: true }, { xp: 3 }, { morale: 1 }, { toast: "Received: Ration Coupons" }, { note: "task_coupons", text: `Lemmy gave me six coupons for Bronka ('from Anonymous Charity'). She will know.` }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    tear: {
      speaker: "narrator",
      text: `You ask, quite politely, whether you may borrow the log for a moment. Lemmy hesitates, then, to your surprise, hands it over and turns his back, very deliberately, to examine a notice on the wall. 'I'm not *watching,*' he says to the notice. 'I am entirely absorbed in Regulation Fourteen.' You tear out the page. It makes a very quiet, very final sound. You fold it into your pocket.\n\nBehind you, Lemmy lets out a long shaky breath. 'I'll say I lost it,' he says. 'I'll say I spilled tea. I'm very bad with tea.'`,
      onEnter: [{ set: "lemmy_torn", val: true }, { surv: -3 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Continue.`, goto: "hub" }]
    },
    rhea: {
      speaker: "lemmy",
      text: `'She *hasn't.*' His whole face crumples with something you can only describe as grief. 'I keep *waiting.* I stand in the corridor from six. She is the first person I think of when I wake and the last I think of when I, ah, *don't.*' He swallows. 'She was in the gym at dawn. I *saw.* She was sitting on the bleachers, quite alone, under the hoop where, where he *was.* She was peeling an orange. And she was not *finishing* it.'\n\nHe stares at the floor. 'She had peeled it in one long piece and she just *held* it. For a very long time. She wasn't looking at anyone. I don't think she knew I was there.'\n\nHe looks up. 'I think she is *frightened.* And I do not know what a person does with a Rhea who is frightened.'`,
      onEnter: [{ set: "lemmy_rhea_d2", val: true }, { xp: 3 }, { note: "task_rhea2", text: `Lemmy saw Rhea at dawn in the gym under the hoop, peeling an orange in one piece and not finishing it. 'I think she is frightened.'` }],
      interjections: [
        { skill: "empathy", min: 3, text: `An orange peeled in one piece and not eaten. A killer in a gym at dawn. She is a girl holding a thing she can't put down.` },
        { skill: "instinct", min: 3, text: `She did it. She knows she did it. And the thing that comes after is not triumph. It is a long, cold, empty morning.` }
      ],
      choices: [{ text: `'Then somebody should go and sit with her.'`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }]
    },
    choir: {
      speaker: "lemmy",
      text: `'*Me?*' He drops the clipboard. 'In, ah, in the *choir?* I did a solo in the Second Form, but that was a *misunderstanding.* The Warden's portrait *did not* flinch.' He is already blushing so hard he is nearly glowing. 'I'm a *bass.* A real one. It came in, ah, rather *alarmingly*, last spring. I have been *dreading* it.' A very small smile. 'Nobody has ever *asked* me to use it.'\n\nHe picks up the clipboard. 'I'll come. If it's, ah, *regulation.* If it isn't, I'll come anyway and *pretend* it is.'`,
      onEnter: [{ set: "lemmy_choir", val: true }, { xp: 3 }, { morale: 2 }, { add: "choir_voices", n: 1 }, { note: "task_choir2", text: `Lemmy Tarsk will sing bass in the choir. 'If it isn't regulation, I'll come anyway and pretend it is.'` }],
      choices: [{ text: `'Fenwick will be glad.'`, goto: "hub" }]
    }
  }
},

};

})();
