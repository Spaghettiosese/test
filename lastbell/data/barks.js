(function(){ const GD = (window.GD = window.GD || {});

// Ambient inner-voice one-liners. Engine picks by skill (weighted by level) and shows as a small caption.
GD.barks = {
  dialectics: [
    "If the Warden hears everything, he has also heard himself. Discuss.",
    "Every slogan is a premise missing its argument.",
    "'One Bell, One Union.' One what, precisely, is carrying the weight?",
    "The curfew exists to prevent crime. The crime is being out past curfew. Circular, but tidy.",
    "A rule that cannot be questioned is not a rule. It is a mood.",
    "They say harmony. Harmony needs at least two notes. Interesting.",
    "Premise: the walls are listening. Conclusion: you are talking to yourself, dangerously.",
    "Somebody ought to inspect the logic in this corridor. It is leaking.",
    "A confession is evidence only of how long the interview lasted."
  ],
  rote: [
    "Virtue the Fourth: the Pioneer rises with the bell and sleeps with the bell.",
    "'A clean desk is a clean conscience, and a clean conscience is a quiet one.'",
    "Oath of the Youth, line nine. Line ten is mumbled by tradition.",
    "'The Warden hears. The Warden knows. The Warden forgives.' The third is optional.",
    "Rations: three hundred grams. Opinions: none.",
    "You can recite the School Charter backwards. This is less useful than it sounds.",
    "'Obedience is the sweetest music.' Your teeth disagree.",
    "The old anthem had a fourth verse. The new anthem has a footnote.",
    "Twelve times eleven, one hundred thirty-two, the Warden's birthday, in cursive."
  ],
  deduction: [
    "Scuffed toe, clean heel. Somebody walked backwards here.",
    "A tidy room is a story with the interesting parts removed.",
    "Chalk under the nail. Handwriting on the wall. Make of that what you will; I already have.",
    "Mildew on one side of the door only. That door is opened more than anyone admits.",
    "The dust has a gap exactly the size of something that was here yesterday.",
    "No one hangs themselves at that height without a stool. Where is the stool?",
    "Fresh polish on old boots: someone expected to be looked at.",
    "I deduce a conspiracy. I will wait politely for evidence to catch up.",
    "Footprints that stop at a wall are called a door."
  ],
  rhetoric: [
    "Citizens! Friends! Fellow occupants of this regrettable corridor!",
    "Never answer the question. Answer the question that would flatter you.",
    "A pause, here. Let them lean in.",
    "In my experience, 'in my experience' is the most persuasive phrase in the language.",
    "Say it slowly. Say it as though the truth were an inconvenience you were sparing them.",
    "An argument is a hand held out. Aim for the throat.",
    "Open with a joke. Close with a threat. In between: tea.",
    "Every audience is one good adjective away from agreement.",
    "Applause is a verdict. Deserve it."
  ],
  doublethink: [
    "Nothing is wrong. Everything is wrong. These facts are not in conflict. Isn't that restful?",
    "The Warden hears. Of course he does. That is how he cares.",
    "You love the Union. You also love your own opinions. Both are true. Both are filed.",
    "Do not think about what you are not thinking about.",
    "It was always a suicide. It was never a suicide. Pick whichever is currently correct.",
    "A thought is only dangerous if somebody can prove you had it.",
    "Be reasonable. Reasonable people are never arrested. They are merely reassigned.",
    "Let me take that worry off you. I will keep it somewhere official.",
    "I am only saying what you were going to say. I am saying it first."
  ],
  archive: [
    "Regulation 14(b): all announcements shall be made at an appropriate volume and with an appropriate face.",
    "Form 7-C, quadruplicate. Pink for the Principal, blue for the file, green for the dead.",
    "The School opened in the autumn of the Warden's fourth year. The paint has not forgiven this.",
    "Dates matter. Yesterday was the thirteenth, a Thursday. You remember nothing of it.",
    "Someone in this building has an entire drawer with your name on it. It is alphabetical.",
    "A stamp is just a signature that has given up.",
    "Curfew regulations amended eleven times; the original wording is, of course, unavailable.",
    "Your attendance record is flawless. This is itself suspicious.",
    "A well-kept archive is how a regime remembers what it has told you to forget."
  ],
  empathy: [
    "The mop is tired. The mop has been tired for years.",
    "Somebody in this corridor has just stopped crying. You can feel it, like a draught.",
    "Everyone is carrying something. Most of it is soup.",
    "Be gentle with the cook. She is afraid of the same things you are, with a ladle.",
    "The Commissar was lonely. You are quite sure. You just do not know why you are.",
    "Even the portraits look lonely, tonight. Weren't they installed to be loved?",
    "That boy in the corner is pretending not to be pretending.",
    "Kindness here is a contraband, passed from palm to palm.",
    "You have never met anyone who was only one thing."
  ],
  volition: [
    "Breathe. In, out. The corridor is still a corridor.",
    "You do not have to do the thing you are about to do. You also do not have to not do it.",
    "Stand up straight. No one is looking. Look anyway.",
    "Nobody gets to decide who you are before breakfast.",
    "One more hour. Then one more. That is the whole secret of everything.",
    "The headache is not a verdict. It is weather.",
    "You are allowed to be tired and still be correct.",
    "Say 'no' quietly if you must. It still counts.",
    "I have you. I always did. Stop dropping me."
  ],
  authority: [
    "Chin up. The corridor is yours until someone proves otherwise.",
    "Do not ask. Inform.",
    "Take the middle of the hallway. Let them go around.",
    "A raised eyebrow is a form of legislation.",
    "Stop smiling. You are not here to be liked. You are here to be complied with.",
    "Everyone wants to be told what to do. Be kind. Tell them.",
    "Lower your voice. It carries further.",
    "Shoulders back, hands clasped. You are the school, now.",
    "Rank is just confidence that has been stamped."
  ],
  instinct: [
    "Someone is behind you. No, wait. Yes.",
    "Do not go that way. I cannot explain it. Do not go that way.",
    "That smile has its own agenda.",
    "The room is lying to you. Politely.",
    "Trust the one who is not looking at you.",
    "A bad feeling, six minutes old, still developing.",
    "That locker. Not that locker. The other that locker.",
    "Your hair knows something. Listen to your hair.",
    "Something is about to happen. Possibly lunch."
  ],
  charm: [
    "Smile, but with one eyebrow. Keeps them guessing.",
    "Everyone likes being remembered. Remember their name. Remember their mother's name.",
    "A compliment is a coupon that costs you nothing.",
    "Lean in. Lower the voice. They will come to you, slowly, like a cat.",
    "You have excellent teeth. Use them.",
    "Wink once. Not twice. Twice is a tic.",
    "Make them feel clever. Make them feel like it was their idea. Make them feel it was lunch.",
    "Dazzle. Then ask for the key.",
    "Be the person they hoped would sit down."
  ],
  solidarity: [
    "We were all here before you. We will all be here after.",
    "We're cold. We're hungry. We're not alone.",
    "We saw that. We'll remember that. We always do.",
    "Somewhere a hundred pairs of hands are pulling the same string as yours.",
    "We don't forget. That's the point of us.",
    "The kid in row three just nodded at you. That's us, saying hello.",
    "We know the cook. We know the janitor. We know a lot of people who don't know us yet.",
    "Say 'we' and watch the corridor listen.",
    "Don't carry it alone. We have shoulders. We have so many shoulders."
  ],
  stamina: [
    "Another staircase. You were built for this, or you were built for something else and settled.",
    "Left foot, right foot. Repeat until the curfew.",
    "You can go eleven more minutes without sitting. That is a lie, but a motivating one.",
    "Three flights. Four. Your knees are filing an appeal.",
    "Legs are just walls that learned to move.",
    "Nobody ever collapsed during a good march. They collapsed afterwards, politely.",
    "Pace yourself. The day is long and the Union has no sense of humour.",
    "Breathe from the belly. Walk from the heels.",
    "You can last until the evening bell. You have lasted longer, in worse weather."
  ],
  grit: [
    "It's only pain. It'll pass, eventually, like all official notices.",
    "Look at it. Look at the body. Look at the rope. Good. Now keep looking.",
    "The bruise is a medal. Nobody has to know.",
    "You've had worse. You can't remember when, but you have.",
    "Squeeze your fist. Open it. Fine. Fine. Fine.",
    "Cold floor, hard bench, longer night. Standard issue.",
    "Don't flinch. They are watching for the flinch.",
    "It hurts because it matters. Or because it's a bruise. Either way, carry on.",
    "Swallow the sick. Keep the face. Walk."
  ],
  brawn: [
    "The door is just a gentle suggestion. I could rephrase it.",
    "Lift with the knees. Or with the grudge.",
    "I could carry the Commissar down. I could carry the gym down.",
    "Fists are an argument with no footnotes.",
    "That crate has had its chance.",
    "Do not touch. Do not touch. All right, maybe touch.",
    "Shoulders: wide. Brain: narrow. Ideal.",
    "If it moves, push it. If it does not, push harder.",
    "Push-ups: three. Pride: infinite."
  ],
  appetite: [
    "A sweet roll. Just one. Not even a whole one.",
    "Smell that? Cabbage. Boiled, defeated, delicious.",
    "A small tea would fix everything. A large tea would fix the rest.",
    "A cigarette is not a decision. It is a pause with a flavour.",
    "Cook always hides the good bread. Check under the other bread.",
    "Hunger is not a mood. It is a policy.",
    "The sugar is in the cupboard, the cupboard is in the kitchen, the kitchen is not guarded.",
    "Your stomach has opinions. They are mostly about dinner.",
    "Just one more. For the Union."
  ],
  adrenaline: [
    "HIT SOMETHING. ANYTHING. A DESK. A POET.",
    "You are alive and it is loud and it is wonderful.",
    "Run. Run now. Question later.",
    "Kick the door. See what the door thinks.",
    "Shout. The echo needs a job.",
    "Faster! Faster! The Bell hasn't rung yet!",
    "Break the thing. Fix the thing. The order is not important.",
    "Heart: loud. Thoughts: quiet. Excellent.",
    "Let me out. Let me out. Let me at the portrait."
  ],
  the_grey: [
    "The rain is coming. It has always been coming.",
    "Concrete remembers. It does not tell.",
    "This building is exhausted. So is the city. They hold each other up.",
    "A hundred thousand windows and every one of them has a curtain, drawn.",
    "The drains are talking. Mostly about you.",
    "Damp climbs the wall like a slow confession.",
    "Grey is not the absence of colour. It is a colour trying to be left alone.",
    "Every pavement stone has been stepped on by someone who wanted to leave.",
    "Hush. The wind has a name for you."
  ],
  aim: [
    "Throw it. The target is smaller than your doubt, which is the point.",
    "Steady. Steady. Breathe out.",
    "One cup, no spill. Today, at least, you are a professional.",
    "Three metres to the basket. You can see the thread of the net.",
    "Squint. The world has a bullseye in it, somewhere.",
    "Hand: calm. Eye: calm. The rest of you: negotiable.",
    "The key will go in the lock the first time. You just have to believe it.",
    "Point at the thing you want. The thing may follow.",
    "A pebble, a window, a noise. You know exactly where."
  ],
  reflex: [
    "Catch! Catch it! You did! Wow.",
    "Duck. Duck now. Good. Whatever it was, it missed.",
    "Your hands move before the sentence finishes. Try not to apologise.",
    "Something is falling. Something is always falling.",
    "Quick, step left. Quicker.",
    "A blink is a decision. You are making fewer of them.",
    "Door opening! Slide behind it!",
    "Pivot on the heel. Always on the heel.",
    "That nearly hit you. Whatever it was, it learned."
  ],
  composure: [
    "Face: neutral. Hands: still. Eyebrow: dead.",
    "Straighten the collar. A collar is a small flag.",
    "Do not look at the thing. Look near the thing.",
    "Your poker face has seen better poker.",
    "Shoulders square. Breath shallow. You're doing nothing at all, perfectly.",
    "Panic is a luxury. Do it later, in private, with the door shut.",
    "Smile like you've nothing to hide, which you have, which you do.",
    "Stand like a statue. Statues are never questioned.",
    "Posture is a kind of alibi."
  ],
  slip: [
    "Quietly. Even quieter. Now sneeze.",
    "Not yet. Not yet. Now.",
    "There is a gap in the guard's attention exactly the width of a person.",
    "Move on the beat, between the footsteps.",
    "Hug the wall. Walls don't snitch. Mostly.",
    "A closed door is only a shy open one.",
    "Keep your shadow smaller than theirs.",
    "A locker is just a lock with ambitions.",
    "If you can't be seen, you can't be asked."
  ],
  sleight: [
    "Left pocket. Right pocket. Their pocket. Your pocket now.",
    "It was never in your hand. You'd know.",
    "A signature is just a shape the wrist learns.",
    "Palm it. Pass it. Smile like you were reading.",
    "That watch looks lonely.",
    "There is a coupon in that coat. It wants to meet you.",
    "Paper folds. People fold. Fold everything.",
    "Distraction is the art of making someone else look at nothing.",
    "A fast hand is the only honest politician."
  ],
  senses: [
    "Boiled cabbage, floor wax, cigarette smoke, and underneath, fear.",
    "Someone is breathing behind the curtain.",
    "The hum of the loudspeaker is half a tone sharp.",
    "A faint metallic taste. The Bell is thinking of ringing.",
    "Fresh chalk. Somebody wrote here this morning.",
    "A draught from nowhere. A door has been opened that was supposed to stay closed.",
    "Listen: the wall has a heartbeat, or a pipe does.",
    "That footstep is wearing the wrong shoes.",
    "Your ears are ringing. They always are. It is the one honest sound you own."
  ]
};

GD.situationBarks = {
  hungry: [
    { skill:"appetite", text:"Your stomach files a formal complaint. It is the most coherent argument you've heard today." },
    { skill:"appetite", text:"There is a sweet roll somewhere in this building. It knows you are coming." },
    { skill:"stamina", text:"Skipping lunch is a patriotic tradition. It is also a medical event." },
    { skill:"the_grey", text:"The city gurgles. It's as hungry as you are, and larger." },
    { skill:"empathy", text:"Everybody here is a little bit hungry. Hunger is the nation's mild tune." }
  ],
  lowMorale: [
    { skill:"volition", text:"I'm still here. Say something to me. Anything. The weather." },
    { skill:"empathy", text:"You are sad in a way that has no address. That's all right. It can stay with us." },
    { skill:"doublethink", text:"There, there. Nothing is wrong. Report it, and it will be fixed." },
    { skill:"solidarity", text:"We know. We all feel like this. That is how you can tell it is not only you." },
    { skill:"grit", text:"Heavy? It is supposed to be heavy. That means you're carrying it." }
  ],
  lowHp: [
    { skill:"grit", text:"You're bleeding a little. That's all right. It's a beautiful shade of regulation red." },
    { skill:"stamina", text:"The legs say sit. The legs always say sit." },
    { skill:"adrenaline", text:"It does not hurt. It definitely hurts. KEEP MOVING." },
    { skill:"empathy", text:"Your body is a small, scared animal. Be gentle with it." },
    { skill:"appetite", text:"Tea. A bun. A cigarette. Anything. Somebody bring the paramedic a pastry." }
  ],
  highSurv: [
    { skill:"instinct", text:"Every window has a face in it. Maybe not. Probably." },
    { skill:"doublethink", text:"They watch because they care. Smile at the corner. It is a camera, but it is also a corner." },
    { skill:"composure", text:"Hands out of pockets. Eyes down. Be a very normal furniture." },
    { skill:"senses", text:"A cough from the next room. The same cough you heard an hour ago. It is following." },
    { skill:"the_grey", text:"The walls lean in. Not far. Just enough." },
    { skill:"solidarity", text:"We are being listened to. We should hum something harmless." }
  ],
  curfewSoon: [
    { skill:"archive", text:"Curfew is at 21:00. Regulation 3: the Bell shall be obeyed, not understood." },
    { skill:"instinct", text:"The light is thinning. Something is about to be taken away." },
    { skill:"the_grey", text:"Dusk, again. The city is gathering its coats." },
    { skill:"senses", text:"The loudspeaker clears its throat, a small metallic cough." },
    { skill:"volition", text:"Do what you came to do. The evening has a short fuse." },
    { skill:"rote", text:"'When the Bell rings, the Union sleeps.' Third verse. Do not sleep." }
  ],
  idle: [
    { skill:"senses", text:"A tap is dripping somewhere. Four seconds, then silence, then four seconds." },
    { skill:"the_grey", text:"The building breathes out. It has been holding it all afternoon." },
    { skill:"dialectics", text:"You've been standing still for a minute. This is either contemplation or loitering. Both have regulations." },
    { skill:"appetite", text:"You are thinking about toast. That's fine. It's a good thing to think about." },
    { skill:"instinct", text:"Nothing is happening. This is the most suspicious thing that has happened all day." },
    { skill:"composure", text:"Stand like someone who has an appointment. People never ask." },
    { skill:"rhetoric", text:"A speech would fit nicely here. You have no audience, but you've written the opening." },
    { skill:"empathy", text:"Somewhere nearby, someone is humming. It makes the hallway kinder." }
  ]
};

GD.ideologies = {
  vanguard: { id:"vanguard", name:"The Vanguard", color:"#b84a4a",
    description:"Order, obedience, the warm rectangle of a rule. Believers are promised belonging and handed a clipboard. It is genuinely comfortable. That is the horror of it.",
    tiers:[ { min:0, title:"Pupil" }, { min:3, title:"Pioneer" }, { min:6, title:"Cadet" }, { min:10, title:"Zealot" } ] },
  undercurrent: { id:"undercurrent", name:"The Undercurrent", color:"#4a8f8a",
    description:"The whispering network under School No. 9: boiler-room chairs, bread-notes, chalk on the wall. Believers are promised nothing and arrive anyway. It is genuinely dangerous. That is the charm of it.",
    tiers:[ { min:0, title:"Listener" }, { min:3, title:"Courier" }, { min:6, title:"Chalkhand" }, { min:10, title:"Cellmate" } ] },
  quiet: { id:"quiet", name:"The Quiet", color:"#8a8f9c",
    description:"Go home. Keep your head down. Drink the tea. Not a movement so much as a posture, practised by nearly everyone, and by several heroes on their days off.",
    tiers:[ { min:0, title:"Bystander" }, { min:3, title:"Sleeper" }, { min:6, title:"Houseplant" }, { min:10, title:"Saint of the Curtains" } ] }
};

})();
