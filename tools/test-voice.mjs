import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { console };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/audio.js"), "utf8") + "\nthis.AudioBus=AudioBus;", context, { filename: "audio.js" });
const bus = context.AudioBus;

const chromeVoices = [
  { name: "Google UK English Male", lang: "en-GB" },
  { name: "Google UK English Female", lang: "en-GB" },
  { name: "Google US English", lang: "en-US" },
  { name: "Daniel", lang: "en-GB" },
  { name: "Alex", lang: "en-US" },
  { name: "Fred", lang: "en-US" },
  { name: "Google UK English Male", lang: "en-GB" },
  { name: "Microsoft David - English (United States)", lang: "en-US" },
  { name: "Microsoft Mark - English (United States)", lang: "en-US" },
  { name: "Microsoft Guy - English (United States)", lang: "en-US" },
  { name: "Microsoft Zira - English (United States)", lang: "en-US" },
  { name: "Microsoft Aria - English (United States)", lang: "en-US" },
  { name: "Microsoft Aria Online (Natural) - English (United States)", lang: "en-US" },
  { name: "Microsoft Jenny Online (Natural) - English (United States)", lang: "en-US" },
  { name: "Samantha", lang: "en-US" },
  { name: "Karen", lang: "en-AU" },
  { name: "Moira", lang: "en-IE" },
  { name: "Tessa", lang: "en-ZA" },
  { name: "Victoria", lang: "en-US" },
  { name: "Ralph", lang: "en-US" },
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

const chosen = bus.chooseVoice(chromeVoices, "");
if (!chosen || chosen.name !== "Google US English") fail("expected Google US English, got " + (chosen && chosen.name));

const male = { name: "Google UK English Male", lang: "en-GB" };
const us = { name: "Google US English", lang: "en-US" };
const ukFemale = { name: "Google UK English Female", lang: "en-GB" };
if (bus.scoreVoice(male) >= bus.scoreVoice(us)) fail("Google UK English Male beat Google US English");
if (bus.isMaleVoice(ukFemale)) fail("female matched the male check");
if (bus.scoreVoice(ukFemale) <= bus.scoreVoice(male)) fail("Google UK English Female lost to the male voice");

const headToHead = bus.chooseVoice([male, us], "");
if (headToHead.name !== "Google US English") fail("head to head picked " + headToHead.name);

chromeVoices.forEach((voice) => {
  const winner = bus.chooseVoice([voice, us], "");
  if (voice.name === "Google US English") return;
  if (winner.name === "Google UK English Male") fail("male won against " + voice.name);
});

const aria = { name: "Microsoft Aria - English (United States)", lang: "en-US" };
const ariaNatural = { name: "Microsoft Aria Online (Natural) - English (United States)", lang: "en-US" };
if (bus.scoreVoice(ariaNatural) <= bus.scoreVoice(aria)) fail("Natural Aria should beat Aria");

const saved = bus.chooseVoice(
  [male, { name: "Karen", lang: "en-AU" }, { name: "Samantha", lang: "en-US" }],
  "Samantha"
);
if (saved.name !== "Samantha") fail("saved female voice was dropped for " + saved.name);

const upgraded = bus.chooseVoice(chromeVoices, "Karen");
if (upgraded.name !== "Google US English") fail("a better female voice should replace Karen, got " + upgraded.name);

if (bus.isMaleVoice({ name: "Google UK English Female", lang: "en-GB" })) fail("Female still counts as male");
if (!bus.isFemaleVoice(us)) fail("Google US English should count as female");
if (bus.isFemaleVoice(male)) fail("male voice counted as female");

console.log("voice ok", chosen.name);
