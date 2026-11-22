/* Chapter 1 content. Ear games, then s a t p i n, then decodable words. */
const PICS = {
  cat: "🐱", hat: "🎩", bat: "🦇", dog: "🐶", log: "🪵", sun: "☀️", bun: "🍞",
  pig: "🐷", wig: "👒", bee: "🐝", tree: "🌳", moon: "🌙", spoon: "🥄",
  fish: "🐟", dish: "🍽️", ball: "⚽", cake: "🎂", snake: "🐍", sock: "🧦",
  mouse: "🐭", bus: "🚌", nest: "🪺", book: "📚", car: "🚗", apple: "🍎",
  tiger: "🐯", igloo: "🧊", nose: "👃", sat: "🛋️", pat: "🐾", tap: "🥁",
  pin: "📌", tin: "🥫", nap: "😴", sip: "🧃", pan: "🍳", ant: "🐜",
  frog: "🐸", star: "⭐", fan: "💨",
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
};

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
  const order = ["s", "a", "t", "p", "i", "n"];
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
    speech: "Tap the one that says " + info.said + ".",
    clips: [target],
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
    speech: "Which picture starts with " + info.said + "?",
    clips: [letter],
    choices: picChoices([info.keyword, foilA, foilB]),
    answer: info.keyword,
    accept: [info.keyword],
    voice: "word",
    phoneme: letter,
  };
}

function letterTrials(letter) {
  const order = ["s", "a", "t", "p", "i", "n"];
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

const Session = {
  build(skill) {
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
        speech: "Which picture starts with " + round.say + "?",
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
        ? "You know " + info.said + ", like " + info.keyword + ". Let's play."
        : "This letter says " + info.said + ". " + info.said + ", like " + info.keyword + ". " + info.action,
      clips: [letter],
      letter,
      emoji: info.emoji,
    }];
    if (!known) {
      steps.push({
        type: "wedo",
        score: false,
        skill: letter,
        speech: "Say " + info.said + " with me.",
        clips: [letter],
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
};
