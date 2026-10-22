(function(){ const GD = (window.GD = window.GD || {});
// ===== ACTS II & III ambient barks. Merged into GD.barks (per skill), plus day- and location-specific pools. =====
const more = {
  dialectics: [
    "The Inspector says he is here to close the case. A case that can be closed was never open. Discuss.",
    "Grand Harmony: everyone agrees because nobody remembers disagreeing. That is not consensus; that is amnesia with a choir.",
    "If the Ministry of Quiet Hours exists, someone has been making noise. QED, and he is wearing a grey coat.",
    "A library of forbidden books proves only that the State reads more than it admits.",
    "'Nothing happened on Tuesday.' You were there. Nothing is an eyewitness.",
    "A queue is a syllogism: bread is scarce, therefore wait; waiting is virtue, therefore bread is scarce."
  ],
  rote: [
    "Virtue the Tenth, added Wednesday: the Pioneer shall remain calm at the Jubilee. Virtue the Eleventh is classified.",
    "'The Warden's Jubilee: three days of joy, one night of rest.' Rest is a euphemism you can recite in your sleep.",
    "Oath of the Youth, appendix: 'I shall not remember anything I was not asked to remember.'",
    "Slogan for the Relay: 'ONE TONE, ONE UNION.' It rhymes only if you have been hit.",
    "The Anthem has eleven verses. Nine are sung. One is forgotten. One is on the wall of the vault.",
    "Karsov Avenue was named for a general who lost every battle and won every portrait."
  ],
  deduction: [
    "A black car, engine cold, mud on one tyre only. It was parked here to be seen.",
    "The Inspector's cuffs are frayed on the left. He writes with his right. He has been carrying something heavy on his left, for years.",
    "A dormitory floorboard that squeaks only when you step on it forwards. Somebody practised stepping backwards.",
    "Fresh solder on a very old radio. Someone is building something, and not on the Ministry's budget.",
    "The ration queue has gaps at regular intervals, as if people were stepping out to report. I deduce informers, three of them, and I am wearing one.",
    "The relay gate's padlock is newer than the gate. Someone does not trust the gate."
  ],
  rhetoric: [
    "Today you will meet an Inspector. Do not open with the truth. Open with the weather and work toward the truth by degrees.",
    "A queue is the perfect audience: captive, hungry, and grateful for any distraction that is not bread.",
    "'Dear citizens of District 9...' A fine beginning. It needs only the middle and the end.",
    "Persuade a guard with a joke; persuade an officer with a rule; persuade a Principal with her own hand-writing.",
    "On the tower they will hear you in every street. Choose the first sentence like a coat you will be buried in.",
    "A Jubilee audience is the best of all: it has agreed to applaud and has not yet been told what for."
  ],
  doublethink: [
    "Wednesday is a lovely day. You will remember it fondly. We will help you.",
    "The Inspector is here for your safety. The Inspector is here for your arrest. Both statements are warm and sincere.",
    "Do not worry about the Jubilee. Grand Harmony is a gift. Gifts are not mandatory. Accepting gifts is.",
    "There is no relay. There is a building that is definitely not a relay, with a bell that is definitely not a Bell.",
    "I have taken the liberty of rehearsing your confession. It is very short. You come across well.",
    "If you forget Thursday it was never inconvenient. That is the whole point of forgetting."
  ],
  archive: [
    "Regulation 22: visitors to the Relay shall have a pass, a purpose and a person to blame.",
    "The Library catalogues 41,212 titles; the Index of Prohibited Works lists 41,213. Someone owes a title.",
    "Ministry of Quiet Hours, est. year six of the Warden. The founding charter has no signatures. It has only initials.",
    "Matron's ledger: 14 years, 3 volumes, 1 stain. The stain is sherry. The sherry is also a regulation.",
    "The Jubilee was last held in year 12. Nobody remembers anything about it. This is not a coincidence; this is a precedent.",
    "A forged pass is a legal fiction. A real pass is a legal fiction with a stamp. See the difference? No? Good."
  ],
  empathy: [
    "The dormitory sighs at night. Twelve people dreaming one worry. Wren sleeps through it. Wren is not worried. That worries you.",
    "Inspector Voss smiles with his mouth a half-second after his eyes. Someone has taught him to be kind at a delay.",
    "Matron Pritt is lonely in the specific way of people who know everything about everyone and are known by none.",
    "The queue is not angry. The queue is ashamed of being hungry in public.",
    "Kell is being kind to you on purpose. It costs her something every time. Say thank you, or at least do not flinch.",
    "Hob has not spoken in thirty years. That is not silence. That is grief with a good memory."
  ],
  volition: [
    "Day two. You are still here. That counts. Count it.",
    "Do not look at the Jubilee banners. Look at the next thing you need to do.",
    "Three days is not long. It is long enough to be a different person. Pick which.",
    "You woke up. That is the first check, and you passed. Do it again tomorrow.",
    "Whatever the Inspector says, you are allowed to leave the room. It is the most underused right in the Union.",
    "You will be tired by evening. That is permitted. Quitting is not."
  ],
  authority: [
    "A man in a good coat is only an authority until you stop treating him like one. Stand a little straighter than he does.",
    "Guards respond to posture. Be tall in the shoulders and boring in the face.",
    "Matron Pritt rules a third floor of terrified teenagers with a clipboard. Study her. Learn from the tyranny of small things.",
    "The Inspector lowers his voice when he gives orders. You could try it. You could also try not giving orders.",
    "You do not have to shout. Shouting is the authority of people who are sure they will be ignored.",
    "A badge is an argument that does not need to be spoken. Wear it as one."
  ],
  instinct: [
    "The black car has been parked here since six. It does not move. Cars that do not move are listening.",
    "Something is wrong with the dormitory. It is quieter than twelve sleepers should be.",
    "Third lamp from the gate. Do not go that way after dark.",
    "Someone has opened the Library window from the inside. For a moment you hear a very quiet laugh.",
    "The Inspector likes you. That is not safe. That has never been safe.",
    "Thursday smells like a closed door, the way Tuesday did before the Bell."
  ],
  charm: [
    "Smile at the guard. Not at his face: at the part of him that wanted to be a different kind of guard.",
    "Matron Pritt cannot be charmed. She can only be flattered with specifics. Compliment the slippers.",
    "Wren will do anything for a sweet. Keep one in your pocket. It is the cheapest diplomacy in the Union.",
    "The Inspector is charming. You are charming. This is going to be a very polite catastrophe.",
    "A laugh in the ration queue will buy you five minutes of patience and one rumour. Spend it wisely.",
    "Nadia likes people who are rude and then tip. Be rude. Then tip."
  ],
  solidarity: [
    "We are the dormitory. We are twelve bunks and one hotplate. We know what it is to share.",
    "We are the queue. We have waited longer than any ministry. We can wait longer still. We would rather not.",
    "We are the choir. We are the Anthem under the Anthem. Sing it right, and we will carry it for you.",
    "Wren is one of us. So is Dov. So, God help us, is the Matron. We are a family of idiots with a hotplate.",
    "We heard the Inspector come in. We heard what he did not say. We are not afraid. We are only very, very quiet.",
    "We will be there on Thursday. We will not forget. We have never been good at it."
  ],
  stamina: [
    "Three days. Four hours of sleep a night. The legs are making a formal request for a bench.",
    "Karsov Avenue is longer than it looks. Walk it like a person who intends to walk back.",
    "Eat something. The Jubilee does not care if you collapse, and neither does the Bell.",
    "The tower stair has 212 steps. Count them and they are shorter. Do not count them and they are longer. Choose.",
    "A tram would be a mercy. Nadia sells those. For a price. Everything costs, even rest.",
    "Your body has done this before. It is not enjoying it any more than the last time."
  ],
  grit: [
    "A little pain is just information. A lot of pain is information in a loud voice. Listen anyway.",
    "Heavy day. That is what carrying something heavy feels like. You will put it down when it is finished.",
    "The Inspector cannot hurt you in a way you have not already survived. The Bell has been practising for years.",
    "You can stand in a ration queue for six hours. You can stand in front of a firing squad for six seconds. The first is harder.",
    "The relay is cold, and loud, and wants you gone. Stay another minute. Pain has a half-life.",
    "If you fall off the tower you will hurt. This is a useful incentive. Hold the rail."
  ],
  brawn: [
    "The relay door looks heavy. It is not. It is merely heavier than your last argument.",
    "A wrench is a very persuasive piece of iron. Remember that when negotiations fail.",
    "Captain Brune has more muscle than you and less sleep. Do the arithmetic.",
    "Crates, doors, drunk soldiers: the world is full of things that move if you ask nicely, and several that move if you do not.",
    "You could carry Ilsabet's equipment up the stairs. You could also ask. Ask. She is going to say yes in a very specific tone.",
    "Push the queue and the queue pushes back. It has three hundred shoulders."
  ],
  appetite: [
    "The dormitory smells of cabbage and ambition. Neither is enough.",
    "Nadia has bread under the counter. You can smell it from here. Do not stare. Stare a little.",
    "Matron's sherry is in the third drawer. It is not for you. It is for everybody. It is for you.",
    "Thermos. Tea. Hot. Sweet. A small yes in a metal cup.",
    "A sweet roll is a diplomatic gift. Also a meal. Also, in some districts, a bribe. Never underestimate bread.",
    "The Jubilee will have food. The Jubilee always has food. It is how they get you to stay."
  ],
  adrenaline: [
    "The black car. The black car. THE BLACK CAR. Somebody could put a brick through it and be a legend for an afternoon.",
    "Relay gate: closed. You: not. Let us see which of you blinks first.",
    "Run! Run to where? Run to the tower! It is a good place to run to! There is a view!",
    "Climb the tower. Ring the Bell. Scream into the speakers. Nobody has tried it lately and the speakers must be lonely.",
    "A queue is a barricade that has not yet been told. Tell it.",
    "You could punch an Inspector. You will not. You could. It would be very quiet afterwards. Think about that."
  ],
  the_grey: [
    "Karsov Avenue breathes in and out with the trams. It is the longest sentence in the district and nobody has finished reading it.",
    "The relay hums in the pavement like a toothache in the city's jaw.",
    "The dormitory is a lung, twelve sleepers deep. It exhales through the one window that will open.",
    "The Library's dust is a kind of silence. The tower's dust is a kind of bell.",
    "The Jubilee banners flap in a wind that is not there. The grey applauds, politely.",
    "Thursday is coming up the street like fog. Slowly. Entirely sure of itself."
  ],
  aim: [
    "Brick. Window. Black car. The geometry is irresistible, and you are a professional.",
    "The tower rope is 3.2 metres away. Throw something over it. Something lighter than you.",
    "A well-thrown tram token can open a door, silence a camera and win an argument.",
    "From the bench to the guard's hat: eleven metres, a light breeze, a good attitude.",
    "Thread the wire. Steady. Do not look at the generator. The generator does not look at you.",
    "A tiny cylinder, a tiny groove, a tiny hand: Ilsabet's soldering needs a tiny aim. Yours qualifies."
  ],
  reflex: [
    "The tram is moving. Jump. No. Wait. Yes. Now.",
    "Somebody is about to drop something. It will be your problem in a quarter second.",
    "The relay's lights flicker on a two-second rhythm. Move on the dark.",
    "A guard turns, a door opens, a mop falls. Catch the mop.",
    "Dodge the Matron's slipper. It is thrown in affection and with great accuracy.",
    "When the queue surges, step sideways. The crowd is not a wall; it is a wave. You are a leaf."
  ],
  composure: [
    "Stand like someone who was invited. You were not. They will not check.",
    "The Inspector watches your hands. Keep them on the table, doing nothing, extremely well.",
    "A guard who sees a blank face remembers nothing. Be the face people forget.",
    "Smile with half your mouth. The other half is saving itself for later.",
    "Matron is looking at your footlocker. You are looking at the ceiling. Look at the ceiling as though it were interesting.",
    "Do not rush the tower stairs. A person who is not rushing is a person who belongs."
  ],
  slip: [
    "Between the guard's turn and the next lamp: four seconds. Four seconds is a lifetime if you are small enough.",
    "The Relay's vents are wide and the fans are loud. You are neither, which is precisely the point.",
    "Matron's door has a loose hinge. Lift as you open. Breathe out as you cross.",
    "A good thief is only a good listener with a quicker pair of hands.",
    "Keep to the wall. Walls are friends with those who do not ask them anything.",
    "The Library's stacks are a labyrinth. Somebody built it to be unfindable, and somebody else built it to be found. You are in between."
  ],
  sleight: [
    "A pass, a stamp, a signature: three things, all of which Dov can forge faster than you can say 'treason'.",
    "Matron's ledger fits in a coat. So does her pen. So, regrettably, does her sherry.",
    "Pocket the tram token. If you need it, it is a ticket. If you do not, it is a souvenir. Either way: yours.",
    "The Inspector's card slides out of his pocket as easily as an apology. Put it back before he notices. Or do not.",
    "Wax, thread and a tin of boot polish: with these, the whole Union can be impersonated.",
    "Every guard has a button he fiddles with. Learn it. It is how they open."
  ],
  senses: [
    "The Relay smells of hot dust and old coffee. Somebody has been sleeping here, and not well.",
    "A distant ring, perfectly in tune, under the street. The Bell is tuning up.",
    "The Library smells of paper and of the thing paper smells of when you have been told not to read it.",
    "A faint tick from the Inspector's coat. It is a watch. It is also a second watch.",
    "The tower's wind has a note in it. A flat C, and under it, a human breath.",
    "The dormitory has a cough that is not a cough. It is a person, awake, listening."
  ]
};
GD.barks = GD.barks || {};
for (const k of Object.keys(more)) GD.barks[k] = (GD.barks[k] || []).concat(more[k]);

// ---- Day-specific pools: shown only on that day. {skill,text}
GD.dayBarks = {
  2: [
    { skill:"volition", text:"Wednesday. It is still going. You are still in it." },
    { skill:"archive", text:"Day two of a case that was officially closed on day zero. The paperwork is a delicate soufflé." },
    { skill:"instinct", text:"The Inspector arrived at dawn. Inspectors who arrive at dawn have already decided." },
    { skill:"the_grey", text:"The Jubilee banners went up overnight. The wind is already trying to take them down." },
    { skill:"empathy", text:"Everyone's a little more careful today. Somebody important is in town. Everyone can smell the cologne." },
    { skill:"doublethink", text:"Yesterday was a misunderstanding. Today is an opportunity. Please sign here." },
    { skill:"composure", text:"Wear the face you wore yesterday. It worked. Do not trust anything that works twice." },
    { skill:"authority", text:"A man in a grey coat is asking questions in your school. Start behaving like it is yours." },
    { skill:"senses", text:"The Bell rang last night. You cannot remember hearing it. Your ears do." },
    { skill:"solidarity", text:"We woke. Some of us did not wake all the way. We will carry them." },
    { skill:"rote", text:"Wednesday: Hygiene Inspection. Thursday: Jubilee. Friday: Day of Silent Gratitude." },
    { skill:"dialectics", text:"The case is closed. The Inspector is here. One of those facts is lying." },
    { skill:"appetite", text:"Day two of cabbage. The cabbage has begun to look at you with something like pity." },
    { skill:"stamina", text:"The body keeps a ledger of its own: three hours of sleep, one meal, one very long corridor." },
    { skill:"adrenaline", text:"Something is about to happen. You can feel it in your knuckles. It is probably the Inspector." },
    { skill:"rhetoric", text:"Day two. Fewer rehearsals, more improvisation. The audience is learning your tricks." }
  ],
  3: [
    { skill:"volition", text:"Thursday. This is the last of the days you are certain of." },
    { skill:"archive", text:"Grand Harmony: 20:00. Duration: seventy-two hours erased. Approval: unanimous, because dissent has already been forgotten." },
    { skill:"instinct", text:"The air is full of waiting. Even the pigeons have found another roof." },
    { skill:"the_grey", text:"The sky is the colour of a wiped tape. It has been waiting for this all week." },
    { skill:"empathy", text:"People are saying goodbye to each other without knowing it. Look at how they hold the doorframes." },
    { skill:"doublethink", text:"The Jubilee will be marvellous. You will not remember it. That is how marvellous it will be." },
    { skill:"composure", text:"Today every face in the district is a mask. Wear yours well; you will not get another." },
    { skill:"authority", text:"Whoever gives the last order today gives the only one that matters." },
    { skill:"senses", text:"A very faint tuning tone, under everything. The Bell is warming up its voice for a long speech." },
    { skill:"solidarity", text:"We are still here. We are almost all still here. Do not count us. Count on us." },
    { skill:"rote", text:"Thursday: the Warden's Jubilee. 'Let none among us be troubled by the past, for the past will be gently attended to.'" },
    { skill:"dialectics", text:"If the whole district forgets, was the Jubilee a celebration or an erasure? Wait until they have no memory to disagree." },
    { skill:"appetite", text:"Last day. Eat something. If it is the last meal, make it a good one; if it is not, it was still a good one." },
    { skill:"stamina", text:"Your body would like it noted that it has done its part. It is ready for whatever comes, and for a bench." },
    { skill:"adrenaline", text:"TODAY! Today is the day! Do something large and unsupervised!" },
    { skill:"rhetoric", text:"One speech left. Make it count. Open quietly and finish with the thing nobody expected." },
    { skill:"grit", text:"It will hurt. It has hurt all week. Today it will hurt on purpose. That is a different kind of tolerable." }
  ]
};

// ---- Location-specific pools.
GD.locBarks = {
  dorm: [
    { skill:"senses", text:"Twelve bunks, one smell: wool, cabbage and quiet panic." },
    { skill:"empathy", text:"Somebody under the blanket in the third bunk is pretending to be asleep, very badly, because it is kinder." },
    { skill:"instinct", text:"Matron's door is ajar. The crack is not an accident." },
    { skill:"composure", text:"Your bunk is by the radiator. Nobody in the dormitory lies there who has not been listening." },
    { skill:"appetite", text:"There is a hotplate. There is a kettle. There is, for one marvellous second, the idea of tea." },
    { skill:"the_grey", text:"The window was painted shut by someone who believed that was a sort of kindness." },
    { skill:"solidarity", text:"We all sleep here. Twelve breathings, one rhythm. We do not sleep well, but we sleep together." },
    { skill:"archive", text:"Dormitory Regulation 9: lights out at 21:30, silence at 21:31, dreams at the Matron's discretion." },
    { skill:"slip", text:"The third board from the door squeaks. The fifth does not. Learn the floor like a catechism." }
  ],
  library: [
    { skill:"archive", text:"The catalogue is a cathedral. You could pray in it. Some already do." },
    { skill:"senses", text:"Dust, paper, ink and a kind of attentive silence, like a room that is eavesdropping on its own books." },
    { skill:"dialectics", text:"A library is a machine for making the State nervous. The rope is the proof." },
    { skill:"empathy", text:"The books are lonely. The librarians are lonelier. That is the fundamental unit of the Library." },
    { skill:"rote", text:"Library Rule One: silence. Library Rule Two: respect. Library Rule Three: do not look at the red-spined ones." },
    { skill:"instinct", text:"A rustle from the back stacks. Not a mouse. Mice do not turn pages." },
    { skill:"the_grey", text:"Old paper breathes in damp weather. The whole room is a slow lung." },
    { skill:"authority", text:"AUTHORISED READERS. The sign is a request that wants to be an order. You are tempted to supply the order." },
    { skill:"composure", text:"Look like someone who reads. Hold a book upside down for the full effect." }
  ],
  street: [
    { skill:"the_grey", text:"Karsov Avenue: grey on grey with a streak of tram-green. The city exhales exhaust." },
    { skill:"senses", text:"A tram bell, a boot on cobbles, a distant loudspeaker saying nothing in a very warm voice." },
    { skill:"instinct", text:"Somebody is walking half a block behind you. Pretend not to know. They are pretending too." },
    { skill:"authority", text:"Soldiers at the corner, hands in their belts. Walk like the street is yours. It is not. Walk like it is." },
    { skill:"empathy", text:"The queue is a long, patient animal, and every one of its faces has a family waiting at home." },
    { skill:"slip", text:"Alleys on the left, parked trucks on the right. The avenue has more hiding places than it has hope." },
    { skill:"solidarity", text:"We are standing in line together. It is the most honest form of democracy the Union permits." },
    { skill:"appetite", text:"Somewhere, someone is frying onions. That is dangerous information. Do not follow it." },
    { skill:"rote", text:"'Karsov Avenue: the Union's proud artery.' It is a vein, and it is clotted." }
  ],
  relay: [
    { skill:"senses", text:"A low hum under everything, a note that makes your teeth feel like a tuning fork." },
    { skill:"the_grey", text:"This is where the Bell sleeps. The building has been cold since the day it was built." },
    { skill:"instinct", text:"Every light in here is turned on. Somebody does not want to be in the dark." },
    { skill:"slip", text:"A cable on the floor. Another on the ceiling. A guard on the stairs. You are going to need three kinds of luck." },
    { skill:"deduction", text:"Coffee ring on the console, still warm. The engineer left in a hurry, or has not left at all." },
    { skill:"doublethink", text:"This is a school-adjacent educational facility. It is not a relay. It has never been a relay. Please move along." },
    { skill:"archive", text:"Relay Regulation 1: do not read the logbook. Relay Regulation 2: see Regulation 1." },
    { skill:"composure", text:"Look bored. Everyone in this building looks bored. Boredom is the camouflage." },
    { skill:"authority", text:"If you act like you belong you will be saluted. If you act like you do not, you will be shot." }
  ],
  tower: [
    { skill:"the_grey", text:"From here the city looks like a pattern someone forgot to finish." },
    { skill:"senses", text:"The wind through the louvres is nearly a chord. Somebody tuned this on purpose." },
    { skill:"volition", text:"One more step. One more. You have made it this far, and the rail has not fallen off." },
    { skill:"empathy", text:"Hob is not sad. He is full of a very old kind of attention." },
    { skill:"adrenaline", text:"Jump. Ring. Shout. Throw something enormous over the edge! Ahem. Not yet." },
    { skill:"authority", text:"Every voice in this tower is an order to a hundred thousand people. Handle it as such." },
    { skill:"solidarity", text:"We are all down there. Every window. Every lit stove. Tonight we are one choir." },
    { skill:"doublethink", text:"What a wonderful view. What a wonderful, wonderful view. Do not look at the speakers." },
    { skill:"rote", text:"'To ring the Great Bell is to speak with the Warden's own throat.' You are about to commit a very large blasphemy." }
  ]
};
})();
