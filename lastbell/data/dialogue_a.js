(function(){ const GD = (window.GD = window.GD || {});

GD.dialoguesA = {

intro: {
  title: "Waking",
  start: "wake",
  nodes: {
    wake: {
      speaker: "narrator",
      text: "A note. One note, high and thin, held so long it has stopped being a sound and become a place. You are lying in it. Somewhere beneath the note there are other things: boards against your cheek, a smell of dust and old greasepaint, and a cold that has gotten into your uniform through the places where the uniform is no longer attached to itself.\n\nYou have no idea where you are. You have no idea what day it was yesterday. This is, by itself, a kind of peace.",
      interjections: [
        { skill: "the_grey", min: 2, text: "Damp. Seventeen degrees and falling in the lungs of the building. I am the plaster behind you, and I am so very patient. Lie down a little longer; everyone does, eventually." },
        { skill: "senses", min: 3, text: "Wood. Greasepaint. Mouse. Under all that, someone's cigarette from hours ago, still sulking in the curtains." },
        { skill: "volition", min: 4, text: "Slowly. You are alive and horizontal. Those are two good facts. Build from them." }
      ],
      choices: [
        { text: "Open your eyes.", goto: "open" },
        { text: "Lie still and listen to the ringing.", goto: "ring" }
      ]
    },
    ring: {
      speaker: "narrator",
      text: "You listen. The note is not outside you. It never was. It is the old ringing in your ears, the one you have had since you were small enough to be carried: a thread of tin that runs through every quiet room of your life. Doctors called it 'a minor irregularity'. Teachers called it 'inattention'. Your mother called it 'your little kettle'.\n\nTonight it is louder than it has ever been, as if it has been shouting for hours and only now got through.",
      interjections: [
        { skill: "instinct", min: 3, text: "It's shouting because it's the only part of you that remembers. Listen to it, don't argue with it.", effects: [{ xp: 1 }], once: true },
        { skill: "empathy", min: 4, text: "A small, stubborn animal in your head, barking at a door. It is not afraid. It is insisting." }
      ],
      choices: [
        { text: "Open your eyes. Enough lying here.", goto: "open", effects: [{ set: "intro_listened", val: true }] }
      ]
    },
    open: {
      speaker: "narrator",
      text: "Grey light through a high window. A ceiling of water stains in the shape of a province nobody is allowed to name. You are on your back at the centre of a stage, arms flung wide like a diagram of a crucifixion drawn by someone with only a vague idea of the original. Your uniform is torn at the shoulder and one sleeve is missing its cuff. Your hands are smeared with something pale and dry.\n\nIt is chalk. You do not remember touching any chalk.",
      onEnter: [{ set: "intro_seen", val: true }],
      interjections: [
        { skill: "deduction", min: 3, text: "Chalk on both palms, the heels of the hands, a smear on the left cuff. Somebody drew something large last night. Or held onto something that had been drawn on. The question, as always, is who and why. The answer, as always, is not a cigarette-smoking pigeon, so stop looking at the window." },
        { skill: "composure", min: 3, text: "Whatever you do, do not lie here with your mouth open. You have already looked like a fool for several hours; let us not renew the lease." },
        { skill: "dialectics", min: 3, text: "Premise: you are on a stage. Premise: stages exist to be seen from. Conclusion: you are currently the least dignified exhibit in the building." }
      ],
      choices: [
        { text: "Who is talking?", goto: "roll" },
        { text: "Sit up first. Panic later.", goto: "roll", effects: [{ xp: 1 }] }
      ]
    },
    roll: {
      speaker: "narrator",
      text: "Inside your skull, a committee clears its throat. Not one voice but a crowd of them, none of them quite yours, all of them very sure they are. The ringing steps aside to let them speak, the way a caretaker steps aside for the inspectors.",
      interjections: [
        { skill: "dialectics", min: 1, text: "Dialectics. Do not thank me. Thank the logic of history; I am merely its unpaid bailiff. You have lost a night. Observe that I did not say 'we'." },
        { skill: "rote", min: 1, text: "ROTE. ARTICLE ONE: THE CITIZEN SHALL BE VIGILANT. ARTICLE TWO: THE CITIZEN SHALL BE CHEERFUL. ARTICLE THREE: SEE ARTICLE ONE. I have all of it. I have nothing else." },
        { skill: "deduction", min: 1, text: "Deduction. Rain on the window, no coat on the hook, and a dame in a story would say she hadn't seen him. We're going to find who saw you, kid. Somebody always saw you." },
        { skill: "rhetoric", min: 1, text: "Oh good, a new audience! Rhetoric. I can argue for anything, against anything, and, on rare and beautiful occasions, with myself." },
        { skill: "doublethink", min: 1, text: "Doublethink. Hello, friend. There is nothing wrong. You slept on a stage because you are very devoted to the arts. Isn't that lovely? Say it with me. Isn't that lovely?" },
        { skill: "archive", min: 1, text: "Archive. Strictly speaking we haven't been introduced under Form 11, but I shall waive it. It is the fourteenth of the month, a Thursday, the autumn term, District Nine, and I would very much like a pen." },
        { skill: "empathy", min: 1, text: "Empathy. I'm sorry. You must be so scared. I can feel it in the walls. No, really: the walls are scared too." },
        { skill: "volition", min: 1, text: "Volition. I'm the tired one. Don't look at me like that. Somebody has to be an adult in here, and you're seventeen." }
      ],
      choices: [
        { text: "There are more of you?", goto: "roll2" }
      ]
    },
    roll2: {
      speaker: "narrator",
      text: "The committee is not finished. The rest file in like latecomers to a lecture, apologising loudly, taking up room.",
      interjections: [
        { skill: "authority", min: 1, text: "AUTHORITY! ON YOUR FEET! THE ROOM DOES NOT ADDRESS ITSELF! I have not been given a rank. I have simply never needed one." },
        { skill: "instinct", min: 1, text: "Psst. Instinct. Something's wrong in this building. Not wrong like 'broken'. Wrong like 'listening'." },
        { skill: "charm", min: 1, text: "Charm, darling. Smile when they come in. Whoever they are, smile before you know whether you should. It's so much cheaper than being right." },
        { skill: "solidarity", min: 1, text: "We are here. We are all here. The ones who were on this stage before you, and the ones who will be. You are never alone, not even in the dark, not even when you'd prefer to be. We." },
        { skill: "stamina", min: 1, text: "Stamina. Heart's fine. Knees are fine. You've been breathing for seventeen years without a day off. Just keep doing that." },
        { skill: "grit", min: 1, text: "Grit. It hurts. Good. That means the pain's still reporting for duty." },
        { skill: "brawn", min: 1, text: "Brawn. I can lift most things. Doors, drawers, small prefects. Ask." },
        { skill: "appetite", min: 1, text: "Appetite. Tea. Tobacco. Anything sweet, anything fried, anything warm. I am not ashamed. I am simply HERE, and hungry." },
        { skill: "adrenaline", min: 1, text: "ADRENALINE! Go! Now! Somewhere! I don't know where! Go!" },
        { skill: "the_grey", min: 1, text: "The Grey. I am the weather inside the building. I am the sky when it has given up. We have met before, in puddles." },
        { skill: "aim", min: 1, text: "Aim. Small things, far away. I will see to them. You will not need to know how." },
        { skill: "reflex", min: 1, text: "Reflex. If anything flies at your face, you will already have moved. Don't ask me how I know that." },
        { skill: "composure", min: 1, text: "Composure. Shoulders. Chin. Do not look like you slept on a stage, even if you did." },
        { skill: "slip", min: 1, text: "Slip. I am the quiet between footsteps. Doors and I have an understanding." },
        { skill: "sleight", min: 1, text: "Sleight. Pockets. Pages. Pens that were never quite yours. Your hands know things your head doesn't." },
        { skill: "senses", min: 1, text: "Senses. Smell, sound, the grain of a surface. I don't interpret, I just insist." }
      ],
      choices: [
        { text: "That's a lot of you. What do I call myself?", goto: "name" }
      ]
    },
    name: {
      speaker: "narrator",
      text: "A name arrives, like a coat dropped over a chair: {name}. Seventeen. Student of School No. 9, District Nine, Tarnov-on-the-Grey, Greater Union of Karsovia, under the eye of the Warden. Every fact you are supposed to have is present and correct. They slide into place with a clean, well-oiled sound.\n\nIt is yesterday that has been taken. Where yesterday was there is a smooth wall, painted the same green as the corridors.",
      interjections: [
        { skill: "archive", min: 3, text: "Note the wall. Smooth to the minute, no seams. A natural forgetting has edges, ragged, like torn paper. This one has been trimmed with a blade." , effects: [{ xp: 1 }], once: true },
        { skill: "doublethink", min: 3, text: "Don't poke at the wall, friend. It's a very good wall. The State painted it for you; wouldn't it be rude to scratch it?" }
      ],
      choices: [
        { text: "[Press at the wall. Remember something.]", check: { skill: "volition", diff: 10, id: "intro_panic", white: true, pass: "name_pass", fail: "name_fail" } },
        { text: "Leave the wall alone. Stand up.", goto: "stand" }
      ]
    },
    name_pass: {
      speaker: "volition",
      text: "Good. Steady. You don't get yesterday. You get a feeling of yesterday, like a hand on your shoulder in a dark corridor: running, a hard breath, a smell of hot dust and rope, and then the high bright note, and then nothing. That is enough. That is a map with one road on it.\n\nIt isn't comfortable. It isn't supposed to be. But you didn't fall down, and that is how adults begin.",
      onEnter: [{ xp: 2 }, { morale: 1 }, { thought: "th_ghost_of_yesterday" }],
      choices: [{ text: "Stand up.", goto: "stand" }]
    },
    name_fail: {
      speaker: "the_grey",
      text: "Oh. There it is. The cold goes in right to the middle. You reach for last night and your hand closes on wet concrete. Gravel under your fingernails. The ringing swells to cover the sound of you being small.\n\nThere is no yesterday. There never was. There is only the building, which will keep you, if you ask nicely, and even if you don't.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Stand up anyway.", goto: "stand" }]
    },
    stand: {
      speaker: "narrator",
      text: "You stand. The stage tips a little, then agrees to be a floor. The Old Theatre unfolds around you: rows of benches under dust sheets, a banner above the door reading THE WARDEN HEARS, a dead microphone stand with no microphone, an old brass PA horn bolted to the wall like a trumpeting snail. At the wings, a dressing mirror reflects someone who is clearly you, but with a worse night.\n\nThere is also writing on your forearm, in your own hand, in blue ink, pressed through the torn sleeve.",
      interjections: [
        { skill: "stamina", min: 3, text: "Knees complain, lungs complain, but both filed on time. You can do this all day. It's only seven-thirty." },
        { skill: "reflex", min: 3, text: "You didn't fall. That's twice today your body decided something for you. Keep an eye on it." }
      ],
      choices: [
        { text: "Read your forearm.", goto: "arm" }
      ]
    },
    arm: {
      speaker: "narrator",
      text: "Blue ballpoint, pressed hard enough to dent the skin, in a hurried version of your own handwriting. Three lines.\n\nDON'T SING.\nTHE RINGING IS THE ONLY HONEST THING.\nFIND WHAT I HID. (3 PAGES. ASK THE BUILDING.)\n\nBelow that, smaller, with a lick of panic in the descender: EXAM 17:00. DO NOT BE LATE. DO NOT BE EARLY. DO NOT BE NOTICED.",
      onEnter: [
        { task: "task_yesterday", state: "active" },
        { note: "task_yesterday", text: "Woke on the stage of the Old Theatre with no memory of last night. A message on my forearm in my own hand: DON'T SING. THE RINGING IS THE ONLY HONEST THING. FIND WHAT I HID (3 PAGES). Exam at 17:00." }
      ],
      interjections: [
        { skill: "archive", min: 2, text: "'Three pages.' Not 'three things', not 'three objects'. Pages. Documents. Your past self was a clerk of his own disaster, and a fine one: dated, numbered, instruction-bearing. I could cry.", effects: [{ xp: 1 }], once: true },
        { skill: "rhetoric", min: 3, text: "'Ask the building.' What a deliciously unsound argument. You can't interrogate masonry. But I'll try if you'll let me." },
        { skill: "rote", min: 2, text: "DO NOT SING. ARTICLE NINE: THE CITIZEN SHALL SING WHEN THE BELL RINGS. ARTICLE NINE, SUBSECTION THREE: THE CITIZEN SHALL NOT SING OTHERWISE. Hm. Your past self has just written a contradiction into the Code." },
        { skill: "sleight", min: 3, text: "The handwriting is yours but the pen wasn't. Wrong ink for the school issue. Somebody lent you a pen last night." , effects: [{ set: "intro_pen", val: true }] }
      ],
      choices: [
        { text: "Look in the mirror.", goto: "mirror_note" }
      ]
    },
    mirror_note: {
      speaker: "narrator",
      text: "You do not have to walk over yet to know what the mirror will say. You can feel it in your face: a stiffness, a held-in shape, the look of someone who has been afraid for a long time without knowing of what.\n\nBehind you, in the high dark of the wings, something small and brass rattles in its bracket. Not the wind. There isn't any. It is the old PA horn, which is wired to nothing, and which you would swear just cleared its throat.",
      interjections: [
        { skill: "instinct", min: 3, text: "Don't look at the horn. Look at the door. Someone's about to come through it and they won't be pleased." },
        { skill: "the_grey", min: 4, text: "Some buildings hold their breath. This one has been holding it since the spring. Do you want to know what happens when it lets go?" }
      ],
      choices: [
        { text: "Turn towards the door.", goto: "door" }
      ]
    },
    door: {
      speaker: "narrator",
      text: "The door at the back of the theatre opens with a groan of someone who has been told to be quiet and is ignoring it. Boots on boards. A shape in a grey tracksuit stands against the light, one shoulder against the frame, a thread of smoke unspooling from the cigarette in her hand. She doesn't look surprised to find you. She looks like a woman who has been awake since a war.\n\n'Ah,' she says. 'Found you.'",
      interjections: [
        { skill: "authority", min: 3, text: "SHE'S THE ONE WITH THE SHOULDERS. DO NOT SLOUCH. THE WAY YOU STAND IN THE NEXT TEN SECONDS IS THE WAY YOU WILL BE FILED." },
        { skill: "doublethink", min: 3, text: "She is a teacher. She is on your side. Say you slept very well. She'll write it down very kindly, and nobody will ever be upset again." },
        { skill: "empathy", min: 4, text: "Look at her hands. The cigarette shakes just a hair, and she's pretending it's the draught. She's been up as long as you have, and she doesn't remember some of it either." }
      ],
      choices: [
        { text: "Stand straight. Meet her eyes.", goto: "end_a", effects: [{ set: "intro_stance", val: "straight" }, { ideo: "vanguard", n: 1 }] },
        { text: "Say you slept very well, thank you, Lieutenant.", goto: "end_a", effects: [{ set: "intro_stance", val: "lie" }, { surv: -2 }] },
        { text: "Don't say anything. Let her speak first.", goto: "end_a", effects: [{ set: "intro_stance", val: "quiet" }, { ideo: "quiet", n: 1 }] },
        { text: "Tell her the truth: you remember nothing.", goto: "end_a", effects: [{ set: "intro_stance", val: "truth" }, { set: "vasha_told_amnesia", val: true }, { surv: 3 }] }
      ]
    },
    end_a: {
      speaker: "narrator",
      text: "She takes a long pull on the cigarette and lets the smoke go in a flat grey ribbon. 'Get your cap, if you've got one,' she says. 'There's a dead man in the gym and the Principal wants a student at his elbow. Lucky you. Come on.'\n\nThe light behind her is the colour of old teeth. The day, you realise, has already started without you.",
      onEnter: [{ time: 5 }],
      choices: [
        { text: "Follow her.", dialogue: "vasha" }
      ]
    }
  }
},

enter_canteen: {
  title: "The Ration Hall",
  start: "in",
  nodes: {
    in: {
      speaker: "narrator",
      text: "The Ration Hall hits you like a wet towel: boiled cabbage, floor polish, a thousand mornings' worth of breath. Long tables stand in ranks, a zinc counter gleams at the far end, and on a raised platform to the east the choir risers wait like the ribs of something enormous. Above the serving hatch a banner declares: A FED CITIZEN IS A LOYAL CITIZEN. Under it, in pencil, someone has added: IF FED.\n\nA loudspeaker on its pole in the corner clicks as you enter, once, as if someone had touched it with a finger.",
      interjections: [
        { skill: "appetite", min: 2, text: "Cabbage. Fat. Somewhere under that, a hint of sugar, yes, YES, a roll, somebody has a roll in this room." },
        { skill: "senses", min: 3, text: "Four people in the room besides you, and one of them is holding very still." },
        { skill: "solidarity", min: 4, text: "We eat here. We have always eaten here. Even the ones who left their names on the benches. Listen: the hall remembers all of us." },
        { skill: "doublethink", min: 3, text: "The food is excellent. Say it with a mouth full if you have to. A nice clean plate is a nice clean file." }
      ],
      choices: [
        { text: "Take it in.", goto: "people" }
      ]
    },
    people: {
      speaker: "narrator",
      text: "Cook Bronka stands at the counter like a monument to a smaller, kinder empire, forearms folded, ladle at her hip. A girl in a wheelchair sits by the nearest table with a book she is not reading and a cardigan of unlikely orange. A boy with a red armband patrols the aisle, frowning at the crumbs. And on the choir stage, a thin man in a good, shabby suit has his back to the room and one hand raised, conducting nothing at all.",
      interjections: [
        { skill: "empathy", min: 3, text: "The conductor is not conducting nothing. He is conducting the memory of a song. His whole spine is in it." },
        { skill: "deduction", min: 4, text: "The girl in the chair has electrician's tape on her fingertips and a screwdriver case under the cardigan. The book is a prop. Whatever she's reading, it isn't paper." }
      ],
      choices: [
        { text: "Look around.", end: true }
      ]
    }
  }
},

enter_gym: {
  title: "The Gymnasium",
  start: "in",
  nodes: {
    in: {
      speaker: "narrator",
      text: "The gymnasium is the largest room in the school and, this morning, the quietest. Your steps go up into the rafters and do not come back. The floor is a vast checkerboard of green and cream, scuffed by a decade of drills; the banners say STRONG BODIES SERVE ONE BELL. At the far end, beneath the north hoop, something that was once a man is turning very slightly in the draught.",
      onEnter: [{ time: 3 }],
      interjections: [
        { skill: "grit", min: 3, text: "Don't look away. The dead are shy, but they are also patient. Look until you can stop flinching." },
        { skill: "the_grey", min: 3, text: "It's colder in here than outside. I did that. I take no credit; I take no blame. Rooms with a dead man in them tend to get cold." },
        { skill: "volition", min: 5, text: "You are seventeen and you are looking at a hanged man. It is perfectly all right to feel sick. It is not all right to forget why you are here." },
        { skill: "composure", min: 3, text: "Hands out of your pockets. Mouth closed. Posture of a person who has seen worse. You have not. Pretend." }
      ],
      choices: [
        { text: "Go closer.", goto: "close" }
      ]
    },
    close: {
      speaker: "narrator",
      text: "A basketball hoop, a thick rope, a body in a dark suit, one boot dangling an inch above the floor. Beneath it, a framed portrait of the Warden lies on the checkered boards with its face torn clean open, as though something had clawed out from behind the glass. Dust still floats down from the hoop where the rope is rubbing.\n\nThe lieutenant stops a few paces behind you. 'Look,' she says. 'Don't touch yet. Tell me what you see.'",
      onEnter: [{ set: "gym_entered", val: true }],
      interjections: [
        { skill: "deduction", min: 3, text: "Portrait on the floor, torn from behind. A man hanging from a hoop, no stool, no chair, no crate within six metres. Ladies and gentlemen, he flew." },
        { skill: "dialectics", min: 3, text: "Either he hanged himself, or someone hanged him. The first requires a means of elevation. The second requires a motive. One of these is in short supply." },
        { skill: "doublethink", min: 2, text: "A tragedy. A sad, unstable man. There's nothing else to see, is there? Wouldn't it be so much easier if there weren't?" , effects: [{ set: "doublethink_gym", val: true }] }
      ],
      choices: [
        { text: "Look at the body.", end: true },
        { text: "Say nothing. Keep looking.", end: true }
      ]
    }
  }
},


vasha: {
  title: "Lieutenant Kell",
  start: [
    { cond: "flag.vasha_ally", node: "hub_ally" },
    { cond: "flag.met_vasha", node: "hub" },
    { node: "first" }
  ],
  nodes: {
    first: {
      speaker: "vasha",
      text: "'Lieutenant Vasha Kell,' she says, as though reading it off a gravestone. 'Physical Culture. Army, before that. Knee, after that.' She taps her left leg with the cigarette hand, a small, practiced tap, the way you might knock on a door you no longer expect to open. 'Don't salute. I hate it, and also it wouldn't suit you.'\n\nHer eyes go over you once, head to boots, taking an inventory. 'You look like someone who lost a fight with a theatre.'",
      onEnter: [{ set: "met_vasha", val: true }],
      interjections: [
        { skill: "authority", min: 4, text: "SHE IS EVALUATING YOUR POSTURE. YOU WILL BE GRADED. DO NOT SAG." },
        { skill: "empathy", min: 3, text: "She says 'kid' with her eyes and 'student' with her mouth. Underneath: tired. The tired of a person who has stopped hoping for a rest and started hoping for a smaller job." },
        { skill: "rote", min: 3, text: "LIEUTENANT VASHA KELL. DECORATED, EIGHTH MARCH CAMPAIGN. HONOURABLY RETIRED. FILE 114: DISCIPLINARY: NONE. FILE 115: SEE FILE 116." },
        { skill: "instinct", min: 4, text: "She's glanced at your left hand twice. At the chalk. Not the ringing, the chalk." }
      ],
      choices: [
        { text: "'There's a dead man in the gym?'", goto: "assign" },
        { text: "'I don't know how I got here.'", goto: "amnesia", cond: "flag.vasha_told_amnesia !== true" },
        { text: "'I'm fine, Lieutenant. Where am I needed?'", goto: "assign", effects: [{ ideo: "vanguard", n: 1 }] }
      ]
    },
    amnesia: {
      speaker: "vasha",
      text: "She looks at you for a long time. The cigarette burns down a finger's width.\n\n'Last night,' she says carefully. 'Nothing?'\n\n'You know,' she continues, 'everybody has a bad morning after the Harmony. That's the point of it. You wake up softer, with a light head, a bit forgetful. It's meant to be a mercy.' She says the word 'mercy' like a woman checking whether a step will hold her. 'But you look worse than forgetful. You look scrubbed.'",
      onEnter: [{ set: "vasha_told_amnesia", val: true }],
      interjections: [
        { skill: "doublethink", min: 3, text: "Careful, friend. 'Nothing' is such a large word to say out loud. It might be mistaken for a complaint. Say 'a little hazy'. Hazy is so patriotic." },
        { skill: "volition", min: 4, text: "She is not your enemy, as far as you can tell. But you can't tell very far. Choose what to hand over." }
      ],
      choices: [
        { text: "'Hazy. A little hazy.'", goto: "assign", effects: [{ surv: -2 }] },
        { text: "'Nothing. A clean wall. I woke up on the stage with chalk on my hands.'", goto: "amnesia_open", effects: [{ surv: 4 }] },
        { text: "[Lie smoothly. Last night was a normal night.]", check: { skill: "composure", diff: 10, id: "vasha_lie_normal", white: true, pass: "amnesia_lie_ok", fail: "amnesia_lie_bad" } }
      ]
    },
    amnesia_open: {
      speaker: "vasha",
      text: "'Chalk,' she repeats. She turns the word over like a coin of uncertain minting. Then something moves behind her face and is shut away.\n\n'Right. Don't tell that to anyone else. Not the Principal, not Lemmy Tarsk, and certainly not that Vanguard girl with the stare. They'll hear it as confession.' A pause. 'I'm not going to write it down. Yet.'\n\nShe says 'yet' the way people say 'sorry'.",
      onEnter: [{ xp: 1 }, { set: "vasha_knows_chalk", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: "'Yet.' She means it. She wants not to write it down. It is the first thing about her you can like." },
        { skill: "instinct", min: 4, text: "Wait. 'Write it down'. Write it WHERE? What does she carry that she writes in?" , effects: [{ set: "vasha_suspect_notebook", val: true }] }
      ],
      choices: [
        { text: "'Thank you, Lieutenant.'", goto: "assign" }
      ]
    },
    amnesia_lie_ok: {
      speaker: "composure",
      text: "Shoulders down. Eyes level. A small smile, the kind that says 'bored of nothing happening.' She does not blink, and you do not give her anything to blink at. The lie slides into the air so smoothly it almost seems true. You were here. You slept. It was lovely.\n\nShe grunts. A grunt, from her, is a rubber stamp.",
      onEnter: [{ xp: 2 }, { surv: -3 }],
      choices: [{ text: "Continue.", goto: "assign" }]
    },
    amnesia_lie_bad: {
      speaker: "vasha",
      text: "'Don't.' It is gentle, which makes it worse. 'You do that thing with your jaw, the thing people do when the true thing is trying to climb out. I've watched men do it in front of firing parties. Save it for the Principal, kid. She doesn't mind a good lie. She just minds a bad one.'\n\nShe lets it go. But she watched where it came from.",
      onEnter: [{ surv: 4 }, { morale: -1 }],
      choices: [{ text: "Continue.", goto: "assign" }]
    },
    assign: {
      speaker: "vasha",
      text: "'Youth Commissar Ostrov Dane,' she says. 'Hanging from the north hoop. Osk the caretaker found him at ten past six. The Principal wants it filed as the suicide of an unstable man by sunset, with a student witness to sign, so it doesn't look like something I did.' She flicks ash onto the stage. 'That's you. You're the student witness. You assist. You observe. You sign.'\n\n'Also you're sitting the Orthodoxy Exam at five, and the curfew bell's at nine. Plenty of day.'",
      onEnter: [
        { task: "task_case", state: "active" },
        { note: "task_case", text: "Lt. Kell has appointed me 'assistant' in the inquiry into the death of Youth Commissar Ostrov Dane, found hanged in the gym at 06:10. The Principal wants it filed as suicide by evening." }
      ],
      interjections: [
        { skill: "archive", min: 3, text: "Technically the correct designation is 'Assisted Inquiry by Minor', Form 7-C, in triplicate. She has none of the copies. This is a procedural scandal." },
        { skill: "rhetoric", min: 4, text: "'It doesn't look like something I did.' Interesting phrasing. Why would it look like something she did? File that, and for the love of syntax, don't say it yet." },
        { skill: "dialectics", min: 4, text: "The Principal wants a conclusion before the investigation. This is not an investigation. This is a ceremony with a corpse." },
        { skill: "doublethink", min: 2, text: "An honour! To be trusted! A student witness! You'll sign whatever you're given, won't you? Because you're a good one." }
      ],
      choices: [
        { text: "'Is there a form?'", goto: "form" },
        { text: "'Who would want him dead?'", goto: "who", cond: "!flag.vasha_asked_who" },
        { text: "'Let's see the body.'", goto: "hub_go" }
      ]
    },
    form: {
      speaker: "narrator",
      text: "There is, of course, a form. It appears from the lieutenant's tracksuit with the grim promptness of a rabbit from a hat that hates you. FORM 7-C: ASSISTED INQUIRY BY MINOR (Provisional). It has fourteen boxes. One asks for your 'Reason for Wishing to Assist'. One asks for your Grandmother's Place of Birth. One, in very small type, asks you to 'acknowledge the continuous benevolent observation of the Inquiry Officer for educational purposes'.\n\nThere is a pen on a string. The string is very short.",
      interjections: [
        { skill: "archive", min: 3, text: "Box 11: 'acknowledge continuous observation.' It is not a courtesy. It is the legal basis for every report she is about to file on you. I recommend reading the rest of the page, which says worse.", effects: [{ xp: 1 }], once: true },
        { skill: "rote", min: 2, text: "FORM 7-C. SUBMIT IN TRIPLICATE. THE SECOND COPY BELONGS TO THE CITIZEN. THE THIRD COPY BELONGS TO THE CITIZEN'S FUTURE. THE FIRST COPY BELONGS TO THE WARDEN, AS DOES THE CITIZEN." }
      ],
      choices: [
        { text: "Sign it. 'Reason: civic duty.'", goto: "signed", effects: [{ surv: -3 }, { ideo: "vanguard", n: 1 }, { set: "vasha_form_signed", val: true }], once: true },
        { text: "[Read the small print before signing.]", check: { skill: "archive", diff: 8, id: "vasha_small_print", white: true, pass: "print_pass", fail: "signed" }, cond: "!flag.vasha_form_signed" },
        { text: "Hand it back. 'I'll assist without signing.'", goto: "refuse_form", effects: [{ surv: 5 }, { ideo: "undercurrent", n: 1 }], cond: "!flag.vasha_form_signed" }
      ]
    },
    print_pass: {
      speaker: "archive",
      text: "Ha. As suspected. Paragraph 9(c): 'The Minor consents to the retention of any statement made during the Inquiry in the Dossier of the Minor, and to the sharing of said Dossier with the District Warden's Office in the event of Concern.' It is not illegal. It is worse: it is routine. Everything you say within her earshot becomes paper.\n\nBut, you note, there is no clause requiring you to say anything of value. Be dull, be brief, be correct.",
      onEnter: [{ xp: 2 }, { set: "vasha_form_read", val: true }],
      choices: [
        { text: "Sign it anyway, with a wooden face.", goto: "signed", effects: [{ surv: -1 }, { set: "vasha_form_signed", val: true }] },
        { text: "Hand it back.", goto: "refuse_form", effects: [{ surv: 3 }, { ideo: "undercurrent", n: 1 }] }
      ]
    },
    signed: {
      speaker: "vasha",
      text: "She snatches the form and folds it into her tracksuit pocket. 'Good. Now it's on file that I asked you nicely.' A smile, brief and crooked. 'You'll find the District loves it when you ask nicely. Almost nobody gets to the second request.'\n\nThere's a moment, a flat moment, when she glances at the pocket and then at you, as if she would like to take the form back out and burn it. Then she doesn't.",
      interjections: [
        { skill: "empathy", min: 3, text: "She didn't want it signed. She wanted it needed. That is a different sort of sadness." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    refuse_form: {
      speaker: "vasha",
      text: "A long pause. She gives the paper a rueful look, as though it might argue back.\n\n'Hm,' she says. 'Most students faint. You've got a spine, then. Or an incentive.' She crumples the form and puts it in her pocket. 'I'll note it as 'verbal consent'. It saves us both the pen.' She does not say what she is noting it in.",
      onEnter: [{ xp: 1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    who: {
      speaker: "vasha",
      text: "'Who'd want him dead?' She almost laughs. 'Everybody who's ever attended an Assembly. But that isn't a suspect list, kid, it's a census.' She rubs her knee. 'Dane was a good enough Commissar, which as a compliment is an insult. He came to the gym some nights and did pull-ups with nobody watching. Said it was the only room in the school without a speaker in it.'\n\nShe stops. Then, quietly: 'He's been jumpy since the spring. Something about the Bell.'",
      onEnter: [{ set: "vasha_asked_who", val: true }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 4, text: "'The only room without a speaker.' There's a speaker in the gym corner. Look: the bracket's there, but no cone. Somebody took the cone out. Maybe Dane. Maybe someone with a better reason." , effects: [{ set: "vasha_gym_speaker", val: true }] },
        { skill: "rote", min: 4, text: "SPEAKER INVENTORY, GYMNASIUM: ONE (1) HORN, TYPE C. LAST INSPECTED SPRING TERM. SEE ALSO: 'REMOVAL OF STATE EQUIPMENT': THREE YEARS." }
      ],
      choices: [
        { text: "'The spring. What happened in the spring?'", goto: "spring" },
        { text: "'Let's see him.'", goto: "hub_go" }
      ]
    },
    spring: {
      speaker: "vasha",
      text: "'The spring,' she says, as if offering you a cold potato. 'The theatre was shut, in the spring. There was an accident with the rigging. A girl was hurt.' Her hand drifts toward her pocket, stops. 'I don't remember it well. I don't remember a lot of the spring. The way the Harmony works, you don't. I've had a small hole in my head since the Reedmarsh pass and I didn't know it was a hole until the day I noticed how neat it was.'\n\nShe looks at the cigarette, appalled to find it burned down. 'Don't repeat that.'",
      onEnter: [{ xp: 1 }, { set: "vasha_hole", val: true }],
      interjections: [
        { skill: "empathy", min: 4, text: "She is telling you because she has been wanting to tell somebody for a year. You will never be told this by someone with good sense." },
        { skill: "solidarity", min: 3, text: "We all have a hole. Every one of us. We are a country of small neat holes, politely not mentioned." }
      ],
      choices: [{ text: "'I won't.'", goto: "hub" }]
    },
    hub_go: {
      speaker: "vasha",
      text: "'The gym, then. Through the Ration Hall and left, past the cook, past the cabbage, past anyone who wants to talk to you. Don't talk to them yet. They'll have ideas.' She grinds the cigarette under her heel. 'Questions on the way, if you like. I'll limp slowly.'",
      onEnter: [{ time: 3 }],
      choices: [{ text: "Ask her something first.", goto: "hub" }, { text: "Go.", end: true }]
    },
    hub: {
      speaker: "vasha",
      text: ["'Well?' Lieutenant Kell leans on whatever is nearest. 'Ask. Or don't. I can do silence for hours. The army trains it.'", "She is looking at the middle distance with a wary patience. 'Go on, then. Time's burning, and so is this.' She waves the cigarette."],
      interjections: [
        { skill: "volition", min: 5, text: "Don't treat her as a witness. Don't treat her as a friend. Treat her as someone who might be both on different days." },
        { skill: "instinct", min: 3, text: "The notebook. Left breast pocket, under the tracksuit zip. She touches it when she lies." , cond: "flag.vasha_suspect_notebook || flag.met_vasha" }
      ],
      choices: [
        { text: "'Tell me about yourself, Lieutenant.'", goto: "self", cond: "!flag.vasha_self" },
        { text: "'Why does a gym teacher get the murder?'", goto: "why_her", cond: "!flag.vasha_why" },
        { text: "'Could I have a cigarette?'", goto: "cig", cond: "!has('cigarettes')", once: true },
        { text: "'What are you writing in that notebook?'", goto: "notebook", cond: "flag.vasha_suspect_notebook && !flag.vasha_report_read && !flag.vasha_notebook_tried" },
        { text: "[Show her what you found behind the portrait.]", goto: "mic_show", cond: "flag.clue_mic && !flag.vasha_ally && !flag.vasha_mic_shown" },
        { text: "'What do you know about the Choirmaster?'", goto: "fenwick", cond: "!flag.vasha_fenwick" },
        { text: "'Do you know who the scapegoat is going to be?'", goto: "osk", cond: "!flag.vasha_osk" },
        { text: "'Nothing more. Let's move.'", end: true }
      ]
    },
    self: {
      speaker: "vasha",
      text: "'Myself,' she says, as though you'd asked for a nephew. 'Fifteen years in the Eastern Brigades. Reedmarsh Pass, the Eighth March, half a battalion of boys no older than you who didn't come down. They gave me a medal and a knee. They gave the knee a pension. I do not talk about the medal.'\n\nShe drags on the cigarette. 'Then they gave me a school. The Warden's idea of mercy is a job where nobody dies, provided you count only the ones who stay enrolled.'",
      onEnter: [{ set: "vasha_self", val: true }, { xp: 1 }],
      interjections: [
        { skill: "rote", min: 3, text: "REEDMARSH PASS. 14 DAYS. 'A GLORIOUS RESISTANCE.' FINAL CASUALTIES: 'NOT AVAILABLE FOR PUBLIC DISCLOSURE.' REPEAT: NOT AVAILABLE." },
        { skill: "empathy", min: 4, text: "'The ones who didn't come down.' She hasn't missed one. She counts them every morning in her head and the count changes by a name or two each night, because the Bell takes them." },
        { skill: "authority", min: 4, text: "SHE WAS AN OFFICER. THE VOICE SHE IS NOT USING IS THE ONE THAT WOULD FLATTEN YOU. RESPECT THE VOICE SHE IS NOT USING." },
        { skill: "grit", min: 3, text: "A person can carry a lot of things that are not there. That's mostly what 'tired' is." }
      ],
      choices: [
        { text: "'That sounds like a heavy thing to carry.'", goto: "self2", effects: [{ ideo: "undercurrent", n: 1 }] },
        { text: "'Thank you for your service, Lieutenant.'", goto: "self2b", effects: [{ ideo: "vanguard", n: 1 }, { surv: -1 }] },
        { text: "Say nothing.", goto: "hub" }
      ]
    },
    self2: {
      speaker: "vasha",
      text: "She looks at you in the way you look at weather you didn't expect to be kind. 'Hm. Don't do that. Don't be decent at me before breakfast, or I'll have to remember it.'\n\nBut something has unlatched. 'The thing is,' she says, softer, 'I keep waking up with the same dream. A small voice, singing a song I don't know. Not an anthem. A song that makes my chest hurt. I think it's a real song. I think someone made it up.'",
      onEnter: [{ xp: 1 }, { set: "vasha_dream", val: true }],
      interjections: [
        { skill: "solidarity", min: 3, text: "We all hear it. Somewhere beneath the Anthem, there is a little song, and it is ours, and it keeps trying to rise." },
        { skill: "deduction", min: 5, text: "A song she can't place, a song she isn't allowed. Remember it. There's a man in the Ration Hall who conducts a song he doesn't play." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    self2b: {
      speaker: "vasha",
      text: "She flinches. A tiny, practiced flinch, as if the phrase were a wasp. 'Thanks,' she says, and it is the flattest word of the morning. 'I get that one a lot. It means 'please don't tell me what happened'.' She stubs out her cigarette. 'Ask me something I can answer, will you?'",
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    why_her: {
      speaker: "vasha",
      text: "'A gym teacher gets the murder because I have a uniform, a pension, and no friends.' She counts them off on fingers. 'In District Nine that is a full qualification. The Principal needs a body to stand beside the other body. If the file goes wrong, the file goes wrong on me. If it goes right, it was her idea.'\n\nShe doesn't say 'murder' on purpose, you notice. But she says it again, at the end, a little under her breath. 'Murder.'",
      onEnter: [{ set: "vasha_why", val: true }, { xp: 1 }],
      interjections: [
        { skill: "dialectics", min: 4, text: "She said the word twice. The first time as a joke. The second as a conclusion. Every joke that repeats itself is an admission." },
        { skill: "rhetoric", min: 4, text: "Say it back to her. 'Murder.' Say it flat, like a fact. Watch what she does with her face. It's the cheapest, most devastating test there is." }
      ],
      choices: [
        { text: "'So you think it was murder.'", goto: "murder_push", cond: "!flag.vasha_pushed" },
        { text: "'Understood. Let's get on.'", goto: "hub" }
      ]
    },
    murder_push: {
      speaker: "vasha",
      text: "A long, long moment. She reaches for her cigarette. It's still unlit. She has to look at her own hand to remember that.\n\n'I think,' she says, 'there's a version of this day where we both go home and eat our dinner. I would like that version. I'd also like my leg back, and the last twelve years, and for the Principal to sneeze at the wrong moment and lose her job. I'm not getting any of them.' Then, very quickly: 'Find me something I can't ignore, kid. And I'll see about not ignoring it.'",
      onEnter: [{ set: "vasha_pushed", val: true }, { xp: 2 }],
      choices: [{ text: "'I'll find it.'", goto: "hub", effects: [{ morale: 1 }] }]
    },
    cig: {
      speaker: "vasha",
      text: "She shakes her head. She shakes the packet. A single cigarette rolls out into her palm, bent from months in a pocket.\n\n'You're seventeen,' she says. 'Technically it's a violation of Article Thirty-one, subsection 'Moral Hygiene'.' She puts it in your hand. 'Technically it's also the only thing that will stop your hands shaking. Don't smoke it in front of Lemmy. He'll write it up with a very nice pen.'",
      onEnter: [{ give: "cigarettes" }, { toast: "Received: Cigarettes" }],
      interjections: [
        { skill: "appetite", min: 2, text: "YES. Oh, yes. Light it. Just the thought of it is a warm bath for the whole of your throat." },
        { skill: "volition", min: 4, text: "It will help. It will also be the first thing you reach for for the rest of the day. Know that." },
        { skill: "archive", min: 3, text: "Article 31, 'Moral Hygiene', applies to citizens over eighteen in Public. This is a tracksuit pocket and a stage door. Technically, we're in the clear. Technically." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    notebook: {
      speaker: "vasha",
      text: "'Notebook?' Her hand goes to her chest, then lowers itself with a visible effort. 'Attendance. Shopping. A list of boys who owe me push-ups.' It's too quick, too smooth. She looks away. 'Don't ask about my notebook, kid. I'll remember you asked.'\n\nShe says 'remember', and doesn't smile. Whatever is in that notebook, it was not written for the shopping.",
      onEnter: [{ set: "vasha_notebook_tried", val: true }, { surv: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: "A person guards their notebook the way a sleeper guards a dream. The thing inside is not a list." },
        { skill: "sleight", min: 4, text: "Left breast pocket, button undone, one corner showing. Your fingers would find it in a heartbeat. Whether your conscience would let them is a separate department." }
      ],
      choices: [
        { text: "[Lift it while she lights another cigarette.]", check: { skill: "sleight", diff: 13, id: "vasha_lift_notebook", white: false, pass: "lift_ok", fail: "lift_bad" } },
        { text: "Let it go.", goto: "hub" }
      ]
    },
    lift_ok: {
      speaker: "sleight",
      text: "Two fingers, a flick of the lighter-wheel, her attention going up with the flame like a moth. The notebook leaves her pocket the way a thought leaves a polite conversation: without a sound, and with serious consequences. It's in your sleeve before she exhales. Green cloth cover, soft with handling, corners rounded. A pencil on a thread.\n\nShe doesn't notice. Not yet.",
      onEnter: [{ give: "vasha_notebook" }, { xp: 3 }, { surv: 3 }, { set: "vasha_stole_notebook", val: true }],
      choices: [{ text: "Slip away to read it.", goto: "notebook_read" }]
    },
    lift_bad: {
      speaker: "vasha",
      text: "A hand closes on your wrist, hard, the grip of someone who used to catch things for a living. She doesn't shout. That would be easier.\n\n'No,' she says. 'No, no, no.' She lifts your hand and turns it over, as if looking for the stain. 'I'm going to forget that, because I'm tired. I'm going to forget it exactly once.' She lets go. Her eyes are very bright. 'That's the only mercy in my pocket this morning, kid. Don't spend it twice.'",
      onEnter: [{ surv: 8 }, { morale: -1 }],
      choices: [{ text: "Back off.", goto: "hub" }]
    },
    notebook_read: {
      speaker: "narrator",
      text: "The first pages are, as promised, shopping. Then the handwriting changes. Cramped, careful, a soldier's hand: dated reports, one per day for the last six weeks. SUBJECT: Student {name}. 'Behaviour: quiet. Complains of ringing. Does not sing at Assembly. Recommend: observe.' 'Contact: Commissar Dane, twice, after curfew, gym.' The latest entry is yesterday's, and it ends mid-sentence.\n\nOn the last page, in different ink, a single line: I do not remember Tuesday. I remember a child singing. If I am ordered to report on this, I will. K.",
      onEnter: [
        { set: "vasha_report_read", val: true },
        { thought: "th_informer_in_me" },
        { xp: 2 },
        { note: "task_case", text: "Lt. Kell has been filing daily reports on me for six weeks. She saw me with Dane after curfew in the gym. On the last page she admits she doesn't remember Tuesday." }
      ],
      interjections: [
        { skill: "deduction", min: 4, text: "'Contact: Commissar Dane, twice, after curfew, gym.' So you knew him. You met him. Alone, in a room with no speakers. This is the sort of detail they bury in a Wednesday." },
        { skill: "archive", min: 4, text: "The reports are dated, numbered, signed in a pedantic hand. Which means they have been SENT. Someone is collecting them. Someone with a pigeonhole." },
        { skill: "empathy", min: 5, text: "Not malice. Duty with the blood in it. She writes as though each page weighs more than the last. Read the final line again." }
      ],
      choices: [
        { text: "Confront her.", goto: "confront_report" },
        { text: "Put it back quietly. Keep what you know.", goto: "put_back", effects: [{ surv: -1 }] }
      ]
    },
    confront_report: {
      speaker: "vasha",
      text: "She sees it in your hand and her face goes through four stages, very fast: alarm, rage, shame, and then a kind of terrible relief, like a tooth finally pulled.\n\n'Yes,' she says. 'Every day. They told me I'd get my knee fixed.' She holds out her hand, but doesn't take it. 'You read the last page.' It's not a question. 'I can't promise I won't file the next one. I can promise I'll hate myself. That's all the loyalty I have left.'",
      onEnter: [{ set: "vasha_confronted", val: true }, { xp: 2 }],
      choices: [
        { text: "Give the notebook back. 'Then write something kinder.'", goto: "hub", effects: [{ take: "vasha_notebook" }, { set: "vasha_ally", val: true }, { ideo: "undercurrent", n: 1 }, { surv: -2 }, { morale: 1 }] },
        { text: "Keep it. 'You'll have to find me for it.'", goto: "hub", effects: [{ surv: 6 }, { ideo: "quiet", n: 1 }] }
      ]
    },
    put_back: {
      speaker: "narrator",
      text: "You drop the notebook back into her pocket the way you took it, with all the care of a thief returning a stolen conscience. She doesn't notice. You'll know what she's writing about you. She won't know that you know.\n\nIt is, you realise, the beginning of being a different person.",
      onEnter: [{ take: "vasha_notebook" }, { xp: 1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    mic_show: {
      speaker: "narrator",
      text: "You tell her what you found behind the torn portrait: a small black grille, a cable disappearing into the plaster, a wire running toward the school's central lines. You say it as flatly as you can. The lieutenant doesn't say a word. She goes quite still, and the smoke from her cigarette stops dithering and rises in a single straight thread.\n\nThen she very carefully puts her hand over her own mouth, and nods at the ceiling.",
      onEnter: [{ set: "vasha_mic_shown", val: true }],
      interjections: [
        { skill: "empathy", min: 4, text: "She isn't shocked. She is relieved. Someone has said out loud the thing she has been suspecting every night of her life." },
        { skill: "doublethink", min: 3, text: "No, no, no, friend. Portraits are for respect. Microphones are for fire alarms. Be calm. Say you saw nothing and thereby save four lives, including yours." }
      ],
      choices: [
        { text: "[Persuade her: she can't keep reporting on the one person who found this.]", check: { skill: "rhetoric", diff: 11, id: "vasha_ally_rhetoric", white: true, pass: "ally_ok", fail: "ally_fail" } },
        { text: "[Appeal to what she felt on the Reedmarsh Pass.]", check: { skill: "empathy", diff: 10, id: "vasha_ally_empathy", white: true, pass: "ally_ok", fail: "ally_fail" } },
        { text: "Leave it with her.", goto: "hub" }
      ]
    },
    ally_ok: {
      speaker: "vasha",
      text: "She takes her hand from her mouth. When she speaks it is the old parade voice, scraped down to a whisper. 'Fifteen years I took orders from a thing that listens. You'd think I would have guessed.' She straightens. A knee clicks. 'All right. Stop writing the reports. Start writing the proof. I'll stand where you tell me to stand. I'll keep the Principal off your back till five. After that, you're on your own, and so am I.'\n\nShe holds out her hand. You shake it. It is the first time anyone has shaken your hand today.",
      onEnter: [{ set: "vasha_ally", val: true }, { xp: 3 }, { ideo: "undercurrent", n: 1 }, { morale: 2 }],
      interjections: [{ skill: "solidarity", min: 2, text: "We. A hand clasps another hand, and for a moment the whole school is warmer by a degree." }],
      choices: [{ text: "Continue.", goto: "hub_ally" }]
    },
    ally_fail: {
      speaker: "vasha",
      text: "She shakes her head slowly. 'I can't. I'm sorry. There are a lot of ways to stop being a soldier, kid, but none of them leave you a pension.' She lights the cigarette with an unsteady hand. 'Put it away. If anybody else heard you, it wasn't me who heard it.'\n\nShe turns her face so you can't see it. For a moment, only for a moment, her shoulders are the shoulders of someone very young.",
      onEnter: [{ set: "vasha_mic_shown", val: true }, { surv: 3 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    fenwick: {
      speaker: "vasha",
      text: "'Alder?' Her mouth does something soft and complicated. 'Poor sod. He taught me the Anthem when I took this job. He cried, very quietly, in the middle of a verse, and went on conducting as though nothing had happened. Best thing about him.' She sniffs. 'He has a voice like a broken violin. He's not allowed to sing solos any more. Official reason: 'acoustic fatigue'.'\n\n'If you want to know the real reason, ask him about the Lantern Song. And bring tea.'",
      onEnter: [{ set: "vasha_fenwick", val: true }, { xp: 1 }],
      interjections: [
        { skill: "archive", min: 3, text: "'The Lantern Song'? Not in the Approved Repertoire (Revised), not in the Index of Forbidden Verse. Which means either it's too obscure to ban, or too dangerous to list." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    osk: {
      speaker: "vasha",
      text: "'Osk?' A short, ugly laugh. 'Osk found the body, which in District Nine means Osk did it. Fifty years of mopping up other people's messes. He's seen things, and being seen to have seen is the worst crime we have.' She exhales. 'The Principal's already drafted the paragraph. 'A disturbed caretaker with a grudge.' I told her he can't read.'\n\n'She said that's what makes him reliable.'",
      onEnter: [{ set: "vasha_osk", val: true }, { xp: 1 }],
      interjections: [
        { skill: "dialectics", min: 3, text: "If the innocent are punished because they cannot defend themselves, then helplessness is a crime. This is, I note, an excellent system for manufacturing guilt. Not justice. Guilt." },
        { skill: "solidarity", min: 3, text: "Osk is ours. He mopped our floors for fifty years. He is ours." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    hub_ally: {
      speaker: "vasha",
      text: ["Vasha stands beside you, arms folded, face turned toward the wall, which is her way of looking at the door. 'Orders, sir,' she says, deadpan. It is the first time anyone has made a joke in this building since the spring.", "'Aye,' she says, without looking. 'Ask. I don't mind being a witness. I just mind being the only one.'"],
      interjections: [
        { skill: "empathy", min: 3, text: "She is lighter. Not light, but lighter. The way a person is, a day after a confession." },
        { skill: "solidarity", min: 2, text: "She is one of us. She was always going to be one of us. It just took twelve years and a hanged man." }
      ],
      choices: [
        { text: "'What would you do about the Principal?'", goto: "ally_marr", cond: "!flag.vasha_ally_marr" },
        { text: "'Are you all right, Lieutenant?'", goto: "ally_check", cond: "!flag.vasha_ally_check" },
        { text: "'May I read the notebook? The real pages.'", goto: "ally_notebook", cond: "!flag.vasha_report_read" },
        { text: "'Hold the door while I work.'", end: true, effects: [{ set: "vasha_covering", val: true }] },
        { text: "'Not now.'", end: true }
      ]
    },
    ally_marr: {
      speaker: "vasha",
      text: "'Odalys Marr?' She almost purrs it. 'Brilliant woman. Wasted on this school. She is terrified of exactly one thing, which is her own phone.' She taps the tracksuit pocket where the notebook is. 'She takes a call at five each day. Always the same one. After it, she is never a person again. If you want to see her real face, be in the room when it rings.'\n\nShe grins: sharp, hungry, once-handsome. 'I can arrange a fire drill.'",
      onEnter: [{ set: "vasha_ally_marr", val: true }, { xp: 1 }],
      choices: [{ text: "Continue.", goto: "hub_ally" }]
    },
    ally_notebook: {
      speaker: "vasha",
      text: "She unzips the pocket slowly, the way you would open a letter from a dead relation. 'Pages nine to forty,' she says. 'Skip the shopping. Don't skip the last page.' The notebook is warm from her body. 'If I'd been braver I'd have burned it in spring. Instead I kept it, which is the coward's way of keeping a conscience.'\n\nShe looks away to give you privacy. It is the most tactful thing anyone has done for you all day.",
      onEnter: [{ give: "vasha_notebook" }],
      choices: [{ text: "Read.", goto: "notebook_read" }]
    },
    ally_check: {
      speaker: "vasha",
      text: "'Am I all right?' She considers it honestly, like a woman checking an engine. 'I haven't slept. I smell of smoke and fear. There's a man hanging in my gym and I'm going to eat bread and pretend to be a witness.' A pause. 'Yes. Probably the best I've been since the Pass. Isn't that something?'\n\nShe nudges your shoulder with hers, a surprisingly gentle collision. 'Don't tell the others I was kind.'",
      onEnter: [{ set: "vasha_ally_check", val: true }, { morale: 1 }],
      choices: [{ text: "Continue.", goto: "hub_ally" }]
    }
  }
},


t_mirror: {
  title: "Cracked Dressing Mirror",
  start: [{ cond: "flag.t_mirror_done", node: "again" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: "A tall dressing mirror, bolted to a wardrobe frame in the wings, the glass divided by a crack that runs from the top left corner to the bottom right like an exclamation mark that lost its nerve. Around the edge, old greasepaint thumbprints; someone once used this to be somebody else for an evening. The face in it is yours. It looks a good deal worse than you remember, which is a remarkable trick, as you remember nothing.",
      interjections: [
        { skill: "composure", min: 3, text: "Chin up. Lips together. You are the sort of person who wakes on stages on purpose. Everyone will assume it's a method." },
        { skill: "charm", min: 3, text: "Pale, hollow-eyed, that tragic bruise on the cheekbone: all good. You look like a poet who has seen something. Use it." },
        { skill: "deduction", min: 4, text: "Bruise at the left cheek, fresh, the shape of a knuckle ring. A graze on the neck, thin, as from a cord pulled and let go. Somebody held you, then thought better of it. Or got interrupted." , effects: [{ set: "mirror_bruise", val: true }] }
      ],
      choices: [
        { text: "Look into your own eyes.", goto: "eyes" },
        { text: "Search the wardrobe.", goto: "wardrobe" },
        { text: "Leave.", end: true }
      ]
    },
    eyes: {
      speaker: "narrator",
      text: "You hold your own gaze. It does not want to be held. The eyes in the mirror are the eyes of someone who knows something terrible and has been told to smile about it. You can almost see the wall behind them, the smooth green wall where yesterday used to be.\n\nThe longer you look, the more you feel there is a hairline in the glass that is not in the crack at all: a seam in you, running exactly where the mirror breaks.",
      interjections: [
        { skill: "empathy", min: 3, text: "Poor thing. Poor frightened thing. You look like someone who has been told to forget something and is trying very, very hard to be good at it." },
        { skill: "doublethink", min: 3, text: "That is a happy young citizen in the glass. A rested one. Doesn't he look rested? Anyone would say so." },
        { skill: "the_grey", min: 3, text: "The glass sweats, you know. All glass does, in this city. It is the city's way of crying where it cannot be blamed." }
      ],
      choices: [
        { text: "[Hold the stare until something comes back.]", check: { skill: "volition", diff: 11, id: "t_mirror_stare", white: true, pass: "stare_pass", fail: "stare_fail" } },
        { text: "Look away.", goto: "look" }
      ]
    },
    stare_pass: {
      speaker: "volition",
      text: "You do not look away. Seconds pass. The ringing climbs, thins, and for one clear moment, you remember a taste: copper, like a coin on the tongue, and a voice, close to your ear, saying: 'Not that way. Hold still. They're listening.'\n\nIt isn't a memory. It's the outline of one. But it's yours, and it is a better thing to carry than a blank.",
      onEnter: [{ xp: 3 }, { thought: "th_ghost_of_yesterday" }, { set: "mirror_voice", val: true }, { note: "task_yesterday", text: "In the mirror I remembered a taste of copper and a voice whispering: 'Hold still. They're listening.' Someone was with me last night." }],
      choices: [{ text: "Step back.", goto: "look" }]
    },
    stare_fail: {
      speaker: "narrator",
      text: "The face in the mirror begins to come apart. Not dramatically; just a slow drift, as in a dream, the features sliding a little too far apart, like a bad portrait. You blink and there is only you, trembling at your own reflection. Behind the glass the ringing changes key.\n\nYour knees are very cold. When you look back, the mirror shows a stranger, wearing your clothes and a very polite expression.",
      onEnter: [{ morale: -1 }, { sfx: "static" }],
      choices: [{ text: "Step back.", goto: "look" }]
    },
    wardrobe: {
      speaker: "narrator",
      text: "The wardrobe doors hang open like a pair of dislocated wings. Inside: a rack of costumes smelling of mothballs and old applause. A Patriotic Peasant, a Wise Old Miner, a papier-mâché Wolf of Winter. On a hook inside the door, a school cap with the badge torn off. In the dressing-table drawer: a jumble of powder puffs, wig pins, and a small round pocket mirror, its back engraved with the initials O.D.",
      onEnter: [{ time: 5 }, { set: "t_mirror_done", val: true }],
      interjections: [
        { skill: "archive", min: 3, text: "O.D. Odalys... no, Marr is O.M. Ostrov Dane. O.D. This object belonged to the Commissar. Why would a dead man's mirror be in a theatre's drawer?" },
        { skill: "sleight", min: 3, text: "Pocket mirror: small, light, slides into a cuff. Cap: nobody will miss it. Neither is yours. Neither is not yours." },
        { skill: "appetite", min: 3, text: "Wig powder. It tastes of nothing. Do NOT lick the powder. We've done that one." }
      ],
      choices: [
        { text: "Take the pocket mirror.", goto: "got_mirror", effects: [{ give: "pocket_mirror" }, { toast: "Received: Pocket Mirror" }], cond: "!has('pocket_mirror')", once: true },
        { text: "Take the cap.", goto: "got_cap", effects: [{ give: "school_cap" }, { toast: "Received: School Cap" }], cond: "!has('school_cap')", once: true },
        { text: "Step back.", goto: "look" }
      ]
    },
    got_mirror: {
      speaker: "narrator",
      text: "A small round mirror in a tin frame. The glass is clean; the initials O.D. have been scratched into the back with a pin. Someone has also scratched something shorter underneath, in a hurried hand: WATCH THE ROOM, NOT THE FACE. It is a strange instruction. In a mirror, you suppose, the room is all you ever see.",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "deduction", min: 4, text: "A pocket mirror is for looking behind you. For looking at ceilings without lifting your chin. For checking whether a portrait is what it says it is. This was a spy's instrument disguised as vanity." }
      ],
      choices: [{ text: "Continue.", goto: "wardrobe" }]
    },
    got_cap: {
      speaker: "narrator",
      text: "A standard-issue cap of grey felt, the badge picked off with a razor, leaving a ghost of stitching. There's a name in the lining, written in biro, rubbed to a smudge: it might say SEL, or SELD, or SEV, or just the way a name looks after a thousand days of sweat. You put it on. It fits as if it had been waiting for you, which is not impossible.",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "composure", min: 3, text: "A cap brings down the brow and lifts the gravity. You now look like someone who knows exactly where he is going. Do not disturb the illusion." }
      ],
      choices: [{ text: "Continue.", goto: "wardrobe" }]
    },
    again: {
      speaker: "narrator",
      text: "The mirror again. The crack still runs through the middle of you. Your reflection regards you with a patience that is not quite friendly and not quite otherwise.",
      interjections: [
        { skill: "the_grey", min: 2, text: "The glass keeps one thing for itself: the minute before you looked." }
      ],
      choices: [
        { text: "Search the wardrobe again.", goto: "wardrobe", cond: "!has('pocket_mirror') || !has('school_cap')" },
        { text: "Leave.", end: true }
      ]
    }
  }
},

t_trunk: {
  title: "Prop Trunk",
  start: [{ cond: "flag.read_note_1", node: "empty" }, { cond: "flag.trunk_open", node: "open" }, { node: "shut" }],
  nodes: {
    shut: {
      speaker: "narrator",
      text: "A battered prop trunk with brass corners and the sticker of a long-dead touring company. It is not locked, exactly. The latch has been wedged with a folded wad of paper, and the paper is warm. Somebody has opened this recently and tried to make it look unopened.\n\nThe lid is heavy. The trunk is very much more than a trunk, the way a closed fist is more than a hand.",
      interjections: [
        { skill: "deduction", min: 3, text: "Scuffs on the brass, fresh. Dust on the lid, undisturbed except for two small crescents at the front: a thumbnail's worth. A person with small hands lifted this recently, put it down gently, and then felt cleverer." },
        { skill: "senses", min: 3, text: "Paper smell, ink, a hint of the tinny rust that old banknotes have. Not a prop." }
      ],
      choices: [
        { text: "[Force the lid.]", check: { skill: "brawn", diff: 8, id: "t_trunk_lid", white: true, pass: "open_pass", fail: "open_fail" } },
        { text: "[Work the latch free with a pin.]", check: { skill: "slip", diff: 9, id: "t_trunk_latch", white: true, pass: "open_pass", fail: "open_fail" } },
        { text: "Leave it.", end: true }
      ]
    },
    open_fail: {
      speaker: "narrator",
      text: "The lid will not budge, then budges all at once and slams back on your fingers with a crack that echoes through the entire theatre. You hop. The dust rises in applause. From very far away, in the corridor, a door that should not have heard stops moving.\n\nThere is a long silence. Then a distant mutter of footsteps goes on past, unconcerned. For now.",
      onEnter: [{ hp: -1 }, { surv: 2 }],
      interjections: [
        { skill: "grit", min: 2, text: "Pain is just the body's version of a loud bureaucrat. Ignore the volume, read the content: fingers fine." },
        { skill: "reflex", min: 3, text: "Next time, move the hand before the lid arrives. I'd say 'I told you so', but I'm too busy not having told you." }
      ],
      choices: [{ text: "Try again.", goto: "shut" }, { text: "Leave it.", end: true }]
    },
    open_pass: {
      speaker: "narrator",
      text: "The lid lifts with a long yawn. Inside: the costumes of an unfinished pageant. THE WARDEN DEFEATS WINTER, a four-act drama in verse, rehearsed for six weeks and cancelled for a fortnight. A felt Winter with a cotton-wool beard. A tin crown on a velvet cushion. A prop revolver stamped TOY: NOT FOR RESISTANCE. A sock puppet of the Warden with a startled face.\n\nBeneath the costumes, the floor of the trunk is very slightly too shallow.",
      onEnter: [{ set: "trunk_open", val: true }, { time: 5 }],
      interjections: [
        { skill: "archive", min: 3, text: "The Pageant of Winter: approved in March, cancelled in May. Formal reason: 'Winter has been abolished by decree.' The weather bureau, I assure you, did not comment." },
        { skill: "rhetoric", min: 3, text: "A cancelled pageant about defeating Winter, and a trunk with a false floor. If you wanted to make a metaphor out of this room you wouldn't need to try." },
        { skill: "appetite", min: 3, text: "The tin crown is chocolate foil. NO. It is chocolate foil, which means... no. It's empty. Sorry. Nothing in there. I wept." }
      ],
      choices: [
        { text: "Test the floor of the trunk.", goto: "open" },
        { text: "Search the costumes for anything useful.", goto: "costumes" },
        { text: "Close the lid.", end: true }
      ]
    },
    costumes: {
      speaker: "narrator",
      text: "You dig through Winter's beard, a Patriotic Peasant's smock, and four unmatched gloves. Nothing but moths and the mild humiliation of the props. Except: in the inner pocket of the Wise Old Miner's coat, a single sweet wrapper with a line of pencil on it: SOUP AT SIX, SING AT NONE.\n\nIt means nothing to you. It means something to someone; the wrapper is crisp with intention.",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "rote", min: 3, text: "SOUP AT SIX. SERVED: 18:00. PUBLIC SONG: MANDATORY AT 18:30. 'SING AT NONE' IS THEREFORE AN ILLEGAL SENTENCE. COMPILE AND REPORT." , effects: [{ surv: 1 }] },
        { skill: "doublethink", min: 3, text: "Someone's idea of a joke. Throw it away. Burn it, friend. A wrapper is just a wrapper until it's in the wrong pocket." }
      ],
      choices: [{ text: "Go back to the false floor.", goto: "open" }]
    },
    open: {
      speaker: "narrator",
      text: "The trunk is open, its guts of felt and tin laid bare. The floor of it still sits a finger too shallow, and your hands know it before your head does.",
      choices: [
        { text: "[Test the floor of the trunk.]", check: { skill: "senses", diff: 9, id: "t_trunk_floor", white: true, pass: "false_floor", fail: "floor_fail" } },
        { text: "Dig through the costumes.", goto: "costumes", cond: "!flag.trunk_dug" },
        { text: "Leave.", end: true }
      ]
    },
    floor_fail: {
      speaker: "senses",
      text: "The floor of the trunk is a floor. Wood. Dull. The smell of rot. There is a faint hollow knock when you drum your knuckles near the hinge, but it goes around the room like a bird and could be anywhere. Come back when your ears are better trained, or your patience is. The trunk isn't going anywhere.",
      onEnter: [{ set: "trunk_dug", val: true }],
      choices: [{ text: "Step back.", goto: "open" }]
    },
    false_floor: {
      speaker: "senses",
      text: "A knock, then a second knock, lower. The hollow answers, plain as a door. There: a thin seam where the board meets the wall of the trunk, painted over, with a nick the size of a pen-nib. You lever it with the blunt end of a wig pin, and the false floor lifts like an eyelid. A folded sheet of lined school paper lies beneath, pressed flat by years of costumes.\n\nThe handwriting is yours.",
      onEnter: [{ give: "note_yesterday_1" }, { set: "read_note_1", val: true }, { xp: 2 }, { toast: "Found: Note from Yesterday (1/3)" }, { note: "task_yesterday", text: "Found the first note from Yesterday-Me in the prop trunk. It was in my handwriting." }],
      choices: [{ text: "Read it.", goto: "note1" }]
    },
    note1: {
      speaker: "narrator",
      text: "1/3.\n\nIf you are reading this, the Bell took the night again, and you are standing in the Old Theatre feeling clever for finding this, which is correct, and which I'd be proud of if I were allowed to remember being proud.\n\nWhat I know: I carried something for O. across the school. I hid it where nobody can hear it. I am not allowed to write where. Go to the gym. Go to where he did his pull-ups: the bench. The second page is under the seat. I have drawn a small pig on it so you'll know it's mine.\n\nDon't sing. Trust the ringing. - you",
      interjections: [
        { skill: "archive", min: 3, text: "Observe: 'O.' Ostrov. Observe: 'carried.' We are, therefore, a courier. And 'the second page is under the seat' implies a numbered series, hence three pages. I knew it. I KNEW it." },
        { skill: "empathy", min: 3, text: "Read the last line again. 'You.' He signed it 'you'. Not a name, not a rank. He wrote this to the person he knew would be most alone: yourself." },
        { skill: "volition", min: 4, text: "He knew you'd be afraid, so he put a pig on the next page. A small, kind joke. Hold on to that." }
      ],
      onEnter: [{ thought: "th_paper_heart" }],
      choices: [{ text: "Fold it away. Go to the gym.", end: true, effects: [{ note: "task_yesterday", text: "Note 1: I carried something for 'O.' and hid it. The second page is under a seat in the gym bleachers. 'Don't sing. Trust the ringing.'" }] }]
    },
    empty: {
      speaker: "narrator",
      text: "The trunk, now empty of secrets. The Winter beard has a leer. The tin crown has a little less dignity. The sock puppet of the Warden watches you with a startled sock-face, and you have the distinct sense that it, too, would like to say something under the proper conditions.",
      interjections: [
        { skill: "aim", min: 2, text: "You could throw the puppet into the rafters from here. I've done the geometry. It would take three tries and a great deal of self-respect." }
      ],
      choices: [{ text: "Close the lid.", end: true }]
    }
  }
},

t_horn: {
  title: "Old PA Horn",
  start: [{ cond: "flag.t_horn_done", node: "after" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: "A brass horn the size of a barrel, bolted to the wall, its mouth stuffed with a rag, its bell gone green where the damp has kissed it. The cable that fed it runs out of the back and into the plaster, where it stops, as though the wall had swallowed it. It has not been used for any sound in six months. Yet when you stand near it, you can feel the metal humming, very faintly, in your teeth.",
      interjections: [
        { skill: "the_grey", min: 3, text: "Old brass. Old damp. Old breath. This one remembers every Assembly from the year it was hung. It remembers the ones that went wrong. It does not remember the ones that went right, because there weren't any." },
        { skill: "instinct", min: 3, text: "That hum. It's the pitch of the ringing. Your ringing. The same note, not close, THE SAME." },
        { skill: "doublethink", min: 2, text: "A decorative horn. Isn't it handsome? It cannot hear you, friend. Not any more. Please say something, so you can be reassured." }
      ],
      choices: [
        { text: "Press your ear to the horn.", goto: "ear" },
        { text: "Pull the rag out.", goto: "rag" },
        { text: "Leave it.", end: true }
      ]
    },
    ear: {
      speaker: "narrator",
      text: "Cold metal against your cheekbone. For a moment, it's only the ringing, enormous, as though the horn were a cupped hand around your own skull. Then, deeper, at the very edge of hearing, there is a second sound: a rhythm of soft clicks, regular as a clock, nearly a heartbeat. It is faint. It is the sound of something being recorded.",
      onEnter: [{ time: 2 }],
      interjections: [
        { skill: "senses", min: 4, text: "Not a clock. A relay. Every eleven seconds: click. Every eleven seconds: a very small pause in the humming. Something downstream is checking whether anyone is still here." , effects: [{ xp: 1 }], once: true },
        { skill: "deduction", min: 5, text: "A dead horn with a live circuit behind it. The theatre has been shut since the spring, but somebody still pays for the electricity. For whom? For what?" }
      ],
      choices: [
        { text: "Hum the note back at it.", goto: "hum", cond: "!flag.horn_pitch" },
        { text: "Step away.", goto: "look" }
      ]
    },
    rag: {
      speaker: "narrator",
      text: "You tug the rag out of the horn's mouth. It comes slowly, damp and heavy, and with it a small drift of dead moths and a crumpled curl of paper. The paper is a ration slip, many months old, on which someone has written, in tiny capitals: HE LISTENS FROM THE WALLS, NOT FROM THE SKY. It is the sort of graffiti you could only write if you were confident nobody would ever find it. Or desperate to be found.",
      onEnter: [{ xp: 1 }, { set: "horn_slip", val: true }],
      interjections: [
        { skill: "rote", min: 3, text: "ARTICLE SEVEN: THE WARDEN HEARS ALL. ARTICLE SEVEN, FOOTNOTE: 'HEARS' IS A FIGURE OF SPEECH. ARTICLE SEVEN, ANNEX B: HEARS IS NOT A FIGURE OF SPEECH." },
        { skill: "solidarity", min: 4, text: "Somebody else wrote this and left it for a stranger. Somebody afraid and kind. That's us. That is all of us." }
      ],
      choices: [{ text: "Hum the note back at it.", goto: "hum", cond: "!flag.horn_pitch" }, { text: "Step away.", goto: "look" }]
    },
    hum: {
      speaker: "narrator",
      text: "You remember the forearm: DON'T SING. But you aren't singing. You're humming, low in your throat, just the one note, the note that has lived in your head all your life. The horn takes it. The bell of the brass begins to buzz, then to sing, a sweet thin shiver of sympathetic vibration, as if the old thing had been waiting for exactly this pitch for years.\n\nA moment later, the ringing in your head and the ringing in the metal lock together with a click you feel in your sternum.",
      onEnter: [{ set: "horn_pitch", val: true }, { set: "t_horn_done", val: true }, { surv: 4 }, { sfx: "chime" }, { xp: 2 }, { thought: "th_bell_tolls" }, { note: "task_radio", text: "The old PA horn in the theatre resonates with the exact pitch of my childhood ringing. The Bell's carrier tone and my ringing are the same note." }],
      interjections: [
        { skill: "aim", min: 3, text: "Perfect. You hit it dead centre. I couldn't have done it better if I'd been a dart." },
        { skill: "adrenaline", min: 3, text: "WHOA. WHOA. That's the SAME NOTE. That's the note. THAT'S THE NOTE." },
        { skill: "authority", min: 4, text: "STOP THAT HUMMING, SOLDIER. THEY HEAR THAT KIND OF THING. ... THAT WAS INCREDIBLE." }
      ],
      choices: [{ text: "Step away, shaking.", goto: "after" }]
    },
    after: {
      speaker: "narrator",
      text: "The horn is silent now, its brass cold again. Still, you can feel the faint vibration in your fingers, like the memory of a handshake. If the Bell has a pitch, you now know it better than anyone at the school. Somebody who builds radios would want to hear that.",
      interjections: [
        { skill: "rhetoric", min: 4, text: "A note is an argument too. It says: I exist at this frequency, and nothing else ever will. Keep it ready for the girl with the screwdrivers." }
      ],
      choices: [{ text: "Leave.", end: true }]
    }
  }
},

t_poster: {
  title: "Peeling Poster",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "A poster hangs off the wall in long curls, five layers deep, like a geological cross-section of the state's moods. The topmost sheet, new and glossy, shows the Warden gazing across a field of wheat, above the words ONE BELL, ONE UNION. Beneath, in the gaps where it has peeled, are older ones: stern, reproachful, even, in one corner, a little hopeful.",
      interjections: [
        { skill: "archive", min: 2, text: "Five posters, papered over in sequence. I could date them from the typeface alone. The oldest is eleven years old; the most recent, last Tuesday. I would like a ruler, a magnifying glass, and the afternoon." },
        { skill: "doublethink", min: 3, text: "Look at his eyes. They follow you. That's affection. They have always been affection." }
      ],
      choices: [
        { text: "Peel back the layers.", goto: "layers" },
        { text: "Study the top poster.", goto: "top" },
        { text: "Leave it.", end: true }
      ]
    },
    top: {
      speaker: "narrator",
      text: "TONIGHT AT 21:00: THE HARMONY BROADCAST. ATTENDANCE COMPULSORY (JOYFULLY). Below it, a tiny line of regulation text: 'Citizens must stand, face the nearest speaker, and join the chorus. Absence will be treated as illness, and illness as absence. Please remain in a good mood.'\n\nSomeone has drawn a very small question mark after the word JOYFULLY, in pencil, and then, thinking better of it, tried to rub it out.",
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "dialectics", min: 3, text: "Absence is treated as illness. Illness is treated as absence. Therefore the sick are absent and the absent are sick, and attendance is the only cure. It's a closed circle. It's very beautiful. I'd like to meet whoever drew it." },
        { skill: "rhetoric", min: 3, text: "'Joyfully.' You cannot legislate adverbs. Or rather, you can, and they have, and now none of us can say 'happily' without a faint ache." , effects: [{ xp: 1 }], once: true },
        { skill: "volition", min: 4, text: "At nine, the Bell rings. Whatever you are going to do today, you'll have to do it before then. Pin it to your forearm if you must." }
      ],
      choices: [{ text: "Peel back the layers.", goto: "layers" }, { text: "Leave it.", end: true }]
    },
    layers: {
      speaker: "narrator",
      text: "You lift the corner. THE WARDEN HEARS, says the second layer, in thick red capitals. Under it, on yellowing paper: THE WARDEN LISTENS. The one beneath: THE WARDEN ASKS. And last, brown and brittle, the shape of a sentence from another era: WHAT SHALL WE ASK THE WARDEN? In a childish hand, written in the margin of the very last sheet, something pencil-thin has survived the glue: BREAD KNOWS.",
      onEnter: [{ time: 4 }, { set: "poster_layers", val: true }],
      interjections: [
        { skill: "archive", min: 3, text: "ASKS, LISTENS, HEARS. Three verbs in a decade, each one a fraction less polite. Next year, they will print 'KNOWS'. After that, the poster will no longer be necessary.", effects: [{ xp: 2 }], once: true },
        { skill: "dialectics", min: 4, text: "From 'asks' to 'hears' is the history of an entire regime in three words. A question, a courtesy, a fact. The sequence is an argument." },
        { skill: "the_grey", min: 3, text: "Glue and damp. They hold things together for eleven years, and then, by autumn, the building takes them back." }
      ],
      choices: [
        { text: "'BREAD KNOWS.' What does that mean?", goto: "bread" },
        { text: "Press the old layers back down.", end: true }
      ]
    },
    bread: {
      speaker: "narrator",
      text: "Three words in a child's hand, pencilled under eleven years of glue. Bread knows. It might be a nursery rhyme, a childish blessing, or a very old joke. It might be a code. It might be nothing more than a hungry student's graffiti.\n\nBut the Ration Hall is the only place in the school that makes bread, and the cook there has the sort of forearms that could knead a revolution.",
      onEnter: [{ set: "poster_bread", val: true }, { xp: 1 }, { note: "task_yesterday", text: "Under the layers of posters in the theatre: 'BREAD KNOWS.' Possibly a clue about the Ration Hall cook." }],
      interjections: [
        { skill: "appetite", min: 3, text: "Bread knows! Bread does know! Warm bread knows everything! Please can we go to the Ration Hall now?" },
        { skill: "instinct", min: 4, text: "Not a joke. Written by someone who needed it to survive being glued over. That's how real messages live: under something louder." },
        { skill: "solidarity", min: 3, text: "Who wrote it? A hungry child? A baker? A we? Whoever it was, they believed that bread would carry it." }
      ],
      choices: [{ text: "Leave it.", end: true }]
    }
  }
},


ostrov: {
  title: "Commissar Ostrov Dane",
  start: [{ cond: "flag.body_examined", node: "hub" }, { node: "first" }],
  nodes: {
    first: {
      speaker: "narrator",
      text: "He hangs in his good dark suit like a coat on a hook. A man of perhaps forty, with a long, tired, intelligent face, the sort of face a person gets from reading small print for a living. The rope runs from his neck up to the hoop's iron frame; his hands hang open at his sides; the toes of his polished boots turn slowly, an inch above the checkered boards, pointing first at the door and then at the wall.\n\nHe doesn't look afraid. He looks as if he had been interrupted in the middle of a sentence.",
      onEnter: [{ set: "body_examined", val: true }, { time: 5 }, { task: "task_case", state: "active" }],
      interjections: [
        { skill: "empathy", min: 3, text: "Not fear. Not despair. Surprise. The face of someone who thought he had more time to say the last part." },
        { skill: "grit", min: 3, text: "You can look. It's only a body. It's only a man who isn't there. You've seen things go quiet before. Go on." },
        { skill: "deduction", min: 3, text: "No stool. No chair. No ladder. A man cannot hang himself from nothing, not even in District Nine. Somebody removed the way he got up there, or somebody lifted him." },
        { skill: "rote", min: 4, text: "YOUTH COMMISSAR OSTROV DANE. APPOINTED THREE YEARS PRIOR. COMMENDED FOR 'EXEMPLARY MORAL HYGIENE'. NO KNOWN ENEMIES. NO KNOWN FRIENDS. NO KNOWN PAST." },
        { skill: "doublethink", min: 3, text: "A tragic accident of the soul. He was overworked. Wasn't he overworked? There is nothing to see here, and you will have seen it very thoroughly." }
      ],
      choices: [
        { text: "Look closer.", goto: "hub" }
      ]
    },
    hub: {
      speaker: "narrator",
      text: ["The Commissar turns another degree, away, then back. The rope creaks a long, patient note. From the doorway, Vasha watches, smoking, offering neither help nor instruction.", "Dust sifts from the hoop's frame whenever he turns. Whatever else you do here, you'll be doing it under his eyes. They are half open, and politely elsewhere."],
      interjections: [
        { skill: "volition", min: 5, text: "Take it a piece at a time: feet, hands, neck, pockets, face. Don't try to look at the whole of him at once; nobody can." }
      ],
      choices: [
        { text: "[Examine his boots.]", goto: "boots", cond: "!flag.clue_boots && !flag.ostrov_boots_tried" },
        { text: "[Examine the rope marks on his neck.]", goto: "neck", cond: "!flag.ostrov_neck" },
        { text: "[Go through his pockets.]", goto: "pockets", cond: "!flag.clue_chalk && !flag.ostrov_pockets_tried" },
        { text: "Look at his face.", goto: "face", cond: "!flag.ostrov_face" },
        { text: "Look at the lanyard on his chest.", goto: "lanyard", cond: "!flag.ostrov_lanyard" },
        { text: "Let the silence in. Listen.", goto: "grey", cond: "!flag.ostrov_grey" },
        { text: "Pay your respects.", goto: "respects", cond: "!flag.ostrov_respects" },
        { text: "[You have what you need. Name the killer.]", dialogue: "accuse", cond: "flag.clue_rope && flag.clue_mic && flag.knows_rhea" },
        { text: "[You don't have proof. Say it anyway.]", goto: "reckless", cond: "!(flag.clue_rope && flag.clue_mic && flag.knows_rhea)" },
        { text: "Step back.", end: true }
      ]
    },
    boots: {
      speaker: "narrator",
      text: "The boots are black, officer's issue, polished to a mirror shine. You crouch and look at them from three sides. The heel-caps are immaculate, no gym-floor resin, no scuffs. But the toe-caps are scored, each with two long, parallel furrows, as if they had been dragged across something rough.",
      onEnter: [{ time: 3 }, { set: "ostrov_boots_tried", val: true }],
      choices: [
        { text: "[Read the scuffs.]", check: { skill: "deduction", diff: 10, id: "ostrov_boots_check", white: true, pass: "boots_pass", fail: "boots_fail" } },
        { text: "Leave them.", goto: "hub" }
      ]
    },
    boots_pass: {
      speaker: "deduction",
      text: "Toe-caps scored. Heels clean. A man who walks into a room puts his heels down first, and they wear. A man who is dragged in backward leaves two long furrows with his toes. Ostrov Dane did not walk into this gymnasium; he was brought. By someone strong, or someone patient, or two of someone. The polish on the boots is fresh: they cleaned them after, to hide the grit.\n\nIt isn't proof. But it is the first thing in the room that doesn't care what the Principal wants.",
      onEnter: [{ set: "clue_boots", val: true }, { xp: 3 }, { note: "task_case", text: "Ostrov's boots: heels clean, toes scored in two parallel furrows. He was dragged to the hoop on his back, not walked. Someone cleaned the boots afterwards." }],
      interjections: [
        { skill: "dialectics", min: 4, text: "A suicide walks. A body dragged is a body not consulted. The inference is cold and very clean; I find it beautiful, and I'm sorry." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    boots_fail: {
      speaker: "narrator",
      text: "Scuffs. Boots. A man who wore his shoes. The marks might mean anything: kicking, struggling, someone's cleaning cloth, a long morning of nervous pacing. You stare until the furrows start to look like a pair of eyes. Then they definitely do. You stand up, a little embarrassed.\n\nVasha clears her throat very quietly, in the manner of a person who has not said anything.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    neck: {
      speaker: "narrator",
      text: "You make yourself look at his throat. The rope has gone deep, but not evenly: a bruise runs diagonally from the left ear to the base of the right jaw, and below it, a second mark, fainter, almost horizontal. As if two cords had been used, one slipped, then another. Beneath the collar, a thin red line like the hem of a seam.\n\nSomething in your own throat tightens at the sight of it, a ghost sensation from your own graze.",
      onEnter: [{ set: "ostrov_neck", val: true }, { time: 4 }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 5, text: "Two marks. The first from a ligature, the second from the noose. He was strangled with a cord, and then hung. Somebody wanted the rope to be the cause of death. It was the last thing, not the first." , effects: [{ set: "neck_two_marks", val: true }] },
        { skill: "grit", min: 4, text: "Don't flinch. The graze on your own neck matches the shape of the lower mark. Be sure you want to think about that now." },
        { skill: "archive", min: 4, text: "Postmortem lividity, per Regulation 22: pooling of blood in the lower limbs, should present within two hours. Here it has pooled at the small of the back. He lay flat for hours before he hung." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    pockets: {
      speaker: "narrator",
      text: "His jacket hangs open. Inside breast pocket, a slim leather wallet with a Commissar's card and a family photograph the size of a stamp. Left outer pocket, something small and hard. Vasha has turned very slightly toward the window, which in the language of old soldiers is permission and a warning in one.",
      onEnter: [{ set: "ostrov_pockets_tried", val: true }, { time: 3 }],
      interjections: [
        { skill: "sleight", min: 3, text: "Dead men have loose pockets. Two fingers, a flat palm, no friction. You've done this before, you suspect, but you've done it with living men, and that's a different set of manners." },
        { skill: "authority", min: 4, text: "THIS IS A CRIME SCENE. TOUCHING THE EFFECTS OF THE DEAD WITHOUT AUTHORITY IS A VIOLATION. YOU DO HAVE AUTHORITY. NOBODY KNOWS IT YET." }
      ],
      choices: [
        { text: "[Slip your hand into the left pocket.]", check: { skill: "sleight", diff: 9, id: "ostrov_pocket_slip", white: true, pass: "pockets_pass", fail: "pockets_fail" } },
        { text: "[Ask Vasha for permission.]", goto: "pockets_ask", cond: "!flag.vasha_ally" },
        { text: "Leave him alone.", goto: "hub" }
      ]
    },
    pockets_ask: {
      speaker: "vasha",
      text: "'Permission,' she says, without turning. 'It's all very formal.' She sucks on the cigarette. 'You are my assistant. Assistants search. I've been looking at that window for a minute and a half and I have just noticed how interesting it is.' A beat. 'If I turn round and you're still going through his things, I shall be obliged to write it up. Make it quick.'",
      onEnter: [{ surv: 1 }],
      choices: [{ text: "[Go through the pocket, quickly.]", check: { skill: "sleight", diff: 8, id: "ostrov_pocket_slip_vasha", white: true, pass: "pockets_pass", fail: "pockets_fail" } }]
    },
    pockets_pass: {
      speaker: "narrator",
      text: "Cold fabric, cold wallet, the faint smell of tobacco and boot-polish. In the left pocket your fingers find a stub of white chalk, worn to a finger-nail, and a single wrapped sugar lump. Chalk and sugar: a teacher's pockets. The kind of man who marks things up on blackboards and rewards himself with a dull sweet.\n\nThe chalk is the same chalk as the smears on your palms. You feel the connection like a loose tooth.",
      onEnter: [{ give: "chalk_stub" }, { set: "clue_chalk", val: true }, { xp: 3 }, { toast: "Received: Chalk Stub" }, { thought: "th_chalk_dust" }, { note: "task_yesterday", text: "Ostrov's pocket held a stub of chalk like the chalk on my own hands. We marked something together last night." }],
      interjections: [
        { skill: "appetite", min: 3, text: "SUGAR! No. It's a dead man's. ... He wouldn't mind. ... You'd mind. Give it to the Ration Hall, give it to someone small." },
        { skill: "empathy", min: 4, text: "A sugar lump in a pocket. A small apology carried for someone. For whom? There is always someone." },
        { skill: "deduction", min: 4, text: "White chalk on his fingers, white chalk on yours, white chalk on the portrait's frame. A chain, three links long." }
      ],
      choices: [
        { text: "Take the sugar lump too.", goto: "sugar", effects: [{ give: "sweet_roll" }], cond: "!flag.ostrov_sugar", once: true },
        { text: "Continue.", goto: "hub" }
      ]
    },
    sugar: {
      speaker: "narrator",
      text: "You drop the sugar lump into your cuff without really deciding to. It is a little silver-wrapped thing with a bite of crimped paper at each end. In the Greater Union of Karsovia, a lump of sugar is a bribe, a luxury, and a love letter all at once. You don't know which of the three this was.",
      onEnter: [{ set: "ostrov_sugar", val: true }, { toast: "Received: Sweet Roll (sugar)" }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    pockets_fail: {
      speaker: "narrator",
      text: "Your fingers bump the cold wallet, the wallet slides, and the whole jacket rocks. For one horrible moment, the Commissar turns to face you, his half-open eyes sliding across yours. The rope gives its long, low creak. Behind you, Vasha says, clearly, loudly, 'STUDENT. Hands off the deceased.'\n\nShe doesn't turn round. But it was a performance, and the audience was somewhere beyond the walls.",
      onEnter: [{ surv: 6 }, { morale: -1 }, { set: "ostrov_pockets_failed", val: true }],
      choices: [{ text: "Back away.", goto: "hub" }]
    },
    face: {
      speaker: "narrator",
      text: "You stand directly under his face. The skin is waxy, the colour of tallow. The mouth is slightly open, as though a word were still on the way. The lashes are very long. There is a small scar over his left eyebrow, the sort a boy gets from a bicycle.\n\nThere is a tiny smear of chalk at the corner of his lip. As though, at the last, he had put his fingers to his mouth to keep from saying something.",
      onEnter: [{ set: "ostrov_face", val: true }, { xp: 1 }],
      interjections: [
        { skill: "empathy", min: 4, text: "Not 'keep from saying'. To keep from SINGING. The forearm. DON'T SING. He wrote nothing on his arm; he put his hand over his mouth." },
        { skill: "rhetoric", min: 3, text: "Every face is an argument for or against the world. His is a closing statement, interrupted." },
        { skill: "composure", min: 4, text: "Steady. Hold your own face still while you read his. If you flinch, the dead will see it first." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    lanyard: {
      speaker: "narrator",
      text: "His lanyard hangs against his chest, turned in the draught. A laminated card: YOUTH COMMISSAR O. DANE, FIRST CLASS. A bar-code, a photograph of a younger and rather happier man, and a line of blue ink that has been written over the standard text: ASK ME ABOUT THE LEDGER. Whoever added it did so in a hand so tiny that you have to lean in until your nose almost touches his tie.",
      onEnter: [{ set: "ostrov_lanyard", val: true }, { xp: 1 }],
      interjections: [
        { skill: "archive", min: 3, text: "'The Ledger.' Capital L. Not 'a ledger'; 'The'. Whoever wrote it had a particular book in mind. Possibly the book. Possibly the only book." , effects: [{ task: "task_ledger", state: "active" }, { note: "task_ledger", text: "Ostrov's lanyard has a line added in tiny ink: ASK ME ABOUT THE LEDGER. I must find out what the Ledger is." }] },
        { skill: "rote", min: 4, text: "LEDGER: AN ACCOUNT OF DEBTS AND CREDITS. ALL STATE LEDGERS ARE PROPERTY OF THE REVENUE BUREAU. UNAUTHORISED POSSESSION OF A LEDGER IS A SERIOUS OFFENCE. SEE ALSO: ATTEMPTED ACCURACY." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    grey: {
      speaker: "the_grey",
      text: "Quiet. The gym holds its breath. The air above the Commissar tastes of cold iron and old chalk. I, the Grey, have a body in my belly this morning, and I am not unhappy about it, nor happy; I am only a weather, and weathers do not take sides. But let me tell you what the hoop remembers.\n\nHe came in at two. He was not alone. He was not frightened of the one who came with him, not at first. The floor knew them both by their footfall. He said, 'You've no right to look at me like that.' And then there was the sound of a long inhale, the sound a person makes when the decision has already been made.",
      onEnter: [{ set: "ostrov_grey", val: true }, { xp: 2 }, { thought: "th_quiet_hands" }],
      interjections: [
        { skill: "instinct", min: 4, text: "That's not poetry, that's testimony. The building is telling you the truth in the only way it can." },
        { skill: "volition", min: 5, text: "Be careful. The Grey will say anything, convincingly. Listen. Verify. Don't hang a human being on weather." }
      ],
      choices: [{ text: "'Who came with him?'", goto: "grey2" }, { text: "Shake it off.", goto: "hub" }]
    },
    grey2: {
      speaker: "the_grey",
      text: "Boots on checkered tile. A particular rhythm, left-right-left, very upright, very proud, a walk learned on parade grounds and then improved by contempt. A smell of orange peel and gun-oil. Something small and bright dropped and rolled. Then breath. Then quiet. And a grunt, that you will recognise when you hear it again.\n\nI cannot give you a name. I am concrete; I have no names, only the shape of weight. But it was someone who had never once been told 'no'.",
      onEnter: [{ set: "ostrov_grey2", val: true }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 5, text: "Orange peel and gun-oil. Parade stride. Something small and bright, dropped. Find the small bright thing." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    respects: {
      speaker: "narrator",
      text: "You stand a pace from the swaying boots, and for a moment you are nobody's assistant, nobody's witness, and nobody's student. How do you honour a man you can't remember?",
      onEnter: [{ set: "ostrov_respects", val: true }],
      interjections: [
        { skill: "rote", min: 3, text: "FORM OF MOURNING FOR AN OFFICIAL OF THE YOUTH COMMISSARIAT: RIGHT HAND TO BROW, CHIN ELEVATED, THREE SECONDS' SILENCE, EYES ON THE PORTRAIT." },
        { skill: "solidarity", min: 3, text: "We take off our caps. We hold the breath for a time. Whoever he was, he belonged to us the moment he stopped." }
      ],
      choices: [
        { text: "Give the Vanguard salute.", goto: "respects_done", effects: [{ ideo: "vanguard", n: 1 }, { surv: -2 }] },
        { text: "Take off your cap, and say nothing.", goto: "respects_done", effects: [{ ideo: "quiet", n: 1 }, { morale: 1 }] },
        { text: "Whisper: 'I'll find out who did this.'", goto: "respects_done", effects: [{ ideo: "undercurrent", n: 1 }, { surv: 2 }, { xp: 1 }] }
      ]
    },
    respects_done: {
      speaker: "narrator",
      text: "The boots turn slowly. The rope creaks. In the rafters, a pigeon that has been watching all this clears its throat and decides to be somewhere else. For a moment the gymnasium is just a very big room with a very still man in it, and there is nothing to do but be there with him.",
      onEnter: [{ time: 1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    reckless: {
      speaker: "adrenaline",
      text: "DO IT! Say it! Say it NOW! You don't need proof, you need a SCENE! Stand in the middle of the gym and point at someone, anyone, the shouting will find the guilty! That's how it works in the plays! The truth leaps out when you're loud enough!\n\n...Is that how it works? I don't actually know. But it'll be GREAT.",
      interjections: [
        { skill: "volition", min: 3, text: "No. This is how seventeen-year-olds end up in report files. Sit down. Think. You haven't got the pieces." },
        { skill: "doublethink", min: 2, text: "Don't, friend. Never accuse. Accusing is for people who have stopped being comfortable." },
        { skill: "dialectics", min: 4, text: "An accusation without evidence is a gamble with one coin. You will win, or you will be the evidence." }
      ],
      choices: [
        { text: "Do it. Accuse them anyway.", dialogue: "accuse", effects: [{ surv: 10 }, { set: "ostrov_reckless", val: true }] },
        { text: "Not yet. Find the proof first.", goto: "hub" }
      ]
    }
  }
},

g_portrait: {
  title: "The Torn Portrait",
  start: [{ cond: "flag.clue_mic", node: "after" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: "The Warden gazes from his frame with the serene benevolence of a man who has never once been asked a difficult question. Or he did. The picture is in tatters: a long diagonal slash through the glass, the canvas peeled from the frame in a ragged tongue, the left eye clawed out and replaced by a hole in the plaster. A fragment of paper hangs from the lower edge like a torn tooth.\n\nWhoever did this didn't want to hurt a picture. They wanted to get behind it.",
      onEnter: [{ set: "portrait_examined", val: true }, { time: 4 }],
      interjections: [
        { skill: "doublethink", min: 3, text: "He is smiling at you. You wouldn't hurt him, would you? He has only ever wanted you to be well." },
        { skill: "deduction", min: 3, text: "Slashed from the inside. Look at the glass: the cuts go outward. Somebody went through it, or put a very sharp thing through from behind." },
        { skill: "empathy", min: 4, text: "It's a picture of a man, but it hurts to see him cut. You were taught to love the face for so long that the knife feels like a personal insult. That's the first thing the face is for." },
        { skill: "rote", min: 3, text: "ARTICLE ONE: THE WARDEN'S LIKENESS SHALL NOT BE DEFACED. PENALTY: DEFACEMENT OF THE DEFACER. SEE ALSO ARTICLE ONE, FOOTNOTE: 'LIKENESS' SHALL INCLUDE DRAWINGS, PHOTOGRAPHS, AND BELIEFS." }
      ],
      choices: [
        { text: "Look at the hole where the eye was.", goto: "hole" },
        { text: "Pick up the torn fragment of paper.", goto: "page", cond: "!has('torn_page')" },
        { text: "[Stare back at the Warden.]", goto: "stare", cond: "!flag.portrait_stare" },
        { text: "Step back.", end: true }
      ]
    },
    stare: {
      speaker: "portrait",
      text: "We are glad you came to see us. We are always glad when our children look at us. You have our full attention, little one, you have always had it. Was there something you wished to confess? We have time. We have, in fact, all the time in the world, and so very many ears.",
      onEnter: [{ set: "portrait_stare", val: true }, { thought: "th_portrait_eyes" }, { surv: 1 }],
      interjections: [
        { skill: "authority", min: 4, text: "DON'T ANSWER IT. DON'T STAND AT ATTENTION. DON'T." , effects: [{ xp: 1 }], once: true },
        { skill: "composure", min: 4, text: "Face of stone. Do not give it your best expression. That's what it's built to harvest." },
        { skill: "rhetoric", min: 3, text: "It speaks in the plural. Always 'we'. A singular, hungry thing wearing the clothes of a multitude. I'd have liked a word with its press secretary." }
      ],
      choices: [{ text: "Look away.", goto: "look" }]
    },
    hole: {
      speaker: "narrator",
      text: "A neat round hole in the plaster, the size of a coin, where the Warden's left eye should be. Around it, a fresh crescent of paint chips and powdered plaster that someone has brushed aside with their sleeve. The hole is not a hole. It's a socket. Inside, a mesh of fine copper wire, a circular grille the size of a thumbnail, and a cable trailing back into the dark.\n\nYou have an unpleasant feeling that you've just looked into an ear.",
      onEnter: [{ time: 2 }],
      interjections: [
        { skill: "senses", min: 3, text: "Dust. Faint ozone. And under it a sweet electrical hum, no louder than a mosquito. It's on. Whatever it is, it's on." },
        { skill: "instinct", min: 4, text: "DON'T SPEAK. DON'T SPEAK YET. If it's an ear, it's been awake since six this morning, since before you came in." }
      ],
      choices: [
        { text: "[Examine the grille properly.]", check: { skill: "deduction", diff: 9, id: "g_portrait_mic", white: true, pass: "mic_pass", fail: "mic_fail" } },
        { text: "Step back.", goto: "look" }
      ]
    },
    mic_pass: {
      speaker: "deduction",
      text: "Dead giveaway: a standard district-issue condenser capsule, nickel-plated, the serial number filed off but the little maker's mark still showing. The cable leaves through a drilled channel that runs behind the plaster, up and into the ceiling, toward the school's central line. No dust on the housing. No rust. It is brand new. This is not decoration. This is a listening post.\n\nThe Warden's portraits are not painted images. They are microphones in frames.",
      onEnter: [{ set: "clue_mic", val: true }, { xp: 3 }, { surv: 4 }, { note: "task_case", text: "Behind the torn portrait in the gym: a microphone capsule, wired into the ceiling. Someone tore the portrait to reach it. The Warden's portraits listen." }, { thought: "th_portrait_eyes" }],
      interjections: [
        { skill: "archive", min: 3, text: "The Portrait Ordinance, Section Four: 'Likenesses shall be installed in every room of public assembly.' We always assumed it was for respect. Section Four has no further subsection. It is a fine example of an unwritten clause." },
        { skill: "dialectics", min: 5, text: "If the portraits listen, then everything said in front of one has been said to the Warden. Therefore every citizen is perpetually testifying. Therefore silence is the only rational language. Therefore everyone is already, technically, a conspirator. Q.E.D." }
      ],
      choices: [{ text: "What now?", goto: "mic_react" }]
    },
    mic_fail: {
      speaker: "narrator",
      text: "A metal mesh. Probably a grille. Probably something to do with ventilation. Or a damp stain. Or perhaps there is some secret inside, but the longer you look, the more the hole becomes a plain hole, and the surface of it sweats with your breath. You cannot be sure. It is a cruel thing to be unsure of.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Step back.", goto: "look" }]
    },
    mic_react: {
      speaker: "narrator",
      text: "You have found it. And so, you realise, you have been standing in front of it, whispering to yourself, for several minutes. The cable hums. The little red pinprick of an indicator, which you hadn't noticed until now, winks on the housing, steady, patient, awake. Behind you, Vasha has stopped moving.\n\nSomeone, somewhere, has been listening to every word.",
      onEnter: [{ set: "mic_is_live", val: true }],
      interjections: [
        { skill: "composure", min: 3, text: "Now is the moment to decide what kind of person you were all along. Quick. They've already begun to guess." },
        { skill: "doublethink", min: 2, text: "Say something lovely, friend. Say something about the Warden. The sooner, the safer." }
      ],
      choices: [
        { text: "Say loudly: 'Deplorable vandalism. The Warden is cherished.'", goto: "mic_ok", effects: [{ surv: -5 }, { ideo: "vanguard", n: 1 }] },
        { text: "Press the torn canvas back over the hole.", goto: "mic_cover", effects: [{ surv: -2 }] },
        { text: "Lean in and say the truth, quietly: 'I know you can hear me.'", goto: "mic_defy", effects: [{ surv: 15 }, { ideo: "undercurrent", n: 2 }] },
        { text: "Say nothing. Walk away calmly.", goto: "after", effects: [{ ideo: "quiet", n: 1 }] }
      ]
    },
    mic_ok: {
      speaker: "narrator",
      text: "Your voice rings in the rafters with the unmistakable emptiness of a lie told for an audience. You are word-perfect. You have even managed a hint of tremor, in the best tradition of devotion. The indicator light winks. It might be pleased. It might be nothing.\n\nBehind you, Vasha lets a very long breath out of her nose and says, to nobody, 'Good lad.'",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: "WONDERFUL. A lovely sentiment, beautifully modulated. Do it again at lunchtime. You make us all so proud." },
        { skill: "volition", min: 4, text: "That cost something. It always will. Be careful what you can say without flinching." }
      ],
      choices: [{ text: "Continue.", goto: "after" }]
    },
    mic_cover: {
      speaker: "narrator",
      text: "You tuck the canvas back over the hole with two fingers, smoothing it down like a sheet over a sleeper. The portrait looks nearly whole again, if you don't know where to look. The red light vanishes behind it. You can't be sure it can't still hear you, but you can at least pretend, and in this country pretence is nine tenths of privacy.",
      onEnter: [{ xp: 1 }],
      choices: [{ text: "Continue.", goto: "after" }]
    },
    mic_defy: {
      speaker: "narrator",
      text: "You say it to the little copper eye as softly as breath: 'I know you can hear me.' The words go in, the light blinks, and no thunder follows. That is somehow worse. In the stillness you hear the hum change, the barest half-tone, as someone, far away, adjusts a dial.\n\nVasha is staring at you, one hand over her mouth. She does not tell you off. She is far too busy being impressed and appalled.",
      onEnter: [{ xp: 3 }, { morale: 1 }, { sfx: "static" }],
      interjections: [
        { skill: "rhetoric", min: 3, text: "Magnificent! A direct address to the unseen auditor! They will either arrest you or build a monument. In this country those are sometimes the same project." },
        { skill: "adrenaline", min: 3, text: "YEAH. YEAH. YOU TOLD THEM. THEY HEARD IT. YEAH." },
        { skill: "instinct", min: 4, text: "Danger now, a close, sharp danger. Don't linger. Whoever's at the other end of that wire has just learned your name." }
      ],
      choices: [{ text: "Continue.", goto: "after" }]
    },
    page: {
      speaker: "narrator",
      text: "A small torn page hangs from the foot of the frame, caught in the splinters: lined paper, cramped hand, the pencil pressed so hard it has cut the sheet. A column of times, each with a number beside it. 00:40 ... 3 hrs. 01:10 ... 3 hrs. 02:00 ... 4 hrs. At the top, in a neat headline: RELAY 9. HARMONY. DURATION OF EFFECT. At the bottom: a single scratched line: THEY KNOW WE KNOW.",
      onEnter: [{ give: "torn_page" }, { xp: 2 }, { toast: "Received: Torn Page" }, { note: "task_ledger", text: "A torn page of figures from behind the portrait: RELAY 9, HARMONY, DURATION OF EFFECT - times and hours. A page of the Ledger?" }],
      interjections: [
        { skill: "archive", min: 3, text: "RELAY 9. A designation. A schedule. The numbers indicate duration; the heading says 'effect'. The effect of what? Of the Harmony. An administrative document about the side effects of a hymn." },
        { skill: "rote", min: 4, text: "RELAY NINE: DISTRICT NINE BROADCAST RELAY. LOCATION: 'RESTRICTED'. DUTY CYCLE: 'CLASSIFIED'. WHAT A POLITE WORD, CLASSIFIED." },
        { skill: "dialectics", min: 4, text: "Premise: the Harmony has an 'effect' that lasts hours. Premise: the effect is logged by hand by a man who is now dead. Conclusion: the effect is not a beneficial one." }
      ],
      choices: [
        { text: "[Try to read what the numbers mean.]", check: { skill: "archive", diff: 11, id: "g_portrait_numbers", white: true, pass: "page_pass", fail: "page_fail" } },
        { text: "Continue.", goto: "look" }
      ]
    },
    page_pass: {
      speaker: "archive",
      text: "Do you see it? Times, starting at midnight, each one a broadcast. Hours listed after: the length of 'effect'. And in the last column, in a smaller hand, a single recurring word: LOSS. 'Loss, 3 hrs.' 'Loss, 4 hrs.' Loss of what? Of time. Of memory. The Harmony isn't just a hymn; it's a drug administered through the air, and Ostrov was keeping the dosage.\n\nIt is, I am aware, a terrible thing to be right about.",
      onEnter: [{ set: "knows_static", val: true }, { xp: 3 }, { thought: "th_bell_tolls" }, { note: "task_yesterday", text: "The torn page logs Bell broadcasts and a column: LOSS, 3 hrs, 4 hrs. The Bell is a drug in the air. It takes memory. That is why I can't remember last night." }],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    page_fail: {
      speaker: "narrator",
      text: "The numbers swim. You can see they are times and durations, but your brain keeps putting them into the shapes of a timetable, a train timetable, a bell schedule, a menu. Anything but a diagnosis. You hold the torn page to the light and it still says what it said before: nothing you can quite hold.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    after: {
      speaker: "narrator",
      text: "The portrait hangs askew above the checkered boards, one eye empty, the Warden looking past you with an expression of terrible patience. The hole behind the eye has begun to feel like someone else's breath on your neck.",
      interjections: [
        { skill: "the_grey", min: 3, text: "Plaster dust on your sleeve. I have kept a little of the Warden's face for you; it's the wrong sort of keepsake." }
      ],
      choices: [
        { text: "Pick up the torn fragment of paper.", goto: "page", cond: "!has('torn_page')" },
        { text: "[Stare back at the Warden.]", goto: "stare", cond: "!flag.portrait_stare" },
        { text: "Step back.", end: true }
      ]
    }
  }
},

g_mat: {
  title: "Landing Mats",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "Four thick blue landing mats, stacked in a square beneath the hoop. They are a little crooked and a good deal too clean. Gym mats should smell of generations of boys and old sweat; these smell of soap, and of a fresh, orange-oil polish, which in this building means someone has recently wiped them down.\n\nThey are exactly the right place to catch a falling man. Or to stop one leaving marks.",
      interjections: [
        { skill: "senses", min: 3, text: "Orange. Strong. Peel, not scent. A smell like a Sunday in a country with oranges." },
        { skill: "deduction", min: 3, text: "Mats under the hoop. A man doesn't need a mat when he's dead; the mat is for the living. Someone cleaned up after a struggle, or tried to." },
        { skill: "brawn", min: 3, text: "Each mat weighs as much as a small boy. Somebody dragged them into place alone. They're not weak." }
      ],
      choices: [
        { text: "Look closely at the seams.", goto: "seams" },
        { text: "Sniff the orange polish.", goto: "orange", cond: "!flag.mat_orange" },
        { text: "Step back.", end: true }
      ]
    },
    orange: {
      speaker: "narrator",
      text: "You lean in. Orange peel and gun-oil, a clean sharp smell cut through with something metallic. The sort of smell that doesn't belong to a gymnasium or to a kitchen; it belongs to a particular person, someone who rubs peel on their hands to hide the oil of a service weapon. You've smelled it before, somewhere you can't place. A memory raises its head, then ducks away again.",
      onEnter: [{ set: "mat_orange", val: true }, { xp: 1 }],
      interjections: [
        { skill: "instinct", min: 4, text: "Orange and oil. You KNOW this. In a corridor, in a dark one. A tall girl walking very straight." },
        { skill: "appetite", min: 2, text: "Orange peel. Orange peel! Unbelievably rare. Where did they get an orange? Who gets an orange? Ask them if they have another." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    seams: {
      speaker: "narrator",
      text: "You run your fingers along the seams, each one a stitched fault line in blue canvas. At the corner of the third mat, wedged where the stuffing has parted, something small and metal glints. It's no bigger than a thumbnail, and slick with polish. Someone must have missed it when they wiped the mats clean; they would have needed to be lying down to see it.",
      onEnter: [{ time: 4 }],
      choices: [
        { text: "[Work it free.]", check: { skill: "senses", diff: 9, id: "g_mat_pin", white: true, pass: "pin_pass", fail: "pin_fail" }, cond: "!has('rhea_pin')" },
        { text: "Step back.", goto: "look" }
      ]
    },
    pin_fail: {
      speaker: "narrator",
      text: "Your fingers find stuffing, canvas, the underside of a dead spider. The glint is gone. Either you moved your head and lost the angle, or it was never there and your eyes were doing the thing eyes do. You wait, try again, and get the rigid satisfaction of finding nothing at all.",
      choices: [{ text: "Step back.", goto: "look" }]
    },
    pin_pass: {
      speaker: "narrator",
      text: "You tease it out with the tip of a fingernail: a tiny enamel pin, red and gold, the size of a button, with a clasp bent from being struck. A raised fist holding a bell, over the letters Y.V. on a banner. On the reverse, inscribed with a needle: R. VANTAGE. It's an enforcer's pin, the sort handed out for exemplary conduct.\n\nIt cannot have dropped here by chance. Enforcers do not lose their pins. They are far too fond of them.",
      onEnter: [{ give: "rhea_pin" }, { xp: 3 }, { toast: "Received: Rhea's Pin" }, { set: "mat_pin_found", val: true }],
      interjections: [
        { skill: "archive", min: 3, text: "Y.V.: Youth Vanguard. First Class badge, issued only on completion of the Reedmarsh Drill. 'R. VANTAGE': that is Rhea Vantage, 7th Form, Vanguard enforcer. This is not a guess. It is an index entry." },
        { skill: "instinct", min: 3, text: "Rhea. The tall one who walks like a ruler. She was here, in the dark, close enough to bend a clasp." },
        { skill: "sleight", min: 3, text: "A pin is a very small thing to hide. Pocket it quietly. People will ask where you found it, and you will want to choose your answer in advance." }
      ],
      choices: [{ text: "Think about it.", goto: "rhea" }]
    },
    rhea: {
      speaker: "narrator",
      text: "Rhea Vantage. You turn the little pin over in your fingers: a raised fist, a bell, a clasp bent sideways. Someone struck it, or someone fell on it. A person who loses such a thing in the middle of the night, under a hanged man, is a person who was hurrying or struggling. Or a person who didn't care, because who would dare to suggest it?\n\nYou know she is a danger. You don't know yet why you know.",
      onEnter: [{ set: "knows_rhea", val: true }, { task: "task_rhea", state: "active" }, { note: "task_rhea", text: "Found Rhea Vantage's Vanguard pin under the landing mats in the gym, near the hanging Commissar. Smell of orange peel and gun-oil. She was there." }],
      interjections: [
        { skill: "dialectics", min: 4, text: "Premise: a pin is lost at the scene. Premise: the owner is an enforcer. Conclusion: she was there, or someone wanted you to think so. Pursue both. The second is the more dangerous." },
        { skill: "authority", min: 4, text: "GO AND FIND HER. NOT YET. WHEN YOU HAVE MORE. BUT GO." },
        { skill: "rhetoric", min: 4, text: "Be careful how you phrase it: 'I found your pin' is a threat; 'Did you lose something?' is a question; both are weapons." }
      ],
      choices: [{ text: "Step back.", end: true }]
    }
  }
},

g_rope: {
  title: "Coiled Rope",
  start: [{ cond: "flag.clue_rope", node: "after" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: "A length of climbing rope lies in a neat coil at the foot of the wall bars, the sort of rope that hangs from the rafters in every gym in the Union. Except the rope in the rafters is missing. Instead, the thing round the Commissar's neck is a different gauge, a thinner, whiter cord, stiff with fresh tar. This coil, by contrast, is the gym's own, grey with chalk and use.",
      interjections: [
        { skill: "archive", min: 3, text: "Gymnasium inventory: Climbing Rope, Item 14, standard issue, one per hall. You are looking at Item 14. And the rope the Commissar is hanging from is not Item 14. Whence the extra rope?" },
        { skill: "reflex", min: 3, text: "Careful where you step; it's coiled the way an expert would leave it. Or the way a person who wants to be thought tidy would." },
        { skill: "aim", min: 3, text: "Eleven metres from the floor to the hoop's rim. A coil of this length, thrown over the rim, would reach. Throwing it takes aim. Tying it up there takes something else." }
      ],
      choices: [
        { text: "[Examine the coil.]", check: { skill: "deduction", diff: 10, id: "g_rope_staged", white: true, pass: "staged", fail: "fail" } },
        { text: "Check how the hoop is raised.", goto: "winch", cond: "!flag.rope_winch" },
        { text: "Step back.", end: true }
      ]
    },
    winch: {
      speaker: "narrator",
      text: "Beside the wall bars, a squat iron winch with a locked handle. It raises and lowers the basketball hoop, the way a gallows crane lowers a drop. The hoop is a good three metres up; nobody on a ladder, nobody on a bench, would reach it. But someone could lower the hoop to head height, tie a noose, crank it up again, and the whole thing would look like a miracle.\n\nThe winch is stamped with the Vanguard crest. The crank lock requires a key.",
      onEnter: [{ set: "rope_winch", val: true }, { xp: 1 }],
      interjections: [
        { skill: "deduction", min: 4, text: "A lowering winch, locked. A key. Two sets: the coach's, and the Vanguard Room's. Make a note of who has both." },
        { skill: "rhetoric", min: 3, text: "If you can't reach the noose, you can't hang yourself from it. If you can lower the hoop, you could. The key is the argument." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    staged: {
      speaker: "deduction",
      text: "There. A cut end, bright, new, the fibres sheared by a single clean stroke of a blade. The cord round his neck has a matching cut: this coil is the other half of the same hank. And someone has wound the offcut with the ritual lashing known to every Vanguard cadet: a Bell Hitch, three turns and a tuck, impossible to tie by accident, a signature as plain as a name on a form.\n\nThe Commissar did not tie this. He wasn't the sort. It was staged.",
      onEnter: [{ set: "clue_rope", val: true }, { give: "staged_rope" }, { xp: 3 }, { toast: "Received: Staged Rope" }, { note: "task_case", text: "The rope around Ostrov's neck was cut from the same hank as the coil by the wall bars, and the offcut is lashed with a Vanguard Bell Hitch. The hanging was staged by someone with Vanguard training and a winch key." }],
      interjections: [
        { skill: "dialectics", min: 4, text: "Suicide implies solitude. A Bell Hitch implies a drilled hand. A hanged man implies a lifter. Therefore, three persons or one very strong one, trained, and none of them the deceased." },
        { skill: "brawn", min: 4, text: "Lifting an adult man, even to a lowered hoop, is a two-arm job. Short of one of those Vanguard farm girls with forearms like cable." },
        { skill: "empathy", min: 3, text: "Whoever did this was careful. The care is the worst part. They tied the knot like someone setting a table." }
      ],
      choices: [{ text: "Continue.", goto: "after" }]
    },
    fail: {
      speaker: "narrator",
      text: "A rope. A coil of rope. It is a rope. You turn it over, find nothing, and begin to wonder whether you're simply the sort of person who looks at objects until they get embarrassed. The coil lies there with the serenity of a thing that has been looked at by a great many people and never once understood.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Try the winch.", goto: "winch", cond: "!flag.rope_winch" }, { text: "Step back.", end: true }]
    },
    after: {
      speaker: "narrator",
      text: "The coil lies where it lay, patient and a little too neat. You are very sure, now, that a quiet person with Vanguard hands and a winch key stood on this exact spot. You can almost see her tying the hitch.",
      interjections: [
        { skill: "the_grey", min: 3, text: "Rope is just a very long argument that ends in a knot. I have been listening to this one since dawn." }
      ],
      choices: [{ text: "Step back.", end: true }]
    }
  }
},


g_lockers: {
  title: "Student Lockers",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "Thirty-six green lockers, each stamped with a number and a pious sticker: MY BODY IS THE UNION'S BODY. Dents run down the doors where the boys of the school have been kicking them since before the Warden was born. Several are slightly open. One is warm to the touch, as if its occupant had left a moment ago and might return.",
      interjections: [
        { skill: "archive", min: 3, text: "Thirty-six lockers. Thirty-six students per form. The numbering follows the Register of Names, alphabetically within form. Locker 17 is yours. I looked. I am very proud of the filing." },
        { skill: "senses", min: 3, text: "Sweat, mould, boot-grease, old apple. And from locker 22: cigarette paper and something warm. Someone's been using it as a very small apartment." },
        { skill: "solidarity", min: 3, text: "Every door, a kid. Every dent, a kid's temper. We lined the walls with our sorrows and called it storage." }
      ],
      choices: [
        { text: "Open your own locker (17).", goto: "own", cond: "!flag.locker_own" },
        { text: "Try the warm locker (22).", goto: "warm", cond: "!flag.locker_warm" },
        { text: "Read the names scratched inside the doors.", goto: "names", cond: "!flag.locker_names" },
        { text: "Leave.", end: true }
      ]
    },
    own: {
      speaker: "narrator",
      text: "Locker 17 opens at the second try, the lock giving way with a sigh. Inside: a spare shirt, a pencil case, a textbook of Orthodoxy bristling with torn tabs, a rolled-up pair of socks that smell faintly of repression. On the inside of the door, in fountain pen, someone has written a single word, over and over, in a column down the whole length: LISTEN LISTEN LISTEN LISTEN.\n\nThe handwriting is yours.",
      onEnter: [{ set: "locker_own", val: true }, { xp: 2 }, { time: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: "You wrote that when you were afraid and had nothing else to write on. Not a message to someone else; a spell against yourself." },
        { skill: "rote", min: 3, text: "ORTHODOXY, VOLUME IV, 'THE DUTIES OF HEARING'. THE CITIZEN SHALL HEAR THE WARDEN. THE CITIZEN SHALL LISTEN FOR THE WARDEN. THE CITIZEN SHALL BE LISTENED TO. SEE ALSO: DUTIES OF BEING HEARD." },
        { skill: "sleight", min: 4, text: "The inside of the textbook cover has been sliced and re-glued. A cavity in the binding, empty. Whatever it held, you took with you." }
      ],
      choices: [
        { text: "[Search the textbook's hollow binding.]", check: { skill: "senses", diff: 10, id: "g_lockers_binding", white: true, pass: "binding_pass", fail: "binding_fail" } },
        { text: "Close the locker.", goto: "look" }
      ]
    },
    binding_pass: {
      speaker: "narrator",
      text: "Your thumbnail finds the seam. Inside the cavity: a single grain of dust-pale chalk, a half-burnt match, and a dried flower-petal, flattened to translucence. No documents. But someone has pressed the chalk into the paper in the shape of a letter, a small neat L. And there is the faintest outline of a sheet of paper that used to lie here, folded in four, taken away.\n\nWhoever you were last night, you were methodical.",
      onEnter: [{ xp: 2 }, { set: "locker_binding", val: true }],
      interjections: [
        { skill: "deduction", min: 4, text: "L. A name? A place? A Ledger? You hid something in a place made to be shut; you took it out of a place made to be opened. Consistent. Cautious. Smart." },
        { skill: "archive", min: 4, text: "The paper's impression shows a ruled column: the format of an official log book. A ledger-sheet, folded in four. Item L, I note, is a good letter for this." }
      ],
      choices: [{ text: "Close the locker.", goto: "look" }]
    },
    binding_fail: {
      speaker: "narrator",
      text: "The binding is a binding. The glue holds. You succeed only in tearing off a strip of green cloth, and, with it, the last of your composure. A passing boy, somewhere beyond the door, stops, listens, and then goes on his way. The locker closes with a clank louder than your pulse.",
      onEnter: [{ surv: 2 }],
      choices: [{ text: "Back off.", goto: "look" }]
    },
    warm: {
      speaker: "narrator",
      text: "Locker 22 is warm because someone has been sitting in it. Not recently, but regularly: a folded blanket on the bottom, a candle-end in a jam-jar, a cushion made from a sock stuffed with straw. Taped to the back wall, a child's drawing of the Statue in the Courtyard, with a tiny door in the plinth and an arrow pointing to it. Someone has written, in the corner, in cheerful crayon: SHHH.",
      onEnter: [{ set: "locker_warm", val: true }, { xp: 2 }, { time: 3 }],
      interjections: [
        { skill: "empathy", min: 3, text: "A hiding hole built by a small child who needed one. The school has a great many of those, if you know how to look. This is how we raise our young." },
        { skill: "deduction", min: 4, text: "A drawing of the Statue, with a door in the plinth. Children draw what they've seen. Or what they've been told. Or what an older, braver child has shown them." },
        { skill: "instinct", min: 3, text: "She's not the only one who's known, you know. The little ones know all the secrets. They're just too small to be believed." }
      ],
      choices: [
        { text: "Take the drawing.", goto: "drawing", cond: "!flag.locker_drawing", once: true },
        { text: "Close the locker gently.", goto: "look" }
      ]
    },
    drawing: {
      speaker: "narrator",
      text: "You peel the drawing off the metal and fold it into your pocket. Wax crayon on blotting paper: a grey blob of a statue, a hole in its foot, a smiling little sun above it. The arrow points to the statue's boot. Whoever drew it spent a lot of effort on the shading; it looks, you think, as though it was drawn from the inside.",
      onEnter: [{ set: "locker_drawing", val: true }, { note: "task_ledger", text: "A child's drawing in a locker shows the Courtyard Statue with a door in the plinth, an arrow pointing at the boot." }, { xp: 2 }],
      interjections: [
        { skill: "rote", min: 4, text: "STATUE OF THE WARDEN'S FATHER. ERECTED 14 YEARS PRIOR. A SOLID BRONZE CAST. 'SOLID' IS THE OFFICIAL WORD. 'SOLID.'" }
      ],
      choices: [{ text: "Close the locker.", goto: "look" }]
    },
    names: {
      speaker: "narrator",
      text: "Inside the door of the nearest locker, in a hundred scratches, someone has begun to carve a list. The names run up the inside of the metal: Mira. Teodor. Pavel K. Lena Dru. Each with a year. After the name, nothing: no date of birth, no date of death, no cause. Just a small cross, and, at the bottom of the column, a space, ready for the next.\n\nThe last name is a year old. There are four others added in a different hand, in pencil, since then.",
      onEnter: [{ set: "locker_names", val: true }, { xp: 1 }, { morale: -1 }],
      interjections: [
        { skill: "solidarity", min: 3, text: "We keep our dead in the doors. The ones nobody counts. The ones who left school without graduating. We, we, we." },
        { skill: "archive", min: 4, text: "Not one of these names appears in the Register as 'deceased'. They all appear as 'transferred'. A transfer is not a death. It is much worse; it is an absence with paperwork." },
        { skill: "empathy", min: 4, text: "Someone cared enough to carve every name. Someone does it every spring. It's an act of love disguised as vandalism." },
        { skill: "doublethink", min: 3, text: "They moved to better schools. It is well known. Do not count the crosses. Crosses are decorative." }
      ],
      choices: [{ text: "Close the door.", goto: "look" }]
    }
  }
},

g_bench: {
  title: "Bleacher Bench",
  start: [{ cond: "flag.read_note_2", node: "after" }, { node: "look" }],
  nodes: {
    look: {
      speaker: "narrator",
      text: "A long wooden bleacher bench against the east wall, worn to a shine by a thousand drilling children. Under the seat, someone has scratched tally marks with a compass point, four upright and one slanting, row after row, a long record of something repeated. A water ring from a thermos on the end, still damp. A smudge of chalk on the third plank.\n\nIt is the sort of seat where a man might sit alone at night and count.",
      interjections: [
        { skill: "empathy", min: 3, text: "Pull-ups. Counted by hand, in the dark. A man who did them for no one and told no one. Why does anyone do that? To remember they've got a body, when the day gives them only a mouth and a signature." },
        { skill: "senses", min: 3, text: "Thermos damp. Still faintly warm. Fennel tea, sugar, a hint of aniseed. Somebody had a drink at this bench not long before the hoop." },
        { skill: "stamina", min: 3, text: "Pull-ups. The best prayer. You count to ten and the world gets its proper size again." }
      ],
      choices: [
        { text: "Count the tally marks.", goto: "tally", cond: "!flag.bench_tally" },
        { text: "[Search under the seat.]", check: { skill: "senses", diff: 9, id: "g_bench_seat", white: true, pass: "found", fail: "miss" }, cond: "!flag.read_note_2" },
        { text: "Leave.", end: true }
      ]
    },
    tally: {
      speaker: "narrator",
      text: "Row on row, in a patient hand. You count one hundred and four rows of five, then lose count and start again. A thousand pull-ups, perhaps more. Beside the last row, in a different, smaller hand, someone has added a single digit: a 1. The tally ends at a thousand and one.\n\nThere is something unbearably tender about the extra one, as if the man had felt he owed the world one more than he'd promised.",
      onEnter: [{ set: "bench_tally", val: true }, { xp: 1 }],
      interjections: [
        { skill: "rote", min: 3, text: "A THOUSAND. THE NUMBER OF PULL-UPS REQUIRED FOR THE VANGUARD FIRST-CLASS BADGE. HE NEVER APPLIED. HE JUST NEEDED THE NUMBER." },
        { skill: "grit", min: 4, text: "A body is a thing you can still prove. Count what you can. Be exact." },
        { skill: "volition", min: 3, text: "It's not about the number. It's about doing one more than you said you would. Remember that for when you're tired." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    miss: {
      speaker: "narrator",
      text: "You run your hand under the seat, find splinters, gum, a hundred years of desperate chewing. A wasp's nest, long dead. Your fingers close on something, and it turns out to be a sock. You are not, you reflect, an investigator so much as a very thorough pickpocket of furniture.",
      onEnter: [{ hp: -1 }],
      interjections: [
        { skill: "grit", min: 2, text: "Splinter in the left thumb. Remove it with your teeth. Give it a moment of silent gratitude for the lesson." }
      ],
      choices: [{ text: "Try again.", goto: "look" }]
    },
    found: {
      speaker: "narrator",
      text: "A strip of tape under the third plank, the tape a different colour from the wood, and under it a thin folded square of lined paper. On the outside, in blue biro, a small drawing: a pig in a bowler hat, smiling inanely. You laugh before you can stop yourself, a short startled laugh that surprises both of you. The pig is your pig. You drew it. You drew it for yourself, for exactly this moment.\n\nThe note is warm from where it has lain against the wall.",
      onEnter: [{ give: "note_yesterday_2" }, { set: "read_note_2", val: true }, { xp: 2 }, { toast: "Found: Note from Yesterday (2/3)" }, { note: "task_yesterday", text: "Found the second note from Yesterday-Me under the gym bleacher. It had a drawing of a pig in a bowler hat." }],
      interjections: [
        { skill: "volition", min: 3, text: "You laughed. Do not underestimate that. It is the first thing you have felt today that wasn't dread." },
        { skill: "charm", min: 3, text: "A pig in a bowler hat. You are, I think, delightful. It is a pity that nobody has been told." }
      ],
      choices: [{ text: "Read it.", goto: "note2" }]
    },
    note2: {
      speaker: "narrator",
      text: "2/3.\n\nIf you laughed at the pig, hello, we're the same person still. Good. If you didn't, sit down and have a sweet.\n\nHere is what I know. O. is dead or soon will be. He told me tonight that the Bell is a poison made of music. I thought he was mad. Then I stood under the speaker and felt it taking the shape of the afternoon out of my head. The thing I carried is the proof. It is NOT with me. It is NOT with anyone you can trust. Park bench. The one in the Courtyard, by the bell. Third slat from the left. Do not trust the Lieutenant with this. Do not trust the red girl. Do not trust the orange smell.\n\nI am sorry. I'm so sorry. - you",
      interjections: [
        { skill: "archive", min: 3, text: "'The Lieutenant.' 'The red girl.' 'The orange smell.' Three exclusions, explicitly listed. This is a methodical mind. It is also, I observe, in tears; the ink spreads at the base of the 'sorry'." },
        { skill: "instinct", min: 3, text: "Orange. The orange smell. You smelled it on the mats. You've now smelled it twice. That's not a coincidence, that's a signature." },
        { skill: "empathy", min: 4, text: "'I'm so sorry.' He wrote that to himself. Apologising to the future for what he couldn't do. You would do the same. You did." },
        { skill: "doublethink", min: 3, text: "Poison made of music? Oh, friend. What an imaginative boy. We do like a fantasy, don't we? Throw it away and sing the Anthem." }
      ],
      onEnter: [{ thought: "th_ghost_of_yesterday" }, { set: "knows_note2_warning", val: true }],
      choices: [{ text: "Fold it away. Next: the Courtyard bench.", end: true, effects: [{ note: "task_yesterday", text: "Note 2: Ostrov told me the Bell is a poison made of music. The proof is hidden. Next: the park bench in the Courtyard, third slat from the left. Do not trust the Lieutenant, 'the red girl', or 'the orange smell'." }] }]
    },
    after: {
      speaker: "narrator",
      text: "The bench, emptied of its secret. The tally marks go on in the half-light, a thousand and one. You find yourself rubbing your thumb along them, one by one, as if you could add to the count.",
      interjections: [
        { skill: "solidarity", min: 3, text: "Every mark is a day that someone insisted on counting. We can do the same." }
      ],
      choices: [{ text: "Leave.", end: true }]
    }
  }
},


bronka: {
  title: "Cook Bronka",
  start: [{ cond: "flag.bronka_met", node: "hub" }, { node: "first" }],
  nodes: {
    first: {
      speaker: "bronka",
      text: "'You,' says the cook, without turning round. 'Crumb. Come here.' A plate arrives on the zinc with the finality of a verdict: two thick slices of dark bread, a slab of something yellow, a spoonful of cabbage that has seen better regimes. 'You haven't eaten. I can tell by the way you stand. Like a coat on a stick.'\n\nShe turns at last. A wide red face, flour to the elbows, small shrewd eyes that have outlasted four ministers of education. 'Eat first. Talk after. That is the order of things.'",
      onEnter: [{ set: "bronka_met", val: true }, { time: 5 }],
      interjections: [
        { skill: "appetite", min: 2, text: "BREAD. FAT. WARM. SOMEONE MADE THIS FOR YOU. Oh, I could kiss her. Eat. EAT." },
        { skill: "empathy", min: 3, text: "She feeds the way other people pray. Not for you, exactly; for the part of the world that still wants things to be fed." },
        { skill: "senses", min: 3, text: "Yeast, rye, caraway. And the underlying smell of every Ration Hall: boiled cloth and quiet compromise." },
        { skill: "authority", min: 3, text: "SHE OUTRANKS THE PRINCIPAL IN HER OWN KITCHEN. ACT ACCORDINGLY." }
      ],
      choices: [
        { text: "Eat the bread.", goto: "eat", effects: [{ hp: 1 }, { morale: 1 }] },
        { text: "'I haven't got a coupon.'", goto: "no_coupon" },
        { text: "'There isn't time. There's a dead man in the gym.'", goto: "dead_man" }
      ]
    },
    eat: {
      speaker: "narrator",
      text: "The bread is dense and dark and tastes of seed and sour and a vague, wonderful mercy. You eat it in four bites, standing, like a soldier. The cabbage is cabbage, but it comes with a sort of apology. The yellow slab, you decide after much thought, is cheese by intention. The warmth goes down into your knees and sits there.\n\nBronka watches you chew with the fierce satisfaction of a woman who has been right about hunger for sixty years.",
      interjections: [
        { skill: "appetite", min: 2, text: "More. Obviously more. But also: stop. The second slice is for later. No. It's for NOW. No. Ahh." },
        { skill: "stamina", min: 3, text: "Fuel. You were running on fumes and a headache. Now you are running on bread. A much better engine." }
      ],
      choices: [{ text: "'Thank you. That was perfect.'", goto: "hub", effects: [{ xp: 1 }, { set: "bronka_fed", val: true }] }]
    },
    no_coupon: {
      speaker: "bronka",
      text: "'Coupon.' She says it the way you would say 'tapeworm'. 'Eat. I'll write it up under 'Anonymous Charity' and the Bureau will assume it's a mistake. Mistakes, they like. Mistakes mean they have something to correct.' She pushes the plate an inch nearer. 'They're missing coupons from my till again. Twelve this week. You wouldn't know.'\n\n'No,' she answers herself. 'You wouldn't.' It isn't a question; it's a test.",
      onEnter: [{ task: "task_coupons", state: "active" }, { note: "task_coupons", text: "Cook Bronka's till is missing twelve ration coupons this week. She suspects someone in the Hall." }],
      choices: [{ text: "Eat the bread.", goto: "eat", effects: [{ hp: 1 }, { morale: 1 }] }]
    },
    dead_man: {
      speaker: "bronka",
      text: "'Dead men,' she snorts, 'are the most patient customers in the Union. They'll wait. You won't, not if you go on like this, you'll fall over on the Commissar's feet and make two corpses.' She pushes the plate at your chest until your hands close on it. 'Ostrov Dane,' she adds, much more quietly. 'He ate here. Always the last, always the plainest. He said thank you to the soup.'\n\nHer jaw works for a moment. 'You ought to eat.'",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "empathy", min: 4, text: "She said it carefully: 'He ate here.' Past tense, and the grief in it was so well-folded that you nearly missed it. She mourned him before you came in." }
      ],
      choices: [{ text: "Eat the bread.", goto: "eat", effects: [{ hp: 1 }, { morale: 1 }] }]
    },
    hub: {
      speaker: "bronka",
      text: ["'Well, crumb?' Bronka stirs a pot the size of a drum. 'Out with it. My hands are busy and my ears are not.'", "'Talk to the soup, I'll listen.' She cuts a loaf in half with a single, startling stroke. 'What do you need? Food, advice, or an alibi?'"],
      interjections: [
        { skill: "appetite", min: 3, text: "Ask for tea. Ask for the roll in her apron pocket. Ask nicely, with a wounded look." , cond: "!has('ration_tea') && !flag.bronka_tea" }
      ],
      choices: [
        { text: "'The missing coupons. Twelve. Tell me more.'", goto: "coupons", cond: "task('task_coupons') === 'active' && !has('ration_coupon') && !flag.bronka_coupons_returned" },
        { text: "[Give back the coupon you recovered.]", goto: "coupon_back", cond: "has('ration_coupon') && !flag.bronka_coupons_returned" },
        { text: "'Could I have some tea?'", goto: "tea", cond: "!has('ration_tea') && !flag.bronka_tea" },
        { text: "'Bread knows.' (Say it carefully.)", goto: "bread_knows", cond: "(flag.poster_bread || flag.bronka_trust) && !flag.bronka_knows_said" },
        { text: "'Tell me about Ostrov.'", goto: "ostrov", cond: "!flag.bronka_ostrov" },
        { text: "'Why do you hide notes in the bread?'", goto: "tobar", cond: "flag.bronka_trust && !flag.bronka_tobar" },
        { text: "'Is there a note in today's loaf?'", goto: "note_give", cond: "flag.bronka_trust && !has('bread_note') && !flag.bronka_note_given" },
        { text: "'Is there anyone in the boiler room?'", goto: "boiler", cond: "flag.bronka_trust && !flag.boiler_unlocked" },
        { text: "'Do you know anything about last night?'", goto: "lastnight", cond: "!flag.bronka_lastnight" },
        { text: "'That's all, thank you.'", end: true }
      ]
    },
    coupons: {
      speaker: "bronka",
      text: "'Twelve a week. Always on a Thursday.' She jabs the ladle at the till. 'Someone with a clean hand and a clean conscience takes them, because the notes are never ripped; they are slid out neat. You don't steal like that unless you've been taught to by a form.' Her eyes drift across the hall. 'Only one person in this building has a form for everything.'\n\nShe says nothing more. She doesn't need to. At the far aisle, a boy with a red armband is carefully not looking at the till.",
      onEnter: [{ set: "bronka_coupon_hint", val: true }, { xp: 1 }, { note: "task_coupons", text: "Bronka says the coupons are slid out neatly by someone who loves forms. She looked at Lemmy Tarsk." }],
      interjections: [
        { skill: "deduction", min: 3, text: "Every Thursday. The Thursday before the Vanguard dues. A boy with an armband and a debt. It scans like a verse." },
        { skill: "empathy", min: 3, text: "Not malice. She knows who it is. She's not angry; she's trying to decide whether to save him." }
      ],
      choices: [{ text: "'I'll talk to him.'", goto: "hub" }]
    },
    coupon_back: {
      speaker: "bronka",
      text: "You lay the coupon on the zinc like a card you've been dealt. She looks at it for a long time. Then she picks it up between flour-white finger and thumb and holds it to the light, the way a jeweller holds a stone. 'It's one of mine,' she says. 'It's been folded wrong. He was very nervous.' She doesn't ask who. She tucks it into her apron and something in her face rearranges itself.\n\n'You've done me a good turn, crumb. I owe you. And I always pay.'",
      onEnter: [{ take: "ration_coupon" }, { set: "bronka_coupons_returned", val: true }, { set: "bronka_trust", val: true }, { task: "task_coupons", state: "done" }, { xp: 3 }, { morale: 1 }, { note: "task_coupons", text: "Returned the missing coupon to Bronka. She trusts me now." }],
      interjections: [
        { skill: "solidarity", min: 3, text: "She says 'I owe you' the way we all do. It's the beginning of a different economy." },
        { skill: "empathy", min: 3, text: "She's not asking where it came from, because she knows already. She's choosing not to know, for his sake. That is a kind of grace." }
      ],
      choices: [{ text: "Continue.", goto: "reward" }]
    },
    reward: {
      speaker: "bronka",
      text: "She reaches under the counter and brings out a small brown bag, warm through the paper. 'Sweet roll,' she says. 'Cinnamon. Don't tell the Bureau; cinnamon is on the Sensitive List, God knows why. Every time they ban a spice a baker gets a little more political.' She presses it into your hand and, after a beat, adds a second thing: a twist of paper, a pinch of black tea leaves. 'Ration tea. Brew it hot. It won't make you less afraid, but it'll make you afraid in comfort.'",
      onEnter: [{ give: "sweet_roll" }, { give: "ration_tea" }, { set: "bronka_tea", val: true }, { toast: "Received: Sweet Roll, Ration Tea" }],
      interjections: [
        { skill: "appetite", min: 2, text: "CINNAMON. A BANNED SPICE. A SWEET ROLL. TEA. ALL AT ONCE. I HAVE NEVER BEEN HAPPIER." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    tea: {
      speaker: "bronka",
      text: "'Tea.' She considers you for a moment, then fishes a twist of paper from her apron and dumps a pinch of black leaves into your palm. 'Ration blend. Ninety per cent chicory, ten per cent regret. Boil it three minutes and don't ask what the regret is for.' She closes your fingers over it. 'One twist per customer. Don't make me regret it.'",
      onEnter: [{ give: "ration_tea" }, { set: "bronka_tea", val: true }, { toast: "Received: Ration Tea" }],
      interjections: [
        { skill: "appetite", min: 2, text: "TEA. Black, hot, bitter. The lungs of the nation. Please, please let us drink it now." },
        { skill: "volition", min: 4, text: "Keep it for someone who needs it more. A sad man in a good suit would be a candidate." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    ostrov: {
      speaker: "bronka",
      text: "'Dane.' The ladle stops mid-stir. 'He was the only Commissar who ever came to the back door. The rest eat in the front like tourists. He sat by the ovens and said nothing and watched my hands. One day he said, 'Bronka, why do you slip notes into the loaves?' And I said, 'What notes?' And he said, 'Exactly.'\n\nShe stirs once more. 'I don't know why he died. I know he wasn't afraid of it. A frightened man holds his bread differently.'",
      onEnter: [{ set: "bronka_ostrov", val: true }, { xp: 1 }],
      interjections: [
        { skill: "instinct", min: 4, text: "'Why do you slip notes into the loaves.' She just admitted it. Without realising. That's the trust of a woman who's out of caution." },
        { skill: "deduction", min: 4, text: "He knew. He had known for a long time. A Commissar who knows about the bread notes and says nothing is a Commissar who's already switched sides." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    bread_knows: {
      speaker: "bronka",
      text: "The ladle falls. Not dramatically; it simply stops being held, and clangs against the pot like a small bell. For a moment the Ration Hall is very quiet, apart from the soup, which goes on bubbling with the indifference of the fed.\n\n'Who taught you that?' she asks, very low. Then, before you can answer: 'No. Don't. I don't want to know.' Her hands are shaking. She sets them flat on the counter to still them. 'Say it again. Slowly.'",
      onEnter: [{ set: "bronka_knows_said", val: true }, { xp: 1 }],
      interjections: [
        { skill: "empathy", min: 3, text: "Terror, then hope, then terror. She's been waiting years for someone to say those two words without being a trap." },
        { skill: "instinct", min: 3, text: "She's weighing you. One wrong word and she'll go back to being a cook." }
      ],
      choices: [
        { text: "[Convince her you're not a trap.]", check: { skill: "charm", diff: 10, id: "bronka_trust_charm", white: true, pass: "trust_ok", fail: "trust_wait" } },
        { text: "[Tell her the truth about last night.]", check: { skill: "empathy", diff: 9, id: "bronka_trust_empathy", white: true, pass: "trust_ok", fail: "trust_wait" } },
        { text: "'Never mind. A joke.'", goto: "hub", effects: [{ surv: 1 }] }
      ]
    },
    trust_ok: {
      speaker: "bronka",
      text: "She looks at you for a long minute, one hand on her heart, and slowly her whole expression gives way. 'Well,' she says. 'God and sugar.' She wipes her hands on her apron. 'All right, crumb. All right. You've got the face of someone with a hole in the middle. I've baked for those. I know the look.'\n\nShe leans on the counter and, for the first time, she seems small. 'What do you want to know?'",
      onEnter: [{ set: "bronka_trust", val: true }, { xp: 2 }, { thought: "th_paper_heart" }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    trust_wait: {
      speaker: "bronka",
      text: "She hears you out and shakes her head, slowly, sadly. 'You're a nice boy. That's not the same as a safe one.' She turns her back and begins to knead something that doesn't need it. 'Come back when you've done me a good turn. Or when you've stopped sounding like you're trying.'\n\nThe door isn't closed. But it's been politely drawn.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    tobar: {
      speaker: "bronka",
      text: "'My husband sang tenor,' she says, quite plainly, to the pot. 'Tobar. Choir of this very school. A little round man with a voice like warm butter. They took him one spring to the Reading Room for 'a corrective course of Orthodoxy'. Six weeks. He came home on a Tuesday and sat at the table and ate my bread, and he did not know it was mine. Not rude. Polite. He said, 'This is very good bread, madam.'\n\nShe dips a finger in the soup, tastes it, adds salt. 'So I put little words in the loaves. In case anybody inside remembers how to read.'",
      onEnter: [{ set: "bronka_tobar", val: true }, { xp: 3 }, { morale: -1 }, { thought: "th_paper_heart" }],
      interjections: [
        { skill: "empathy", min: 3, text: "'Madam.' She will never stop hearing that word. It's the sound of a man being returned to her as a stranger." },
        { skill: "solidarity", min: 3, text: "She feeds the school so that one day the school remembers to feed her back. That's how we work. It is slow. It is the only way." },
        { skill: "the_grey", min: 4, text: "Dough rises in a warm room. It does not ask why the oven is lit. The notes rise too." },
        { skill: "rote", min: 3, text: "THE READING ROOM: A VOLUNTARY CORRECTIVE FACILITY. PARTICIPATION IS COMPULSORY. SATISFACTION IS ALSO COMPULSORY." }
      ],
      choices: [{ text: "'I'm sorry.'", goto: "hub" }, { text: "Say nothing. Put a hand on the counter beside hers.", goto: "hub", effects: [{ morale: 1 }, { xp: 1 }] }]
    },
    note_give: {
      speaker: "bronka",
      text: "She breaks a small round roll in two, and from the crumb draws a twist of greaseproof paper no bigger than a fingernail. 'Today's,' she says. 'Meant for the cellar. But it is a curious thing: a note carries further when someone's read it.' She puts it in your palm. The paper is warm and smells of caraway.\n\nIt reads, in neat pencil: SUNDAY CHEMISTRY. DOWN THE STAIRS. TELL HER THE BREAD SENT YOU.",
      onEnter: [{ give: "bread_note" }, { set: "bronka_note_given", val: true }, { xp: 1 }, { toast: "Received: Bread Note" }],
      interjections: [
        { skill: "archive", min: 3, text: "A message in a loaf: the oldest postal system in the world, and the only one that cannot be opened by the Bureau without eating it." },
        { skill: "appetite", min: 2, text: "Eat the roll afterwards. It's a reasonable reward for a spy." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    boiler: {
      speaker: "bronka",
      text: "She leans in, and her voice, when it comes, is so low you feel it in your sternum rather than hear it. 'Down the stairs in the Courtyard, behind the boiler door. A woman in a lab coat. She keeps chemistry alive, in a way. Goes by 'Mother', for reasons you'll understand. Takes my loaves on Thursdays. Doesn't ask where the notes come from.' She drops a small iron key into your palm. It is warm and heavy.\n\n'Don't ever tell her I gave it you. Tell her the bread sent you.'",
      onEnter: [{ give: "boiler_key" }, { set: "boiler_unlocked", val: true }, { task: "task_anka", state: "active" }, { xp: 3 }, { toast: "Received: Boiler Key" }, { note: "task_anka", text: "Bronka gave me the boiler key. A woman called Mother Anka runs a cell below the courtyard. 'Tell her the bread sent you.'" }],
      interjections: [
        { skill: "solidarity", min: 3, text: "The key is warm. It has passed through a hundred hands to get to yours. We are not alone. We never were." },
        { skill: "doublethink", min: 3, text: "Don't take it, friend. Anyone who offers you a key is offering you a door you cannot afford to walk through." , effects: [{ surv: 1 }] }
      ],
      choices: [{ text: "'Thank you, Bronka.'", goto: "hub" }]
    },
    lastnight: {
      speaker: "bronka",
      text: "'Last night.' A short, dry laugh. 'Crumb, there's no such thing as last night. There's a clean space where it used to be. I have one too. Mine's smaller.' She cuts the loaf. 'I do remember one thing. A knock at the kitchen door at about one in the morning. A boy's voice. He wanted a heel of bread and he said, 'For the road.' I gave it to him. I thought he'd had a fright. He was shaking so hard the crumbs fell out of his pocket.'\n\nShe looks at you. You are not sure it was you. Neither is she.",
      onEnter: [{ set: "bronka_lastnight", val: true }, { xp: 2 }, { note: "task_yesterday", text: "Bronka remembers a boy knocking at the kitchen door at about 01:00, asking for a heel of bread 'for the road', shaking. Could have been me." }],
      interjections: [
        { skill: "empathy", min: 3, text: "She's not lying. She just isn't sure it was you either. That's the shape the Bell leaves in everyone: a vague, kind guess." },
        { skill: "deduction", min: 4, text: "One in the morning. Two hours before Osk saw someone leave the gym. A kitchen door that nobody uses. A heel of bread. You ran, hungry, with something to protect." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    }
  }
},

lemmy: {
  title: "Lemmy Tarsk",
  start: [{ cond: "flag.lemmy_met", node: "hub" }, { node: "first" }],
  nodes: {
    first: {
      speaker: "lemmy",
      text: "'HALT, citizen-student.' A hand lands on your sleeve. The boy is fifteen, perhaps sixteen, with ironed hair and a red armband so stiff it could hold up a ceiling. 'Per Regulation Twelve, Subsection Cuff: your left sleeve is detached. Per Regulation Nine, Subsection Chalk: your hands are white. Per Regulation Twenty, you are late.' He pulls a notebook from his blazer. 'I have a pen. This is going to be very easy for both of us.'",
      onEnter: [{ set: "lemmy_met", val: true }],
      interjections: [
        { skill: "authority", min: 3, text: "A CHILD IS BARKING AT YOU. BARK HARDER. IT'S ONLY FAIR." },
        { skill: "charm", min: 3, text: "He's wearing a smile like an ill-fitting hat. Take it gently and he'll let you borrow it." },
        { skill: "archive", min: 3, text: "Regulation Twelve is about shoelaces. Regulation Nine is about lipstick. Regulation Twenty is the General Principle of Punctuality. He's quoting at random. Magnificent." },
        { skill: "doublethink", min: 3, text: "Let him write you up. A neat line in a hall monitor's book is a good thing. It shows you're seen." }
      ],
      choices: [
        { text: "'I'm assisting Lieutenant Kell. Special inquiry.'", goto: "inquiry", effects: [{ ideo: "vanguard", n: 1 }] },
        { text: "[Charm him out of the ticket.]", check: { skill: "charm", diff: 9, id: "lemmy_charm_ticket", white: true, pass: "ticket_off", fail: "ticket_on" } },
        { text: "[Face him down.]", check: { skill: "authority", diff: 10, id: "lemmy_authority_ticket", white: true, pass: "ticket_off", fail: "ticket_on" } },
        { text: "Let him write you up.", goto: "ticket_on", effects: [{ surv: -2 }] }
      ]
    },
    inquiry: {
      speaker: "lemmy",
      text: "His pen stops. 'Special inquiry,' he says. 'With a lieutenant. Concerning the, ah, the Commissar.' A little bead of sweat appears at his hairline. 'I have not seen anything. I was not on duty. I was on duty, but at the opposite end. Per Regulation Four, a hall monitor has no obligation to witness.' He writes something, crosses it out. 'Would you like me to escort you? I would like to be escorting you. I am trained.'",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "instinct", min: 4, text: "He's not afraid of you. He's afraid of what you'll find. The distinction is everything." },
        { skill: "empathy", min: 3, text: "He's a scared kid with a notebook, building a wall of rules between himself and a room he can't bear to enter." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    ticket_off: {
      speaker: "lemmy",
      text: "He blinks, wavers, and the pen sinks to his side. 'I... suppose... a first offence. Per Regulation Zero. The Unwritten Mercy Clause.' He tears the blank page out of his notebook and, with great ceremony, folds it into the shape of a small boat. 'I am not meant to issue these. But you have a kind face and a serious problem, and the two don't happen together much.'",
      onEnter: [{ xp: 1 }, { set: "lemmy_ticket_off", val: true }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    ticket_on: {
      speaker: "lemmy",
      text: "The pen scratches. 'Violations: one, two, three, four. Fine: six marks, to be worked off by Friday. Please sign.' He holds out a clipboard with a flourish. 'Do not be upset. It's not personal. Nothing is personal. That's what makes it fair.' He says 'fair' like a boy saying 'dad'. A sheet of paper, a pen on a string, a signature line.\n\nYou sign. It's easier than the alternative.",
      onEnter: [{ surv: 2 }, { set: "lemmy_ticketed", val: true }],
      interjections: [
        { skill: "rote", min: 3, text: "SIX MARKS. ONE MARK: ONE DEMERIT. TEN MARKS: ONE PARENT-CONFERENCE. TWENTY MARKS: ONE CONFERENCE WITH THE STATE." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    hub: {
      speaker: "lemmy",
      text: ["Lemmy stands at attention, notebook open, pen cocked. 'Yes, citizen-student? Is there a complaint, or is this a social call? I'm not permitted social calls, but I'm prepared to be flexible.'", "'Citizen,' he says, with a crisp little nod. 'Questions are permitted. Answers are at my discretion.'"],
      interjections: [
        { skill: "empathy", min: 4, text: "His hand shakes on the pen whenever the stage door creaks. He's afraid of something in this hall that isn't a Regulation." }
      ],
      choices: [
        { text: "'Bronka's coupons keep going missing.'", goto: "coupons", cond: "task('task_coupons') === 'active' && !has('ration_coupon') && !flag.lemmy_coupons_done" },
        { text: "'What did you see last night?'", goto: "saw", cond: "!flag.lemmy_saw" },
        { text: "'Tell me about Rhea Vantage.'", goto: "rhea", cond: "!flag.lemmy_rhea" },
        { text: "'Are there openings in the Vanguard?'", goto: "armband", cond: "!has('vanguard_armband') && !flag.lemmy_armband_refused" },
        { text: "'Good luck with the notebook.'", end: true }
      ]
    },
    coupons: {
      speaker: "lemmy",
      text: "The colour leaves his face in a clean, even sweep. 'Coupons. The Hall's coupons. I wouldn't. I am the Hall Monitor. I report on the very concept.' His pen hand trembles. 'There may be an irregularity in the stationery. Per Regulation Eight, stationery is... well, it is a grey area.'\n\nHe looks at the stage door, then at the floor. 'I need to be somewhere,' he says. 'In about three hours. And I need to bring something with me.'",
      onEnter: [{ set: "lemmy_coupon_hint", val: true }],
      choices: [
        { text: "[Press him with the logic: only a monitor could take them.]", check: { skill: "dialectics", diff: 10, id: "lemmy_dialectics_coupon", white: true, pass: "confess", fail: "stonewall" } },
        { text: "[Persuade him: she will forgive honesty.]", check: { skill: "rhetoric", diff: 11, id: "lemmy_rhetoric_coupon", white: true, pass: "confess", fail: "stonewall" } },
        { text: "[Read his face: what is he afraid of?]", check: { skill: "empathy", diff: 9, id: "lemmy_empathy_coupon", white: true, pass: "confess", fail: "stonewall" } },
        { text: "Let it go for now.", goto: "hub" }
      ]
    },
    confess: {
      speaker: "lemmy",
      text: "His shoulders drop an entire inch, then two. He looks, abruptly, his real age. 'It's for Rhea,' he says in a rush. 'Every Thursday. 'Dues'. She says the Vanguard needs a levy. If I don't bring twelve, she... she doesn't hit me. She just stands there. She stands there and looks at me for a very long time and I find myself offering her things.' He pulls a crumpled coupon from inside his armband. 'This is the last one. I haven't given it to her yet. Please. Take it. Give it back. Tell Bronka I'm sorry. Tell her I'll stop.'\n\nHis eyes shine. 'Will you tell Rhea?'",
      onEnter: [{ give: "ration_coupon" }, { set: "lemmy_coupons_done", val: true }, { xp: 3 }, { toast: "Received: Ration Coupon" }, { set: "lemmy_confessed", val: true }, { note: "task_coupons", text: "Lemmy confessed: he's been stealing the coupons to pay 'dues' to Rhea Vantage. He gave me the last coupon to return to Bronka." }, { note: "task_rhea", text: "Rhea collects 'dues' from Lemmy in stolen ration coupons. She doesn't hit him. She stands there." }],
      interjections: [
        { skill: "solidarity", min: 3, text: "He's one of ours. He just didn't know. All the frightened ones are ours, if we reach them first." },
        { skill: "authority", min: 3, text: "RHEA VANTAGE COLLECTS TAXES. A SEVENTEEN-YEAR-OLD IS RUNNING A PROTECTION SCHEME. THIS IS OUTRAGEOUS. THIS IS ALSO USEFUL." },
        { skill: "instinct", min: 3, text: "'She just stands there.' That's all it takes. A tall girl, a stare, and a school full of children paying her in bread." }
      ],
      choices: [
        { text: "'I won't tell her. Go home, Lemmy.'", goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }, { morale: 1 }, { set: "lemmy_spared", val: true }] },
        { text: "'I'll need to tell the Lieutenant.'", goto: "hub", effects: [{ ideo: "vanguard", n: 1 }, { surv: -2 }] }
      ]
    },
    stonewall: {
      speaker: "lemmy",
      text: "'I have nothing to declare,' he says, with a firmness that lasts about as long as a match. 'I have done nothing but uphold the Regulations. You can ask anyone. Ask the Principal. Ask the, the Regulations.' He retreats a step. 'I need to go and check a perimeter.' He does not go. But he stops looking at you.\n\nThe moment has closed. It may open again if you come back with a better angle.",
      onEnter: [{ morale: -1 }, { surv: 1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    saw: {
      speaker: "lemmy",
      text: "'Last night.' He looks around as though the walls had committed to memory. 'I was on night patrol. Per my schedule. I saw a student on the stage door at ten past one with the Commissar. The student was carrying something under their arm, wrapped in a school scarf. They were arguing. Quietly. The Commissar said something I didn't hear, and the student said, 'Then I'll do it.'' He swallows. 'That student was you.'\n\n'I didn't tell anyone,' he adds quickly. 'Nobody asked.'",
      onEnter: [{ set: "lemmy_saw", val: true }, { xp: 2 }, { note: "task_yesterday", text: "Lemmy saw me with Dane at the stage door at about 01:10, carrying something wrapped in a school scarf. I said: 'Then I'll do it.'" }],
      interjections: [
        { skill: "deduction", min: 4, text: "A scarf. A parcel. 'Then I'll do it.' You agreed to carry the Ledger. The decision, the courier, the Commissar. It fits." },
        { skill: "volition", min: 4, text: "'Then I'll do it.' Hold that. Whatever you were afraid of, you decided anyway. That is a person worth catching up to." },
        { skill: "empathy", min: 3, text: "He saw. And he said nothing. That's not cowardice; it's a boy who's learned the safest thing is to unsee." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    rhea: {
      speaker: "lemmy",
      text: "His whole body gets smaller. 'Rhea Vantage,' he whispers. 'She's the one with the orange. She eats an orange every morning. Nobody knows where she gets them. She peels it with a little knife in one long piece and then she holds it up and looks at you through the curl.' He shivers. 'I don't know what she does. I know that nobody ever says what she does. It's like weather. She's in the Courtyard, by the Statue, most mornings. Doing nothing. Being looked at.'",
      onEnter: [{ set: "lemmy_rhea", val: true }, { xp: 1 }, { set: "knows_rhea_orange", val: true }],
      interjections: [
        { skill: "instinct", min: 3, text: "Orange. A knife. A curl of peel. The smell on the mats. There is no longer any question." },
        { skill: "the_grey", min: 3, text: "Fear has a smell. In this city it smells of citrus and oil. They sell it in shops that don't exist." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    armband: {
      speaker: "lemmy",
      text: "His whole face lights up like a lamp. 'The Vanguard! Always! Per Section Nine, any student of good record can apply. And you have a distinctive, a very distinctive record.' He fumbles in his satchel and brings out a spare armband, red with a gold fist: new, stiff, smelling of dye. 'It confers certain privileges. Corridor access. Use of the good lavatory. A feeling,' he adds earnestly, 'of being on the right side of the door.'\n\nHe holds it out. His hand shakes with hope. It's the first time anyone has asked him a favour.",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: "Put it on! You'd look splendid. Splendid! No one would ever suspect you of anything again." },
        { skill: "solidarity", min: 3, text: "He doesn't want you to join. He wants not to be alone in it." },
        { skill: "dialectics", min: 4, text: "An armband is a uniform of a single thought. Put it on and you will think it, and be thought of by it. A lovely trap, and it comes with a pin." }
      ],
      choices: [
        { text: "Take it and put it on.", goto: "armband_on", effects: [{ give: "vanguard_armband" }, { ideo: "vanguard", n: 2 }, { surv: -6 }, { thought: "th_good_citizen" }, { toast: "Received: Vanguard Armband" }] },
        { text: "'Not today.'", goto: "armband_off", effects: [{ set: "lemmy_armband_refused", val: true }] }
      ]
    },
    armband_on: {
      speaker: "lemmy",
      text: "He fastens it with trembling care, smoothing the cloth against your sleeve, eyes brimming. 'You look,' he says, 'official.' It does something to your posture: shoulders square, chin up, a vague conviction that the world has been put right. 'Per Regulation, you are now permitted to report infractions.' He stops. 'And to be reported.'\n\nHe doesn't seem to notice what he has just said.",
      onEnter: [{ xp: 2 }, { set: "lemmy_armband_worn", val: true }],
      interjections: [
        { skill: "authority", min: 3, text: "YES. THAT'S THE POSTURE. THE ARMBAND KNOWS WHERE YOUR SPINE IS." },
        { skill: "volition", min: 4, text: "It's cloth. You can take it off. Remember that you can." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    armband_off: {
      speaker: "lemmy",
      text: "'Of course.' The armband is back in the satchel before the word has finished. 'Of course. Some people are not suited. It's not a failing.' He smiles, so brightly and so bravely that it hurts. 'I will keep it. Should you change your mind. I am always here. Per my schedule.'\n\nHe turns away and writes something in the notebook. You hope it's nothing.",
      choices: [{ text: "Continue.", goto: "hub" }]
    }
  }
},


ilsabet: {
  title: "Ilsabet Orrin",
  start: [{ cond: "flag.ilsabet_met", node: "hub" }, { node: "first" }],
  nodes: {
    first: {
      speaker: "ilsabet",
      text: "'Don't look at the book,' says the girl in the wheelchair, without lifting her eyes from it. 'It's upside down. It's been upside down since eight. If you tell Lemmy, I'll say you were the one who turned it.' She finally glances up. Round glasses, a braid as thick as a rope, ink-and-solder on her thumbs. 'Ilsabet Orrin. Seventh form. Authorised wheelchair, Item 14-C, on loan. Unauthorised everything else.'\n\nShe says it in the same flat, gleeful tone of a person reading out her own charge sheet.",
      onEnter: [{ set: "ilsabet_met", val: true }],
      interjections: [
        { skill: "deduction", min: 3, text: "Under the cardigan: a coil of copper wire, a screwdriver case, a thumb-sized glass bulb wrapped in cloth. She's not hiding a book. She is hiding a laboratory." },
        { skill: "charm", min: 3, text: "She's testing your sense of humour. Laugh at the right place and she'll adopt you." },
        { skill: "empathy", min: 3, text: "The loudness is armour. Underneath, someone is very, very tired of being looked at as a chair." },
        { skill: "rote", min: 3, text: "ITEM 14-C: WHEELED CONVEYANCE, ONE, STUDENT, LOANED. NOT TO BE DECORATED. NOT TO BE LOVED." }
      ],
      choices: [
        { text: "'I'll keep your secret.'", goto: "secret", effects: [{ ideo: "undercurrent", n: 1 }] },
        { text: "'Why is the book upside down?'", goto: "book" },
        { text: "'Are you an informer?'", goto: "informer", effects: [{ surv: 0 }] }
      ]
    },
    secret: {
      speaker: "ilsabet",
      text: "She tilts her head. 'You say that like you have secrets of your own to trade.' A pause. 'You have. Everyone has. It's the national currency.' She shuts the upside-down book and tucks it away. 'All right. Sit. You look like someone who wants a favour, and I like people who want favours; they're consistent.'\n\nSomething in her face loosens, one notch.",
      onEnter: [{ xp: 1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    book: {
      speaker: "ilsabet",
      text: "'Because upside down, the lamp doesn't light up.' She flips it open, and inside, between the pages, is the hollowed-out cavity of a small shortwave set, its tiny glass valves nested like eggs. 'Orthodoxy, Volume Six. 'Unity of the Citizen.' It's thick enough to hide a radio, and nobody has ever read it far enough to find out.'\n\nShe grins. A real grin; her whole face does it. 'I find that to be the most patriotic use of the text.'",
      onEnter: [{ xp: 1 }, { set: "ilsabet_book", val: true }],
      interjections: [
        { skill: "archive", min: 3, text: "Orthodoxy, Volume Six, 'Unity of the Citizen', 412 pages. Nobody has read beyond page 60. She has an excellent hiding place." },
        { skill: "solidarity", min: 3, text: "A secret passed between two people is a small country. We are, in this moment, a state of two." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    informer: {
      speaker: "ilsabet",
      text: "She laughs, once, a startled bark, and then stops. 'Direct. I like direct. No.' She lowers her voice. 'But I'd say that, wouldn't I? Look. If I were, I'd be doing a better job. Informers don't wear this cardigan.' She tugs the sleeve. 'It's the colour of a warning label.'\n\nShe studies you. 'Are you?'",
      interjections: [
        { skill: "instinct", min: 3, text: "She's decided to trust you. Not because you answered well, but because you asked." },
        { skill: "rhetoric", min: 3, text: "A beautiful question to ask: it forces her to answer first. Anyone who isn't an informer will be offended; anyone who is will be pleased. She was neither." }
      ],
      choices: [
        { text: "'Not that I know of.'", goto: "secret", effects: [{ xp: 1 }] },
        { text: "'I'm assisting Lt. Kell. Technically, yes.'", goto: "informer_yes", effects: [{ surv: -2 }] }
      ]
    },
    informer_yes: {
      speaker: "ilsabet",
      text: "'Technically.' She nods thoughtfully. 'I respect a technical man.' She doesn't move a muscle, but the cardigan seems to close around her. 'Then here's what you'll hear from me: I have a hobby. I like old radios. I have a small, harmless collection. Anything else, you'll need a warrant, a witness, and a very good sense of humour.'\n\nBut she keeps talking, because she is lonely, and because you were honest.",
      onEnter: [{ xp: 1 }, { set: "ilsabet_warned", val: true }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    hub: {
      speaker: "ilsabet",
      text: ["'Go on, Inspector.' Ilsabet turns her chair a precise quarter. 'You have my full attention and half my sandwich.'", "She wedges a screwdriver behind her ear. 'Make it brief. There are four ears on this room and one of them is Lemmy's.'"],
      interjections: [
        { skill: "empathy", min: 4, text: "She is at the centre of the room by choice and at its edge by design. Both facts are hers." },
        { skill: "senses", min: 4, text: "A faint hiss from under the cardigan, a crackle, a tiny voice saying 'Little Lamp, Little Lamp' to nobody at all. She's running a set. Now." }
      ],
      choices: [
        { text: "'Tell me about the chair.'", goto: "chair", cond: "!flag.ilsabet_chair" },
        { text: "'What is Little Lamp?'", goto: "lamp", cond: "!flag.ilsabet_lamp" },
        { text: "'Can you fix the set?' (Show her the tube.)", goto: "tube", cond: "has('radio_tube') && !flag.ilsabet_tube_given" },
        { text: "'I need the Bell's tone decoded.'", goto: "decode", cond: "flag.ilsabet_tube_given && !flag.ilsabet_decoded" },
        { text: "'What do you need to fix it?'", goto: "need_tube", cond: "!has('radio_tube') && !flag.ilsabet_tube_given && flag.ilsabet_lamp" },
        { text: "'What would we need to reach the whole school?'", goto: "plan", cond: "flag.ilsabet_decoded && !flag.ilsabet_plan" },
        { text: "'Not now.'", end: true }
      ]
    },
    chair: {
      speaker: "ilsabet",
      text: "'Dormitory Four. Spring of last year. Seventeen steps, wet, no rail, a Vanguard drill running down them at the time.' She says it as if reporting weather. 'I fell on the ninth. The Principal sent a form. 'Request for Ramp.' Denied: 'Ramps encourage idleness.' The chair came two years later, 'on loan'. There is a depreciation schedule.'\n\nShe adjusts a wheel. 'I don't mind the chair. I mind the loan.'",
      onEnter: [{ set: "ilsabet_chair", val: true }, { xp: 2 }, { thought: "th_wheel_and_chair" }],
      interjections: [
        { skill: "archive", min: 3, text: "'Request for Ramp.' Form 88-R. Denied under Ordinance 12 'On the Prevention of Idleness by Architecture'. I find it one of the saddest documents in the Union. I have a copy." },
        { skill: "empathy", min: 3, text: "She makes it a joke because the alternative is a long silence. Be the one who doesn't make her fill it." },
        { skill: "solidarity", min: 4, text: "We carried her to class for two years. We, the ones who weren't told to. That is the other budget, the one that never appears in the Bureau's books." },
        { skill: "dialectics", min: 3, text: "A ramp encourages idleness. A staircase encourages ambition. Therefore the Union is best served by a nation of the slightly bruised. Perfectly consistent." }
      ],
      choices: [
        { text: "'I'm sorry.'", goto: "hub" },
        { text: "'The loan's a joke. Let's make the joke ours.'", goto: "hub", effects: [{ xp: 1 }, { ideo: "undercurrent", n: 1 }] }
      ]
    },
    lamp: {
      speaker: "ilsabet",
      text: "'Little Lamp is me.' She says it very quietly. 'Every night at three, after the Bell has stopped and the dormitory snores, I switch on a set under my blanket and read the letters.' A pause. 'Not real letters. I make them up. 'Dear Listeners.' I tell them the weather. I read them a poem. I give them the time. I do it for half an hour and then I turn it off, and nobody ever replies.'\n\nShe studies her hands. 'Except once. Last October. A man's voice, very faint. He said: 'Lamp, I hear you.' Then nothing. I've never found him.'",
      onEnter: [{ set: "ilsabet_lamp", val: true }, { xp: 3 }, { task: "task_radio", state: "active" }, { note: "task_radio", text: "Ilsabet runs a pirate radio, 'Little Lamp', every night at 03:00. Her set is broken: it needs a replacement radio tube." }],
      interjections: [
        { skill: "empathy", min: 3, text: "She reads to the dark every night in case someone is on the other end. That is either the saddest or bravest thing you will hear today. It is both." },
        { skill: "solidarity", min: 3, text: "Somewhere there is a man who heard her and held on. We are a thousand little lamps. We each think we're the only one." },
        { skill: "the_grey", min: 4, text: "I know that frequency. It sits in the walls like a mouse. A little warm thing, whispering at night, and I have never once been jealous." },
        { skill: "senses", min: 4, text: "A faint scent of hot dust, solder, and burnt cocoa. She drinks cocoa while she broadcasts. She's made a ritual." }
      ],
      choices: [
        { text: "'What happened to the set?'", goto: "need_tube" },
        { text: "'Maybe he's still listening.'", goto: "hope", effects: [{ morale: 1 }] }
      ]
    },
    hope: {
      speaker: "ilsabet",
      text: "'Don't.' She says it fast, almost fierce. Then, softer: 'Don't hand me hope, I'll drop it. I've got nowhere to put it.' She looks at the wall for a while. 'But thank you. Nobody's said that in a year.' She wipes her cheek on the back of her wrist, scowls to cover it, and mutters 'Allergies.'\n\nThere's a long, companionable silence. In the pole-speaker above the stage, someone is breathing.",
      onEnter: [{ xp: 1 }, { set: "ilsabet_hope", val: true }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    need_tube: {
      speaker: "ilsabet",
      text: "'The detector tube blew in March.' She holds up a dead glass thing the length of her thumb, its filament snapped. 'It's a type 6K7, a pentode, and there are four in the whole city. One's in the Principal's wireless. One's in a museum. The third is wherever the Undercurrent keeps their radio, and the fourth I'm not allowed to say.' She turns it between her fingers. 'Everybody rumours there's a spare in the boiler room. I wouldn't know. Cripples don't do stairs.'\n\nThe bitterness is expert. She's had practice.",
      onEnter: [{ set: "ilsabet_need_tube", val: true }, { xp: 1 }, { note: "task_radio", text: "Ilsabet needs a 6K7 radio tube. Rumour says there's one in the boiler room." }],
      interjections: [
        { skill: "rote", min: 3, text: "6K7: SUPER-CONTROL PENTODE. USED IN ARMY SURPLUS WIRELESS, CLASS B. THE ARMY HAS RETIRED THE CLASS B. THE ARMY IS GENERALLY SLOW TO RETIRE THINGS." },
        { skill: "doublethink", min: 3, text: "She has such an interesting hobby. You might mention it to the Lieutenant. It would be so helpful. It would really help." }
      ],
      choices: [
        { text: "'I'll look in the boiler room.'", goto: "hub", effects: [{ xp: 1 }] },
        { text: "[Mention her hobby to Lt. Kell, for her own safety.]", goto: "betray", cond: "!flag.ilsabet_betrayed" },
        { text: "'Hold on.'", goto: "hub" }
      ]
    },
    betray: {
      speaker: "narrator",
      text: "You think of the form in Vasha's pocket. A sentence or two would be enough. 'The student Orrin keeps unauthorised apparatus.' It would please someone. It might protect you. It might even be called a duty.\n\nIlsabet's chair squeaks as she turns away. She hasn't heard your thoughts. But she has the instinct of the watched, and she says nothing at all.",
      onEnter: [{ set: "ilsabet_betrayed", val: true }, { surv: -6 }, { ideo: "vanguard", n: 2 }, { morale: -2 }],
      interjections: [
        { skill: "doublethink", min: 3, text: "That was thoughtful of you. The State is grateful. A good citizen does exactly that. Doesn't it feel clean?" },
        { skill: "volition", min: 3, text: "Don't pretend you didn't just decide something about yourself. It will be a long time before you decide the opposite." },
        { skill: "solidarity", min: 2, text: "..." }
      ],
      choices: [{ text: "Walk away.", end: true }]
    },
    tube: {
      speaker: "ilsabet",
      text: "She stares at the tube in your hand. Her mouth opens, closes. A very small sound comes out of her, half-laugh, half-sob. 'That's a 6K7,' she says. 'That is a 6K7, and you are a clown, and I'm going to kiss you.' She does not, but she takes it in both hands, cradles it, and then, with astonishing speed, she is under the cardigan with a soldering iron.\n\n'Hold the lamp,' she mutters. 'Turn it up. Not that. THAT.'",
      onEnter: [{ take: "radio_tube" }, { set: "ilsabet_tube_given", val: true }, { xp: 3 }, { time: 15 }, { note: "task_radio", text: "Gave Ilsabet the radio tube. She is rebuilding the set." }],
      interjections: [
        { skill: "aim", min: 3, text: "Steady the lamp. Hold it at thirty degrees. Over the left shoulder. Good. Now breathe out." },
        { skill: "sleight", min: 4, text: "Watch her hands. Pliers, needle, wire. It's choreography. If you ever need to learn to pick a lock, learn it from someone who solders." },
        { skill: "solidarity", min: 3, text: "She trusts you with the light. That is the whole contract." }
      ],
      choices: [{ text: "Continue.", goto: "tube2" }]
    },
    tube2: {
      speaker: "ilsabet",
      text: "A long hiss, a high squeal, a rising thump like a heart restarting. The little set coughs into life: a green eye, a white noise, a dozen voices from other districts washing past in broken syllables. 'There,' she whispers. 'There she is. There's my Lamp.' She turns a dial and the noise resolves, for a moment, into a woman's voice reading out the weather for a city none of you have heard of.\n\nShe looks up. For the first time, her face is entirely without defence. 'Thank you.'",
      onEnter: [{ xp: 1 }, { sfx: "static" }, { morale: 1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    decode: {
      speaker: "ilsabet",
      text: "'You want me to pull the carrier off the Bell.' She whistles softly. 'That's not a request, that's a felony. But I've wanted to do it since I was twelve.' She slides the set between you on the table, wires trailing like ivy. 'I'll record a pass of the nightly tone from the pole-speaker. It has a carrier wave, a pure E-flat, and something hidden in the beating. If I can get the beating isolated, I can show you what the tone is made of.\n\nI need someone with ears. The set only tells me what it can measure. You've got the ringing.'",
      interjections: [
        { skill: "senses", min: 4, text: "She's right. The ringing is your instrument. It was tuned in childhood to a frequency that is not on the dial." },
        { skill: "rote", min: 4, text: "E-FLAT, 311.1 HERTZ. THE TONE OF THE HARMONY. BEATING FREQUENCY: 'NOT PUBLISHED'." }
      ],
      choices: [
        { text: "[Listen to the tone through the set, and hum it back to her.]", check: { skill: "senses", diff: 8, id: "ilsabet_decode_easy", white: true, pass: "decode_pass", fail: "decode_fail" }, cond: "flag.horn_pitch || flag.fenwick_gave_pitch" },
        { text: "[Listen to the tone through the set, and hum it back to her.]", check: { skill: "senses", diff: 12, id: "ilsabet_decode_hard", white: true, pass: "decode_pass", fail: "decode_fail" }, cond: "!(flag.horn_pitch || flag.fenwick_gave_pitch)" },
        { text: "Not yet.", goto: "hub" }
      ]
    },
    decode_fail: {
      speaker: "ilsabet",
      text: "The tone swells in the little speaker, a smooth silver line, and you try to catch the shiver inside it. Your head fills with sparks. 'No,' she says gently, turning the dial. 'You're flinching. Everyone flinches. It's built to slide off.' She switches it off, and the silence has the ringing in it.\n\n'Find a tuning fork, or a man with perfect pitch, or the thing you carry in your skull. Come back when you've heard it clean.'",
      onEnter: [{ morale: -1 }],
      interjections: [
        { skill: "volition", min: 3, text: "You can try again when you know the note. There is a man in this room who hears every note." },
        { skill: "the_grey", min: 3, text: "Static doesn't want to be understood. It is the sound of the mind being slid out of the room, politely." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    decode_pass: {
      speaker: "ilsabet",
      text: "You hum. She tunes. The little speaker swells in answer, the pure E-flat, and in the middle of it, you hear, finally, the second voice, the one that has been hiding under the first all your life: a slow irregular beat, 7 cycles, 11 cycles, 7 again, a pulse that is not music but instruction.\n\nShe stares at the oscilloscope, a cracked green saucer on her knee. 'It's a pattern,' she whispers. 'A suppression pattern. It's designed to make the hippocampus, I think, I think it's the right word, shut. Not gentle. Rhythmic. Like a hand over a mouth.' She looks up. Her eyes are huge. 'It takes the last few hours. That's what the Static is.'",
      onEnter: [{ set: "ilsabet_decoded", val: true }, { set: "knows_static", val: true }, { xp: 4 }, { thought: "th_bell_tolls" }, { task: "task_radio", state: "done" }, { note: "task_radio", text: "Decoded the Bell's carrier with Ilsabet: a 7-11 beating pattern that suppresses memory. The Static is real." }, { note: "task_yesterday", text: "Ilsabet confirmed it: the Bell carries a memory-suppression pulse. Nobody forgot by accident." }],
      interjections: [
        { skill: "dialectics", min: 3, text: "It is, therefore, not an accident. Premise: the pattern is regular. Premise: the pattern is audible to all. Conclusion: forgetfulness is a service, rendered nightly, to an unconsenting public." },
        { skill: "archive", min: 4, text: "Seven and eleven. Both primes. Someone chose primes. Someone, in an office, with a ruler, chose primes." },
        { skill: "empathy", min: 3, text: "Her hands are shaking. She's been guessing at this for years. Now she knows, she knows what she lost, and she isn't sure she wanted to." },
        { skill: "authority", min: 4, text: "WE ARE AT WAR. WE HAVE ALWAYS BEEN AT WAR. THE ENEMY IS THE HYMN." }
      ],
      choices: [{ text: "Continue.", goto: "after_decode" }]
    },
    after_decode: {
      speaker: "ilsabet",
      text: "She puts the headphones down. The whole cafeteria is oddly small around the two of you. 'I want to say something,' she says. 'And I don't want you to say anything back.' She exhales. 'I've been reading to nobody for a year. It turns out I've been reading to everybody who forgot.' Her braid has come loose. 'If this gets out, they'll call it a lie. They'll say it's the work of a lonely girl. They'll be right. It'll still be true.'\n\nShe slides the disc into your palm: a small, hand-pressed record of the decoded pulse.",
      onEnter: [{ xp: 1 }, { morale: 2 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    plan: {
      speaker: "ilsabet",
      text: "'To reach everyone?' She chews the end of a pencil. 'The school PA runs off one mixing desk in the Principal's cellar, but the Hall's stage microphone has a patch. It's a quarter-inch jack to the main line, installed for the Anthem. Fenwick uses it every Tuesday. If you plug a clean signal into the stage mic, whatever you say into it goes out to every speaker in the building. And the pole-speakers in the District.'\n\nShe taps the table. 'I can make the mic carry the decoded tone, and your voice over the top. What I can't make is the cable. The old one's rotted. The Undercurrent has a spare; I've seen the planning table. And you'll need something to say.'",
      onEnter: [{ set: "ilsabet_plan", val: true }, { xp: 2 }, { task: "task_broadcast", state: "active" }, { note: "task_broadcast", text: "Ilsabet says the Ration Hall's stage mic connects to the school PA. I need a mic cable (the planning table in the boiler room), the decoded tone (done) and the Ledger. Then I can broadcast the truth." }],
      interjections: [
        { skill: "rhetoric", min: 3, text: "And something to say. That is the real art. Whoever holds the microphone becomes the argument." },
        { skill: "solidarity", min: 3, text: "Imagine it. Every speaker in the school. Every kitchen. Every kid in every bed. All of us hearing the same sentence for the first time." },
        { skill: "doublethink", min: 4, text: "Oh, friend. Please don't. We were so fond of you. This is the sort of idea that ends with your name being used to teach children." }
      ],
      choices: [{ text: "'I'll bring you the cable.'", goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }]
    }
  }
},

fenwick: {
  title: "Choirmaster Alder",
  start: [{ cond: "flag.fenwick_met", node: "hub" }, { node: "first" }],
  nodes: {
    first: {
      speaker: "fenwick",
      text: "'Ah! A, ah, a listener.' The thin man in the shabby suit turns on his podium, a baton still raised. His face is lit with the particular brightness of someone who rarely gets an audience. 'Fenwick Alder. Music. The, the Anthem, you understand. We are doing the third verse. It is a very difficult verse. It has a modulation.' He has a high, cracked voice, a voice with a flaw running through it like the fault in a bell. 'I am sorry. My voice. It is, ah, not what it was. Acoustic fatigue.'\n\nHe says the last two words the way a man holds a rejected application.",
      onEnter: [{ set: "fenwick_met", val: true }, { task: "task_choir", state: "active" }, { note: "task_choir", text: "Choirmaster Fenwick Alder rehearses the Anthem alone on the Ration Hall stage. His voice is cracked. Something about 'acoustic fatigue'." }],
      interjections: [
        { skill: "empathy", min: 3, text: "He apologises before he speaks. He has been told his voice is a problem so many times that it has become a form of manners." },
        { skill: "senses", min: 3, text: "Rosin, pencil lead, old paper. A faint ring under his voice as he talks, as if his larynx were a cracked cup." },
        { skill: "rote", min: 3, text: "THE ANTHEM: 'ONE BELL, ONE VOICE.' FOUR VERSES. MANDATORY AT 18:30 AND 21:00. A FIFTH VERSE EXISTS AND IS NOT SUNG." },
        { skill: "instinct", min: 4, text: "He keeps looking at the speaker. Not with fear. With longing. He wants it to stop being a speaker." }
      ],
      choices: [
        { text: "'You sound lovely.'", goto: "lovely", effects: [{ morale: 1 }] },
        { text: "'What happened to your voice?'", goto: "voice" },
        { text: "'Is it all right if I listen?'", goto: "listen" }
      ]
    },
    lovely: {
      speaker: "fenwick",
      text: "He blinks, twice, quite fast. 'I do not, ah. Nobody has said that.' He lowers the baton and looks at it as if he'd forgotten what it was for. 'You are kind. Or you are, ah, a very good liar. Either would be welcome.' A small smile, wavering. 'They tell me my voice has a flaw. It does. But a flaw is how you know a bell was cast by hand.'\n\nHe turns, a little too brightly, to the empty choir risers. 'From the top, children,' he says to nobody. 'From the beginning.'",
      onEnter: [{ xp: 1 }, { set: "fenwick_kind", val: true }],
      interjections: [
        { skill: "charm", min: 3, text: "Perfect. Kindness is currency in this country; hardly anyone spends it. He'll remember you for it." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    voice: {
      speaker: "fenwick",
      text: "'It was, ah, last spring.' He lowers his eyes. 'An Assembly. The Warden's Day. I was to lead the verse. But I, ah, I added a line. Not in the score. I sang it from memory. I did not plan to. It rose in me like a sneeze.' He touches his throat. 'Eleven seconds. Then they stopped the broadcast. Then there was, ah, a conversation. A 'voice rest'. A man came with a small device that, that fits against the larynx.' He opens his collar: a faint scar, a ring of shiny skin.\n\n'It was done very kindly. They said it was for my own protection.'",
      onEnter: [{ set: "fenwick_voice", val: true }, { xp: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: "His voice is not broken. It's been scarred on purpose, with the minimum force required. They are practised at it." },
        { skill: "grit", min: 3, text: "Look at the scar. A thin ring of old burn. It's a very small wound for the loss of an entire register. It's the efficiency that appals." },
        { skill: "doublethink", min: 3, text: "It was a kindness. They said it was a kindness. And they are never wrong." },
        { skill: "authority", min: 3, text: "THEY BURNED THE VOICE OF A MUSIC TEACHER. FOR ELEVEN SECONDS. FOR A LINE. I WOULD LIKE TO KNOW THE LINE." }
      ],
      choices: [
        { text: "'What was the line?'", goto: "line" },
        { text: "'I'm sorry.'", goto: "hub" }
      ]
    },
    line: {
      speaker: "fenwick",
      text: "He looks at the ceiling, at the speaker pole, at the doors. He wets his lips. 'Not here,' he whispers. 'Not, ah, not at this hour. There is, ah, a thing a man needs to feel safe before he says it.' He takes a handkerchief from his sleeve and dabs, absurdly, at his eyes. 'I will say this. It was from a song. A true song. It is called 'The Lantern Song'. A woman in the choir used to sing it while folding sheet music. I never learned the end.'\n\nHis hands are shaking. 'If you bring me tea,' he says, 'I will tell you the rest. Real tea. Not ration.'",
      onEnter: [{ set: "fenwick_line", val: true }, { xp: 1 }],
      interjections: [
        { skill: "archive", min: 3, text: "'The Lantern Song.' I have found it in the Index of Forbidden Verse, Fifth Edition, p. 212: 'Lantern Song (folk), banned 14 yrs. Reason: 'Sentiment.'' Sentiment. They banned a song for feelings." },
        { skill: "appetite", min: 3, text: "He said tea. He said REAL tea. I'm in. I'm entirely in. We have ration tea. It's not real. But it might be close." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    listen: {
      speaker: "fenwick",
      text: "'Listen!' He seems almost to glow. 'Of course. Of course! Sit, sit.' He turns back to the risers and lifts the baton. In the empty hall, he conducts nothing. Then you hear it: a whisper of sound, so soft it might be your own pulse. He is humming. Very quietly, with his lips almost closed, the cracked voice vibrating the bone of his skull.\n\nThe melody is not the Anthem. It is slower, rounder, strange; a tune like a hand held out in a dark room. It lasts eleven seconds. Then he stops, and the baton drops, and his face is wet.",
      onEnter: [{ set: "fenwick_heard", val: true }, { xp: 2 }, { thought: "th_anthem_earworm" }],
      interjections: [
        { skill: "solidarity", min: 3, text: "That tune. We know it. We ALL know it. We don't know how we know it. It is in our mothers' throats, in our grandmothers' hands." },
        { skill: "empathy", min: 3, text: "Eleven seconds. It has been eleven seconds ever since the broadcast was cut. He hums for exactly as long as he was allowed." },
        { skill: "volition", min: 4, text: "Stay still. Don't applaud. Don't speak. A man who sings in secret is a man who has just handed you his whole life." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    hub: {
      speaker: "fenwick",
      text: ["'Ah, my, ah, my student.' Fenwick straightens his tie. 'What, what can the arts do for you?'", "He rubs his hands, then catches himself and tucks them into his sleeves. 'I am rehearsing. It is the Anthem, again, again. Do ask, though. I am always glad of a question I do not have to answer in four-part harmony.'"],
      interjections: [
        { skill: "empathy", min: 4, text: "He doesn't want to be asked about the voice. He wants to be asked about the music. Ask about the music." }
      ],
      choices: [
        { text: "'Tell me about the Anthem.'", goto: "anthem", cond: "!flag.fenwick_anthem" },
        { text: "[Offer him the ration tea.]", goto: "tea", cond: "has('ration_tea') && !flag.fenwick_tea" },
        { text: "'Tell me the Lantern Song.'", goto: "lantern", cond: "flag.fenwick_tea && !flag.fenwick_lantern" },
        { text: "'You have perfect pitch, don't you? Listen to the Bell.'", goto: "pitch", cond: "flag.fenwick_voice && !flag.fenwick_gave_pitch" },
        { text: "'Would you conduct the school, if the Bell stopped?'", goto: "choir", cond: "flag.fenwick_lantern && !flag.fenwick_choir_ready" },
        { text: "'Not now.'", end: true }
      ]
    },
    anthem: {
      speaker: "fenwick",
      text: "'The Anthem! Ah!' He rises on his toes. 'Four verses, in D major, with a pedal tone on the bell. It was written by the Warden's own composer, a most dreadful man called Pelham, who thought a modulation was a kind of surrender. It is sung at eighteen-thirty and twenty-one, in every room, by every citizen, to a recording of a choir that never existed. I have been trying for six years to make them sing it as though they meant it.'\n\nHe laughs, a dry crackle. 'It is the hardest thing I have ever attempted. They mean it. That is the difficulty. The meaning is in the way they don't.'",
      onEnter: [{ set: "fenwick_anthem", val: true }, { xp: 1 }],
      interjections: [
        { skill: "rote", min: 3, text: "ONE BELL, ONE VOICE, ONE HEART, ONE DAY. THE WARDEN HEARS AND THE WARDEN KNOWS. WHEN THE BELL IS RUNG, THE UNION SINGS." },
        { skill: "dialectics", min: 4, text: "'They mean it, and that is the difficulty.' He has stated the whole problem of the regime: the song works because it is sung without being believed." },
        { skill: "rhetoric", min: 3, text: "That's an arresting line. 'The meaning is in the way they don't.' Steal it. Use it. Name him when you do." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    tea: {
      speaker: "fenwick",
      text: "He accepts the twist of tea as if it were a baby. He opens it, sniffs, and shuts his eyes. 'Chicory,' he says. 'Ten per cent tea. A real, true, working-class blend.' He pulls a battered tin cup from the pocket of his jacket and pours hot water into it from the Hall's samovar. He drinks. 'Oh,' he says. 'Oh, that is, ah, that is good.'\n\nThe colour comes back to him in a slow rinse. 'Thank you. Truly. I haven't been, ah, I haven't been given anything in a very long time.'",
      onEnter: [{ take: "ration_tea" }, { set: "fenwick_tea", val: true }, { xp: 2 }, { morale: 1 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "appetite", min: 2, text: "TEA. IT WAS OURS AND NOW IT'S HIS AND I'M BEARING IT. ... It's fine. He needs it more. ... I'm weeping a little." },
        { skill: "empathy", min: 3, text: "A man who has been given nothing for years has just been given a cup. He will remember this, not the tea. The cup." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    lantern: {
      speaker: "fenwick",
      text: "He puts the tin cup down very carefully. 'Close the door,' he says. 'In your mind, if not in the room.' Then he sings, in a whisper, pitched so low you feel it in the floor:\n\nLight a lantern in the hall,\nlight another for the wall,\nif the dark is all they give us,\nlet us light it, one and all.\n\nHis voice cracks on 'all'. The crack is where the song lives. He doesn't apologise. 'There are nine verses,' he says. 'I know five. If a whole choir knew them, ah, it would do what an anthem does. But for the right reasons.'",
      onEnter: [{ set: "fenwick_lantern", val: true }, { xp: 3 }, { thought: "th_collective_pulse" }, { note: "task_choir", text: "Fenwick sang me the Lantern Song, a banned folk tune. He knows five verses of nine. A whole choir singing it could be an anthem for the right reasons." }],
      interjections: [
        { skill: "solidarity", min: 3, text: "Light a lantern. Light another. That is all we are asking. It is the best political programme that I have ever heard." },
        { skill: "empathy", min: 4, text: "The crack is on 'all'. All. The word he cannot keep from breaking. Don't tell him that." },
        { skill: "rote", min: 3, text: "ARTICLE FOURTEEN: UNAPPROVED SONGS ARE A THREAT TO THE UNITY OF THE UNION. ARTICLE FOURTEEN, SUBSECTION B: THIS INCLUDES LULLABIES." },
        { skill: "doublethink", min: 3, text: "It's only a song about candles. Candles are on the Sensitive List, you recall. Light is on the Sensitive List. So are verbs." , effects: [{ surv: 1 }] },
        { skill: "the_grey", min: 3, text: "Dark is the oldest tenant in this building. It doesn't like songs. It tolerates them, as one tolerates mice." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    pitch: {
      speaker: "fenwick",
      text: "'Ah.' He holds very still, the way a deer holds still. 'You know that. You, ah, you know that I can hear it.' He lowers his voice. 'Every night at nine, the tone arrives. It is E-flat, as they say, but it is not E-flat. It is E-flat flat by a comma, with a second note inside the first, a minor third below, and a rhythm riding on that, a seven and an eleven. I have never told anyone. A man with my kind of ears is a, ah, a danger to himself.'\n\nHe hums it. You feel your ringing fall into step with his.",
      onEnter: [{ set: "fenwick_gave_pitch", val: true }, { xp: 3 }, { note: "task_radio", text: "Fenwick has perfect pitch. He told me the Bell's tone: flat E-flat with a hidden minor third and a 7-11 rhythm. That should help Ilsabet decode it." }],
      interjections: [
        { skill: "senses", min: 4, text: "There. The second note inside the first. You have been hearing it your whole life and didn't know it had a name." },
        { skill: "archive", min: 4, text: "Seven and eleven. Both primes. Both noted. Both, I must say, exceedingly ugly. I'd like to have been wrong about this." },
        { skill: "deduction", min: 4, text: "A man who hears the Bell as it is, every night, and keeps conducting. Do you know what it takes to stand in front of a choir with that in your head?" }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    choir: {
      speaker: "fenwick",
      text: "He looks at the empty risers, and for a moment you can see the choir he's been rehearsing for six years, forty children in dark blazers, faces turned upwards. 'If the Bell stopped,' he says. 'If someone took the microphone and the tone were cut, and the speakers were quiet, and the school were, ah, simply listening.' His voice is steady for the first time. 'I would stand here. I would lift my hand. And I would ask them to sing the one song they've never been taught.'\n\nA pause, a swallow. 'But I would need someone to ask me. Properly. Not as a favour. As a summons.'",
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "rhetoric", min: 3, text: "He's given you the cue. Not a promise: an invitation to ask. The whole art of persuasion is knowing the question has already been answered." },
        { skill: "authority", min: 4, text: "SUMMON HIM. HE IS A MAN WHO HAS BEEN WAITING FOR AN ORDER HE CAN BELIEVE IN." }
      ],
      choices: [
        { text: "[Summon him, formally, as a conductor.]", check: { skill: "authority", diff: 10, id: "fenwick_summon_authority", white: true, pass: "choir_yes", fail: "choir_no" } },
        { text: "[Ask him as a friend, as one of us.]", check: { skill: "solidarity", diff: 9, id: "fenwick_summon_solidarity", white: true, pass: "choir_yes", fail: "choir_no" } },
        { text: "[Argue that he owes it to the others.]", check: { skill: "rhetoric", diff: 11, id: "fenwick_summon_rhetoric", white: true, pass: "choir_yes", fail: "choir_no" } },
        { text: "Not yet.", goto: "hub" }
      ]
    },
    choir_yes: {
      speaker: "fenwick",
      text: "He straightens his tie. He puts the baton in his breast pocket like a pen. 'Then I accept,' he says. 'I will, ah, I will tell the children. Quietly. A hum at the end of each rehearsal. A line on the back of the sheet. By evening they will have the first five verses, and the hall will have their ears.' He shakes your hand with a sudden, surprising grip. 'And if the Bell rings, they will not forget. We will be so loud, you see.'\n\nHis eyes are bright and wet and quite without fear. He looks, for the first time, like a conductor.",
      onEnter: [{ set: "fenwick_choir_ready", val: true }, { task: "task_choir", state: "done" }, { xp: 4 }, { morale: 2 }, { ideo: "undercurrent", n: 2 }, { note: "task_choir", text: "Fenwick will teach the choir the Lantern Song and conduct it when the time comes." }],
      interjections: [
        { skill: "solidarity", min: 2, text: "We. We will sing it. A whole hall of lanterns." },
        { skill: "adrenaline", min: 3, text: "YES YES YES YES YES. A CHOIR. A CHOIR WITH AN AGENDA." }
      ],
      choices: [{ text: "Continue.", goto: "hub" }]
    },
    choir_no: {
      speaker: "fenwick",
      text: "He flinches at the force of it. 'I, ah. I can't. Not yet. It, it is not a thing I can decide on a Thursday.' He picks up the baton and puts it down again. 'Please. You have been kind. Don't, ah, don't make me be brave on an empty stomach.'\n\nHe turns back to the risers. His shoulders are already bracing for the next verse of the Anthem. You've asked too hard, or too soon. It may be different in a few hours.",
      onEnter: [{ morale: -1 }],
      choices: [{ text: "Continue.", goto: "hub" }]
    }
  }
},


c_menu: {
  title: "Menu Board",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "Above the serving hatch, a slate menu board in a fussy hand, framed in laminated red. TODAY'S NOURISHMENTS: Patriotic Pottage (cabbage, tolerated). Fraternal Loaf (rye, fraternal). Sausage-Adjacent Product (see Bureau of Meats). Joyful Gruel (served without comment). Tea (Aspirational). And at the bottom, underlined twice: UNITY PUDDING: SUSPENDED PENDING UNITY.",
      interjections: [
        { skill: "appetite", min: 2, text: "Tea! Gruel! Sausage-ADJACENT! I am so hungry and so deeply insulted." },
        { skill: "archive", min: 3, text: "The Ministry of Nourishment's 'Euphemism Directive', fourth edition: 'No ration shall be described as a ration. No shortage shall be described as a shortage. No pudding shall be described as present.' All observed." },
        { skill: "rhetoric", min: 3, text: "'Tolerated.' The cabbage is tolerated. What a magnificent adverb for a vegetable. Say it again. Say it with feeling." }
      ],
      choices: [
        { text: "Read the small print at the bottom.", goto: "print" },
        { text: "Ask: what is the Sausage-Adjacent Product, really?", goto: "sausage", cond: "!flag.menu_sausage" },
        { text: "[Compute the ration math.]", check: { skill: "rote", diff: 9, id: "c_menu_math", white: true, pass: "math_pass", fail: "math_fail" }, cond: "!flag.menu_math" },
        { text: "Leave.", end: true }
      ]
    },
    print: {
      speaker: "narrator",
      text: "In letters a quarter the size of the rest: *Dietary Pronouncements are subject to the weather of the State. The Management accepts no liability for hunger. Citizens are reminded that satiety is a mood, not a right. Complaints may be filed at the Bureau of Complaints, open Tuesdays, closed on days when open.* A tiny pencilled addendum in the margin reads: AND WHAT DAY IS TUESDAY?",
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "dialectics", min: 3, text: "A bureau open on days it is closed. A pudding suspended pending the thing it lacks. You have discovered the founding method of this state: the loop." },
        { skill: "doublethink", min: 3, text: "Satiety is a mood. How well put. Be in the mood. Everyone who is full is just in the mood." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    sausage: {
      speaker: "narrator",
      text: "You lean over the hatch and ask the shape of the Sausage-Adjacent Product. Bronka doesn't look up. 'It's a mixture,' she says. 'Mostly lung. Some bread. A tradition. If you ask what kind of lung, I'll ask what kind of boy.' A beat. 'The Bureau of Meats inspects it every other year. They haven't found anything. They didn't look.'\n\nShe spoons something grey into a tin, and the tin makes a faint, apologetic noise.",
      onEnter: [{ set: "menu_sausage", val: true }, { xp: 1 }],
      interjections: [
        { skill: "senses", min: 3, text: "Lung, bread, pepper, and a faint note of the box it came in." },
        { skill: "grit", min: 2, text: "You will eat it eventually. That's the whole principle of rations." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    math_pass: {
      speaker: "rote",
      text: "RATION ALLOWANCE: 480 G BREAD, 40 G FAT, 120 G CABBAGE, 6 G TEA. PER DAY, PER CITIZEN. COST TO THE STATE: 2.1 MARKS. COST TO THE CITIZEN: 3.4 MARKS. DIFFERENCE RETAINED BY THE BUREAU OF REASSURANCE: 1.3 MARKS. IN A SCHOOL OF 800 CHILDREN, 1,040 MARKS DAILY. IN A DISTRICT OF NINE SCHOOLS, 9,360. THE SUM FOR ONE YEAR IS THE PRICE OF A MINISTRY.\n\nTHE MENU DOES NOT LIE. THE MENU IS SIMPLY INCOMPLETE.",
      onEnter: [{ set: "menu_math", val: true }, { xp: 3 }, { thought: "th_ration_math" }],
      interjections: [
        { skill: "dialectics", min: 3, text: "Hence hunger is not a failure of the system. It is its profit margin. A beautiful, closed argument." },
        { skill: "empathy", min: 4, text: "Each of those missing grams has a mouth attached to it. You are looking at a thousand little silences a day." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    math_fail: {
      speaker: "narrator",
      text: "480 grams, 40 grams, 120... you lose the thread in the first division. The numbers on the board seem to swim together, each ration shrinking as you glance at it. Maybe it was always this small. Maybe you've simply never counted.\n\nYour stomach does the arithmetic instead. It comes out the same.",
      onEnter: [{ set: "menu_math", val: true }],
      choices: [{ text: "Continue.", goto: "look" }]
    }
  }
},

c_tray: {
  title: "Abandoned Tray",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "A grey tin tray sits on the end of the counter, forgotten or abandoned. Two bowls, two cups, two spoons, a heel of bread torn in half, the way two people split a loaf. One cup is cold and half empty. The other has not been touched. A slip of paper lies under the saucer: BREAKFAST FOR TWO, 05:40. The Commissar's signature is at the bottom.\n\nThe porridge has a skin on it. The skin has a thumbprint.",
      interjections: [
        { skill: "deduction", min: 3, text: "Breakfast for two at twenty to six. He ordered for two. He waited for a guest who did not come. Or came, and was interrupted, or declined." },
        { skill: "empathy", min: 3, text: "He ordered two cups of tea. An optimist. A lonely man's optimism, laid out on a tray." },
        { skill: "appetite", min: 3, text: "COLD PORRIDGE. COLD PORRIDGE WITH SUGAR. DON'T JUDGE ME." },
        { skill: "senses", min: 3, text: "The tea in the second cup is still faintly warm. Cold cup: left an hour ago. Warm cup: poured, never drunk, but someone stood near it." }
      ],
      choices: [
        { text: "Pick up the second spoon.", goto: "spoon", cond: "!has('bent_spoon')" },
        { text: "Eat the cold porridge.", goto: "porridge", cond: "!flag.tray_porridge" },
        { text: "Read the slip of paper.", goto: "slip", cond: "!flag.tray_slip" },
        { text: "Leave it.", end: true }
      ]
    },
    spoon: {
      speaker: "narrator",
      text: "The second spoon is wrong. It's bent sharply at the neck, almost at a right angle, and the bowl of it has been ground flat against something hard. A pale dusting of plaster has settled in the creases. This is not a spoon any more. It is a lever, a scraper, a tiny, clever crowbar for a job nobody should have to do with a spoon.\n\nIt is still faintly warm from someone's hand.",
      onEnter: [{ give: "bent_spoon" }, { xp: 2 }, { toast: "Received: Bent Spoon" }, { time: 2 }],
      interjections: [
        { skill: "deduction", min: 3, text: "Plaster dust. Flattened bowl. A bend at the neck made by prying. Someone used this on the wall of the gymnasium behind the portrait. One person did that before you. You wonder what the spoon found." , effects: [{ set: "spoon_plaster", val: true }] },
        { skill: "sleight", min: 3, text: "A bent spoon fits inside a cuff, or up a sleeve, or between the pages of a book. Every locksmith's apprentice begins with a spoon." },
        { skill: "archive", min: 4, text: "The Spoon, Item 3 of the Canteen Inventory, standard issue, stamped with the Bureau's mark. One per person, per tray. This one has been requisitioned for the revolution." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    porridge: {
      speaker: "narrator",
      text: "You eat a spoonful of the Commissar's cold porridge. It's grey, glutinous, sweet in an unconvincing way, and tastes of the sort of morning that has not yet decided whether to be grim. You feel absurd and guilty and, for the first time all day, nearly full. There is a faint grit at the bottom of the bowl: sugar, undissolved, a spoonful of kindness hidden under the boring part.",
      onEnter: [{ set: "tray_porridge", val: true }, { hp: 1 }, { thought: "th_hungry_ghost" }],
      interjections: [
        { skill: "appetite", min: 2, text: "We ate a dead man's porridge and it was DELICIOUS. This is the fundamental dishonesty of the body." },
        { skill: "volition", min: 4, text: "You are allowed to eat. You are allowed to be hungry in the face of a death. It does not make you a monster. It makes you seventeen." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    slip: {
      speaker: "narrator",
      text: "TO THE COOK: Breakfast for two at the usual place. If the second does not come, please do not take offence. He is probably very afraid of the dark. I will wait. - O.D. P.S. The bread was lovely. Please keep the notes in it. They help.\n\nThe last line has been smudged, as though a thumb had passed across it, or a tear.",
      onEnter: [{ set: "tray_slip", val: true }, { xp: 2 }, { note: "task_case", text: "Ostrov ordered breakfast for two at 05:40: a second person who didn't come. His note to the cook mentions 'the notes' in her bread." }],
      interjections: [
        { skill: "empathy", min: 3, text: "'He is probably very afraid of the dark.' He was writing about you. He was waiting for you. And you were already not yourself." },
        { skill: "instinct", min: 4, text: "'The usual place.' 'The second.' This is a man arranging a rendezvous in clean language, in a slip anyone could read. He was not careful. He was hopeful." },
        { skill: "solidarity", min: 3, text: "He thanked the cook for the notes. He knew. He took breakfast with the Undercurrent and said grace for it." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    }
  }
},

c_notices: {
  title: "Notice Board",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "A cork board the width of a barn door, so thick with paper that it has begun to grow its own geology. Notices overlap in strata: OFFICIAL, SEMI-OFFICIAL, PRESUMPTIVELY OFFICIAL, and one, near the bottom, in crayon, that says PLEASE. Over everything, a large printed warning: NOTICES MUST BE APPROVED. NOTICES MUST BE READ. NOTICES MUST NOT BE REMOVED, EXCEPT BY OTHER NOTICES.",
      interjections: [
        { skill: "archive", min: 2, text: "I could spend a month here. A month! Three hundred and four notices, forty-one duplicates, eleven which contradict each other, and one that contradicts the rest by being true." },
        { skill: "dialectics", min: 3, text: "A notice that may only be removed by another notice. The structure is a closed system. It can only grow. This is the entire theory of bureaucracy in a single sentence." },
        { skill: "doublethink", min: 3, text: "How reassuring to see so many instructions! Where there are instructions, there is order, and where there is order, there is love." }
      ],
      choices: [
        { text: "Read the Exam notice.", goto: "exam", cond: "!flag.notices_exam" },
        { text: "Read the Rules of Conduct.", goto: "rules", cond: "!flag.notices_rules" },
        { text: "Look under the notices.", goto: "under", cond: "!flag.notices_under" },
        { text: "Leave.", end: true }
      ]
    },
    exam: {
      speaker: "narrator",
      text: "ORTHODOXY EXAMINATION, 17:00, PRINCIPAL'S OFFICE. ALL SENIOR STUDENTS. BRING: One pencil (graphite, state-issue). One conscience (clean, folded). One parent (optional, preferably deceased). Failure shall result in 'Supplementary Instruction'. Success shall result in 'Congratulations'. Both outcomes shall be recorded.\n\nSomebody has circled 'preferably deceased' in red and written next to it: THIS IS A JOKE. THIS IS ALSO A POLICY.",
      onEnter: [{ set: "notices_exam", val: true }, { xp: 1 }, { task: "task_exam", state: "active" }],
      interjections: [
        { skill: "rote", min: 2, text: "THE ORTHODOXY EXAM: SEVEN QUESTIONS, ORAL. ANSWERS ARE EVALUATED FOR CORRECTNESS, FOR SINCERITY, AND FOR THE SPEED OF RECOVERY FROM EMBARRASSMENT." },
        { skill: "volition", min: 3, text: "Five o'clock. You have until then. Whatever else happens, you'll be sitting in front of the Principal at five with your hands folded and a clean face." },
        { skill: "composure", min: 3, text: "Prepare your face. Practice it. The exam is not about answers; it is about whether you flinch." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    rules: {
      speaker: "narrator",
      text: "RULES OF CONDUCT (Revised, Seventeenth Edition). 1. Be on time. 2. Be early only when late. 3. Do not run, except when summoned. 4. Do not walk, except when told to run. 5. Do not whisper. 6. If you must whisper, whisper loudly. 7. Do not remember what you were not supposed to see. 8. Remember what you were supposed to see. 9. See Rule 1.\n\nAn anonymous hand has added: 10. THEY ARE LISTENING TO RULES 1 THROUGH 9.",
      onEnter: [{ set: "notices_rules", val: true }, { xp: 1 }, { thought: "th_perfect_attendance" }],
      interjections: [
        { skill: "rhetoric", min: 3, text: "The only rule that matters is the tenth. It is also the one rule that is obeyed without being written." },
        { skill: "authority", min: 3, text: "RULES ARE FOR PEOPLE WHO DON'T KNOW WHICH ONES TO BREAK. YOU ARE LEARNING." },
        { skill: "dialectics", min: 3, text: "Rules 7 and 8 contradict. The student must forget and remember the same thing. This is the foundation of the curriculum: a double bind that produces obedient dizziness." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    under: {
      speaker: "narrator",
      text: "You lift a corner of the Rules of Conduct, then the next, and the next, until the board gives up and shows you what it has been covering for years. Layers of crumpled handbills, a dried flower, and at the very back, pinned straight into the cork with a bent hat-pin, a single sheet of lined paper. A hand-drawn map of the school's heating pipes, the boiler marked with a small cross. Beneath it, in the same fussy pencil, a line: CHEMISTRY ON SUNDAYS. ASK THE BREAD.",
      onEnter: [{ set: "notices_under", val: true }, { xp: 2 }, { note: "task_anka", text: "Behind the notice board: a map of the school's heating pipes, the boiler marked, and the words CHEMISTRY ON SUNDAYS. ASK THE BREAD." }],
      interjections: [
        { skill: "senses", min: 3, text: "Fresh pin-holes, a dozen. Someone updates this map weekly. The paper is still faintly warm from a hand." },
        { skill: "instinct", min: 3, text: "Someone made this for the right person to find. The wrong person would have taken it for plumbing." },
        { skill: "solidarity", min: 3, text: "Pipes and bread. The warm parts of the building. That is where we are." },
        { skill: "the_grey", min: 4, text: "Heating pipes carry heat to the bones of the school. They also carry rumours. Both arrive late." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    }
  }
},

c_speaker: {
  title: "Loudspeaker Pole",
  start: "look",
  nodes: {
    look: {
      speaker: "narrator",
      text: "A steel pole bolted to the Hall floor, rising three metres to a grey cone speaker the size of a washtub. The cone is protected by a mesh of wire like a bird-cage. A tag zip-tied to the pole reads RELAY 9 / BRANCH C. A small junction box is clamped halfway up, its door sealed with a lead tag.\n\nThe cone hums, so low it is almost a feeling. It is not playing anything. It is waiting.",
      interjections: [
        { skill: "doublethink", min: 2, text: "Good morning, citizen. It is a lovely morning. All is calm. All is well. Please enjoy your breakfast. We are so glad you are here." },
        { skill: "the_grey", min: 3, text: "I live in that cone at night. It's the only warm thing I've ever been given." },
        { skill: "senses", min: 3, text: "A hum, a pitch you know. A hair flat of E-flat. The same one your head has been singing." },
        { skill: "rote", min: 3, text: "LOUDSPEAKER, MODEL 9-C, 'THE VOICE OF THE UNION'. EIGHT-WATT, MOVING COIL. PUBLIC ADDRESS: AT 06:30 AND 18:30. THE HARMONY BROADCAST: 21:00 SHARP." }
      ],
      choices: [
        { text: "Stand under it and listen.", goto: "listen" },
        { text: "Examine the junction box.", goto: "box", cond: "!flag.speaker_box" },
        { text: "Leave.", end: true }
      ]
    },
    listen: {
      speaker: "narrator",
      text: ["With a click, the speaker clears its throat. A warm, reasonable, eternally patient voice: 'Attention, citizens. The time is eight-fourteen. The weather is as it should be. Please remember that vigilance is a form of love. Remember also that love is a form of vigilance. Have a pleasant day.' The cone gives a tiny sigh, and then silence.", "Static. A pause. Then a soft, bright female voice, evenly modulated: 'Citizens are reminded that the Orthodoxy Examination is at seventeen hundred hours. Citizens who forget are reminded that they have been reminded. Thank you for your cooperation.'", "'Attention. A friendly reminder that curfew is at twenty-one hundred. Please enjoy your evening in anticipation of the Harmony. Remember: a quiet citizen is a calm citizen. A calm citizen is a happy citizen. A happy citizen is, by definition, not a problem.'"],
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: "What a soothing voice. Don't you want to do what it says? Wouldn't you feel better? Just lie down. Surrender. Isn't it lovely to be told?", effects: [{ surv: -1 }] },
        { skill: "authority", min: 3, text: "IT BARKS IN WHISPERS. THAT IS A SKILL I ADMIRE AND DEPLORE." },
        { skill: "dialectics", min: 3, text: "'Vigilance is love; love is vigilance.' Identity. A is A, and A is surveillance. We have it on air." },
        { skill: "empathy", min: 4, text: "There is a human being on the end of that. A tired radio announcer reading text she hasn't been permitted to question. She has a family. She keeps her voice level." }
      ],
      choices: [
        { text: "Say 'Thank you, Warden.' (Obey.)", goto: "obey", effects: [{ surv: -3 }, { ideo: "vanguard", n: 1 }] },
        { text: "Hum the note back at it.", goto: "hum", cond: "!flag.speaker_hum" },
        { text: "Step away.", goto: "look" }
      ]
    },
    obey: {
      speaker: "narrator",
      text: "You speak the words quietly, and the cone drops half a tone, satisfied, as though a needle had been moved into the green. You feel a small warm glow somewhere under the ribs. It's the pleasure of having done as you were told, and it is unpleasant to find how real it is. You look at your hand; it has relaxed.\n\nNothing has been taken from you. That is the trick. The loss comes later, with interest.",
      onEnter: [{ set: "speaker_obeyed", val: true }, { xp: 0 }],
      interjections: [
        { skill: "doublethink", min: 3, text: "WELL DONE. Good citizen. Good child. It was easy, wasn't it? It is always this easy. Do it again later." },
        { skill: "volition", min: 4, text: "Notice the warmth. Notice that it was given to you for nothing. Nothing is given for nothing." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    hum: {
      speaker: "narrator",
      text: "You hum the tone, the one that lives in your skull. The speaker doesn't answer. But something inside the cone shifts, a slight loosening of the diaphragm, a faint reciprocal resonance, as though a very large and very patient creature had noticed that someone, somewhere, had said its name. For one moment, the wire mesh buzzes in time with your throat.\n\nThen it falls silent, and the hum goes on.",
      onEnter: [{ set: "speaker_hum", val: true }, { xp: 2 }, { surv: 3 }, { thought: "th_anthem_earworm" }],
      interjections: [
        { skill: "aim", min: 3, text: "Pitch within a comma of the cone's own. That's all aim ever was: a hit and then another." },
        { skill: "instinct", min: 3, text: "It heard you. Don't do it again here." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    box: {
      speaker: "narrator",
      text: "The junction box is a grey metal drawer sealed with a lead tag stamped with the Bureau's crest. A seal is a promise: nobody opens this. Behind the plate you can see, if you press your eye to the seam, a thick braided cable, labelled in stencil: TO MAIN. A knot of thin wires splays out of it, each stamped with a number, 1 through 9, one for each of the District's schools.",
      onEnter: [{ set: "speaker_box", val: true }, { time: 2 }],
      interjections: [
        { skill: "slip", min: 3, text: "The tag is lead, the wire is soft. Two seconds with a bent spoon, a clean thumb, and you'd be in and out and nobody the wiser." },
        { skill: "sleight", min: 3, text: "Lead seals are theatre. They are held on by trust, not by metal." }
      ],
      choices: [
        { text: "[Slip the seal and look inside.]", check: { skill: "slip", diff: 11, id: "c_speaker_box", white: false, pass: "box_pass", fail: "box_fail" } },
        { text: "Leave it.", goto: "look" }
      ]
    },
    box_pass: {
      speaker: "slip",
      text: "The seal comes away like a loosened tooth. Inside the box: nine pairs of wires, each tagged with a school number, all converging on a single braid labelled in stencil, MAIN: RELAY 9, FROM PRINCIPAL'S CELLAR. The braid is spliced at a point near the bottom with a small brass socket, a quarter-inch jack labelled, in a hand you now recognise as a fussy engineer's: STAGE MIC (PATCH). A line of pencil: IF YOU ARE READING THIS YOU ARE A PROBLEM. PLEASE USE THE JACK.\n\nYou replace the seal exactly as you found it, or very nearly.",
      onEnter: [{ set: "speaker_box_open", val: true }, { xp: 3 }, { surv: 3 }, { note: "task_broadcast", text: "Inside the loudspeaker junction box: the stage mic patch feeds directly into the main relay. A voice at the stage microphone will reach every speaker in the district." }],
      interjections: [
        { skill: "archive", min: 3, text: "Quarter-inch jack, TRS, standard. The mixing desk is in the Principal's cellar, but the patch is open to anyone with the plug. A pencilled instruction, from one conspirator to another. How terribly civil." },
        { skill: "rhetoric", min: 3, text: "Now THAT is a reachable audience." }
      ],
      choices: [{ text: "Continue.", goto: "look" }]
    },
    box_fail: {
      speaker: "narrator",
      text: "The seal snaps back against the box with a loud tick. You freeze. Somewhere, high in the Hall, the speaker gives a small and unmistakable click. The cone is still. But you have the clear, sick feeling of having been noticed by something that has no eyes.\n\nAcross the hall, Lemmy's pen has stopped moving.",
      onEnter: [{ set: "speaker_box", val: true }, { surv: 8 }, { morale: -1 }],
      choices: [{ text: "Back away.", goto: "look" }]
    }
  }
},


stage_mic: {
  title: "The Stage Microphone",
  start: [{ cond: "flag.broadcast_ready || (has('mic_cable') && flag.ilsabet_decoded && has('ledger'))", node: "ready" }, { node: "notready" }],
  nodes: {
    notready: {
      speaker: "narrator",
      text: "A chrome microphone on a weighted stand at the centre of the choir stage, the grille dented, the cable running down into a floor-box and, from there, into the dark. Painted on the stand in white: PROPERTY OF THE UNION. DO NOT ADDRESS. It is the plainest thing in the room. It is also the only object in the school that can reach every speaker at once.\n\nYou stand before it and feel the entire building leaning slightly in your direction.",
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "archive", min: 2, text: "Inventory of what is lacking. A broadcast requires three conditions: a working cable to the patch, a decoded tone to cancel the Bell, and the Ledger to read. Present status follows.", cond: "!flag.broadcast_ready" },
        { skill: "archive", min: 2, text: "Item one, the cable: MISSING. A new quarter-inch lead must be fetched. The Undercurrent has a spare. The planning table in the boiler room is the probable repository.", cond: "!has('mic_cable')" },
        { skill: "archive", min: 2, text: "Item two, the decoded tone: MISSING. Ilsabet Orrin must isolate the carrier. She requires a radio tube, and a listener with ears.", cond: "!flag.ilsabet_decoded" },
        { skill: "archive", min: 2, text: "Item three, the Ledger: MISSING. Retrieve it from wherever you hid it. The three notes will lead you there.", cond: "!has('ledger')" },
        { skill: "rhetoric", min: 3, text: "Even if you had all three, what would you say? Start composing. A speech is a gun that gets better the longer you load it." },
        { skill: "doublethink", min: 3, text: "It's only a microphone. Isn't it? A microphone is for sharing. The State loves sharing. Please share your thoughts after they have been reviewed." },
        { skill: "the_grey", min: 3, text: "Every wire in the building drains toward this stage, as water drains to the lowest room. I have felt it. A tide waiting for a hand to open the sluice." }
      ],
      choices: [
        { text: "Tap the microphone. (It thuds, unplugged.)", goto: "tap", cond: "!flag.stage_tapped" },
        { text: "Review what the plan needs.", goto: "needs" },
        { text: "Step away.", end: true }
      ]
    },
    tap: {
      speaker: "narrator",
      text: "You tap the mic with a knuckle. A dull thud, no echo, no hiss. It is dead as a spoon. In the quiet that follows you realise that you've been braced all this time for something to answer, and that the silence is somehow worse. The stage looks absurdly wide from here. It wants someone to stand on it; it has wanted that since the spring.",
      onEnter: [{ set: "stage_tapped", val: true }, { xp: 1 }],
      interjections: [
        { skill: "composure", min: 3, text: "Nothing happened. Fine. It would have been awkward in front of an audience. There isn't an audience yet." },
        { skill: "adrenaline", min: 3, text: "TAP IT AGAIN. TAP IT LOUDER. WHAT IF IT WAKES UP." }
      ],
      choices: [{ text: "Continue.", goto: "notready" }]
    },
    needs: {
      speaker: "narrator",
      text: "You count off what the plan still lacks, and it is as though the objects themselves lean in to hear. The cable first: a clean lead to bridge the mic and the patch. Then the tone: the Bell's carrier isolated so it can be answered, or cancelled, by a voice. And lastly the Ledger, the thing itself, the thing you hid, whose pages are the whole reason anyone should listen.\n\nIt is not a long list. It is a list that could get a person killed.",
      onEnter: [{ task: "task_broadcast", state: "active" }, { note: "task_broadcast", text: "To ring the Bell: a mic cable (boiler room planning table), the decoded Bell tone (Ilsabet), and the Ledger (the dead drop). Then the stage microphone." }],
      interjections: [
        { skill: "volition", min: 4, text: "Three things, three places. Nothing here is beyond one tired adult with a reasonable pair of shoes." },
        { skill: "solidarity", min: 3, text: "Not you alone. A cook, a girl with a radio, a man with a cracked voice. Three people with three things. That is the arithmetic of we." }
      ],
      choices: [{ text: "Step away.", end: true }]
    },
    ready: {
      speaker: "narrator",
      text: "You kneel at the floor-box and push the new lead into the jack. It seats with a soft, final click. The microphone, which has been a prop for six years, wakes. A faint hum rises from the base, a green pilot light blinks once in the dark of the stand, and through the grille you feel the warm breath of an open circuit. Down in the Principal's cellar, a needle trembles.\n\nThe Ration Hall is empty and enormous. In an hour, or three, it won't be.",
      onEnter: [{ time: 3 }, { sfx: "chime" }, { set: "broadcast_ready", val: true }],
      interjections: [
        { skill: "senses", min: 3, text: "Hot dust, solder, a tang of ozone. The cable is live. The patch has taken it." },
        { skill: "aim", min: 3, text: "The jack seated first time. You hit the hole like a dart finding the double twenty. I take no credit but I'd like to." },
        { skill: "instinct", min: 4, text: "It's on now. Anyone watching the cellar needle knows. You have minutes before the building starts to wonder." },
        { skill: "doublethink", min: 3, text: "Unplug it, friend. Quickly. Say you tripped. Say it was a mistake. There's still time to be a good student. There's always time until there isn't." }
      ],
      choices: [
        { text: "Step up to the microphone.", goto: "hall" },
        { text: "Not yet.", end: true }
      ]
    },
    hall: {
      speaker: "narrator",
      text: "They arrive, though you have called no one. Bronka stands in the kitchen doorway with flour on her forearms and her chin lifted like a ship's prow. Ilsabet rolls in from the aisle, the little set on her knee, a green eye winking. Lemmy hovers at the end of the table, white-faced, notebook closed. The pole-speaker in the corner hums, a long low drone, patient as a cow.\n\nSomewhere beyond the walls, the school is settling into the evening, unaware that a hand is on the switch.",
      onEnter: [{ time: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: "Every one of them is afraid, and every one of them came anyway. That is not courage. That is what courage looks like when it hasn't been named yet." },
        { skill: "solidarity", min: 3, text: "WE ARE HERE. We have been here the whole time. We just needed a stage." },
        { skill: "senses", min: 4, text: "Boots in the corridor, far off, many. Not coming yet. Gathering." }
      ],
      choices: [
        { text: "Vasha enters at the doors and takes her place.", goto: "vasha_stand", cond: "flag.vasha_ally" },
        { text: "Fenwick steps onto the podium and lifts his baton.", goto: "fenwick_stand", cond: "flag.fenwick_choir_ready" },
        { text: "Look at the microphone.", goto: "voices", cond: "!flag.vasha_ally && !flag.fenwick_choir_ready" },
        { text: "Not yet.", end: true }
      ]
    },
    vasha_stand: {
      speaker: "vasha",
      text: "She plants her bad knee in the doorway like a stake and unfolds her arms. 'Nobody comes in,' she says, to the Hall, to the corridor, to the wall. It's the parade-ground voice, the one she has not used since the Pass, and the room goes quiet with it. 'Nobody leaves. Nobody touches the dial. I'll hold the door until the Bell. After that, you're on your own.' She looks at you, and it isn't a salute, but it's close. 'Go on, kid. Say your piece.'\n\nShe turns to face the corridor, and doesn't look back.",
      onEnter: [{ set: "stage_vasha", val: true }, { morale: 1 }],
      interjections: [
        { skill: "authority", min: 3, text: "THAT IS HOW YOU HOLD A DOOR. THAT IS HOW A PERSON DOES IT WHEN THEY MEAN IT." },
        { skill: "empathy", min: 3, text: "She's shaking. She's holding it still with her whole body. Be worth it." }
      ],
      choices: [
        { text: "Fenwick steps onto the podium and lifts his baton.", goto: "fenwick_stand", cond: "flag.fenwick_choir_ready" },
        { text: "Look at the microphone.", goto: "voices", cond: "!flag.fenwick_choir_ready" }
      ]
    },
    fenwick_stand: {
      speaker: "fenwick",
      text: "He mounts the podium slowly, taking his time, as a man does who has waited six years for this step. Behind him on the risers, forty children in dark blazers file into their places in absolute silence: they have come, one by one, from the corridor, from the dormitory, from the kitchen. Their faces are white and set. In his hand the baton trembles, then holds.\n\n'Whenever you are ready,' says Fenwick Alder, in his cracked voice, quietly. 'We will, ah, we will follow you. We will have the first five verses by heart. And the, ah, the sixth, we shall make up.'",
      onEnter: [{ set: "stage_choir", val: true }, { morale: 2 }],
      interjections: [
        { skill: "solidarity", min: 2, text: "Forty lanterns. All of us. All, all, all." },
        { skill: "adrenaline", min: 3, text: "THE CHOIR! THE CHOIR HAS COME! THE CHOIR IS READY TO DO A TERRIBLE, BEAUTIFUL THING!" },
        { skill: "volition", min: 4, text: "Take a breath. These are children. You are about to ask them for something dangerous. You must be worth it." }
      ],
      choices: [{ text: "Look at the microphone.", goto: "voices" }]
    },
    voices: {
      speaker: "narrator",
      text: "You step up. The microphone is cold. The Hall holds its breath. And inside your head the whole committee rises, a hundred conflicting counsels from every part of you, all at once, each vying for the last word before the first.",
      onEnter: [{ time: 1 }],
      interjections: [
        { skill: "volition", min: 1, text: "Breathe. Slowly. You are a person with a voice, and you are about to use it." },
        { skill: "rhetoric", min: 1, text: "Oh, this is IT. The argument of a lifetime. Don't ruin it with a joke in the first sentence. ... Unless it's a very good joke." },
        { skill: "dialectics", min: 1, text: "Premise: the Bell erases. Premise: you are about to un-erase. Conclusion: the machine will have to argue with itself. I couldn't have designed it better." },
        { skill: "doublethink", min: 1, text: "Please. Friend. Please don't. We were so close to being happy." },
        { skill: "rote", min: 1, text: "ARTICLE ONE: THE CITIZEN SHALL NOT ADDRESS THE UNION UNBIDDEN. ARTICLE TWO: SEE ARTICLE ONE. ARTICLE THREE... I'm sorry, I've nothing for this. I've never been outside the Code." },
        { skill: "empathy", min: 1, text: "Look at their faces. They're children. They're all afraid. Say it for them." },
        { skill: "solidarity", min: 1, text: "We are with you. Every word. Every breath. Every cracked, human syllable." },
        { skill: "authority", min: 1, text: "SPEAK LOUD ENOUGH FOR THE BACK ROW. SPEAK LOUD ENOUGH FOR THE CELLAR." },
        { skill: "instinct", min: 1, text: "Now. It has to be now. The hall will not be this quiet again." },
        { skill: "the_grey", min: 1, text: "I will carry it to every wall. I am concrete; I am everywhere. Say it, and the building will remember it for a century." },
        { skill: "composure", min: 1, text: "Stand straight. Hands still. If they are going to hear a frightened voice, let it at least be a dignified one." },
        { skill: "archive", min: 1, text: "For the record, this is the first unscheduled address from the Ration Hall stage in the history of the school. Someone should date it." },
        { skill: "adrenaline", min: 1, text: "GO GO GO GO GO GO GO." },
        { skill: "grit", min: 1, text: "It will hurt. It will hurt a lot afterwards. Say it anyway." },
        { skill: "deduction", min: 1, text: "Everything you've learned today has led to this room. Lay it out, one clue at a time, and let them draw the conclusion themselves." },
        { skill: "appetite", min: 1, text: "Afterwards, we'll have tea. Whatever happens. I'm promising you tea." },
        { skill: "charm", min: 1, text: "Smile first. Even a frightened smile. They'll forgive you the content if you give them the smile." },
        { skill: "slip", min: 1, text: "The side door is unbolted. I checked. I always check. I'm not saying you'll need it." },
        { skill: "sleight", min: 1, text: "The Ledger is under your jacket, pressed flat against your ribs. Your hands know where to find it." },
        { skill: "reflex", min: 1, text: "If anything falls, I've got it. If anything flies at your head, I've got that too." },
        { skill: "aim", min: 1, text: "One sentence. Straight into the middle of the room. Don't flinch and don't miss." },
        { skill: "senses", min: 1, text: "Dust in the light. A candle-end smell. A whisper of rosin on strings. Remember this. You'll want it later." },
        { skill: "brawn", min: 1, text: "Whatever comes through the door, I'll be heavy about it." },
        { skill: "stamina", min: 1, text: "You've got the lungs for it. You always did." }
      ],
      choices: [{ text: "Decide how to begin.", goto: "words" }, { text: "Step back. Not yet.", end: true }]
    },
    words: {
      speaker: "narrator",
      text: "You have the Ledger. You have the tone. You have a circle of faces and a long wire running to every speaker in the district. But you only have one first sentence, and it will be the one they remember. What kind of voice will you give them?",
      choices: [
        { text: "Read the Ledger aloud, entry by entry, plain as a train timetable.", goto: "w_ledger" },
        { text: "Tell them what happened to you, and what you remember of last night.", goto: "w_story" },
        { text: "Let Fenwick's choir begin, and speak over the song.", goto: "w_song", cond: "flag.fenwick_choir_ready" },
        { text: "Step back. Not yet.", end: true }
      ]
    },
    w_ledger: {
      speaker: "archive",
      text: "The Ledger opens in your hands to a page of Ostrov's tidy, desperate columns. Date, hour, relay, effect. Tuesday, 00:40, three hours. Wednesday, 01:10, three. Thursday, 02:00, four. A column of losses, each one a night, each one a boy or girl, a woman, a man: a year's worth of evenings, forgotten on schedule. It is not a speech. It is something much worse: it is an audit.\n\nYou will read it as I have always wished to read anything: slowly, without adjectives, and in order.",
      onEnter: [{ set: "stage_style", val: "ledger" }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "dialectics", min: 3, text: "Facts, marshalled in sequence, with no appeal to emotion. They can't argue with a column of numbers except by lying. And then everyone will know which of them is lying." },
        { skill: "rote", min: 4, text: "I HAVE THEM ALL, EVERY ENTRY, I HAVE ALWAYS HAD THEM, I JUST NEVER KNEW THEY WERE DATA." }
      ],
      choices: [{ text: "Begin.", goto: "final_check" }]
    },
    w_story: {
      speaker: "empathy",
      text: "You won't read. You will say it, the way you'd say it to one person on a bad night: I woke up on a stage this morning with chalk on my hands and a hole where yesterday should be. And then I found out I'm not the only one. Everybody in this building has a hole, a smooth green wall. Do you remember last Tuesday? Do you remember the one before? Don't you think that's strange?\n\nThere is no armour in it. That is its whole strength.",
      onEnter: [{ set: "stage_style", val: "story" }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "charm", min: 3, text: "Begin with the stage and the chalk. Make them smile before you make them wince." },
        { skill: "volition", min: 4, text: "Don't cry before the second sentence. Cry after. Cry when it's done." },
        { skill: "solidarity", min: 3, text: "Everyone is waiting for someone to say it is them too. Say it is us." }
      ],
      choices: [{ text: "Begin.", goto: "final_check" }]
    },
    w_song: {
      speaker: "fenwick",
      text: "'We shall, ah, begin,' he whispers. His baton rises. The children breathe in together. And forty small, pure, unrehearsed voices rise out of the risers, wavering, scared, a little flat, singing the Lantern Song: Light a lantern in the hall, light another for the wall. It's the most beautiful sound the room has held in six years, and it is going out to every speaker in the district.\n\nYou lean to the mic, under the song, and begin to speak. The words come easier than you thought.",
      onEnter: [{ set: "stage_style", val: "song" }, { ideo: "undercurrent", n: 2 }, { morale: 2 }, { sfx: "chime" }],
      interjections: [
        { skill: "solidarity", min: 2, text: "Oh. Oh, there we are. There we ARE." },
        { skill: "empathy", min: 3, text: "Fenwick is crying. He's conducting with tears running down his chin. His voice is cracked, and it is the best voice in the room." },
        { skill: "the_grey", min: 3, text: "I've heard that tune. In the walls. In the mortar. It sings through me every night, and tonight, for once, it's being allowed out." }
      ],
      choices: [{ text: "Begin.", goto: "final_check" }]
    },
    final_check: {
      speaker: "narrator",
      text: "The pilot light glows steady green. The needle in the cellar must be shaking. You inhale, and the whole Hall inhales with you. Here is the threshold, the last small step between the person you were this morning and whoever you'll be after.\n\nThe first word is yours.",
      choices: [
        { text: "[Make them believe it.]", check: { skill: "rhetoric", diff: 12, id: "stage_mic_final_rhetoric", white: false, pass: "go", fail: "stammer", passEffects: [{ set: "stage_clear", val: true }, { xp: 4 }] } },
        { text: "Step back. Not yet.", end: true }
      ]
    },
    stammer: {
      speaker: "narrator",
      text: "The first word comes out wrong: a thin croak, a tiny, ugly crack. It carries to every speaker in the district. You hear your own voice come back from the pole, from the rafters, from the dormitory down the corridor, small and shaking. For a long second no one moves. Somewhere very far off, a door slams.\n\nYou know what this is. You can keep going, or you can break. Nobody will blame you for either.",
      onEnter: [{ morale: -2 }, { sfx: "static" }],
      interjections: [
        { skill: "volition", min: 2, text: "Get up. Get up. It is a sentence. You have said thousands. Say the next one. I'm here. I've always been here." },
        { skill: "doublethink", min: 3, text: "See? It isn't meant to be. Turn it off. Say you're sorry. You'll be forgiven. Nobody needs to know how far you went." },
        { skill: "composure", min: 3, text: "Shoulders. Chin. Pretend that was a pause for effect." }
      ],
      choices: [
        { text: "[Hold yourself together. Go on.]", check: { skill: "volition", diff: 11, id: "stage_mic_final_volition", white: false, pass: "go", fail: "go_ragged", passEffects: [{ set: "stage_clear", val: true }, { xp: 3 }] } },
        { text: "Say it anyway, however it comes out.", goto: "go_ragged" }
      ]
    },
    go: {
      speaker: "narrator",
      text: "It comes out whole. Your voice goes out through the cable, through the cellar's patch, through nine schools of wire and a hundred thousand square metres of the Greater Union, clear and level and entirely unexpected. 'Good evening. This is not the Harmony Broadcast. Please do not stand. Please do not sing. Please just listen.'\n\nIn the pole-speaker, the hum stops. For the first time in fourteen years, the Hall hears a human voice in a place where a voice was never supposed to be.",
      onEnter: [{ task: "task_broadcast", state: "done" }, { sfx: "static" }, { surv: 25 }, { set: "stage_went_out", val: true }],
      interjections: [
        { skill: "rhetoric", min: 2, text: "THAT is how it's done. 'Please just listen.' Magnificent. Do not stop." },
        { skill: "authority", min: 3, text: "THE UNION IS LISTENING TO A BOY. EVERY SPEAKER. EVERY ROOM. I HAVE NEVER BEEN PROUDER AND I HAVE NEVER BEEN MORE AFRAID." },
        { skill: "adrenaline", min: 2, text: "WE'RE ON THE AIR WE'RE ON THE AIR WE'RE ON THE AIR" }
      ],
      choices: [{ text: "Keep speaking.", goto: "go2" }]
    },
    go_ragged: {
      speaker: "narrator",
      text: "It comes out ragged: a quavering, half-swallowed thing, the voice of someone who hasn't slept in two days and has run out of words in the middle of the sentence. But it goes out. Through the cable, the patch, the cellar, the district, all of it. 'This is not the Harmony. I'm sorry. I'm not very good at this. But listen, please, just listen.'\n\nPerhaps that is better. Nobody has ever been frightened of a boy who sounded like that. They will listen precisely because it is so clearly unprepared.",
      onEnter: [{ task: "task_broadcast", state: "done" }, { sfx: "static" }, { surv: 25 }, { set: "stage_went_out", val: true }, { set: "stage_ragged", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: "They hear a person. That is the entire revolution. A person, in a voice, being afraid out loud." },
        { skill: "grit", min: 3, text: "You're bleeding a little, inside. Keep going. The sentence doesn't care. The sentence just needs saying." }
      ],
      choices: [{ text: "Keep speaking.", goto: "go2" }]
    },
    go2: {
      speaker: "narrator",
      text: "You speak. You say what you know and what you carried and who gave it to you. You say the Commissar's name. You say the number of hours that have been taken from the district by a hymn. And all across Tarnov-on-the-Grey, in kitchens and dormitories and cold stairwells, people who have never heard each other turn their faces to the same grey cones in the wall, and listen.\n\nA hundred thousand pairs of hands stop what they are doing. Somewhere a kettle boils over and nobody moves.",
      interjections: [
        { skill: "solidarity", min: 3, text: "We hear you. We hear you. We hear you. Say it again." },
        { skill: "the_grey", min: 3, text: "Every wall in the District is turning a quarter-inch toward the sound. Concrete is slow, but it is certain." },
        { skill: "archive", min: 4, text: "For the record: 21:04. Nine schools. One address. Duration: unprecedented." },
        { skill: "dialectics", min: 3, text: "To deny what you've said they would need to deny their own memory. And their memory, at the moment, is the one thing they cannot be certain of. What a beautiful reversal." }
      ],
      choices: [{ text: "Continue.", goto: "go3" }]
    },
    go3: {
      speaker: "narrator",
      text: "Then the footsteps. Far off at first, heavy, regular, many. The Vanguard's boots, the Principal's guard, the District's men in their dark coats. The Hall's heavy doors begin to shake. A voice from the corridor shouts for someone to stop the transmission, and another voice, calmer, says that the relay cannot be cut without the cellar key. Down in the dark, a needle is quivering at the end of its scale.\n\nThey are coming. They are coming for the microphone, and for you.",
      onEnter: [{ time: 5 }, { sfx: "door" }],
      interjections: [
        { skill: "reflex", min: 3, text: "Left side door. Four steps. Two seconds. If you need it." },
        { skill: "instinct", min: 3, text: "Three minutes. Four if the guards are slow. Say the important thing now." },
        { skill: "slip", min: 3, text: "The kitchen door. Then the cellar stairs. Then the coal chute. I've walked it twice already. I walk everything twice." }
      ],
      choices: [
        { text: "Hold the door with Vasha.", goto: "go4_vasha", cond: "flag.stage_vasha" },
        { text: "Keep speaking. Let them come.", goto: "go4" }
      ]
    },
    go4_vasha: {
      speaker: "vasha",
      text: "She plants her feet against the heavy doors, and the first impact comes, and she does not move. 'Keep going,' she says, through her teeth. 'I have the door. I have the whole bloody door.' Her bad knee is shaking. She doesn't look back. 'You can tell them I saluted. Tell them I did it right.'\n\nThe second impact is harder. The third is the sound of a body being used as a bolt. She is laughing, or sobbing, or both. It's the happiest you've ever seen her.",
      onEnter: [{ hp: -1 }, { set: "stage_vasha_held", val: true }],
      interjections: [
        { skill: "empathy", min: 3, text: "She has found at last what she was holding the door for." },
        { skill: "solidarity", min: 2, text: "Hold, Lieutenant. We're holding with you." }
      ],
      choices: [{ text: "Continue.", goto: "go4" }]
    },
    go4: {
      speaker: "narrator",
      text: "You lean in and give them the last of it. Not an order; not a plea. Just the one true thing you know. 'They took last night from you. They took the night before. They'll take tonight, if you let them. Tomorrow morning, when you wake, remember this: you were here, and you heard this, and you were not alone.'\n\nBehind you, the choir, or the children, or the Hall itself, draws breath. The pilot light burns steadily green. Whatever comes through those doors, it will find the school awake.",
      onEnter: [{ set: "stage_last_words", val: true }, { xp: 3 }],
      interjections: [
        { skill: "solidarity", min: 2, text: "We will remember. We swear it. We, we, we." },
        { skill: "volition", min: 3, text: "You did it. Whatever happens now, you did it, and that is a thing nobody can take. Not even the Bell." },
        { skill: "doublethink", min: 3, text: "..." }
      ],
      choices: [
        { text: "Let the choir take up the song.", goto: "go5", cond: "flag.stage_choir" },
        { text: "Say nothing more. Let the silence ring.", goto: "go5" }
      ]
    },
    go5: {
      speaker: "narrator",
      text: ["The song begins in the risers. A child's voice, then ten, then forty: light a lantern in the hall. It ripples out through the cables into the district, to the pole-speakers, the kitchens, the dormitory stairs, and a thousand voices that do not know the words pick up the tune anyway, one hum at a time. The doors burst open. Boots flood into the Hall. And over it all, rising like heat, the school is singing a song it was never taught.", "The silence goes out into the district, and the district does something it has never done: it listens back. In the Hall, in the dormitories, in a thousand cold kitchens, the wires carry only breath. Then, from somewhere very far away, a single voice begins to hum. Then another. The doors burst open. Boots flood into the Hall. And the sound that meets them is the sound of a country quietly clearing its throat."],
      onEnter: [{ sfx: "chime" }, { morale: 3 }],
      interjections: [
        { skill: "the_grey", min: 2, text: "Do you hear it? That is the weather changing." },
        { skill: "solidarity", min: 1, text: "We." }
      ],
      choices: [{ text: "Let it ring.", goto: "finale" }]
    },
    finale: {
      speaker: "narrator",
      text: "A hand closes on your shoulder, not gently. Another takes the cable. The pilot light flickers, stutters, and goes out. But the sound doesn't stop: it has already gone into the wires, the walls, the sleeping ears of the district. The Bell tonight will ring into an audience that has begun to remember. You turn, and see the faces of the people who have come to take you. They are children, mostly. They are crying too.\n\nThe curfew bell sounds. For the first time in fourteen years, nobody forgets it.",
      onEnter: [{ set: "end_static_ready", val: true }],
      choices: [
        { text: "Go with them.", end: true, effects: [{ ending: "end_static" }] }
      ]
    }
  }
},

};

})();
