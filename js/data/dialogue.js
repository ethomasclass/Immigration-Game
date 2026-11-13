// ============================================================================
// ALL SPOKEN AND READ TEXT IN THE GAME
// ----------------------------------------------------------------------------
// Each conversation is a "tree" of nodes. A node has:
//   lines:   spoken lines. A string = the tree's speaker. {who, text} = someone else.
//            who: 'narrator' = italic narration.
//   choices: [{ text, next, if, ifNot, key }]  (player's questions; not voiced)
//            key: true marks the question a goal needs (shown with a star)
//   next:    node to go to after the lines (if no choices)
//   end:     true to close the conversation after the lines
//   set:     ['flag', ...]  flags to set when the node is reached
//   note:    a fact added to the student's Notebook
//   doc:     opens a document (see DOCS) after the lines
//   action:  a named game event (handled in the zone file)
//
// VOICEOVER IDs are generated automatically as  <tree>.<node>.<lineNumber>
// e.g. rivka.why.2  ->  assets/audio/vo/rivka.why.2.mp3
// Run `node tools/export-vo-script.mjs` to get a CSV of every line + ID.
// If you reorder lines, re-export the script so file names still match.
//
// Vocabulary: [[term]] or [[shown words|term]] links to the Word Bank.
// ============================================================================

export const DIALOGUE = {

  // ==========================================================================
  // ZONE 1: STEERAGE
  // ==========================================================================
  rivka: {
    speaker: 'rivka',
    nodes: {
      start: {
        lines: [
          'You are the one with the camera box? Mama says not to stare. But everyone stares at it.',
        ],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'Where are you from?', next: 'from' },
          { text: 'Why did your family leave?', next: 'why', key: true },
          { text: 'How did you pay for the trip?', next: 'pay' },
          { text: 'What is that paper you keep holding?', next: 'letter', key: true },
          { text: 'Would you like your picture taken?', next: 'photo' },
          { text: 'Goodbye for now.', next: 'bye' },
        ],
      },
      from: {
        lines: [
          'From a small town near Kiev, in the Russian Empire. We are Jews.',
          'My father fixed shoes. Everyone in town knew his little shop.',
        ],
        next: 'hub',
      },
      why: {
        mood: 'down',
        set: ['heard_rivka_push'],
        note: 'PUSH: After 1881, mobs attacked Jewish towns in the Russian Empire (pogroms). New laws in 1882 (the May Laws) limited where Jews could live and work.',
        lines: [
          'In 1881, someone killed the Tsar. People blamed the Jews.',
          'Mobs attacked Jewish towns. These attacks are called [[pogrom|pogroms]].',
          'They smashed our windows. They burned Papa\'s shop. The police watched and did nothing.',
          'Then came new rules, the [[May Laws]]. Jews could not move to new villages. We could not buy land.',
          'Papa died the next winter. Mama said, "There is no future for us here."',
        ],
        next: 'hub',
      },
      pay: {
        note: 'PULL: Steamship tickets in steerage were cheap. Relatives already in America often sent money for tickets.',
        lines: [
          'Cousin Moishe in New York sent money for our tickets.',
          'He says steerage is cheap now. The steamship companies fight over passengers like dogs over a bone.',
        ],
        next: 'hub',
      },
      letter: {
        mood: 'up',
        set: ['read_letter'],
        keep: 'address',
        note: 'CHAIN MIGRATION: Rivka carries a letter with her cousin Moishe\'s address on Hester Street. Family who came first help the next ones come.',
        lines: [
          'Moishe\'s letter! I read it every night. Here, you may look.',
        ],
        doc: 'letter',
        next: 'letter2',
      },
      letter2: {
        lines: [
          'Without this address, we would know no one in America.',
          'With it, we have family waiting. Moishe came first. Now we follow. Maybe someday we send for others.',
        ],
        next: 'hub',
      },
      photo: {
        mood: 'up',
        set: ['promised_print'],
        lines: [
          'A picture? Of us? ...Yes. Please.',
          'My Bubbe, my grandmother, stayed behind. She is too old for the ship. She cried so hard at the station, the conductor waited.',
          'If you send her a picture, she will know we are alive. That we made it.',
          { who: 'narrator', text: 'You promise Rivka a print. (Press F to raise your camera, then aim at her.)' },
        ],
        next: 'hub',
      },
      bye: {
        lines: ['Take a good picture of us. So someday my children see how we came.'],
        end: true,
      },
    },
  },

  mama: {
    speaker: 'mama',
    nodes: {
      start: {
        mood: 'down',
        set: ['heard_cough'],
        lines: [
          'Rivka does the talking. Her English is better than mine.',
          'Shmuel coughs at night. Since Hamburg. If the American doctors hear it, they send him back.',
          'Back to what? There is nothing to go back to. Please. Do not tell anyone.',
        ],
        end: true,
      },
    },
  },

  shmuel: {
    speaker: 'shmuel',
    nodes: {
      start: {
        lines: [
          'Is it true the streets in America are made of gold?',
          'Mr. Novak is making me a horse! Out of wood! He says it can swim across the ocean.',
          { who: 'narrator', text: 'Shmuel coughs, a deep rattling cough. He looks at his mother, frightened, and covers his mouth.' },
        ],
        end: true,
      },
    },
  },

  giuseppe: {
    speaker: 'giuseppe',
    nodes: {
      start: {
        branch: [{ if: 'lemon', next: 'again' }, { next: 'first' }],
      },
      first: {
        set: ['lemon'],
        keep: 'lemon',
        lines: [
          'Ah, a photographer! Here, catch!',
          { who: 'narrator', text: 'He tosses you a lemon, wrinkled from twelve days at sea.' },
          'From my mother\'s tree. Smell it. That is Calabria. That is home.',
          'Keep it! Take my picture instead. Make me look rich, so Mamma is proud.',
        ],
        next: 'hub',
      },
      again: {
        lines: ['Photographer! You still have my lemon? Good. Don\'t eat it. It\'s not for eating. It\'s for remembering.'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'Where are you from?', next: 'from' },
          { text: 'Why are you leaving Italy?', next: 'why' },
          { text: 'What will you do in America?', next: 'plan' },
          { text: 'You and the German farmer don\'t seem friendly.', next: 'weber' },
          { text: 'Goodbye.', next: 'bye' },
        ],
      },
      from: {
        lines: [
          'From Calabria, in the south of Italy. Mountains, sea, lemon trees. Beautiful.',
          'Beautiful, but poor. Very, very poor.',
        ],
        next: 'hub',
      },
      why: {
        mood: 'down',
        set: ['heard_giuseppe_push'],
        note: 'PUSH: In southern Italy, poor farmers worked land owned by rich landlords, paid high taxes, and could barely feed their families.',
        lines: [
          'The land belongs to rich landlords. We work it. They keep most of the crops.',
          'Every year, the taxes go up. The soil is tired. A man works all day, and still his children are hungry.',
        ],
        next: 'hub',
      },
      plan: {
        mood: 'up',
        note: 'PULL: Jobs and higher pay. Many Italian men planned to work for a few years and return home. They were called "birds of passage."',
        lines: [
          'America needs strong backs! They are building railroads, streets, buildings, everything.',
          'My cousin says a man can earn a dollar a day digging. At home, I am lucky to earn twenty cents.',
          'I will work three, four years. Save every penny. Go home, buy land of my own.',
          'Many of us do this. The Americans call us [[bird of passage|birds of passage]].',
          'A man in Naples, a [[padrone]], promised me a job is waiting. He takes a little of my pay. My cousin says, "Be careful. Some padrones are thieves."',
        ],
        next: 'hub',
      },
      weber: {
        lines: [
          'That German looks at me like I am dirt. His people came years ago. Now he thinks America belongs to him.',
          'Pfft. The ocean is the same ocean for everybody.',
        ],
        next: 'hub',
      },
      bye: {
        lines: ['Ciao! See you in America, photographer!'],
        end: true,
      },
    },
  },

  weber: {
    speaker: 'weber',
    nodes: {
      start: {
        lines: ['Guten Tag. You are American? Good. Then tell me: is the soil in Wisconsin as rich as they say?'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'Why did you leave Germany?', next: 'why' },
          { text: 'Why Wisconsin?', next: 'pull' },
          { text: 'There are many kinds of people on this ship.', next: 'oldnew' },
          { text: 'Good day, Herr Weber.', next: 'bye' },
        ],
      },
      why: {
        set: ['heard_weber_push'],
        note: 'PUSH: German farmers faced falling grain prices, small rented farms, and years of required army service.',
        lines: [
          'In Pomerania, we rent a small farm. Now cheap grain comes from America and Russia, and our prices fall and fall.',
          'Also, my son would have to serve years in the army. I would rather he plow a field in Wisconsin.',
        ],
        next: 'hub',
      },
      pull: {
        note: 'PULL: Letters from relatives described cheap land, churches, and newspapers in their own language.',
        lines: [
          'My brother Karl went to Wisconsin in 1870. He writes us letters.',
          'Good soil. A German church. German newspapers. Like home, but the land is your own.',
        ],
        next: 'hub',
      },
      oldnew: {
        note: 'OLD vs. NEW IMMIGRANTS: Before 1880, most immigrants came from northern and western Europe (Germany, Ireland, Britain). After 1880, more came from southern and eastern Europe (Italy, Russia, Poland).',
        lines: [
          'Ja. We Germans, the Irish, the English, we have come to America for fifty years. People call us the [[old immigrants]].',
          'But now look: Italians. Russian Jews. Poles. Greeks. So many [[new immigrants|new people]]. Different churches, different food. I do not know their ways.',
        ],
        choices: [
          { text: 'They left home for the same reasons you did.', next: 'same' },
          { text: 'Do you think they belong in America?', next: 'belong' },
        ],
      },
      same: {
        lines: ['...Hmm. Perhaps. Hunger speaks every language.'],
        next: 'hub',
      },
      belong: {
        lines: ['When my grandfather\'s cousins came to America, people asked the same question about Germans. I suppose every ship asks it.'],
        next: 'hub',
      },
      bye: { lines: ['Auf Wiedersehen.'], end: true },
    },
  },

  fraweber: {
    speaker: 'fraweber',
    nodes: {
      start: {
        lines: [
          'Twelve days at sea, and the bread is already green.',
          'Do not write that in your newspaper. Well... perhaps you should.',
        ],
        end: true,
      },
    },
  },

  novak_ship: {
    speaker: 'novak',
    nodes: {
      start: {
        set: ['met_novak_ship'],
        lines: [
          'Sit, sit. My hands need work, or they forget.',
          { who: 'narrator', text: 'The old man is carving a little wooden horse with a pocketknife. Curls of wood collect in his lap.' },
          'For the boy with the cough. Every child should own a horse.',
          'My son Tomas went to Chicago eleven years ago. He writes every Christmas.',
          'My wife died in the spring. So I sold the loom, the house, everything, for the ticket.',
          'Tomas does not know I am coming. I will knock on his door. A surprise!',
        ],
        choices: [
          { text: 'What if something goes wrong?', next: 'wrong' },
          { text: 'He\'ll be so happy to see you.', next: 'happy' },
        ],
      },
      wrong: { lines: ['Wrong? I am seventy-two. Everything already went wrong once. Then you start again.'], end: true },
      happy: { lines: ['Ha! First he will shout at me for coming alone. Then he will be happy.'], end: true },
    },
  },

  steward: {
    speaker: 'steward',
    nodes: {
      start: {
        lines: ['Mind your head. Low beams down here, and lower tempers.'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'Tell me about steerage.', next: 'steerage' },
          { text: 'What do people eat?', next: 'food' },
          { text: 'How long is the crossing?', next: 'time' },
          { text: 'Why are so many people coming now?', next: 'business' },
          { text: 'When do we reach New York?', next: 'land' },
        ],
      },
      steerage: {
        set: ['heard_conditions'],
        note: 'STEERAGE: The cheapest tickets. Hundreds of people slept in crowded bunks below deck, with little air, light, or privacy.',
        lines: [
          '[[steerage|Steerage]]. Cheapest ticket on the ship. Near a thousand souls below decks on this crossing.',
          'Iron berths, two high, six feet by two. A sack of straw, one blanket, and a cork life preserver for a pillow.',
          'Single men sleep forward, single women aft, and families here in the middle.',
          'Upstairs, first class has a dining room with chandeliers. Same ship. Different world.',
        ],
        next: 'hub',
      },
      food: {
        set: ['heard_conditions'],
        lines: [
          'Herring, potatoes, black bread, and a soup the cook calls stew. Nobody asks for seconds.',
          'There\'s no dining room. You bring your own tin plate and cup, and I ladle it out of the big pans.',
          'Smart ones bring their own food from home: cheese, dried sausage, onions.',
        ],
        next: 'hub',
      },
      time: {
        set: ['heard_conditions'],
        lines: [
          'Ten days if the sea is kind. Fourteen if she isn\'t.',
          'When it\'s rough, everyone is sick at once. Then there\'s the smell. You\'ll never forget the smell.',
        ],
        next: 'hub',
      },
      business: {
        note: 'PULL: Steamships made the trip faster and cheaper. Steamship companies sent agents across Europe to sell tickets.',
        lines: [
          'Steam made the crossing faster and cheaper. Sailing ships took a month or more.',
          'The steamship lines send agents to every town in Europe, selling tickets and posters. "America! Work! Land!"',
          'More passengers, more money. That\'s the business.',
        ],
        next: 'hub',
      },
      land: {
        lines: ['Tomorrow morning, if the fog lifts. When you\'re ready, climb the ladder up through the hatch.'],
        end: true,
      },
    },
  },

  // ==========================================================================
  // ZONE 2: CASTLE GARDEN
  // ==========================================================================
  doctor: {
    speaker: 'doctor',
    nodes: {
      start: {
        set: ['medical'],
        lines: [
          'Next! Step forward. Look at me. Open your eyes wide.',
          'You\'ll do. Move along. Next!',
          { who: 'narrator', text: 'The doctor turns to Shmuel. The boy coughs. Mrs. Abramowitz grips your arm so hard it hurts.' },
          'This one. Open your mouth. Breathe. Again. ...Again.',
          { who: 'narrator', text: 'The whole line has gone quiet.' },
          '...Seasick. Half the ship is seasick. Move along.',
          { who: 'mama', text: 'Thank God. Thank God.' },
        ],
        action: 'afterDoctor',
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'What are you looking for?', next: 'look' },
          { text: 'How long does each check take?', next: 'time' },
          { text: 'What happens to sick people?', next: 'sick' },
          { text: 'Thank you, Doctor.', next: 'bye' },
        ],
      },
      look: {
        note: 'INSPECTION: Doctors quickly checked immigrants for contagious disease and for anyone too sick or weak to work.',
        lines: ['Contagious disease: fever, smallpox, bad coughs. And anyone too sick or weak to work and support themselves.'],
        next: 'hub',
      },
      time: {
        lines: ['A few seconds. Some days, thousands of people come through. I don\'t have all day to admire your tongue.'],
        next: 'hub',
      },
      sick: {
        lines: [
          'If it\'s catching, they go to the hospital on Ward\'s Island.',
          'If we turn them away, the steamship company must carry them home, at the company\'s own cost.',
        ],
        next: 'hub',
      },
      bye: { lines: ['Next!'], end: true },
    },
  },

  clerk: {
    speaker: 'clerk',
    nodes: {
      start: {
        lines: [
          'Next! Family of three? All right, miss, you\'re translating?',
          { who: 'rivka', text: 'Yes, sir.' },
          'Name, country, job, and where you\'re going.',
          { who: 'rivka', text: 'Rivka Abramowitz. Russia. I sew. We go to Hester Street, New York.' },
          'Do you have money? Is anyone meeting you?',
        ],
        choices: [
          { text: '(Whisper to Rivka) Show him Moishe\'s letter.', next: 'showletter', if: 'read_letter' },
          { text: '(Whisper to Rivka) Tell him about your cousin.', next: 'showletter', ifNot: 'read_letter' },
          { text: '(Stay quiet and watch.)', next: 'quiet' },
        ],
      },
      showletter: {
        set: ['registered'],
        lines: [
          { who: 'rivka', text: 'Our cousin, Moishe Abramowitz. He is a tailor. Here is his address.' },
          'Family with a job and an address. Good. That\'s what I like to see. Next!',
        ],
        action: 'afterClerk',
        next: 'after',
      },
      quiet: {
        set: ['registered'],
        lines: [
          { who: 'rivka', text: 'We have... eleven dollars. And a cousin. A tailor.' },
          'Address? ...Hester Street. All right. Next!',
        ],
        action: 'afterClerk',
        next: 'after',
      },
      after: {
        lines: [],
        choices: [
          { text: 'Why all the questions?', next: 'law' },
          { text: 'Who gets turned away?', next: 'who' },
          { text: 'Why did the address matter so much?', next: 'address' },
          { text: 'Thanks.', next: 'bye' },
        ],
      },
      law: {
        note: 'IMMIGRATION ACT OF 1882: The federal government charged a 50-cent head tax for each immigrant (paid by the shipping company) and banned convicts and anyone "likely to become a public charge."',
        lines: [
          'The law, friend. The [[Immigration Act of 1882]]. Congress runs immigration now, not just New York State.',
          'Fifty cents a head. The [[head tax]]. The steamship line pays it, then adds it to the ticket price.',
        ],
        next: 'after',
      },
      who: {
        lines: [
          'Convicts. People who are insane. And anyone "[[public charge|likely to become a public charge]]."',
          'That means anybody we think will end up living off charity. Old folks alone. No money, no family, no work.',
        ],
        next: 'after',
      },
      address: {
        lines: ['Family waiting means somebody will feed you while you find work. To me, that address is worth more than gold.'],
        next: 'after',
      },
      bye: { lines: ['Keep the line moving!'], end: true },
    },
  },

  novak: {
    speaker: 'novak',
    nodes: {
      start: {
        mood: 'down',
        branch: [{ if: 'novak_decided', next: 'after' }, { next: 'first' }],
      },
      first: {
        set: ['met_novak'],
        note: 'WHO GETS IN? Anton Novak, an old weaver with no money and no family meeting him, was held as "likely to become a public charge."',
        lines: [
          'Photographer! You remember me, from the ship?',
          'They keep me here, on this bench. "Public charge," they say. Old, no money, nobody meeting me.',
          'I tell them, my son Tomas is in Chicago! They say, "Then where is he?"',
          'A telegram to Chicago costs twenty-five cents. I have four cents. Everything else went for the ticket.',
          'If no one comes for me in three days, they put me back on the ship.',
        ],
        choices: [
          { text: 'Pay for the telegram yourself (25 cents of your own money).', next: 'pay', key: true },
          { text: 'I\'m sorry. I can\'t.', next: 'nopay', key: true },
        ],
      },
      pay: {
        mood: 'up',
        set: ['paid_telegram', 'novak_decided'],
        spend: 25, spendFor: 'for Mr. Novak\'s telegram to Chicago',
        keep: 'receipt',
        lines: [
          { who: 'narrator', text: 'You count out the coins. Mr. Novak holds them a long time before he closes his hand.' },
          'Tomas Novak. Halsted Street, Chicago. "Your father is at Castle Garden. Come."',
          'If he comes, I owe you my life. If he does not... I owe you anyway.',
        ],
        end: true,
      },
      nopay: {
        mood: 'down',
        set: ['novak_decided'],
        lines: [
          'No, no. You are young. Your money is your future. I understand.',
          { who: 'narrator', text: 'He goes back to carving. The little horse for Shmuel is almost finished.' },
        ],
        end: true,
      },
      after: {
        branch: [{ if: 'paid_telegram', next: 'waiting' }, { next: 'carving' }],
      },
      waiting: { lines: ['Every time the door opens, I think: Tomas. Not yet. Not yet.'], end: true },
      carving: { keep: 'horse', lines: ['The horse is finished. Give it to the boy for me, if I cannot.'], end: true },
    },
  },

  gate: {
    speaker: 'rivka',
    nodes: {
      start: {
        mood: 'down',
        lines: [
          'So many men shouting! Everyone wants our bags, our money...',
          'Mama is frightened. You know this city better than we do. Who should we trust?',
        ],
        choices: [
          { text: 'Go with "Smiling Jack." He offered a cheap boardinghouse.', next: 'jack', if: 'talked_runner' },
          { text: 'Change your rubles with the street money changer first.', next: 'changer', if: 'talked_changer' },
          { text: 'Ask Miss Carver at the information desk.', next: 'carver', if: 'talked_agent' },
          { text: 'Let me talk to some of these people first.', next: 'wait' },
        ],
      },
      wait: { lines: ['All right. But hurry, please. Shmuel is hungry.'], end: true },
      jack: {
        set: ['gate_done', 'swindled'],
        lines: [
          { who: 'narrator', text: 'Jack grabs the bags and leads them to a crowded boardinghouse on Greenwich Street.' },
          { who: 'narrator', text: 'There, the "one dollar" bed suddenly costs five. Jack will not return the bags until they pay.' },
          'He lied to us! Almost half our money is gone. How will we start?',
          { who: 'narrator', text: 'You help them get away and find the way to Hester Street. Runners like Jack cheated thousands of newcomers.' },
        ],
        note: 'RUNNERS: Swindlers waited outside Castle Garden. They charged too much for boardinghouses, held luggage for ransom, or sold fake tickets.',
        action: 'gateDone',
        end: true,
      },
      changer: {
        set: ['gate_done', 'shortchanged'],
        lines: [
          { who: 'narrator', text: 'The money changer counts quickly and hands over a small pile of American coins.' },
          'Wait. This is much less than the sign inside said! He cheated us!',
          { who: 'narrator', text: 'He has already vanished into the crowd. Rivka\'s family has lost a good part of their savings.' },
        ],
        note: 'MONEY CHANGERS: Some street money changers gave newcomers far less than their money was worth.',
        action: 'gateDone',
        end: true,
      },
      carver: {
        mood: 'up',
        set: ['gate_done', 'safe'],
        lines: [
          { who: 'narrator', text: 'Miss Carver changes their money at the official rate and draws a map to Hester Street.' },
          'She says Moishe lives only a few miles away. We can walk! Thank you, thank you.',
        ],
        note: 'HELP: Castle Garden had official money exchange and information services to protect immigrants from swindlers.',
        action: 'gateDone',
        end: true,
      },
    },
  },

  rivka_cg: {
    speaker: 'rivka',
    nodes: {
      start: {
        lines: [
          'My heart is pounding. What if they send us back? Where would we even go?',
          'Stay close to us, please. Go see the doctor first. Then the clerk will call us.',
        ],
        end: true,
      },
    },
  },

  runner: {
    speaker: 'runner',
    nodes: {
      start: {
        set: ['talked_runner'],
        lines: [
          'Welcome to America, friends! Welcome, welcome!',
          'Best boardinghouse in New York! Clean beds, hot meals, only one dollar! Here, give me your bags. I\'ll carry them for you!',
        ],
        choices: [
          { text: 'Why are you so eager to help?', next: 'eager' },
          { text: 'We\'ll think about it.', next: 'bye' },
        ],
      },
      eager: {
        lines: ['Me? I just love helping newcomers! That\'s all! Ha ha. Now, those bags...'],
        end: true,
      },
      bye: { lines: ['Don\'t think too long! Beds go fast!'], end: true },
    },
  },

  changer: {
    speaker: 'changer',
    nodes: {
      start: {
        set: ['talked_changer'],
        lines: [
          'Rubles? Lire? Marks? I change them all! Best rate in New York!',
          'Inside, they make you wait in line. With me? Quick, quick. Nobody waits.',
        ],
        end: true,
      },
    },
  },

  agent: {
    speaker: 'agent',
    nodes: {
      start: {
        set: ['talked_agent'],
        lines: [
          'Information desk. How can I help?',
          'Whatever you do, don\'t hand your bags to strangers outside that gate. And change your money only at the official counter.',
          'If you have an address, show it to me. I\'ll tell you how to get there.',
        ],
        choices: [
          { text: 'Who are the men shouting outside?', next: 'runners' },
          { text: 'Thank you.', next: 'bye' },
        ],
      },
      runners: {
        lines: [
          'Runners. They\'re paid by boardinghouses, ticket sellers, and worse. Some are honest. Most are not.',
          'They speak your language, smile, and promise everything. That\'s how they get you.',
        ],
        end: true,
      },
      bye: { lines: ['Good luck to you.'], end: true },
    },
  },

  // ==========================================================================
  // ZONE 3: LOWER EAST SIDE
  // ==========================================================================
  rivka_les: {
    speaker: 'rivka',
    nodes: {
      start: {
        mood: 'up',
        lines: [
          'This is it! Hester Street. The number matches the letter!',
          'Moishe lives inside, on the ground floor. Come, come in with us!',
        ],
        action: 'familyEnters',
        end: true,
      },
    },
  },

  rivka_home: {
    speaker: 'rivka',
    nodes: {
      start: {
        mood: 'up',
        lines: [
          'Two rooms. Nine people. And it is ours.',
          'Tomorrow Moishe takes me to a shop that needs a girl for buttonholes. Tomorrow I start.',
        ],
        end: true,
      },
    },
  },

  moishe: {
    speaker: 'moishe',
    nodes: {
      start: {
        // branch: jump to the first node whose flag is set
        branch: [
          { if: 'met_moishe', next: 'hub' },
          { if: 'swindled', next: 'swindled' },
          { if: 'shortchanged', next: 'shortchanged' },
          { next: 'welcome' },
        ],
      },
      swindled: {
        mood: 'down',
        lines: [
          'Rivka! Mama! Shmuel! You are here! ...What? A runner took your money?',
          'Ach. They wait like wolves at Castle Garden. Don\'t worry. The Kiever Society will help. We help each other here.',
        ],
        next: 'hub',
      },
      shortchanged: {
        mood: 'down',
        lines: [
          'Rivka! Mama! You came! ...Cheated by a money changer? It happens to half of us.',
          'Don\'t cry. The Kiever Society will help. We help each other here.',
        ],
        next: 'hub',
      },
      welcome: {
        mood: 'up',
        lines: [
          'Rivka! Mama! Shmuel! You found me! The letter worked!',
          'And you, the photographer who helped them. Come in, come in. Mind the stairs. It\'s dark.',
        ],
        next: 'hub',
      },
      hub: {
        set: ['met_moishe'],
        lines: [],
        choices: [
          { text: 'What work do you do?', next: 'work' },
          { text: 'Tell me about this apartment.', next: 'home' },
          { text: 'Who are all these people?', next: 'boarders' },
          { text: 'Who helps you when times are hard?', next: 'society' },
          { text: 'Is America a land of opportunity?', next: 'opportunity' },
          { text: 'May I photograph Sarah at her sewing?', next: 'sarah', key: true },
          { text: 'I\'ll look around.', next: 'bye' },
        ],
      },
      work: {
        mood: 'down',
        set: ['learned_sweatshop'],
        note: 'SWEATSHOPS: Many families sewed clothing at home. A contractor brought cut cloth and paid by the piece (piecework). Families worked 12 to 14 hours a day, six days a week.',
        lines: [
          'I am a tailor. We sew coats, right here in the apartment.',
          'A contractor brings cut cloth in the morning. We sew. He pays by the coat. This is called [[piecework]].',
          'If we sew fast, we eat. If we are slow, we don\'t. Fourteen hours a day, six days a week.',
          'Uptown people call a place like this a [[sweatshop]]. To me, it is home.',
        ],
        next: 'hub',
      },
      home: {
        set: ['learned_tenement'],
        note: 'TENEMENTS: Crowded buildings with tiny rooms. The 1879 law required a window in every room, so builders added narrow air shafts. Toilets (privies) were in the back yard, shared by everyone.',
        lines: [
          'Two rooms. This front room, where we work and cook and eat. And the back room, where we sleep.',
          'The back room has no window to the street. The [[Tenement Act of 1879|new law]] said every room must have a window. So they made a window onto an air shaft.',
          'The air shaft brings no air. Only smells, and the neighbors\' noise, and garbage people throw down.',
          'The toilet is the [[privy]] in the back yard. The whole building shares it.',
        ],
        next: 'hub',
      },
      boarders: {
        note: 'BOARDERS: To afford rent, families took in boarders who paid to sleep in their apartment.',
        lines: [
          'Me, Chana, our Sarah, two [[boarder|boarders]], and now Rivka, Mama, and Shmuel. Nine people, two rooms.',
          'The rent is high. The boarders help us pay. Yankel sleeps on two chairs pushed together.',
        ],
        next: 'hub',
      },
      society: {
        lines: [
          'When I was sick last winter, the Kiever Society paid me sick money. Everyone in it comes from near Kiev.',
          'Go see Mr. Kaplan at the society\'s rooms, by the synagogue. He will tell you.',
        ],
        next: 'hub',
      },
      opportunity: {
        mood: 'up',
        lines: [
          'Opportunity? In Russia they burned our homes. Here, they only work us to the bone.',
          'But my Sarah goes to school. She reads English better than her teacher! That is opportunity.',
          'Ask me again in twenty years.',
        ],
        next: 'hub',
      },
      sarah: {
        mood: 'down',
        set: ['heard_sarah_plea'],
        lines: [
          '...Photograph the room. Photograph the machine. Photograph me, I don\'t care.',
          'But please. Not my Sarah\'s face.',
          'Mr. Kessler reads the newspapers. If he sees a child working in his coats, he says we make trouble, and the work goes to the next family. There is always a next family.',
          'Promise me you will think about it, before you print anything.',
        ],
        next: 'hub',
      },
      bye: { lines: ['Be careful on the stairs. And thank you, for bringing my family.'], end: true },
    },
  },

  kessler1: {
    speaker: 'kessler',
    nodes: {
      start: {
        mood: 'down',
        set: ['met_kessler'],
        lines: [
          'Ten coats. Eleven. Twelve. This one, the seam is crooked. Ten cents off.',
          { who: 'chana', text: 'It is straight! Look at it! It is straight!' },
          'Then next week it is straight. This week, ten cents off.',
          'You want the work, Mrs. Abramowitz, or should I give it to the Rosenbergs upstairs?',
          { who: 'narrator', text: 'Chana says nothing. Her hands are shaking.' },
        ],
        choices: [
          { text: 'That seam looks straight to me.', next: 'straight' },
          { text: '(Say nothing.)', next: 'nothing' },
        ],
      },
      straight: {
        mood: 'down',
        lines: [
          'You are the photographer? Listen, mister.',
          'The manufacturer on Broadway pays me less every season. If I don\'t squeeze, I lose the contract, and nobody in this building eats.',
          'You want a villain for your newspaper? Go photograph the man on Broadway.',
        ],
        action: 'kesslerLeaves',
        end: true,
      },
      nothing: { lines: ['Good. A man who knows when to keep quiet. Next Friday, Moishe. Fourteen coats.'], action: 'kesslerLeaves', end: true },
    },
  },

  chana: {
    speaker: 'chana',
    nodes: {
      start: {
        mood: 'down',
        lines: [
          'Hand me that thread. No, the black one. Thank you.',
          'I am a finisher. Moishe sews the seams. I do buttonholes, hems, linings. A few pennies for each coat.',
          'In winter, we sew by the lamp until our eyes burn. In summer, it\'s so hot the cloth sticks to our hands.',
        ],
        end: true,
      },
    },
  },

  girl: {
    speaker: 'girl',
    nodes: {
      start: {
        mood: 'down',
        lines: [
          'I sew buttons after school. Mama says school comes first.',
          'But buttons pay, so I sew fast. Look, twelve already!',
        ],
        end: true,
      },
    },
  },

  boarder: {
    speaker: 'boarder',
    nodes: {
      start: {
        lines: [
          'Shh. I work nights at the bakery. These two chairs? This is my bed.',
          'I pay Moishe a dollar a week. It\'s a bed and a roof. In America, that\'s a start.',
        ],
        end: true,
      },
    },
  },

  riis: {
    speaker: 'riis',
    nodes: {
      start: {
        set: ['met_riis'],
        lines: [
          'Ah! Another camera! Jacob Riis, police reporter, New York Tribune.',
          'I came from Denmark myself, in 1870. I slept in police station lodging rooms, hungry. I know these streets.',
        ],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'Why do you photograph the tenements?', next: 'why' },
          { text: 'How do you take pictures in the dark?', next: 'flash' },
          { text: 'Do people agree to be photographed?', next: 'consent' },
          { text: 'Moishe begged me not to photograph Sarah\'s face.', next: 'faces', key: true },
          { text: 'What do you think of this yard?', next: 'yard' },
          { text: 'Good luck, Mr. Riis.', next: 'bye' },
        ],
      },
      why: {
        note: 'JACOB RIIS: A reporter and photographer who showed wealthy New Yorkers how poor immigrants lived. His book "How the Other Half Lives" came out in 1890.',
        lines: [
          'Uptown, people don\'t believe me when I write how the other half lives. So I show them.',
          'A picture can\'t be argued with. Someday I\'ll put these pictures in a book. Then the city will have to act.',
        ],
        next: 'hub',
      },
      flash: {
        mood: 'up',
        lines: [
          '[[flash powder|Flash powder]]! Brand new. You light it, and poof! A flash like lightning.',
          'For a moment, the darkest room is bright as noon. I nearly set a room on fire once. Twice, actually.',
        ],
        next: 'hub',
      },
      consent: {
        mood: 'down',
        set: ['riis_consent'],
        lines: [
          'Agree? Ha. Most of them were asleep when the flash went off. Some ran. Some threw things.',
          'It frightens them, I know. But the city must see.',
          { who: 'narrator', text: 'You wonder: is it fair to photograph people without asking? Riis\'s pictures helped change laws, but some of what he wrote about immigrant groups was unkind and unfair.' },
        ],
        next: 'hub',
      },
      faces: {
        set: ['heard_riis_faces'],
        lines: [
          'He is afraid. I understand. I have seen what bosses do.',
          'But hear me. Uptown, a picture of a dark room is just a dark room. Readers turn the page.',
          'A child\'s face at a sewing machine? That, nobody forgets. Faces change laws.',
          'And sometimes faces cost a family its work. That is the hard part of this job, friend. You will have to choose.',
        ],
        next: 'hub',
      },
      yard: {
        lines: [
          'One privy for the whole building. Laundry, garbage, children playing, all in the same yard.',
          'In summer, sickness spreads like fire here. Babies die. Mark my words, the tenements are killing people.',
        ],
        next: 'hub',
      },
      bye: { lines: ['Keep your plates dry, and your eyes open!'], end: true },
    },
  },

  peddler: {
    speaker: 'peddler',
    nodes: {
      start: {
        lines: ['Pickles! Herring! Fresh onions! Cheaper than anywhere! You want? No? Then why are you standing in front of my cart?'],
        choices: [
          { text: 'Why sell from a pushcart?', next: 'why' },
          { text: 'Is it hard?', next: 'hard' },
          { text: 'Buy a pickle (1 cent).', next: 'pickle' },
        ],
      },
      why: {
        set: ['learned_pushcart'],
        note: 'PUSHCARTS: Many immigrants earned a living as peddlers. Renting a cart cost only a few cents a day, and there was no boss.',
        lines: [
          'A [[pushcart]] rents for ten cents a day. I buy at the market at dawn. I sell until dark. The profit is mine!',
          'No boss yelling at me. No contractor. Just me, my cart, and my big mouth.',
          'Someday, a store. With a sign! "Gold\'s." Why not?',
        ],
        end: true,
      },
      pickle: { spend: 1, spendFor: 'for a pickle', lines: ['One cent! The best pickle on Hester Street. Don\'t tell Herschel I said so. He thinks his are better.'], end: true },
      hard: {
        lines: [
          'Rain, snow, other peddlers fighting for the same corner.',
          'And the policeman comes and says "Move along!" unless you give him a little something. Every day, a little something.',
        ],
        end: true,
      },
    },
  },

  peddler2: {
    speaker: 'peddler2',
    nodes: {
      start: {
        lines: [
          'Pots! Pans! Tin cups! In the old country, I was a teacher.',
          'Here, I sell pots. My English is not good enough to teach. But my son? My son will be the teacher.',
        ],
        end: true,
      },
    },
  },

  newsboy: {
    speaker: 'newsboy',
    nodes: {
      start: {
        set: ['learned_papers'],
        note: 'ETHNIC NEWSPAPERS: Papers in Yiddish, Italian, German, and other languages gave news from home and helped immigrants find jobs, housing, and lawyers.',
        lines: [
          'Extra, extra! Papers in every language! Two cents!',
          'Yiddish paper! Italian paper! The German Staats-Zeitung! The Irish World! What\'ll it be, mister?',
        ],
        choices: [
          { text: 'Why so many languages?', next: 'why' },
          { text: 'Buy a paper (2 cents).', next: 'buy' },
          { text: 'No thanks.', next: 'bye' },
        ],
      },
      why: {
        lines: [
          'People want news from home! And they can\'t read English yet. Not good enough, anyway.',
          'Look at the back pages: jobs, rooms for rent, lawyers, steamship tickets. Everything a greenhorn needs.',
          'These [[ethnic newspaper|papers]] tell you how to be an American, in your own language. Funny, huh?',
        ],
        end: true,
      },
      buy: { spend: 2, spendFor: 'for a newspaper', keep: 'paper', lines: ['Two cents! Thanks, mister! Read the back pages, that\'s where the jobs are.'], end: true },
      bye: { lines: ['Suit yourself! Extra, extra!'], end: true },
    },
  },

  rabbi: {
    speaker: 'rabbi',
    nodes: {
      start: {
        set: ['learned_society'],
        note: 'MUTUAL AID: Landsmanshaftn (hometown societies) collected small monthly dues and helped members with sick pay, loans, jobs, and burials.',
        lines: [
          'Welcome to the new synagogue on Eldridge Street, finished just last year. I am Kaplan, secretary of the Kiever Society.',
          'We are a [[landsmanshaft]]: everyone from Kiev and the towns nearby.',
          'Each member pays a little every month. When someone is sick, we pay. When someone dies, we bury them properly.',
          'When a newcomer arrives, we help find a room and a job.',
        ],
        next: 'more',
      },
      more: {
        lines: [],
        choices: [
          { text: 'Why not ask the government for help?', next: 'govt' },
          { text: 'My friend Rivka\'s family lost money to a swindler.', next: 'loan', if: 'swindled' },
          { text: 'My friend Rivka\'s family lost money to a money changer.', next: 'loan', if: 'shortchanged' },
          { text: 'Thank you, Mr. Kaplan.', next: 'bye' },
        ],
      },
      govt: {
        lines: [
          'The government? The government does not pay sick money. Charities make you beg.',
          'So we do it for each other. That is [[mutual aid]]. The synagogue, the society, the Italian church, the Irish clubs. Everyone has something.',
        ],
        next: 'more',
      },
      loan: {
        set: ['society_loan'],
        lines: ['Bring them to me. The society will lend them enough to start. They will pay back when they can. That is what we are for.'],
        next: 'more',
      },
      bye: { lines: ['Go in peace.'], end: true },
    },
  },

  priest: {
    speaker: 'priest',
    nodes: {
      start: {
        set: ['learned_parish'],
        note: 'PARISHES: Catholic parishes ran schools, helped the sick and poor, and gave Irish and Italian immigrants a community.',
        lines: [
          'Good day. This is the Church of the Transfiguration, on Mott Street. Protestants built it long ago, and the Irish made it a Catholic [[parish]].',
          'Now the Italians come too, and Chinese neighbors live all around us.',
          'The Irish are not always happy to share their pews. Different saints, different songs.',
          'But we run a school. We visit the sick. We help men find work. A parish is like a village inside the city.',
        ],
        end: true,
      },
    },
  },

  giuseppe2: {
    speaker: 'giuseppe',
    nodes: {
      start: {
        lines: [
          'Photographer! You made it too! Look at me, an American worker!',
          'I live on Mulberry Street with men from my village. Eight of us in one room. We cook together, we send money home together.',
          'I dig for a new street. A dollar a day... minus what the padrone takes. Still, it\'s more than Calabria.',
        ],
        end: true,
      },
    },
  },

  lee: {
    speaker: 'lee',
    nodes: {
      start: {
        mood: 'up',
        lines: ['Welcome to my shop. Tea, dried fish, rice, medicine. Letters from home. You want something?'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'How did you come to New York?', next: 'came' },
          { text: 'Why did you open your own store?', next: 'store' },
          { text: 'I read about the Chinese Exclusion Act.', next: 'exclusion' },
          { text: 'Thank you, Mr. Lee.', next: 'bye' },
        ],
      },
      came: {
        lines: [
          'I came to San Francisco in 1868. I helped build the railroad over the mountains. Then I worked in a laundry.',
          'Out West, people began to attack Chinese workers. In Wyoming, in 1885, a mob killed twenty-eight Chinese miners.',
          'So many of us came east, to New York. Here, it is quieter. A little.',
        ],
        next: 'hub',
      },
      store: {
        set: ['learned_lee'],
        note: 'CHINESE IMMIGRANTS: Facing discrimination, many Chinese immigrants opened their own businesses, like laundries and shops, and built their own community on Mott Street.',
        lines: [
          'White-owned businesses would not hire me. Not in a factory, not in a store.',
          'So I work for myself. And I hire other Chinese. On Mott Street, we have our own shops, our own societies, our own help.',
        ],
        next: 'hub',
      },
      exclusion: {
        mood: 'down',
        set: ['learned_exclusion'],
        note: 'CHINESE EXCLUSION ACT (1882): Banned Chinese laborers from coming to the U.S. and barred Chinese immigrants from becoming citizens. Merchants could still come, but laborers could not.',
        lines: [
          'Yes. The [[Chinese Exclusion Act]]. Since 1882, no more Chinese laborers may come to America.',
          'Because I am a [[merchant]], I may stay. But I can never become a citizen. The law says so.',
          'My brother is a laborer. He cannot come. I have not seen him in twenty years.',
          'The Irish, the Germans, the Jews, they can all become citizens. Only us, the law shuts out by name.',
        ],
        next: 'hub',
      },
      bye: { lines: ['Come again.'], end: true },
    },
  },

  brennan: {
    speaker: 'brennan',
    nodes: {
      start: {
        set: ['met_brennan'],
        lines: [
          'Would you look at this street! Pushcarts, foreign talk, garlic. It\'s not the neighborhood I knew.',
          'These new people come by the boatload. They work for nothing, and then decent folks can\'t get a fair wage.',
        ],
        choices: [
          { text: 'When did your family come here?', next: 'when' },
          { text: 'Did you read that handbill on the wall?', next: 'handbill' },
        ],
      },
      when: {
        lines: [
          'My parents came from Ireland in \'49, during the Famine. Half the village starved. We came with nothing.',
          'We worked hard! We built this city.',
        ],
        choices: [
          { text: 'Were the Irish welcomed back then?', next: 'welcomed' },
        ],
      },
      handbill: {
        mood: 'down',
        lines: ['I did. And some of it\'s right, if you ask me. But I don\'t hold with all of it.'],
        next: 'when',
      },
      welcomed: {
        set: ['learned_nativism'],
        note: 'NATIVISM: Some Americans, including some earlier immigrants, feared and disliked newer immigrants. The Irish had faced the same prejudice a generation before.',
        lines: [
          'Welcomed? Ha! Some job ads said "No Irish need apply." They called us dirty, and drunk, and said the Pope would rule America.',
        ],
        choices: [
          { text: 'Don\'t people say the same things now about Italians and Jews?', next: 'mirror' },
        ],
      },
      mirror: {
        mood: 'down',
        lines: [
          '...Well. That was different. We spoke English, at least.',
          '...Maybe they did say the same things. Maybe they do. I don\'t have to like it.',
        ],
        end: true,
      },
    },
  },

  guild: {
    speaker: 'guild',
    nodes: {
      start: {
        set: ['learned_guild'],
        note: 'SETTLEMENT HOUSES: The Neighborhood Guild (1886) on the Lower East Side was America\'s first settlement house. Volunteers lived in the neighborhood and ran clubs, classes, and a kindergarten.',
        lines: [
          'Hello! Welcome to the [[Neighborhood Guild]], here at 146 Forsyth Street. Dr. Stanton Coit started it in 1886. It\'s the first [[settlement house]] in America.',
          'We don\'t just visit the neighborhood. We live here. We run boys\' and girls\' clubs, a reading room, English classes, a kindergarten.',
        ],
        choices: [
          { text: 'Why live here?', next: 'why' },
          { text: 'Are there others like this?', next: 'others' },
        ],
      },
      why: {
        lines: [
          'You can\'t help people you don\'t know. Some people want to "fix" the immigrants.',
          'I think we should listen first. Mrs. Gold down the street knows more about business than any banker I\'ve met.',
        ],
        end: true,
      },
      others: {
        lines: [
          'The idea came from London, from a place called Toynbee Hall.',
          'I hear a young woman from Illinois, a Miss Jane Addams, visited it this year. She wants to open one in Chicago.',
        ],
        end: true,
      },
    },
  },

  boss: {
    speaker: 'boss',
    nodes: {
      start: {
        mood: 'up',
        set: ['met_quinn'],
        keep: 'coal',
        lines: [
          'Cold night coming! Here, take a sack of coal for your family. No charge!',
          'Just remember who your friends are on Election Day. Ha ha!',
        ],
        choices: [
          { text: 'Who are you?', next: 'who' },
          { text: 'Why give away free coal?', next: 'why' },
        ],
      },
      who: {
        lines: ['Me? Just a friend of the neighborhood. Ask anybody for Quinn, from the Tammany club on the corner.'],
        end: true,
      },
      why: {
        lines: ['Because folks need it! And folks who get help... well, they remember. That\'s all. Next! Who needs coal?'],
        end: true,
      },
    },
  },

  // ==========================================================================
  // ZONE 4: THE CITY
  // ==========================================================================
  oldrep: {
    speaker: 'oldrep',
    nodes: {
      start: {
        lines: ['You\'re the one doing the immigrant story? Haskins. Thirty years on Park Row. Come look at this.'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'What is that cartoon?', next: 'cartoon' },
          { text: 'Who was Boss Tweed?', next: 'tweed' },
          { text: 'What happened to him?', next: 'fall' },
          { text: 'So is Tammany gone?', next: 'tammany' },
          { text: 'Thanks, Mr. Haskins.', next: 'bye' },
        ],
      },
      cartoon: {
        lines: [
          'Thomas Nast drew it for Harper\'s Weekly, back in 1871. Tweed and his friends, standing in a circle.',
          '"Who stole the people\'s money?" And each one points at the next man. "\'Twas him."',
        ],
        doc: 'nast',
        next: 'hub',
      },
      tweed: {
        set: ['learned_tweed'],
        note: 'BOSS TWEED: William M. Tweed led Tammany Hall, New York\'s Democratic political machine, in the 1860s. His "Tweed Ring" stole tens of millions of dollars from the city.',
        lines: [
          'William Magear Tweed. "Boss" Tweed. He ran Tammany Hall, the Democratic political club, in the 1860s.',
          'Tammany ran the city like a machine: jobs, contracts, favors, votes. And Tweed\'s Ring stole from the city treasury. Tens of millions of dollars.',
          'See that courthouse behind City Hall? It should have cost a few hundred thousand. They billed the city millions. One plasterer was paid over a hundred thousand dollars for two days\' work!',
        ],
        next: 'hub',
      },
      fall: {
        lines: [
          'The newspapers and Nast\'s cartoons turned the city against him. Tweed hated the cartoons most. He said his voters couldn\'t read, but they could see pictures!',
          'He was convicted, escaped to Spain, and was caught. Some say a Spanish officer knew his face from a Nast cartoon. He died in jail in 1878.',
        ],
        next: 'hub',
      },
      tammany: {
        lines: [
          'Gone? Ha! Tweed is gone. Tammany got smarter.',
          'Go talk to Plunkitt. He sits at the bootblack stand inside the courthouse, of all places. He\'ll tell you how it works. He loves to talk.',
        ],
        next: 'hub',
      },
      bye: { lines: ['A picture is worth a thousand votes, kid. Remember that.'], end: true },
    },
  },

  plunkitt: {
    speaker: 'plunkitt',
    nodes: {
      start: {
        set: ['met_plunkitt'],
        lines: [
          'Sit down, young fella! Get a shine! This here bootblack stand is my office.',
          'George Washington Plunkitt, Tammany leader of the Fifteenth District. What can I do for you?',
        ],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'How does Tammany win votes?', next: 'votes', key: true },
          { text: 'What do you do for immigrants?', next: 'immigrants' },
          { text: 'What about Boss Tweed?', next: 'tweed', if: 'learned_tweed' },
          { text: 'I met a man named Quinn handing out coal.', next: 'quinn', if: 'met_quinn' },
          { text: 'Isn\'t that just buying votes?', next: 'buying' },
          { text: 'Thank you, Mr. Plunkitt.', next: 'bye' },
        ],
      },
      votes: {
        mood: 'up',
        set: ['learned_machine'],
        note: 'POLITICAL MACHINES: Groups like Tammany Hall gave people jobs, food, coal, and help with the law. In return, people voted for the machine\'s candidates.',
        lines: [
          'Easy! We help people. A family is burned out of their home at two in the morning? I\'m there before the fire engines leave.',
          'I find them a place to stay. Clothes. Food. I don\'t ask if they\'re Irish or Jewish or Italian, or if they\'re worthy. I just help.',
          'And when Election Day comes, who do you think they vote for?',
        ],
        next: 'hub',
      },
      immigrants: {
        set: ['learned_machine_imm'],
        note: 'MACHINES AND IMMIGRANTS: Machines helped immigrants become citizens, find jobs (often city jobs), and deal with police and courts. Immigrants became loyal voters.',
        lines: [
          'A fella gets off the boat with no job? I find him one. Sweeping streets, on the docks, on a city work crew.',
          'He wants to be a citizen? We help him fill out his papers. Takes him to the courthouse. Then he can vote. And he remembers who helped him.',
          'His boy gets in trouble with the police? I put in a good word with the judge.',
        ],
        next: 'hub',
      },
      tweed: {
        mood: 'down',
        lines: [
          'Tweed was a thief, plain and simple. Took money right out of the city treasury. That\'s dishonest graft. Stupid, too.',
          'Me, I believe in honest graft. Say I hear the city\'s going to build a new park. I buy the land first, cheap. Then the city buys it from me, for a good price.',
          'I seen my opportunities, and I took \'em! Ha ha!',
        ],
        next: 'hub',
      },
      quinn: {
        lines: [
          'Quinn! Good man. Runs a Tammany club down on the Lower East Side.',
          'A sack of coal in December. A vote in November. Everybody wins!',
        ],
        next: 'hub',
      },
      buying: {
        mood: 'up',
        lines: [
          'Buying? Ha! It\'s friendship, young fella. Where\'s the government when a family is cold? Where are the reformers? They come once, make a speech, and go home.',
          'Tammany is there every day. Ask the families we helped last winter whether Tammany is bad.',
          { who: 'narrator', text: 'You write in your notebook: the machine helped people who needed it. But it also stole public money and expected votes in return.' },
        ],
        next: 'hub',
      },
      bye: { lines: ['Come back anytime! And tell your readers: Tammany takes care of its own!'], end: true },
    },
  },

  foreman: {
    speaker: 'foreman',
    nodes: {
      start: {
        lines: ['Watch your head! Bricks coming up! You can\'t stand here without a reason, friend.'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'What are you building?', next: 'what' },
          { text: 'Why build so tall?', next: 'tall' },
          { text: 'How can a building go so high?', next: 'how' },
          { text: 'Who works on this building?', next: 'who' },
          { text: 'I\'ll get out of the way.', next: 'bye' },
        ],
      },
      what: {
        lines: [
          'The new Times Building! Thirteen stories. And here is the trick: we build it right around the old building, while the presses keep printing inside!',
          'A few years ago, five stories was tall. Look at the Tribune tower over there: two hundred and sixty feet!',
        ],
        next: 'hub',
      },
      tall: {
        set: ['learned_skyscraper'],
        note: 'URBANIZATION: Land in cities was very expensive, so builders built up. New technology like safe elevators and steel or iron frames made tall buildings, later called skyscrapers, possible.',
        lines: [
          'Land on this island costs a fortune! You can\'t build out, so you build up.',
          'More floors, more offices, more rent. Simple.',
        ],
        next: 'hub',
      },
      how: {
        lines: [
          'Two inventions. First, the safe elevator. Mr. Otis made one that won\'t fall if the rope breaks. Who wants to climb ten floors of stairs?',
          'Second, the frame. In Chicago, they put up the Home Insurance Building in 1885 with a metal skeleton inside. The frame holds up the building, not the walls.',
          'People are starting to call them "sky-scrapers." Ha! Scraping the sky!',
        ],
        next: 'hub',
      },
      who: {
        lines: [
          'Irish, Italians, Swedes, Germans, me from Norway. Immigrants built this city, brick by brick.',
          'Dangerous work. A man falls, he\'s done. No pay for an injured man, either.',
        ],
        next: 'hub',
      },
      bye: { lines: ['Mind the mud!'], end: true },
    },
  },

  driver: {
    speaker: 'driver',
    nodes: {
      start: {
        lines: ['Horsecar up Broadway! Five cents! Step lively!'],
        choices: [
          { text: 'How does the horsecar work?', next: 'how' },
          { text: 'Any problems with horses?', next: 'horses' },
          { text: 'Will something replace the horses?', next: 'future' },
        ],
      },
      how: {
        set: ['learned_transit'],
        note: 'MASS TRANSIT: Horse-drawn streetcars, elevated trains, cable cars, and soon electric trolleys let people live farther from where they worked. Cities spread out.',
        lines: [
          'Horses pull the car on iron rails. Smoother than a carriage, and cheaper than a cab.',
          'A clerk can live uptown and ride downtown to work. Twenty years ago, he\'d have to live next to his office.',
        ],
        next: 'start',
      },
      horses: {
        lines: [
          'Problems? Ha! There\'s over a hundred thousand horses in this city, and every one of \'em makes... well. You can smell it.',
          'Tons of manure every day, right in the street. And a tired horse drops dead, it just lies there till the wagon comes.',
        ],
        next: 'start',
      },
      future: {
        lines: [
          'Cable cars, maybe! A steel cable under the street pulls the car. There\'s a line on Tenth Avenue since 1885. Out in San Francisco, they climb the hills!',
          'And I hear Richmond, Virginia just started electric trolleys this year. Electric! No horses at all! Then what\'ll I do?',
        ],
        end: true,
      },
    },
  },

  elguard: {
    speaker: 'elguard',
    nodes: {
      start: {
        set: ['learned_el'],
        note: 'ELEVATED TRAINS: "The El" ran steam trains on iron tracks above the street. It was fast, but it dropped cinders and oil on the people below and blocked sunlight.',
        lines: [
          'Third Avenue El! Uptown trains! Steam engines on an iron road, right above the street!',
          'For Central Park? Ride to Fifty-Ninth Street and walk west. Or take the Sixth Avenue El, right to the Park\'s corner! Five cents!',
        ],
        choices: [
          { text: 'What\'s it like to live under the El?', next: 'under' },
          { text: 'Ride uptown to Central Park.', next: 'ride' },
          { text: 'Not yet.', next: 'bye' },
        ],
      },
      under: {
        lines: [
          'Noisy! Cinders and hot oil drip on your hat. Your windows go dark, and the whole building shakes every few minutes.',
          'Progress, they call it.',
        ],
        end: true,
      },
      ride: {
        lines: ['All aboard! Hold onto your hat!'],
        action: 'ridePark',
        end: true,
      },
      bye: { lines: ['Suit yourself!'], end: true },
    },
  },

  hodcarrier: {
    speaker: 'hodcarrier',
    nodes: {
      start: {
        set: ['met_hodcarrier'],
        note: 'BUILDERS: Immigrant laborers carried bricks and set iron high above the street with no ropes or nets, for about a dollar and a half a day.',
        lines: [
          'Hey, camera man! You want a picture? Take it quick. The foreman docks my pay if I stand still.',
          'I carry bricks up the ladders, eleven stories, all day. No rope. No net. A dollar and a half.',
          'Last month a man fell from the ninth floor. The next morning, another man had his job.',
        ],
        end: true,
      },
    },
  },

  elevator: {
    speaker: 'elevator',
    nodes: {
      start: {
        lines: [
          'Going up! Mr. Otis\'s safety elevator, sir. If the rope breaks, the brakes catch us. Probably.',
          'Eleven floors in under a minute. Nobody would rent an office up there if they had to climb.',
        ],
        end: true,
      },
    },
  },

  keeper: {
    speaker: 'keeper',
    nodes: {
      start: {
        lines: ['Welcome to Central Park! Kindly stay on the paths.'],
        next: 'hub',
      },
      hub: {
        lines: [],
        choices: [
          { text: 'Who made this park?', next: 'who', key: true },
          { text: 'Who comes here?', next: 'visitors' },
          { text: 'Why can\'t people walk on the grass?', next: 'rules' },
          { text: 'Thank you.', next: 'bye' },
        ],
      },
      who: {
        set: ['learned_park'],
        note: 'CENTRAL PARK: Designed by Frederick Law Olmsted and Calvert Vaux, it opened in sections starting in 1858. Planners hoped green space would help crowded city people stay healthy.',
        lines: [
          'Mr. Frederick Law Olmsted and Mr. Calvert Vaux designed it. They started back in 1858. Took twenty years.',
          'Mr. Olmsted said a city needs lungs. A place where rich and poor alike can breathe fresh air.',
        ],
        next: 'hub',
      },
      visitors: {
        set: ['learned_park_access'],
        note: 'WHO USES THE PARK? The park was far from the crowded tenements downtown. Many working families could only visit on Sundays, if they could afford the fare.',
        lines: [
          'Weekdays, mostly the carriages of the rich, out for a drive.',
          'Sundays, the working families come up from downtown. If they can spare the fare, and the time. Most work six days a week, you see.',
        ],
        next: 'hub',
      },
      rules: {
        lines: [
          'Keep off the grass! It\'s for looking at. No ball games without a permit. No picnics on the lawn.',
          'Some say the rules are made for the rich, so the park stays "proper." I just enforce them.',
        ],
        next: 'hub',
      },
      bye: { lines: ['Enjoy the park. On the path, mind you!'], end: true },
    },
  },

  chanapark: {
    speaker: 'chana',
    nodes: {
      start: {
        mood: 'up',
        lines: [
          'Photographer! Yes, it\'s us. Sunday is the only day we don\'t sew.',
          'Five cents each way, for each of us. So we come once a summer. But look how Sarah runs!',
        ],
        end: true,
      },
    },
  },

  girlpark: {
    speaker: 'girl',
    nodes: {
      start: {
        lines: [
          'The grass is so green! We never see grass on Hester Street.',
          'But the sign says we can\'t walk on it. Why make grass if you can\'t touch it?',
        ],
        end: true,
      },
    },
  },

  // ==========================================================================
  // DAY 2 · IV. ONE WEEK LATER: HESTER STREET (Monday, November 5, 1888)
  // ==========================================================================
  rivka2: {
    speaker: 'rivka',
    nodes: {
      start: {
        branch: [
          { if: 'rivka_decided', next: 'after' },
          { if: 'photo_rivka', ifNot: 'gave_print', next: 'print' },
          { next: 'shop' },
        ],
      },
      print: {
        set: ['gave_print'],
        lines: [
          'Photographer! I hoped you would come.',
          { who: 'narrator', text: 'You hand Rivka the print you made on the ship. She stares at it for a long time.' },
          'That is us. That is really us. Shmuel, Mama, me.',
          'Bubbe will hold this in her hands. She will see we are alive.',
          { who: 'narrator', text: 'She wipes her eyes with the back of her wrist and laughs at herself.' },
        ],
        next: 'shop',
      },
      shop: {
        lines: [
          'I work for Mr. Kessler now. Sleeves and buttonholes, eleven hours a day.',
          'Two weeks, and he has not paid us. "Next Friday," he says. Every Friday is next Friday.',
        ],
        next: 'debt',
      },
      debt: {
        mood: 'down',
        branch: [{ if: 'swindled', next: 'owe' }, { if: 'shortchanged', next: 'owe' }, { next: 'card' }],
      },
      owe: {
        mood: 'down',
        lines: ['And we still owe the Kiever Society for the money that was stolen from us at Castle Garden. Every week, a little.'],
        next: 'card',
      },
      card: {
        lines: [
          'Esther, the girl on the box, says if we all sign the union card, Kessler must pay. Or we stop work, all together.',
          'But if he finds out I signed, he throws me out. And Mama and Shmuel eat what I earn.',
          'You have seen more of America than me. What should I do?',
        ],
        choices: [
          { text: 'Sign it. Stand together with the others.', next: 'sign', key: true },
          { text: 'Wait. It\'s too dangerous right now.', next: 'wait', key: true },
        ],
      },
      sign: {
        mood: 'up',
        set: ['rivka_union', 'rivka_decided'],
        lines: [
          'Yes. Yes! Papa used to say: one finger is easy to break. A fist is not.',
          { who: 'narrator', text: 'She signs in careful Yiddish letters, and then again in English: Rivka Abramowitz.' },
        ],
        next: 'vote',
      },
      wait: {
        mood: 'down',
        set: ['rivka_wait', 'rivka_decided'],
        lines: [
          'Maybe you are right. Maybe next season, when we have something saved.',
          { who: 'narrator', text: 'She folds the union card very small and slips it into her shoe.' },
        ],
        next: 'vote',
      },
      vote: {
        lines: [
          'Tomorrow is the election. Everyone on the street is shouting about it.',
          'I cannot vote. Women cannot vote. Not Mama, not Mrs. Brennan, not anyone.',
          'But I can shout. Maybe louder than the men.',
        ],
        end: true,
      },
      after: {
        branch: [{ if: 'rivka_union', next: 'after_sign' }, { next: 'after_wait' }],
      },
      after_sign: { lines: ['If Kessler finds out, he finds out. I am not afraid. ...I am a little afraid.'], end: true },
      after_wait: { lines: ['The card is in my shoe. I can feel it when I walk.'], end: true },
    },
  },

  esther: {
    speaker: 'esther',
    nodes: {
      start: {
        set: ['met_esther'],
        keep: 'unioncard',
        note: 'UNIONS: The United Hebrew Trades was founded in New York in 1888 to organize Jewish workers in the garment shops, bakeries, and print shops.',
        lines: [
          'Sisters! Brothers! Fourteen hours for three dollars a week! They tell us there is no money. There is money!',
          'The United Hebrew Trades started just last month. Cloakmakers, bakers, typesetters.',
          'Alone, they cheat us one by one. Together, they cannot!',
        ],
        choices: [
          { text: 'Aren\'t you afraid?', next: 'afraid' },
          { text: 'What happens if the workers strike?', next: 'strike' },
        ],
      },
      afraid: {
        mood: 'down',
        lines: [
          'Of course. The police broke up our meeting on Thursday.',
          'But I am more afraid of my mother\'s hands. Thirty years of sewing. They don\'t open anymore.',
        ],
        end: true,
      },
      strike: {
        mood: 'up',
        lines: [
          'We all stop work, on the same day. No coats, no money for the boss.',
          'He can fire one girl. He cannot fire twenty. Not in November, with orders waiting.',
        ],
        end: true,
      },
    },
  },

  kessler2: {
    speaker: 'kessler',
    nodes: {
      start: {
        mood: 'down',
        set: ['met_kessler2'],
        lines: [
          'You again, with the camera. You want to put me in your newspaper too?',
          'Union, union. You know what the manufacturer told me? Cut prices ten percent, or he gives the contract to the next man.',
          'So I hold the pay a little. I pay it! Eventually.',
          'I came over in \'72 with nothing. I sewed in a room like theirs for nine years. Now I am the boss, and everyone hates me.',
          'This is America, mister. Somebody squeezes you, you squeeze somebody.',
        ],
        end: true,
      },
    },
  },

  moishe2: {
    speaker: 'moishe',
    nodes: {
      start: {
        branch: [
          { if: 'met_moishe2', next: 'vote' },
          { if: 'printed_sarah', next: 'printed' },
          { next: 'kept' },
        ],
      },
      printed: {
        set: ['met_moishe2'],
        lines: [
          'So. You came back.',
          'Your picture was in every hand on Hester Street. My Sarah\'s face, at the machine.',
          'The next morning, Mr. Kessler came up those stairs and took the coats away. All of them. "Troublemakers," he said.',
          { who: 'narrator', text: 'The sewing machine is silent. Chana is washing other people\'s laundry in a tub.' },
          'But. A lady from the Neighborhood Guild came, with your newspaper in her hand.',
          'Now Sarah goes to their class after school, instead of sewing buttons. She is learning to read English.',
          'So I don\'t know if I should thank you, or throw you down the stairs.',
        ],
        next: 'letter',
      },
      kept: {
        set: ['met_moishe2'],
        lines: [
          'You kept your word. Thank you.',
          'We still have Kessler\'s coats. Fourteen hours a day.',
          'Sarah still sews buttons. Nothing is worse. Nothing is better, either.',
        ],
        next: 'letter',
      },
      letter: {
        mood: 'up',
        branch: [{ ifNot: 'paid_telegram', next: 'novak' }, { next: 'vote' }],
      },
      novak: {
        set: ['read_novak_letter'],
        keep: 'novak_letter',
        lines: ['Oh! A letter came for you. Here, at our address. It has a steamship company stamp.'],
        doc: 'novak_letter',
        next: 'vote',
      },
      vote: {
        set: ['heard_moishe_vote'],
        lines: [
          'And tomorrow, I vote! Me!',
          'Mr. Quinn took me to the courthouse last month. I came in \'82, six years, so it is legal. Twenty minutes, and I am a citizen, with papers.',
          'Quinn says, vote Grant. Mr. Whitcomb from the Guild says, vote Hewitt. Grant\'s people bring coal. Hewitt\'s people bring speeches.',
          'In Russia, the Tsar told me where I could live. Tomorrow, I help choose the mayor of New York. Can you believe it?',
        ],
        end: true,
      },
    },
  },

  mama2: {
    speaker: 'mama',
    nodes: {
      start: {
        lines: [
          'Rivka works so hard. I take in washing. And Shmuel goes to the public school!',
          'He learns English faster than all of us. He corrects my English now. Like a little professor.',
        ],
        end: true,
      },
    },
  },

  shmuel2: {
    speaker: 'shmuel',
    nodes: {
      start: {
        set: ['met_shmuel2'],
        branch: [{ if: 'paid_telegram', next: 'happy' }, { next: 'sad' }],
      },
      happy: {
        mood: 'up',
        lines: ['Mr. Novak finished my horse! I tried to make it swim in the washtub. It sinks. But it\'s a very good horse.'],
        end: true,
      },
      sad: {
        mood: 'down',
        lines: [
          'Mr. Novak gave Mama this horse for me. Then they put him back on the ship.',
          'Why did they send him back? He was nice. He wasn\'t a "public charge." He was Mr. Novak.',
        ],
        end: true,
      },
    },
  },

  boss2: {
    speaker: 'boss',
    nodes: {
      start: {
        mood: 'up',
        set: ['heard_quinn2'],
        note: 'THE 1888 ELECTION: Tammany Hall backed Hugh J. Grant, the son of Irish immigrants. Its clubs gave out coal and jobs and expected votes in return.',
        lines: [
          'Friends! Neighbors! Who brought coal when the blizzard came in March?',
          'Who found your cousin a job? Who stood next to your boy in front of the judge?',
          'Tomorrow, vote for Hugh J. Grant! The son of Irish immigrants! One of US!',
        ],
        choices: [
          { text: 'What about Mayor Hewitt?', next: 'hewitt' },
          { text: 'What do you get out of all this?', next: 'what' },
          { text: '(Walk away.)', next: 'bye' },
        ],
      },
      hewitt: {
        mood: 'down',
        lines: [
          'Hewitt! He wouldn\'t even review the St. Patrick\'s Day parade! Wouldn\'t fly the green flag over City Hall!',
          'He thinks we\'re dirt. He\'ll build parks for the rich and send inspectors to close your shops.',
        ],
        next: 'start2',
      },
      what: {
        lines: ['Me? Ha! A city job here, a contract there. Everybody eats, friend. That\'s politics.'],
        next: 'start2',
      },
      start2: { lines: ['Coal! Who needs coal? Grant\'s coal, free for the asking!'], end: true },
      bye: { lines: ['Remember, friend! Tuesday! Grant!'], end: true },
    },
  },

  brennan2: {
    speaker: 'brennan',
    nodes: {
      start: {
        mood: 'down',
        set: ['heard_brennan2'],
        lines: [
          'Tomorrow my Michael will be first in line at the polls. Women can\'t vote, more\'s the pity.',
          'In March, Mayor Hewitt wouldn\'t review our parade on St. Patrick\'s Day. Wouldn\'t fly the green flag over City Hall.',
          'As if we Irish hadn\'t built half this city with our backs.',
          'Hugh Grant\'s father came over on the boats, like mine. That\'s Michael\'s vote.',
        ],
        end: true,
      },
    },
  },

  guild2: {
    speaker: 'guild',
    nodes: {
      start: {
        set: ['heard_whitcomb2'],
        keep: 'leaflet',
        note: 'REFORM: Mayor Abram Hewitt ran an honest government and pushed for small parks and a public subway, but many immigrants felt he looked down on them.',
        lines: [
          'Leaflet? Vote for Mayor Hewitt! An honest man. Not one dollar stolen from the city.',
          'He passed the law for small parks in crowded neighborhoods, like this one. He wants a public railway under the streets.',
          'Tammany buys your vote with a sack of coal, then steals the coal money back from the city ten times over.',
        ],
        choices: [
          { text: 'People here say Hewitt looks down on them.', next: 'down' },
          { text: 'Thank you.', next: 'bye' },
        ],
      },
      down: {
        lines: [
          '...He has said foolish things about the Irish. I admit that.',
          'But a mayor who insults you honestly is better than one who robs you kindly. Isn\'t he?',
        ],
        end: true,
      },
      bye: { lines: ['Tuesday! Vote for honest government!'], end: true },
    },
  },

  lee2: {
    speaker: 'lee',
    nodes: {
      start: {
        mood: 'down',
        set: ['heard_lee2'],
        lines: [
          'All of Mott Street talks about the election. Grant, Hewitt, Erhardt.',
          'You want to know who I vote for?',
          'The law says I will never vote. Not tomorrow. Not ever. I pay my taxes. I cannot choose.',
          'And last month Congress passed the Scott Act. Now, if a Chinese worker goes home to visit his family, he can never come back.',
          'My brother was saving to visit our mother. Now he will not go. He will not see her again.',
        ],
        end: true,
      },
    },
  },

  giuseppe3: {
    speaker: 'giuseppe',
    nodes: {
      start: {
        mood: 'up',
        set: ['met_gius3'],
        lines: [
          'Photographer! Look at me! Mr. Quinn found me work, on the new Times Building!',
          'Eleven stories! I carry bricks up, up, up, all day. A dollar and a half, and no padrone taking his cut!',
          'Quinn says I don\'t owe him anything. ...Except one little favor tomorrow. I tell you later.',
          'Come see me on Park Row!',
        ],
        end: true,
      },
    },
  },

  newsboy2: {
    speaker: 'newsboy',
    nodes: {
      start: {
        lines: ['Extra, extra! Election tomorrow! Grant! Hewitt! Erhardt! Who\'ll be mayor? Read all about it, two cents!'],
        end: true,
      },
    },
  },

  // ==========================================================================
  // DAY 2 · V. PARK ROW (Monday afternoon)
  // ==========================================================================
  giuseppe4: {
    speaker: 'giuseppe',
    nodes: {
      start: {
        branch: [{ if: 'gius_decided', next: 'after' }, { next: 'ask' }],
      },
      ask: {
        mood: 'down',
        lines: [
          'You came! Look up. Eleven stories. Tonight my back will say hello to me.',
          'Now. The favor. Mr. Quinn says tomorrow, I go to the polls and I say, "My name is Patrick Moran."',
          'Patrick Moran died in August. But he is still on the voting list.',
          'I am not a citizen. I cannot vote. But Quinn says, "Everybody does it. Do it, or the job goes to a fellow who will."',
          'What do I do, photographer? No job, no money for Mamma.',
        ],
        choices: [
          { text: 'Refuse. It\'s against the law, and it\'s wrong.', next: 'refuse', key: true },
          { text: 'Do it. Your mother needs the money.', next: 'repeat', key: true },
          { text: 'Tell a reporter. Mr. Haskins could expose Quinn.', next: 'expose', key: true },
        ],
      },
      refuse: {
        mood: 'up',
        set: ['gius_refuse', 'gius_decided'],
        lines: [
          'You are right. My father always said: a man has his name and nothing else.',
          'I keep my name. I tell Quinn tonight.',
          { who: 'narrator', text: 'He doesn\'t look proud. He looks scared.' },
        ],
        next: 'climb',
      },
      repeat: {
        mood: 'down',
        set: ['gius_repeat', 'gius_decided'],
        lines: [
          'Yes. Yes. One little vote. Who does it hurt?',
          { who: 'narrator', text: 'He laughs. But he doesn\'t look at you.' },
        ],
        next: 'climb',
      },
      expose: {
        mood: 'up',
        set: ['gius_expose', 'gius_decided'],
        lines: [
          'The newspapers? Then everyone knows it was me who talked...',
          '...But maybe they stop it. For everybody. All right. Tell your Mr. Haskins.',
        ],
        next: 'climb',
      },
      climb: {
        mood: 'up',
        lines: ['Now I climb, or the foreman docks me. Go up on the Potter Building roof next door, you can watch me work! Take my picture for Mamma!'],
        action: 'giuseppeClimbs',
        end: true,
      },
      after: { lines: ['Up on the Potter roof! Wave at me!'], end: true },
    },
  },

  giuseppe_roof: {
    speaker: 'giuseppe',
    nodes: {
      start: {
        mood: 'up',
        lines: [
          'Fotografo! Up here! You see? I am higher than the church steeples!',
          'Take my picture! For Mamma! Tell her I am a big man in America now!',
        ],
        action: 'fall',
        end: true,
      },
    },
  },

  fall: {
    speaker: 'narrator',
    nodes: {
      start: {
        set: ['saw_fall'],
        lines: [
          { who: 'narrator', text: 'A board cracks, loud as a gunshot.' },
          { who: 'narrator', text: 'Giuseppe drops through the open floor, bricks and all.' },
          { who: 'narrator', text: 'He lands on the planking one story down. He doesn\'t move.' },
          { who: 'narrator', text: '...Then he does. He is holding his arm and shouting in Italian. Alive.' },
          { who: 'narrator', text: 'The men are lowering him down the ladders. Hurry down to the street.' },
        ],
        end: true,
      },
    },
  },

  aftermath: {
    speaker: 'giuseppe',
    nodes: {
      start: {
        mood: 'down',
        set: ['saw_aftermath'],
        lines: [
          'Photographer... I am alive. The arm is broken. Maybe two ribs.',
          { who: 'foreman', text: 'He can\'t carry a hod with one arm. No work, no pay. That\'s the rule. I don\'t make it.' },
        ],
        next: 'who',
      },
      who: {
        branch: [{ if: 'gius_repeat', next: 'quinn' }, { if: 'gius_expose', next: 'expose' }, { next: 'alone' }],
      },
      quinn: {
        lines: [
          { who: 'boss', text: 'Easy, easy, son! Tammany takes care of its own. I sent for Dr. Malone, and he\'s paid for.' },
          { who: 'boss', text: 'And Halvorsen, the job is his again when the arm heals. Isn\'t that right, Halvorsen?' },
          { who: 'foreman', text: '...If you say so, Mr. Quinn.' },
          'You see? Quinn is a good man. ...Right?',
        ],
        end: true,
      },
      alone: {
        mood: 'down',
        lines: [
          'I told Quinn no, this morning. When I fell, I sent a boy to his club. He sent back a message: "Ask your new friends for help."',
          { who: 'societa', text: 'Coraggio, Giuseppe. The Società pays for the doctor. You paid your ten cents every week. Now we pay you.' },
          'Ten cents a week, and they did not forget me. My own people.',
        ],
        end: true,
      },
      expose: {
        mood: 'down',
        lines: [
          { who: 'oldrep', text: 'I\'ve got it all, son. Repeaters, dead men on the voting lists, Quinn\'s name. It runs in tomorrow\'s paper.' },
          { who: 'societa', text: 'And the Società will pay for the doctor. Coraggio, Giuseppe.' },
          'Tomorrow everyone knows I talked. Quinn will never give me work again.',
          'But maybe no one else gets asked to be a dead man.',
        ],
        end: true,
      },
    },
  },

  editor: {
    speaker: 'editor',
    nodes: {
      start: {
        branch: [{ if: 'endorsed', next: 'done' }, { next: 'ask' }],
      },
      ask: {
        lines: [
          'There you are. I\'ve seen your plates. Good work. Hard work.',
          'Tomorrow, New York picks a mayor. The Courier has to say who it backs, and I want to hear it from someone who has walked those streets.',
          'Here is what each man stands for.',
        ],
        doc: 'candidates',
        next: 'choose',
      },
      choose: {
        lines: ['So. Who does the Evening Courier endorse?'],
        choices: [
          { text: 'Hugh J. Grant (Tammany Hall Democrat)', next: 'grant', key: true },
          { text: 'Mayor Abram Hewitt (reform, Citizens\' ticket)', next: 'hewitt', key: true },
          { text: 'Joel B. Erhardt (Republican)', next: 'erhardt', key: true },
        ],
      },
      grant: {
        set: ['endorse_grant', 'endorsed'],
        lines: ['Tammany\'s man. He\'ll feed the hungry, and the treasury will feed Tammany. Bold. All right, we print it.'],
        next: 'night',
      },
      hewitt: {
        set: ['endorse_hewitt', 'endorsed'],
        lines: ['Honest Abe Hewitt. Clean and careful, and he can\'t stand half the people you photographed. All right, we print it.'],
        next: 'night',
      },
      erhardt: {
        set: ['endorse_erhardt', 'endorsed'],
        lines: ['The Republican. Law and order. Hester Street will laugh at us, but all right, we print it.'],
        next: 'night',
      },
      night: {
        lines: ['Go home and sleep. Tomorrow night, the whole city will be here on Park Row, waiting for the returns. Be here.'],
        action: 'toNight',
        end: true,
      },
      done: { lines: ['Tomorrow night. Park Row. Be here.'], action: 'toNight', end: true },
    },
  },

  // ==========================================================================
  // DAY 2 · VI. ELECTION NIGHT (Tuesday, November 6, 1888)
  // ==========================================================================
  returns: {
    speaker: 'bulletin',
    nodes: {
      start: {
        branch: [{ if: 'saw_results', next: 'again' }, { next: 'r1' }],
      },
      r1: {
        lines: [
          'RETURNS FROM THE FOURTH WARD! Grant, two thousand one hundred! Erhardt, eight hundred! Hewitt, six hundred!',
          { who: 'narrator', text: 'A roar goes up from the Tammany men. Someone throws a hat in the air. It doesn\'t come back.' },
          'SEVENTH WARD! Grant, three thousand! Hewitt, one thousand two hundred! Erhardt, nine hundred!',
          { who: 'narrator', text: 'A man in a silk hat shakes his head and lights a cigar.' },
          'WITH NEARLY ALL DISTRICTS REPORTING: Grant, one hundred fourteen thousand! Erhardt, seventy-three thousand! Hewitt, seventy-two thousand!',
          'HUGH J. GRANT IS THE NEXT MAYOR OF NEW YORK!',
          { who: 'narrator', text: 'The square explodes. Tammany wins. Mayor Hewitt, the honest man, has finished third.' },
        ],
        set: ['saw_results'],
        keep: 'ribbon',
        action: 'results',
        end: true,
      },
      again: { lines: ['GRANT ELECTED! TAMMANY CARRIES THE CITY!'], end: true },
    },
  },

  rivka_night: {
    speaker: 'rivka',
    nodes: {
      start: { set: ['met_rivka_night'], branch: [{ if: 'rivka_union', next: 'union' }, { next: 'wait' }] },
      union: {
        mood: 'up',
        lines: [
          'Kessler found my card on Wednesday. He threw me out in front of everyone.',
          'So on Thursday, the whole shop walked out! All twenty of us! Esther says he will pay us everything by Monday. He has to. The orders are waiting.',
          'I don\'t have a job. But I have nineteen sisters.',
        ],
        next: 'endorse',
      },
      wait: {
        mood: 'down',
        lines: [
          'I still have my job. Kessler paid us half. Half!',
          'Esther says next season every shop on the street will strike together. Next season, I sign.',
        ],
        next: 'endorse',
      },
      endorse: { branch: [{ if: 'endorse_grant', next: 'g' }, { if: 'endorse_hewitt', next: 'h' }, { next: 'e' }] },
      g: { lines: ['Your newspaper backed Grant, and Grant won. I hope he remembers the girls who sew, not only the men who vote.'], next: 'end' },
      h: { lines: ['Your newspaper backed Hewitt. He lost. But you said what you believed. That is something.'], next: 'end' },
      e: { lines: ['Erhardt? Nobody on Hester Street even knows his face! You are a strange photographer.'], next: 'end' },
      end: { lines: ['Someday women will vote too. And I will be first in line. Before Mrs. Brennan.'], end: true },
    },
  },

  giuseppe_night: {
    speaker: 'giuseppe',
    nodes: {
      start: { set: ['met_gius_night'], branch: [{ if: 'gius_repeat', next: 'repeat' }, { if: 'gius_expose', next: 'expose' }, { next: 'refuse' }] },
      repeat: {
        lines: [
          'I did it. I walked in, I said "Patrick Moran," they gave me the ballot. Nobody even looked at my face.',
          'Quinn paid the doctor. I have my job when the arm heals. So why do I feel like I stole something?',
        ],
        next: 'lemon',
      },
      refuse: {
        lines: [
          'No job, a broken arm, and Quinn\'s people look at me like a traitor.',
          'But Patrick Moran can rest in peace. And so can I.',
          'The Società says when the arm heals, there is work on the docks in Brooklyn. We will see.',
        ],
        next: 'lemon',
      },
      expose: {
        lines: [
          'Haskins\'s story is in this morning\'s Courier! Two of Quinn\'s repeaters were arrested at the polls today!',
          'Quinn\'s men spat on my shoes. But this year, nobody voted as Patrick Moran.',
        ],
        next: 'lemon',
      },
      lemon: { branch: [{ if: 'lemon', next: 'l' }, { next: 'bye' }] },
      l: { lines: ['You still carry my mother\'s lemon? ...Ha! It smells like nothing now. Keep it anyway.'], end: true },
      bye: { lines: ['Go, go. Write your story. Make me look rich.'], end: true },
    },
  },

  moishe_night: {
    speaker: 'moishe',
    nodes: {
      start: {
        set: ['met_moishe_night'],
        lines: [
          'I voted! Me! Moishe Abramowitz, tailor, from a town the Tsar didn\'t want me in.',
          'I put a paper in a box, and they counted it. Like I count.',
          'Who did I pick? I won\'t tell you. A citizen has secrets now!',
        ],
        next: 'sarah',
      },
      sarah: { branch: [{ if: 'printed_sarah', next: 'p' }, { next: 'n' }] },
      p: { lines: ['And Sarah... the Guild teacher says she reads better than the big boys. Maybe your picture was worth it. Maybe.'], end: true },
      n: { lines: ['Sarah sewed four hundred buttons this week. She is asleep on her mother\'s shoulder.'], end: true },
    },
  },

  novak_night: {
    speaker: 'novak',
    nodes: {
      start: {
        set: ['met_novak_night'],
        keep: 'bird',
        lines: [
          'PHOTOGRAPHER! Here! Over here!',
          { who: 'narrator', text: 'Mr. Novak is holding the arm of a tall man with a red mustache, who is holding him back from the crowd.' },
          'This is Tomas! My son! He came on the train from Chicago, two days and two nights!',
          { who: 'tomas', text: 'They told me a stranger paid for the telegram. Twenty-five cents. ...Thank you. I would never have known.' },
          'Tomorrow, we go to Chicago. Tonight, I wanted to see an American election.',
          'So loud! Everybody shouts and nobody gets shot!',
        ],
        end: true,
      },
    },
  },

  brennan_night: {
    speaker: 'brennan',
    nodes: {
      start: { set: ['met_brennan_night'], lines: ['Grant won! Michael\'s dancing on a table in Clancy\'s saloon. One of our own, mayor of New York!'], next: 'e' },
      e: { branch: [{ if: 'endorse_grant', next: 'yes' }, { next: 'no' }] },
      yes: { lines: ['And your paper backed him. Maybe you\'re not so bad, for a newspaperman.'], end: true },
      no: { lines: ['Your paper backed the other fellow. Well. You\'ll learn.'], end: true },
    },
  },

  whitcomb_night: {
    speaker: 'guild',
    nodes: {
      start: {
        set: ['met_whitcomb_night'],
        lines: [
          'Third. The honest man came third.',
          'Maybe we reformers talk too much and listen too little. Hester Street got coal from Tammany. From us, it got leaflets.',
        ],
        end: true,
      },
    },
  },

  quinn_night: {
    speaker: 'boss',
    nodes: {
      start: { set: ['met_quinn_night'], lines: ['Every ward! Every single one! Tell your readers: Tammany takes care of its own!'], next: 'x' },
      x: { branch: [{ if: 'gius_expose', next: 'angry' }, { if: 'endorse_grant', next: 'friend' }, { next: 'bye' }] },
      angry: {
        mood: 'down',
        lines: [
          'And YOU. You and your Mr. Haskins cost me two good men today.',
          '...I won\'t forget it, photographer. Tammany has a long memory.',
        ],
        end: true,
      },
      friend: { lines: ['And your paper backed the winner! Drop by the club. There\'s always a cigar for a friend.'], end: true },
      bye: { lines: ['Now if you\'ll excuse me, there\'s a parade to lead!'], end: true },
    },
  },
};

// ============================================================================
// DOCUMENTS (posters, letters, newspapers, signs). Voiced by the narrator.
// VO id: doc.<key>   Art: assets/art/doc_<key>.png (optional)
// ============================================================================
export const DOCS = {
  novak_letter: {
    title: 'A Letter From Mr. Novak',
    text: 'Dear photographer,\n\nI write this on the steamship. Tomorrow they send me back to Hamburg. No word came from Tomas. Maybe he moved. Maybe the clerk never sent my message.\n\nDo not be sad for me. I saw America for two days. It was very loud.\n\nI left the little horse with Mrs. Abramowitz, for Shmuel. Tell him it can swim.\n\nYour friend,\nAnton Novak',
    source: 'Fictional letter. Thousands of immigrants a year were turned away and sent back at the steamship company\'s cost.',
  },
  candidates: {
    title: 'The Candidates for Mayor, 1888',
    text: 'HUGH J. GRANT · Tammany Hall Democrat\nAge 30, the son of Irish immigrants. Tammany\'s clubs give out coal, jobs, and help with citizenship papers. Critics say Tammany steals from the city and buys votes.\n\nABRAM S. HEWITT · Mayor, running for re-election (Citizens\' ticket)\nA wealthy, honest businessman. Pushed for small parks in crowded neighborhoods and a public subway. In March he refused to review the St. Patrick\'s Day parade, and many Irish and immigrant voters turned against him.\n\nJOEL B. ERHARDT · Republican\nA lawyer and former city police commissioner. Promises honest, businesslike government and strict law enforcement. Has little support on the Lower East Side.',
    source: 'Based on the real 1888 New York City mayoral election.',
  },
  letter: {
    title: 'A Letter from Cousin Moishe',
    text: 'Dear Cousin Rivka,\n\nI am well, thank God. I live on Hester Street, New York, in two rooms with Chana and little Sarah. I sew coats. The work is hard, six days a week, but the pay is in dollars, and nobody burns your house.\n\nI am sending money for three tickets. Bring Mama and Shmuel. When you come to Castle Garden, show them this address. Trust nobody outside the gate.\n\nYour cousin,\nMoishe',
    source: 'Fictional letter based on real immigrant letters of the 1880s.',
  },
  poster: {
    title: 'Steamship Poster',
    text: 'TO AMERICA!\nFAST STEAMSHIPS TO NEW YORK\nSafe. Quick. Only 10 to 14 days.\nSTEERAGE AT LOW FARES\nWork for all! Land for all!\nAsk our agent in your town.',
    source: 'Fictional poster based on real steamship advertisements.',
  },
  bunks: {
    title: 'The Bunks',
    text: 'Two-high wooden bunks fill the hold. Each has a straw mattress and a thin blanket. Suitcases and bundles are stuffed underneath. There is barely room to turn over.\n\nSome passengers lie in their bunks all day, seasick. The air smells of sweat, salt, and coal smoke.',
  },
  food: {
    title: 'Supper',
    text: 'A big tin bucket of watery stew and a basket of hard black bread. A sailor bangs a spoon on the bucket: supper.\n\nPassengers line up with their own tin cups and plates. A child looks into the bucket and starts to cry.',
  },
  exchange: {
    title: 'Official Money Exchange',
    text: 'CASTLE GARDEN\nLICENSED MONEY EXCHANGE\nFair rates posted daily.\nRubles. Lire. Marks. Pounds.\nDo not change money with strangers outside the gate!',
  },
  newspaper: {
    title: 'A Newspaper on the Bench',
    text: 'CHINESE STILL SHUT OUT\n\nThe Chinese Exclusion Act, passed by Congress in 1882, still bans Chinese laborers from entering the United States. Chinese people who are already here may not become citizens.\n\nIt is the first time the United States has shut out an entire group by nationality. Now Congress debates a new, stricter law: Chinese workers who visit their families in China would not be allowed back in.',
    source: 'Fictional article based on 1888 news about the Chinese Exclusion Act and the Scott Act.',
  },
  statue: {
    title: 'The Statue in the Harbor',
    text: 'Across the water, on Bedloe\'s Island, stands the Statue of Liberty, a gift from the people of France. It was dedicated in 1886, just two years ago.\n\nIts copper skin is still reddish brown. Over the next twenty years, the weather will slowly turn it green. Its full name is "Liberty Enlightening the World," and at night its torch works as a lighthouse.',
  },
  handbill: {
    title: 'A Handbill on the Wall',
    text: 'AMERICANS, WAKE UP!\n\nShips bring thousands of foreigners every week! They crowd our cities, take our jobs, and work for starvation wages. They do not speak our language or share our ways.\n\nSupport laws to keep them out! America for Americans!',
    source: 'Fictional handbill based on real nativist literature of the 1880s.',
  },
  society: {
    title: 'Notice Board: The Kiever Society',
    text: 'KIEVER SOCIETY: For Members From Kiev and Nearby\n\nMonthly dues: 25 cents.\nSick pay: $3 per week.\nLoans to newcomers.\nBurial in the society cemetery.\nMeeting every Sunday, 2 o\'clock.\n\n(Notice written in Yiddish. You copy it into English.)',
    source: 'Fictional notice based on real landsmanshaft records.',
  },
  guildsign: {
    title: 'The Neighborhood Guild',
    text: 'THE NEIGHBORHOOD GUILD\nFounded 1886\n\nBoys\' and Girls\' Clubs. Reading Room. Kindergarten. Classes in English. Lectures. Music.\nAll neighbors welcome.',
  },
  privy: {
    title: 'The Privy',
    text: 'A wooden shed at the back of the yard: the privy. It serves every family in the building, more than a hundred people.\n\nNext to it, laundry flaps on lines strung between buildings. Children play beside the garbage barrels.',
  },
  nast: {
    title: '"Who Stole the People\'s Money?"',
    text: 'A cartoon by Thomas Nast, Harper\'s Weekly, August 19, 1871.\n\nBoss Tweed and his friends stand in a circle. Each one points to the man next to him. The caption: "Who stole the people\'s money? Do tell. \'Twas him."\n\nNast\'s cartoons helped turn New Yorkers against the Tweed Ring.',
    source: 'Real cartoon (public domain). Your teacher may show you the original.',
  },
  courthouse: {
    title: 'The "Tweed Courthouse"',
    text: 'The New York County Courthouse stands behind City Hall. It took about twenty years to build and cost the city around 13 million dollars, more than the United States paid for Alaska.\n\nMuch of that money went into the pockets of the Tweed Ring, through fake and padded bills.',
  },
  graft: {
    title: 'What This Building Cost',
    text: 'In July 1871 The New York Times printed copies of the county\'s secret account books. They showed what friends of the Tweed Ring charged the city for this courthouse:\n\n• Andrew J. Garvey, a plasterer: $133,187 for two days of work.\n• A carpenter: $360,751 for one month, in a building with very little woodwork.\n• Three tables and forty chairs: $179,729.\n\nThe contractors padded every bill, kept part of the extra, and paid the rest back to the Ring. Using public office to get rich like this is called graft.\n\nTweed was convicted in 1873 and died in the Ludlow Street Jail in 1878. Tammany Hall survived him.',
    source: 'Figures as printed in 1871 and cited by historians of the Tweed Ring.',
  },
  bridge: {
    title: 'The Brooklyn Bridge',
    text: 'Opened in 1883, the Brooklyn Bridge was the longest suspension bridge in the world. Its stone towers rise above every building in the city.\n\nIt connects New York to Brooklyn, which is still a separate city. Many of the workers who built it were immigrants. Some died building it.',
  },
  banner: {
    title: 'An Election Banner',
    text: 'FOR MAYOR\nHUGH J. GRANT\nRegular Democratic Nominee · Tammany Hall\n\nElection Day: Tuesday, November 6, 1888.\n\nThree men are running for mayor. Tammany Hall\'s clubs in every neighborhood are working to get out the vote for Grant.',
    source: 'Based on the real 1888 New York mayoral election, which Hugh J. Grant won.',
  },
  club: {
    title: 'Notice Board in the Democratic Club',
    text: 'TAMMANY HALL · DISTRICT CLUB\n\nMen wanted for the city street crews. See Mr. Quinn.\nHelp with citizenship papers, Thursday evenings.\nFree coal for families in need.\nGrand picnic and boat ride for the children, tickets free.\n\nVOTE THE STRAIGHT TICKET, NOVEMBER 6.',
    source: 'Fictional notice based on real services of Tammany district clubs.',
  },
  rooftop: {
    title: 'The View From the Roof',
    text: 'Eleven stories up, the whole city spreads out below. To the east, the towers of the Brooklyn Bridge. To the south, the harbor and the masts of ships. Only church steeples and a few new office buildings stand taller than you.\n\nNext door, men are building the new Times Building even higher.',
  },
  parkrules: {
    title: 'Park Rules',
    text: 'CENTRAL PARK: NOTICE\n\nKEEP OFF THE GRASS.\nNo ball playing without permit.\nNo picnics upon the lawns.\nNo peddling.\nCarriages to keep to the drives.\n\nBy order of the Park Commissioners.',
    source: 'Based on real 19th-century Central Park rules.',
  },
};

// ============================================================================
// TITLE CARDS between zones. Voiced by the narrator. VO id: card.<key>
// ============================================================================
export const CARDS = {
  les2: {
    num: 'DAY TWO · IV',
    title: 'One Week Later',
    sub: 'Hester Street · Monday, November 5, 1888',
    text: 'A week has passed. Tomorrow, New York elects a mayor, and the Lower East Side is loud with it.\n\nGo back to Hester Street. Find out what happened to Rivka\'s family, and what your choices have done.',
  },
  night: {
    num: 'VI',
    title: 'Election Night',
    sub: 'Printing House Square · Tuesday, November 6, 1888',
    text: 'The polls have closed. Thousands of New Yorkers pack Park Row, waiting for the returns to be posted outside the newspaper offices.\n\nFind your friends in the crowd. Watch the results come in.',
  },
  intro: {
    num: 'THE ASSIGNMENT',
    title: 'A Letter From Your Editor',
    sub: 'The New York Evening Courier, October 1888',
    text: 'To our photographer:\n\nThousands of newcomers arrive in New York every week. Our readers want to know: who are these people? Why do they come? And is America really a land of opportunity for them?\n\nI have bought you a steerage ticket on a steamship from Europe. Travel with them. Listen to them. Photograph everything.\n\nBring me the true story.\n\nYour Editor',
  },
  ship: {
    num: 'I',
    title: 'The Crossing',
    sub: 'Steerage, somewhere on the Atlantic',
    text: 'Day 12 at sea. Below deck, hundreds of passengers crowd into the hold.\n\nTalk to the passengers. Find out what pushed them to leave home, and what pulled them to America. Use your camera to collect evidence.',
  },
  castle: {
    num: 'II',
    title: 'Castle Garden',
    sub: 'The Battery, New York Harbor',
    text: 'The ship has landed. Before America, there is Castle Garden: an old fort that became New York\'s immigrant station. Since 1855, more than eight million people have passed through its doors.\n\nFollow Rivka\'s family through inspection. Find out who gets in, and who does not.',
  },
  les: {
    num: 'III',
    title: 'The Lower East Side',
    sub: 'Hester Street, New York',
    text: 'Rivka\'s family has reached Hester Street, one of the most crowded neighborhoods on Earth.\n\nFind Cousin Moishe\'s tenement. See how newcomers live, work, and help each other. Photograph what you find.',
  },
  city: {
    num: 'V',
    title: 'Park Row',
    sub: 'Newspaper Row · Monday afternoon, November 5',
    text: 'Election eve. Banners hang across Broadway, and the newspapers on Park Row are racing to print.\n\nGiuseppe is waiting at the Times Building. Your editor wants to see you at the Courier office before tonight\'s deadline.',
  },
};
