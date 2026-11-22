/* Maeve Reads — Chapter 1. Tap or say the answer. */
const STICKERS = ["🌸", "🦋", "🌈", "🍪", "🎈", "🐥", "🍓", "🌙", "🍀", "🎀", "🌻", "⭐"];

const Game = {
  screen: "start",
  node: null,
  skill: null,
  steps: [],
  index: 0,
  step: null,
  token: 0,
  lock: false,
  misses: 0,
  forceAnswer: false,
  nudged: false,
  idle: null,
  phase: "pick",
  blend: null,
  hello: false,
  shot: false,
  shotAt: 0,
  micBlocked: false,
  masteredAtStart: false,
  resetArm: false,
};

const main = document.getElementById("main");

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function soundId(letter) {
  if (LETTERS[letter] && LETTERS[letter].clip) return LETTERS[letter].clip;
  return letter;
}

function activePath() {
  return Progress.data.chapter === 1 ? PATH : PATH2;
}

function nodeDone(node) {
  if (!node) return false;
  if (node.id === "robot") return Progress.isMastered("robot1") && Progress.isMastered("robot2");
  return Progress.isMastered(node.id);
}

function isUnlocked(index) {
  const node = activePath()[index];
  if (node && node.free) return true;
  if (index <= 0) return true;
  return nodeDone(activePath()[index - 1]);
}

function currentIndex() {
  const path = activePath();
  return path.findIndex((node, index) => !node.free && isUnlocked(index) && !nodeDone(node));
}

function hereLine() {
  if ((Progress.data.chapter || 2) === 1) return "You are here. Chapter 1. First sounds.";
  return "You are here. Chapter 2. We read words.";
}

function norm(text) {
  return String(text || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matches(alts, accept) {
  const wanted = (accept || []).map(norm).filter(Boolean);
  return (alts || []).some((alt) => {
    const heard = norm(alt);
    if (!heard) return false;
    const parts = heard.split(" ");
    return wanted.some((word) => heard === word || parts.indexOf(word) !== -1);
  });
}

function micOn() {
  return AudioBus.micSupported() && Progress.data.mic && !Game.micBlocked;
}

function decorate(step) {
  let line = step.speech || "";
  if (Game.hello && step.skill === "rhyme" && step.type === "model") {
    line = "Hi Maeve! I am Pip. " + line;
    Game.hello = false;
  }
  if (step.voice && micOn() && !Progress.data.micTold) {
    Progress.data.micTold = true;
    Progress.save();
    line += " You can say it, or tap.";
  }
  return line;
}

function pipsHTML() {
  const scored = Game.steps.map((step, index) => ({ step, index })).filter((item) => item.step.score !== false);
  const done = scored.filter((item) => item.index < Game.index).length;
  return scored.map((item, index) => `<i class="${index < done ? "on" : ""}"></i>`).join("");
}

function choiceHTML(choice) {
  if (choice.letter) {
    return `<button type="button" class="choice letter" data-key="${esc(choice.letter)}" aria-label="${esc(choice.letter)}">${esc(choice.letter)}</button>`;
  }
  return `<button type="button" class="choice" data-key="${esc(choice.key)}" aria-label="${esc(choice.key)}">${choice.emoji}</button>`;
}

function beadsHTML(count) {
  let html = "";
  for (let i = 0; i < count; i += 1) html += '<i class="bead"></i>';
  return `<div class="beads">${html}</div>`;
}

function swoopHTML(ready) {
  return `<button type="button" class="swoop${ready ? " pulse" : ""}" id="swoop" aria-label="Swoop the sounds together">
    <svg viewBox="0 0 140 46" width="190" height="46" aria-hidden="true">
      <path d="M8 32 Q48 4 128 22" stroke="white" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M112 8 L132 22 L110 30" fill="white"/>
    </svg>
  </button>`;
}

function updateMic(step) {
  const mic = document.getElementById("mic");
  const blendPick = step && step.type === "blend" && Game.phase === "pick";
  const sayTypes = step && (step.type === "choice" || step.type === "wedo" || step.type === "read" || step.type === "sentence" || step.type === "spell");
  const show = !!(step && step.voice && micOn() && (sayTypes || blendPick) && !(step.type === "sentence" && step.mode === "model" && !(step.choices || []).length));
  mic.hidden = !show;
}

function renderChrome() {
  document.getElementById("starcount").textContent = String(Progress.data.stars || 0);
  document.getElementById("home").hidden = Game.screen !== "map";
  const nav = document.getElementById("round-nav");
  if (nav) nav.hidden = Game.screen !== "play";
  document.body.dataset.screen = Game.screen;
}

function renderStep(step) {
  const line = esc(step._line || step.speech || "");
  if (step.type === "model") {
    const pictures = (step.emojis || []).map((emoji) => `<div class="big-emoji">${emoji}</div>`).join("");
    const letter = step.letter
      ? `<div class="giant-letter static">${esc(step.letter)}</div><div class="big-emoji">${step.emoji || ""}</div>`
      : "";
    main.innerHTML = `<div class="play">
      <p class="prompt" id="prompt">${line}</p>
      ${step.beads ? beadsHTML(step.beads) : ""}
      <div class="stage-row">${pictures}${letter}</div>
      <button class="star-next" id="next" type="button" aria-label="Next">★</button>
      ${skipHTML()}
    </div>`;
    return;
  }
  if (step.type === "wedo") {
    main.innerHTML = `<div class="play">
      <p class="prompt" id="prompt">${line}</p>
      <button class="giant-letter" id="wedo" type="button" aria-label="Say the sound">${esc(step.letter)}</button>
      <div class="big-emoji">${step.emoji || ""}</div>
      ${skipHTML()}
    </div>`;
    return;
  }
  main.innerHTML = `<div class="play">
    <div class="pips">${pipsHTML()}</div>
    <p class="prompt" id="prompt">${line}</p>
    ${step.beads ? beadsHTML(step.beads) : ""}
    <div class="choices">${(step.choices || []).map(choiceHTML).join("")}</div>
    ${skipHTML()}
  </div>`;
}

function renderBlend(step, state) {
  const letters = step.letters.map((letter, index) => {
    const on = state.litLetters && state.litLetters.indexOf(index) !== -1;
    const next = state.next === index;
    return `<button type="button" class="blend-letter${on ? " on" : ""}${next ? " next" : ""}" data-i="${index}" aria-label="${esc(letter)}">${esc(letter)}</button>`;
  }).join("");
  const choices = state.showChoices
    ? `<div class="choices">${(step.choices || []).map(choiceHTML).join("")}</div>`
    : "";
  const star = state.done ? '<button class="star-next" id="next" type="button" aria-label="Next">★</button>' : "";
  main.innerHTML = `<div class="play">
    <div class="pips">${pipsHTML()}</div>
    <p class="prompt" id="prompt">${esc(step._line || step.speech || "")}</p>
    <div class="blend-row">${letters}</div>
    ${state.showSwoop ? swoopHTML(!!state.ready) : ""}
    ${choices}
    ${star}
    ${skipHTML()}
  </div>`;
}

function setBead(index) {
  document.querySelectorAll(".bead").forEach((bead, beadIndex) => {
    bead.classList.toggle("on", beadIndex <= index);
  });
}

function revealChoices() {
  const box = document.querySelector(".choices");
  if (box) box.classList.remove("hidden");
}

function markAnswer(answer) {
  document.querySelectorAll(".choice").forEach((button) => {
    if (button.dataset.key === String(answer)) button.classList.add("good");
  });
}

function confetti(big) {
  const root = document.getElementById("confetti");
  root.innerHTML = "";
  const colors = ["#ff7a59", "#ffc857", "#3cba6e", "#4aa3d8", "#f48fb1", "#fff"];
  const count = big ? 36 : 16;
  for (let i = 0; i < count; i += 1) {
    const bit = document.createElement("i");
    bit.style.left = Math.random() * 100 + "%";
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = Math.random() * 0.25 + "s";
    bit.style.transform = "rotate(" + Math.floor(Math.random() * 80) + "deg)";
    root.appendChild(bit);
  }
  setTimeout(() => { root.innerHTML = ""; }, 1600);
}

function armIdle() {
  clearTimeout(Game.idle);
}

function skipHTML() {
  return "";
}

function targetButton(emoji) {
  if (!emoji) return "";
  return `<button type="button" id="replay-target" class="target-pic" aria-label="Hear it again">${emoji}</button>`;
}

function recoverRound() {
  Game.lock = false;
  Game.misses = 0;
  Game.forceAnswer = false;
  Game.spell = null;
  Game.blend = null;
  Game.phase = "pick";
  press = null;
  if (ghost) {
    ghost.remove();
    ghost = null;
  }
  if (typeof PlaySets !== "undefined") {
    PlaySets.filled = [];
    PlaySets.misses = 0;
    if (PlaySets.stopHint) PlaySets.stopHint();
  }
  document.querySelectorAll("button.pressed").forEach((button) => button.classList.remove("pressed"));
  const mic = document.getElementById("mic");
  if (mic) mic.classList.remove("listening");
  AudioBus.stop();
}

function retryRound() {
  recoverRound();
  Game.token += 1;
  presentStep();
}

function backRound() {
  recoverRound();
  if (Game.index <= 0) {
    showMap({ speak: "Tap the glowing game." });
    return;
  }
  Game.index -= 1;
  Game.token += 1;
  presentStep();
}

function skipRound() {
  recoverRound();
  Game.token += 1;
  nextStep();
}

async function runAudio(step, my) {
  AudioBus.arm();
  const clips = step.clips || [];
  for (let i = 0; i < clips.length; i += 1) {
    if (my !== Game.token) return;
    if (step.beads && i < step.beads) setBead(i);
    await AudioBus.playClip(clips[i]);
    await AudioBus.wait(step.gap == null ? 150 : step.gap);
  }
  if (my !== Game.token) return;
  if (step._line) await AudioBus.speak(step._line);
}

async function presentStep() {
  const my = ++Game.token;
  const step = Game.steps[Game.index];
  if (!step) {
    celebrate();
    return;
  }
  Game.step = step;
  Game.lock = false;
  Game.ready = step.type !== "play" || !!Game.shot;
  Game.misses = 0;
  Game.forceAnswer = false;
  Game.nudged = false;
  clearTimeout(Game.idle);
  if (!step._line) step._line = decorate(step);
  AudioBus.stop();
  document.getElementById("pip").classList.remove("yay");
  if (step.type === "blend") {
    await presentBlend(step, my);
    renderChrome();
    return;
  }
  if (step.type === "read") {
    presentRead(step);
    renderChrome();
    if (!Game.shot) {
      await runAudio(step, my);
      if (my === Game.token) armIdle();
    }
    return;
  }
  if (step.type === "spell") {
    Game.spell = {
      word: step.word,
      filled: step.mode === "model" ? step.letters.slice() : [],
      left: step.mode === "model" ? [] : (step.bank || []).slice(),
      misses: 0,
    };
    presentSpell(step);
    renderChrome();
    if (!Game.shot && step.mode !== "model") {
      await runAudio(step, my);
      if (my === Game.token) armIdle();
    }
    return;
  }
  if (step.type === "play") {
    PlaySets.present(step);
    renderChrome();
    const release = () => {
      if (my === Game.token) PlaySets.unlock();
    };
    if (Game.shot) {
      PlaySets.unlock();
      if (step.game === "reader") AudioBus.seaStart();
      return;
    }
    const fail = setTimeout(release, 2200);
    await runAudio(step, my);
    clearTimeout(fail);
    release();
    if (my === Game.token && step.game === "reader") AudioBus.seaStart();
    return;
  }
  if (step.type === "sentence") {
    presentSentence(step);
    renderChrome();
    if (!Game.shot) {
      await runAudio(step, my);
      if (my === Game.token && step.mode === "model") {
        /* star is already on screen */
      }
      if (my === Game.token) armIdle();
    }
    return;
  }
  Game.phase = "pick";
  renderStep(step);
  updateMic(step);
  renderChrome();
  if (Game.shot) {
    revealChoices();
    return;
  }
  const failsafe = setTimeout(() => {
    if (my === Game.token) revealChoices();
  }, 9000);
  await runAudio(step, my);
  clearTimeout(failsafe);
  if (my !== Game.token) return;
  if (step.type === "model") nextStep();
}

async function presentBlend(step, my) {
  const open = step.fade === "open" && step.mode === "you";
  Game.phase = "tap";
  Game.blend = { next: open ? step.letters.length : 0, lit: [], ready: open, open };
  updateMic(step);
  if (Game.shot) {
    const all = step.letters.map((_, index) => index);
    renderBlend(step, { litLetters: all, next: 99, showSwoop: true, showChoices: true, ready: true });
    updateMic(step);
    return;
  }
  if (step.mode === "model") {
    renderBlend(step, { litLetters: [], next: -1, showSwoop: false, showChoices: false });
    await AudioBus.speak(step._line);
    for (let i = 0; i < step.letters.length; i += 1) {
      if (my !== Game.token) return;
      const lit = [];
      for (let j = 0; j <= i; j += 1) lit.push(j);
      renderBlend(step, { litLetters: lit, next: -1, showSwoop: false, showChoices: false });
      await AudioBus.playClip(soundId(step.letters[i]));
      await AudioBus.wait(160);
    }
    if (my !== Game.token) return;
    await AudioBus.whoosh();
    await AudioBus.playClip("w:" + step.word);
    if (my !== Game.token) return;
    const lit = step.letters.map((_, index) => index);
    renderBlend(step, { litLetters: lit, next: -1, showSwoop: false, showChoices: true, done: true });
    if (my === Game.token) nextStep();
    return;
  }
  renderBlend(step, {
    litLetters: [],
    next: open ? -1 : 0,
    showSwoop: true,
    showChoices: false,
    ready: open,
  });
  await AudioBus.speak(step._line);
  if (my === Game.token) armIdle();
}

function litNow() {
  return (Game.blend && Game.blend.lit) ? Game.blend.lit.slice() : [];
}

function onLetterTap(index) {
  const step = Game.step;
  if (!step || step.type !== "blend" || step.mode === "model" || Game.lock) return;
  if (Game.phase === "pick") return;
  if (Game.blend.open) {
    AudioBus.playClip(soundId(step.letters[index]));
    if (Game.blend.lit.indexOf(index) === -1) Game.blend.lit.push(index);
    renderBlend(step, {
      litLetters: litNow(),
      next: -1,
      showSwoop: true,
      showChoices: false,
      ready: true,
    });
    return;
  }
  if (!Game.blend || Game.blend.next !== index) {
    AudioBus.playClip(soundId(step.letters[index]));
    return;
  }
  Game.blend.lit.push(index);
  Game.blend.next += 1;
  Game.blend.ready = Game.blend.next >= step.letters.length;
  AudioBus.playClip(soundId(step.letters[index]));
  renderBlend(step, {
    litLetters: litNow(),
    next: Game.blend.ready ? -1 : Game.blend.next,
    showSwoop: true,
    showChoices: false,
    ready: Game.blend.ready,
  });
}

async function onSwoop() {
  const step = Game.step;
  if (!step || step.type !== "blend" || Game.lock || Game.phase === "pick") return;
    if (!Game.blend || !Game.blend.ready) {
    const next = Game.blend ? Game.blend.next : 0;
    if (step.letters[next]) await AudioBus.playClip(soundId(step.letters[next]));
    return;
  }
  Game.lock = true;
  const my = ++Game.token;
  clearTimeout(Game.idle);
  try {
    await AudioBus.whoosh();
    await AudioBus.playClip("w:" + step.word);
    if (my !== Game.token) return;
    step._line = "What word is it?";
    if (step.mode === "you") await AudioBus.speak("What word is it?");
    if (my !== Game.token || Game.step !== step) return;
    Game.phase = "pick";
    renderBlend(step, {
      litLetters: step.letters.map((_, index) => index),
      next: -1,
      showSwoop: false,
      showChoices: true,
    });
    updateMic(step);
    armIdle();
  } finally {
    Game.lock = false;
  }
}

function succeed(step, opts) {
  if (Game.lock) return;
  Game.lock = true;
  clearTimeout(Game.idle);
  AudioBus.stop();
  const spoken = !!opts.spoken;
  const clean = !!opts.clean;
  if (spoken) {
    Progress.data.stars = (Progress.data.stars || 0) + 1;
    AudioBus.chime(true);
    confetti(true);
  } else {
    AudioBus.chime(false);
    confetti(false);
  }
  if (step.score !== false) {
    Progress.record(step.skill, clean);
    if (step.recordAlso && step.recordAlso !== step.skill) Progress.record(step.recordAlso, clean);
  } else if (spoken) {
    Progress.save();
  }
  renderChrome();
  markAnswer(step.answer);
  AudioBus.speak(spoken ? "You said it!" : "Yes!");
  setTimeout(() => {
    Game.lock = false;
    nextStep();
  }, spoken ? 1000 : 780);
}

function scaffold(step) {
  Game.misses += 1;
  if (Game.misses === 1) {
    const wrong = Array.from(document.querySelectorAll(".choice")).filter((button) => button.dataset.key !== String(step.answer));
    if (wrong.length > 1) wrong[0].remove();
    AudioBus.speak("Listen again.");
    const my = ++Game.token;
    runAudio(step, my);
    return;
  }
  Game.forceAnswer = true;
  AudioBus.speak("This one.");
  document.querySelectorAll(".choice").forEach((button) => {
    if (button.dataset.key === String(step.answer)) button.classList.add("show-me");
    else button.classList.add("dim");
  });
}

function onChoice(key) {
  const step = Game.step;
  if (!step || Game.lock) return;
  if (step.type === "blend" && step.mode === "model") {
    nextStep();
    return;
  }
  if (step.type === "blend" && Game.phase !== "pick") return;
  if (Game.forceAnswer && key !== String(step.answer)) {
    AudioBus.speak("This one.");
    return;
  }
  if (key === String(step.answer)) succeed(step, { spoken: false, clean: Game.misses === 0, fromClick: true });
  else scaffold(step);
}

async function onMic() {
  const step = Game.step;
  if (!step || !step.voice || Game.lock || !micOn()) return;
  if (document.getElementById("mic").classList.contains("listening")) {
    AudioBus.abortListen();
    return;
  }
  AudioBus.stop();
  const alts = await AudioBus.listen();
  if (Game.step !== step || Game.lock) return;
  if (alts == null) return;
  if (alts === "denied") {
    Game.micBlocked = true;
    updateMic(step);
    AudioBus.speak("We can tap.");
    return;
  }
  if (!alts.length) {
    AudioBus.speak("Let's try tapping!");
    return;
  }
  if (step.type === "spell") {
    if (matches(alts, step.accept || [step.answer])) AudioBus.speak("Yes! Now tap the letters.");
    else AudioBus.speak("Let's try tapping!");
    return;
  }
  if (matches(alts, step.accept || [step.answer])) {
    if (step.type === "wedo") {
      Progress.data.stars = (Progress.data.stars || 0) + 1;
      Progress.save();
      renderChrome();
      AudioBus.chime(true);
      confetti(true);
      AudioBus.speak("You said it!");
      setTimeout(nextStep, 900);
      return;
    }
    succeed(step, { spoken: true, clean: Game.misses === 0 });
    return;
  }
  if (step.voice === "word" && step.phoneme && LETTERS[step.phoneme] && matches(alts, LETTERS[step.phoneme].accept)) {
    AudioBus.playClip(soundId(step.phoneme));
    AudioBus.speak("Yes! Now tap the picture.");
    return;
  }
  AudioBus.speak("Let's try tapping!");
}

function onWedo() {
  const step = Game.step;
  if (!step || Game.lock) return;
  Game.lock = true;
  AudioBus.playClip(soundId(step.letter || "s")).then(() => {
    AudioBus.chime(false);
    AudioBus.speak("Yes!");
    setTimeout(() => {
      Game.lock = false;
      nextStep();
    }, 700);
  });
}

function nextStep() {
  Game.index += 1;
  if (Game.index >= Game.steps.length) celebrate();
  else presentStep();
}

function celeHTML(sticker, line) {
  return `<div class="play">
    <p class="prompt" id="prompt">${esc(line)}</p>
    <div class="sticker-big">${sticker}</div>
    <div class="cele-actions">
      <button id="rest" class="big-btn rest" type="button" aria-label="All done">🏠</button>
      <button id="more" class="big-btn more" type="button" aria-label="Play more">▶</button>
      <button id="again" class="big-btn again" type="button" aria-label="Play again">↻<span>Play again!</span></button>
    </div>
  </div>`;
}

function celebrate() {
  const was = Game.masteredAtStart;
  const now = Progress.isMastered(Game.skill);
  const sticker = STICKERS[Progress.data.stickers.length % STICKERS.length];
  Progress.data.stickers.push(sticker);
  Progress.data.stars = (Progress.data.stars || 0) + 1;
  Progress.save();
  Game.screen = "cele";
  const finished = activePath().every(nodeDone);
  const chapterName = Progress.data.chapter === 1 ? "Chapter 1" : "Chapter 2";
  let line = "Great playing, Maeve! You earned a sticker. We can rest, or play some more.";
  if (finished && now && !was) line = "You did it, Maeve! " + chapterName + " is complete! We can rest now.";
  else if (now && !was) line = "You did it, Maeve! You earned a sticker. We can rest now.";
  document.getElementById("pip").classList.add("yay");
  updateMic(null);
  main.innerHTML = celeHTML(sticker, line);
  renderChrome();
  confetti(true);
  AudioBus.speak(line);
}

function onMore() {
  const path = activePath();
  const idx = path.findIndex((node) => node.id === Game.node);
  if (idx >= 0 && nodeDone(path[idx]) && idx < path.length - 1) {
    startSkill(path[idx + 1].id);
    return;
  }
  if (idx >= 0 && !nodeDone(path[idx])) {
    startSkill(Game.node);
    return;
  }
  startSkill(Game.node || "rhyme");
}

function replay() {
  AudioBus.unlock();
  if (Game.screen === "start") {
    AudioBus.speak("Tap the big button to play.");
    return;
  }
  if (Game.screen === "picker") {
    AudioBus.speak(hereLine());
    return;
  }
  if (Game.screen === "map") {
    AudioBus.speak("Tap the glowing game.");
    return;
  }
  if (Game.screen === "cele") {
    AudioBus.speak("You can rest, or play some more.");
    return;
  }
  const step = Game.step;
  if (!step) return;
  AudioBus.stop();
  if (step.game === "reader" || step.game === "pizza" || step.game === "sandwich" || step.game === "sort") {
    AudioBus.speak(step.speech || "Read the word.");
    if (step.game === "reader" && Game.ready) AudioBus.seaStart();
    return;
  }
  const clip = (step.clips && step.clips[0]) || (step.word ? "w:" + step.word : "");
  if (clip) {
    AudioBus.playClip(clip);
    return;
  }
  AudioBus.speak(step._line || step.speech || "Tap the picture.");
}

function renderMap() {
  const path = activePath();
  const current = currentIndex();
  const chapter = Progress.data.chapter === 1 ? 1 : 2;
  const title = chapter === 1 ? "Chapter 1" : "Chapter 2";
  const sub = chapter === 1 ? "First sounds" : "Read words";
  const nodes = path.map((node, index) => {
    const unlocked = isUnlocked(index);
    const done = nodeDone(node);
    const cls = [
      "node",
      unlocked ? "" : "locked",
      done ? "done" : "",
      index === current ? "current" : "",
    ].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-i="${index}" aria-label="${esc(node.label)}">
      <span class="ico">${node.icon}</span>
      <span class="lbl">${esc(node.label)}</span>
    </button>`;
  }).join("");
  const stickers = Progress.data.stickers.length
    ? Progress.data.stickers.map((sticker) => `<span>${sticker}</span>`).join("")
    : '<span class="empty">Stickers will show up here.</span>';
  main.innerHTML = `<div class="map">
    <div class="map-head">
      <h2>${title}</h2>
      <p>${sub}</p>
    </div>
    <div class="nodes">${nodes}</div>
    <div class="stickers"><b>Stickers</b>${stickers}</div>
  </div>`;
}

function renderPicker() {
  const here = Progress.data.chapter || 2;
  const cards = [
    { n: 1, icon: "👂", name: "Sounds", note: "Chapter 1" },
    { n: 2, icon: "📖", name: "Words", note: "Chapter 2" },
    { n: 3, icon: "🔒", name: "Stories", note: "Chapter 3" },
  ].map((card) => {
    const cls = ["chapter-card", card.n === here ? "here" : "", card.n === 3 ? "locked" : ""].filter(Boolean).join(" ");
    const badge = card.n === here ? '<div class="here-badge">You are here</div>' : "";
    return `<button type="button" class="${cls}" data-chapter="${card.n}" aria-label="${esc(card.note)} ${esc(card.name)}${card.n === here ? ", you are here" : ""}">
      ${badge}
      <span class="num">${card.n}</span>
      <span class="ico">${card.icon}</span>
      <h2>${esc(card.name)}</h2>
    </button>`;
  }).join("");
  main.innerHTML = `<div class="picker">${cards}</div>`;
}

function showPicker(opts) {
  closeGrownup();
  Game.screen = "picker";
  Game.token += 1;
  AudioBus.stop();
  document.getElementById("pip").classList.remove("yay");
  updateMic(null);
  renderPicker();
  renderChrome();
  let line = hereLine();
  if (opts && opts.hello) line = "Hi Maeve! I am Pip. " + line;
  if (!Game.shot) AudioBus.speak(line);
}

function enterChapter(n) {
  if (n === 3) {
    AudioBus.speak("Chapter 3 is coming soon.");
    const card = document.querySelector('.chapter-card.locked');
    if (card) {
      card.classList.remove("wiggle");
      void card.offsetWidth;
      card.classList.add("wiggle");
    }
    return;
  }
  Progress.data.chapter = n;
  Progress.save();
  showMap({
    speak: n === 1 ? "Chapter 1. First sounds. Tap the glowing game." : "Chapter 2. Let's read words. Tap the glowing game.",
  });
}

function showMap(opts) {
  closeGrownup();
  Game.screen = "map";
  Game.token += 1;
  AudioBus.stop();
  document.getElementById("pip").classList.remove("yay");
  updateMic(null);
  renderMap();
  renderChrome();
  if (opts && opts.speak) {
    AudioBus.speak(typeof opts.speak === "string" ? opts.speak : "Tap the glowing game.");
  }
}

function showStart() {
  Game.screen = "start";
  updateMic(null);
  document.getElementById("pip").classList.remove("yay");
  main.innerHTML = `<div class="start">
    <h1>Hi, Maeve!</h1>
    <p class="sub">Let's play with sounds.</p>
    <button id="play" class="play-btn" type="button" aria-label="Play">▶</button>
  </div>`;
  renderChrome();
}

function freshPlayer() {
  const skills = Progress.data.skills || {};
  const tries = Object.keys(skills).some((id) => skills[id].tries > 0);
  return Progress.data.stickers.length === 0 && !tries;
}

function onPlay() {
  AudioBus.unlock();
  showPicker({ hello: freshPlayer() });
}

function startSkill(id) {
  closeGrownup();
  AudioBus.unlock();
  let skill = id;
  let node = id;
  if (id === "robot") {
    skill = Progress.isMastered("robot1") ? "robot2" : "robot1";
    node = "robot";
  } else if (id === "robot1" || id === "robot2") {
    node = "robot";
  }
  Game.node = node;
  Game.skill = skill;
  Game.masteredAtStart = Progress.isMastered(skill);
  Game.steps = Session.build(skill);
  Game.index = 0;
  if (Game.shot && Game.shotAt) {
    Game.index = Math.min(Game.shotAt, Game.steps.length - 1);
  }
  Game.screen = "play";
  document.getElementById("pip").classList.remove("yay");
  presentStep();
  Progress.data.spin = (Progress.data.spin || 0) + 1;
  Progress.save();
  renderChrome();
}

function onNode(index) {
  const node = activePath()[index];
  if (!node) return;
  if (!isUnlocked(index)) {
    AudioBus.speak("That game is still sleeping. Tap the glowing one.");
    const current = document.querySelector(".node.current");
    if (current) {
      current.classList.remove("wiggle");
      void current.offsetWidth;
      current.classList.add("wiggle");
    }
    return;
  }
  startSkill(node.id);
}

function skillLine(id, label) {
  const skill = Progress.data.skills[id];
  if (!skill) return `<li><b>${esc(label)}</b> — not yet</li>`;
  const dots = (skill.recent || []).slice(-5).map((n) => (n ? "★" : "·")).join(" ");
  return `<li><b>${esc(label)}</b> — ${skill.mastered ? "Got it" : "Learning"} <span>${dots || "new"}</span> <small>${skill.correct}/${skill.tries}</small></li>`;
}

function openGrownup() {
  Game.resetArm = false;
  const sounds = LETTER_ORDER.map((id) => skillLine(id, id + " · " + LETTERS[id].said)).join("");
  const ears = ["rhyme", "first", "robot1", "robot2", "sat", "words"]
    .concat(PATH2.map((node) => node.id))
    .map((id) => skillLine(id, id))
    .join("");
  const tries = PATH.concat(PATH2).map((node) => `<button type="button" class="try" data-go="${esc(node.id)}">${node.icon} ${esc(node.label)}</button>`).join("");
  const micNote = AudioBus.micSupported()
    ? "The microphone uses the browser's built-in speech recognition. This game does not record, save, or upload her voice. Chrome may send audio to Google to recognize speech."
    : "This browser has no speech recognition. Tapping still works everywhere.";
  const overlay = document.getElementById("overlay");
  overlay.hidden = false;
  overlay.innerHTML = `<div class="panel" role="dialog" aria-label="Grown-up corner">
    <div class="panel-top">
      <h2>Grown-up corner</h2>
      <button type="button" class="chip" id="close-grown">Done</button>
    </div>
    <p>Press and hold the leaf to open this. Maeve does not need to read it.</p>
    <div class="row-actions">
      <button type="button" class="chip" id="mic-toggle">${Progress.data.mic ? "Microphone is on" : "Microphone is off"}</button>
      <button type="button" class="chip danger" id="reset-progress">Erase progress</button>
    </div>
    <h3>Sounds</h3>
    <ul>${sounds}</ul>
    <h3>Games</h3>
    <ul>${ears}</ul>
    <p>A sound is solid after about 4 of the last 5 tries are correct on the first tap. Then the next game glows.</p>
    <h3>Try a game</h3>
    <div class="try-row">${tries}</div>
    <h3>Practice away from the screen</h3>
    <ul>
      <li>Say the pure sound. sss, not suh, and not the letter name ess.</li>
      <li>In the car: I spy something that starts with sss.</li>
      <li>At bedtime, rhyme on purpose. cat, hat, bat, lat.</li>
      <li>Robot talk: you say the sounds, she says the word.</li>
      <li>Point to lowercase letters in picture books.</li>
      <li>Stop while she is still smiling. Short and happy wins.</li>
    </ul>
    <p>${esc(micNote)}</p>
  </div>`;
}

function closeGrownup() {
  const overlay = document.getElementById("overlay");
  overlay.hidden = true;
  overlay.innerHTML = "";
}

function wordHTML(letters) {
  return letters.map((letter) => `<span>${esc(letter)}</span>`).join("");
}

function presentRead(step) {
  Game.phase = "pick";
  const star = step.mode === "model"
    ? '<button class="star-next" id="next" type="button" aria-label="Next">★</button>'
    : "";
  main.innerHTML = `<div class="play">
    <div class="pips">${pipsHTML()}</div>
    <p class="prompt" id="prompt">${esc(step._line || step.speech || "")}</p>
    <button type="button" class="big-word" id="help" aria-label="Hear the sounds">${wordHTML(step.letters)}</button>
    <div class="choices">${(step.choices || []).map(choiceHTML).join("")}</div>
    ${star}
    ${skipHTML()}
  </div>`;
  updateMic(step);
}

function presentSpell(step) {
  const slots = step.letters.map((letter, index) => {
    const got = Game.spell.filled[index];
    return `<div class="slot${got ? " on" : ""}">${got ? esc(got) : ""}</div>`;
  }).join("");
  const bank = Game.spell.left.map((letter, index) => {
    const need = step.letters[Game.spell.filled.length];
    const hint = Game.spell.misses >= 2 && letter === need ? " show-me" : "";
    return `<button type="button" class="bank-letter${hint}" data-letter="${esc(letter)}" data-bank="${index}" aria-label="${esc(letter)}">${esc(letter)}</button>`;
  }).join("");
  const star = step.mode === "model"
    ? '<button class="star-next" id="next" type="button" aria-label="Next">★</button>'
    : "";
  main.innerHTML = `<div class="play">
    <div class="pips">${pipsHTML()}</div>
    <p class="prompt" id="prompt">${esc(step._line || step.speech || "")}</p>
    ${targetButton(PICS[step.word])}
    <div class="slots">${slots}</div>
    <div class="bank">${bank}</div>
    ${star}
    ${skipHTML()}
  </div>`;
  updateMic(step);
}

function tryPlace(letter) {
  const step = Game.step;
  if (!step || step.type !== "spell" || step.mode === "model" || Game.lock || !Game.spell) return;
  const need = step.letters[Game.spell.filled.length];
  if (letter === need) {
    Game.spell.filled.push(letter);
    const at = Game.spell.left.indexOf(letter);
    if (at >= 0) Game.spell.left.splice(at, 1);
    AudioBus.playClip(soundId(letter));
    if (Game.spell.filled.length === step.letters.length) {
      presentSpell(step);
      succeed(step, { spoken: false, clean: Game.spell.misses === 0 });
    } else {
      presentSpell(step);
    }
    return;
  }
  Game.spell.misses += 1;
  const buttons = Array.from(document.querySelectorAll(".bank-letter"));
  buttons.forEach((button) => {
    if (button.dataset.letter === letter) button.classList.add("wiggle");
  });
  if (Game.spell.misses >= 2) {
    AudioBus.speak("This one.");
    presentSpell(step);
  }
}

function presentSentence(step) {
  Game.phase = "pick";
  const chips = (step.words || []).map((word, index) => {
    return `<button type="button" class="word-chip${word.tricky ? " tricky" : ""}" data-word="${index}">${esc(word.text)}</button>`;
  }).join("");
  const star = step.mode === "model"
    ? '<button class="star-next" id="next" type="button" aria-label="Next">★</button>'
    : "";
  const choices = (step.choices || []).length
    ? `<div class="choices">${step.choices.map(choiceHTML).join("")}</div>`
    : "";
  main.innerHTML = `<div class="play">
    <div class="pips">${pipsHTML()}</div>
    <p class="prompt" id="prompt">${esc(step._line || step.speech || "")}</p>
    <div class="sentence">${chips}</div>
    ${choices}
    ${star}
    ${skipHTML()}
  </div>`;
  updateMic(step);
}

async function onHelp() {
  const step = Game.step;
  if (!step || !step.letters) return;
  for (let i = 0; i < step.letters.length; i += 1) {
    await AudioBus.playClip(soundId(step.letters[i]));
    await AudioBus.wait(90);
  }
}

async function onWordChip(index) {
  const step = Game.step;
  const word = step && step.words && step.words[index];
  if (!word) return;
  if (word.tricky) {
    await AudioBus.playClip("w:" + word.say);
    return;
  }
  const letters = word.letters || [];
  for (let i = 0; i < letters.length; i += 1) {
    await AudioBus.playClip(soundId(letters[i]));
    await AudioBus.wait(70);
  }
  await AudioBus.playClip("w:" + word.say);
}

function showSampleCele() {
  Game.screen = "cele";
  Game.node = "rhyme";
  updateMic(null);
  document.getElementById("pip").classList.add("yay");
  main.innerHTML = celeHTML("🌸", "You did it, Maeve! You earned a sticker.");
  renderChrome();
  confetti(true);
}

function boot() {
  Progress.load();
  AudioBus.init();
  const params = new URLSearchParams(location.search);
  Game.shot = params.has("shot");
  Game.shotAt = Number(params.get("at") || 0);
  const chapterPick = Number(params.get("chapter"));
  if (chapterPick === 1 || chapterPick === 2) {
    Progress.data.chapter = chapterPick;
    Progress.save();
  }
  const go = params.get("go");
  if (go === "map") showMap();
  else if (go === "picker") showPicker();
  else if (go === "yay") showSampleCele();
  else if (go === "grown") {
    showMap();
    openGrownup();
  } else if (go) startSkill(go);
  else showStart();
  renderChrome();
}

function handleButton(button) {
  AudioBus.unlock();
  if (button.id === "replay") return replay();
  if (button.id === "home") return showPicker();
  if (button.id === "mic") return onMic();
  if (button.id === "play") return onPlay();
  if (button.id === "next" || button.id === "skip" || button.id === "nav-next") return skipRound();
  if (button.id === "nav-back") return backRound();
  if (button.id === "nav-retry" || button.id === "replay-target") return button.id === "nav-retry" ? retryRound() : replay();
  if (button.id === "nav-home") return showMap({ speak: "Tap the glowing game." });
  if (button.id === "wedo") return onWedo();
  if (button.id === "swoop") return onSwoop();
  if (button.id === "help") return onHelp();
  if (button.id === "rest") return showMap({ speak: "You got a sticker. Tap the glowing game when you want to play." });
  if (button.id === "more") return onMore();
  if (button.id === "again") return startSkill(Game.skill || Game.node);
  if (button.id === "hint") return PlaySets.sayHint();
  if (button.classList.contains("sort-box")) return PlaySets.tapSort(button);
  if (button.id === "close-grown") return closeGrownup();
  if (button.id === "mic-toggle") {
    Progress.data.mic = !Progress.data.mic;
    Progress.save();
    Game.micBlocked = false;
    openGrownup();
    updateMic(Game.step);
    return;
  }
  if (button.id === "reset-progress") {
    if (!Game.resetArm) {
      Game.resetArm = true;
      button.textContent = "Tap again to erase";
      return;
    }
    Progress.reset();
    closeGrownup();
    showStart();
    renderChrome();
    return;
  }
  if (button.classList.contains("try")) return startSkill(button.dataset.go);
  if (button.classList.contains("balloon") || button.classList.contains("bubble")) return PlaySets.tap(button);
  if (button.classList.contains("choice")) return onChoice(button.dataset.key);
  if (button.classList.contains("blend-letter")) return onLetterTap(Number(button.dataset.i));
  if (button.classList.contains("node")) return onNode(Number(button.dataset.i));
  if (button.classList.contains("chapter-card")) return enterChapter(Number(button.dataset.chapter));
  if (button.classList.contains("word-chip")) return onWordChip(Number(button.dataset.word));
}

let press = null;
let ghost = null;

function clearPressVisual() {
  document.querySelectorAll("button.pressed").forEach((button) => button.classList.remove("pressed"));
}

function moveGhost(x, y) {
  if (!ghost) return;
  ghost.style.left = x + "px";
  ghost.style.top = y + "px";
}

document.addEventListener("pointerdown", (event) => {
  AudioBus.unlock();
  const button = event.target.closest("button");
  press = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    button,
    moved: false,
    drag: !!(button && (button.classList.contains("bank-letter") || button.classList.contains("piece"))),
  };
  if (button) button.classList.add("pressed");
  if (press.drag) {
    try { button.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
    ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.textContent = button.textContent;
    document.body.appendChild(ghost);
    moveGhost(event.clientX, event.clientY);
  }
}, true);

document.addEventListener("pointermove", (event) => {
  if (!press || event.pointerId !== press.id) return;
  if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) press.moved = true;
  if (press.drag) moveGhost(event.clientX, event.clientY);
}, true);

document.addEventListener("pointerup", (event) => {
  if (!press || event.pointerId !== press.id) return;
  const button = press.button;
  const dragging = press.drag;
  const moved = press.moved;
  const letter = button && button.dataset.letter;
  press = null;
  clearPressVisual();
  if (ghost) {
    ghost.remove();
    ghost = null;
  }
  if (dragging && button && button.classList.contains("piece")) {
    PlaySets.drop(button, event, moved);
    return;
  }
  if (dragging) {
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const onSlots = under && (under.classList.contains("slot") || under.closest(".slots") || under.closest(".bank"));
    if (!moved || onSlots) tryPlace(letter);
    return;
  }
  if (!button || button.id === "grown") return;
  const released = event.target.closest("button");
  if (released === button || !moved) handleButton(button);
}, true);

document.addEventListener("pointercancel", () => {
  press = null;
  clearPressVisual();
  if (ghost) {
    ghost.remove();
    ghost = null;
  }
});

const grown = document.getElementById("grown");
let holdTimer = null;
grown.addEventListener("pointerdown", (event) => {
  try { grown.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
  grown.classList.add("holding");
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    grown.classList.remove("holding");
    openGrownup();
  }, 700);
});
function endHold() {
  clearTimeout(holdTimer);
  grown.classList.remove("holding");
}
grown.addEventListener("pointerup", endHold);
grown.addEventListener("pointercancel", endHold);
document.addEventListener("contextmenu", (event) => event.preventDefault());

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGrownup();
});

boot();
