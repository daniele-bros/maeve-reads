/* Chapter 1 content. Ear games, then s a t p i n, then decodable words. */
const PICS = {
  cat: "🐱", hat: "🎩", bat: "🦇", dog: "🐶", log: "🪵", sun: "☀️", bun: "🍞",
  pig: "🐷", wig: "👒", bee: "🐝", tree: "🌳", moon: "🌙", spoon: "🥄",
  fish: "🐟", dish: "🍽️", ball: "⚽", cake: "🎂", snake: "🐍", sock: "🧦",
  mouse: "🐭", bus: "🚌", nest: "🪺", book: "📚", car: "🚗", apple: "🍎",
  tiger: "🐯", igloo: "🧊", nose: "👃", sat: "🛋️", pat: "🐾", tap: "🥁",
  pin: "📌", tin: "🥫", nap: "😴", sip: "🧃", pan: "🍳", ant: "🐜",
  frog: "🐸", star: "⭐", fan: "💨",
  kite: "🪁", egg: "🥚", rat: "🐀", cap: "🧢", can: "🥫", pet: "🐹", pen: "🖊️",
  ten: "🔟", net: "🥅", hen: "🐔", ram: "🐏", mat: "🧶", map: "🗺️", mad: "😠",
  dad: "🧔", sad: "😢", ham: "🍖", kid: "🧒", sit: "🪑", bed: "🛏️", red: "🟥",
  sam: "👦", hit: "👊", ran: "🏃",
};

const LETTERS = {
  s: {
    emoji: "🐍", keyword: "snake", said: "sss",
    action: "Wiggle your hand like a snake.",
    accept: ["s", "ss", "sss", "es", "ess", "snake", "hiss"],
  },
  a: {
    emoji: "🍎", keyword: "apple", said: "a",
    action: "Pretend to bite an apple.",
    accept: ["a", "ah", "aa", "apple", "ant"],
  },
  t: {
    emoji: "🐯", keyword: "tiger", said: "t",
    action: "Tap your shoulders.",
    accept: ["t", "tt", "tee", "tea", "tuh", "tiger", "tap"],
  },
  p: {
    emoji: "🐷", keyword: "pig", said: "p",
    action: "Puff, like blowing a candle.",
    accept: ["p", "pp", "puh", "pee", "pea", "pig"],
  },
  i: {
    emoji: "🧊", keyword: "igloo", said: "i",
    action: "Wiggle your nose. Itchy nose!",
    accept: ["i", "ih", "eee", "ee", "igloo", "itchy", "it", "in"],
  },
  n: {
    emoji: "👃", keyword: "nose", said: "nnn",
    action: "Touch your nose.",
    accept: ["n", "nn", "nnn", "en", "nah", "nose", "nest"],
  },
  c: {
    emoji: "🐱", keyword: "cat", said: "k", clip: "k",
    action: "Snap your fingers.",
    accept: ["c", "k", "ck", "kay", "cat", "cup"],
  },
  k: {
    emoji: "🪁", keyword: "kite", said: "k", clip: "k",
    action: "Kick your foot.",
    accept: ["k", "c", "ck", "kay", "kite"],
  },
  e: {
    emoji: "🥚", keyword: "egg", said: "e", clip: "e",
    action: "Pretend to crack an egg.",
    accept: ["e", "eh", "egg"],
  },
  h: {
    emoji: "🎩", keyword: "hat", said: "hhh", clip: "h",
    action: "Puff on your hand, like a dog panting.",
    accept: ["h", "hh", "hhh", "hat"],
  },
  r: {
    emoji: "🐀", keyword: "rat", said: "rrr", clip: "r",
    action: "Pretend to be a puppy tugging a rag.",
    accept: ["r", "rr", "rrr", "rat"],
  },
  m: {
    emoji: "🐭", keyword: "mouse", said: "mmm", clip: "m",
    action: "Rub your tummy.",
    accept: ["m", "mm", "mmm", "em", "mouse"],
  },
  d: {
    emoji: "🐶", keyword: "dog", said: "d", clip: "d",
    action: "Beat your hands like a drum.",
    accept: ["d", "dd", "duh", "dog"],
  },
};

const LETTER_ORDER = ["s", "a", "t", "p", "i", "n", "c", "k", "e", "h", "r", "m", "d"];

const PATH = [
  { id: "rhyme", label: "Rhymes", icon: "👂" },
  { id: "first", label: "Starts", icon: "🌟" },
  { id: "robot", label: "Robot", icon: "🤖" },
  { id: "s", label: "sss", icon: "🐍" },
  { id: "a", label: "a", icon: "🍎" },
  { id: "t", label: "t", icon: "🐯" },
  { id: "sat", label: "sat", icon: "🛋️" },
  { id: "p", label: "p", icon: "🐷" },
  { id: "i", label: "i", icon: "🧊" },
  { id: "n", label: "n", icon: "👃" },
  { id: "words", label: "Words", icon: "📖" },
];

const PATH2 = [
  { id: "ck", label: "c k", icon: "🐱" },
  { id: "e", label: "e", icon: "🥚" },
  { id: "words1", label: "Blend", icon: "✨" },
  { id: "hr", label: "h r", icon: "🎩" },
  { id: "words2", label: "Swoop", icon: "👀" },
  { id: "md", label: "m d", icon: "🐭" },
  { id: "read", label: "Match", icon: "🖼️" },
  { id: "spell", label: "Build", icon: "🔤" },
  { id: "stories", label: "Stories", icon: "📕" },
];

const RHYMES = [
  { word: "cat", answer: "hat", options: ["hat", "dog", "sun"] },
  { word: "dog", answer: "log", options: ["log", "cat", "bee"] },
  { word: "sun", answer: "bun", options: ["bun", "pig", "ball"] },
  { word: "pig", answer: "wig", options: ["wig", "moon", "cake"] },
  { word: "bee", answer: "tree", options: ["tree", "car", "fish"] },
  { word: "moon", answer: "spoon", options: ["spoon", "book", "hat"] },
  { word: "fish", answer: "dish", options: ["dish", "bus", "star"] },
  { word: "cake", answer: "snake", options: ["snake", "frog", "sock"] },
];

const FIRSTS = [
  { ph: "s", say: "sss", answer: "sock", options: ["sock", "moon", "pig"] },
  { ph: "m", say: "mmm", answer: "mouse", options: ["mouse", "sun", "bee"] },
  { ph: "p", say: "p", answer: "pig", options: ["pig", "dog", "sun"] },
  { ph: "d", say: "d", answer: "dog", options: ["dog", "cat", "moon"] },
  { ph: "f", say: "fff", answer: "fish", options: ["fish", "ball", "cake"] },
  { ph: "b", say: "b", answer: "bus", options: ["bus", "sun", "bee"] },
  { ph: "k", say: "k", answer: "cat", options: ["cat", "moon", "fish"] },
  { ph: "n", say: "nnn", answer: "nest", options: ["nest", "dog", "cake"] },
  { ph: "t", say: "t", answer: "tiger", options: ["tiger", "moon", "sock"] },
  { ph: "h", say: "hhh", answer: "hat", options: ["hat", "pig", "ball"] },
];

const ROBOT = [
  { word: "cat", onset: ["k", "at"], phones: ["k", "a", "t"], options: ["cat", "dog", "sun"], accept: ["cat", "kat"] },
  { word: "dog", onset: ["d", "og"], phones: ["d", "o", "g"], options: ["dog", "cat", "bee"], accept: ["dog", "dawg", "doggie"] },
  { word: "sun", onset: ["s", "un"], phones: ["s", "u", "n"], options: ["sun", "pig", "ball"], accept: ["sun", "son"] },
  { word: "pig", onset: ["p", "ig"], phones: ["p", "i", "g"], options: ["pig", "moon", "cat"], accept: ["pig"] },
  { word: "hat", onset: ["h", "at"], phones: ["h", "a", "t"], options: ["hat", "dog", "fish"], accept: ["hat"] },
  { word: "bus", onset: ["b", "us"], phones: ["b", "u", "s"], options: ["bus", "moon", "cake"], accept: ["bus"] },
];

const DECODABLE = {
  sat: { letters: ["s", "a", "t"], accept: ["sat", "set"] },
  pat: { letters: ["p", "a", "t"], accept: ["pat", "pet"] },
  tap: { letters: ["t", "a", "p"], accept: ["tap"] },
  pin: { letters: ["p", "i", "n"], accept: ["pin", "pen"] },
  tin: { letters: ["t", "i", "n"], accept: ["tin", "ten"] },
  nap: { letters: ["n", "a", "p"], accept: ["nap"] },
  sip: { letters: ["s", "i", "p"], accept: ["sip"] },
  pan: { letters: ["p", "a", "n"], accept: ["pan"] },
  ant: { letters: ["a", "n", "t"], accept: ["ant", "aunt"] },
};

const WORD_FOILS = {
  sat: ["dog", "sun"],
  pat: ["sat", "tap"],
  tap: ["pat", "sat"],
  pin: ["pan", "tin"],
  tin: ["pin", "nap"],
  nap: ["tap", "sat"],
  sip: ["sat", "pin"],
  pan: ["pin", "nap"],
  ant: ["nap", "sat"],
};

const SAT_SETS = [
  ["dog", "sun"],
  ["pig", "ball"],
  ["moon", "cake"],
  ["bus", "fish"],
];

function spin() {
  return Progress.data.spin || 0;
}

function shuffled(arr) {
  const copy = arr.slice();
  let seed = (spin() + 1) * 997 + copy.length * 13;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    const j = seed % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function rotate(pool, n) {
  const start = spin() % pool.length;
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(pool[(start + i) % pool.length]);
  return out;
}

function picChoices(keys) {
  return shuffled(keys).map((key) => ({ key, emoji: PICS[key] }));
}

function letterChoices(answer) {
  const order = LETTER_ORDER;
  const idx = order.indexOf(answer);
  const taught = idx >= 0 ? order.slice(0, idx) : [];
  const foils = ["m", "f", "d", "o", "r", "h", "b", "c"];
  const pool = taught.concat(foils);
  const pick = [];
  let i = spin();
  while (pick.length < 2) {
    const foil = pool[i % pool.length];
    i += 1;
    if (foil !== answer && pick.indexOf(foil) === -1) pick.push(foil);
    if (i > spin() + 20) break;
  }
  return shuffled([answer].concat(pick)).map((letter) => ({ key: letter, letter }));
}

function letterFind(target, lesson) {
  const info = LETTERS[target];
  return {
    type: "choice",
    score: true,
    skill: lesson,
    recordAlso: target,
    speech: "Tap the letter that matches this sound.",
    clips: [info.clip || target],
    choices: letterChoices(target),
    answer: target,
    accept: info.accept,
    voice: "phoneme",
    phoneme: target,
  };
}

function pictureFind(letter, lesson) {
  const info = LETTERS[letter];
  const others = ["s", "a", "t", "p", "i", "n"]
    .filter((id) => id !== letter)
    .map((id) => LETTERS[id].keyword);
  const bank = ["moon", "ball", "bus", "cake", "fish", "star"];
  const foilA = others[spin() % others.length];
  const foilB = bank[spin() % bank.length];
  return {
    type: "choice",
    score: true,
    skill: lesson,
    speech: "Which picture starts like " + info.keyword + "?",
    clips: [info.clip || letter],
    choices: picChoices([info.keyword, foilA, foilB]),
    answer: info.keyword,
    accept: [info.keyword],
    voice: "word",
    phoneme: letter,
  };
}

function letterTrials(letter) {
  const order = LETTER_ORDER;
  const prev = order.slice(0, order.indexOf(letter));
  const trials = [
    letterFind(letter, letter),
    letterFind(letter, letter),
    pictureFind(letter, letter),
    letterFind(letter, letter),
  ];
  if (prev.length) trials.push(letterFind(prev[spin() % prev.length], letter));
  else trials.push(pictureFind(letter, letter));
  return trials;
}

const BLEND1 = [
  { id: "cat", letters: ["c", "a", "t"], foils: ["cap", "can"], accept: ["cat", "kat"] },
  { id: "cap", letters: ["c", "a", "p"], foils: ["cat", "can"], accept: ["cap"] },
  { id: "can", letters: ["c", "a", "n"], foils: ["cat", "cap"], accept: ["can"] },
  { id: "pet", letters: ["p", "e", "t"], foils: ["pen", "ten"], accept: ["pet"] },
  { id: "ten", letters: ["t", "e", "n"], foils: ["pen", "hen"], accept: ["ten"] },
  { id: "sat", letters: ["s", "a", "t"], foils: ["sit", "mat"], accept: ["sat"] },
];

const BLEND2 = [
  { id: "hat", letters: ["h", "a", "t"], foils: ["rat", "hit"], accept: ["hat"] },
  { id: "rat", letters: ["r", "a", "t"], foils: ["hat", "ran"], accept: ["rat"] },
  { id: "hen", letters: ["h", "e", "n"], foils: ["pen", "ten"], accept: ["hen"] },
  { id: "red", letters: ["r", "e", "d"], foils: ["bed", "hen"], accept: ["red"] },
  { id: "ran", letters: ["r", "a", "n"], foils: ["rat", "ram"], accept: ["ran", "run"] },
  { id: "pen", letters: ["p", "e", "n"], foils: ["pet", "hen"], accept: ["pen"] },
];

const READS = [
  { id: "sat", letters: ["s", "a", "t"], options: ["sat", "sit", "mat"], accept: ["sat"] },
  { id: "sit", letters: ["s", "i", "t"], options: ["sit", "sat", "sip"], accept: ["sit", "set"] },
  { id: "mat", letters: ["m", "a", "t"], options: ["mat", "sat", "map"], accept: ["mat"] },
  { id: "cat", letters: ["c", "a", "t"], options: ["cat", "cap", "can"], accept: ["cat", "kat"] },
  { id: "pin", letters: ["p", "i", "n"], options: ["pin", "pan", "pen"], accept: ["pin"] },
  { id: "hat", letters: ["h", "a", "t"], options: ["hat", "hit", "rat"], accept: ["hat"] },
  { id: "dad", letters: ["d", "a", "d"], options: ["dad", "sad", "mad"], accept: ["dad"] },
  { id: "sad", letters: ["s", "a", "d"], options: ["sad", "dad", "sat"], accept: ["sad"] },
];

const SPELLS = [
  { id: "mat", letters: ["m", "a", "t"], bank: ["m", "a", "t", "s", "i"], accept: ["mat"] },
  { id: "hen", letters: ["h", "e", "n"], bank: ["h", "e", "n", "a", "p"], accept: ["hen"] },
  { id: "cap", letters: ["c", "a", "p"], bank: ["c", "a", "p", "t", "i"], accept: ["cap"] },
  { id: "red", letters: ["r", "e", "d"], bank: ["r", "e", "d", "a", "n"], accept: ["red"] },
  { id: "dad", letters: ["d", "a", "d"], bank: ["d", "a", "d", "s", "m"], accept: ["dad"] },
];

const SENTENCES = [
  {
    id: "sam",
    words: [
      { text: "Sam", say: "sam", letters: ["s", "a", "m"] },
      { text: "sat", say: "sat", letters: ["s", "a", "t"] },
    ],
    options: ["sam", "sadcat", "hen"],
    accept: ["sam sat", "sam"],
  },
  {
    id: "sadcat",
    words: [
      { text: "the", say: "the", tricky: true },
      { text: "cat", say: "cat", letters: ["c", "a", "t"] },
      { text: "is", say: "is", tricky: true },
      { text: "sad", say: "sad", letters: ["s", "a", "d"] },
    ],
    options: ["sadcat", "redhat", "hen"],
    accept: ["the cat is sad", "cat is sad", "sad cat"],
  },
  {
    id: "dadsad",
    words: [
      { text: "Dad", say: "dad", letters: ["d", "a", "d"] },
      { text: "is", say: "is", tricky: true },
      { text: "sad", say: "sad", letters: ["s", "a", "d"] },
    ],
    options: ["dadsad", "redhat", "hen"],
    accept: ["dad is sad", "dad sad"],
  },
  {
    id: "hensat",
    words: [
      { text: "the", say: "the", tricky: true },
      { text: "hen", say: "hen", letters: ["h", "e", "n"] },
      { text: "sat", say: "sat", letters: ["s", "a", "t"] },
    ],
    options: ["hensat", "sadcat", "redhat"],
    accept: ["the hen sat", "hen sat"],
  },
  {
    id: "redhat",
    words: [
      { text: "a", say: "a", tricky: true },
      { text: "red", say: "red", letters: ["r", "e", "d"] },
      { text: "hat", say: "hat", letters: ["h", "a", "t"] },
    ],
    options: ["redhat", "sadcat", "hen"],
    accept: ["a red hat", "red hat"],
  },
];

const SCENE = { sam: "👦", sadcat: "😿", dadsad: "🧔", hensat: "🐔", hen: "🐔", redhat: "🎩", dad: "🧔" };

const Session = {
  build(skill) {
    if (skill === "ck") return this.pair(["c", "k"], "ck");
    if (skill === "hr") return this.pair(["h", "r"], "hr");
    if (skill === "md") return this.pair(["m", "d"], "md");
    if (skill === "words1") return this.blendList("words1", BLEND1, "guided");
    if (skill === "words2") return this.blendList("words2", BLEND2, "open");
    if (skill === "read") return this.readSet();
    if (skill === "spell") return this.spellSet();
    if (skill === "stories") return this.storySet();
    if (skill === "rhyme") return this.rhyme();
    if (skill === "first") return this.first();
    if (skill === "robot1" || skill === "robot2") return this.robot(skill);
    if (LETTERS[skill]) return this.letter(skill);
    if (skill === "sat") return this.blend(1);
    if (skill === "words") return this.blend(2);
    return this.rhyme();
  },

  rhyme() {
    const steps = [{
      type: "model",
      score: false,
      skill: "rhyme",
      speech: "Cat. Hat. They rhyme! They sound the same at the end.",
      clips: ["w:cat", "w:hat"],
      emojis: ["🐱", "🎩"],
    }];
    rotate(RHYMES, 5).forEach((round) => {
      steps.push({
        type: "choice",
        score: true,
        skill: "rhyme",
        speech: "Which one rhymes with " + round.word + "?",
        clips: ["w:" + round.word],
        choices: picChoices(round.options),
        answer: round.answer,
        accept: [round.answer],
        voice: "word",
      });
    });
    return steps;
  },

  first() {
    const steps = [{
      type: "model",
      score: false,
      skill: "first",
      speech: "Listen to the first sound. Sun starts with sss.",
      clips: ["w:sun", "s"],
      emojis: ["☀️"],
    }];
    rotate(FIRSTS, 5).forEach((round) => {
      steps.push({
        type: "choice",
        score: true,
        skill: "first",
        speech: "Which picture starts with this sound?",
        clips: [round.ph],
        choices: picChoices(round.options),
        answer: round.answer,
        accept: [round.answer],
        voice: "word",
        phoneme: round.ph,
      });
    });
    return steps;
  },

  robot(stage) {
    const key = stage === "robot1" ? "onset" : "phones";
    const gap = stage === "robot1" ? 90 : 240;
    const demo = ROBOT[0];
    const buddy = ROBOT[1];
    const steps = [{
      type: "model",
      score: false,
      skill: stage,
      speech: stage === "robot1"
        ? "I am a robot. First sound, then the rest. Then the word."
        : "Now every sound, like a robot. Then the word.",
      clips: demo[key].concat(["w:" + demo.word]),
      gap,
      emojis: [PICS[demo.word]],
      beads: demo[key].length,
    }, {
      type: "choice",
      score: false,
      skill: stage,
      speech: "Let us do one together. What word is that?",
      clips: buddy[key],
      gap,
      choices: [{ key: buddy.word, emoji: PICS[buddy.word] }],
      answer: buddy.word,
      accept: buddy.accept,
      voice: "word",
      beads: buddy[key].length,
    }];
    rotate(ROBOT, 4).forEach((item) => {
      steps.push({
        type: "choice",
        score: true,
        skill: stage,
        speech: "What word is that?",
        clips: item[key],
        gap,
        choices: picChoices(item.options),
        answer: item.word,
        accept: item.accept,
        voice: "word",
        beads: item[key].length,
      });
    });
    return steps;
  },

  letter(letter) {
    const info = LETTERS[letter];
    const known = Progress.isMastered(letter);
    const steps = [{
      type: "model",
      score: false,
      skill: letter,
      speech: known
        ? "You know this sound, like " + info.keyword + ". Let's play."
        : "Listen. Like " + info.keyword + ". " + info.action,
      clips: [info.clip || letter],
      letter,
      emoji: info.emoji,
    }];
    if (!known) {
      steps.push({
        type: "wedo",
        score: false,
        skill: letter,
        speech: "Say this sound with me.",
        clips: [info.clip || letter],
        letter,
        emoji: info.emoji,
        accept: info.accept,
        voice: "phoneme",
        phoneme: letter,
      });
    }
    return steps.concat(letterTrials(letter));
  },

  blend(tier) {
    const skill = tier === 1 ? "sat" : "words";
    const words = tier === 1
      ? ["sat", "sat", "sat", "sat"]
      : rotate(["sat", "pat", "tap", "pin", "tin", "nap", "sip", "pan", "ant"], 4);
    const first = words[0];
    const steps = [{
      type: "blend",
      mode: "model",
      score: false,
      skill,
      word: first,
      letters: DECODABLE[first].letters,
      speech: "Watch. I tap each sound. Then I swoop them together.",
      choices: [{ key: first, emoji: PICS[first] }],
      answer: first,
    }];
    if (tier === 1) {
      steps.push({
        type: "blend",
        mode: "wedo",
        score: false,
        skill,
        word: "sat",
        letters: ["s", "a", "t"],
        speech: "Your turn. Tap each sound. Then swoop.",
        choices: [{ key: "sat", emoji: PICS.sat }],
        answer: "sat",
        accept: DECODABLE.sat.accept,
        voice: "word",
      });
    }
    words.forEach((word, index) => {
      const foils = tier === 1 ? SAT_SETS[index % SAT_SETS.length] : WORD_FOILS[word];
      steps.push({
        type: "blend",
        mode: "you",
        score: true,
        skill,
        word,
        letters: DECODABLE[word].letters,
        speech: "Tap each sound. Then swoop.",
        choices: picChoices([word].concat(foils)),
        answer: word,
        accept: DECODABLE[word].accept,
        voice: "word",
      });
    });
    return steps;
  },

  pair(ids, skill) {
    const steps = [];
    ids.forEach((letter) => {
      const info = LETTERS[letter];
      steps.push({
        type: "model",
        score: false,
        skill,
        speech: "Listen. Like " + info.keyword + ". " + info.action,
        clips: [info.clip || letter],
        letter,
        emoji: info.emoji,
      });
    });
    const first = LETTERS[ids[0]];
    steps.push({
      type: "wedo",
      score: false,
      skill,
      speech: "Say this sound with me.",
      clips: [first.clip || ids[0]],
      letter: ids[0],
      emoji: first.emoji,
      accept: first.accept,
      voice: "phoneme",
      phoneme: ids[0],
    });
    steps.push(letterFind(ids[0], skill));
    steps.push(letterFind(ids[1], skill));
    steps.push(pictureFind(ids[0], skill));
    steps.push(letterFind(ids[1], skill));
    steps.push(letterFind(["s", "a", "t", "p", "i", "n"][spin() % 6], skill));
    return steps;
  },

  blendList(skill, pool, fade) {
    const rounds = rotate(pool, 4);
    const first = rounds[0];
    const steps = [{
      type: "blend",
      mode: "model",
      fade: "guided",
      score: false,
      skill,
      word: first.id,
      letters: first.letters,
      speech: "Watch. I tap each sound. Then I swoop.",
      choices: [{ key: first.id, emoji: PICS[first.id] }],
      answer: first.id,
    }];
    rounds.forEach((item) => {
      steps.push({
        type: "blend",
        mode: "you",
        fade,
        score: true,
        skill,
        word: item.id,
        letters: item.letters,
        speech: fade === "open"
          ? "Read the word. Tap a letter if you want a sound. Then swoop."
          : "Tap each sound. Then swoop.",
        choices: picChoices([item.id].concat(item.foils)),
        answer: item.id,
        accept: item.accept,
        voice: "word",
      });
    });
    return steps;
  },

  readSet() {
    const rounds = rotate(READS, 4);
    const steps = [{
      type: "read",
      mode: "model",
      score: false,
      skill: "read",
      word: "sat",
      letters: ["s", "a", "t"],
      speech: "Read the whole word. Tap it if you want to hear the sounds.",
      choices: [{ key: "sat", emoji: PICS.sat }],
      answer: "sat",
    }];
    rounds.forEach((item) => {
      steps.push({
        type: "read",
        mode: "you",
        score: true,
        skill: "read",
        word: item.id,
        letters: item.letters,
        speech: "Read the word. Then tap the picture.",
        choices: picChoices(item.options),
        answer: item.id,
        accept: item.accept,
        voice: "word",
      });
    });
    return steps;
  },

  spellSet() {
    const rounds = rotate(SPELLS, 4);
    const steps = [{
      type: "spell",
      mode: "model",
      score: false,
      skill: "spell",
      word: "mat",
      letters: ["m", "a", "t"],
      bank: [],
      speech: "I say a word. You tap the letters to build it. You can drag a letter, or just tap it.",
      clips: ["w:mat"],
    }];
    rounds.forEach((item) => {
      steps.push({
        type: "spell",
        mode: "you",
        score: true,
        skill: "spell",
        word: item.id,
        letters: item.letters,
        bank: shuffled(item.bank.slice()),
        speech: "Make the word.",
        clips: ["w:" + item.id],
        accept: item.accept,
        voice: "word",
      });
    });
    return steps;
  },

  storySet() {
    const steps = [{
      type: "sentence",
      mode: "model",
      score: false,
      skill: "stories",
      words: [
        { text: "a", say: "a", tricky: true },
        { text: "the", say: "the", tricky: true },
        { text: "is", say: "is", tricky: true },
      ],
      speech: "Some words we remember. a. the. is. We do not sound them out.",
      choices: [],
      answer: "",
    }, {
      type: "sentence",
      mode: "model",
      score: false,
      skill: "stories",
      words: [
        { text: "a", say: "a", tricky: true },
        { text: "red", say: "red", letters: ["r", "e", "d"] },
        { text: "hat", say: "hat", letters: ["h", "a", "t"] },
      ],
      speech: "a red hat.",
      choices: [{ key: "redhat", emoji: "🎩" }],
      answer: "redhat",
    }];
    rotate(SENTENCES, 4).forEach((item) => {
      steps.push({
        type: "sentence",
        mode: "you",
        score: true,
        skill: "stories",
        words: item.words,
        speech: "Read it. Then tap the picture.",
        choices: item.options.map((key) => ({ key, emoji: SCENE[key] || PICS[key] })),
        answer: item.id,
        accept: item.accept,
        voice: "word",
      });
    });
    return steps;
  },
};
