(function(){ const GD = (window.GD = window.GD || {});

// Thought Cabinet. `minutes` = game minutes of research. While researching, no mods apply; `mods` apply fully once internalized. `effects` fire once on internalize (contract effects).
// `cond` (optional) gates when the thought can be discovered/offered. `discover` = player-facing hint of where it surfaces.
GD.thoughtSlots = {
  start: 3, max: 5,
  unlocks: [
    { slot:4, cond:"flag.exam_done", xp:4, label:"Having sat the Orthodoxy Exam, your head has room for one more heresy (or pay 4 xp)." },
    { slot:5, cond:"flag.knows_static", xp:6, label:"Knowing about the Static makes space, the way a hole makes space (or pay 6 xp)." }
  ],
  forgetRefund: false
};

GD.thoughts = {

  th_quiet_hands: { id:"th_quiet_hands", name:"Quiet Hands", minutes:60,
    discover:"Pickpocketing something, or picking a lock, without being noticed. Or being noticed doing it.",
    problem:"Your hands are doing things you did not authorise. They go quiet in your pockets and come out with a coin, a key, an opinion. Whose hands are these? Whose pocket? You are beginning to suspect the answer is 'everyone's'.",
    solution:"Hands are honest. The face lies; the hand just does the job. You decide to let them. A small, crooked pleasure comes with it: nobody checks the pockets of a person who looks bored.",
    mods:{ sleight:2, slip:1, composure:-1, authority:-1 }, effects:[ {ideo:"undercurrent", n:1} ] },

  th_good_citizen: { id:"th_good_citizen", name:"The Good Citizen", minutes:90,
    discover:"Sitting through a lecture, taking the Vanguard armband, or answering an official question exactly as expected.",
    problem:"There is a version of you in the school file with a straight back, clean cuffs and a neat conscience. He has never been late. He has never been wrong. He looks very comfortable in your chair.",
    solution:"It is easier, you discover, to be him. People nod. Doors open. The only cost is a small, regular doubt somewhere behind the sternum, which you decide to treat as indigestion.",
    mods:{ doublethink:2, authority:1, rote:1, volition:-1, solidarity:-2 }, effects:[ {ideo:"vanguard", n:2}, {surv:-6} ] },

  th_unsanctioned: { id:"th_unsanctioned", name:"The Unsanctioned Thought", minutes:120,
    discover:"Reading Yesterday-You's notes, or hearing something you were never supposed to be able to think.",
    problem:"A sentence has appeared in your head that you do not remember being taught. It has no slogan attached, no stamp, no author. It sits in the middle of your thinking like a dropped cutlery drawer. Is it yours? It sounds like yours.",
    solution:"It is yours. It was always yours. It took the State years to bury it and it only took a night to dig it up. You feel lighter and oddly hunted; the lightness is the better of the two.",
    mods:{ dialectics:1, volition:1, instinct:1, doublethink:-2, rote:-1 }, effects:[ {ideo:"undercurrent", n:2}, {surv:5} ] },

  th_ghost_of_yesterday: { id:"th_ghost_of_yesterday", name:"The Ghost of Yesterday", minutes:150,
    discover:"Finding a second note from Yesterday-You, or catching your own handwriting somewhere you have never written.",
    problem:"Somebody lived your last night and left you only the receipts. He was braver than you, or more frightened, or you cannot tell. He is keeping the house warm until you are ready to move back in.",
    solution:"You accept him as a lodger. He keeps odd hours and leaves notes in your pockets, but he knows things. When you listen, he whispers; when you do not, he frowns audibly.",
    mods:{ archive:1, instinct:2, senses:1, volition:-1, composure:-1 }, effects:[ {morale:-1}, {xp:2} ],
    cond:"flag.read_note_1" },

  th_bell_tolls: { id:"th_bell_tolls", name:"For Whom the Bell Tolls", minutes:180,
    discover:"Standing under a loudspeaker, listening to the old bell, or noticing the hour slip.",
    problem:"Every night, the Bell rings, and every morning something is missing. You are beginning to suspect the two events know each other. The sound is round, and sweet, and it stops just before you can remember what you were thinking.",
    solution:"It rings for you. It has been ringing for you since you were six. You count the strokes and find the number is not the same each night, and you are almost certain that is on purpose.",
    mods:{ the_grey:2, instinct:1, senses:1, doublethink:-1, composure:-1 }, effects:[ {set:"knows_static", val:true}, {surv:4} ],
    cond:"flag.read_note_1 || visited('courtyard')" },

  th_portrait_eyes: { id:"th_portrait_eyes", name:"The Portrait's Eyes", minutes:90,
    discover:"Examining the torn portrait, or noticing that the Warden is looking at you from every wall.",
    problem:"The Warden is on every wall and on every wall he is looking exactly at you. Not near you, not past you. At you. Well, of course he is, he is a painting, but why does the painting have a wire in it?",
    solution:"They listen. Of course they listen. A face with ears is a normal thing; a face without them is a miracle. You decide to behave as if the walls take notes, because, as it happens, the walls do.",
    mods:{ senses:2, deduction:1, authority:-1, charm:-1 }, effects:[ {set:"clue_mic", val:true}, {surv:3} ],
    cond:"flag.portrait_examined" },

  th_ration_math: { id:"th_ration_math", name:"Ration Math", minutes:75,
    discover:"Counting coupons, noticing how much soup there is, or being short-changed by the Union.",
    problem:"There are 412 students and 391 bowls. Somewhere in that subtraction is a person who ate two bowls and nobody is saying who. Mathematics, you realise, is the only subject the State cannot mark you down on.",
    solution:"You can count a room by what it eats. A pupil who suddenly has coupons is a pupil with a patron. A cook who gives extra is a cook with a conscience. You begin to read the economy like a face.",
    mods:{ dialectics:1, archive:1, appetite:-1, charm:1 }, effects:[ {xp:1} ] },

  th_marching_feet: { id:"th_marching_feet", name:"Marching Feet", minutes:100,
    discover:"A drill in the gym, a line of children in the corridor, or a boot-print on the mats.",
    problem:"Everyone here walks in time without being told. Boots land on one beat; you feel yours try. How much of walking is walking, and how much is agreeing?",
    solution:"You break step on purpose. It is a small rebellion, the size of a boot. It turns out to be good practice: people who can fall out of line can also fall out of sight.",
    mods:{ stamina:2, reflex:1, slip:1, authority:-1, rote:-1 }, effects:[ {ideo:"undercurrent", n:1} ] },

  th_chalk_dust: { id:"th_chalk_dust", name:"Chalk Dust", minutes:80,
    discover:"Finding the chalk stub, noticing smeared lettering, or shaking hands with a teacher.",
    problem:"Chalk is the only honest writing in the Union: it is meant to be rubbed out. Somebody has been writing on walls with this stub, so thinly that you can barely tell whether it is a message or a stain.",
    solution:"Graffiti is memory the Bell cannot reach. A wall cannot be Static. You begin to see what the underground has always known: the best archive is the one nobody thinks is an archive.",
    mods:{ archive:2, deduction:1, volition:1, charm:-1, rhetoric:-1 }, effects:[ {set:"clue_chalk", val:true}, {ideo:"undercurrent", n:1} ],
    cond:"has('chalk_stub')" },

  th_wheel_and_chair: { id:"th_wheel_and_chair", name:"Wheel and Chair", minutes:110,
    discover:"Talking to Ilsabet, or noticing how far a wheelchair has to detour in a building designed for soldiers.",
    problem:"Every staircase in School No. 9 has a view on who deserves to reach the top. Ilsabet takes the long way round all day and hears everything on the way. What does it mean when the architecture itself has a policy?",
    solution:"You see the building as a set of decisions, each one made by someone with strong legs. It gives you a patience you did not expect and a rage you did not ask for, and both are useful.",
    mods:{ empathy:2, the_grey:1, stamina:-1, adrenaline:1 }, effects:[ {ideo:"undercurrent", n:1} ],
    cond:"talked('ilsabet') > 0" },

  th_hungry_ghost: { id:"th_hungry_ghost", name:"The Hungry Ghost", minutes:70,
    discover:"Going without food, eating the sweet roll too fast, or watching somebody else's lunch.",
    problem:"There is a second you, thin and patient, who lives in your stomach. It does not want to be rude. It simply wants everything. Every canteen has one, and they all attend the same lunch.",
    solution:"You decide to feed him, but only in small, theatrical doses. A hungry person is easy to govern; a satisfied one is a rumour of freedom. The ghost gets one biscuit, and your gratitude.",
    mods:{ appetite:2, grit:1, volition:-2 }, effects:[ {morale:1} ] },

  th_informer_in_me: { id:"th_informer_in_me", name:"The Informer in Me", minutes:180,
    discover:"A skill 'report' line firing, a flicker of surveillance, or realising someone has been taking notes about you.",
    problem:"Some voices in your head are not yours; they are on the payroll. You notice them listening harder than they should. At night, you can hear the soft click of a pen in the dark behind your eyes.",
    solution:"You decide to know them. Once you can name an informer, he becomes a colleague, or a hostage. You begin lying to your own head, strategically. It is exhausting. It is the first thing that has worked.",
    mods:{ doublethink:-2, solidarity:-1, volition:2, composure:1 }, effects:[ {surv:-8}, {morale:-1} ],
    cond:"surv >= 20" },

  th_perfect_attendance: { id:"th_perfect_attendance", name:"Perfect Attendance", minutes:100,
    discover:"The Principal's office, a punctual clerk, or being made to wait for something you did not ask for.",
    problem:"You have never missed a day. Not one. Not for fever, flu, funeral or invasion. The certificate on the wall says so, in gold letters, and nobody will explain the cost of the gold.",
    solution:"Showing up is a performance, and you have the best reviews in the building. You decide to treat it as camouflage: a person who is always present can be absent in all the right places.",
    mods:{ archive:1, rote:1, stamina:1, composure:1, adrenaline:-1, charm:-1 }, effects:[ {ideo:"vanguard", n:1}, {surv:-3} ] },

  th_big_sister_state: { id:"th_big_sister_state", name:"Big Sister State", minutes:130,
    discover:"Listening to Bronka, Vasha, or Marr speak about 'looking after' you.",
    problem:"The State likes to say it loves you. It says it softly, with a hand on your shoulder, and the hand is warm, which is the unnerving part. You cannot find the exact moment a hug becomes a hold.",
    solution:"Love and control are cousins, and the family reunion is held every day in the canteen. Once you see that, you can accept the soup and refuse the sermon.",
    mods:{ empathy:1, doublethink:1, authority:-1, adrenaline:-1, solidarity:1 }, effects:[ {morale:2} ] },

  th_anthem_earworm: { id:"th_anthem_earworm", name:"The Anthem Earworm", minutes:60,
    discover:"Fenwick's rehearsals, the old loudspeaker horn, or humming without remembering where you learned the tune.",
    problem:"You are humming. You did not start humming. The tune is the second verse of the Anthem, and every note is a small hook, set in your head like a fishhook in a lip.",
    solution:"You decide to hum it wrong: a flat third here, a missing beat there. Resistance in the smallest key. The worm turns, though it was never sure which way it was facing.",
    mods:{ rote:2, charm:1, composure:-1, instinct:-1 }, effects:[ {morale:1} ] },

  th_collective_pulse: { id:"th_collective_pulse", name:"The Collective Pulse", minutes:120,
    discover:"Feeling a crowd move as one, joining the choir, or being cheered by people you do not know.",
    problem:"In the Ration Hall, four hundred hearts keep a single time. It is a warm and terrifying sensation, like holding a hand with four hundred fingers. Which of them is yours?",
    solution:"You accept the pulse, but you bend it. A crowd is a river and you are a pebble with ideas. In the right place, a pebble can change what the river thinks it is.",
    mods:{ solidarity:2, rhetoric:1, empathy:1, doublethink:-1, instinct:-1 }, effects:[ {ideo:"undercurrent", n:1}, {surv:3} ] },

  th_paper_heart: { id:"th_paper_heart", name:"Paper Heart", minutes:90,
    discover:"Forging a signature, finding a bread-note, or folding something into a smaller shape than it deserved.",
    problem:"Everything here is paperwork: love, death, hunger, holiday. A man can be unmade by a missing stamp. You start to wonder what the heart looks like in triplicate.",
    solution:"If a thing exists on paper it can be altered on paper. You feel the first gentle thrill of the forger: not a crime, you decide, but an editorial opinion.",
    mods:{ sleight:1, archive:1, rhetoric:1, empathy:-2 }, effects:[ {ideo:"undercurrent", n:1} ] },

  th_closed_window: { id:"th_closed_window", name:"The Closed Window", minutes:240,
    discover:"The school gate after 17:00, the Principal's window, or any sunset you are not allowed to watch.",
    problem:"You could go home. The gate is right there. Tea, a bed, a chair with your shape in it. All you would have to do is forget, and forgetting is what the Bell is for. Is it cowardice, or is it just good manners?",
    solution:"Some windows are meant to stay closed. You close this one gently, so as not to wake the rest of the building. It is peaceful, and a little like being a ghost who has made peace with the haunting.",
    mods:{ volition:2, composure:2, empathy:-1, adrenaline:-1, instinct:-1 }, effects:[ {ideo:"quiet", n:2}, {morale:2}, {surv:-4} ],
    cond:"time >= 900" }
};

})();
