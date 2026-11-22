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

function nodeDone(node) {
  if (node.id === "robot") return Progress.isMastered("robot1") && Progress.isMastered("robot2");
  return Progress.isMastered(node.id);
}

function isUnlocked(index) {
  if (index <= 0) return true;
  return nodeDone(PATH[index - 1]);
}

function currentIndex() {
  return PATH.findIndex((node, index) => isUnlocked(index) && !nodeDone(node));
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
    line += " You can say it. Tap the microphone. Or tap a picture.";
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
  const show = !!(step && step.voice && micOn() && (step.type !== "blend" || Game.phase === "pick"));
  mic.hidden = !show;
}

function renderChrome() {
  document.getElementById("starcount").textContent = String(Progress.data.stars || 0);
  document.getElementById("home").hidden = Game.screen === "start" || Game.screen === "map";
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
    </div>`;
    return;
  }
  if (step.type === "wedo") {
    main.innerHTML = `<div class="play">
      <p class="prompt" id="prompt">${line}</p>
      <button class="giant-letter" id="wedo" type="button" aria-label="Say the sound">${esc(step.letter)}</button>
      <div class="big-emoji">${step.emoji || ""}</div>
    </div>`;
    return;
  }
  const hidden = Game.shot ? "" : " hidden";
  main.innerHTML = `<div class="play">
    <div class="pips">${pipsHTML()}</div>
    <p class="prompt" id="prompt">${line}</p>
    ${step.beads ? beadsHTML(step.beads) : ""}
    <div class="choices${hidden}">${(step.choices || []).map(choiceHTML).join("")}</div>
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
  Game.idle = setTimeout(() => {
    if (Game.lock || Game.nudged || Game.screen !== "play") return;
    Game.nudged = true;
    replay();
  }, 14000);
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
  if (step.type === "choice") revealChoices();
  armIdle();
}

async function presentBlend(step, my) {
  Game.phase = "tap";
  Game.blend = { next: 0, lit: [], ready: false };
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
      await AudioBus.playClip(step.letters[i]);
      await AudioBus.wait(160);
    }
    if (my !== Game.token) return;
    await AudioBus.whoosh();
    await AudioBus.playClip("w:" + step.word);
    await AudioBus.speak(step.word);
    if (my !== Game.token) return;
    const lit = step.letters.map((_, index) => index);
    renderBlend(step, { litLetters: lit, next: -1, showSwoop: false, showChoices: true, done: true });
    return;
  }
  renderBlend(step, { litLetters: [], next: 0, showSwoop: true, showChoices: false, ready: false });
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
  if (!Game.blend || Game.blend.next !== index) {
    AudioBus.playClip(step.letters[index]);
    return;
  }
  Game.blend.lit.push(index);
  Game.blend.next += 1;
  Game.blend.ready = Game.blend.next >= step.letters.length;
  AudioBus.playClip(step.letters[index]);
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
    if (step.letters[next]) await AudioBus.playClip(step.letters[next]);
    return;
  }
  Game.lock = true;
  const my = ++Game.token;
  clearTimeout(Game.idle);
  try {
    await AudioBus.whoosh();
    if (step.mode === "you") {
      for (let i = 0; i < step.letters.length; i += 1) {
        if (my !== Game.token) return;
        await AudioBus.playClip(step.letters[i]);
        await AudioBus.wait(70);
      }
      if (my !== Game.token) return;
      step._line = "What word is it?";
      await AudioBus.speak("What word is it?");
    } else {
      await AudioBus.playClip("w:" + step.word);
      await AudioBus.speak(step.word);
      step._line = step.word;
    }
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
    AudioBus.speak("Yes! " + LETTERS[step.phoneme].said + ". Now tap the picture.");
    return;
  }
  AudioBus.speak("Let's try tapping!");
}

function onWedo() {
  const step = Game.step;
  if (!step || Game.lock) return;
  Game.lock = true;
  AudioBus.playClip(step.letter || "s").then(() => {
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
  const finished = PATH.every(nodeDone);
  let line = "Great playing, Maeve! You earned a sticker. We can rest, or play some more.";
  if (finished && now && !was) line = "You did it, Maeve! Chapter 1 is complete! We can rest now.";
  else if (now && !was) line = "You did it, Maeve! You earned a sticker. We can rest now.";
  document.getElementById("pip").classList.add("yay");
  updateMic(null);
  main.innerHTML = celeHTML(sticker, line);
  renderChrome();
  confetti(true);
  AudioBus.speak(line);
}

function onMore() {
  const idx = PATH.findIndex((node) => node.id === Game.node);
  if (idx >= 0 && nodeDone(PATH[idx]) && idx < PATH.length - 1) {
    startSkill(PATH[idx + 1].id);
    return;
  }
  if (idx >= 0 && !nodeDone(PATH[idx])) {
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
  if (step.type === "blend" && Game.phase === "pick" && step.mode === "you") {
    const my = ++Game.token;
    (async () => {
      AudioBus.arm();
      for (let i = 0; i < step.letters.length; i += 1) {
        if (my !== Game.token) return;
        await AudioBus.playClip(step.letters[i]);
        await AudioBus.wait(70);
      }
      if (my !== Game.token) return;
      await AudioBus.speak("What word is it?");
    })();
    return;
  }
  if (step.type === "blend") {
    AudioBus.speak(step._line || "Tap each sound. Then swoop.");
    return;
  }
  const my = ++Game.token;
  runAudio(step, my).then(() => {
    if (my === Game.token) revealChoices();
  });
}

function renderMap() {
  const current = currentIndex();
  const nodes = PATH.map((node, index) => {
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
      <h2>Chapter 1</h2>
      <p>First sounds</p>
    </div>
    <div class="nodes">${nodes}</div>
    <div class="soon">
      <button type="button" class="soon-card" aria-label="Chapter 2, locked">
        <div class="lock">🔒</div>
        <h3>Chapter 2</h3>
        <p>More letters</p>
      </button>
      <button type="button" class="soon-card" aria-label="Chapter 3, locked">
        <div class="lock">🔒</div>
        <h3>Chapter 3</h3>
        <p>Little stories</p>
      </button>
    </div>
    <div class="stickers"><b>Stickers</b>${stickers}</div>
  </div>`;
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
  if (freshPlayer()) {
    Game.hello = true;
    startSkill("rhyme");
    return;
  }
  showMap({ speak: "Hi Maeve! You are back. Tap the glowing game." });
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
  const node = PATH[index];
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
  const sounds = ["s", "a", "t", "p", "i", "n"].map((id) => skillLine(id, id + " · " + LETTERS[id].said)).join("");
  const ears = ["rhyme", "first", "robot1", "robot2", "sat", "words"]
    .map((id) => skillLine(id, id))
    .join("");
  const tries = PATH.map((node) => `<button type="button" class="try" data-go="${esc(node.id)}">${node.icon} ${esc(node.label)}</button>`).join("");
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
  const go = params.get("go");
  if (go === "map") showMap();
  else if (go === "yay") showSampleCele();
  else if (go === "grown") {
    showMap();
    openGrownup();
  } else if (go) startSkill(go);
  else showStart();
  renderChrome();
}

document.getElementById("replay").addEventListener("click", () => {
  AudioBus.unlock();
  replay();
});

document.getElementById("home").addEventListener("click", () => {
  AudioBus.unlock();
  showMap({ speak: "Tap the glowing game." });
});

document.getElementById("mic").addEventListener("click", () => {
  AudioBus.unlock();
  onMic();
});

const grown = document.getElementById("grown");
let holdTimer = null;
grown.addEventListener("pointerdown", (event) => {
  grown.setPointerCapture(event.pointerId);
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
grown.addEventListener("contextmenu", (event) => event.preventDefault());

main.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  AudioBus.unlock();
  if (button.id === "play") return onPlay();
  if (button.id === "next") return nextStep();
  if (button.id === "wedo") return onWedo();
  if (button.id === "swoop") return onSwoop();
  if (button.id === "rest") return showMap({ speak: "You got a sticker. Tap the glowing game when you want to play." });
  if (button.id === "more") return onMore();
  if (button.classList.contains("choice")) return onChoice(button.dataset.key);
  if (button.classList.contains("blend-letter")) return onLetterTap(Number(button.dataset.i));
  if (button.classList.contains("node")) return onNode(Number(button.dataset.i));
  if (button.classList.contains("soon-card")) {
    AudioBus.speak("More games are coming later. Let's play chapter 1.");
  }
});

document.getElementById("overlay").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
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
  if (button.classList.contains("try")) {
    startSkill(button.dataset.go);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGrownup();
});

boot();
