import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { console, Progress: { data: { spin: 0, skills: {} }, isMastered() { return false; } } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/data.js"), "utf8") + "\nthis.Session=Session; this.Deal=Deal; this.PICS=PICS;", context, { filename: "data.js" });
vm.runInContext(fs.readFileSync(path.join(root, "js/play.js"), "utf8") + "\nthis.PlaySets=PlaySets;", context, { filename: "play.js" });
vm.runInContext(fs.readFileSync(path.join(root, "js/voice-map.js"), "utf8") + "\nthis.VoiceClips=VoiceClips;", context, { filename: "voice-map.js" });

function key(text) {
  return String(text || "")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const clips = context.VoiceClips;
const core = new Map();
const extra = new Map();
function add(bucket, text, where) {
  const id = key(text);
  if (!id) return;
  if (!bucket.has(id)) bucket.set(id, where);
}

const lessons = ["rhyme", "first", "robot1", "robot2", "s", "a", "t", "p", "i", "n", "c", "k", "e", "h", "r", "m", "d", "ck", "hr", "md", "sat", "words", "words1", "words2", "read", "spell", "stories"];
const playGames = Object.keys(context.PlaySets.pools).concat(["reader", "pizza", "sandwich", "sort"]);
const wordUses = new Set();

function take(step) {
  if (step.speech) add(core, step.speech, "prompt");
  if (step.voice && step.speech) add(core, step.speech + " You can say it, or tap.", "mic hint");
  if (step.skill === "rhyme" && step.type === "model" && step.speech) {
    add(core, "Hi Maeve! I am Pip. " + step.speech, "hello");
  }
  (step.clips || []).forEach((clip) => {
    if (String(clip).indexOf("w:") === 0) wordUses.add(clip.slice(2));
  });
}

for (let round = 0; round < 500; round += 1) {
  context.Progress.data.spin = round * 17;
  lessons.forEach((lesson) => context.Session.build(lesson).forEach(take));
  playGames.forEach((game) => context.PlaySets.build(game).forEach(take));
}

const gameJs = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
Array.from(gameJs.matchAll(/say: "([^"]+)"/g)).forEach((match) => add(core, match[1], "tile"));
Array.from(gameJs.matchAll(/AudioBus\.speak\("([^"]+)"\)/g)).forEach((match) => add(extra, match[1], "ui"));

function missingFrom(bucket) {
  const out = [];
  bucket.forEach((where, text) => {
    const file = clips[text];
    if (!file || !fs.existsSync(path.join(root, file))) out.push(where + ": " + text);
  });
  return out;
}

const missingCore = missingFrom(core);
const missingExtra = missingFrom(extra).filter((line) => !core.has(line.slice(line.indexOf(": ") + 2)));
const covered = core.size - missingCore.length;
const pct = core.size ? Math.round((covered / core.size) * 1000) / 10 : 100;
console.log("speech coverage " + pct + "% (" + covered + "/" + core.size + " core prompts)");
if (missingCore.length) {
  console.error("missing core clips:\n" + missingCore.join("\n"));
}
if (missingExtra.length) {
  console.log("still on browser TTS:\n" + missingExtra.join("\n"));
}

const missingWords = [];
wordUses.forEach((word) => {
  const file = path.join(root, "audio/voice/words", word + ".mp3");
  if (!fs.existsSync(file)) missingWords.push(word);
});
if (missingWords.length) console.error("missing word clips: " + missingWords.join(", "));
if (missingCore.length || missingWords.length) process.exit(1);
