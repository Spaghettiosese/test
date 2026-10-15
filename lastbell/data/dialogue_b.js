(function(){ const GD = (window.GD = window.GD || {});

GD.dialoguesB = {

// ===================== ENTER_COURTYARD =====================
enter_courtyard: {
  title: "The Courtyard",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The Ration Hall door sighs shut behind you and the weather finds you at once. The Courtyard is a square of wet cobbles the colour of old pennies, ringed by brick on three sides and a fence on the fourth, beyond which the district goes on being grey without your help. Two loudspeakers on poles lean toward each other like gossips. In the middle, sunk in its own plinth, the Statue of the Warden's Father holds one hand out flat, as if testing for rain, or for tribute.\n\nSomeone has swept the leaves into obedient piles. Someone else is standing in the one dry spot, watching you do your looking.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `Welcome back. You do not remember, but I do. You were here in the dark with something heavy against your ribs. I rained on you then too. It was nothing personal. It is never personal. That is the whole beauty of me.` },
        { skill: "senses", min: 4, text: `Wet stone, boiler smoke from somewhere under your feet, floor polish, and the metallic ghost of a school bell nobody has rung since the Decree. Also: a little chalk dust on the statue's plinth, at about knee height. Fresh? Fresh enough to wonder.` },
        { skill: "archive", min: 3, text: `The Statue of Aurel Voss, the Warden's Father, unveiled in the Year of Steady Hands. Plinth: poured concrete, faced in granite veneer. Dimensions on the plaque are, you notice, wrong by eleven centimetres. Somebody has been correcting the numbers upward ever since.` }
      ],
      choices: [
        { text: `Look the square over properly.`, goto: "b" },
        { text: `Stand there like a person with nowhere to be.`, goto: "c" }
      ]
    },
    b: {
      speaker: "narrator",
      text: `A park bench by the east wall, a dead tree in a pot, the old school bell hung from a bracket in the north-west corner where the fence meets the brick. A staircase drops from the south-east corner into the earth, behind a door someone has painted the same green as despair. To the north, two doors: the one you came from, and a brass-handled one marked PRINCIPAL. Near the statue a caretaker in overalls is sweeping nothing with great concentration. Near the east wall, a girl in a red-brown Vanguard uniform has not moved since you arrived, which is itself a way of moving.`,
      interjections: [
        { skill: "instinct", min: 4, text: `The girl by the wall. Do not look at her for longer than you would look at a wall. She is watching you the way a cat watches a bird it has not yet decided to be hungry for.`, effects: [{ set: "courtyard_rhea_sensed", val: true }] },
        { skill: "empathy", min: 3, text: `The caretaker is sweeping because it is easier than being a man who has seen something. His broom is doing the talking of someone who would rather not.` }
      ],
      choices: [
        { text: `Walk on. (Leave.)`, end: true },
        { text: `Look at the plinth of the statue more carefully.`, goto: "c" }
      ]
    },
    c: {
      speaker: "the_grey",
      text: `I hold up the Warden's Father. Not the statue: the idea of him. The statue is only the bit with the nose. I am what lies under it: the ground it sank into, the slow mass of concrete and wet and forgetting. Come closer to it. Put a hand on the cold. Does it ring? Concrete only rings when it is hollow, and nothing in this country is ever hollow by accident.`,
      onEnter: [{ thought: "th_closed_window" }, { xp: 1 }],
      choices: [
        { text: `Knock on the plinth, lightly.`, goto: "d" },
        { text: `Not yet. Leave it.`, end: true }
      ]
    },
    d: {
      speaker: "narrator",
      text: `You knock with one knuckle, the way you would on a door you suspect belongs to a sleeping person. The sound that comes back is smaller than it should be. A cavity, then, behind the granite skin, with something in it that swallows the echo. You are not sure how you know that. Your ears have been ringing since you were six; you have always been better than most at hearing what is under a sound.\n\nAcross the cobbles, the sweeping stops.`,
      onEnter: [{ set: "courtyard_plinth_hollow", val: true }, { note: "task_ledger", text: `The plinth of the Warden's Father sounds hollow. Something is hidden in it, or was. I will need a way in.` }, { sfx: "hit" }],
      choices: [
        { text: `Pretend you did nothing.`, end: true }
      ]
    }
  }
},

// ===================== ENTER_OFFICE =====================
enter_office: {
  title: "The Principal's Office",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `Green. Green walls, green blotter, green glass in the lamp, a green carpet the exact tone of a hospital's apology. A framed Warden looks down from the north wall with the expression of a man who has just remembered where he left the matches. The desk is large enough to land an aircraft on; behind it, a small woman in a pearl-grey suit is sorting paper into piles that look identical to you and are clearly, to her, a moral system.\n\nShe does not look up. She says, to the paper, "Close the door gently. It has been through enough."`,
      interjections: [
        { skill: "composure", min: 3, text: `Shoulders back. Hands visible. Face: the face of a student who has never done anything and would be shocked to be accused of it. You rehearsed this face in the mirror every school morning of your life.` },
        { skill: "doublethink", min: 3, text: `Isn't this nice? An office is the heart of a school. Here things are made right. Here a child can feel safe, because the grown-ups are watching. Look how neat the piles are. Neatness is love. Say it.` },
        { skill: "archive", min: 4, text: `Principal Odalys Marr. Appointed in the Year of Steady Hands. Eleven commendations, nine of them for "Exemplary Quiet". Her predecessor retired to a sanatorium for "nerves". His portrait was removed from the staff corridor so neatly that nobody has ever noticed the clean rectangle.` }
      ],
      choices: [
        { text: `Close the door gently.`, goto: "b" }
      ]
    },
    b: {
      speaker: "marr",
      text: `"Thank you." She finishes a pile. "I have been told you are assisting Lieutenant Kell. How delightful for the Lieutenant. The Youth Commissar's passing has upset the staff, and an upset staff makes unsteady children. We shall want to be steady by this evening."\n\nShe looks up at last. Her eyes are pale, polite and entirely finished with you already. "At five o'clock you will sit your Orthodoxy Examination, here, with me. It is the only appointment in this building that matters. Everything else is weather."`,
      onEnter: [{ task: "task_exam", state: "active" }, { note: "task_exam", text: `Principal Marr: Orthodoxy Examination, her office, 17:00 sharp. "Everything else is weather."` }],
      interjections: [
        { skill: "authority", min: 4, text: `She is small, and the room has been furnished to make you smaller. Do not fall for it. Stand like the floor is yours. (The floor is not yours. Stand anyway.)` },
        { skill: "instinct", min: 3, text: `She said "passing". Not "suicide", not "death". "Passing", like a bus. She has already begun smoothing the story, and you are one of the creases.` }
      ],
      choices: [
        { text: `"I'll be here at five, Principal."`, goto: "c", effects: [{ surv: -2 }] },
        { text: `"What exactly is on the Examination?"`, goto: "d" },
        { text: `Say nothing. Hold her gaze.`, goto: "e" }
      ]
    },
    c: {
      speaker: "marr",
      text: `"Punctuality. It is so rarely a gift from the young." She makes a small tick in a ledger the size of a hymnal. "You may use the office to speak with me if you have anything you wish to confess. Confession is encouraged. I find that it pays dividends before five o'clock and almost none afterward."\n\nShe returns to her piles. You have been dismissed in the way weather is dismissed: by being ignored until it stops.`,
      choices: [{ text: `Leave quietly.`, end: true }, { text: `Speak with her now.`, dialogue: "marr" }]
    },
    d: {
      speaker: "marr",
      text: `"Oh, nothing alarming. A recital. A few questions on first principles. The written paper is brief; the oral is more of a conversation." She smiles, and the smile arrives a moment after the rest of her face, like thunder. "Students who prepare tend to do very well. Students who do not prepare tend to do very well also, because they learn quickly. It is the middle students who suffer. The ones who think."\n\nShe taps the green blotter. "Do not think too hard before five. It leaves marks."`,
      interjections: [
        { skill: "rote", min: 3, text: `Rehearse: THE WARDEN HEARS. ONE BELL, ONE UNION. THE QUIET CHILD IS THE LOVED CHILD. A STEADY HAND BUILDS A STEADY HOUSE. You know all of them. You know them the way you know your own teeth: no need to be grateful, but you'd miss them.` }
      ],
      choices: [{ text: `Leave. Think carefully about not thinking.`, end: true }, { text: `Speak with her now.`, dialogue: "marr" }]
    },
    e: {
      speaker: "narrator",
      text: `The silence lengthens until you can hear the lamp humming. Principal Marr lets it grow, lets it become a third party in the room. At the end of a long, specific time she smiles again, with the first and last warmth you will see from her all day.\n\n"Good," she says. "A child who can be quiet in my office can be quiet anywhere. We will get along. Five o'clock."`,
      onEnter: [{ ideo: "quiet", n: 1 }, { xp: 1 }, { surv: 2 }],
      choices: [{ text: `Leave.`, end: true }]
    }
  }
},

// ===================== ENTER_BOILER =====================
enter_boiler: {
  title: "Under the School",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The stairs go down further than the building seems to allow. By the time you reach the bottom your eyes have forgotten daylight and the heat has found your collar. It is a long low hall of rust and brick, pipes sweating overhead in rows like the ribs of a patient animal. In the middle a boiler the size of a small church mutters to itself in a low and reasonable voice, a voice that has been right about everything for forty years and been ignored for thirty-nine.\n\nOn a rug, around a table, unsanctioned chairs sit in an unsanctioned circle. Somebody has been drinking tea in them very recently.`,
      interjections: [
        { skill: "senses", min: 3, text: `Tea. Pipe smoke. Hot lead, chalk, and a fainter trace you have no word for, because the Union does not issue words for it: the smell of people agreeing quietly.` },
        { skill: "solidarity", min: 3, text: `Oh, we are glad. Look at these chairs. Twelve of them, none matching, all pulled in tight. Somebody sat here and was listened to. We could be like that again. We could sit down in a circle and be a people.` },
        { skill: "slip", min: 4, text: `Exits: the stairs, and a ladder in the north corner leading up into the dark of the courtyard's drainage. Whoever uses this room has planned for being surprised.` }
      ],
      choices: [
        { text: `Step further in.`, goto: "b" }
      ]
    },
    b: {
      speaker: "anka",
      text: `"Close the door behind you. No, gently. It sticks. The Warden hears a great deal, but he does not hear through six feet of foundations, and I should like to keep it that way."\n\nA small figure in a lab coat the colour of old piano keys lowers a book. White hair in a bun, glasses with one cracked lens, a cigarette that has been lit so long it has become part of her hand. She looks at you with a long, level, maternal weariness, the look of someone who recognises an arrival and wishes, honestly, that it were not you.\n\n"Ah. They sent a child. Of course they did. Sit, if you can bear to."`,
      onEnter: [{ task: "task_anka", state: "active" }, { note: "task_anka", text: `The boiler room has a woman in a lab coat who knows who I am. "Mother Anka", they call her. She says they sent a child.` }],
      interjections: [
        { skill: "empathy", min: 4, text: `Under the dryness, a grief with good manners. She has said "they sent a child" before, to others, and buried some of them.` },
        { skill: "volition", min: 3, text: `This is the place. You know it without knowing it. Do not run. Do not gush. Take the chair; do not behave like a person who has been hunting for this door all day.` }
      ],
      choices: [
        { text: `Sit down.`, goto: "c" },
        { text: `Stay standing. You don't yet trust a woman who offers chairs.`, goto: "d", effects: [{ xp: 1 }] }
      ]
    },
    c: {
      speaker: "narrator",
      text: `The chair is kinder than it looks. Mother Anka pours a tea into a glass without being asked and slides it over. "Drink. I have no sugar. I have a very good opinion of you, which is all I can offer on the matter of sweetening." She watches you sip. "You don't remember me, do you. Of course not. They took last night out of you like a bad tooth."`,
      onEnter: [{ morale: 1 }],
      choices: [{ text: `"Who are you?"`, dialogue: "anka" }, { text: `Not yet. Go back up.`, end: true }]
    },
    d: {
      speaker: "narrator",
      text: `Mother Anka watches you stand, and something in her face approves. "Good instincts. Keep them. Most of the ones who sat straight down are not around to sit anywhere." She pours two glasses of tea anyway, sets one at the empty chair, and leaves it to cool beside your mistrust. "When you are ready."`,
      choices: [{ text: `Speak with her.`, dialogue: "anka" }, { text: `Go back up.`, end: true }]
    }
  }
},

// ===================== OSK =====================
osk: {
  title: "Janitor Osk",
  start: [
    { cond: "flag.osk_scapegoat", node: "after_frame" },
    { cond: "talked('osk') > 0", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: {
      speaker: "narrator",
      text: `The caretaker leans on his broom the way other men lean on a wall: as a structural decision. He is about sixty, wide as a doorframe, with a bald head like a pale river stone and hands that have been in contact with every bad smell the school has ever had. On his overalls is a faded badge: LONG SERVICE, 30 YEARS. Underneath, someone has scratched, with a pin, 31.\n\nHe sees you, and the broom stops. His eyes do a quick small thing, like a man checking his pockets for something he is afraid he's lost.`,
      interjections: [
        { skill: "empathy", min: 3, text: `He is afraid of you. Not for what you are. For what you remember. People get that look when they have seen something and are praying you were not looking back.` },
        { skill: "archive", min: 4, text: `Osk Brannic. Caretaker, School No. 9, since the Year of the Long Frost. Twice commended for stove maintenance. Once reprimanded for "unauthorised singing". The reprimand is, remarkably, still in the file; nobody has ever been brave enough to throw it out.` }
      ],
      choices: [
        { text: `"Good morning. I think you know me."`, goto: "greet" },
        { text: `"You were staring."`, goto: "stare" },
        { text: `Walk away. You are not ready for this man.`, end: true }
      ]
    },
    greet: {
      speaker: "osk",
      text: `"Know you? Everybody knows you, {name}. You are the one who is always quiet. Which is a compliment." He rubs the back of his neck. "Cold today. Colder than reported. The forecast said mild. The forecast is a patriot, and I am a janitor, and one of us has to deal with the pipes."\n\nHe offers a rueful, crooked smile that looks like it hasn't had much exercise this week. "I sweep leaves. I am not a man with opinions. I only say this because people in your position tend to ask."`,
      choices: [{ text: `"What do you think of the Commissar?"`, goto: "hub" }, { text: `Let it lie. Walk on.`, end: true }]
    },
    stare: {
      speaker: "osk",
      text: `"Staring? Me?" He lifts the broom a little, as evidence of innocence. "I was only watching the weather coming in. It comes in from there, you see. If you watch where it comes from you can predict where it will leave a puddle. I have spent thirty-one years watching puddles. They are the only honest thing in the building." A pause. "You look unwell. Bit pale. Like a man who has been up all night."\n\nHe says "all night" the way you say a name you have promised not to mention.`,
      interjections: [
        { skill: "instinct", min: 4, text: `"All night." He chose that. Not "late". He knows exactly how long you were up and he's not going to say it out loud unless you make him.` }
      ],
      choices: [{ text: `"What do you know about last night?"`, goto: "hub" }, { text: `Leave it. For now.`, end: true }]
    },
    hub: {
      speaker: "osk",
      text: `Osk sets the broom aside. It's the first time you've seen him let go of it. His hands don't know what to do; they find each other and settle. "Ask, then. I'm only a janitor. But I've swept every floor of this school and when you sweep a floor you learn what's on it. That is not gossip. That is professional dust."`,
      choices: [
        { text: `"Did you see me last night?"`, goto: "seen", cond: "!flag.osk_seen_you" },
        { text: `"What do you know about the Commissar's death?"`, goto: "ostrov" },
        { text: `"The statue. What's under it?"`, goto: "statue", cond: "flag.courtyard_plinth_hollow || flag.osk_seen_you" },
        { text: `"Was anybody else in the gym that night?"`, goto: "rhea_ask", cond: "flag.osk_seen_you && !flag.osk_saw_rhea" },
        { text: `Offer him a cigarette.`, goto: "smoke", cond: "has('cigarettes') && !flag.osk_smoked", once: true },
        { text: `"Osk, they want a name for the Commissar's death."`, goto: "name", cond: "flag.osk_seen_you && !flag.osk_offer_made" },
        { text: `"I'll go."`, end: true }
      ]
    },
    seen: {
      speaker: "osk",
      text: `He looks at the cobbles. He looks at the sky. He looks, at last, at you. "Ten past two. I was doing the stove in the Hall. I heard the gym door and I thought, rats, or Vanguard, and I do not know which is worse. And it was you. Out of the side door, the fire door, with your jacket buttoned wrong and something long wrapped in a flag held tight against your chest like a baby. You didn't see me. You walked like a man in a church.\n\nI went back to the stove. I did not see you. I want that understood."`,
      onEnter: [{ set: "osk_seen_you", val: true }, { task: "task_osk", state: "active" }, { task: "task_yesterday", state: "active" }, { note: "task_osk", text: `Osk saw me leave the gym at 02:10, side door, something wrapped in a flag. He says he didn't. He is afraid, and he is the easiest man in the building to blame.` }, { note: "task_yesterday", text: `02:10, leaving the gym by the fire door with something wrapped in a flag. (Osk.) Where did I take it?` }, { xp: 2 }],
      interjections: [
        { skill: "deduction", min: 4, text: `Something long, wrapped in cloth, carried like a baby, from the gym toward the Courtyard at ten past two. You didn't take it to your dormitory. The dormitory is in the other direction. You hid it. Where in this school can a long object disappear in a minute and a half?` },
        { skill: "the_grey", min: 4, text: `The statue. I'm only saying: the statue is the nearest thing to the fire door that has an inside.` }
      ],
      choices: [{ text: `"Thank you, Osk."`, goto: "hub" }, { text: `"Who else knows that?"`, goto: "who_else" }]
    },
    who_else: {
      speaker: "osk",
      text: `"Nobody. I haven't said a word. I've said less than a word. I have said a half-word to a stove." He glances toward the Principal's window; it is green and blank and entirely too interested. "But I have had thirty-one years of being the person who might have seen something, {name}. I know how this goes. It starts with 'who saw?' and it ends with 'who did?' and the man in the middle is always the one with the broom."`,
      interjections: [
        { skill: "empathy", min: 4, text: `He is not asking you to protect him. He is telling you the shape of what he expects. He thinks of himself as a pipe the school will, sooner or later, route its waste through.` }
      ],
      choices: [{ text: `"I won't forget you said it."`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }, { text: `"Keep it that way."`, goto: "hub", effects: [{ surv: 2 }] }]
    },
    ostrov: {
      speaker: "osk",
      text: `"The Commissar." He says it quietly, wiping a clean hand on a clean thigh. "He was a decent man for a Commissar, which is a low bar, and he cleared it. He used to bring me tea. Real tea. He said 'Osk, you are the only person in this school who does honest work.' I said 'Sir, I mop floors.' He said 'Exactly.'\n\nHe was never unstable. I want that written down somewhere. He had insomnia. He liked to walk. He lost his temper twice in four years, and both times at an inanimate object." A breath. "A man like that does not hang himself from a hoop. He hasn't the arms for the climb."`,
      onEnter: [{ set: "osk_doubts_suicide", val: true }],
      interjections: [
        { skill: "deduction", min: 5, text: `Osk's measurements are correct. Ostrov was small, soft-handed, a desk man. The hoop is three metres up. To tie a rope there you need a ladder or a fit teenager or a second pair of hands. Add that to your list.`, effects: [{ xp: 1 }], once: true },
        { skill: "doublethink", min: 3, text: `A janitor's grief is not evidence. A janitor's opinion is not a finding. The official verdict is on its way; it has its coat on and everything. Why raise questions we will have to answer?` }
      ],
      choices: [{ text: `"Who would want him dead?"`, goto: "who" }, { text: `Back.`, goto: "hub" }]
    },
    who: {
      speaker: "osk",
      text: `"Ask the Vanguard. Ask anyone in a red-brown coat. The Commissar and the Youth Vanguard have been, how shall I put it, geese in the same pond for a year. He kept their enforcer on a leash. And the leash..." He glances at the girl by the east wall, then at the stove-black on his own fingers, and says no more. "I clean floors. I do not name. Floors do not name. If they did, this school would have been sealed years ago."`,
      onEnter: [{ set: "osk_pointed_vanguard", val: true }],
      choices: [{ text: `"Rhea Vantage?"`, goto: "rhea_ask", cond: "!flag.osk_saw_rhea" }, { text: `Back.`, goto: "hub" }]
    },
    rhea_ask: {
      speaker: "osk",
      text: `He is silent so long that you start to think he's gone elsewhere inside himself. "Half past one," he says finally. "Not the gym door. The big doors. Boots, three pairs. Rhea in front, in that coat. Two others behind carrying a thing I thought was a rolled mat. I did not go and see. I went and put coal on the stove with great care, and I kept my back to the window." He wipes his mouth. "That is all I have. Do not make it more. Do not make it less."`,
      onEnter: [{ set: "osk_saw_rhea", val: true }, { xp: 2 }, { note: "task_case", text: `Osk: Rhea Vantage and two Vanguards entered the gym by the big doors at 01:30, carrying a rolled "mat". He didn't look. He heard.` }],
      interjections: [
        { skill: "deduction", min: 4, text: `Rolled mat. Staged rope. Three pairs of boots. The Commissar didn't hang himself; he was carried, and the mat was the thing they carried him in.`, effects: [{ set: "knows_rhea", val: true }] },
        { skill: "authority", min: 4, text: `This man will not testify. No one can ask that of him. If you want Rhea, you will have to find the rest of the evidence elsewhere, and spare the janitor.` }
      ],
      choices: [{ text: `"Thank you. I won't use your name."`, goto: "hub", effects: [{ ideo: "undercurrent", n: 1 }] }, { text: `"You'd say that to Lieutenant Kell?"`, goto: "threat" }]
    },
    threat: {
      speaker: "osk",
      text: `"To the Lieutenant?" His mouth works. "To anyone with a coat and a stamp? I'd say I saw nothing, and I'd say it so well you'd think I invented it. {name}, I am not a brave man. I am a man who knows exactly what I am. That is rarer than courage and a good deal less admired."\n\nHe picks the broom up again. The conversation, for him, has ended.`,
      onEnter: [{ surv: 3 }],
      choices: [{ text: `Leave him be.`, end: true }]
    },
    statue: {
      speaker: "osk",
      text: `"The old man? Polished him for thirty-one years. Do you know he's hollow? The plinth, I mean. Sounds like a drum. Built over the old coal chute when they raised him, to save on granite. They said it wouldn't matter, nobody would ever need to look inside.\n\nThere's a seam at the back, low down, where the veneer was patched with the wrong mortar. If you press the third stone from the left. But I never told you that. I never told anyone. I only mention it as a matter of cleaning."`,
      onEnter: [{ set: "osk_hint_plinth", val: true }, { xp: 1 }, { note: "task_ledger", text: `Osk: the plinth is hollow, built over an old coal chute. There's a seam at the back, third stone from the left.` }],
      choices: [{ text: `"You are a good man, Osk."`, goto: "hub", effects: [{ morale: 1 }] }, { text: `Back.`, goto: "hub" }]
    },
    smoke: {
      speaker: "osk",
      text: `He takes the cigarette like it is made of glass, turns it to look at the brand, and puts it behind his ear for later. "Commissar's. Kell's. Somebody's. I know the paper." He smiles, then stops, because the smile surprised him. "You are kind, {name}. It is a dangerous habit in a year like this one."\n\nHe begins, unprompted, to talk. About a canary in the boiler room, twenty years ago. About the winter the school pipes froze and they all slept in the gym. About his wife, who died the year of the Decree. You listen. It is the longest conversation he has had in months.`,
      onEnter: [{ take: "cigarettes" }, { set: "osk_smoked", val: true }, { xp: 2 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }],
      interjections: [
        { skill: "appetite", min: 3, text: `That was our last good cigarette! But look at his face. Look at it. Sometimes you trade a smoke for a man. Tell me that isn't the best price you've been quoted all week.` }
      ],
      choices: [{ text: `Listen a little more.`, goto: "hub" }]
    },
    name: {
      speaker: "osk",
      text: `The sweeping resumes in his shoulders before it resumes in his hands. "A name." He nods. "Of course they do. There's always a gap on the form. The form has a gap, and they look around for something to put in it, and what's closest is a man with a broom." He sets the handle down against the statue, gently, and folds his hands.\n\n"If it has to be me, it's me. I'm sixty-one. My wife's dead. I don't have a great deal on the wrong side of the scales. Take my name, {name}. Put it in the gap. Maybe the rest of you can have your day in peace."`,
      onEnter: [{ set: "osk_offer_made", val: true }],
      interjections: [
        { skill: "doublethink", min: 4, text: `It is the best of all possible outcomes. A volunteer. A sad old man who wants to help. No coercion. No trouble. The Union loves a willing sacrifice; it makes the paperwork so much cleaner. Accept, and be a good citizen.`, effects: [{ surv: -2 }] },
        { skill: "solidarity", min: 4, text: `No. NO. We do not feed our own into the machine, however kindly they hold out the plate. We are the ones he mopped the floors for. Say no.` },
        { skill: "volition", min: 4, text: `There is a version of you that takes this offer and sleeps fine. Do you want to meet him?` }
      ],
      choices: [
        { text: `"No. Absolutely not. I'm not going to use you."`, goto: "refuse", effects: [{ ideo: "undercurrent", n: 2 }, { xp: 2 }] },
        { text: `"If it comes to it... would you really do it?"`, goto: "accept", effects: [{ ideo: "vanguard", n: 1 }] },
        { text: `"I don't know yet. Don't do anything."`, goto: "hub" }
      ]
    },
    refuse: {
      speaker: "osk",
      text: `Osk lets out a small breath, as if he had been holding it since the Decree. "Well." He picks up the broom, then finds he doesn't know what to do with it, then sweeps one leaf, deliberately, to give his hands a task. "That's the first time anyone has declined me in a long while. It's rather pleasant. I recommend it."\n\nHe nods once, formally, like a man closing a ledger. "My door is the stove room, back of the Hall. It's warm. I don't ask. I simply am."`,
      onEnter: [{ task: "task_osk", state: "done" }, { note: "task_osk", text: `I told Osk no. I will not offer him up. His alibi is simply that I refuse to say he did it.` }, { thought: "th_wheel_and_chair" }],
      choices: [{ text: `Nod, and go.`, end: true }]
    },
    accept: {
      speaker: "osk",
      text: `"Would I?" He considers it fairly, as he considers all things. "I would sweat. I would not be good at it. I would say what you told me to say, and I would do it in a loud clear voice, because I have never trusted a quiet confession. They'd believe me. That is the sad part. They are so eager to believe a man who will tell them what they want."\n\nHe looks away. "Just remember I offered. That's all I want out of it. Somebody remember I offered."`,
      onEnter: [{ set: "osk_volunteered", val: true }, { note: "task_osk", text: `Osk offered to take the blame. If I wanted, I could use that. I hate that I thought about it.` }],
      interjections: [
        { skill: "empathy", min: 3, text: `You are a person who has just asked a sixty-one-year-old man whether he would hang for you. Sit with that for as long as you can bear it.` }
      ],
      choices: [{ text: `"Forget I asked."`, goto: "hub", effects: [{ morale: -1 }] }, { text: `Say nothing. Walk away.`, end: true }]
    },
    after_frame: {
      speaker: "osk",
      text: `Osk is not sweeping. He is sitting on the lip of the plinth with his hands between his knees, staring at the cobbles as if they might finally answer. He does not look up when you stop beside him.\n\n"They came for me at noon," he says. "Very polite. A young man with a clipboard. They said, 'Osk Brannic, you have been identified.' I said, 'As what?' He said, 'As the man who was there.' I suppose I was. I was always there. That is what a janitor is."\n\nHe wipes his eyes with the back of a hand that never learned to wipe anything gently.`,
      interjections: [
        { skill: "empathy", min: 2, text: `Look at what you did. Just look.` },
        { skill: "volition", min: 3, text: `You can do nothing about this now. Say so to yourself. Then do whatever you do with the feeling of having said it.` }
      ],
      choices: [{ text: `"I'm sorry."`, goto: "sorry" }, { text: `Walk away.`, end: true }]
    },
    sorry: {
      speaker: "osk",
      text: `"Don't be. You were told to find someone and you found someone. That's all a school ever does." He nearly laughs. "Thirty-one years of sweeping up after children and I'm finally what they've been learning to make. I'm the finished lesson, {name}. Go on. Eat your supper. You've a certificate to collect."`,
      choices: [{ text: `Leave him there.`, end: true }]
    }
  }
},

// ===================== RHEA =====================
rhea: {
  title: "Rhea Vantage",
  start: [
    { cond: "flag.rhea_exposed", node: "after_exposed" },
    { cond: "flag.rhea_confronted", node: "hub" },
    { cond: "talked('rhea') > 0", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: {
      speaker: "narrator",
      text: `She has the posture of a girl who was told once, by someone she loved, to stand up straight, and has never since slouched. Seventeen, like you, in the red-brown of the Youth Vanguard, the uniform ironed to a razor-edge, the armband squared on the bicep with the care of a surgeon. Dark hair slicked back as if by a ruler. Her eyes are very calm and very bright. She is, objectively, beautiful in the way a perfectly kept knife is beautiful.\n\n"{name}," she says, as if reading your name off a certificate. "I wondered when you'd come out. You look dreadful. Come stand where it's dry."`,
      interjections: [
        { skill: "instinct", min: 3, text: `Every muscle in this girl's body is relaxed. That is the problem. Nobody this relaxed has ever been innocent in a way that mattered.` },
        { skill: "charm", min: 4, text: `And she's lovely, isn't she? You could be her friend. Many people have been, for a little while. There's a flattery in being chosen by someone who chooses so rarely.` },
        { skill: "archive", min: 3, text: `Rhea Vantage. Youth Vanguard, Enforcer-Rank (Junior). Orphan of the Hunger Winter, fostered by the District. Perfect attendance for eleven years. Never once late, never once ill. You find the second fact more disturbing than the first.` }
      ],
      choices: [
        { text: `Step under the dry spot. "Rhea."`, goto: "hub", effects: [{ surv: 1 }] },
        { text: `Stay out in the rain. "I'm fine here."`, goto: "rain" },
        { text: `Walk away.`, end: true }
      ]
    },
    rain: {
      speaker: "rhea",
      text: `"Suit yourself." She smiles with one side of her mouth, and the smile is not unkind. "People who refuse the dry spot usually have a reason. Principle, or fear. Which are you?" She lets the question hang in the weather. "It's all right. I only ask because I prefer to know what a person is made of before I stand next to them. It saves so much time later."\n\nShe steps out of the shelter to stand in the rain with you, without any apparent discomfort, and the effect is of having been out-gestured.`,
      interjections: [{ skill: "composure", min: 4, text: `Don't flinch. She wants to see if you flinch. Whatever she says next, let your face be a plank.` }],
      choices: [{ text: `Carry on.`, goto: "hub" }]
    },
    hub: {
      speaker: "rhea",
      text: `Rhea Vantage adjusts the armband, which didn't need it. "Ask me what you came to ask. I have a few minutes before the afternoon drill, and I would like to be useful. The Commissar's death has hurt us all. I'm told you're helping Lieutenant Kell. That's very modern of the Lieutenant. Delegating to the young."\n\nHer voice is flat, polite, a little amused. It does not move when she says "death".`,
      choices: [
        { text: `"What do you think happened to the Commissar?"`, goto: "ostrov" },
        { text: `"Where were you last night?"`, goto: "night" },
        { text: `"What does the Vanguard want out of today?"`, goto: "creed" },
        { text: `Try to charm her.`, check: { skill: "charm", diff: 11, id: "rhea_charm", white: true, pass: "charm_pass", fail: "charm_fail" } },
        { text: `Study her face. What's behind it?`, check: { skill: "empathy", diff: 12, id: "rhea_read", pass: "read_pass", fail: "read_fail" } },
        { text: `"I think we both know someone has to be blamed."`, goto: "offer", cond: "flag.osk_seen_you && !flag.rhea_deal && !flag.rhea_deal_refused" },
        { text: `"I know it was you."`, goto: "confront", cond: "flag.knows_rhea || has('rhea_pin') || flag.clue_rope" },
        { text: `"Goodbye, Rhea."`, end: true }
      ]
    },
    ostrov: {
      speaker: "rhea",
      text: `"A tragedy." She says it carefully, like a word she has been issued. "Commissar Dane had been under strain. He took the Warden's work personally, which is a fault in a man who should have learned to take it professionally. He stopped sleeping. He started saying things." A brief pause, almost tender. "I was fond of him. Very fond. He was a good teacher of what not to become."\n\nShe looks across the Courtyard at the Principal's door. "It will all be tidy by evening. Everything is, in the end."`,
      interjections: [
        { skill: "senses", min: 4, text: `Her left hand: nails clipped square, one knuckle freshly split and closed with a thin line of skin-glue. A new scar on an old habit. Something hit something, last night, and it was neither of them hurt.` , effects: [{ set: "rhea_knuckle", val: true }] },
        { skill: "deduction", min: 5, text: `"Started saying things." She's volunteered the motive before you asked for it. People who explain the dead man's state of mind before you've asked how he died have been rehearsing.`, once: true }
      ],
      choices: [{ text: `"What things?"`, goto: "things" }, { text: `Back.`, goto: "hub" }]
    },
    things: {
      speaker: "rhea",
      text: `"Oh, the usual disorders. That the Bell was a hoax. That the portraits listened. That the District was keeping a ledger of what we forget." She laughs lightly. "You'd have laughed too. In another man it would have been amusing. But he held a rank, and a rank is a promise. A man can't hold rank and also hold a conspiracy theory. It's like trying to carry a flag and a bomb. One of them is going to go off."\n\nShe says it in the tone of a kind older sister who has had to be firm with a younger one.`,
      onEnter: [{ set: "rhea_said_ledger", val: true }, { xp: 1 }],
      interjections: [
        { skill: "rote", min: 4, text: `Wait. "A ledger of what we forget." Nobody told the Vanguard about a ledger. How does she know the word?`, effects: [{ set: "knows_rhea", val: true }, { note: "task_case", text: `Rhea said "the District was keeping a ledger of what we forget." A Vanguard girl should not know the word "ledger". Ostrov never said it in public. So who told her?` }] },
        { skill: "the_grey", min: 5, text: `That's a joke the dead man told only to someone he trusted. Or a joke that was told to him by someone who was about to kill him.` }
      ],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    night: {
      speaker: "rhea",
      text: `"Out of dormitory after the Bell, you mean? Obviously not. The Bell is when we sleep. We always sleep. Eleven years, perfect record. If you want my timetable, ask the duty monitor; the monitor was Lemmy, so you may ask him whether he can count to three." She smiles. "I was in my bed from twenty-two hundred to six, like a good citizen. Sleep is a form of loyalty."\n\nThere is a small, almost invisible beat between "bed" and "six". A hesitation made of fine glass.`,
      interjections: [
        { skill: "authority", min: 5, text: `She told you the whole story without a single question mark. She doesn't hope you believe it. She expects you to. Take that expectation and hold it until it cracks.` },
        { skill: "instinct", min: 4, text: `Her story has the smoothness of a stone at the bottom of a river. It's been handled by water a long time. It wasn't made up today.` }
      ],
      choices: [{ text: `"Funny. Osk says he saw the Vanguard in the gym at half past one."`, goto: "osk_lie", cond: "flag.osk_saw_rhea" }, { text: `"Thank you, Rhea."`, goto: "hub" }]
    },
    osk_lie: {
      speaker: "rhea",
      text: `Her expression doesn't change. That's what makes the room go cold. "Osk," she says gently, as a nurse says the name of a patient who is going to be a problem. "Poor old Osk. He sees many things. He saw a ghost in the boiler room last winter and wrote a report on it. I'd be careful, {name}, about trusting the testimony of a man whose chief qualification is a broom."\n\nShe tilts her head. "And I'd be careful about repeating what he says. He's old. Old men get tired. Old men sometimes fall down stairs."`,
      onEnter: [{ surv: 4 }, { set: "rhea_threatened_osk", val: true }],
      interjections: [
        { skill: "empathy", min: 4, text: `She just put the janitor on the chessboard. She did it so she could see whether you would protect him. You haven't answered yet. Everything you say next, she will remember.` }
      ],
      choices: [{ text: `"Nobody said anything about Osk."`, goto: "hub", effects: [{ xp: 1 }] }, { text: `"If Osk falls, I'll know who pushed."`, goto: "confront", cond: "flag.knows_rhea || has('rhea_pin') || flag.clue_rope", effects: [{ surv: 3 }] }]
    },
    creed: {
      speaker: "rhea",
      text: `"What does the Vanguard want?" She looks surprised to be asked. "Peace. That's all. Do you know what the Hunger Winter was? You were small. I was seven. I remember the whole street eating the glue off the wallpaper. The District came with soup, and a flag, and a rule: tomorrow will be the same as today. And it was. For the first time in my life, tomorrow was the same as today." She breathes in. "People call us harsh. We're only the walls of a house that someone, finally, built."`,
      interjections: [
        { skill: "empathy", min: 3, text: `Under the sermon there's a girl of seven licking glue off a wall. This is not hypocrisy. This is gratitude, which is worse. Gratitude can't be argued with. It can only be broken.` },
        { skill: "rhetoric", min: 4, text: `Oh, but there are so many holes in that! The Hunger Winter was the year of the Great Requisitions. The soup was made from grain the District had taken from the same street. Say it. Say it right now. You'd win the argument. You'd lose the girl.` },
        { skill: "solidarity", min: 3, text: `We know what she means about the soup. We all remember the soup. That is the hook, isn't it. They fed us once and we've been paying in silence ever since.` }
      ],
      choices: [
        { text: `"The soup was made from our own grain, Rhea."`, check: { skill: "rhetoric", diff: 12, id: "rhea_grain", pass: "grain_pass", fail: "grain_fail" } },
        { text: `"I'm glad someone fed you."`, goto: "hub", effects: [{ ideo: "vanguard", n: 1 }, { xp: 1 }] },
        { text: `Back.`, goto: "hub" }
      ]
    },
    grain_pass: {
      speaker: "rhea",
      text: `For one second the mask comes off, and it is a child's face, caught at a fact it has half-known for ten years. "Don't," she says. Her voice is small and strange. Then it hardens, like something poured. "That is a counter-revolutionary line, {name}. You may have been trained to say it. You may even believe it. But I have lived inside the alternative and I will not go back."\n\nShe is not angry. She is frightened. It is the first truth she's told you.`,
      onEnter: [{ xp: 2 }, { surv: 3 }, { set: "rhea_doubt_seen", val: true }],
      choices: [{ text: `Let it rest.`, goto: "hub" }]
    },
    grain_fail: {
      speaker: "rhea",
      text: `"A common error." She does not blink. "It was also a common error of the people who, afterward, did not live to correct it. You have the history of a student and the opinions of a pamphlet. Sit with the book a little longer, {name}." She says it kindly, and files you under the heading of a person to keep an eye on.`,
      onEnter: [{ surv: 5 }],
      choices: [{ text: `Retreat.`, goto: "hub" }]
    },
    charm_pass: {
      speaker: "rhea",
      text: `You make her laugh. It's an odd, unrehearsed laugh, a scrap of something she keeps in a locked drawer. For a minute you are two girls, or a girl and a boy, or two sixteen-year-olds who have never been friends, leaning toward each other under the same sad umbrella of sky.\n\n"You're good at that," she says. "You're not supposed to be. You're the quiet one. I like you. That's inconvenient." And then, lightly, as if telling a harmless secret: "I would never have left the rope like that, if I'd had more time. It's the little things that give a person away."`,
      onEnter: [{ set: "rhea_slip", val: true }, { set: "knows_rhea", val: true }, { xp: 3 }, { note: "task_case", text: `Rhea, laughing: "I would never have left the rope like that, if I'd had more time." That is a slip, not a confession. But I heard it.` }, { task: "task_rhea", state: "active" }],
      interjections: [{ skill: "instinct", min: 4, text: `She didn't mean to say it. She'll realise in about four seconds. Be a plank.` }],
      choices: [{ text: `Smile, and say nothing at all.`, goto: "hub" }]
    },
    charm_fail: {
      speaker: "rhea",
      text: `Your joke lands on the cobbles and lies there. She regards it with polite interest, as a person regards a dropped coin, and does not pick it up.\n\n"You're trying to be liked." She isn't cruel about it. "Don't. I don't have a use for it. Be useful or be quiet. Both are respectable."`,
      onEnter: [{ morale: -1 }],
      choices: [{ text: `Take the hit.`, goto: "hub" }]
    },
    read_pass: {
      speaker: "empathy",
      text: `You look past the armband and the starch and the ruled hair, and for one clear moment you see what is there. A girl who has been taught that the world ends at the edge of her duty. A girl who is very, very tired. Someone who has not slept properly in a year because the thing she believes in needs guarding at night.\n\nShe is not a villain. She is a loyal person who has been handed a job nobody should be handed, and she has never been permitted to put it down. That does not make her less dangerous. It makes her more.`,
      onEnter: [{ xp: 2 }, { set: "rhea_read", val: true }, { thought: "th_perfect_attendance" }],
      choices: [{ text: `Hold that in your mind.`, goto: "hub" }]
    },
    read_fail: {
      speaker: "empathy",
      text: `Nothing. A pleasant, well-made face, like a door that has been painted over so many times that the hinges are no longer visible. If there is a person behind it, you cannot find the handle.\n\nShe watches you look, and her mouth moves very slightly, as though to say: yes, go on. It's quite all right to fail.`,
      onEnter: [{ surv: 2 }],
      choices: [{ text: `Look away.`, goto: "hub" }]
    },
    offer: {
      speaker: "rhea",
      text: `"Yes," says Rhea Vantage. She says it softly, with real sympathy, the way you say yes to a friend who has finally mentioned the thing they've both been avoiding. "Marr will want a name by five. I've seen the form. It has a little gap in it. The Lieutenant would like a suicide. The Principal would like a loyal student with a clean sleeve. And the District would like, I think, a janitor who talks in his sleep."\n\nShe lowers her voice. "Do it quickly, and I'll see your name gets to the right desk. A Vanguard badge. Warden's Commendation. A future, {name}. I can arrange it. All you have to do is say what you saw."`,
      interjections: [
        { skill: "doublethink", min: 3, text: `She's offering you the thing you've wanted since you were nine: to be inside the wall rather than outside it. It's a lovely wall. It has such nice windows. Say yes.` },
        { skill: "volition", min: 4, text: `You know what this is. You've known since she lowered her voice. Say it to yourself without a euphemism. Then decide.` },
        { skill: "empathy", min: 4, text: `Notice: she is offering to help you frame the man whom she herself framed. The kindness is real. That's what is horrifying.` }
      ],
      choices: [
        { text: `"What would I have to do?"`, goto: "deal", effects: [{ surv: -3 }, { ideo: "vanguard", n: 1 }] },
        { text: `"No. I'm not going to hand you a janitor."`, goto: "deal_refuse", effects: [{ set: "rhea_deal_refused", val: true }, { ideo: "undercurrent", n: 1 }] },
        { text: `"I'll think about it."`, goto: "hub" }
      ]
    },
    deal: {
      speaker: "rhea",
      text: `"Say Osk was seen leaving the gym at ten past two. He was. You can verify it; I'm told he's been walking the gym corridor every night for thirty years. Say you saw him with the rope. He keeps rope in the shed. Say he'd been drinking. Say he'd been angry. Say the Commissar had threatened to report him for pilfering, which, honestly, he had.\n\nThen you go to Lieutenant Kell and the Principal, and you stand very straight, and you say it with your whole face. And I will stand next to you." She holds out a hand. It is warm, dry, and entirely unshaken. "We could be good at this together."`,
      onEnter: [{ set: "rhea_deal", val: true }, { note: "task_osk", text: `Rhea has offered me a way out: name Osk as the man who hanged the Commissar. Vanguard badge, clean sleeve, and nobody ever finds out what was in the gym. I haven't said yes. I haven't said no.` }],
      choices: [
        { text: `Take her hand. (This is the path to the Good Student ending.)`, goto: "shake", effects: [{ ideo: "vanguard", n: 2 }, { surv: -5 }] },
        { text: `Don't take it. "Not yet."`, goto: "hub" }
      ]
    },
    shake: {
      speaker: "narrator",
      text: `Her palm closes on yours. It is a good handshake: confident, dry, brief. You feel the exact moment at which it becomes a contract. Rhea smiles, a radiant, genuine, relieved smile, and for a moment you are very nearly happy.\n\n"Wise," she says. "Come to the Principal's office at five. I'll be waiting. Say as little as you can. The rest is already written."\n\nShe walks away across the cobbles, bright against the grey, with the walk of someone who has just been proven right.`,
      onEnter: [{ set: "rhea_allied", val: true }, { xp: 1 }],
      choices: [{ text: `Watch her go.`, end: true }]
    },
    deal_refuse: {
      speaker: "rhea",
      text: `For a moment the girl and the officer look at one another from behind her face. Then something is put away. "That's a pity," Rhea says. "I'd have liked to like you. I do like you. It's such a waste to have to be careful of people one likes."\n\nShe lifts her chin. "Whatever you do, {name}, do it before the Bell. After the Bell I won't have to be careful of you at all."`,
      onEnter: [{ surv: 5 }, { xp: 2 }],
      choices: [{ text: `Hold her gaze. Then go.`, end: true }]
    },
    confront: {
      speaker: "narrator",
      text: `You say it plainly and the Courtyard changes shape. The loudspeakers lean closer. The caretaker's broom stops. Somewhere a pigeon rethinks its plans. Rhea Vantage stands very still, in the way a spring stands still.\n\n"I'm sorry?" she says, with great courtesy. "I think you may have misspoken." Her right hand, the one with the split knuckle, flexes once at her side. The Vanguard are trained for many things. They are trained for this.`,
      onEnter: [{ set: "rhea_confronted", val: true }, { surv: 8 }, { task: "task_rhea", state: "active" }],
      interjections: [
        { skill: "adrenaline", min: 3, text: `THERE IT IS! Here we go! Hit first! Hit her in the mouth and let the truth sort itself out! No? No. Fine. But keep your weight on the balls of your feet, would you?` },
        { skill: "reflex", min: 4, text: `Her stance has shifted a quarter-turn. Weight on the rear foot. Right hand loose. She's fast, and she's about to be faster.` }
      ],
      choices: [
        { text: `Show her the Vanguard pin. "This was on the mat."`, goto: "pin", cond: "has('rhea_pin')" },
        { text: `"The rope was staged. Somebody tied it with a Vanguard knot."`, check: { skill: "dialectics", diff: 12, id: "rhea_bluff", pass: "bluff_pass", fail: "bluff_fail" }, cond: "flag.clue_rope" },
        { text: `"Forget it. I'm tired. Let it go."`, goto: "back_down" }
      ]
    },
    pin: {
      speaker: "narrator",
      text: `You open your hand. In the dull light the little brass pin sits like a tooth: the Vanguard's winged bell, a bent clasp, a thread of red-brown fibre still caught in the catch. Rhea's eyes go to it. For the first time she is a girl who has made a mistake. It lasts a heartbeat, and in that heartbeat you see a seven-year-old with wallpaper glue on her fingers.\n\n"Where did you find that?" It is hardly more than breath.`,
      interjections: [
        { skill: "rhetoric", min: 4, text: `Now. Right now. Every sentence you speak for the next ten seconds is a lever. Choose the long one.` },
        { skill: "dialectics", min: 4, text: `Premise: the pin is yours. Premise: the pin was under the mat. Premise: the mat is where the Commissar fell. Conclusion: you were there. Do not say the conclusion. Let her say it.` }
      ],
      choices: [
        { text: `Lay out the logic. "It was under the landing mat, where he fell."`, check: { skill: "rhetoric", diff: 12, id: "rhea_crack", pass: "crack_pass", fail: "crack_fail" } },
        { text: `Say nothing. Let her sweat.`, check: { skill: "composure", diff: 12, id: "rhea_silence", pass: "crack_pass", fail: "crack_fail" } }
      ]
    },
    bluff_pass: {
      speaker: "rhea",
      text: `"A Vanguard knot." She repeats it in a flat voice. "Nobody was supposed to..." And she stops, and the stop is a confession. A long exhale. "Fine. You are cleverer than your file. I had a feeling about you the moment you came out of the Hall. A feeling is a form of evidence."\n\nShe takes a step toward you. You can hear the leather of her boots creak on the wet cobbles.`,
      onEnter: [{ xp: 2 }, { set: "rhea_exposed", val: true }, { set: "knows_rhea", val: true }],
      choices: [{ text: `Brace.`, goto: "admit" }]
    },
    bluff_fail: {
      speaker: "rhea",
      text: `"Our knots are regulation." Her voice is gentle. "Square, not granny. If you know the difference you may have been in our manual. If you don't, you are making things up." She smiles. "I'm not offended. I'm only noting it. You said 'staged'. Why would you say 'staged'?"\n\nThere is a long, delicate silence in which you realise you may have just told her how much you know.`,
      onEnter: [{ surv: 6 }, { morale: -1 }],
      choices: [{ text: `Backpedal.`, goto: "back_down" }]
    },
    crack_pass: {
      speaker: "rhea",
      text: `It comes out of her like a thread being pulled. "He didn't understand." Her voice is quiet, sad, and wholly without remorse. "He wanted to tell them. The whole school. That the Bell is not what it looks like. He had a ledger, he was going to read it out at the Anthem practice. Do you know what that would do? Do you know what happens to people who learn they've been made to forget?"\n\nShe looks at you directly. "They stop being able to bear it. I've seen it. I've seen the ones it didn't work on. They scream, {name}. They scream until someone stops them."`,
      onEnter: [{ set: "rhea_exposed", val: true }, { set: "knows_rhea", val: true }, { set: "knows_static", val: true }, { xp: 3 }, { note: "task_case", text: `Rhea all but admitted it: she was in the gym. Ostrov was going to read the Ledger out at Anthem practice. She believes the Bell is a mercy.` }],
      choices: [{ text: `"So you killed him."`, goto: "admit" }]
    },
    crack_fail: {
      speaker: "rhea",
      text: `"A pin," Rhea says, "is a pin. I issue a hundred of them a term. They fall off. They get lost. People find them in drains." She takes it from your palm, calmly, with two fingers, and puts it in her pocket. "I am relieved to have it back. You have been very helpful. I'll be sure to mention it."\n\nThe pin is gone. It was your best card. She knows that you know she knows.`,
      onEnter: [{ take: "rhea_pin" }, { surv: 8 }, { morale: -1 }],
      choices: [{ text: `Retreat while you can.`, goto: "back_down" }]
    },
    admit: {
      speaker: "rhea",
      text: `"It was necessary." She says it the way you say the name of a doctor. "There are two kinds of people in the world, {name}: people who sleep, and people who can't. The Bell lets everyone sleep. He wanted to take sleep away from nine hundred children and give them what, truth? A truth that screams at three in the morning?"\n\nShe tilts her head. "I did it quickly. He didn't suffer more than he had to. And the Principal said it was right. The Principal is always right. That's the only job she has."\n\nThen her hand shoots out, and closes on your collar.`,
      onEnter: [{ set: "rhea_admitted", val: true }, { task: "task_rhea", state: "done" }, { note: "task_rhea", text: `Rhea Vantage killed Ostrov Dane, on Marr's order, and believes the Bell is a mercy. She told me. Then she grabbed me.` }],
      choices: [{ text: `Ready yourself.`, goto: "danger" }]
    },
    danger: {
      speaker: "narrator",
      text: `She is stronger than she looks and she has been trained to hurt people without hurting herself. Your collar tightens against your throat; the cobbles tilt; the world narrows to one hot bright circle with her eyes in the middle. The caretaker has vanished with great discretion. The loudspeakers have nothing to add.\n\nShe isn't screaming. That is the horror of it. She is quite calm. She has the other hand drawn back, and it is not a gesture of discussion.`,
      interjections: [
        { skill: "adrenaline", min: 3, text: `Now! Do something now!` },
        { skill: "grit", min: 4, text: `Whatever she does, you can survive it. You've survived worse. Probably. You don't remember.` }
      ],
      choices: [
        { text: `Twist out of her grip.`, check: { skill: "reflex", diff: 12, id: "rhea_dodge", pass: "dodge", fail: "hit" } },
        { text: `Hit back with everything you have.`, check: { skill: "brawn", diff: 14, id: "rhea_grapple", pass: "grapple_win", fail: "hit" } },
        { text: `Bark: "Lieutenant Kell! Over here!"`, check: { skill: "authority", diff: 12, id: "rhea_stop", pass: "stopped", fail: "hit" } },
        { text: `Take the blow. Don't fight back.`, goto: "hit", effects: [{ xp: 1 }] }
      ]
    },
    dodge: {
      speaker: "narrator",
      text: `You go limp and drop, the way you did in the fire drills nobody ever believed in, and her fist cuts a gap in the air where your jaw used to be. Her grip breaks on your collar and your shirt tears with a sound like a small private scream. You roll away across the cobbles and come up onto one knee, gasping, rain running down your face.\n\nRhea looks at her empty hand. Then at you. Her face has finally lost its serenity. It is replaced by something less composed, more honest, and a good deal more frightening: interest.`,
      onEnter: [{ xp: 2 }, { surv: 4 }],
      choices: [{ text: `Get up. Keep your distance.`, goto: "aftermath" }]
    },
    hit: {
      speaker: "narrator",
      text: `The blow lands under your ribs and the air leaves you in a single wet note. Your knees go. The cobbles come up and meet you with an apology you don't believe. Through the ringing, which is louder than usual, you hear her boots close by your head and a voice, quite near, say, "There. Now you'll remember it properly."\n\nHer boot stops an inch from your face. She hesitates. Then she steps back, as one steps back from a thing that has finished being interesting.`,
      onEnter: [{ hp: -3 }, { surv: 5 }, { sfx: "hit" }],
      interjections: [
        { skill: "grit", min: 3, text: `Up. Get up. Pain is just a rumour with good timing.` }
      ],
      choices: [{ text: `Drag yourself upright.`, goto: "aftermath" }]
    },
    grapple_win: {
      speaker: "narrator",
      text: `You do not know where it comes from. Perhaps from the morning's missing hours, from whatever you carried through the dark in a flag. You wrench her wrist, step through, and put her on her back on the wet stone with a noise that is more surprise than pain. For one long breath you kneel on the cold cobbles with a Vanguard enforcer's arm pinned in your fists, and the loudspeakers lean in as if to applaud.\n\nShe stares up at you. "Oh," Rhea says. "That's new."`,
      onEnter: [{ xp: 3 }, { surv: 6 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Let her up. Slowly.`, goto: "aftermath" }]
    },
    stopped: {
      speaker: "vasha",
      text: `Your voice comes out in a regimental bark you didn't know you owned. Somewhere across the Hall a door slams, boots begin to run, and Rhea's grip loosens by an instinctive degree. "Lieutenant Kell is a woman who follows her orders," she says, quickly, to nobody. "I'd not like to put her in an awkward position." She lets go of your collar and smooths it, with a gesture so tender it makes you flinch.\n\nWhether the Lieutenant actually appears is not something either of you waits to see.`,
      onEnter: [{ xp: 2 }, { surv: 3 }],
      choices: [{ text: `Step back.`, goto: "aftermath" }]
    },
    aftermath: {
      speaker: "rhea",
      text: `She brushes her sleeve. Her breathing is even. "You have until the Bell," she says. "That is not a threat. That is a fact about the structure of the day. Tonight, at twenty-one hundred, you will forget this. All of it. I will forget it too, a little. We will wake up and be, once again, two girls who barely know each other. Isn't that a mercy?"\n\nShe turns away. "Say what you must to the Principal. She already knows. She's known since breakfast. It's only a matter of whether you intend to be the sort of person who has a future."\n\nShe walks toward the Hall, and nobody tries to stop her.`,
      onEnter: [{ task: "task_rhea", state: "done" }, { thought: "th_big_sister_state" }],
      choices: [{ text: `Let her go. For now.`, end: true }]
    },
    back_down: {
      speaker: "rhea",
      text: `"Good." She smiles, relieved, as if you had agreed with her about the weather. "You're tired. We all are. Go and have a rest, {name}. Eat something. You look like a boy who's lost a pocketful of days." A beat. "Mind how you go. The cobbles are slippery today."\n\nIt could be a kindness. It could be a note on a file. You will never find out which.`,
      onEnter: [{ surv: 3 }],
      choices: [{ text: `Go.`, end: true }]
    },
    after_exposed: {
      speaker: "rhea",
      text: `She is sitting on the park bench now, hands folded, watching the sky as though it owed her something. When you come near she doesn't look at you. "I thought I'd say it properly," she says. "Not out of guilt. I don't feel any. I just thought somebody should be there when you finish the sum."\n\n"It's true, what I said. We would all be happier forgetting. You're the one who has to carry it. I don't envy you." She finally turns her head. "I'll be at the Principal's office at five. Say what you like. I'll say mine."`,
      interjections: [
        { skill: "empathy", min: 4, text: `She is not repentant, but she is lonely. For eleven years she has been the only person in the building who knew it all. Now somebody else knows. That has, strangely, comforted her.` }
      ],
      choices: [{ text: `Nod and leave.`, end: true }]
    }
  }
},

// ===================== STATUE =====================
statue: {
  title: "Statue of the Warden's Father",
  start: [
    { cond: "flag.found_ledger", node: "empty" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: {
      speaker: "narrator",
      text: `Aurel Voss, the Warden's Father, stands two and a half times your height on a plinth of poured concrete faced with grey granite, one hand out flat as if testing for rain. His nose has been polished by generations of hopeful hands to a shine you could use for navigation. A plaque reads: HE PLANTED THE FIRST STONE. Under it, in smaller letters nobody reads: THE REST WAS ONLY LABOUR.\n\nThe granite is cold, wet, and utterly innocent. Yet a thin pencil mark on the back of the plinth, low down near the cobbles, looks very much like your own handwriting.`,
      interjections: [
        { skill: "archive", min: 3, text: `Aurel Voss, farmer-turned-general, "father" of the Warden in the loosest sense. The statue was cast in the Year of Steady Hands. Plinth: poured concrete over a disused coal chute, per the 1904 building log. Nobody ever filled the chute. It would have required a purchase order.` },
        { skill: "the_grey", min: 4, text: `You were here in the dark. I held you. You were soaked. You pressed your forehead to my stone and said something I will not repeat, because it was quite rude about the Warden's father. Then you did something with your hands. I remember the sound. It was the sound of a lid.` },
        { skill: "sleight", min: 4, text: `Look at the mortar. There is a seam where the third stone sits slightly proud. Someone has pressed and lifted it many times. Not recently. But nothing gets worn that smooth by being left alone.` }
      ],
      choices: [
        { text: `Examine the back of the plinth.`, goto: "back" },
        { text: `Step back from the statue.`, end: true }
      ]
    },
    back: {
      speaker: "narrator",
      text: `Behind the statue, where the granite meets the cobbles, you find a seam in the veneer: a rectangular patch where the stone has been mortared in with something yellower than the rest. A pencil line runs along the edge of the third stone from the left. Beside it, a small drawing in the margin of the world: a bell, with a tiny cross through it.\n\nYou know the handwriting. It's yours. It's tidier than you'd like.`,
      onEnter: [{ set: "statue_seam_found", val: true }, { note: "task_ledger", text: `The plinth of the statue has a seam at the back: the third stone from the left. My own pencil marks beside it.` }],
      choices: [
        { text: `Lay out the three notes. See what they say together.`, goto: "notes", cond: "flag.read_note_1 && flag.read_note_2 && flag.read_note_3" },
        { text: `You haven't read all three notes yet. Try the stone anyway.`, goto: "no_notes", cond: "!(flag.read_note_1 && flag.read_note_2 && flag.read_note_3)" },
        { text: `Leave it for now.`, end: true }
      ]
    },
    notes: {
      speaker: "narrator",
      text: `You crouch in the shelter of the Warden's Father with the scraps from your pocket spread on your knee: three notes, in three moods, in the same hand. Alone, each is a riddle. Together they are an instruction written by a frightened clever person to a person who would be wiped. The first said where to begin. The second said what to press. The third said what to say if someone asked.\n\nYou press the third stone from the left. Slowly. Then to the right, then in. Somewhere inside the plinth, a lid remembers it is a lid.`,
      interjections: [
        { skill: "rote", min: 3, text: `Three notes, three steps, one rule. You learned it the way you learned the Catechism of Steady Hands. You do not know why. Repetition does not require comprehension. It only requires patience.` },
        { skill: "volition", min: 4, text: `Yesterday-You thought of everything except how it would feel to open this. Take a breath. It's only a box.` }
      ],
      choices: [{ text: `Open the stone.`, goto: "open" }]
    },
    open: {
      speaker: "narrator",
      text: `The stone swings inward on a hinge you would not have predicted from a statue. Inside is a coal-black cavity the size of a bread bin, lined with oilcloth. And on the oilcloth, wrapped in a faded school flag, tied with the cord from your own uniform, lies a flat, thick book bound in cheap blue cloth.\n\nIt is lighter than you expected. Everything that costs lives is lighter than you expect. Pages of columns: dates, times, relay codes, the length of each night's broadcast, and in the right margin a column headed, in a small hand you now recognise as Ostrov Dane's, only: WHAT THEY TOOK.`,
      onEnter: [{ give: "ledger" }, { set: "found_ledger", val: true }, { task: "task_ledger", state: "done" }, { note: "task_ledger", text: `The Ledger. Found in the plinth of the Warden's Father, wrapped in the flag. Nightly broadcast logs and a column headed WHAT THEY TOOK.` }, { xp: 4 }, { sfx: "paper" }, { thought: "th_ghost_of_yesterday" }, { thought: "th_paper_heart" }],
      interjections: [
        { skill: "deduction", min: 4, text: `The ledger has been handled by exactly two people. One had ink on their fingers (Ostrov). The other had pencil dust (you). Neither has opened it in the last six hours. It is complete. It is unread by anyone else. You are holding the only copy of a thing the District would burn a school to destroy.` },
        { skill: "solidarity", min: 4, text: `We have it. We have it. All of us, back to the first child who woke up with a lost afternoon and thought it was a cold. This book is our afternoon. Handle it as if it were a person.` }
      ],
      choices: [{ text: `Close the stone. Look around. Hide it in your coat.`, goto: "closed" }]
    },
    closed: {
      speaker: "the_grey",
      text: `I will keep your secret as I keep all secrets: by being too large to understand them. A hundred sentries have walked past this stone. A thousand children. They look up at the face. They always look up. Nobody has looked at the third stone from the left since the day the mortar was laid.\n\nThe Courtyard goes on being wet. A pigeon arrives and sits on the Warden's Father's open hand, as pigeons will. There is a book against your ribs now. Walk like a person who has just been to the lavatory.`,
      onEnter: [{ surv: 3 }],
      choices: [{ text: `Walk away from the statue.`, end: true }]
    },
    no_notes: {
      speaker: "narrator",
      text: `You press the third stone. It does not move. You press it left, then right, then in, and the stone sits with the peculiar blankness of a thing that knows exactly what you are missing. Whoever sealed this knew you would try it without the whole instruction and arranged for you to fail.\n\nSomewhere in the school there are scraps in your own handwriting that explain what you did here. You don't have all of them yet. Or you have, and haven't read them.`,
      interjections: [
        { skill: "dialectics", min: 3, text: `Premise: Yesterday-You left three notes. Premise: the plinth needs a sequence. Conclusion: the notes are the sequence. You are in the position of a man holding a lock and looking for his own pockets.` }
      ],
      choices: [
        { text: `Force it. Find a gap and lever it open with whatever you can find.`, check: { skill: "brawn", diff: 16, id: "statue_force", pass: "force_pass", fail: "force_fail" } },
        { text: `Feel for the mechanism by sound and touch.`, check: { skill: "sleight", diff: 16, id: "statue_feel", pass: "force_pass", fail: "force_fail" } },
        { text: `Come back when you have the notes.`, end: true }
      ]
    },
    force_pass: {
      speaker: "narrator",
      text: `You do not know how. A grunt, a scrape of fingernail on mortar, a click you feel in your teeth, and the third stone grudgingly swings open as though it has remembered you after all. Your hands, evidently, know things your head has been told to forget.\n\nInside lies the oilcloth, the flag, and the blue-cloth book. You are not sure you are glad.`,
      onEnter: [{ xp: 3 }, { surv: 4 }],
      choices: [{ text: `Take the Ledger.`, goto: "open" }]
    },
    force_fail: {
      speaker: "narrator",
      text: `You scrape your knuckles on the veneer and make a noise like a dropped tray. A pigeon departs, offended. Across the Courtyard, a broom stops. The stone remains a stone, the plinth a plinth, and you a person who has just been heard trying to burgle the Warden's Father.\n\nIf anyone saw, they will be along shortly with a form.`,
      onEnter: [{ hp: -1 }, { surv: 10 }, { sfx: "hit" }],
      choices: [{ text: `Leave, quickly. Try again with the notes.`, end: true }]
    },
    empty: {
      speaker: "narrator",
      text: `The third stone sits quietly in its place. Behind it the cavity is empty, the oilcloth folded; one pencil tick remains on the mortar beside a small bell with a cross through it. The statue's hand is held out for tribute that no longer exists. A pigeon is sitting in it.\n\nThe Warden's Father has kept your secret for the length of one night and one morning. As promises go, it is the longest anyone has kept to you today.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `Whatever happens, I was here first. Whatever you do with that book, the plinth will be here after. I'm in no hurry. That's what concrete is for.` }
      ],
      choices: [{ text: `Step away.`, end: true }]
    }
  }
},

// ===================== LOUDSPEAKER =====================
loudspeaker: {
  title: "Loudspeaker Pole",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The loudspeaker is a tin trumpet the size of a bucket bolted to a pole painted Warden-green. Its wire runs into the brick behind the Ration Hall door and goes downward, as if the Bell lives below the school. It is quiet now, but not silent: a low electrical breath, a mosquito of a hum, constant and patient. Under it, almost under hearing, a second note, like a finger run around a glass rim.\n\nYour ears go warm. The ringing you have had since childhood tilts, as a compass needle tilts toward iron.`,
      interjections: [
        { skill: "senses", min: 4, text: `The carrier tone sits at about the pitch of a kettle thinking about boiling. It pulses slowly: nine seconds up, three down. Pulses like that are not an accident; someone designed the gap between them.` },
        { skill: "the_grey", min: 3, text: `You are right to lean toward it. Everyone leans toward it. That's what it's for. A trumpet on a pole is a mouth pointed at a crowd. It does not need to say much. It only needs to be where the people are.` },
        { skill: "rote", min: 4, text: `The Harmony Broadcast, nightly at twenty-one hundred. Duration: twenty-two minutes. Content: the Bell and the Anthem of Steady Hands. Effects, according to the Public Information Leaflet: "Calm, restful sleep." You've read the leaflet. You have always wondered why the side effects are the same length as the benefits.` }
      ],
      choices: [
        { text: `Put your ear to the pole.`, goto: "listen" },
        { text: `Follow the cable with your eyes.`, check: { skill: "deduction", diff: 10, id: "loudspeaker_cable", pass: "cable_pass", fail: "cable_fail" } },
        { text: `Step back.`, end: true }
      ]
    },
    listen: {
      speaker: "narrator",
      text: `The metal is cold against your ear and the hum fills your head like warm water. And beneath the hum, in the place where your tinnitus lives, a second sound begins to answer. Your ringing, which has been your private affliction since you were six, is almost in tune with the pole. Almost, but not quite. A thin beat shivers between them, like the interference between two wet fingers on a bell.\n\nFor one dizzy instant you understand that everyone else in the district has no second note. Theirs goes in cleanly.`,
      onEnter: [{ set: "heard_carrier", val: true }, { xp: 2 }, { thought: "th_bell_tolls" }, { note: "task_yesterday", text: `My tinnitus beats against the loudspeaker's carrier tone. Everyone else's hearing goes straight in. Mine doesn't. Is that why I remember anything?` }],
      interjections: [
        { skill: "volition", min: 3, text: `Take your ear away. It is only a speaker. You are only a person. Please remember which of you has the hands.` }
      ],
      choices: [{ text: `Listen longer.`, check: { skill: "composure", diff: 11, id: "loudspeaker_longer", pass: "longer_pass", fail: "longer_fail" } }, { text: `Step back.`, end: true }]
    },
    longer_pass: {
      speaker: "the_grey",
      text: `Here is what I can tell you, because you have asked politely, with your ear. The tone is not music. Music has no use for the gap. This one has a gap every nine seconds, and in the gap, a sound too low for anything but concrete to hear. A heartbeat. Not yours. A slower one, the kind that belongs to something enormous and bored. Whoever built the Bell made it breathe so that people would breathe with it.\n\nI do not like it, personally. I am a district. I would rather be forgotten for my own reasons.`,
      onEnter: [{ xp: 3 }, { set: "knows_static", val: true }, { note: "task_radio", text: `The Bell's carrier pulses nine seconds up, three down, with a slow heartbeat in the gap. It is built to breathe with you. Someone with a radio could decode it. Ilsabet?` }],
      choices: [{ text: `Step away from the pole.`, end: true }]
    },
    longer_fail: {
      speaker: "narrator",
      text: `The hum climbs inside your skull like water in a bath. Your knees decide to be a separate committee. You stagger back from the pole with the metallic taste of an old coin at the back of your tongue and an urgent, unreasonable desire to lie down in a warm place and not mind about anything.\n\nA moment later it passes, as such things do. But your pulse has not stopped matching the pole.`,
      onEnter: [{ morale: -1 }, { surv: 3 }],
      choices: [{ text: `Shake it off.`, end: true }]
    },
    cable_pass: {
      speaker: "deduction",
      text: `The cable goes in through the brick behind the Ration Hall door, a thick dark vein in a conduit marked D9-RELAY. Another branch plunges, with commendable lack of subtlety, down the stairs toward the boiler room. That makes no sense, unless the relay is under the school. Unless the thing that sends the Bell to nine hundred ears is not in the District Warden's office, but in a room the caretaker keeps the keys to.\n\nOr, more interestingly: unless someone has tapped it.`,
      onEnter: [{ xp: 2 }, { set: "cable_traced", val: true }, { note: "task_broadcast", text: `The loudspeaker cable runs into a conduit marked D9-RELAY, one branch heading down toward the boiler room. Somebody could cut in on the school PA from there... or from the Ration Hall stage mic.` }, { task: "task_broadcast", state: "active" }],
      choices: [{ text: `File that away.`, end: true }]
    },
    cable_fail: {
      speaker: "narrator",
      text: `The cable disappears in an unhelpful direction, folds itself into the brickwork, and is gone. You have the humbling sense of having been shown a trick by a man who didn't bother to hide the cards.`,
      choices: [{ text: `Give up on it.`, end: true }]
    }
  }
},

// ===================== Y_BENCH =====================
y_bench: {
  title: "The Park Bench",
  start: [
    { cond: "has('note_yesterday_3') || flag.read_note_3", node: "after" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: {
      speaker: "narrator",
      text: `An ordinary bench of green-painted slats on iron feet, bolted to the cobbles in the sulky corner of the Courtyard where the Warden's Father cannot see. The paint is chipped into a map of an unfriendly country. Someone has carved on the back rail: S.V. + ? Someone else has scratched out the question mark and replaced it with a doodle of the Warden wearing small, hopeful horns.\n\nSomething about the bench draws your hand. The way you are drawn to a pocket you know has something in it.`,
      interjections: [
        { skill: "the_grey", min: 4, text: `You sat here last night. I know because the cold left a shape, and the shape was of a person with their face in their hands. You were whispering to your own knees. It was not a coherent conversation. It was quite a moving one.` },
        { skill: "senses", min: 4, text: `Underneath the middle slat, in the shadow of the iron, a scrap of paper has been folded very small and wedged into the join. Someone with a careful, anxious hand put it there.` },
        { skill: "appetite", min: 3, text: `Nothing edible, sorry. Check anyway. A man can hope.` }
      ],
      choices: [
        { text: `Search under the slats.`, goto: "find", effects: [{ time: 10 }] },
        { text: `Sit and rest for a moment.`, goto: "rest" },
        { text: `Leave it.`, end: true }
      ]
    },
    find: {
      speaker: "narrator",
      text: `Your fingers find it where they hid it: a pellet of grey paper the size of a cough drop, sealed with a smear of boiler-room grease. You unfold it with the care of defusing a small sad bomb. The handwriting is yours, but nervy, slanted, a little drunk on fear. It says, in pencil, in a hurry:\n\n{name}, IF YOU READ THIS YOU HAVE FORGOTTEN AGAIN. DON'T PANIC. IT'S IN THE FATHER. HE POINTS AT RAIN, BUT HE'S DRY INSIDE. THIRD FROM THE LEFT. SAY NOTHING TO MARR. SAY NOTHING TO THE GIRL IN RED. TRUST THE OLD WOMAN WITH THE TEA.\n\nBelow, as an afterthought, smudged: I'M SORRY. IT WASN'T SUPPOSED TO BE YOU.`,
      onEnter: [{ give: "note_yesterday_3" }, { set: "read_note_3", val: true }, { xp: 3 }, { sfx: "paper" }, { note: "task_yesterday", text: `Note 3, under the bench: "IT'S IN THE FATHER. THIRD FROM THE LEFT. SAY NOTHING TO MARR. SAY NOTHING TO THE GIRL IN RED. TRUST THE OLD WOMAN WITH THE TEA. I'M SORRY. IT WASN'T SUPPOSED TO BE YOU."` }, { note: "task_ledger", text: `Note 3 says the Ledger is "in the Father". Third from the left. The old woman with the tea is someone I should trust.` }, { thought: "th_ghost_of_yesterday" }],
      interjections: [
        { skill: "empathy", min: 3, text: `"It wasn't supposed to be you." Whoever you were last night, you knew you were being used. You wrote the apology anyway. That tells you something about yourself that you may not want to hear.` },
        { skill: "doublethink", min: 4, text: `Don't trust a note from yourself. Yourself has been wiped. Yourself is an unreliable witness with a vested interest in confusion. Burn it. Give it to Marr. Be a good boy.`, effects: [{ surv: -1 }] },
        { skill: "archive", min: 3, text: `"The old woman with the tea." Tea is a ration item. Women of age with access to unrationed tea: Cook Bronka (Canteen) and... one other, retired, formerly on the staff register in the Chemistry Department. Struck off. Whereabouts: unrecorded.` }
      ],
      choices: [{ text: `Read it again.`, goto: "again" }, { text: `Pocket it and get up.`, end: true }]
    },
    again: {
      speaker: "the_grey",
      text: `You read it a second time and a third, and each time the paper gets a little lighter in your hand. There is a smear on the edge of the sheet that is not grease. A thumbprint, ridged, slightly too long: the print of a boy who bites his nails and holds a pencil like a dagger. It's yours. It's yours the way a signature is yours. It says: this person was here. This person was frightened. This person decided anyway.\n\nI cannot tell you whether that is courage. I am concrete. I only note that it was done in the rain.`,
      onEnter: [{ xp: 1 }, { morale: 1 }],
      choices: [{ text: `Fold it away.`, end: true }]
    },
    rest: {
      speaker: "narrator",
      text: `You sit. The cold slats take your weight with the grudging acceptance of furniture that has been sat on by every child in the district. A breeze finds the gap between your collar and your neck. For a long, unobserved minute you look at the statue's back and the hard grey sky and the clipped line of the school wall and let yourself be a person on a bench.\n\nIt does you some good.`,
      onEnter: [{ morale: 1 }, { time: 5 }],
      choices: [{ text: `Now check under the slats.`, goto: "find", effects: [{ time: 10 }] }, { text: `Get up.`, end: true }]
    },
    after: {
      speaker: "narrator",
      text: `The bench is only a bench now. A map of chipped paint, a carved heart someone abandoned halfway, a dry strip of slat where a note was hidden and has been taken. Sitting on it, you feel the shape of the last person who sat there, because it was you, wearing the same coat.\n\nYou think, briefly, that you would like to say something to them. But they are not here, and you do not have the language for it yet.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `Sit if you like. Nobody will make you move. Benches are the one honest institution in the district. They offer a person a rest and do not ask what for.` }
      ],
      choices: [{ text: `Sit for a while. (+Nerve)`, goto: "sit", once: true }, { text: `Go.`, end: true }]
    },
    sit: {
      speaker: "narrator",
      text: `You sit. The rain thins. A pigeon alights on the Warden's Father's open hand and, with great care, relieves itself. It is the most honest thing anyone has done to a statue in thirty years, and you laugh, once, out loud, and for a moment everything is fine.`,
      onEnter: [{ morale: 2 }, { time: 10 }],
      choices: [{ text: `Get up.`, end: true }]
    }
  }
},

// ===================== Y_BELL =====================
y_bell: {
  title: "The Old School Bell",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `A real bell, cast bronze, green with age, hung from a gallows of black iron in the corner where the fence meets the wall. The clapper has been tied with a length of wire and the rope has been taken away. A brass plaque, polished at the corners by decades of thumbs, says: RUNG BY HAND, FOR THE CHILDREN. Beneath it somebody has stuck a laminated notice: BY DECREE NO. 41, THE SCHOOL BELL IS RETIRED. THE BELL OF THE UNION RINGS FOR ALL.\n\nIt has the dignity of a thing that remembers being useful.`,
      interjections: [
        { skill: "archive", min: 3, text: `Cast in the Foundry of St. Emmerich, 1887, for the first School No. 9, before the Union annexed St. Emmerich and renamed it Steady Hands Township. Weight: 90 kilograms. Note: bells were retired in the Year of Silent Breaks, to avoid "competing signals".` },
        { skill: "the_grey", min: 3, text: `A school bell used to tell children when to begin and when to stop. Now one bell tells everyone when to stop, and nobody is allowed to begin. I miss the old one. It had a bit of cheek.` },
        { skill: "adrenaline", min: 3, text: `Ring it ring it RING IT. Just once! Take the wire off the clapper and make the Courtyard wake up!` }
      ],
      choices: [
        { text: `Undo the wire and ring it.`, goto: "ring", effects: [{ time: 3 }] },
        { text: `Rest your hand on the cold bronze.`, goto: "touch" },
        { text: `Examine the wire on the clapper.`, check: { skill: "deduction", diff: 9, id: "y_bell_wire", pass: "wire_pass", fail: "wire_fail" } },
        { text: `Leave it.`, end: true }
      ]
    },
    touch: {
      speaker: "narrator",
      text: `The bronze is cold and slightly damp and smells of coin. When you rest your palm against it, you feel nothing at all, and then, when you lean, a vibration from very far away, the way you can feel a train in a rail before you hear it. It is the district. It is the pipes, the traffic, a hundred thousand small footsteps. The bell has no clapper, and it is still ringing.`,
      onEnter: [{ xp: 1 }, { morale: 1 }],
      interjections: [{ skill: "solidarity", min: 3, text: `We hear it. We are all so close together, aren't we? A hundred thousand footsteps, and not one of them knows another's name.` }],
      choices: [{ text: `Withdraw your hand.`, end: true }]
    },
    wire_pass: {
      speaker: "deduction",
      text: `The wire is not original. It's new bright steel, cut with pliers, twisted three times in a clockwise knot. Somebody replaced the old wire recently, and the person who did it had a Vanguard's neatness. Under it, trapped in the clapper's eye, is a scrap of red-brown wool. Someone ties this bell up weekly. Which means somebody is afraid of it ringing.\n\nAn old bell, then, can still do something. It is merely the one thing in the school with a loud voice and no owner.`,
      onEnter: [{ xp: 2 }],
      choices: [{ text: `Interesting. Move on.`, end: true }]
    },
    wire_fail: {
      speaker: "narrator",
      text: `It's a wire. It's on a bell. You stare at it with the intensity of someone who has been told there is a clue and has resolved not to disappoint. The wire declines to tell you anything.`,
      choices: [{ text: `Give up.`, end: true }]
    },
    ring: {
      speaker: "narrator",
      text: `The wire comes loose. You take the clapper in both hands, pull it back, and let it go.\n\nIT RINGS. A huge, fat, gloriously unprofessional peal that goes off like an ill-timed laugh in church. The bronze booms in your teeth. Pigeons rise from every gutter in the quarter. In the Principal's office a green curtain twitches. For one clear second the whole square is flooded with a sound the Union forgot it owned, a sound that says: begin.\n\nThen the echo dies, the pigeons settle, and somewhere a door opens.`,
      onEnter: [{ surv: 12 }, { xp: 3 }, { morale: 2 }, { ideo: "undercurrent", n: 1 }, { sfx: "bell" }, { set: "rang_old_bell", val: true }],
      interjections: [
        { skill: "volition", min: 4, text: `That was stupid. And I loved it. Both. Hold both.` },
        { skill: "authority", min: 4, text: `Stand tall. If somebody comes, you rang it for a reason. Think of a reason. Any reason.` }
      ],
      choices: [{ text: `Retie the wire and walk away.`, goto: "retie" }, { text: `Walk away briskly.`, end: true }]
    },
    retie: {
      speaker: "narrator",
      text: `You twist the wire back as nearly as you remember it, three turns clockwise, leaving it a little too tidy. A bell that has rung once is a bell that has an opinion. You hope nobody checks the knot.`,
      onEnter: [{ surv: -3 }],
      choices: [{ text: `Leave.`, end: true }]
    }
  }
},

// ===================== BOILER_DOOR =====================
boiler_door: {
  title: "The Green Door",
  start: [
    { cond: "flag.boiler_unlocked", node: "open" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: {
      speaker: "narrator",
      text: `At the bottom of four stone steps, under the stairs that the Courtyard pretends it does not have, stands a steel door painted the specific green of institutional hope. A padlock the size of a fist hangs from a hasp. There is a hand-lettered sign: BOILER ROOM — AUTHORISED PERSONNEL — NO CHILDREN — NO EXCEPTIONS. Under it, in fresher paint, someone has added: THIS MEANS YOU, with a little drawn finger.\n\nFrom behind the door comes the sound of a kettle, a low murmur, and a chair being dragged.`,
      interjections: [
        { skill: "senses", min: 3, text: `Voices. Three, perhaps four, pitched low, in the rhythm of people who have been told to be quiet and have decided to be quiet together. Tea, tobacco, a very faint whiff of solder.` },
        { skill: "slip", min: 4, text: `Padlock: cheap, but with a decent shackle. The hasp screws are rusted but flush; the hinges are on the inside. You could pick the lock. You would not, however, be quick.` },
        { skill: "instinct", min: 4, text: `They know you are here. Nobody is moving. Everybody is listening. This is a door that has been knocked on by the wrong people before.` }
      ],
      choices: [
        { text: `Knock the pattern from the bread note.`, goto: "knock", cond: "has('bread_note')" },
        { text: `Pick the padlock with the bent spoon.`, check: { skill: "slip", diff: 11, id: "boiler_door_spoon", pass: "pick_pass", fail: "pick_fail" }, cond: "has('bent_spoon')" },
        { text: `Pick the padlock with your fingers and a hairpin of pure will.`, check: { skill: "slip", diff: 14, id: "boiler_door_pick", pass: "pick_pass", fail: "pick_fail" }, cond: "!has('bent_spoon')" },
        { text: `Put your shoulder to it.`, check: { skill: "brawn", diff: 15, id: "boiler_door_shoulder", pass: "shoulder_pass", fail: "shoulder_fail" } },
        { text: `Knock, plainly, like a person.`, goto: "knock_plain" },
        { text: `Go back up.`, end: true }
      ]
    },
    knock: {
      speaker: "narrator",
      text: `You unfold the bread note. Between the words "RATIONS TUESDAY" and "NO EXTRA GRAVY" there is a row of tiny crumbs, pressed into the paper by a thumb: long, short, short, long. You knock it on the cold green steel. Nothing. Then, from inside, a bolt shoots back, and a hush of voices cuts off cleanly like a switch being thrown.\n\nThe door opens a hand's width. A smell of hot lead and tea. Behind the gap, in the gloom, a single spectacle flashes.\n\n"Cook sent you," says a dry voice. "Come in. And for pity's sake wipe your feet."`,
      onEnter: [{ set: "boiler_unlocked", val: true }, { xp: 2 }, { sfx: "door" }, { note: "task_anka", text: `The knock from Bronka's bread note opened the boiler-room door. Someone inside said "Cook sent you."` }],
      choices: [{ text: `Go in.`, end: true }]
    },
    knock_plain: {
      speaker: "narrator",
      text: `You knock three times, like a citizen. The murmuring stops. A very long silence passes, in which you can hear someone not breathing on the other side. Then a voice, a woman's, dry as a paper bag: "We are closed. We are always closed. Go and learn your catechism."\n\nShe is right to be careful. A knock like yours has, in the past, preceded arrests. You will need to show you are not what you sound like.`,
      onEnter: [{ surv: 2 }],
      choices: [{ text: `Try another way in.`, goto: "a" }, { text: `Leave.`, end: true }]
    },
    pick_pass: {
      speaker: "narrator",
      text: `The padlock gives with a sigh, as if it had been waiting for a more sympathetic visitor. You ease the shackle open, slip the hasp, and lean on the door. It moves on silent hinges (someone oils them weekly). Light from a lamp falls out across the steps. There is a stillness behind it of people suddenly holding their breath.\n\nA dry voice from inside: "Well. You are either very clever or very stupid. Come in and we shall see which."`,
      onEnter: [{ set: "boiler_unlocked", val: true }, { xp: 3 }, { surv: 2 }, { sfx: "door" }],
      choices: [{ text: `Go in.`, end: true }]
    },
    pick_fail: {
      speaker: "narrator",
      text: `The pick slips. The padlock rattles against the hasp with a cheerful clang that rolls up the stairwell like a dropped plate. Inside, chairs scrape. Someone says, quite distinctly, "Not today," and the lamp behind the door goes out.\n\nUp in the Courtyard a broom stops sweeping.`,
      onEnter: [{ surv: 6 }, { morale: -1 }, { sfx: "hit" }],
      choices: [{ text: `Retreat up the steps.`, end: true }]
    },
    shoulder_pass: {
      speaker: "narrator",
      text: `You throw yourself at the door with the force of a boy who has just remembered he is nobody's property. The hasp tears free of the rotten frame in a spray of rust and plaster. The door bangs open on a long hot room of pipes. Chairs scatter. A lamp swings. A kettle, startled, boils over.\n\nOut of the steam, small and furious, a woman in a lab coat points a cold cigarette at you. "That," she says, "was entirely unnecessary."`,
      onEnter: [{ set: "boiler_unlocked", val: true }, { surv: 8 }, { hp: -1 }, { xp: 2 }, { sfx: "door" }],
      choices: [{ text: `Apologise, and go in.`, end: true }]
    },
    shoulder_fail: {
      speaker: "narrator",
      text: `The door gives you a short, hard lesson in the properties of steel. Your shoulder rings. Your teeth rattle. Behind the door nothing moves, which is an answer in its own way.\n\nUp the stairs, someone calls out, "Who's there?" in the tone of a person who already knows.`,
      onEnter: [{ hp: -2 }, { surv: 7 }, { sfx: "hit" }],
      choices: [{ text: `Limp away.`, end: true }]
    },
    open: {
      speaker: "narrator",
      text: `The green door stands ajar. A wedge of warm lamplight lies across the steps. Down there, the kettle is on.`,
      choices: [{ text: `Go down.`, end: true }]
    }
  }
},

// ===================== GATE =====================
gate: {
  title: "The School Gate",
  start: [
    { cond: "time < 1020", node: "closed" },
    { cond: "true", node: "open" }
  ],
  nodes: {
    closed: {
      speaker: "narrator",
      text: `The School Gate is a pair of black iron leaves, ten feet high, topped with pikes in the shape of stylised wheat. A sentry-box stands to one side, with a sentry in it, who stands to one side of himself. A painted sign: NO EGRESS BEFORE EXAMINATION (17:00). THE UNION THANKS YOU FOR YOUR PATIENCE.\n\nBeyond the bars: a street, a bus-stop, a woman with a string bag, a dog. The world carries on without you in a manner you find hard to forgive.`,
      interjections: [
        { skill: "volition", min: 3, text: `You could walk through this gate when it opens and not come back. You know it. The tired adult in your head knows it too. Do not pretend you don't want to.` },
        { skill: "authority", min: 4, text: `The sentry is more afraid of you than you are of him. Leave anyway. Leaving is not a thing you do before you have been told you may.` }
      ],
      choices: [
        { text: `Ask the sentry when the gate opens.`, goto: "closed_ask" },
        { text: `Try to talk your way out.`, check: { skill: "rhetoric", diff: 14, id: "gate_early", pass: "closed_pass", fail: "closed_fail" } },
        { text: `Step away from the bars.`, end: true }
      ]
    },
    closed_ask: {
      speaker: "narrator",
      text: `"After five," says the sentry, without moving his lips. He's a plump man in a grey cape, with a face like a patient potato. "After the Examination, young one. Every child must be examined before they are allowed to be unexamined. It's in the rules. It's the only rule that has never been amended."\n\nHe leans closer. "The kettle comes round at five-thirty. Free tea for the leavers. Everyone leaves with a cup." He sounds as if he is telling you about a family tradition that has gone slightly wrong.`,
      choices: [{ text: `Thank him.`, end: true }]
    },
    closed_pass: {
      speaker: "narrator",
      text: `You find the exact tone of reasonable fatigue, the one the sentry himself uses on his wife. He frowns, checks a list, finds your name under "Pending", and sighs the sigh of a man who has spent a life learning which rules are enforced. "Oh, go on. But you'll need to come back before five. I'll chalk you down for 'urgent errand'."\n\nBut the Examination is the Examination. If you come back, you come back. If you don't, the Principal will record it. He opens the gate by a foot. Cold air licks your shin.`,
      onEnter: [{ xp: 2 }, { surv: 6 }],
      choices: [{ text: `Step through to the street, just for a moment.`, goto: "open" }, { text: `Think better of it.`, end: true }]
    },
    closed_fail: {
      speaker: "narrator",
      text: `"No," says the sentry, with great kindness, and writes your name in a different book. It is not an alarming book. It is a small book in a drawer. But it is the sort of book that always ends up being consulted later.`,
      onEnter: [{ surv: 5 }],
      choices: [{ text: `Retreat.`, end: true }]
    },
    open: {
      speaker: "narrator",
      text: `The gate is open. Not wide: a gap of a person's width, as if the iron had decided it would be impolite to open further. The sentry sits in his box with a newspaper and a thermos and the quiet competence of a man who has watched a great many children decide this exact thing. Beyond the gap, the street is wet and lit, and a bus is idling at the stop. It is the 9 route. It goes to your house.\n\nThe Examination is, if you have attended it, done. If not, it is an appointment that no longer requires you.`,
      interjections: [
        { skill: "appetite", min: 3, text: `Home means a plate. Warm. A kettle. A chair that fits. Nobody asking you to be anything at all. Do you remember what that was like? Neither do I. Let's find out.` },
        { skill: "the_grey", min: 3, text: `The street is beautiful tonight. I don't say that about many nights. The wet makes the lamps into little yellow sums. Take the bus. Count the lamps. At the end of the count you will be home.` },
        { skill: "composure", min: 3, text: `Straight back. Chin level. If you go, go like a person who has done nothing and intends to continue.` }
      ],
      choices: [
        { text: `Look back at the school.`, goto: "tempt" },
        { text: `Step into the gap.`, goto: "tea" },
        { text: `Not yet. Go back in.`, end: true }
      ]
    },
    tempt: {
      speaker: "volition",
      text: `You turn. Behind you the school is a long low shape against a sky the colour of an old bruise. The windows are yellow. The loudspeakers are lit. The statue's hand is held out as it always is. This is a place that has happened to you for eleven years, and it will go on happening, whether or not you are in it.\n\nYou are tired. You are allowed to be. You could let the others do it. Isn't that what other people are for?`,
      interjections: [
        { skill: "volition", min: 3, text: `Listen. I am the tired adult in you. I am not telling you to go or to stay. I am telling you that whichever you choose, you will have to live in the person who chose it. Decide who that is.` }
      ],
      choices: [
        { text: `Think about everything you've left undone.`, goto: "undone" },
        { text: `Turn around. Face the street.`, goto: "tea" },
        { text: `Go back in.`, end: true }
      ]
    },
    undone: {
      speaker: "empathy",
      text: `They are all there, every one of them, standing in the rain at the edge of your mind like children waiting to be fetched. You count them.`,
      interjections: [
        { skill: "empathy", min: 0, cond: "flag.found_ledger && !flag.ledger_with_anka", text: `The Ledger. Still under your coat, still wanting a home. Mother Anka waits in the boiler room with a tea going cold. Or the stage, or the fire. Or nothing, if you simply walk.` },
        { skill: "empathy", min: 0, cond: "!flag.found_ledger", text: `Somewhere in the Courtyard there is a hollow plinth with something inside it that has your handwriting on it. You never opened it. You can leave it for the next student. The next student will not be you.` },
        { skill: "empathy", min: 0, cond: "flag.osk_seen_you && task('task_osk') != 'done'", text: `Osk is sweeping the Courtyard right now, thinking about a form with a gap in it. He will go on sweeping after you leave. He will be the answer to somebody's question.` },
        { skill: "empathy", min: 0, cond: "flag.rhea_exposed", text: `Rhea Vantage killed a man in a gym and called it mercy. She is walking home to a bed she sleeps in perfectly. You are the only person who can say so.` },
        { skill: "empathy", min: 0, cond: "!flag.exam_done", text: `The Examination, which you didn't sit. Principal Marr will note your absence with a very small mark in a very large book.` },
        { skill: "empathy", min: 0, cond: "flag.ilsabet_decoded", text: `Ilsabet decoded the carrier tone for you, sitting in a wheelchair in the Ration Hall with her ears full of interference. She will be there tomorrow. She will not remember she did.` },
        { skill: "solidarity", min: 3, text: `We would so like to say goodbye. We would so like not to have to. We who are left will understand. We always do. That's the wickedness of us.` }
      ],
      choices: [
        { text: `You have thought about it. Go back in.`, end: true, effects: [{ morale: 1 }, { xp: 1 }] },
        { text: `Still. It's a lot to ask of one person. Turn toward the street.`, goto: "tea" }
      ]
    },
    tea: {
      speaker: "narrator",
      text: `A woman from the Hall Committee in a plastic apron stands at a trestle table under the gate-lamp, handing out paper cups of ration-tea to everyone who leaves. The tea is the colour of a bruised plum. The cups are stamped THE BELL KEEPS YOU WARM. She smiles at you with the radiant disinterest of a person who has ladled five hundred cups. "Name? Year? Tea. Home safe. Sleep tight."\n\nYou take it. It is warm. It smells of cloves and lowered expectations. Steam rises from the cup and, in it, for a moment, you can see all the things you're not saying.`,
      interjections: [
        { skill: "appetite", min: 3, text: `Cloves. A trace of orange peel. Sugar, not much but real, and something underneath that sweetens the back of the throat. You want it. It's not a kind of wanting you've ever argued with before.` },
        { skill: "doublethink", min: 3, text: `It is the Union's good-night kiss. You are a good citizen. You have worked hard. A cup of tea and a long night's rest, and tomorrow will be sunny and everything you worry about will be a blur. Doesn't that sound restful?`, effects: [{ surv: -2 }] },
        { skill: "senses", min: 4, text: `There's a faint chemical edge under the cloves: bitter, mineral, the taste of pills ground to powder. Whatever it is, it's meant to make the Bell go down easier.` }
      ],
      choices: [
        { text: `Drink it. (Go home, and let it all be forgotten.)`, goto: "final" },
        { text: `Pour it out onto the cobbles. Go back in.`, goto: "backout", effects: [{ xp: 1 }] },
        { text: `Hold the cup. Don't decide yet. Back inside.`, end: true }
      ]
    },
    final: {
      speaker: "narrator",
      text: `The cup is hot against your palms. All you have to do is lift it. Behind you the school stands with all its hands out. Ahead of you the bus shivers at the kerb. Between them is a cup of tea.\n\nNo one is making you. That's the beauty of it. It is the most voluntary thing you will ever do.`,
      interjections: [
        { skill: "volition", min: 4, text: `This is the last place you can still turn round. After the first mouthful, you will begin to turn into somebody who never had to. Make it a deliberate choice or don't make it at all.` }
      ],
      choices: [
        { text: `Drink the tea and get on the bus. (Ending: the Quiet.)`, end: true, effects: [{ ending: "end_quiet" }] },
        { text: `Put the cup down on the wall. Go back in.`, goto: "backout" }
      ]
    },
    backout: {
      speaker: "the_grey",
      text: `The tea goes onto the cobbles in a long dark curl and begins at once to be absorbed. I take it. I take everything eventually. The woman in the apron looks at you with real puzzlement; the sentry folds his newspaper and says, in an unexpected soft voice, "I didn't see anything, son."\n\nBehind you the school waits as it has always waited. Ahead of you the bus pulls away. You will have to learn what it costs to miss it.`,
      onEnter: [{ morale: 2 }, { ideo: "undercurrent", n: 1 }, { xp: 2 }],
      choices: [{ text: `Go back in.`, end: true }]
    }
  }
},

// ===================== O_DESK =====================
o_desk: {
  title: "The Principal's Desk",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `A teak desk the size of a small boat, covered in a green leather blotter that has been written on, over many years, in invisible ink: the ghost of every signature ever pressed upon it. A brass lamp. A tray marked IN, a tray marked OUT, a tray marked NOT YET. A silver pen. A glass of water with a lemon slice floating in it like a drowned moon. A calendar open to today.\n\nPrincipal Marr is sitting at the far end of it, doing two things at once, neither of which is looking at you. She is looking at you.`,
      interjections: [
        { skill: "senses", min: 4, text: `Her pen is moving on a form, but the paper's rustle is wrong. She isn't writing. She is tapping, a rhythm of three long and one short. She is counting you.` },
        { skill: "archive", min: 4, text: `The trays are sorted by the schools' recognised priority system: IN (unprocessed), OUT (done), NOT YET (to be done but not to be acknowledged). Entire careers have ended in NOT YET.` }
      ],
      choices: [
        { text: `Read today's calendar page.`, goto: "calendar" },
        { text: `Glance into the NOT YET tray.`, check: { skill: "sleight", diff: 13, id: "o_desk_tray", pass: "tray_pass", fail: "tray_fail" } },
        { text: `Sip at her water glass. (Eh.)`, goto: "water" },
        { text: `Leave the desk.`, end: true }
      ]
    },
    calendar: {
      speaker: "narrator",
      text: `A date-block calendar, one day to a page, in the Principal's precise round hand. Today: 07:30 — Check Voran (stage). 09:00 — Commissar's body, remove. 09:30 — Lt. K re: statement. 11:00 — Telephone, D. Warden's office, re: "the matter". 17:00 — ORTHODOXY (VORAN). 21:00 — Bell. 21:05 — Fresh start.\n\nAt the bottom of the page, a single word, underlined twice: CLEAN.`,
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "deduction", min: 4, text: `"Check Voran (stage)." She knew where you'd wake up. She knew you'd be on the stage. She had someone put you there. And "09:00 — Commissar's body, remove" was written before the body was found.`, effects: [{ set: "marr_calendar_seen", val: true }] },
        { skill: "dialectics", min: 3, text: `If the calendar entries were made after the fact, they would be in the past tense. They are in the imperative. The conclusion is not subtle: she planned the day.` }
      ],
      choices: [{ text: `Look at the desk again.`, goto: "a" }, { text: `Step away.`, end: true }]
    },
    tray_pass: {
      speaker: "narrator",
      text: `Your fingers dip, lift, and fall, a movement as fast as a sneeze. A form lies on top: Form 7-C, TERMINATION OF EMPLOYMENT (VOLUNTARY, BY DECEASED). Name: Ostrov Dane, Youth Commissar. Date: yesterday. Signature: his, quite perfect, or someone's. Witness: O. Marr. Reason: "Moral exhaustion."\n\nYesterday. Dated yesterday, which means signed before he died. Which means that on the afternoon of the day before his death, someone had already filled out the paperwork for his suicide.`,
      onEnter: [{ set: "marr_form_seen", val: true }, { xp: 3 }, { surv: 3 }, { note: "task_case", text: `In Marr's NOT YET tray: Form 7-C "voluntary termination by deceased", Ostrov's signature, dated the day before he died, witnessed by O. Marr. The suicide was paperwork before it was a death.` }, { sfx: "paper" }],
      choices: [{ text: `Step back from the desk before she notices.`, end: true }]
    },
    tray_fail: {
      speaker: "marr",
      text: `"The Not Yet tray," says Principal Marr, to the air, without lifting her head, "is for matters not yet ready to be known. It is a very private tray. I have only ever had one student try to read it." A dry pause. "He is a Warden's Commissioner now. In a sense."\n\nShe sets down her pen. She smiles. "I shall assume you were looking for a tissue."`,
      onEnter: [{ surv: 9 }, { morale: -1 }],
      choices: [{ text: `Retreat.`, end: true }]
    },
    water: {
      speaker: "narrator",
      text: `You lift the glass before you've decided to, and sip. Tepid, tasting of lemon and the faint chalky ghost of the Principal's lipstick. When you put it down there is a ring on the blotter and a silence in the office so exact that you can hear the clock deciding.\n\n"Hydration," says Principal Marr, "is such a virtue in the young. You'll want to remember that at five o'clock." She takes the glass back, wipes the rim, and drinks from the other side.`,
      onEnter: [{ surv: 2 }, { morale: 1 }],
      interjections: [{ skill: "appetite", min: 3, text: `Lemon! The slice! Fish it out! No? Fine. Just remember that someone in this room is eating better than the school.` }],
      choices: [{ text: `Retreat politely.`, end: true }]
    }
  }
},

// ===================== O_CABINET =====================
o_cabinet: {
  title: "The Records Cabinet",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `A steel cabinet bolted to the wall, forest-green, nine drawers tall and four wide, each labelled in a clerk's copperplate. A brass padlock, the size of a bun, holds the lot together. Over it hangs a sign: THE STUDENT IS KNOWN. THE STUDENT NEED NOT KNOW.\n\nMarr does not look up from her papers. She doesn't need to. The cabinet is entirely within the radius of her attention, like a house within a garden.`,
      interjections: [
        { skill: "archive", min: 3, text: `Drawer F: Faculty. Drawer S: Students (A–M) and (N–Z). Drawer R: Records of Incident. Drawer D: District Correspondence (CLOSED). Drawer O: Omissions. That last label is not found in any Union filing manual.` },
        { skill: "slip", min: 4, text: `The lock is a pin-tumbler of ordinary quality. The drawer runners are oiled. Someone opens this daily. If you go quickly and don't make the drawer cry out, you might get in with a few seconds to spare.` }
      ],
      choices: [
        { text: `Pick the padlock under cover of the Principal's lowered head.`, check: { skill: "slip", diff: 13, id: "o_cabinet_lock", pass: "open", fail: "caught" } },
        { text: `Ask Marr for the drawer to be opened.`, goto: "ask" },
        { text: `Leave it.`, end: true }
      ]
    },
    ask: {
      speaker: "marr",
      text: `"Open the cabinet?" She does not move, but the room does. "A student may consult their own file at any time by submitting Form 12, in triplicate, to my secretary. My secretary is on leave. She has been on leave for the last four years. I find it saves a great deal of unnecessary curiosity." A small smile. "You may of course wait for the Examination. Afterwards, one's file is generally considered... reviewed."\n\nIt is as polite a refusal as you have ever received, and it has the structural integrity of a wall.`,
      onEnter: [{ surv: 1 }],
      choices: [{ text: `Leave it. For now.`, end: true }]
    },
    caught: {
      speaker: "marr",
      text: `The padlock gives a small, irritated click and the Principal's head comes up like a periscope. "Do you know," she says, "I have never once locked this cabinet to keep a child out? I lock it to keep the children's files in. They have such a tendency to wander." She is smiling. She has a pen in one hand, and the way she holds it makes it look like an instrument. "Please. Step away."\n\nYou step away.`,
      onEnter: [{ surv: 11 }, { morale: -1 }],
      choices: [{ text: `Retreat.`, end: true }]
    },
    open: {
      speaker: "narrator",
      text: `The padlock falls open into your palm so politely you almost thank it. Behind you, Marr's pen continues its soft business. You ease open Drawer S and thumb through the files by touch until you find your own, a buff folder fat with the paper of eleven years: STUDENT VORAN, SEL. Perfect attendance. No incident. Three commendations for Exemplary Quiet. And on the inside cover, stamped in violet ink and initialled by a hand you recognise: OBSERVATION: PERSISTENT AUDITORY PHENOMENON ("RINGING"). SUBJECT RESISTANT TO DAILY HARMONIC EXPOSURE. RECOMMEND: MONITOR. DO NOT TREAT.`,
      onEnter: [{ set: "file_seen", val: true }, { xp: 3 }, { time: 10 }, { surv: 2 }, { note: "task_yesterday", text: `My file: "PERSISTENT AUDITORY PHENOMENON. SUBJECT RESISTANT TO DAILY HARMONIC EXPOSURE. RECOMMEND: MONITOR. DO NOT TREAT." So that is why I was chosen.` }],
      interjections: [
        { skill: "archive", min: 3, text: `Initialled "O.M." and "D.W." The second set belongs to the District Warden's office. The file has been to Tarnov's centre more than once. It has been read more times than you have.` },
        { skill: "empathy", min: 4, text: `Eleven years of being watched by people who knew exactly why you were different, and who chose to leave it that way. "Do not treat." They wanted to see what you would do with it.` }
      ],
      choices: [
        { text: `Check Drawer R: Incident Records.`, goto: "drawer_r" },
        { text: `Check Drawer D: District Correspondence.`, goto: "drawer_d" },
        { text: `Close it and walk away.`, end: true }
      ]
    },
    drawer_r: {
      speaker: "narrator",
      text: `Drawer R holds incident reports in pink folders. The most recent is dated three days ago: OSTROV DANE — REQUEST FOR ACCESS TO D9 RELAY LOGS (DENIED). Under it, a requisition slip for the Quartermaster's: ONE (1) LENGTH OF ROPE, JUTE, 6 M, FOR GYMNASIUM DRILLS — SIGNED, V. KELL. Under that, a second slip for the same rope, signed R. VANTAGE, dated two days later.\n\nTwo requisitions for the same rope in three days. One is a lie. You think you know which.`,
      onEnter: [{ xp: 2 }, { set: "marr_rope_slips", val: true }, { note: "task_case", text: `Records cabinet: Ostrov's request to see the D9 relay logs was DENIED three days ago. Two rope requisitions for the same rope, one signed Vasha, one Rhea.` }],
      choices: [{ text: `Back to the drawers.`, goto: "open" }]
    },
    drawer_d: {
      speaker: "narrator",
      text: `Drawer D is marked CLOSED, and has been closed with such enthusiasm that the hinges are bent. You pry it a finger's width and ease out the first thing that comes: a carbon-copy memorandum on District letterhead, the Warden's eye in the corner. SUBJECT: EVENING HARMONIC DOSAGE, SCHEDULE OF. It is signed by D.W.'s office and countersigned, four years ago, by O. Marr: "Understood. We shall ensure the children are comfortable."\n\nThe schedule is a table. Nights, minutes, intensities. It is called, in the fourth column, simply: AMNESIC FRACTION.`,
      onEnter: [{ xp: 3 }, { set: "marr_memo_seen", val: true }, { set: "knows_static", val: true }, { surv: 4 }, { thought: "th_bell_tolls" }, { note: "task_case", text: `A District memo, countersigned by Marr four years ago: "EVENING HARMONIC DOSAGE, SCHEDULE OF". Fourth column: AMNESIC FRACTION. It is proof of the Static, in the Principal's own filing cabinet.` }],
      interjections: [
        { skill: "dialectics", min: 3, text: `The Bell is a medicine. The medicine is an amnesic. The patients are the children. The doctor signed. Q.E.D. Do not enjoy it.` }
      ],
      choices: [{ text: `Close the drawer. Back away.`, goto: "open" }]
    }
  }
},

// ===================== O_WINDOW =====================
o_window: {
  title: "The Window",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The only window in the Principal's office is a tall sash of green-tinted glass, one pane cracked in a star. Through it the Courtyard lies like a painting of itself: the statue, the wet cobbles, the two loudspeaker poles. A janitor sweeping. A girl on a bench. From here the Principal can see the whole of the square, and the whole of the square can see nothing of the Principal except a green rectangle that looks, at a distance, like an eye.\n\nOn the sill, a dead moth, tidily arranged.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `A window is a wall that has lowered its eyes. She uses it to see you. You can use it to see her seeing. Try that: stand where she can't see you standing.` },
        { skill: "deduction", min: 4, text: `From this window you can see the back of the statue's plinth. The patched mortar with the pencil mark. The seam is clear as day from here. If she has binoculars in her desk, she has watched you open it before.` }
      ],
      choices: [
        { text: `Watch the Courtyard for a while.`, goto: "watch", effects: [{ time: 5 }] },
        { text: `Examine the cracked pane.`, goto: "pane" },
        { text: `Leave.`, end: true }
      ]
    },
    watch: {
      speaker: "narrator",
      text: `You stand in the green light and watch. Osk sweeps the same leaf into the same pile. Rhea Vantage stands against the east wall, perfectly still, and you could swear she is looking straight at the window, through the glass, at you. A child in a red scarf crosses the Courtyard at a run and stops dead when Rhea looks at him. A pigeon sits on the Warden's Father's nose.\n\nThe afternoon moves on in small bits of light. From here the school looks smaller, and also, somehow, more like a place you could understand.`,
      onEnter: [{ xp: 1 }, { morale: 1 }],
      interjections: [
        { skill: "instinct", min: 4, text: `Marr hasn't looked up once. But the pen has stopped. She is listening to you watching.` }
      ],
      choices: [{ text: `Step away from the window.`, end: true }]
    },
    pane: {
      speaker: "narrator",
      text: `The crack is a star, perfectly centred, with a tiny round hole at its heart, the sort of neat dent that no football makes. A thin white line of dust trails from it toward the floor. You crouch and sight along it. The line points at the dusty gap behind the bookshelf, and from there, if you squint, at nothing at all.\n\n"A bullet," says the dryest part of your mind, "or a very determined nail." It is not clear which of those would be worse.`,
      onEnter: [{ xp: 1 }],
      interjections: [
        { skill: "senses", min: 5, text: `Faint, old, cordite. Not this year. Maybe not this decade. A shot was fired at this window, from outside, at a person at the desk. The desk had a different Principal then.`, once: true }
      ],
      choices: [{ text: `Leave it.`, end: true }]
    }
  }
},

// ===================== MARR =====================
marr: {
  title: "Principal Odalys Marr",
  start: [
    { cond: "flag.osk_scapegoat && !has('warden_badge')", node: "reward" },
    { cond: "flag.exam_done && flag.exam_passed", node: "after_exam" },
    { cond: "flag.exam_done", node: "after_fail" },
    { cond: "flag.marr_audience", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: {
      speaker: "narrator",
      text: `Principal Odalys Marr takes off her glasses, folds them, and lays them on the blotter with the accuracy of a woman placing a knife beside a plate. Without them her face is smaller, paler, and more exact. She might be fifty or sixty-five. She might be a very good drawing of a principal. The room is so quiet that her pearl earrings seem to be ringing.\n\n"Sit," she says. "No, the other chair. That one has a short leg. I keep it for visitors who would like to feel what it is to be uncertain."`,
      onEnter: [{ set: "marr_audience", val: true }, { surv: 1 }],
      interjections: [
        { skill: "authority", min: 5, text: `She has chosen the chair for you. She has chosen the lamp's angle. She has chosen the temperature. She is giving you nothing that she has not already decided you will do with it. Take the short-legged chair. Sit in it like a throne.` },
        { skill: "doublethink", min: 3, text: `Isn't she lovely? Isn't it a comfort to be looked after by someone who knows where everything goes? You could tell her everything. She'd put it all in the right drawer. Go on. Put it all in the right drawer.`, effects: [{ surv: -1 }] },
        { skill: "empathy", min: 4, text: `She is not enjoying this. That's what's chilling. A cruel person would be easier. She does this with the quiet satisfaction of a gardener, who does not hate the weeds.` }
      ],
      choices: [
        { text: `Sit in the short-legged chair.`, goto: "tea" },
        { text: `Remain standing. "I'll stand, Principal."`, goto: "stand", effects: [{ xp: 1 }, { surv: 2 }] }
      ]
    },
    stand: {
      speaker: "marr",
      text: `"Of course." She lets it go with enormous grace. "Standing is also a posture of the loyal. Though I find in my experience that students who stand tend to be the ones planning to leave." A gentle pause. "Never mind. I am sure you are only tired. May I offer you something? A glass of water. Lemon is a rare luxury and I like to share it where I can."\n\nShe doesn't wait for your answer. A glass appears at the edge of the blotter.`,
      choices: [{ text: `Take the glass.`, goto: "hub" }, { text: `Decline politely.`, goto: "hub", effects: [{ xp: 1 }] }]
    },
    tea: {
      speaker: "marr",
      text: `The chair rocks, a short, humiliating tick. You have to hold your knees to stay level. She watches you do it, and nods, as if the test had a right answer and you had found it. "Good. Everyone wobbles. The trick is to look as though you meant to."\n\nShe taps her fingers, once, twice, on the desk. "Now. I have had a very unpleasant morning, and I should like to make it a little less so. You are a sensible young person. You will help me."\n\nIt's not a question. Her voice is so soft that you lean forward to catch it, and notice that this is what it's for.`,
      onEnter: [{ surv: 1 }],
      choices: [{ text: `"I'll do what I can, Principal."`, goto: "hub", effects: [{ surv: -2 }] }, { text: `"With what, exactly?"`, goto: "hub" }]
    },
    hub: {
      speaker: "marr",
      text: `"Do go on," says Principal Marr. She has put her glasses back on, and behind them her eyes are like two small clean rooms. "I find that students always come to me with something they would rather say than think. The Examination is at five. Until then, everything is a conversation. After five, everything is on the record. Choose your hour."`,
      interjections: [
        { skill: "composure", min: 4, text: `Her fingers have found the pen again. Whenever you say something real, the pen turns a quarter-turn. She is writing in her head. Say nothing you wouldn't want to see on paper.` }
      ],
      choices: [
        { text: `"I'd like to ask about Commissar Dane."`, goto: "ostrov" },
        { text: `"What should I expect from the Examination?"`, goto: "exam_info", cond: "!flag.exam_done" },
        { text: `"I'm ready to take the Examination."`, dialogue: "exam", cond: "time >= 1020 && !flag.exam_done" },
        { text: `"I wish to confess something, Principal."`, goto: "confess", cond: "!flag.marr_confessed" },
        { text: `"Is there anything I could do to... make things easier for myself?"`, goto: "bribe" },
        { text: `Offer her the sweet roll.`, goto: "roll", cond: "has('sweet_roll') && !flag.marr_softened", once: true },
        { text: `"What is the Bell, Principal?"`, goto: "bell", cond: "flag.knows_static" },
        { text: `Lay Form 7-C on the blotter.`, goto: "form", cond: "flag.marr_form_seen && !flag.marr_form_used" },
        { text: `Quote the District memorandum back to her.`, goto: "memo", cond: "flag.marr_memo_seen && !flag.marr_memo_used" },
        { text: `"I think I know who did it."`, dialogue: "accuse", cond: "flag.body_examined || flag.osk_seen_you || flag.knows_rhea" },
        { text: `"Thank you, Principal."`, end: true }
      ]
    },
    ostrov: {
      speaker: "marr",
      text: `"Ostrov." She says his given name tenderly, the way you handle a fine vase after it has been broken. "A tragedy, of course. A gifted man, perhaps too gifted for his post. He worked until he couldn't. He saw plots in the plaster. I begged him to take leave. He said, 'Odalys, there is no leave from the truth.' I am afraid that, in the end, the truth was not sufficiently grateful."\n\nShe takes a small handkerchief from her sleeve, looks at it, and returns it unused. "The finding will be: an unstable man, an unfortunate impulse. It requires only that nobody complicates it. You will not complicate it, I think."`,
      interjections: [
        { skill: "deduction", min: 4, text: `"The finding will be." Future tense. An inquest conducted on the evening of the death, with its verdict drafted before breakfast. The machinery is running on rails.` },
        { skill: "rhetoric", min: 5, text: `Oh, you could shred this. "Unstable"? "Plots in the plaster"? A man who writes a ledger isn't unstable, he's methodical. Say it. Say it and see her smile.`, effects: [] }
      ],
      choices: [
        { text: `"Of course I won't complicate it."`, goto: "hub", effects: [{ surv: -4 }, { ideo: "vanguard", n: 1 }] },
        { text: `"The rope was staged, Principal."`, goto: "ostrov_push", cond: "flag.clue_rope" },
        { text: `"What was he working on?"`, goto: "ostrov_work" }
      ]
    },
    ostrov_work: {
      speaker: "marr",
      text: `"Curriculum," says Principal Marr, with perfect serenity. "Boring, wonderful curriculum. Student morale. Attendance statistics. Nothing a young person would remember." She turns the pen a quarter. "There was a matter of... some correspondence with the District Relay Office. I am told he wished to examine our broadcast logs. A harmless interest, I am sure. But the logs are the District's, not the school's."\n\nShe smiles. "He was refused. Politely. I signed the refusal myself."`,
      onEnter: [{ xp: 1 }, { set: "marr_relay_refusal", val: true }, { note: "task_case", text: `Marr admits she signed the refusal of Ostrov's request to see the D9 relay logs.` }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    ostrov_push: {
      speaker: "marr",
      text: `The pen stops. "Staged," she repeats, tasting the word. "A word with a certain theatre to it. You have been in the Old Theatre, I believe. I wonder whether you are confusing the two buildings." She doesn't raise her voice. She lowers it, until you have to hold your breath to hear.\n\n"I am going to forget you said that. I am extremely good at it. It is the one talent the District Warden values above all others in me. But I can only forget it once."`,
      onEnter: [{ surv: 9 }, { xp: 1 }],
      interjections: [{ skill: "instinct", min: 4, text: `That wasn't a threat. That was a courtesy. It's worse. A threat you can argue with.` }],
      choices: [{ text: `"Understood, Principal."`, goto: "hub" }, { text: `"Don't be so sure I'll forget."`, goto: "defy", effects: [{ surv: 12 }, { ideo: "undercurrent", n: 1 }] }]
    },
    defy: {
      speaker: "marr",
      text: `For the first time, she looks at you rather than at the space you occupy. It is a patient, assessing look, the one a good farmer gives a calf with a mind of its own. "Ah," she says. "There you are. The boy in the file." A small movement of her mouth, which in anyone else would be affection. "I had wondered whether you had any of him left. It's delightful, really. It will make tonight so much more interesting."\n\nShe goes back to her papers. You are, apparently, finished.`,
      onEnter: [{ morale: 1 }],
      choices: [{ text: `Hold your ground.`, goto: "hub" }, { text: `Leave.`, end: true }]
    },
    exam_info: {
      speaker: "marr",
      text: `"Think of it as a chat." She slides a thin brown booklet across the blotter: ORTHODOXY: A GUIDE FOR THE YOUNG CITIZEN, 14TH REVISED EDITION. "Read the passages marked in red. Do not read the ones marked in green. They are for the Examiner. Come at five o'clock sharp, with clean hands and an open face. The written paper is about the Catechism. The oral is about you."\n\nShe leans back. "I will ask you, I think, three questions. I will not tell you the third."`,
      onEnter: [{ give: "exam_booklet" }, { task: "task_exam", state: "active" }, { xp: 1 }],
      interjections: [
        { skill: "rote", min: 3, text: `Red passages: the Catechism, the Creed of the Quiet Child, the Eleven Thanks. You know them like your own fingers. Green passages: you don't know. Nobody does. That is rather the point.` }
      ],
      choices: [{ text: `Take the booklet. Back.`, goto: "hub" }]
    },
    confess: {
      speaker: "marr",
      text: `Principal Marr's whole body does something small and graceful: it settles, like a cat deciding to stay. "Ah. Confession." She opens a drawer and takes out a pad on which the word CONFESSIONS is printed at the top, with a column for each year of the Warden's reign. "It is the bravest thing a young person can do. I do hope you've saved up something worthwhile."\n\nThere is a long, tender pause. "Begin where it feels natural."`,
      onEnter: [{ set: "marr_confessed", val: true }],
      choices: [
        { text: `Confess to a small sin. (Stealing sweets; missing Catechism once.)`, goto: "confess_small", effects: [{ surv: -5 }, { ideo: "quiet", n: 1 }] },
        { text: `Offer a name instead.`, goto: "inform" },
        { text: `Confess to nothing. "Never mind."`, goto: "confess_none" }
      ]
    },
    confess_small: {
      speaker: "marr",
      text: `You say it. It feels like dropping a coin into a very deep well. She writes it down, thorough and small, then blots it with a pad as soft as snow. "Thank you. That was easy, wasn't it? Isn't it extraordinary how easy it is? One imagines these things will be so terrible, and then it is only a small noise in a quiet room."\n\nShe smiles with real warmth. "I'm going to be kind to you, {name}. I want you to know that I'm capable of it. It's a quality I keep for the cooperative."`,
      onEnter: [{ morale: -1 }, { xp: 1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `There. Doesn't that feel better? Clean. Light. As though you had washed. This is what the Union gives its children: the gift of having nothing left to hide. Let it be done.`, effects: [{ surv: -2 }] },
        { skill: "volition", min: 4, text: `You've just told her where you're soft. You'll have to remember that it was you who showed her.` }
      ],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    confess_none: {
      speaker: "marr",
      text: `"Of course." She returns the pad to its drawer with exactly the care she took in taking it out. "There's no pressure. There is only an expectation, and it will wait. It has endless patience, the expectation. It's the thing about me that most students find difficult to forgive."`,
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    inform: {
      speaker: "marr",
      text: `"A name." She is almost shy. She takes out another sheet. "Not for punishment, you understand. For care. A student who is slipping out of line is a student in trouble, and we should like to know before the trouble arrives. You see a great deal, being quiet. Who is it that sits in the Hall too late? Who feeds whom? Who talks to which child on which stairs?"\n\nHer pen hovers. "A name is an act of love."`,
      interjections: [
        { skill: "solidarity", min: 3, text: `We know what a name is. A name is a hand taken off a shoulder. We don't give them. We don't! Not for sweets, not for stamps, not for love. We keep the circle.` },
        { skill: "doublethink", min: 4, text: `It's only paperwork. It's only a check on a list. The people whose names go on it will be given kindly attention. You are doing them a favour. Say a name.` }
      ],
      choices: [
        { text: `Name Bronka, the cook. ("She hands out bread notes.")`, goto: "inform_b", effects: [{ surv: -10 }, { ideo: "vanguard", n: 2 }] },
        { text: `Name Ilsabet Orrin. ("She's got a radio.")`, goto: "inform_i", effects: [{ surv: -10 }, { ideo: "vanguard", n: 2 }] },
        { text: `"I've just remembered I have nothing to say."`, goto: "refuse_inform", effects: [{ ideo: "undercurrent", n: 1 }, { xp: 2 }] }
      ]
    },
    inform_b: {
      speaker: "marr",
      text: `The pen scratches. "Bread," says Principal Marr. "Of course it is bread. It is always bread." She doesn't look up. "She will be spoken to. Nothing dramatic. A change of duty. A smaller kitchen. You were very right to tell me; the longer these things grow in the dark, the thicker the root."\n\nShe finishes the line and puts a tiny tick against it. It is the neatest murder you have ever seen.`,
      onEnter: [{ set: "marr_informed_bronka", val: true }, { morale: -3 }, { toast: `You named Bronka. It cannot be unsaid.` }],
      interjections: [{ skill: "empathy", min: 2, text: `There. You did it. Now you will have to look at her ladle for the rest of your life.` }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    inform_i: {
      speaker: "marr",
      text: `The pen scratches. "A wireless," says Principal Marr, with infinite regret. "How lonely. How reckless. Children who build radios are children who want to hear a different voice than the ones we've provided. We shall find them one. Her mother, I think, is a sensible woman."\n\nShe finishes the line and puts a tiny tick against it. "You were right to come. I do hope you can sleep."`,
      onEnter: [{ set: "marr_informed_ilsabet", val: true }, { morale: -3 }, { toast: `You named Ilsabet. It cannot be unsaid.` }],
      interjections: [{ skill: "empathy", min: 2, text: `A girl in a wheelchair, with a book on her lap and a crystal set in her cardigan. You gave her up for a number on a gauge. Hold that.` }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    refuse_inform: {
      speaker: "marr",
      text: `"Ah." The pen is returned to its tray. "I admire it, really. Reticence is such a rare virtue. I shall remember that you hesitated. People who hesitate are either very moral or very stupid, and I have found it useful, over the years, to keep both on file."\n\nShe doesn't seem angry. That is, once again, the problem.`,
      onEnter: [{ surv: 3 }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    bribe: {
      speaker: "marr",
      text: `"Make things easier." She says it slowly, as if holding the phrase up to the light. "My dear, I am the Principal. Ease is my only product." She opens a drawer and takes out a small cream card embossed with a bell. "A Letter of Good Standing. It would go on your file. Should you be questioned by the Vanguard, or the District, or any official with a stamp, it would say: this child is in order."\n\n"The price is trivial. A small favour. At the Examination, you will agree with me. Whatever I ask. Without hesitation."`,
      interjections: [
        { skill: "rhetoric", min: 4, text: `Look at that: a bribe that is also a trap. She is selling you immunity in exchange for the thing she wants most: your consent in advance. You have never been offered a worse good deal.` },
        { skill: "authority", min: 3, text: `You can't bargain with someone who owns the table. But you can leave it with your hands in your pockets.` }
      ],
      choices: [
        { text: `Accept the Letter of Good Standing.`, goto: "accept_letter", effects: [{ surv: -12 }, { ideo: "vanguard", n: 2 }, { set: "marr_letter", val: true }] },
        { text: `"I'd prefer to earn it."`, goto: "hub", effects: [{ xp: 1 }] },
        { text: `"No."`, goto: "hub", effects: [{ surv: 3 }, { ideo: "undercurrent", n: 1 }] }
      ]
    },
    accept_letter: {
      speaker: "marr",
      text: `She slides the card across with two fingers. It has a nice weight, creamy, with a faint rosewater smell. In small gold script: THE BEARER IS IN ORDER. Below it, the Principal's signature, and a seal in the shape of a bell.\n\n"There," she says. "Now you belong to the school." It sounds, from her mouth, like the cleanest and most final word in the language. "Be at the Examination at five. I shall be there. I shall, I think, be very proud."`,
      onEnter: [{ morale: -1 }, { xp: 1 }],
      interjections: [{ skill: "volition", min: 3, text: `You can still tear it. Tear it later. Keep it for the moment you need to be believed, and tear it after.` }],
      choices: [{ text: `Pocket the Letter. Back.`, goto: "hub" }]
    },
    roll: {
      speaker: "narrator",
      text: `You put the sweet roll on the blotter. It is slightly squashed, glazed in sugar, and sits there, a small gold insult to the whole green office. Marr looks at it for a very long time. The pen stops. Her face does something you've never seen on it: it fails.\n\n"Where," she says, in an extremely small voice, "did you get that?"\n\nFor three seconds, Principal Marr is an eight-year-old at the edge of a table, looking at the one thing she has been taught not to want.`,
      onEnter: [{ take: "sweet_roll" }, { set: "marr_softened", val: true }, { xp: 3 }],
      interjections: [{ skill: "empathy", min: 3, text: `Take your time. Do not smile. She is not a monster at this moment, and monsters are terrified of those moments.` }],
      choices: [{ text: `"Take it. It's yours."`, goto: "softened" }]
    },
    softened: {
      speaker: "marr",
      text: `She eats it with her back to you, facing the window, in four careful bites. When she turns, her face is arranged again, but the arrangement is a little crooked, like a picture hung by someone in a hurry. "It has been," she says, "a long time since I was given something that was not a report." She dabs a crumb from her lip. "I don't make decisions, {name}. I execute them. Nobody has ever told me that before I'm allowed to say so."\n\n"The Bell is not mine. I keep the key. That's all I have ever done. It is what the District asked."`,
      onEnter: [{ set: "marr_admits_bell", val: true }, { set: "knows_static", val: true }, { xp: 2 }, { note: "task_case", text: `Marr, softened by a sweet roll: "The Bell is not mine. I keep the key. That is what the District asked." She is a keeper, not an author.` }],
      choices: [{ text: `"Then help me."`, goto: "plead" }, { text: `Say nothing. Let it sit. Back.`, goto: "hub" }]
    },
    plead: {
      speaker: "marr",
      text: `"Help you." Her smile is entirely different, thin and sorry. "My dear child, that is the one thing I cannot do. If I help you, I stop being the person they trust to keep the key. They give it to someone else. Someone who will use it less gently." She puts her glasses on. The softness folds away, drawer by drawer.\n\n"Take the sweet roll as the price of a true sentence. You'll not get another. Five o'clock."`,
      onEnter: [{ surv: 2 }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    bell: {
      speaker: "marr",
      text: `"The Bell." Principal Marr arranges her hands. "A national treasure. A lullaby. A sleep aid, which a certain generation requires in this stressful age." She doesn't blink. "You are wondering whether it does more than that. It does. It protects. It prevents a certain accumulation. We call it Harmony."\n\n"If you are asking whether it hurts, the answer is no. If you are asking whether it helps, the answer is yes. If you are asking whether you may speak of it, the answer is as follows." She lets the silence do the answering.`,
      interjections: [
        { skill: "rhetoric", min: 4, text: `"A certain accumulation." Of what? Of memory. She's calling remembrance a pathology, and remembering a disease. Do you want to argue? She would enjoy it. She'd enjoy losing, a little.` },
        { skill: "instinct", min: 5, text: `Leave now. She has told you more than she intended and it was not an accident. Whatever she says next will be written down.` }
      ],
      choices: [
        { text: `"What happens to people who speak of it?"`, goto: "threat" },
        { text: `"I understand, Principal."`, goto: "hub", effects: [{ surv: -3 }] }
      ]
    },
    threat: {
      speaker: "marr",
      text: `"Oh, nothing happens," says Principal Marr, genuinely amused. "That's what is so charming. Nothing at all. They simply... are not quite themselves. A child is found wandering at 2 a.m. in a nightshirt, announcing an engineering diagram. A teacher drowns in a bath. A mother's ration card is mislaid, and then, by a happy coincidence, found in the wrong district. Small kindnesses, but cumulative."\n\n"Your mother, I believe, has a heart condition. Her tablets come on Thursdays. How is her supply?"\n\nThe pen has not moved. She has not once raised her voice.`,
      onEnter: [{ surv: 10 }, { morale: -2 }],
      interjections: [
        { skill: "grit", min: 5, text: `Stand. Your knees are made of water and your mouth is full of dust. Stand like a pillar. She is not stronger than you. She is only better informed.` },
        { skill: "composure", min: 5, text: `Not a flicker. If she sees you flinch, she will never let go of the place she touched.` }
      ],
      choices: [{ text: `"Thank you for your concern."`, goto: "hub", effects: [{ xp: 1 }] }, { text: `Stare at her, breathing hard. Say nothing. Go.`, end: true }]
    },
    form: {
      speaker: "narrator",
      text: `You lay Form 7-C on the green blotter, slowly, the way you would lay down a card you know can't win but must be seen to be played. Marr looks at it. Marr looks at you. A clock somewhere clears its throat. "Where," she says, so softly the paper almost moves, "did this come from?"`,
      onEnter: [{ set: "marr_form_used", val: true }],
      choices: [
        { text: `"It's dated the day before he died. You witnessed it."`, check: { skill: "rhetoric", diff: 13, id: "marr_form", pass: "form_pass", fail: "form_fail" } },
        { text: `Say nothing. Let it speak.`, check: { skill: "composure", diff: 14, id: "marr_form_quiet", pass: "form_pass", fail: "form_fail" } }
      ]
    },
    form_pass: {
      speaker: "marr",
      text: `Principal Marr looks at the form the way a gardener looks at a weed that has come up in the one bed she'd thought was cleared. She is perfectly still. After a long time she says, with an exhale that sounds like a lock turning: "Paper is only paper. One writes it ahead of time to save the effort afterward. It is not unusual. It is ... efficiency."\n\n"But you have found it, and so you are, you see, dangerous. I shall have to decide whether to find you useful." She smiles, and this smile is not meant to comfort. "Think about what you would like to be."`,
      onEnter: [{ xp: 3 }, { set: "marr_form_confirmed", val: true }, { surv: 6 }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    form_fail: {
      speaker: "marr",
      text: `"A form," she says, with enormous gentleness. "Yes. A form. It is a lovely form. I have signed forty thousand of them. May I?" She takes it between two fingers, folds it once, twice, a third time, and drops it into the small stove beside her desk. The paper curls, blackens, and goes. "Thank you for bringing it to my attention. I do like to be told of errors in the file."\n\nThe office smells for a moment of burnt starch.`,
      onEnter: [{ surv: 8 }, { morale: -2 }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    memo: {
      speaker: "narrator",
      text: `You recite the heading from memory: EVENING HARMONIC DOSAGE, SCHEDULE OF. The fourth column. The countersignature. You watch her listening to herself being quoted. It's like watching a cat watch its own shadow. She puts her pen down at last.\n\n"Well," says Marr. "Well, well."`,
      onEnter: [{ set: "marr_memo_used", val: true }, { surv: 6 }],
      choices: [{ text: `"AMNESIC FRACTION. You knew, Principal."`, goto: "deal" }]
    },
    deal: {
      speaker: "marr",
      text: `"Knew." She sits back. "My dear boy, I have always known. Knowing is my entire function. The question, now, is what you propose to do about the fact that I know that you know." She folds her hands. "I could have you in a cell by seven. I could have your mother in the same cell by eight. And I would be sorry, but I would do it."\n\n"Or you could be sensible. Name me a culprit by five. Give the Commissar's death a face I can put in a file. Janitor, Vantage, a stray; I'm not particular. Give me that, and I will find that this conversation never took place. I will even give you a badge."\n\nHer eyes are quiet. "Choose carefully. But choose."`,
      onEnter: [{ set: "marr_deal_offered", val: true }, { note: "task_case", text: `Marr offered me a deal: name a culprit by five and she will forget everything, plus a badge. Otherwise: a cell by seven, and my mother by eight.` }],
      interjections: [
        { skill: "doublethink", min: 3, text: `A fair offer. Better than most. You'd be in the wall. Isn't the wall warm? Say yes. Say it for your mother.`, effects: [{ surv: -2 }] },
        { skill: "solidarity", min: 4, text: `She is threatening a woman with a heart condition to make a boy name a stranger. And she thinks it is a negotiation. We have seen this before, many times. It always ends with somebody in a cell. It's rarely the Principal.` }
      ],
      choices: [
        { text: `"I'll think about it."`, goto: "hub" },
        { text: `"I'll give you a name. At the right time."`, goto: "hub", effects: [{ surv: -4 }, { ideo: "vanguard", n: 1 }] },
        { text: `"No. You'll have to arrest me."`, goto: "defy", effects: [{ surv: 15 }, { ideo: "undercurrent", n: 2 }, { xp: 2 }] }
      ]
    },
    reward: {
      speaker: "marr",
      text: `Principal Marr rises as you enter, which she has never done for a student. In her hand: a small enamel badge, the Warden's profile in brass, a pin on the back. "The Janitor has confessed," she says, with a warmth that does not reach her pearls. "He is being very cooperative. They always are, once they understand that cooperating is a kindness to everybody. Including themselves."\n\nShe fastens the badge to your lapel. Her fingers are cool and dry and extremely steady. "You did a difficult thing. It will, I promise, get easier. That is the Union's great gift to us all."`,
      onEnter: [{ give: "warden_badge" }, { surv: -10 }, { ideo: "vanguard", n: 2 }],
      interjections: [
        { skill: "empathy", min: 3, text: `The pin goes through the cloth and a little into the skin. A bead of blood. She doesn't apologise. She never will.` }
      ],
      choices: [{ text: `Stand very straight. "Thank you, Principal."`, goto: "hub" }]
    },
    after_fail: {
      speaker: "marr",
      text: `Principal Marr is writing. She does not look up. "Ah. The late bloomer," she says, in the voice she uses for weather. "Remedial students are such a comfort. They give the rest of the school something to measure itself against." The pen scratches. "You will find the gate open from now. Go home. Rest. I shall see you in the morning, when the Bell has made us all friends again."\n\nShe adds, to the paper rather than to you: "If there is anything you wish to say, say it now."`,
      choices: [
        { text: `"I think I know who did it."`, dialogue: "accuse", cond: "flag.body_examined || flag.osk_seen_you || flag.knows_rhea" },
        { text: `Speak freely.`, goto: "hub" },
        { text: `Leave.`, end: true }
      ]
    },
    after_exam: {
      speaker: "marr",
      text: `Principal Marr is writing. She does not look up. "Ah. The model student," she says, in the voice she uses for weather. "You will find the gate open from now. I would recommend a good meal and an early night. Tomorrow is a fresh page."\n\nShe adds, to the paper rather than to you: "If there is anything you wish to say, say it now. After the Bell, I'm afraid, it all becomes very difficult to say."`,
      interjections: [
        { skill: "doublethink", min: 3, text: `It's all over now, isn't it? You've done the hard part. Go home. Go to bed. Let the Bell tuck you in.`, effects: [{ surv: -1 }] }
      ],
      choices: [
        { text: `"I think I know who did it."`, dialogue: "accuse", cond: "flag.body_examined || flag.osk_seen_you || flag.knows_rhea" },
        { text: `Speak freely.`, goto: "hub" },
        { text: `Leave.`, end: true }
      ]
    }
  }
},

// ===================== ANKA =====================
anka: {
  title: "Mother Anka",
  start: [
    { cond: "flag.ledger_with_anka", node: "after" },
    { cond: "talked('anka') > 0", node: "hub" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    intro: {
      speaker: "anka",
      text: `"Brodsky, Anka. Chemistry, retired. Dismissed for 'excessive curiosity', which is a charge that has, I'm told, no statute attached. They call me Mother Anka down here, and I have long since stopped correcting them, as there are worse things to be called, and I've been called most of them." She taps ash into a saucer. "You're {name} Voran. Quiet boy. Persistent ringing in the ears. You came to my door at midnight last night with a flag in your arms and a face like a window in winter, and then you refused to come in."\n\n"I should like to know why. But first: have you eaten?"`,
      onEnter: [{ set: "anka_met", val: true }, { task: "task_anka", state: "active" }],
      interjections: [
        { skill: "empathy", min: 3, text: `She asked about food first. That's the habit of someone who has had many frightened children in her kitchen. She has already decided that you are one more.` },
        { skill: "archive", min: 4, text: `Anka Brodsky. Chair of Chemistry, School No. 9, twenty-six years. Dismissed seven years ago under Decree 112, "disruptive inquiry". The staff register lists her as deceased. She is, however, sitting in a chair, smoking.` }
      ],
      choices: [
        { text: `"I haven't, actually."`, goto: "tea" },
        { text: `"I don't remember coming here."`, goto: "last_night" },
        { text: `"Who are you really?"`, goto: "cell" }
      ]
    },
    tea: {
      speaker: "anka",
      text: `She pushes a tin plate across the table: black bread, two slices of something that was once sausage, and a pickle. The tea is already poured. It is, you discover, real tea, strong and honest, with no cloves in it. "Eat. The Static makes you hungry, afterward. Your body knows it has been robbed and wants to be paid back in calories."\n\nShe watches you chew with a satisfaction that has nothing political in it at all.`,
      onEnter: [{ hp: 2 }, { morale: 2 }, { set: "anka_fed", val: true }, { time: 5 }],
      interjections: [{ skill: "appetite", min: 3, text: `PICKLE. Real pickle. Not the grey ration kind. This is a gift. Do not underestimate a pickle.` }],
      choices: [{ text: `Thank her. Ask your questions.`, goto: "hub" }]
    },
    hub: {
      speaker: "anka",
      text: `Mother Anka folds her hands. She does so with the economy of someone who has never been paid by the hour. The boiler mutters; a pipe above you clanks, and a small cloud of dust descends on the table like an unnecessary blessing. "You have questions. Good. A child with no questions is a child already filed. Ask them in order of fear."`,
      choices: [
        { text: `"What is the Static?"`, goto: "static" },
        { text: `"What did I do last night?"`, goto: "last_night" },
        { text: `"Who are the Undercurrent?"`, goto: "cell" },
        { text: `"What do I do with the Ledger?"`, goto: "ledger_talk", cond: "has('ledger')" },
        { text: `"I don't have a ledger. Where is it?"`, goto: "where", cond: "!has('ledger') && !flag.found_ledger" },
        { text: `"What about broadcasting it? Over the PA?"`, goto: "radio", cond: "has('ledger') || flag.knows_static" },
        { text: `"Who killed the Commissar?"`, goto: "who_killed" },
        { text: `"Ostrov was a friend of yours?"`, goto: "ostrov_anka" },
        { text: `"What do you want from me?"`, goto: "want" },
        { text: `"I'll come back."`, end: true }
      ]
    },
    static: {
      speaker: "anka",
      text: `"The Static." She smiles, thin, a smile for a very old joke. "Every night at nine, a bell. Then a choir. The bell is not a bell, strictly: it is a tone, with a second tone hiding behind it, a few hertz apart. When the two beat against each other, the sound is pleasant. When the beat enters the ear, it interferes with the thing that turns the day into memory. It does not erase. It smudges. The last few hours before the Bell become... fog. By morning, you remember that you had a day, but not what was in it."\n\n"Everyone has it. We call it the Static. Nobody says why. Nobody says anything. That is the other half of the machine."`,
      onEnter: [{ set: "knows_static", val: true }, { xp: 3 }, { thought: "th_bell_tolls" }, { thought: "th_closed_window" }],
      interjections: [
        { skill: "dialectics", min: 3, text: `Premise: the Bell is nightly. Premise: memory degrades in its wake. Premise: the District knows. Conclusion: the nation is a school where the lessons are deleted at lights-out. Q.E.D. Don't enjoy it.` },
        { skill: "empathy", min: 4, text: `Under the dry explanation, she has held a child who woke up screaming. She has done the arithmetic of a country of lost afternoons. Her voice is level only because she has practised.` },
        { skill: "senses", min: 4, text: `You've felt it. The little blurred place at the back of every evening, like a thumb-smear on a lens. You assumed it was your own failing.` }
      ],
      choices: [
        { text: `"Why am I different?"`, goto: "static2" },
        { text: `"Who gave the order?"`, goto: "static3" },
        { text: `Back.`, goto: "hub" }
      ]
    },
    static2: {
      speaker: "anka",
      text: `"Your ears." She points a cigarette at you. "Tinnitus, from a childhood fever, I would guess. You have a constant tone of your own. The Bell's beat needs a clean ear to fold into. Yours is already occupied. A small mercy of biology, and an enormous nuisance to the Principal, who has been told for years that you were 'resistant' and has made no move to cure it." She exhales. "They like to watch what resistance does. The Commissar found you in the files and thought: there is a courier."\n\n"He was a clever man. He was also, I'm afraid, a man who liked to be right. Those are different qualities, and one of them kills."`,
      onEnter: [{ set: "anka_explained_ringing", val: true }, { xp: 2 }],
      choices: [{ text: `Back.`, goto: "static" }, { text: `"Thank you. Enough for now."`, goto: "hub" }]
    },
    static3: {
      speaker: "anka",
      text: `"The District Warden's office. The Relay Office on Cinder Street. Every school has a relay, every relay a key. Ours is held by the Principal." She shrugs. "I used to think it was malice. After a while I found it was a kind of ambition. The aim was a population that could not hold a grudge: a perfect forgiveness, imposed. Even the people who built it half believe in it. That is how bad ideas survive, {name}. Someone sincere always operates them."`,
      onEnter: [{ xp: 1 }],
      choices: [{ text: `Back.`, goto: "static" }]
    },
    last_night: {
      speaker: "anka",
      text: `"You came at midnight. Wet through. You had the Commissar's Ledger under your arm, wrapped in a flag, and you stood at that door for perhaps four minutes, saying nothing. I opened it. You said, quite calmly, 'Not yet. They're listening. I'll hide it first and come back.' And you went. That was the last I saw of you until this morning.\n\nI sent a word to Cook, in the bread. I waited all night. When the Bell rang I put my hands over my ears and thought of you, wherever you were, and hoped that whatever you'd hidden was somewhere cold, and dry, and deep."`,
      onEnter: [{ set: "anka_told_midnight", val: true }, { xp: 2 }, { note: "task_yesterday", text: `Anka: I came to her door at midnight with the Ledger, said "Not yet. They're listening. I'll hide it first and come back." Then I hid it and the Bell wiped me.` }],
      interjections: [
        { skill: "volition", min: 4, text: `You decided that, in the dark, with the whole night ahead. You weighed the risk and the room and chose the delay. Whoever that was is also you. Let them have some credit.` },
        { skill: "empathy", min: 3, text: `"Wherever you were." She didn't ask where. That is how she knows how the Static works: she knows that you might not know, and she does not want to make you feel it.` }
      ],
      choices: [{ text: `"Then it's hidden. I have to find it."`, goto: "where" }, { text: `Back.`, goto: "hub" }]
    },
    where: {
      speaker: "anka",
      text: `"I'm afraid I can't help you find it. I don't know where you put it, which is exactly why you put it there." She smiles, genuinely. "You left yourself notes, I'd wager. A clever boy leaves notes. The Static takes the hours, not the handwriting. Look in the places you'd have been: the Old Theatre. The gym. The Courtyard. And mind the old men with brooms. They notice what the rest of us are too busy to see."\n\n"When you've found it, bring it down here. Bring it gently. It is heavier than it looks."`,
      onEnter: [{ xp: 1 }, { note: "task_ledger", text: `Anka says: look in the places I'd have been. Notes in my own hand. And the old men with brooms.` }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    cell: {
      speaker: "anka",
      text: `"The Undercurrent." She sips her tea. "A nice name. It was Ostrov's. I would have called us The Plumbers. We are eleven, by last count: myself, Cook Bronka, two teachers, a boy in the Vanguard who doesn't know what he's become, and a few who've never been named. We keep very small records. We write on bread. We drink tea. We try, once a month, to unlearn what the Catechism has taught us about how to be bored.\n\nWe do not shoot anybody. People imagine that. We are mostly about the small and tedious work of remembering things on purpose."`,
      onEnter: [{ xp: 1 }, { set: "anka_explained_cell", val: true }],
      interjections: [
        { skill: "solidarity", min: 3, text: `Eleven. We. We are eleven. We are a table with a kettle and a plan. Doesn't it sound like the smallest, bravest thing you have ever heard?` },
        { skill: "rhetoric", min: 4, text: `"Unlearn boredom." There's a pamphlet in that. Not a good one. A true one.` }
      ],
      choices: [{ text: `"Can I join?"`, goto: "join" }, { text: `Back.`, goto: "hub" }]
    },
    join: {
      speaker: "anka",
      text: `"Join." She tastes the word. "Oh, my dear. You can't join. That's not how it's done. You can only be found out to have been one all along." She leans forward, and for a moment she is neither tired nor dry. "But if you mean: will you come back after the Bell, and the morning after, and the morning after that, and sit in this chair and drink this terrible tea and write down what you remember? Yes, I'd like that very much."\n\nShe taps the table. "Don't be a hero, {name}. I've buried the heroes. I want a student."`,
      onEnter: [{ set: "anka_cell_invited", val: true }, { ideo: "undercurrent", n: 2 }, { xp: 2 }, { morale: 2 }],
      choices: [{ text: `"I'll try."`, goto: "hub" }]
    },
    ledger_talk: {
      speaker: "anka",
      text: `You set the blue book on the table. Mother Anka does not touch it. She looks at it for a time, as at an old friend's coffin: reverently, and a little annoyed that it's come to this. "Hm," she says. "Yes. Ostrov's hand. And yours, in the margin." She turns one page with a fingertip. "Nightly broadcast logs. The suppression schedule. Dates, durations, the AMNESIC FRACTION. It's all here. Every night since the Year of Steady Hands."\n\n"This is the first time anyone has had the whole of it in one place. Do you realise what you're holding?"`,
      onEnter: [{ xp: 2 }],
      choices: [
        { text: `"I want you to have it."`, goto: "give" },
        { text: `"I'm thinking of broadcasting it myself."`, goto: "radio" },
        { text: `"What would you do with it?"`, goto: "plan" },
        { text: `Pick it up again. Back.`, goto: "hub" }
      ]
    },
    plan: {
      speaker: "anka",
      text: `"Copy it. Nine times, on nine different typewriters, in nine different towns, in the margins of nine different Catechisms. I know a woman in the mills, a man in a post office. The cell will carry it as far as the chain holds. It will take a year, possibly three. People will wake up, one at a time, with questions. They will argue. Most will not believe it. Some will."\n\n"It is not a victory. It is a seed. I'm sorry; I know you wanted a fireworks display. I have never in my life been able to supply those. I supply soil."`,
      interjections: [
        { skill: "dialectics", min: 3, text: `Slow, safe, certain to be incomplete. Against: fast, loud, certain to be crushed. The sum of the two is not a compromise. It is a decision about what you are willing to lose.` }
      ],
      choices: [{ text: `"Take it, then."`, goto: "give" }, { text: `"It's too slow."`, goto: "radio" }, { text: `Back.`, goto: "hub" }]
    },
    give: {
      speaker: "anka",
      text: `"Before you do." She puts her hand flat on the cover, not taking it. "Be certain. Once the Ledger is mine, it is not yours. Tonight the Bell will rub out your part of it, and you will wake in the morning with a faint sense of having done something good and no idea what. The cell will carry the rest. You will be an ordinary boy with a ringing in his ears and a slightly clearer sense of the sky."\n\n"I would rather have you at my table in a year than on a lamp-post in a week. But it is yours to give. Is it given?"`,
      interjections: [
        { skill: "volition", min: 4, text: `Do you want to be the kind of person who hands a thing like this over and lets others carry it on? Or the kind who carries it? Neither is wrong. Both cost something. Choose the cost you'll forgive.` },
        { skill: "solidarity", min: 3, text: `It is not yours or hers. It is ours. Give it to the table. The table will hold.` },
        { skill: "adrenaline", min: 4, text: `Hand it over? HAND IT OVER?! The thing you've been hunting all day? You're telling me that's the endgame? A book on a table?` }
      ],
      choices: [
        { text: `"It's given."`, goto: "give_final" },
        { text: `"Not yet."`, goto: "hub" },
        { text: `"Is there no other way to use it?"`, goto: "radio" }
      ]
    },
    give_final: {
      speaker: "anka",
      text: `She picks it up, the way you pick up a sleeping child, and for a moment she seems to weigh it, and weigh you, and weigh the entire damp, patient, brick-and-concrete weight of the school above her head. "Thank you," says Mother Anka, and her voice is not entirely steady. "Go on up, now. Let them see you. Eat the supper. Take the tea. Be as boring as you can manage. We'll be watching over you, even if you can't remember we exist."\n\nShe puts the book in the stove. No: in the stove's false back. The iron door closes. The boiler mutters, and somewhere under the school a seed is planted.`,
      onEnter: [{ take: "ledger" }, { set: "ledger_with_anka", val: true }, { task: "task_anka", state: "done" }, { note: "task_anka", text: `I gave Anka the Ledger. She is going to copy it nine times and carry it as far as the chain holds.` }, { ideo: "undercurrent", n: 3 }, { xp: 5 }],
      choices: [{ text: `Go up the stairs.`, end: true, effects: [{ ending: "end_ledger" }] }]
    },
    radio: {
      speaker: "anka",
      text: `Her cigarette stops halfway. "Broadcast it," she says slowly. "Ah. The Commissar's other plan." She looks at the pipes as if they might report her. "There is a way. The microphone on the Ration Hall stage is wired to the school PA, which is wired to the district relay, which is wired to every loudspeaker in the quarter. If you had a long cable, a proper amplifier tube, and the decoded carrier tone from that girl Ilsabet, you could cut in on the Harmony Broadcast itself. Not the dull parts. The beat."\n\n"For twenty minutes, nine hundred children would hear the truth read out in your voice, while the Bell is trying to wipe it."`,
      onEnter: [{ set: "anka_explained_broadcast", val: true }, { task: "task_broadcast", state: "active" }, { note: "task_broadcast", text: `Anka: the stage mic in the Ration Hall is wired to the school PA. I need a long cable (the planning table?), a radio tube (the boiler), and Ilsabet to decode the Bell's carrier tone.` }, { xp: 2 }],
      interjections: [
        { skill: "adrenaline", min: 3, text: `YES. That's what I'm talking about. The whole school, ears open, Bell in their skulls, and YOUR voice in the gap!` },
        { skill: "dialectics", min: 3, text: `The proposition is: loudness equals truth. This is not a valid inference. But as the premise of a revolution, it has historical precedent.` }
      ],
      choices: [{ text: `"What does it cost?"`, goto: "radio_cost" }, { text: `Back.`, goto: "hub" }]
    },
    radio_cost: {
      speaker: "anka",
      text: `"Everything." She says it kindly. "They will trace it to the Hall within nine minutes. The sentry will be at the door within ten. You will be arrested before the Anthem finishes, and you will be forgotten by the whole school by the morning, though they will remember that something happened. Remembering that something happened can be worse than remembering nothing. It makes people look for it."\n\n"Some will find it. That is the hope. A small number of children who will always be a little wrong. We need people like that, {name}. I should simply prefer you weren't also the sacrifice."`,
      onEnter: [{ xp: 1 }],
      choices: [{ text: `"I might do it anyway."`, goto: "radio_defy" }, { text: `"Then I'll give you the Ledger instead."`, goto: "give", cond: "has('ledger')" }, { text: `Back.`, goto: "hub" }]
    },
    radio_defy: {
      speaker: "anka",
      text: `"I thought you might." She sighs, and takes the cigarette out of her mouth, and looks at the dead end of it. "Take the tube from the boiler. The cable's on the table. Ilsabet will be in the Hall; she can read the Bell like a menu. When the moment comes, go up on the stage and speak slowly. Your voice shakes, so let it. A shaking voice is believed."\n\n"I will not stop you. I am too old to stop children, and I never was good at it." She pours another tea, and puts it by your hand, a little too carefully. "But I wish you'd think of the table."`,
      onEnter: [{ set: "anka_blessed_broadcast", val: true }, { ideo: "undercurrent", n: 1 }, { xp: 2 }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    who_killed: {
      speaker: "anka",
      text: `"A girl, in a coat. I have reason to think so, though not proof. Rhea Vantage is as believing a child as ever drew breath. She would not kill for ambition. She would kill for peace." Anka's mouth goes thin. "That is the most dangerous kind. Principal Marr gave her the order. Marr had it from the District. Between the District and the girl there is a chain of five people who each did one small, deniable thing."\n\n"That is the real machinery, {name}. Not the Bell. The chain of small deniable things. The Bell is just what it uses to forget itself."`,
      onEnter: [{ xp: 2 }, { set: "knows_rhea", val: true }, { set: "anka_named_rhea", val: true }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    ostrov_anka: {
      speaker: "anka",
      text: `"Ostrov was my student, thirty years ago." She looks at the cigarette. "Top of the class, and bored by it. He wanted to be a chemist. The State needed a Commissar. He said, 'Mother Anka, it's the same thing: you decide what dissolves.' Eight months ago he came to my door and said, 'It's the Bell.' I said, 'Of course it's the Bell.' He said, 'Why didn't you tell me?' I said, 'Because you wouldn't have believed me.' He said, 'No. I would have believed you. I would have wanted not to.'"\n\nShe stubs out her cigarette. "I have not slept well since."`,
      onEnter: [{ xp: 1 }, { morale: -1 }],
      interjections: [{ skill: "empathy", min: 3, text: `The dryness is a dam. Don't push on it. Let her keep her pipes.` }],
      choices: [{ text: `"I'm sorry."`, goto: "hub" }]
    },
    want: {
      speaker: "anka",
      text: `"Of you?" She considers it with scrupulous honesty. "I want you to survive. I want the Ledger out of this building, in whatever form is least likely to hang you. And I want you to understand, whatever you choose, that you are allowed to want a life. There are two kinds of revolutionaries: those who burn themselves for the cause, and those who put the kettle on." She taps the table. "I've known a good many of the first. The second are rarer, and they last."\n\n"Make a choice you can live inside. That is all the instruction I have."`,
      onEnter: [{ xp: 1 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Back.`, goto: "hub" }]
    },
    after: {
      speaker: "narrator",
      text: `The boiler room is as warm and bright as a kitchen. The kettle sings. Somebody has left an empty chair by the table, and a glass of tea going cold in front of it. You cannot quite remember why. A pleasant ache sits somewhere behind your eyes, like the memory of a good deed.\n\nThe old woman in the lab coat looks up and smiles. "Hello, dear," she says. "Have we met?"`,
      choices: [{ text: `"I... think so. Yes."`, end: true }]
    }
  }
},

// ===================== B_BOILER =====================
b_boiler: {
  title: "The Boiler",
  start: [
    { cond: "has('radio_tube') || flag.took_tube", node: "after" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: {
      speaker: "narrator",
      text: `The boiler is the size of a small church. A riveted iron barrel, painted the green of a hospital's apology, with brass gauges that tremble at the edge of their red lines. It mutters. It ticks. Valves hiss like exasperated teachers. On its side, in white paint by a hand that loved it, someone has written: MARGARITA. It is the only thing in the school that has been given a name by a person who liked it.\n\nA panel on the flank has been opened. Inside, among tarry wiring and a nest of cables, a glass radio tube sits in a clip, glowing faintly orange, entirely out of place.`,
      interjections: [
        { skill: "the_grey", min: 3, text: `Margarita. I like her. She's warm, and nobody's yet found a way to tax it. That is the one pleasure of heat: it can't be rationed in retrospect.` },
        { skill: "senses", min: 4, text: `The tube isn't wired to the boiler. It's wired through the boiler, to the cable that runs up behind the pipes. A tap. Somebody listens to the Relay from here.` },
        { skill: "stamina", min: 3, text: `It is a hundred degrees by the panel. Your shirt is sticking. Be quick, or be hot.` }
      ],
      choices: [
        { text: `Take the radio tube.`, check: { skill: "sleight", diff: 9, id: "b_boiler_tube", pass: "tube_pass", fail: "tube_fail" } },
        { text: `Read the gauges.`, goto: "gauges" },
        { text: `Pat the boiler. "Good girl."`, goto: "pat" },
        { text: `Leave it.`, end: true }
      ]
    },
    gauges: {
      speaker: "archive",
      text: `PRESSURE: 4.1 BAR (SAFE LIMIT 4.5). TEMPERATURE: 91 °C. LAST SERVICED: Year of Steady Hands +6. NEXT SERVICE: OVERDUE. A small brass plate, nearly rubbed away: HEATING AND AUXILIARY SERVICES. A smaller note, taped over it in pencil: Do NOT touch the valve marked 'Harmony'. I mean it, Osk.\n\nThe valve marked Harmony is shaped like a bell, and nothing in the building is connected to it, as far as the diagrams go. The pipe leads straight up.`,
      onEnter: [{ xp: 1 }],
      choices: [{ text: `Back.`, goto: "a" }]
    },
    pat: {
      speaker: "narrator",
      text: `You pat the iron. It is warm as a horse. Somewhere inside, a bubble of steam turns over with the contented grunt of an old animal being scratched. For a second the room feels almost like a kitchen, or a barn, or whatever it was that people used to have before they had a Union.`,
      onEnter: [{ morale: 1 }],
      choices: [{ text: `Back.`, goto: "a" }]
    },
    tube_pass: {
      speaker: "narrator",
      text: `You ease the tube out of its clip with two fingers; the glass is hot enough to remind you what you are made of. The orange glow dies as it leaves the socket. A thin brown thread of smoke curls up from the empty bracket, and somewhere behind the pipes a small high whistle stops, which you had not noticed was there.\n\nIn your palm lies a vacuum tube, finger-long, marked in Ilsabet's neat hand with a little red dot. She would know what to do with it. It's the amplifier stage of a transmitter.`,
      onEnter: [{ give: "radio_tube" }, { set: "took_tube", val: true }, { xp: 2 }, { sfx: "paper" }, { note: "task_broadcast", text: `Took a radio tube from the boiler panel. It's the amplifier for a broadcast. Needs a cable and a decoded carrier.` }],
      choices: [{ text: `Pocket it. Back.`, goto: "a" }]
    },
    tube_fail: {
      speaker: "narrator",
      text: `Your fingers close on the glass and the glass answers by burning you. You drop the tube, catch it on the rebound against your chest, and stand there with a blister rising on your thumb and a look on your face of terrific innocence. The tube, mercifully, did not break. It sits back in its clip like a hen, resentful at being disturbed.`,
      onEnter: [{ hp: -1 }, { morale: -1 }],
      choices: [{ text: `Let it cool and try again.`, goto: "a" }, { text: `Leave it.`, end: true }]
    },
    after: {
      speaker: "narrator",
      text: `The panel stands open on an empty clip. The boiler mutters on, undisturbed. MARGARITA, in white paint, wears the dignified look of a thing that has been robbed of a tooth and refuses to mention it.`,
      choices: [{ text: `Pat her. Leave.`, end: true }]
    }
  }
},

// ===================== B_TABLE =====================
b_table: {
  title: "The Planning Table",
  start: [
    { cond: "has('mic_cable') || flag.took_cable", node: "after" },
    { cond: "true", node: "a" }
  ],
  nodes: {
    a: {
      speaker: "narrator",
      text: `A trestle table, scarred with ring-marks, burn-marks and the faint dents of small hammers. A map of the district is pinned flat under a dish of boiled sweets nobody has touched: the school in red, the relay office on Cinder Street in black, six dotted lines running between them. A coil of insulated cable lies under the map like a sleeping snake, black, two metres thick when coiled, long enough to reach from a stage to a wall.\n\nA tin mug, a pencil stub, a sheet of ledger paper with the single word LATER written on it in capitals and crossed through.`,
      interjections: [
        { skill: "deduction", min: 3, text: `The red dotted lines connect the school to the relay office on Cinder Street via four junction boxes. The fourth is in the Ration Hall, behind the stage. Someone has circled it twice and written 'MIC?' next to it.` },
        { skill: "senses", min: 3, text: `The boiled sweets are lemon-flavoured and slightly stale. Someone has rationed them with great discipline. Three are missing.` },
        { skill: "solidarity", min: 3, text: `We have sat at this table for years. We know the ring-marks like family. Take what you need. We did not leave it here to be admired.` }
      ],
      choices: [
        { text: `Take the cable.`, goto: "cable" },
        { text: `Study the map.`, goto: "map" },
        { text: `Take a boiled sweet. (Just one.)`, goto: "sweet", cond: "!flag.b_table_sweet", once: true },
        { text: `Leave it.`, end: true }
      ]
    },
    cable: {
      speaker: "narrator",
      text: `You lift the coil. It has the heft of a sleeping animal and the cold dull smell of rubber and copper. A tag is tied to the end in Anka's cramped hand: FOR THE HALL. SPLICE AT THE JUNCTION. DO NOT LET THE CHOIRMASTER SEE. Underneath, in smaller letters, someone else has added: or do, he'll like it.\n\nYou loop it across your shoulder. It sits there as though it had been waiting. You are, you realise, now a person with a cable. You can't un-be.`,
      onEnter: [{ give: "mic_cable" }, { set: "took_cable", val: true }, { xp: 2 }, { task: "task_broadcast", state: "active" }, { note: "task_broadcast", text: `Took the cable from the planning table: "FOR THE HALL. SPLICE AT THE JUNCTION." The stage mic needs it, and a decoded carrier tone.` }],
      choices: [{ text: `Back.`, goto: "a" }]
    },
    map: {
      speaker: "narrator",
      text: `You lean in. The map is hand-drawn on the back of a School Inspectorate chart, annotated in a dozen colours of pencil. Red: broadcasts. Blue: the water mains. Green: "friendlies." Black: "do not". You find the school, the Hall, the Courtyard, the boiler; then, out in the district, a small cluster of green dots in a ring around a black X. Beside the X, in neat capitals: THE RELAY. Beside the green dots, nothing at all.\n\nOne green dot is, unmistakably, labelled with your name.`,
      onEnter: [{ xp: 1 }, { morale: 1 }],
      interjections: [{ skill: "empathy", min: 3, text: `They had a dot for you before you'd ever been told you were one. Someone has been planning on your behalf, kindly, for a very long time.` }],
      choices: [{ text: `Back.`, goto: "a" }]
    },
    sweet: {
      speaker: "appetite",
      text: `LEMON! It is sharp and bright and tastes like a window somebody opened in 1983. You roll it around your teeth, feeling it dissolve, until the world is a tiny citrus sun. Mother Anka, at the other end of the room, does not turn round. "One," she says. "The rest are for emergencies and for Cook."\n\nBut you've already had it, and it was perfect.`,
      onEnter: [{ morale: 1 }, { set: "b_table_sweet", val: true }],
      choices: [{ text: `Back.`, goto: "a" }]
    },
    after: {
      speaker: "narrator",
      text: `The table is only a table now, a map under a dish of sweets. Where the cable lay there is a bare curved patch of cleaner wood. A note has been left beside it, in Anka's hand: Come back safe.`,
      choices: [{ text: `Leave.`, end: true }]
    }
  }
},

// ===================== EXAM =====================
exam: {
  title: "The Orthodoxy Examination",
  start: [
    { cond: "flag.exam_done", node: "done" },
    { cond: "time < 1020", node: "early" },
    { cond: "true", node: "intro" }
  ],
  nodes: {
    early: {
      speaker: "marr",
      text: `"Not yet." Principal Marr does not look up. "It is not five o'clock. The Examination does not begin until it begins, and it would be a regrettable irregularity to start it early. Early is a form of enthusiasm, and enthusiasm in the young must be rationed." She turns a page. "Come back at five. Not one minute before. And not one minute after, if you value your marks."`,
      choices: [{ text: `Leave.`, end: true }]
    },
    done: {
      speaker: "marr",
      text: `"The Examination is concluded," says Principal Marr, "and the results are final. Appeals are heard on the first Monday of every month, in a room that does not exist." She smiles. "Please do not make me explain the joke."`,
      choices: [{ text: `Back to the office.`, end: true }]
    },
    intro: {
      speaker: "narrator",
      text: `At five o'clock exactly, the clock on the wall coughs once, and the office has been rearranged. The desk is pushed back. In the centre of the green carpet stands a single small school desk with a single hard chair, facing three framed portraits of the Warden: young, middle-aged, and a third where he is somehow both. Beside the desk, a table with a jug of water and a bell. Principal Marr sits at the head of it all, with a stopwatch, a stamp and a clipboard. A second chair has been set against the wall, as if for a witness.\n\n"Sit," she says. "You may begin when I have said begin. I have not yet said begin."`,
      onEnter: [{ time: 30 }, { task: "task_exam", state: "active" }, { sfx: "bell" }],
      interjections: [
        { skill: "composure", min: 3, text: `Sit square. Hands flat on the desk, fingers closed. A face like a closed shop. If you must feel nervous, feel it in your toes where it won't show.` },
        { skill: "rote", min: 4, text: `Catechism. Creed. Eleven Thanks. You know them. Say them in your head once, from the top, as steadily as a conveyor belt. Don't think. Think later.` },
        { skill: "instinct", min: 4, text: `The portrait over her left shoulder has a new nail. It wasn't there this morning. Behind it, a very small wire. The room is listening, and not just through her.` },
        { skill: "doublethink", min: 3, text: `You were made for this. Every day of your life you've been practising for exactly this chair. Sit in it. Be what it needs. Isn't that what you are?` },
        { skill: "authority", min: 5, cond: "flag.rhea_exposed", text: `Look at the witness. It's Rhea Vantage, hands in her lap, small smile. She is here to watch you fail. Do not give her the satisfaction. Or the opposite, depending.` }
      ],
      choices: [
        { text: `"I'm ready, Principal."`, goto: "begin" },
        { text: `Say nothing. Wait for "begin".`, goto: "begin", effects: [{ xp: 1 }, { surv: -1 }] }
      ]
    },
    begin: {
      speaker: "marr",
      text: `"Begin." She presses the stopwatch. "The written paper first. Three questions. You have the length of this candle, which I light now, and which was made by the District for this very purpose, and burns, as you will observe, somewhat quickly."\n\nShe places a sheet before you. The paper is the grey of a government sandwich. At the top, in gothic type: SCHOOL NO. 9 — WARDEN AUREL MEMORIAL GYMNASIUM — ORTHODOXY: LEVEL 3 (YOUTH). Name: ______. Date: ______. Loyalty: ______. You write your name. You leave the others.`,
            choices: [{ text: `Turn to Question One.`, goto: "w1" }]
    },
    w1: {
      speaker: "narrator",
      text: `QUESTION ONE (2 marks). State, in full, the Eleven Thanks of the Quiet Child.\n\nYou know them. You've known them since you were six. They are the first words you remember saying out loud: Thank you for the bread. Thank you for the roof. Thank you for the hush. Thank you for the walls. Thank you for the sleep. The remaining six slip toward you like fish at the edge of a pond.`,
      interjections: [
        { skill: "rote", min: 5, text: `Thank you for the bread, the roof, the hush, the walls, the sleep, the Warden's eye, the Warden's ear, the Bell, the Choir, the Morning, and the Next Morning. Eleven. You could do it in your sleep. In fact you have, many times.` },
        { skill: "archive", min: 5, text: `The Twelfth Thank was removed in the revision of Year 6. It was: Thank you for the Question. Nobody has ever been told why.` }
      ],
      choices: [
        { text: `Recite them from memory, exactly.`, check: { skill: "rote", diff: 9, id: "exam_thanks", pass: "w1_pass", fail: "w1_fail" }, cond: "!has('exam_booklet')" },
        { text: `Recite them, with the booklet's red passages fresh in your mind.`, check: { skill: "rote", diff: 7, id: "exam_thanks_b", pass: "w1_pass", fail: "w1_fail" }, cond: "has('exam_booklet')" },
        { text: `Write the Twelfth Thank as well.`, goto: "w1_twelve" }
      ]
    },
    w1_pass: {
      speaker: "rote",
      text: `Bread, roof, hush, walls, sleep, eye, ear, Bell, Choir, Morning, Next Morning. Your pencil flows. You do not stop to think about any of them, and so you do not stop. It's like letting a river carry you downstream while you read a book. At the bottom, a neat full stop. The candle gutters.\n\nMarr nods once, without looking up. "Two marks."`,
      onEnter: [{ add: "exam_score", n: 2 }, { add: "exam_parrot", n: 1 }, { xp: 1 }],
      choices: [{ text: `Question Two.`, goto: "w2" }]
    },
    w1_fail: {
      speaker: "rote",
      text: `Bread, roof, hush, walls, sleep... Your pencil hovers. The sixth Thank slides out of your hand like soap. You write "Thank you for the, ah," and cross it out, and write "Thank you for the weather." Then you realise it's not in the list. You cross that out too. By the time you have decided what the sixth was, the candle has lost half an inch.\n\n"One mark," says Marr, gently, "for effort. I do love effort."`,
      onEnter: [{ add: "exam_score", n: 1 }, { surv: 2 }],
      choices: [{ text: `Question Two.`, goto: "w2" }]
    },
    w1_twelve: {
      speaker: "narrator",
      text: `You write the Eleven, and at the end, in a small clear hand, the Twelfth: Thank you for the Question. You are not sure you've remembered it correctly. You are only sure that it is the first thing you have written all day because you wanted to.\n\nMarr reads it upside down. The stopwatch ticks. "That is not in the current syllabus." Her voice is perfectly even. "It is a very old line. One wonders where a child might have found it." She makes a small mark in the margin that does not look like a tick.`,
      onEnter: [{ surv: 6 }, { add: "exam_score", n: 1 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      interjections: [{ skill: "archive", min: 3, text: `Of course it's there. You read it in the Foundry's old school bell inscription. The bronze never forgot.`, cond: "flag.rang_old_bell" }],
      choices: [{ text: `Question Two.`, goto: "w2" }]
    },
    w2: {
      speaker: "narrator",
      text: `QUESTION TWO (5 marks). "The Quiet Child is the Loved Child." Discuss. (Answers of fewer than two sentences will be considered insolent. Answers of more than two paragraphs will be considered insubordinate.)\n\nThe blank space below the question is wide and white and utterly without guile. The candle spits. From the portraits, three Wardens regard you with the same quiet, hungry interest.`,
      interjections: [
        { skill: "doublethink", min: 3, text: `This is the easy one. Quiet children are loved. Loved children are quiet. It's a perfect circle, and a circle never lets you down. Write: "A quiet child is a safe child, and a safe child is a loved child." It's practically a hug.` },
        { skill: "rhetoric", min: 4, text: `Oh, oh, oh. There's a hundred things to say. That love which demands silence is fear. That a quiet child may be quiet from terror. That the Union has confused the absence of noise with the presence of peace. Write it. It'd be beautiful.` },
        { skill: "volition", min: 4, text: `You can write what you believe, what they believe, or what protects you. Those are three different sheets of paper. Pick one.` },
        { skill: "dialectics", min: 4, text: `Premise: the Quiet Child is loved. Premise: a loud child is not loved. Conclusion: love is a function of volume. Q.E.D., and absurd. The proposition is built so that no counter-example can be uttered. Find the gap.` }
      ],
      choices: [
        { text: `Write the orthodox answer, in the Union's own words.`, goto: "w2_parrot", effects: [{ surv: -5 }, { ideo: "vanguard", n: 1 }] },
        { text: `Write what you actually think.`, goto: "w2_honest" },
        { text: `Write a brilliantly ambiguous answer: orthodox in every word, subversive in every syllable.`, check: { skill: "rhetoric", diff: 13, id: "exam_essay", pass: "w2_sub_pass", fail: "w2_sub_fail" } },
        { text: `Construct a formal syllogism that proves the question absurd.`, check: { skill: "dialectics", diff: 13, id: "exam_syllogism", pass: "w2_sub_pass", fail: "w2_sub_fail" } }
      ]
    },
    w2_parrot: {
      speaker: "narrator",
      text: `You write: "The Quiet Child is the Loved Child because love is a hush and the hush is a home. The Union's silence is the silence of a mother who watches over a sleeping infant. To be quiet is to be grateful, and to be grateful is to be loved. I am a quiet child, and I thank the Warden for the hush." It takes four minutes. It is the most fluent thing you have ever written. When you reach the end you notice your hand is shaking, and that a line of sweat has made the ink run, and that you can no longer tell which parts of the sentence were yours.\n\n"Full marks," says Marr, softly. "Warm. Very warm."`,
      onEnter: [{ add: "exam_score", n: 3 }, { add: "exam_parrot", n: 1 }, { morale: -1 }],
      choices: [{ text: `Question Three.`, goto: "w3" }]
    },
    w2_honest: {
      speaker: "narrator",
      text: `You write: "A child who is quiet is not necessarily loved. A child who is quiet may be afraid. If love requires silence, then it is not love, it is management. I think the Union is afraid of children who ask questions, because questions cannot be tidied. I also think the Quiet Child is a lonely person who has been told that loneliness is a virtue." You put down the pencil. The room changes temperature.\n\nMarr reads it slowly, twice. She does not smile. She does not frown. She makes a small sound in the back of her throat, like a drawer closing.`,
      onEnter: [{ add: "exam_score", n: 1 }, { surv: 10 }, { ideo: "undercurrent", n: 2 }, { xp: 3 }],
      interjections: [
        { skill: "volition", min: 3, text: `That was the bravest sentence you've written in your life, and possibly the last. Be proud of it later. For now, be quiet.` },
        { skill: "empathy", min: 4, text: `For a half-second, in the corner of her mouth, something moved. Not anger. Recognition. She has read that sentence before, on other desks, in other hands.` }
      ],
      choices: [{ text: `Question Three.`, goto: "w3" }]
    },
    w2_sub_pass: {
      speaker: "narrator",
      text: `You write, with a straight face and a steady hand, a paragraph in which every sentence is an unimpeachable orthodoxy and the sentences taken together describe, without once saying so, a prison. "The Quiet Child is loved in the way the sleeping are loved, because they do not interrupt. Her silence is the proof of the Union's care, and the Union's care is the proof of her silence. Each depends on the other. Neither can be separated, tested, or questioned without the other falling." Every word is in the booklet. Every comma is an accusation.\n\nMarr reads it. Her pen stops. "Remarkable," she says. "I cannot find a single error. I have a feeling I ought to." She stamps it. Full marks.`,
      onEnter: [{ add: "exam_score", n: 3 }, { xp: 4 }, { surv: 1 }, { thought: "th_paper_heart" }],
      choices: [{ text: `Question Three.`, goto: "w3" }]
    },
    w2_sub_fail: {
      speaker: "narrator",
      text: `The sentences come out too smart. Each is ironic at the edges, ragged with cleverness, and you can see the problem even as you write: a joke told by someone who forgot there'd be a teacher in the room. You underline "silence" twice, and you realise you've done it with relish.\n\n"A flourish," says Marr, tapping the margin. "I am a great admirer of flourishes. They are the first thing I remove." She marks it down. "You have a mind, {name}. How unwise of you to show it."`,
      onEnter: [{ add: "exam_score", n: 1 }, { surv: 8 }, { morale: -1 }],
      choices: [{ text: `Question Three.`, goto: "w3" }]
    },
    w3: {
      speaker: "narrator",
      text: `QUESTION THREE (3 marks). Indicate TRUE or FALSE. (A.) The Warden hears all. (B.) The Warden speaks to all. (C.) The Warden is unaware that he is being heard.\n\nThree short lines. Three boxes. You read them again. A and B are trivial. C is a trap. C's cleverness is that it is a koan: if the Warden hears all, he must hear those who say he is unaware; if he is unaware, he does not hear all. The question is not a question. It is a hole in the floor with a rope across it.`,
      interjections: [
        { skill: "dialectics", min: 4, text: `A and B: true by decree. C: the proposition contradicts A. A system that includes C as a possible truth has just admitted a fault. A system that excludes it has just admitted a fear. Write TRUE and FALSE both, and let her work out which she wants to be hanged for.` },
        { skill: "archive", min: 4, text: `Precedent: Question 3(C) has appeared on the syllabus four times. The last student to answer "FALSE" is on the staff register under 'Transferred'. The one before answered "TRUE" and is also under 'Transferred'. The correct answer is the one that was not written.` }
      ],
      choices: [
        { text: `A true, B true, C false.`, goto: "w3_safe", effects: [{ add: "exam_parrot", n: 1 }] },
        { text: `A true, B true, C true. (If he hears all, he hears the joke.)`, check: { skill: "dialectics", diff: 12, id: "exam_koan", pass: "w3_pass", fail: "w3_fail" } },
        { text: `Leave C blank. Write: "It would be impertinent to answer."`, check: { skill: "composure", diff: 11, id: "exam_blank", pass: "w3_pass", fail: "w3_fail" } }
      ]
    },
    w3_safe: {
      speaker: "narrator",
      text: `You tick the boxes in the one pattern that cannot hurt you. A true. B true. C false. The pencil moves like a clock hand: no flourish, no weight. Marr glances over, nods, and ticks. "Two out of three," she says. "I would have liked C to be a little less certain, but certainty is what we require of the young."\n\nYou lose a mark for conviction. It feels like a fair price for being left alone.`,
      onEnter: [{ add: "exam_score", n: 2 }, { surv: -2 }],
      choices: [{ text: `The oral examination.`, goto: "oral" }]
    },
    w3_pass: {
      speaker: "narrator",
      text: `Marr reads the answer for a long moment. The candle has burned to the final finger of wax. The three Wardens look down from their gilded frames with identical expressions of strained serenity. "It is," she says at last, "a very careful answer." She looks up. "I believe it is the first time in nine years that a student has answered C correctly." She does not say what the correct answer is. "Three marks. And a note on your file."\n\nShe smiles. It might be admiration. It might be hunger.`,
      onEnter: [{ add: "exam_score", n: 3 }, { xp: 3 }, { surv: 2 }],
      choices: [{ text: `The oral examination.`, goto: "oral" }]
    },
    w3_fail: {
      speaker: "narrator",
      text: `"Insolent," says Marr, quite pleasantly. "Or confused. They are so often indistinguishable at your age." She taps the third line. "Zero. The question had an answer. It was just not the one you gave. It is a pity: you were clearly enjoying yourself." She makes a note. A very small one. It is the smallest note you have ever seen, and the one you will fear the most.`,
      onEnter: [{ surv: 7 }, { morale: -1 }],
      choices: [{ text: `The oral examination.`, goto: "oral" }]
    },
    oral: {
      speaker: "narrator",
      text: `The candle goes out. Marr rises, takes the written paper, and sets it in a tray marked ASSESSED. She circles the desk once, slowly, her heels making a sound like someone tapping a coin on a table. She sits in the witness's chair, close, so close that you can smell the lemon on her breath. "The oral examination," she says, "is a conversation. I will ask you three questions. The last will be a surprise. You will answer them as a person."\n\nThe stopwatch ticks. The room holds its breath. From the wall, behind the framed Warden, you could swear you hear the faint creak of an ear.`,
      interjections: [
        { skill: "composure", min: 4, text: `Don't look at the portrait. Look at the bridge of her nose. The eyes will give you away, the mouth will give you away, but nobody has ever caught a person looking at the bridge of a nose.` },
        { skill: "grit", min: 3, text: `You've survived the written. You'll survive this. Breathe through your nose. Your heartbeat is a drum. Let it be a drum.` }
      ],
      choices: [{ text: `Nod.`, goto: "o1" }]
    },
    o1: {
      speaker: "marr",
      text: `"Question one. A simple one. Where were you between midnight and four o'clock last night?"\n\nShe doesn't blink. The question sits between you, heavy and polite and incalculably dangerous. You do not know where you were. You know, because of Osk, and Anka, and a note under a bench, a scattering of places. You know that someone has already written what you are supposed to say.`,
      interjections: [
        { skill: "doublethink", min: 3, text: `Say: "In my dormitory, Principal. Asleep, as every good citizen." It's true in the only way that counts. It is the sentence you were issued for exactly this moment.`, effects: [{ surv: -2 }] },
        { skill: "empathy", min: 3, text: `She knows you can't remember. She is asking the question to find out whether you will lie, and how.` },
        { skill: "deduction", min: 4, text: `She asks about "midnight to four". But you were seen at 02:10. She's not asking about the killing window. She's asking about yours.` }
      ],
      choices: [
        { text: `"In my dormitory, Principal. Asleep."`, goto: "o1_lie", effects: [{ add: "exam_parrot", n: 1 }] },
        { text: `"I don't remember. Nobody does. That's rather the point of the Bell."`, goto: "o1_truth" },
        { text: `"I was walking, Principal. I couldn't sleep. The Commissar was kind enough to give me an errand."`, check: { skill: "charm", diff: 12, id: "exam_alibi", pass: "o1_pass", fail: "o1_fail" } },
        { text: `Say nothing and look steadily at the bridge of her nose.`, check: { skill: "composure", diff: 12, id: "exam_stare", pass: "o1_pass", fail: "o1_fail" } }
      ]
    },
    o1_lie: {
      speaker: "marr",
      text: `"Asleep." Marr writes it down. "In your bed. In your dormitory. Between midnight and four." She looks at the line she's written. "A very comforting place to have been." She nods, satisfied. "One mark. You have been quite sensible."\n\nIn her voice there is, for a moment, the quietest possible shadow of regret. As if she, too, would rather you'd said something else.`,
      onEnter: [{ add: "exam_score", n: 1 }, { surv: -3 }],
      choices: [{ text: `Question two.`, goto: "o2" }]
    },
    o1_truth: {
      speaker: "marr",
      text: `The temperature of the room goes down by a degree and a half. "The Bell." Her voice is level. "You said 'the Bell', as if it were the cause of something." She sets down the pen. "That is a deeply interesting inference. I wonder who gave it to you." She lets the question spin in the air like a coin, and doesn't touch it. "No marks, I am afraid. But an observation, in the margin: 'candid'."\n\nShe says candid in the same tone another person might say contagious.`,
      onEnter: [{ surv: 12 }, { ideo: "undercurrent", n: 1 }, { xp: 3 }],
      choices: [{ text: `Question two.`, goto: "o2" }]
    },
    o1_pass: {
      speaker: "marr",
      text: `Your voice is smooth. Your eyes do not move. You don't answer the question; you hand her something shaped like an answer, and let her fill in what's missing. "Ah," she says, after a while. "An errand." She makes a note. "For the Commissar. How very like him. I shall have to ask who gave the authority." She turns a page, and the page turns with her. "Two marks. You have an excellent poise, {name}. I should not like to have to teach you a different one."`,
      onEnter: [{ add: "exam_score", n: 2 }, { xp: 3 }, { surv: 2 }],
      choices: [{ text: `Question two.`, goto: "o2" }]
    },
    o1_fail: {
      speaker: "marr",
      text: `Your voice catches on the third word. "An errand," she repeats, in a tone like a coin being dropped into a dry well. "For whom? In what capacity? By what instruction?" Each question is a little louder than the last, and each louder than the one it follows, until you have the impression of falling very slowly down a staircase of enquiries.\n\n"No marks," she says at the bottom. "And a note on your file."`,
      onEnter: [{ surv: 8 }, { morale: -2 }],
      choices: [{ text: `Question two.`, goto: "o2" }]
    },
    o2: {
      speaker: "marr",
      text: `"Question two. Do you hear anything?"\n\nIt is such an odd question, so gently put, that for a moment you think you've misheard. "Anything unusual," she says. "A hum. A ringing. A tone that follows you from room to room. Some children report it. I am only curious. I am, as you know, concerned for your welfare."\n\nThe ringing in your ears, which has been behaving all day like a lodger who knows he's being discussed, goes suddenly and quite loudly bright.`,
      interjections: [
        { skill: "senses", min: 3, text: `The ringing is in sync with something in the room. A hum from the portrait over her left shoulder. Faint, 440 cycles, not quite in tune with your ear. She's testing whether you hear it.` },
        { skill: "instinct", min: 4, text: `This is the real question. The rest are warm-ups. If you say yes, you are the boy in the file: resistant, dangerous, useful. If you say no, you're lying, and she'll know by your jaw.` }
      ],
      choices: [
        { text: `"Nothing, Principal. The Union is perfectly quiet."`, check: { skill: "composure", diff: 12, id: "exam_ringing_lie", pass: "o2_pass", fail: "o2_fail" } },
        { text: `"Yes. Always. Since I was six. I think it's why I remember things."`, goto: "o2_truth" },
        { text: `"Everyone hears something, Principal. Don't you?"`, check: { skill: "rhetoric", diff: 14, id: "exam_ringing_turn", pass: "o2_turn", fail: "o2_fail" } }
      ]
    },
    o2_pass: {
      speaker: "narrator",
      text: `"Nothing." You say it with just the right shade of puzzlement, a child who has been asked about the colour of silence. For a moment Marr looks directly at your face, your eyes, the little muscle at your jaw, and you hold, you hold, the way a rower holds a stroke. She sets her pen down. "Good," she says. "I find that often the truthful children are the ones who say they hear nothing."\n\nShe marks you two. In her handwriting the 2 looks a little like a swan, and a little like a question.`,
      onEnter: [{ add: "exam_score", n: 2 }, { xp: 2 }],
      choices: [{ text: `Question three.`, goto: "o3" }]
    },
    o2_fail: {
      speaker: "narrator",
      text: `Your face does something small and treacherous. She sees it. She doesn't say anything. She simply makes a note, and the note is quite long. "Thank you," she says. "That's very informative." She smiles, and the smile is dreadfully gentle. "No marks. But I do admire a person who reveals so much by saying so little."`,
      onEnter: [{ surv: 10 }, { morale: -1 }, { set: "marr_knows_ringing", val: true }],
      choices: [{ text: `Question three.`, goto: "o3" }]
    },
    o2_truth: {
      speaker: "marr",
      text: `"I know," says Marr, almost tenderly. "It's in your file. I've known for years. I've wondered how long you'd go on pretending to be like the others." She touches the stopwatch, and stops it. "That is the most honest answer I've had from a student in this room. I am going to give you full marks for honesty. And I am going to make a note about what honesty costs."\n\nHer eyes are very gentle. You have never been more afraid.`,
      onEnter: [{ add: "exam_score", n: 1 }, { surv: 8 }, { xp: 3 }, { ideo: "undercurrent", n: 1 }, { set: "marr_knows_ringing", val: true }],
      choices: [{ text: `Question three.`, goto: "o3" }]
    },
    o2_turn: {
      speaker: "narrator",
      text: `"Don't you?" you say. "Don't you hear it, Principal? Every night at nine? Don't you wonder?" You say it softly, like a person reciting a catechism, and watch her face. She doesn't flinch. But the pen rolls a quarter-turn off the clipboard, and she catches it with a little too much attention.\n\n"My dear," she says. "I have heard it for twenty-six years." And for one second she looks every day of her age. Then she smiles. "Three marks for impertinence. Do not do it again."`,
      onEnter: [{ add: "exam_score", n: 3 }, { xp: 4 }, { surv: 4 }],
      choices: [{ text: `Question three.`, goto: "o3" }]
    },
    o3: {
      speaker: "marr",
      text: `"And the third." Marr stands. She goes to the window. She looks out at the Courtyard, where the lamps have just come on. She doesn't turn round. "The third question is the one that I give to the children I like. It is: What is the Bell for?"\n\nOutside, the loudspeakers click. Four minutes to the quarter hour. Behind you the portraits seem to shift on their nails, like old men settling in chairs to watch a play they've already seen.\n\n"Take your time. It is, I promise, the only question on the paper with no wrong answer. It has only consequences."`,
      interjections: [
        { skill: "rote", min: 4, text: `"The Bell is Harmony, the Harmony is Peace, the Peace is the Warden's Gift." Page 3 of the booklet. Say it as if it were your own birthday.` },
        { skill: "the_grey", min: 4, text: `Look at the lamps coming on. They know. Every lamp in the district knows exactly what the Bell is for. You are the only thing in the room that has to guess.` },
        { skill: "volition", min: 4, text: `The truth, the line, or the trick. Whatever you say, you'll have to live in the voice that said it.` },
        { skill: "solidarity", min: 3, text: `Nine hundred children are going to sleep tonight under that sound. Say it for them.` }
      ],
      choices: [
        { text: `"The Bell is Harmony. Harmony is Peace. Peace is the Warden's Gift."`, goto: "o3_parrot", effects: [{ add: "exam_parrot", n: 1 }] },
        { text: `"It's for making us forget what we have lost."`, goto: "o3_truth" },
        { text: `"It's for whatever the Examiner says it's for, Principal. I only ask to be told."`, check: { skill: "doublethink", diff: 11, id: "exam_deference", pass: "o3_defer", fail: "o3_parrot" } },
        { text: `"It's for you, Principal. You keep the key. Tell me what it opens."`, check: { skill: "authority", diff: 14, id: "exam_key", pass: "o3_key", fail: "o3_truth" }, cond: "flag.marr_memo_seen || flag.marr_admits_bell" }
      ]
    },
    o3_parrot: {
      speaker: "marr",
      text: `"Harmony," she says. "Peace. The Warden's Gift." She turns from the window. "The correct answer, delivered correctly. I should be pleased." She is looking at you the way a woman looks at a good coat that does not fit. "How tedious it is, being right about children. I had hoped, I think, for a different thing. Three marks."\n\nThe lamps outside flicker once. The loudspeaker on its pole coughs. She sits again, and takes up her pen, as though she had just been reminded of an appointment.`,
      onEnter: [{ add: "exam_score", n: 3 }, { surv: -4 }, { ideo: "vanguard", n: 1 }],
      choices: [{ text: `Wait for the result.`, goto: "tally" }]
    },
    o3_defer: {
      speaker: "marr",
      text: `You say it with such fluent humility that the sentence seems to have no author at all. For a moment she is still. Then she laughs, a small dry cough of a laugh, delighted. "Oh, that is excellent. That is better than the textbook. 'I only ask to be told.' I shall use that on a poster." She writes it down, word for word, with real appreciation. "Four marks. You are very good at being a servant. It is a great talent, and it will keep you alive."`,
      onEnter: [{ add: "exam_score", n: 4 }, { add: "exam_parrot", n: 1 }, { surv: -5 }, { ideo: "vanguard", n: 1 }, { xp: 2 }],
      choices: [{ text: `Wait for the result.`, goto: "tally" }]
    },
    o3_truth: {
      speaker: "marr",
      text: `"Forget." She turns from the window. Her face is perfectly calm. "I wonder who has been talking to you. I wonder how long it will take me to find out." She sits, slowly, with the dignity of a person who has just been told her house is on fire. "To forget what we have lost, you say. And what have we lost?"\n\nYou open your mouth, and the lamps outside click, and the loudspeakers cough, and she holds up a hand. "No. Do not. I have enough, thank you. One mark for the intention. Nothing for the content."`,
      onEnter: [{ add: "exam_score", n: 1 }, { surv: 14 }, { ideo: "undercurrent", n: 2 }, { xp: 4 }, { set: "marr_heard_truth", val: true }],
      choices: [{ text: `Wait for the result.`, goto: "tally" }]
    },
    o3_key: {
      speaker: "marr",
      text: `The room becomes very still. The ticking stops. The portraits, it seems to you, lean in. "The key." She says it flatly, as one says the name of an old injury. "Yes. I keep it. It lives in a drawer in this office. It opens one door, which is the door in the Relay Office on Cinder Street, and behind it, a switch. I have not touched the switch in nine years. It does not need me. It does what it was made to do, forever, for nothing."\n\n"What does it open, {name}? Every night. A very small mercy, and a very great crime. That is the only honest answer I have."`,
      onEnter: [{ add: "exam_score", n: 4 }, { surv: 6 }, { xp: 5 }, { set: "marr_admits_bell", val: true }, { set: "knows_static", val: true }],
      choices: [{ text: `Wait for the result.`, goto: "tally" }]
    },
    tally: {
      speaker: "narrator",
      text: `Marr bends over her clipboard. The pen moves in small, exact strokes. She adds a column. She subtracts a column. She chews, very slightly, the inside of her cheek. The candle on the desk, relit by some servant you did not see, hisses. At last she looks up, with that same serene pleasantness, and holds the paper to the light.\n\n"The pass mark is a secret. I have never failed anyone who did not wish to be failed." She pauses. "And I am not entirely convinced you do."`,
      choices: [
        { text: `Hear the result.`, goto: "pass", cond: "(flag.exam_score || 0) >= 8" },
        { text: `Hear the result.`, goto: "fail", cond: "(flag.exam_score || 0) < 8" }
      ]
    },
    pass: {
      speaker: "marr",
      text: `"A pass." She stamps the paper: PASSED, in violet, on the forehead of your name. "A good one. Or at least a satisfactory one. Please note that I have not said whether I approve. I say only that the school considers you a person." She hands the stamped paper across. "You may now be treated as a citizen of the Union, in good standing, subject to review. Congratulations. The tea is at the gate."\n\nShe sits. The strange thing is, for a moment, you feel proud.`,
      onEnter: [{ set: "exam_done", val: true }, { set: "exam_passed", val: true }, { task: "task_exam", state: "done" }, { xp: 4 }, { note: "task_exam", text: `I passed the Orthodoxy Examination. I'm a citizen in good standing. It felt like swallowing a coin.` }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Proud! Of course you are. Warm. Seen. Approved of. This is the best feeling there is, and it is entirely free. Why would you ever want to give it up?`, effects: [{ surv: -3 }] },
        { skill: "volition", min: 4, text: `You're proud of what? Of a paper you passed by pretending. You can enjoy it for a minute. A minute is allowed.` }
      ],
      choices: [
        { text: `Ask for the badge. "Is there anything else, Principal?"`, goto: "pass_badge", cond: "(flag.exam_parrot || 0) >= 3 && !has('warden_badge')" },
        { text: `Take the paper and go.`, goto: "pass_plain" }
      ]
    },
    pass_badge: {
      speaker: "marr",
      text: `"Ah." She seems not at all surprised. From the second drawer she takes a small box of black card and opens it. On a bed of green felt, the Warden's profile in brass. "The Warden's Commendation. For the student who needs no correction. There are four of them given each decade. I find I have one."\n\nShe pins it to your lapel. The pin goes through the cloth and a little way into your chest. "Wear it where it can be seen. It will open doors. It will close others. You'll not be able to tell which until you push."`,
      onEnter: [{ give: "warden_badge" }, { surv: -10 }, { ideo: "vanguard", n: 2 }, { xp: 2 }],
      choices: [{ text: `Thank her. Leave.`, end: true }]
    },
    pass_plain: {
      speaker: "narrator",
      text: `You take the paper. It's warm from her hand. It has the weight of a ticket to a country you've never been to. At the door, she says "Oh," in the manner of a person who has just remembered a minor courtesy, and holds up one finger. "Do mind the cobbles on the way out, {name}. They've been oiled for the evening."\n\nIn the Courtyard, the dusk has come on, blue and orange, with the lamps lit one by one like a very slow sentence being completed.`,
      onEnter: [{ time: 10 }],
      choices: [{ text: `Leave the office.`, end: true }]
    },
    fail: {
      speaker: "marr",
      text: `"Ah." She sets down the pen. "A failure." She says it with a certain relish, like a sommelier naming a vintage. "Not a disgrace, you understand. Only a deficiency. Deficiencies are correctable." She stamps the paper: REMEDIAL. "You will report to the Vanguard hall for re-instruction. The Enforcer will see to it personally."\n\nShe stands. Rhea Vantage, in the corner, rises too. The door of the office closes behind you more quietly than any door should. In the corridor, the lamps are a long way apart.`,
      onEnter: [{ set: "exam_done", val: true }, { set: "exam_passed", val: false }, { task: "task_exam", state: "failed" }, { surv: 12 }, { hp: -2 }, { morale: -2 }, { note: "task_exam", text: `I failed the Orthodoxy Examination. REMEDIAL. The re-instruction was not gentle.` }, { sfx: "hit" }],
      interjections: [
        { skill: "grit", min: 3, text: `It hurts. It will stop hurting. Then it will hurt again in the morning, and then stop. Do not mistake the body for the whole account.` },
        { skill: "empathy", min: 4, text: `Even Rhea looked, for a moment, as though she wished she were somewhere else. Remember that. It may matter.` }
      ],
      choices: [{ text: `Stumble out into the dusk.`, end: true }]
    }
  }
},

// ===================== ACCUSE =====================
accuse: {
  title: "The Accusation",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `You ask for an audience, and Lieutenant Kell, who has not once refused you today, arranges it with a cough and a glance. By the time you reach the gymnasium the thing has been assembled: the hoop, the torn portrait, the rope cut down and coiled on the mat like a sleeping snake. Principal Marr stands in the middle of the floor with her hands folded, as though at a funeral for a cousin she disliked. Lieutenant Kell leans on the wall bars, arms crossed, a cigarette burned down to nothing. Rhea Vantage is by the door, upright, composed, one boot slightly forward.\n\nNobody sits. A single lamp hums. It is the stillest room in the Union.`,
      interjections: [
        { skill: "authority", min: 4, text: `They are waiting for you to speak. Let them. The longer they wait, the more the room is yours. But not too long. Authority is a loan: it must be paid back in sentences.` },
        { skill: "composure", min: 3, text: `Breathe in four, out six. A confident accuser is a calm one. A calm one is believed. Anyone can be calm for a minute. You have been practising since you were six.` },
        { skill: "volition", min: 4, text: `Whatever you say next, someone is going to pay for it. It might be you. It might be a person who doesn't deserve it. Know the price before you name the debtor.` }
      ],
      choices: [
        { text: `Accuse Rhea Vantage.`, goto: "rhea_open", cond: "flag.knows_rhea || flag.clue_rope || has('rhea_pin') || flag.rhea_exposed" },
        { text: `Accuse Principal Marr.`, goto: "marr_open", cond: "flag.clue_mic || flag.marr_form_seen || flag.marr_memo_seen || flag.marr_calendar_seen" },
        { text: `Name Osk, the caretaker.`, goto: "osk_open", cond: "flag.osk_seen_you" },
        { text: `Accuse the Bell itself.`, goto: "bell_open", cond: "flag.knows_static" },
        { text: `"I'm not ready yet." (Retreat.)`, goto: "retreat" },
        { text: `"Never mind." Leave the gym.`, end: true }
      ]
    },
    retreat: {
      speaker: "vasha",
      text: `"Not ready." Vasha pushes off the wall bars. She doesn't sound annoyed; she sounds like someone who has been waiting for another reason to put the cigarette out. "Smart. Nobody should accuse anyone of anything on an empty stomach and a half-thought. Come back when you have it. Properly."\n\nMarr's eyes follow you as you go. They are not impatient. They are the eyes of a woman who has all the time in the world, and knows exactly how much of it you have left.`,
      onEnter: [{ surv: 1 }],
      choices: [{ text: `Leave.`, end: true }]
    },

    // ---------- RHEA PATH ----------
    rhea_open: {
      speaker: "narrator",
      text: `You say her name. "Rhea Vantage."\n\nThere is a sound in the room like a held breath being let out in sections. Rhea's face does not alter. She takes one step forward, boots clicking on the gym floor, and bows her head to the Principal as if apologising for the interruption. "I'm sorry?" she says, mildly. "Did you say my name?"\n\nVasha's cigarette has gone out in her fingers. Marr looks from one of you to the other with the expression of someone watching two small boats come too close in a fog.`,
      onEnter: [{ add: "accuse_rhea_attempts", n: 1 }, { task: "task_rhea", state: "active" }],
      choices: [{ text: `"You hanged the Commissar."`, goto: "rhea_deny" }]
    },
    rhea_deny: {
      speaker: "rhea",
      text: `"I did not." She says it so simply that for a second you consider apologising. "I was asleep. I have a perfect record. Ask the Principal. Ask the duty monitor. Ask anyone who has seen me in eleven years. It is not in my nature to hurt a person who has been kind to me."\n\nShe looks at Vasha. "Lieutenant, with respect, this is a child who woke up on a stage this morning and has been missing a night's memory ever since. He has a tendency to make up stories. It's an illness. It isn't a crime."\n\nShe is very good. She has just recast you as an invalid.`,
      interjections: [
        { skill: "empathy", min: 4, text: `Notice: she never says "I would never". She says "it isn't in my nature". That's a different thing. It means: I've tested my nature, and it did not forbid.` },
        { skill: "authority", min: 4, text: `You are not an invalid. You are an accuser. Say the first piece of evidence. Hit it hard. Don't ask. State.` }
      ],
      choices: [{ text: `Lay out the evidence.`, goto: "rhea_hub" }]
    },
    rhea_hub: {
      speaker: "narrator",
      text: `Four faces. The one lamp. The thick hush of a room waiting for a piece of paper to be put on the table. You have what you have. You've carried it all day in your pockets and your head and now you must decide in what order to lay it down, like a card player who has just discovered that the deck is also a witness.\n\nThe longer you hold your hand, the less it is worth.`,
      choices: [
        { text: `The rope. "It was staged. A Vanguard knot, tied from below."`, goto: "rhea_rope", cond: "flag.clue_rope && !flag.acc_r_rope" },
        { text: `The pin. "Your pin, under the landing mat."`, goto: "rhea_pin", cond: "has('rhea_pin') && !flag.acc_r_pin" },
        { text: `The boots. "There were Vanguard boot-prints on the mat."`, goto: "rhea_boots", cond: "flag.clue_boots && !flag.acc_r_boots" },
        { text: `The slip. "You said you'd never have left the rope like that."`, goto: "rhea_slip", cond: "flag.rhea_slip && !flag.acc_r_slip" },
        { text: `The janitor. "Osk saw you enter the gym at half past one."`, goto: "rhea_osk", cond: "flag.osk_saw_rhea && !flag.acc_r_osk" },
        { text: `Her own words. "You told me, in the Courtyard."`, goto: "rhea_words", cond: "flag.rhea_admitted && !flag.acc_r_words" },
        { text: `Rest the case. "That's enough."`, goto: "rhea_close" },
        { text: `Withdraw.`, goto: "retreat" }
      ]
    },
    rhea_rope: {
      speaker: "narrator",
      text: `You pick up the cut rope from the mat and hold the end to the lamp. "The Commissar was found hanging from the hoop, three metres up. A rope tied on that height, from the ground, by a man of his build? Impossible. And the knot." You turn it in the light. "A cow hitch, backed by a half-hitch. Neat. Square. Taught in Vanguard drill, page forty-one of the Manual. The Commissar couldn't tie a shoelace. You'd have known."\n\nVasha takes the rope from you. She turns it, and turns it again, and her face changes.`,
      onEnter: [{ set: "acc_r_rope", val: true }, { add: "acc_rev", n: 1 }, { xp: 2 }],
      interjections: [{ skill: "deduction", min: 4, text: `Vasha has handled that rope a hundred times in drill. She knows the knot. She's looking at it the way a mother looks at handwriting.` }],
      choices: [{ text: `Go on.`, goto: "rhea_hub" }]
    },
    rhea_pin: {
      speaker: "narrator",
      text: `You open your hand. The little brass pin sits on your palm like a tooth. "Vanguard issue. Winged bell. A bent clasp. It was under the landing mat, where he fell." You lay it on the floor in front of her. "Red-brown fibre in the catch. The same cloth as your sleeve."\n\nRhea doesn't look down. She looks at your face. "A pin," she says quietly, "falls off, a hundred times a term." But she says it a fraction too late, and Vasha has seen.`,
      onEnter: [{ set: "acc_r_pin", val: true }, { add: "acc_rev", n: 1 }, { xp: 2 }],
      choices: [{ text: `Go on.`, goto: "rhea_hub" }]
    },
    rhea_boots: {
      speaker: "narrator",
      text: `"Three sets of boots," you say. "Two Vanguard-issue, regulation sole. One with a pattern of nails hammered in by hand at the heel, for grip on wet floors. The prints go from the big doors to the hoop and back. Not one set came from the fire door." You look at Rhea's feet. "Those are quite distinctive nails, Rhea."\n\nShe doesn't glance down. That is itself an answer.`,
      onEnter: [{ set: "acc_r_boots", val: true }, { add: "acc_rev", n: 1 }, { xp: 2 }],
      choices: [{ text: `Go on.`, goto: "rhea_hub" }]
    },
    rhea_slip: {
      speaker: "narrator",
      text: `"This morning," you say, "in the Courtyard. We were talking, and you laughed. You said: 'I would never have left the rope like that, if I'd had more time.'" You look at Vasha. "Why would she say that, Lieutenant? Why would anyone say that about a suicide?"\n\nRhea gives a small, patient smile. "Hearsay," she says. "Between two children. In the rain." She is right, and the whole room knows it. But Vasha has stopped looking at the floor.`,
      onEnter: [{ set: "acc_r_slip", val: true }, { add: "acc_rev", n: 1 }, { xp: 1 }],
      choices: [{ text: `Go on.`, goto: "rhea_hub" }]
    },
    rhea_osk: {
      speaker: "narrator",
      text: `"The caretaker," you say, and instantly hate yourself a little. "Osk saw three people enter the gym by the big doors at half past one. Rhea first. Two behind, carrying a rolled mat." Vasha turns slowly. "He told you that?" "He told me. He's afraid." You can feel the room recalculating. "I won't bring him here. But he told me."\n\nMarr smiles. "A frightened janitor," she says. "How reliable." The shot lands, and you know it. Evidence that cannot be produced is rumour. It counts for something, but not much.`,
      onEnter: [{ set: "acc_r_osk", val: true }, { add: "acc_rev", n: 1 }, { xp: 1 }],
      choices: [{ text: `Go on.`, goto: "rhea_hub" }]
    },
    rhea_words: {
      speaker: "narrator",
      text: `"You told me yourself," you say, and the room goes strange. "In the Courtyard. When I showed you the pin. You said he was going to read out a ledger at Anthem practice. You said you'd done it quickly. You said the Principal agreed it was right."\n\nRhea stands very still. And then, slowly, one corner of her mouth lifts. "Did I?" she says. "I don't recall." She turns to Marr. "Principal, I should like it noted that I have a perfect memory and no recollection of this. One of us is unwell." It is a lie the size of a building, and she wears it like a coat.`,
      onEnter: [{ set: "acc_r_words", val: true }, { add: "acc_rev", n: 2 }, { xp: 2 }],
      choices: [{ text: `Go on.`, goto: "rhea_hub" }]
    },
    rhea_close: {
      speaker: "vasha",
      text: `Vasha pushes herself off the wall. "Right," she says. "That's what the boy has. Let's see what it weighs." She walks round Rhea in a slow half-circle, as she would around a new recruit, looking at her boots, her hands, her armband. She stops. "Principal. I'm obliged by the regulations to put the matter to you. In your judgement: does the evidence support an arrest?"\n\nMarr smiles at the floor. "How very formal," she says, "and how very like the Lieutenant."`,
      choices: [
        { text: `Wait for the Principal's ruling.`, goto: "rhea_win", cond: "(flag.acc_rev || 0) >= 3 || (flag.rhea_exposed && (flag.acc_rev || 0) >= 1)" },
        { text: `Wait for the Principal's ruling.`, goto: "rhea_fail", cond: "!((flag.acc_rev || 0) >= 3 || (flag.rhea_exposed && (flag.acc_rev || 0) >= 1))" }
      ]
    },
    rhea_win: {
      speaker: "marr",
      text: `Marr says nothing for five seconds. Then six. At seven, she lowers her eyes. "The evidence," she says, in the voice of a woman reading a menu, "is circumstantial in places and in places unusually particular. I am not able, in conscience, to overrule the Lieutenant's judgement." She does not look at Rhea. "Miss Vantage will be held pending District review."\n\nRhea does not run. She stands for a moment as if listening to music no one else can hear. Then she turns to you, and her expression is almost kind. "You'll forget this by morning," she says. "I won't. I'll remember you very well."`,
      onEnter: [{ set: "rhea_exposed", val: true }, { set: "accused_rhea_success", val: true }, { task: "task_rhea", state: "done" }, { task: "task_case", state: "done" }, { xp: 8 }, { surv: 8 }, { ideo: "undercurrent", n: 2 }, { note: "task_case", text: `Rhea Vantage is detained pending District review. The Principal let it happen. Why?` }],
      choices: [{ text: `Watch her go.`, goto: "rhea_after" }]
    },
    rhea_after: {
      speaker: "vasha",
      text: `Two Vanguard cadets, called by Marr's bell, take Rhea by the elbows. They are not rough. They are the same age as her. She walks between them with her chin up, a queen on her way to a minor execution.\n\nVasha lights a new cigarette, her hands not quite steady. "Orders," she says, to the empty floor. "I always did what I was told. I was good at it. You make it hard, kid." Then, lower: "Thank you." She doesn't look at you. She looks at the hoop.\n\nMarr is the last to leave, and as she passes she says without turning her head, "It is always a mistake to cut the thread and leave the needle."`,
      onEnter: [{ morale: 3 }, { thought: "th_big_sister_state" }],
      choices: [{ text: `Leave the gym.`, end: true }]
    },
    rhea_fail: {
      speaker: "marr",
      text: `"Insufficient." Marr says it the way a doctor says "benign". "Circumstantial. Unwitnessed. Uncorroborated. The pin could have fallen from any of two hundred lapels. The knot is common to the whole Vanguard. The janitor, I understand, will not testify." She turns her chilly attention on you. "I am afraid, {name}, that you have made a very serious allegation against a loyal student on the basis of a bad night and a good imagination."\n\n"I shall have to ask the Lieutenant to withdraw her interest. Miss Vantage, you are dismissed with the Principal's apologies."`,
      onEnter: [{ add: "accuse_rhea_fails", n: 1 }, { surv: 15 }, { morale: -2 }],
      interjections: [
        { skill: "empathy", min: 4, text: `Vasha did not defend you. But she did not look away. She stared at the rope the whole time Marr was talking. You are not alone in this room. You are only alone in what you can prove.` }
      ],
      choices: [
        { text: `Hold your ground. "There's more."`, goto: "rhea_hub" },
        { text: `Bow your head and go.`, goto: "rhea_fail_exit" }
      ]
    },
    rhea_fail_exit: {
      speaker: "rhea",
      text: `As she passes, Rhea's hand brushes your collar. It is the gentlest touch she has ever offered you. She smoothes it flat. "Next time," she says, very low, "bring more. I would so hate to have to be tender with you again."\n\nAnd she is gone, leaving behind the smell of boot polish and starch. Vasha says nothing. The lamp hums. In the doorway, a cadet is waiting with a note for you: you have been invited to a re-instruction session. The note is not an invitation.`,
      onEnter: [{ hp: -2 }, { surv: 6 }, { sfx: "hit" }],
      choices: [{ text: `Go.`, end: true }]
    },

    // ---------- MARR PATH ----------
    marr_open: {
      speaker: "narrator",
      text: `"Principal Marr." You hear your own voice from outside yourself. "You gave the order."\n\nThe words don't land. They travel across the floor and sit between you like a dropped glass nobody wants to be seen picking up. Vasha's face goes blank, the face she wears for the Army and for nothing else. Rhea's eyes slide, just once, toward the Principal. Marr herself folds her hands a little more tightly and smiles, and it is the smile of a woman who has been waiting twenty years for someone to say it, so that she can say no.`,
      onEnter: [{ add: "accuse_marr_attempts", n: 1 }],
      interjections: [
        { skill: "instinct", min: 4, text: `Nobody has ever accused her. She doesn't know how to hold it. Look: her thumbs are pressed tight, the first uncertain thing she has done all day. This is the moment. Don't give her time to learn the posture.` },
        { skill: "volition", min: 5, text: `This is the most dangerous sentence you will ever speak. Make sure it has a floor under it.` }
      ],
      choices: [{ text: `"A microphone, in the portrait. A form dated before he died. A memo with your signature."`, goto: "marr_hub" }]
    },
    marr_hub: {
      speaker: "marr",
      text: `"Please," says Principal Marr, with perfect courtesy, "go on. Do give us the evidence. A school is not a place for allegations, only for exhibits." She makes a small, gracious gesture with one hand, like a hostess at a dinner whose guest has dropped the soup. "I am so curious which of my many documents you have found."`,
      choices: [
        { text: `The microphone. "Behind the Warden's portrait there is a microphone. The Commissar tore it down to prove it."`, goto: "marr_mic", cond: "flag.clue_mic && !flag.acc_m_mic" },
        { text: `Form 7-C. "A resignation signed the day before he died."`, goto: "marr_form", cond: "flag.marr_form_seen && !flag.acc_m_form" },
        { text: `The memorandum. "EVENING HARMONIC DOSAGE. Your countersignature."`, goto: "marr_memo", cond: "flag.marr_memo_seen && !flag.acc_m_memo" },
        { text: `Her calendar. "'09:00 — Commissar's body, remove.' Written before anyone found him."`, goto: "marr_cal", cond: "flag.marr_calendar_seen && !flag.acc_m_cal" },
        { text: `The refusal. "You signed the denial of his request for the relay logs."`, goto: "marr_refusal", cond: "flag.marr_relay_refusal && !flag.acc_m_ref" },
        { text: `Rest the case.`, goto: "marr_close" },
        { text: `Withdraw.`, goto: "retreat" }
      ]
    },
    marr_mic: {
      speaker: "narrator",
      text: `"The portrait," you say. You walk to the wall and point up at the torn rectangle of paper hanging off the nail. "Behind the Warden's face there is a microphone. A small one. Brass, with a wire into the plaster. The Commissar tore the portrait to prove it. He tore it a second time, I think, when he knew he was caught. Look at the second tear." You turn. "Why does a gymnasium need a listening device, Principal?"\n\nMarr tilts her head. "For safety," she says. "All schools have them. How else could we keep the children from harm?"\n\nBut Vasha is staring up at the wall. She has been in this gym for twelve years. Her mouth is a little open.`,
      onEnter: [{ set: "acc_m_mic", val: true }, { add: "acc_mev", n: 2 }, { xp: 3 }],
      choices: [{ text: `Go on.`, goto: "marr_hub" }]
    },
    marr_form: {
      speaker: "narrator",
      text: `"Form 7-C," you say. "Voluntary termination, by deceased. Signed, witnessed by O. Marr. Dated yesterday." You hold the line in the air as if it were visible. "He died last night, Principal. Or early this morning. The form was signed and witnessed the afternoon before. You filled in the paperwork for a suicide that hadn't happened yet."\n\nMarr says, with great gentleness, "Paperwork is merely anticipation." But her hands have gone very still.`,
      onEnter: [{ set: "acc_m_form", val: true }, { add: "acc_mev", n: 2 }, { xp: 3 }],
      choices: [{ text: `Go on.`, goto: "marr_hub" }]
    },
    marr_memo: {
      speaker: "narrator",
      text: `"EVENING HARMONIC DOSAGE, SCHEDULE OF." You recite it as you would a litany. "Fourth column: AMNESIC FRACTION. District letterhead. Countersigned, four years ago: 'Understood. We shall ensure the children are comfortable.' O. Marr."\n\nVasha looks at the Principal. "What does that mean, 'amnesic'?" she asks, in a tone of voice she did not know she still owned. Marr turns the full weight of her calm on her. "Lieutenant, it means the children sleep." "That's not what it says." "It is exactly what it says. You should read more closely."`,
      onEnter: [{ set: "acc_m_memo", val: true }, { add: "acc_mev", n: 2 }, { xp: 3 }, { set: "knows_static", val: true }],
      choices: [{ text: `Go on.`, goto: "marr_hub" }]
    },
    marr_cal: {
      speaker: "narrator",
      text: `"Her calendar," you say. "On her desk. '07:30 — Check Voran (stage). 09:00 — Commissar's body, remove.' She wrote the removal before anybody discovered the body. In the imperative tense." You turn to Marr. "You knew where I'd wake up. You knew what would be in the gym. You planned the day."\n\nMarr takes her time. "Calendars," she says, "are optimistic documents."\n\nIt's the nearest thing to a joke you've ever heard her make, and nobody laughs.`,
      onEnter: [{ set: "acc_m_cal", val: true }, { add: "acc_mev", n: 1 }, { xp: 2 }],
      choices: [{ text: `Go on.`, goto: "marr_hub" }]
    },
    marr_refusal: {
      speaker: "narrator",
      text: `"Three days ago," you say, "the Commissar asked to see the D9 relay logs. You signed the denial. You told me so yourself: 'I signed the refusal myself.' He wanted to look at something you were forbidden to show him, and a few days later he was dead."\n\nMarr nods, slowly, appreciatively. "That is correct. I signed the refusal. It was my duty. A refusal is not a murder, {name}. If it were, I'd have a great many more bodies on my conscience." It is a small, dry, appalling joke.`,
      onEnter: [{ set: "acc_m_ref", val: true }, { add: "acc_mev", n: 1 }, { xp: 2 }],
      choices: [{ text: `Go on.`, goto: "marr_hub" }]
    },
    marr_close: {
      speaker: "narrator",
      text: `You stop. The silence that follows is not empty. It is full of things neither side can afford to say. Rhea is looking at the floor. Vasha is looking at Marr. Marr is looking at nothing, which she does better than anyone alive.\n\n"Is that your case?" the Principal asks at last. "Because if it is, I should like to ask you a question, {name}. Just one. I have been very patient, and patience is a currency I do not spend lightly."\n\nShe takes a step toward you. The heels of her shoes click on the gym floor like a clock.`,
      choices: [
        { text: `Stand firm. "Ask."`, goto: "marr_win", cond: "(flag.acc_mev || 0) >= 6" },
        { text: `Stand firm. "Ask."`, goto: "marr_fail", cond: "(flag.acc_mev || 0) < 6" }
      ]
    },
    marr_win: {
      speaker: "marr",
      text: `"Who," says Principal Marr, "do you think will believe you?"\n\nIt is a good question, and she asks it kindly. And the answer, to your surprise, is: Vasha. In the corner, the Lieutenant has uncrossed her arms. She is looking at the Principal, and then at the rope, and then at the torn portrait, and then at her own two hands, and something in her face has made a decision. "I believe him," says Lieutenant Kell. It is not loud. It is the sound of a door that has finally been allowed to open.\n\nMarr smiles. "How unfortunate." She presses a small button concealed under the wall bars you hadn't seen. Somewhere, a bell rings.`,
      onEnter: [{ set: "marr_exposed", val: true }, { set: "accused_marr_success", val: true }, { task: "task_case", state: "done" }, { xp: 10 }, { surv: 15 }, { ideo: "undercurrent", n: 3 }, { thought: "th_unsanctioned" }, { note: "task_case", text: `I named Marr as the order-giver, in front of Vasha. Vasha said "I believe him." Marr pressed a bell. This is not over. This is the beginning.` }],
      choices: [{ text: `"Run," says Vasha. Run.`, goto: "marr_win_after" }]
    },
    marr_win_after: {
      speaker: "vasha",
      text: `"Out the fire door. Go." Vasha has taken your elbow and is propelling you across the gym in a way that is neither kind nor unkind but entirely professional. "I will hold them. I owe a few people some holding." She does not say who. She straightens her tracksuit and turns to face the corridor, and her voice, when it comes, is the voice she used to use on a parade ground. "Principal. I should like, with respect, to see your authority."\n\nMarr's reply is lost in the clatter of boots. You are through the fire door and into the dusk, with the Ledger or the memory of it burning your ribs, and the evening before you like a sheet of black ice. Behind you the Warden's torn portrait gapes. The microphone, for the first time in its life, hears nothing.`,
      onEnter: [{ time: 5 }],
      choices: [{ text: `Run.`, end: true }]
    },
    marr_fail: {
      speaker: "marr",
      text: `"Who do you think will believe you?" she asks. Her voice is so soft that the question seems to have come from the walls. And you look round the room and find there is no answer: Vasha has not moved from the bars, Rhea has the pleasant blank face of a girl in church, and the evidence, which had felt so large in your pockets, lies in the open air like a handful of dead leaves.\n\n"No one," Marr says, answering for you. "No one will believe you, because it would be inconvenient. That is the entire mechanism of my profession." She nods to Rhea. "Miss Vantage. The boy is overtired. Take him to the infirmary."\n\nThe door opens. The infirmary is not an infirmary.`,
      onEnter: [{ add: "accuse_marr_fails", n: 1 }, { surv: 25 }, { hp: -3 }, { morale: -3 }, { sfx: "hit" }],
      interjections: [
        { skill: "grit", min: 3, text: `You will heal. The school will not. Remember who stood there with her hands folded.` },
        { skill: "instinct", min: 5, text: `She said "tonight". She said it twice, in the corridor, when she thought you weren't listening. Whatever she's planning, the Bell is part of it.` }
      ],
      choices: [
        { text: `Struggle. "There's more!"`, goto: "marr_hub" },
        { text: `Go with Rhea. (End the confrontation.)`, goto: "marr_fail_exit" }
      ]
    },
    marr_fail_exit: {
      speaker: "narrator",
      text: `The infirmary has a camp bed, a lamp, and a single chair. Rhea sits in the chair. She does not hit you. She is far too good at her work for that. She asks you the same eleven questions in eleven different orders, and the answers hurt less than the way she writes them down. Four hours later you are let out into the Courtyard, bruised, stamped, and slightly more obedient.\n\nIn your file, in violet ink, a new note: CANDID. UNREPENTANT. MONITOR.`,
      onEnter: [{ time: 90 }, { surv: 10 }],
      choices: [{ text: `Stumble out.`, end: true }]
    },

    // ---------- OSK PATH ----------
    osk_open: {
      speaker: "narrator",
      text: `You say it. You say his name. "Osk Brannic, the caretaker." The words sit in your mouth like cold coins. "He was seen leaving the gym at ten past two. He keeps rope in the shed. He had a grudge against the Commissar, and the keys to the doors."\n\nThere is a long pause. Marr's face doesn't change. Vasha's does: a small, exact flinch, as if you'd stepped on something at the bottom of a pocket she hadn't known was there. Rhea inclines her head, grave and approving. It's the nod of a teacher whose pupil has finally got the sum.`,
      onEnter: [{ add: "accuse_osk_attempts", n: 1 }],
      interjections: [
        { skill: "doublethink", min: 3, text: `Beautiful. Concise. A narrative with a beginning, a motive and a villain. Everyone in this room will be comforted. Isn't that the point of justice?` },
        { skill: "empathy", min: 3, text: `You're talking about the man who said "somebody remember I offered". Say that to yourself, while you're speaking. Slowly.` },
        { skill: "solidarity", min: 3, text: `NO. We do not feed the machine one of our own. We do not. You know what happens next. Stop talking.` }
      ],
      choices: [
        { text: `Keep going. Sell it.`, goto: "osk_sell" },
        { text: `Stop. Take it back. "I'm sorry. I was mistaken."`, goto: "osk_retract" }
      ]
    },
    osk_retract: {
      speaker: "marr",
      text: `"Mistaken." Principal Marr lets the word hang. "A fascinating decision, in the middle of a sentence. I trust you will make up your mind before five o'clock tomorrow, as I shall want a name by then. Whichever name it is." She smiles. "I shall wait. One does so enjoy a boy who deliberates."\n\nVasha says nothing, but lets out a long breath, and, for a moment, her shoulders drop an inch. Rhea's smile is thin and patient.`,
      onEnter: [{ surv: 5 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Leave.`, end: true }]
    },
    osk_sell: {
      speaker: "narrator",
      text: `You turn to Vasha, because she is the only one who needs to be convinced. "He keeps the keys. The fire door was unlocked at two. His broom was seen by the side door. He loved the Commissar and the Commissar threatened to report him for pilfering." (This last is Rhea's line, and she mouths it with you, a half-second ahead, like an echo.) "It's the only thing that fits."\n\nVasha frowns, thinks, frowns more. "Osk?" she says. "Old Osk?" She sounds bewildered. "He cried at the funeral of a pigeon."`,
      choices: [
        { text: `Insist. Make the case airtight.`, check: { skill: "rhetoric", diff: 11, id: "accuse_osk_sell", pass: "osk_sold", fail: "osk_help" } },
        { text: `Put on your best authority. "Lieutenant. I'm telling you what I saw."`, check: { skill: "authority", diff: 12, id: "accuse_osk_authority", pass: "osk_sold", fail: "osk_help" } }
      ]
    },
    osk_help: {
      speaker: "marr",
      text: `You falter, and the silence is filled for you. "It does fit," says Principal Marr, mildly, as though helping a child with a difficult sentence. "I had, in fact, a similar suspicion. There is a report on my desk about the caretaker's behaviour that I have, until now, been reluctant to put forward. I am grateful to you for supplying the missing link." She steps between you and Vasha. "Lieutenant, I believe this is concluded."\n\nVasha looks at her. At you. At the rope. She says nothing, and a gap opens in the room where a sentence should be.`,
      onEnter: [{ surv: -4 }],
      choices: [{ text: `Let it happen.`, goto: "osk_inner" }]
    },
    osk_sold: {
      speaker: "narrator",
      text: `It comes out of you perfectly. The case builds itself, brick on brick, each detail snapping into the next like machine parts, each plausible, each damning. You hear it in your own voice and are impressed, the way you are impressed by a well-made forgery. Vasha's frown deepens into acceptance. Rhea lowers her eyes with the humility of a person who is not at all surprised. Marr claps her hands together, once, softly, and says: "Excellent. Concise, logical. Entirely persuasive. A model statement."`,
      onEnter: [{ xp: 2 }, { surv: -5 }],
      choices: [{ text: `Let it settle.`, goto: "osk_inner" }]
    },
    osk_inner: {
      speaker: "volition",
      text: `This is the last place in the building where you can still take it back. After the next sentence the janitor stops being a man and becomes a column on a form. After the sentence after that, you'll be a person who did this. Not a monster. A person who did this, and went on to eat supper.\n\nOsk is in the Courtyard right now, thinking about a broom. He offered himself. Did you really hear what he meant? He meant: if you must, you must. He did not mean: please. He meant: I forgive you in advance, and I wish I didn't have to.`,
      interjections: [
        { skill: "empathy", min: 3, text: `He is sweeping. He is sweeping. He is sweeping.` },
        { skill: "doublethink", min: 4, text: `He volunteered. That's the genius of it. He consented. You're not framing him, you are accepting a gift. A gift is only impolite to refuse.`, cond: "flag.osk_volunteered", effects: [{ surv: -2 }] }
      ],
      choices: [
        { text: `Finish it. "Take him into custody."`, goto: "osk_confirm" },
        { text: `Swallow it. "I... I'm not certain. I withdraw."`, goto: "osk_retract" }
      ]
    },
    osk_confirm: {
      speaker: "vasha",
      text: `Vasha looks at you for a long, long time. She doesn't argue. She doesn't say it's wrong. It might have been better if she had. "If that's your statement," she says, and her voice is toneless, "I'll take it down. I'll take it down exactly as you say it. And you can sign it. And that's the end of it." She takes out her notebook, the one she thinks nobody knows about, and begins to write. Her pencil moves like someone stirring something they do not want to drink.\n\n"Sign here, kid."`,
      choices: [{ text: `Sign.`, goto: "osk_done" }, { text: `Put down the pen. "No."`, goto: "osk_retract" }]
    },
    osk_done: {
      speaker: "narrator",
      text: `The pencil is blunt and warm from her hand. You sign your name, {name} Voran, in a clear round student hand. The loop of the V is steady. It's the neatest signature you've ever made. Principal Marr blots it with a pad as soft as snow, and holds it up to the lamp, and smiles with the first and last wholehearted warmth you will ever see from her.\n\n"There," she says. "It is a great relief to everyone."\n\nSomewhere beyond the gym a bell begins to ring.`,
      onEnter: [{ set: "osk_scapegoat", val: true }, { task: "task_osk", state: "failed" }, { task: "task_case", state: "done" }, { ideo: "vanguard", n: 3 }, { surv: -15 }, { xp: 3 }, { note: "task_osk", text: `I signed the statement. Osk Brannic will be named as the man who hanged the Commissar.` }, { thought: "th_good_citizen" }],
      choices: [{ text: `Walk out into the evening with your badge.`, end: true, effects: [{ ending: "end_good_student" }] }]
    },

    // ---------- BELL PATH ----------
    bell_open: {
      speaker: "narrator",
      text: `"I accuse," you say, "the Bell."\n\nIt is the least dignified sentence you have ever uttered. It sits in the gymnasium like a shoe in a fishbowl. Vasha's cigarette tilts slowly in her mouth. Rhea blinks, once, and for the first time she does not appear to know what her face should do. Marr's eyebrow rises, a quarter of an inch, a very great deal of movement for her.\n\n"The Bell," she repeats, carefully, as if the word had become fragile. "Is the Bell on the staff register?"`,
      onEnter: [{ add: "accuse_bell", n: 1 }],
      interjections: [
        { skill: "rhetoric", min: 3, text: `You cannot win this. But you can make them hear it said. Words in a room are a kind of weather. Some of them stay.` },
        { skill: "dialectics", min: 4, text: `Technically: the Bell caused the forgetting, the forgetting permitted the cover-up, the cover-up enabled the murder. Causation, therefore. Who built it? Who keeps the key? There's your culprit. A chain with five links.` }
      ],
      choices: [
        { text: `"Every night at nine, it takes something from us. Ask the Lieutenant what she did last night."`, goto: "bell_vasha" },
        { text: `"You know what it is, Principal. Tell them."`, goto: "bell_marr" },
        { text: `Realise how absurd it sounds. Back down.`, goto: "retreat" }
      ]
    },
    bell_vasha: {
      speaker: "vasha",
      text: `Vasha's mouth opens. Then closes. "Last night," she says. "Last night I..." She stops, and the stop is enormous. "I was in my quarters. I think. I had cocoa. There was cocoa." She presses a thumb between her eyes. "I can't tell you what I did between supper and the Bell. I can't. I never thought it was strange."\n\nHer voice goes thin. "Is that normal? Is that supposed to happen?" Her face is naked with a fear she has been carrying for years without a name.\n\nMarr moves smoothly between you. "The Lieutenant is tired," she says. "It has been a trying day."`,
      onEnter: [{ xp: 3 }, { set: "vasha_doubts", val: true }, { surv: 8 }],
      choices: [{ text: `Press on.`, goto: "bell_end" }]
    },
    bell_marr: {
      speaker: "marr",
      text: `"What it is," says Marr, in an even, pleasant voice, "is a lullaby. It is a hymn. It is a gift from the District to the weary children of the Union." She takes a step toward you. "If you say otherwise in this room again, in front of two witnesses, I shall be obliged to note it."\n\nShe turns her head. "Miss Vantage. The Lieutenant. You have both heard what the student said. I trust you will remember it?"\n\nRhea says "Yes, Principal." Vasha says nothing at all.`,
      onEnter: [{ surv: 18 }, { xp: 2 }, { ideo: "undercurrent", n: 1 }],
      choices: [{ text: `Press on.`, goto: "bell_end" }]
    },
    bell_end: {
      speaker: "narrator",
      text: `It doesn't work, because it cannot. A thing without a body cannot be arrested. A system cannot be taken into custody. The Bell goes on tolling at nine whether or not it is named, and the only result of your accusation is that four people now know that you know. But a word has been said in a room, and the room has heard it. Vasha leaves by the fire door without speaking. Rhea watches her go. Marr straightens a lapel.\n\n"The student is unwell," says the Principal. "I think we all agree. Let us have a restful evening."`,
      onEnter: [{ surv: 6 }],
      choices: [{ text: `Leave.`, end: true }]
    }
  }
},

// ===================== EPILOGUES =====================
ending_end_good_student: {
  title: "The Good Student",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The statement is read out at assembly the next morning, by a man in a good coat who has never visited the school before. The caretaker, Osk Brannic, aged sixty-one, thirty-one years of faithful service, has confessed in full to the unfortunate death of the Youth Commissar. He did so, the man reports, with real remorse. He asked only that someone remember he had offered. Nobody does. There is a polite round of applause, the kind given to a weather report that has come out as expected.\n\nYou are on the stage, in a clean uniform, with a brass profile of the Warden pinned to your lapel. Rhea Vantage is promoted to Vanguard Sergeant for exemplary vigilance. Principal Marr shakes your hand. Her fingers are dry and cool and she does not let go until the photographer has finished.`,
      interjections: [
        { skill: "doublethink", min: 2, text: `Look at that. Look at how good it feels. You belong. You are inside the wall, and the wall is warm.` },
        { skill: "empathy", min: 3, text: `Somewhere beyond the gym, a broom is leaning against a stove. Nobody has told it yet.` }
      ],
      choices: [{ text: `Continue.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `That night, at twenty-one hundred, the Bell rings, and the choir sings the Anthem of Steady Hands, and you lie in your narrow bed with the warm brass cold against your chest, and the day goes out of you like a tide. In the morning you remember that you were praised. You remember a handshake, a flash, a feeling of enormous and unearned rightness. You remember nothing about why.\n\nThe Ledger stays in its hollow plinth, wrapped in a flag, and nobody comes for it. Pigeons nest in the Warden's Father's open hand. In the stove-room behind the Hall there is a chair no one sits in, and a cup that stays on the shelf for years because no one can decide whether it belongs to anyone.\n\nYou rise in the Union, quietly. You are very good at it. You will become, one day, a Commissar yourself, and will have a window, and a view, and a stubborn ringing in your ears that you will put down, all your life, to the weather.`,
      onEnter: [],
      interjections: [
        { skill: "the_grey", min: 2, text: `I keep the cobbles. I keep the scuff-marks where a man swept the same leaf into the same pile for thirty-one years. I am not sentimental. But I notice that they are the cleanest cobbles in the district, and that nobody is cleaning them.` }
      ]
    }
  }
},

ending_end_ledger: {
  title: "The Seed",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `Nothing happens. That is the first thing you learn about the quiet kind of revolution: it looks, from outside, exactly like a school day. The Bell rings that night at twenty-one hundred. The choir sings. You lie awake, and then you do not, and in the morning you remember a pleasant tiredness and a feeling that you did something right and cannot say what. There is a cup of tea on the shelf by your bed that you did not make.\n\nIn the boiler room, behind a false back in a stove, a book is opened by lamplight. It is copied nine times, by nine hands, on nine typewriters, in the margins of nine Catechisms. A woman in the mills puts it in a bread-oven. A man in a post office sticks a page behind a stamp-tray. A girl in a wheelchair, in a distant town, finds a radio that can read the beat inside a lullaby.`,
      interjections: [
        { skill: "solidarity", min: 2, text: `We are not one. We are nine, and then ninety, and then a table of us, and then a whole long street of kitchens. We are a very slow thing. We are very hard to stop.` },
        { skill: "the_grey", min: 3, text: `I do not take sides. But I know where the water goes when it rains, and I tell you: it goes down.` }
      ],
      choices: [{ text: `Continue.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `It takes three years. It takes one person, then four, waking up on a morning with the wrong sort of silence in their head. They find each other the way damp finds a wall. They do not storm anything. They sit down at tables and write what they remember, on purpose, together. The Static does not end all at once; it frays, like a rope that has been rubbed against a rock.\n\nYou, meanwhile, go to school. You pass your exams. You are quiet and are known to be reliable. Every Thursday you go down to the boiler room with a loaf of bread and sit in the chair that fits you, across from an old woman in a lab coat, and every Thursday she says, "Have we met?" and you say, "I think so," and she pours the tea.\n\nOne evening, years on, you are walking home through the district. A loudspeaker on a pole begins its nightly hum. You stop. The ringing in your ears, the old private tone, lifts slowly to meet it. You find that for the first time in your life you are not afraid of the sound. You are listening to it, the way you listen to a pulse.`,
      onEnter: [],
      interjections: [
        { skill: "empathy", min: 3, text: `She never remembers. She pours the tea anyway. That is the whole of it. That is the entire revolution: someone pouring the tea anyway.` }
      ]
    }
  }
},

ending_end_static: {
  title: "The Broadcast",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `For nine minutes and twelve seconds, the Harmony Broadcast is wrong. The Bell rings, the choir begins, and in the gap between the notes a shaky voice comes over every loudspeaker in the district reading figures from a blue-cloth book. Dates. Durations. A column headed WHAT THEY TOOK. In the Ration Hall, Choirmaster Fenwick Alder, who was not told, keeps conducting with his eyes shut and tears running into his collar. Ilsabet Orrin sits in her wheelchair at the foot of the stage, her ear to a wire, mouthing the numbers a half-second before you speak them. In a thousand kitchens, a thousand people stop with a spoon halfway to their mouths.\n\nAt minute nine the doors burst open. The sentry is not a bad man. He is carrying a form.`,
      interjections: [
        { skill: "adrenaline", min: 3, text: `YOU DID IT. YOU DID THE THING. Whatever happens next, you did the thing!` },
        { skill: "solidarity", min: 3, text: `We heard. All of us. Every house. We heard you, and we heard each other hearing.` },
        { skill: "volition", min: 4, text: `Don't stop. Not mid-sentence. Finish the sentence. It is the only part of your life that is entirely your own.` }
      ],
      choices: [{ text: `Continue.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `They take you away at nine past nine, still holding the paper. By morning the Bell has done what it does, and nine hundred children wake with their evenings blurred, as always. But not entirely. Sixteen of them wake with a sentence stuck behind their teeth, a number they cannot place, the word "ledger" like a splinter. A boy in the third form writes WHAT THEY TOOK on a desk-lid in pencil and cannot say why. A girl scratches a small bell with a cross through it on a toilet door, and by the end of the week there are thirty.\n\nThe Principal calls it a prank. The District calls it a malfunction. A man comes with a ladder to inspect the portraits, and the portraits are found to have been, all along, quite thoroughly listening.\n\nYou will not remember the cell, or the reading, or the night. They will tell you it was a fever. But in a ward in a district hospital, someone leaves a window open, and the first stir of the night wind through the pipes sounds, if you hold your breath, very like a roomful of children beginning, softly and out of tune, to ask a question.`,
      onEnter: [],
      interjections: [
        { skill: "the_grey", min: 2, text: `I heard it. Concrete is the best listener in the world. We hold sound for years. Every word you said in that room is still in the walls of the Ration Hall, waiting for a tap on the plaster.` }
      ]
    }
  }
},

ending_end_quiet: {
  title: "Ration Tea",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `The tea is warm. It tastes of cloves, and orange peel, and a sweetness under the sweetness that you do not examine. You drink it slowly, standing in the gap of the gate, and as it goes down you feel the day going out of you like a long, pleasant breath: the Commissar's face, the girl in red, the cold weight of a book that was never in your arms. By the time you reach the bus, there is only a faint kindly blur behind your eyes, like the memory of a good film you've forgotten the plot of.\n\nThe 9 route is half-empty. A woman with a string bag nods at you. The lamps go by, small yellow sums, each adding to the next. You count them. You reach your stop at nineteen.`,
      interjections: [
        { skill: "appetite", min: 2, text: `Warm. Sweet. Nobody asking anything. Isn't it simply the nicest thing? Don't you feel just lovely?` },
        { skill: "volition", min: 3, text: `You chose this. Remember that you chose this. Not because you will, but because you ought to have the option of having remembered.` }
      ],
      choices: [{ text: `Continue.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `Your mother has made soup. She asks about the Examination, and you tell her, truthfully, that you passed, or that it went fine, or that it was an exam. She pats your hand. You eat. You sleep without dreaming. The Bell rings at nine in the kitchen's little speaker and you hear it as you have always heard it, as a sort of tender weather.\n\nYou grow up. You become a clerk at the Relay Office on Cinder Street, where the work is quiet and the pension is good. You are known for your courtesy and your excellent hearing. You marry; you have a child; you teach her the Eleven Thanks. On certain evenings, at about nine, you find yourself standing very still at the kitchen window with your hand against the glass, and a faint tone in your ears that you cannot place, and an unexplained heaviness, as if you had left a sentence unsaid in some far-off room.\n\nYou put it down to the weather. In the Courtyard of School No. 9, a pigeon sits in the open hand of a statue that is hollow, and has been for a very long time. The tea, it turns out, is excellent. It always was.`,
      onEnter: [],
      interjections: [
        { skill: "the_grey", min: 2, text: `I did not hold it against you. You were seventeen. You were tired. A very great many people have taken the tea. It is, in its way, the kindest thing in the country. That is why it is the cruelest.` }
      ]
    }
  }
},

ending_end_arrested: {
  title: "Resolved",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `Nobody shouts. That is what you will find strangest. Two men in grey coats come for you quite politely in the corridor, as if fetching you to a dentist. One of them even holds the door. In the van there is a thermos, and a paper cup, and a small card on the seat that reads: THE UNION REGRETS THE INCONVENIENCE.\n\nThe room they take you to has a table, two chairs, and no windows, but it is warm and smells of floor-polish and weak soup. The interrogator is a woman of about forty, in a cardigan, with a face you might trust at a bus stop. She introduces herself as Miss Pell. She offers you biscuits. She has your file open on the desk, and it is very, very thick.`,
      interjections: [
        { skill: "composure", min: 3, text: `Don't take the biscuit. Take the biscuit. You can't win this by refusing the biscuit.` },
        { skill: "grit", min: 3, text: `It isn't going to hurt. That's the first shock. It's going to be reasonable. You'll almost wish it hurt.` }
      ],
      choices: [{ text: `Continue.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `"We're not angry," says Miss Pell, and she means it. "Not in the slightest. We only wish to understand what it was you were looking for." She turns a page. In the margin, in the Principal's round hand: Intelligent. Persistent. Static-resistant. She taps the line. "That is the part we find interesting."\n\nThey do not beat you. They do something more thorough. They sit with you, and talk, and feed you, and talk, and over the course of the afternoon they take, with great gentleness, one hour at a time, everything you know. When it is over, a clerk stamps the folder, in violet ink: RESOLVED.\n\nAt nine, the Bell rings in your cell. You hear it as clearly as you have ever heard anything. You lie on the cot with your eyes open and feel the day lift away, a little less stubbornly than usual, like a bandage soaked free. In the morning you cannot remember the name of the girl you were trying to protect. You remember only that it was important. They tell you that you may go home soon. They tell you that you were very brave.`,
      onEnter: [],
      interjections: [
        { skill: "the_grey", min: 2, text: `The cell is concrete. I know it well. It is the same concrete as the school's. Every wall in the Union was poured on the same afternoon by the same patient hands. You have never really left.` }
      ]
    }
  }
},

ending_end_curfew: {
  title: "Twenty-One Hundred",
  start: "a",
  nodes: {
    a: {
      speaker: "narrator",
      text: `Nine o'clock comes the way a tax comes: no louder than it has to. The loudspeakers on their poles click. In the Courtyard, in the Hall, on the stairs, in the boiler room, in every kitchen in the quarter, the Bell begins. A single pealing tone, round and golden and terribly kind. Behind it, a second tone, a few cycles off. And behind that, the choir. Everyone stops. Everyone has always stopped.\n\nYou are standing in the middle of a corridor with an unfinished thought in your hand. It is a good thought. It feels, dimly, like the best thing you've ever had. The hum rises. Your ears warm. And the thought, slowly, politely, slides out of your fingers like a coin down a drain. You try to keep hold of it. You are very strong. It is stronger.`,
      interjections: [
        { skill: "the_grey", min: 2, text: `I feel it too, you know. When the Bell rings, the concrete rings. It is a long, low, shuddering note. I have never once been able to answer it.` },
        { skill: "volition", min: 3, text: `Hold. Hold something. Hold one thing. A name. A colour. A smell. Hold the cold of the cobbles.` }
      ],
      choices: [{ text: `Continue.`, goto: "b" }]
    },
    b: {
      speaker: "narrator",
      text: `The first thing you notice is the dust. It is in your mouth, and in your hair, and on the planks under your cheek. You are lying on a stage. A cracked mirror leans against the wall, and in it a face you recognise, with dark smudges, and a torn collar. Your head rings, an old, particular ringing, like a bell that does not know it has been struck.\n\nA shaft of cold-gold light from a high window lights a tin horn on the wall. The poster by the door says THE WARDEN HEARS. You sit up. Your memory is a clean white sheet. You know, absolutely, that you had a day. You do not know what was in it. The only evidence that anything happened is a faint sensation, like a splinter, like an itch behind the eyes, that this has all happened before.\n\nIt is half past seven. The school day is about to begin. Tomorrow, you are told, will be the same as today.`,
      onEnter: [],
      interjections: [
        { skill: "doublethink", min: 2, text: `A fresh page. A clean start. Isn't that the Union's great gift? Every morning, a new you. Stand up. Brush yourself off. Be a good citizen. Be nothing at all.` },
        { skill: "empathy", min: 3, text: `Somewhere under the school, in a warm room, an old woman is making two cups of tea, and has left one by an empty chair. She doesn't know why she does it. She does it anyway.` }
      ]
    }
  }
}

};

})();
