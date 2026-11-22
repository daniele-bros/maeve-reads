/* Short playful rounds. Every tap or drag is still a reading rep. */
const PlaySets = {
  has(id) {
    return id === "reader" || !!this.pools[id];
  },

  pools: {
    pop: [
      { speech: "Pop the balloon with this sound.", clips: ["s"], answer: "s", options: ["s", "m", "t"] },
      { speech: "Pop the balloon with this sound.", clips: ["a"], answer: "a", options: ["a", "e", "i"] },
      { speech: "Pop the balloon with this sound.", clips: ["m"], answer: "m", options: ["m", "n", "s"] },
      { speech: "Pop the balloon with this sound.", clips: ["k"], answer: "c", options: ["c", "t", "p"] },
    ],
    bubble: [
      { speech: "Catch the bubble with this sound.", clips: ["t"], answer: "t", options: ["t", "p", "d"] },
      { speech: "Catch the bubble with this sound.", clips: ["e"], answer: "e", options: ["e", "a", "i"] },
      { speech: "Catch the bubble with this sound.", clips: ["h"], answer: "h", options: ["h", "n", "r"] },
      { speech: "Catch the bubble with this sound.", clips: ["d"], answer: "d", options: ["d", "t", "p"] },
    ],
    feed: [
      { speech: "Feed the monster this word.", clips: ["w:cat"], answer: "cat", options: ["cat", "cap", "can"], picture: "cat" },
      { speech: "Feed the monster this word.", clips: ["w:hen"], answer: "hen", options: ["hen", "hat", "pen"], picture: "hen" },
      { speech: "Feed the monster this word.", clips: ["w:sat"], answer: "sat", options: ["sat", "sit", "mat"], picture: "sat" },
      { speech: "Feed the monster this word.", clips: ["w:map"], answer: "map", options: ["map", "mat", "mad"], picture: "map" },
    ],
    train: [
      { speech: "Build the word on the train.", clips: ["w:mat"], word: "mat", letters: ["m", "a", "t"], bank: ["m", "s", "a", "p", "t"] },
      { speech: "Build the word on the train.", clips: ["w:hen"], word: "hen", letters: ["h", "e", "n"], bank: ["n", "h", "a", "e", "t"] },
      { speech: "Build the word on the train.", clips: ["w:cap"], word: "cap", letters: ["c", "a", "p"], bank: ["p", "t", "c", "a", "i"] },
      { speech: "Build the word on the train.", clips: ["w:red"], word: "red", letters: ["r", "e", "d"], bank: ["d", "e", "a", "r", "n"] },
    ],
    hop: [
      { speech: "Listen. Now drag the sounds.", word: "sat", letters: ["s", "a", "t"], picture: "sat", clips: ["w:sat"] },
      { speech: "Listen. Now drag the sounds.", word: "pin", letters: ["p", "i", "n"], picture: "pin", clips: ["w:pin"] },
      { speech: "Listen. Now drag the sounds.", word: "hen", letters: ["h", "e", "n"], picture: "hen", clips: ["w:hen"] },
      { speech: "Listen. Now drag the sounds.", word: "map", letters: ["m", "a", "p"], picture: "map", clips: ["w:map"] },
    ],
    fish: [
      { speech: "Catch the word that matches.", clips: ["w:rat"], answer: "rat", options: ["rat", "hat", "ran"], picture: "rat" },
      { speech: "Catch the word that matches.", clips: ["w:hit"], answer: "hit", options: ["hit", "hat", "sit"], picture: "hit" },
      { speech: "Catch the word that matches.", clips: ["w:sip"], answer: "sip", options: ["sip", "sit", "sat"], picture: "sip" },
      { speech: "Catch the word that matches.", answer: "dad", options: ["dad", "sad", "mad"], picture: "dad", clips: ["w:dad"] },
    ],
    mystery: [
      { speech: "This word matches one picture.", word: "cat", letters: ["c", "a", "t"], answer: "cat", options: ["cat", "cap", "can"], clips: ["w:cat"] },
      { speech: "This word matches one picture.", word: "map", letters: ["m", "a", "p"], answer: "map", options: ["map", "mat", "mad"], clips: ["w:map"] },
      { speech: "This word matches one picture.", word: "hen", letters: ["h", "e", "n"], answer: "hen", options: ["hen", "hat", "pen"], clips: ["w:hen"] },
      { speech: "This word matches one picture.", word: "hat", letters: ["h", "a", "t"], answer: "hat", options: ["hat", "hit", "rat"], clips: ["w:hat"] },
    ],
  },

  lengthFor(id) {
    if (id === "reader" || id === "feed" || id === "train" || id === "hop" || id === "fish" || id === "mystery") return 11;
    return 9;
  },

  build(id) {
    if (id === "reader") return this.buildReader();
    const items = Deal.rounds(this.pools[id], this.lengthFor(id));
    return items.map((item) => ({
      type: "play",
      game: id,
      score: true,
      skill: id,
      voice: item.clips && String(item.clips[0]).indexOf("w:") === 0 ? "word" : (item.answer && item.answer.length === 1 ? "phoneme" : "word"),
      phoneme: item.answer && String(item.answer).length === 1 ? item.answer : null,
      accept: item.word ? [item.word] : [item.answer],
      speech: item.speech,
      clips: item.clips || [],
      answer: item.answer || item.word,
      options: item.options || item.letters,
      picture: item.picture || item.answer || item.word,
      word: item.word,
      letters: item.letters,
      bank: item.bank,
    }));
  },

  buildReader() {
    const bank = [
      "cat", "hat", "mat", "sat", "pat", "pan", "pin", "map", "cap", "can",
      "hen", "pen", "rat", "ham", "red", "hit", "sip", "sit", "tap", "nap", "mad", "dad", "ran", "tin",
    ];
    const words = Deal.rounds(bank.map((id) => ({ answer: id })), 12).map((item) => item.answer);
    const groups = [
      [words[0]], [words[1]], [words[2]],
      [words[3], words[4]], [words[5], words[6]], [words[7], words[8]],
      [words[9], words[10], words[11]],
    ];
    let done = 0;
    return groups.map((queue) => {
      const extras = Deal.shuffle(bank.filter((id) => queue.indexOf(id) === -1)).slice(0, queue.length === 1 ? 2 : 1);
      const step = {
        type: "play",
        game: "reader",
        score: true,
        skill: "reader",
        speech: "Read the word. Pop its picture.",
        clips: [],
        queue,
        answer: queue[0],
        word: queue[0],
        picture: queue[0],
        options: queue.concat(extras),
        doneWords: done,
        totalWords: 12,
        accept: queue.slice(),
      };
      done += queue.length;
      return step;
    });
  },

  choiceOrder(step) {
    const options = (step.options || []).concat([step.answer]);
    if (step.game === "reader") return Deal.place(Deal.unique(options), step.answer);
    return Deal.withAnswer(step.answer, step.options || []);
  },

  present(step) {
    this.step = step;
    this.filled = [];
    this.misses = 0;
    this.cursor = 0;
    const view = this["view_" + step.game];
    const held = Game.shot ? "" : " hold";
    const pips = step.game === "reader" ? "" : `<div class="pips">${pipsHTML()}</div>`;
    main.innerHTML = `<div class="play mini${held}">${pips}${view.call(this, step)}${skipHTML()}</div>`;
    updateMic(step);
    this.combo = step.game === "reader" && step.doneWords ? this.combo || 0 : 0;
    if (step.game === "reader") this.armHint();
  },

  unlock() {
    Game.ready = true;
    const board = document.querySelector(".mini");
    if (board) board.classList.remove("hold");
  },

  piece(label, extra) {
    return `<button type="button" class="piece ${extra || ""}" ${extra || ""}>${label}</button>`;
  },

  view_reader(step) {
    const keys = this.choiceOrder(step);
    const bubbles = keys.map((word, index) => {
      return `<button type="button" class="bubble reader-bubble b${index % 4}" data-key="${esc(word)}" style="animation-delay:${(index * 1.1).toFixed(1)}s" aria-label="${esc(word)}">${PICS[word] || ""}</button>`;
    }).join("");
    const queue = (step.queue || [step.answer]).map((word, index) => {
      return `<span class="queue-word${index === 0 ? " now" : ""}">${esc(word)}</span>`;
    }).join("");
    const pips = Array.from({ length: step.totalWords || 12 }, (_, index) => {
      return `<i class="${index < (step.doneWords || 0) ? "on" : ""}"></i>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      <div class="track">${pips}</div>
      <div class="word-queue">${queue}<button type="button" id="hint" class="hint" aria-label="Hear the word">🔊</button></div>
      <div class="streak" id="streak"></div>
      <div class="tank">
        <div class="reef far"></div>
        <div class="reef near"></div>
        ${bubbles}
      </div>`;
  },

  view_pop(step) {
    const balls = this.choiceOrder(step).map((letter, i) => {
      return `<button type="button" class="balloon b${i}" data-key="${esc(letter)}" aria-label="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p><div class="sky-play">${balls}</div>`;
  },

  view_bubble(step) {
    const balls = this.choiceOrder(step).map((letter, i) => {
      return `<button type="button" class="bubble b${i}" data-key="${esc(letter)}" aria-label="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p><div class="pond">${balls}</div>`;
  },

  view_feed(step) {
    const cards = this.choiceOrder(step).map((word) => {
      return `<button type="button" class="piece word-card" data-key="${esc(word)}">${esc(word)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      <div class="monster" data-slot="mouth" data-accept="${esc(step.answer)}">
        <div class="munch">👾</div>
        <div class="want">${PICS[step.picture] || ""}</div>
      </div>
      <div class="pieces">${cards}</div>`;
  },

  view_train(step) {
    const cars = step.letters.map((letter, index) => `<div class="car" data-slot="${index}"></div>`).join("");
    const bits = shuffled(step.bank).map((letter) => {
      return `<button type="button" class="piece" data-letter="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      ${targetButton(PICS[step.word])}
      <div class="train"><span class="engine">🚂</span>${cars}</div>
      <div class="pieces">${bits}</div>`;
  },

  view_hop(step) {
    const stones = step.letters.map((letter, index) => `<div class="stone" data-slot="${index}"></div>`).join("");
    const bits = shuffled(step.letters.slice()).map((letter) => {
      return `<button type="button" class="piece" data-letter="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      ${targetButton(PICS[step.picture])}
      <div class="path">${stones}</div>
      <div class="pieces">${bits}</div>`;
  },

  view_fish(step) {
    const fish = this.choiceOrder(step).map((word, i) => {
      return `<button type="button" class="piece fish f${i}" data-key="${esc(word)}">${esc(word)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      <div class="sea">
        ${fish}
        <div class="net" data-slot="net" data-accept="${esc(step.answer)}">${PICS[step.picture] || ""}</div>
      </div>`;
  },

  view_mystery(step) {
    const boxes = this.choiceOrder(step).map((word) => {
      return `<div class="gift pic-target" data-slot="${esc(word)}" data-accept="${esc(word)}">${PICS[word] || ""}</div>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      <button type="button" class="piece word-card big-piece" data-key="${esc(step.answer)}">${esc(step.word)}</button>
      <div class="gifts">${boxes}</div>`;
  },

  near(el, x, y, reach) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.hypot(x - cx, y - cy) < reach;
  },

  goofy() {
    const pip = document.getElementById("pip");
    if (!pip) return;
    pip.classList.remove("goofy");
    void pip.offsetWidth;
    pip.classList.add("goofy");
    setTimeout(() => pip.classList.remove("goofy"), 650);
  },

  back(piece) {
    piece.classList.remove("snapped");
    piece.classList.add("wiggle");
    this.goofy();
    setTimeout(() => piece.classList.remove("wiggle"), 400);
  },

  hitSlot(x, y, selector) {
    const under = document.elementFromPoint(x, y);
    const direct = under && under.closest(selector);
    if (direct) return direct;
    let best = null;
    let bestDistance = 120;
    document.querySelectorAll(selector).forEach((el) => {
      const rect = el.getBoundingClientRect();
      const dist = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      if (dist < bestDistance) {
        best = el;
        bestDistance = dist;
      }
    });
    return best;
  },

  drop(piece, event) {
    const step = this.step;
    if (!step || Game.lock || !Game.ready || piece.disabled) return;
    const x = event.clientX;
    const y = event.clientY;
    if (step.game === "train" || step.game === "hop") {
      const index = this.filled.length;
      const need = step.letters[index];
      const slot = document.querySelector('[data-slot="' + index + '"]');
      const aimed = this.hitSlot(x, y, '[data-slot="' + index + '"]');
      if (piece.dataset.letter === need && (aimed === slot || this.near(slot, x, y, 110))) {
        slot.textContent = need;
        slot.classList.add("snapped");
        piece.disabled = true;
        piece.classList.add("used");
        this.filled.push(need);
        AudioBus.playClip(soundId(need));
        if (this.filled.length === step.letters.length) {
          AudioBus.playClip("w:" + step.word);
          confetti(true);
          succeed(step, { spoken: false, clean: this.misses === 0 });
        }
        return;
      }
      this.misses += 1;
      const hint = document.querySelector('.piece[data-letter="' + need + '"]:not(.used)');
      if (hint) hint.classList.add("show-me");
      AudioBus.playClip(soundId(need));
      this.back(piece);
      return;
    }
    const mouth = this.hitSlot(x, y, "[data-accept]");
    const key = piece.dataset.key;
    if (mouth && key && key === mouth.dataset.accept && key === step.answer) {
      mouth.classList.add("snapped");
      piece.classList.add("used");
      if (step.game === "mystery") {
        mouth.textContent = PICS[step.answer] || "🌟";
      }
      succeed(step, { spoken: false, clean: true });
      return;
    }
    if (step.game === "mystery") {
      const gift = this.hitSlot(x, y, ".gift");
      if (gift && gift.dataset.slot === step.answer) {
        gift.textContent = PICS[step.answer] || "🌟";
        gift.classList.add("snapped");
        succeed(step, { spoken: false, clean: true });
        return;
      }
    }
    this.back(piece);
  },

  armHint() {
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      const hint = document.getElementById("hint");
      if (hint && Game.step && Game.step.game === "reader") hint.classList.add("show");
    }, 4500);
  },

  stopHint() {
    clearTimeout(this.hintTimer);
  },

  sayHint() {
    const step = this.step;
    if (!step || step.game !== "reader") return;
    const word = step.queue[this.cursor];
    if (word) AudioBus.playClip("w:" + word);
  },

  popReader(button) {
    const step = this.step;
    if (!step || Game.lock || !Game.ready) return;
    const want = step.queue[this.cursor];
    if (button.dataset.key !== want) {
      button.classList.add("away");
      this.goofy();
      setTimeout(() => button.classList.remove("away"), 700);
      return;
    }
    button.classList.add("popped");
    AudioBus.pop();
    this.combo = (this.combo || 0) + 1;
    const streak = document.getElementById("streak");
    if (streak) {
      streak.textContent = this.combo > 1 ? this.combo + " ✨" : "";
      streak.classList.toggle("on", this.combo > 1);
    }
    const track = document.querySelectorAll(".track i");
    this.cursor += 1;
    const mark = (step.doneWords || 0) + this.cursor;
    track.forEach((pip, index) => pip.classList.toggle("on", index < mark));
    document.querySelectorAll(".queue-word").forEach((el, index) => {
      el.classList.toggle("now", index === this.cursor);
      el.classList.toggle("done", index < this.cursor);
    });
    const hint = document.getElementById("hint");
    if (hint) hint.classList.remove("show");
    if (mark === 6) confetti(true);
    const finished = this.cursor >= step.queue.length;
    const finale = mark >= step.totalWords;
    if (finale) {
      const tank = document.querySelector(".tank");
      if (tank) tank.classList.add("finale");
      confetti(true);
    }
    const said = AudioBus.playClip("w:" + want);
    if (finished) {
      Promise.resolve(said).then(() => succeed(step, { spoken: false, clean: true }));
      return;
    }
    this.armHint();
  },

  tap(button) {
    const step = this.step;
    if (!step || Game.lock || !Game.ready) return;
    if (step.game === "reader") return this.popReader(button);
    if (button.dataset.key === step.answer) {
      button.classList.add("popped");
      confetti(false);
      succeed(step, { spoken: false, clean: this.misses === 0 });
      return;
    }
    this.misses += 1;
    button.classList.add("wiggle");
    document.querySelectorAll(".balloon, .bubble").forEach((el) => {
      el.classList.toggle("show-me", el.dataset.key === step.answer);
    });
    if (step.clips && step.clips[0]) AudioBus.playClip(step.clips[0]);
    this.goofy();
    if (this.misses >= 2) {
      const good = document.querySelector('.balloon[data-key="' + step.answer + '"], .bubble[data-key="' + step.answer + '"]');
      if (good) good.classList.add("popped");
      succeed(step, { spoken: false, clean: false });
    }
  },
};
