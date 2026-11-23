import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = new Set(
  fs.readdirSync(path.join(root, "audio/words")).filter((name) => name.endsWith(".mp3")).map((name) => name.slice(0, -4))
);
const context = { console, Progress: { data: { spin: 0, skills: {} }, isMastered() { return false; } } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/data.js"), "utf8") + "\nthis.Session=Session; this.Deal=Deal; this.PICS=PICS; this.SCENE=SCENE;", context, { filename: "data.js" });
vm.runInContext(fs.readFileSync(path.join(root, "js/play.js"), "utf8") + "\nthis.PlaySets=PlaySets;", context, { filename: "play.js" });

const taught = new Set("satpinckehrmd".split(""));
const tricky = new Set(["a", "the", "is"]);
const printSkills = new Set(["words", "words1", "words2", "read", "spell", "stories", "feed", "train", "hop", "fish", "mystery", "reader", "pizza", "sandwich", "sort"]);
const dragGames = ["feed", "train", "hop", "mystery", "fish", "pizza", "sandwich", "sort"];
const quietRead = new Set(["reader", "pizza", "sandwich", "sort"]);
const errors = [];
function fail(message) {
  if (errors.length < 40) errors.push(message);
  else errors.push("");
}
function decodable(word) {
  return String(word).split("").every((letter) => taught.has(letter));
}
function keysOf(step) {
  if (step.game === "reader" || (step.options && !step.choices)) return context.PlaySets.choiceOrder(step);
  if (step.choices) return step.choices.map((choice) => choice.key || choice.letter);
  return [];
}
function checkWord(game, word) {
  if (!word || context.SCENE[word]) return;
  if (String(word).length < 2) return;
  if (!decodable(word)) fail(game + " untaught letters in " + word);
  if (!context.PICS[word]) fail(game + " no picture for " + word);
  if (!words.has(word)) fail(game + " no audio for " + word);
}
function checkStep(game, step, keys) {
  const answer = step.answer || step.word || step.id;
  keys = keys || keysOf(step);
  if (keys.length) {
    if (new Set(keys).size !== keys.length) fail(game + " duplicate choices " + keys.join(","));
    if (answer && keys.indexOf(answer) < 0) fail(game + " missing answer " + answer + " in [" + keys.join(",") + "]");
  }
  if (step.queue) {
    step.queue.forEach((word) => {
      if (keys.indexOf(word) < 0) fail(game + " sequence word " + word + " not on screen");
      checkWord(game, word);
    });
  }
  if (printSkills.has(game)) {
    checkWord(game, step.word || (String(answer || "").length > 1 ? answer : ""));
    keys.forEach((key) => checkWord(game, key));
  }
  if (step.word && step.letters && step.letters.join("") !== step.word) fail(game + " letters do not spell " + step.word);
  if (step.bank && step.bank.length && step.letters) {
    const have = {};
    step.bank.forEach((letter) => { have[letter] = (have[letter] || 0) + 1; });
    const need = {};
    step.letters.forEach((letter) => { need[letter] = (need[letter] || 0) + 1; });
    Object.keys(need).forEach((letter) => {
      if ((have[letter] || 0) < need[letter]) fail(game + " bank missing " + letter + " for " + step.word);
    });
  }
  (step.clips || []).forEach((clip) => {
    if (clip.indexOf("w:") === 0 && !words.has(clip.slice(2))) fail(game + " missing clip " + clip);
  });
  (step.words || []).forEach((word) => {
    const say = String(word.say || word.text || "").toLowerCase();
    if (word.tricky) {
      if (!tricky.has(say)) fail(game + " unexpected tricky word " + say);
      return;
    }
    if (say && !decodable(say)) fail(game + " sentence word " + say + " is not decodable");
  });
  if (step.choices) {
    step.choices.forEach((choice) => {
      if (!choice.letter && !choice.emoji) fail(game + " blank picture " + (choice.key || ""));
    });
  }
}

const positions = {};
const runs = {};
function notePosition(game, keys, answer) {
  if (!keys || keys.length < 2 || keys.indexOf(answer) < 0) return;
  const pos = keys.indexOf(answer);
  const bucket = game + ":" + keys.length;
  if (!positions[bucket]) positions[bucket] = [];
  positions[bucket].push(pos);
  if (!runs[game]) runs[game] = [];
  runs[game].push(pos);
}

function resetDeal() {
  context.Deal.lastPos = [];
  context.Deal.posCount = {};
  context.Deal.lastKey = "";
}

const lessons = ["rhyme", "first", "robot1", "robot2", "s", "a", "t", "p", "i", "n", "c", "k", "e", "h", "r", "m", "d", "ck", "hr", "md", "sat", "words", "words1", "words2", "read", "spell", "stories"];
const playGames = Object.keys(context.PlaySets.pools).concat(["reader", "pizza", "sandwich", "sort"]);

function scan(name, build) {
  resetDeal();
  for (let round = 0; round < 500; round += 1) {
    context.Progress.data.spin = round * 17 + name.length;
    let steps = [];
    try { steps = build(); }
    catch (error) { fail(name + " build " + error.message); return; }
    if (round === 0) {
      if (dragGames.indexOf(name) !== -1 && (steps.length < 10 || steps.length > 12)) fail(name + " session length " + steps.length);
      if ((name === "pop" || name === "bubble") && (steps.length < 8 || steps.length > 10)) fail(name + " session length " + steps.length);
      if (name === "reader") {
        const count = steps.reduce((sum, step) => sum + ((step.queue && step.queue.length) || 0), 0);
        if (count < 10 || count > 12) fail("reader word count " + count);
      }
    }
    let previous = "";
    steps.forEach((step) => {
      const answer = step.answer || step.word;
      if (playGames.indexOf(name) !== -1 && answer && answer === previous) fail(name + " repeated " + answer + " back to back");
      if (answer) previous = answer;
      if (quietRead.has(name)) {
        const said = " " + String(step.speech || "").toLowerCase().replace(/[^a-z\s]/g, " ") + " ";
        if (answer && said.indexOf(" " + String(answer).toLowerCase() + " ") !== -1) fail(name + " prompt says " + answer);
        if ((step.clips || []).some((clip) => String(clip).indexOf("w:") === 0)) fail(name + " speaks the word before a choice");
      }
      if (step.boxOptions) {
        const slots = context.PlaySets.boxOrder(step);
        if (slots.indexOf(step.box) < 0) fail(name + " missing box " + step.box);
        if (step.word && !String(step.word).endsWith(step.box)) fail(name + " " + step.word + " is not in the " + step.box + " box");
        notePosition(name, slots, step.box);
        checkStep(name, step, []);
        return;
      }
      const keys = step.choices
        ? step.choices.map((choice) => choice.key || choice.letter)
        : (step.options ? context.PlaySets.choiceOrder(step) : []);
      checkStep(name, step, keys);
      notePosition(name, keys, step.answer || step.word);
    });
  }
}

lessons.forEach((lesson) => scan(lesson, () => context.Session.build(lesson)));
playGames.forEach((game) => scan(game, () => context.PlaySets.build(game)));

Object.keys(runs).forEach((game) => {
  const list = runs[game];
  if (list.length < 200) return;
  let run = 1;
  for (let i = 1; i < list.length; i += 1) {
    if (list[i] === list[i - 1]) {
      run += 1;
      if (run > 2) {
        fail(game + " correct answer stayed in slot " + list[i] + " more than twice");
        break;
      }
    } else run = 1;
  }
});
Object.keys(positions).forEach((bucket) => {
  const list = positions[bucket];
  if (list.length < 200) return;
  const n = Math.max.apply(null, list) + 1;
  const counts = Array(n).fill(0);
  list.forEach((pos) => { counts[pos] += 1; });
  const min = Math.min.apply(null, counts);
  const max = Math.max.apply(null, counts);
  if (max > list.length * 0.5 || min < list.length * 0.15) {
    fail(bucket + " positions not uniform " + counts.join(",") + " of " + list.length);
  }
});

const version = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assetVersions = Array.from(html.matchAll(/\?v=([^"'&\s]+)/g)).map((match) => match[1]);
const pageVersions = Array.from(html.matchAll(/var PAGE = "([^"]+)"/g)).map((match) => match[1]);
if (!version.v) fail("version.json missing v");
if (assetVersions.length < 6) fail("expected css and js versions in index.html");
assetVersions.forEach((value) => {
  if (value !== String(version.v)) fail("asset ?v=" + value + " does not match version.json " + version.v);
});
if (pageVersions.length !== 1 || pageVersions[0] !== String(version.v)) {
  fail("page version " + pageVersions.join(",") + " does not match version.json " + version.v);
}

const real = errors.filter(Boolean);
if (real.length) {
  console.error(real.join("\n"));
  console.error(errors.length + " content errors");
  process.exit(1);
}
console.log("content ok");
