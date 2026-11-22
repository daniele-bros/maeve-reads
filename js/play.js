/* Short playful rounds. Every tap or drag is still a reading rep. */
const PlaySets = {
  has(id) {
    return !!this.pools[id];
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
      { speech: "Catch the bubble with this sound.", clips: ["d"], answer: "d", options: ["d", "b", "p"] },
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
      { speech: "Drag the sounds along the path.", word: "sat", letters: ["s", "a", "t"], picture: "sat" },
      { speech: "Drag the sounds along the path.", word: "pin", letters: ["p", "i", "n"], picture: "pin" },
      { speech: "Drag the sounds along the path.", word: "hen", letters: ["h", "e", "n"], picture: "hen" },
      { speech: "Drag the sounds along the path.", word: "map", letters: ["m", "a", "p"], picture: "map" },
    ],
    fish: [
      { speech: "Catch the matching word.", clips: ["w:rat"], answer: "rat", options: ["rat", "hat", "ran"], picture: "rat" },
      { speech: "Catch the matching word.", clips: ["w:bed"], answer: "bed", options: ["bed", "red", "pen"], picture: "bed" },
      { speech: "Catch the matching word.", clips: ["w:sip"], answer: "sip", options: ["sip", "sit", "tip"], picture: "sip" },
      { speech: "Catch the matching word.", answer: "dog", options: ["dog", "dad", "dig"], picture: "dog", clips: ["w:dog"] },
    ],
    mystery: [
      { speech: "Read the word. Open its box.", word: "cat", letters: ["c", "a", "t"], answer: "cat", options: ["cat", "cap", "can"] },
      { speech: "Read the word. Open its box.", word: "sun", letters: ["s", "u", "n"], answer: "sun", options: ["sun", "sat", "sip"] },
      { speech: "Read the word. Open its box.", word: "pig", letters: ["p", "i", "g"], answer: "pig", options: ["pig", "pin", "pan"] },
      { speech: "Read the word. Open its box.", word: "hat", letters: ["h", "a", "t"], answer: "hat", options: ["hat", "hit", "rat"] },
    ],
  },

  build(id) {
    return rotate(this.pools[id], 3).map((item) => ({
      type: "play",
      game: id,
      score: true,
      skill: id,
      voice: item.clips && String(item.clips[0]).indexOf("w:") === 0 ? "word" : "phoneme",
      phoneme: item.answer && item.answer.length === 1 ? item.answer : null,
      accept: item.word ? [item.word] : [item.answer],
      speech: item.speech,
      clips: item.clips || [],
      answer: item.answer || item.word,
      options: item.options || item.letters,
      picture: item.picture,
      word: item.word,
      letters: item.letters,
      bank: item.bank,
    }));
  },

  present(step) {
    this.step = step;
    this.filled = [];
    const view = this["view_" + step.game];
    main.innerHTML = `<div class="play mini">${view.call(this, step)}${skipHTML()}</div>`;
    updateMic(step);
  },

  piece(label, extra) {
    return `<button type="button" class="piece ${extra || ""}" ${extra || ""}>${label}</button>`;
  },

  view_pop(step) {
    const balls = shuffled(step.options).map((letter, i) => {
      return `<button type="button" class="balloon b${i}" data-key="${esc(letter)}" aria-label="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p><div class="sky-play">${balls}</div>`;
  },

  view_bubble(step) {
    const balls = shuffled(step.options).map((letter, i) => {
      return `<button type="button" class="bubble b${i}" data-key="${esc(letter)}" aria-label="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p><div class="pond">${balls}</div>`;
  },

  view_feed(step) {
    const cards = shuffled(step.options).map((word) => {
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
      <div class="train"><span class="engine">🚂</span>${cars}</div>
      <div class="pieces">${bits}</div>`;
  },

  view_hop(step) {
    const stones = step.letters.map((letter, index) => `<div class="stone" data-slot="${index}"></div>`).join("");
    const bits = shuffled(step.letters.slice()).map((letter) => {
      return `<button type="button" class="piece" data-letter="${esc(letter)}">${esc(letter)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      <div class="path">${stones}<div class="prize">${PICS[step.picture] || ""}</div></div>
      <div class="pieces">${bits}</div>`;
  },

  view_fish(step) {
    const fish = shuffled(step.options).map((word, i) => {
      return `<button type="button" class="piece fish f${i}" data-key="${esc(word)}">${esc(word)}</button>`;
    }).join("");
    return `<p class="prompt" id="prompt">${esc(step.speech)}</p>
      <div class="sea">
        ${fish}
        <div class="net" data-slot="net" data-accept="${esc(step.answer)}">${PICS[step.picture] || ""}</div>
      </div>`;
  },

  view_mystery(step) {
    const boxes = shuffled(step.options).map((word) => {
      return `<div class="gift" data-slot="${esc(word)}">🎁</div>`;
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
    if (!step || Game.lock || piece.disabled) return;
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
          const prize = document.querySelector(".prize");
          if (prize) prize.classList.add("show");
          succeed(step, { spoken: false, clean: true });
        }
        return;
      }
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

  tap(button) {
    const step = this.step;
    if (!step || Game.lock) return;
    if (button.dataset.key === step.answer) {
      button.classList.add("popped");
      succeed(step, { spoken: false, clean: true });
      return;
    }
    button.classList.add("wiggle");
    this.goofy();
  },
};
