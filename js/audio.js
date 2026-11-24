/* Spoken prompts, phoneme clips, and optional microphone. */
const AudioBus = {
  ctx: null,
  voice: null,
  audio: null,
  rec: null,
  finishListen: null,
  stopped: false,
  keepAlive: null,

  init() {
    const pick = () => {
      const next = this.pickVoice();
      if (next) this.voice = next;
    };
    try {
      pick();
      if (window.speechSynthesis) speechSynthesis.addEventListener("voiceschanged", pick);
    } catch (err) {
      /* speech optional */
    }
  },

  /* "female" contains the letters male, so a bare includes("male") check is wrong. */
  maleNames: [
    "google uk english male", "daniel", "alex", "fred", "david", "guy", "mark",
    "christopher", "eric", "roger", "ryan", "andrew", "brian", "davis", "tony", "jason",
  ],

  femaleOrder: [
    "google us english", "samantha", "aria", "jenny", "ava", "emma", "michelle",
    "google uk english female", "karen", "moira", "tessa", "victoria", "zira",
  ],

  voiceBlob(voice) {
    return (String(voice && voice.name || "") + " " + String(voice && voice.lang || "")).toLowerCase();
  },

  isMaleVoice(voice) {
    const name = String(voice && voice.name || "").toLowerCase();
    const blob = this.voiceBlob(voice);
    if (/\bmale\b/.test(blob)) return true;
    return this.maleNames.some((token) => new RegExp("\\b" + token + "\\b").test(name));
  },

  femaleRank(name) {
    const lower = String(name || "").toLowerCase();
    for (let i = 0; i < this.femaleOrder.length; i += 1) {
      const token = this.femaleOrder[i];
      if (token.indexOf(" ") !== -1) {
        if (lower.indexOf(token) !== -1) return i;
      } else if (new RegExp("\\b" + token + "\\b").test(lower)) return i;
    }
    return -1;
  },

  isFemaleVoice(voice) {
    if (!voice || this.isMaleVoice(voice)) return false;
    const name = String(voice.name || "").toLowerCase();
    if (/\bfemale\b/.test(name)) return true;
    return this.femaleRank(name) >= 0;
  },

  scoreVoice(voice) {
    const name = String(voice && voice.name || "").toLowerCase();
    const lang = String(voice && voice.lang || "").toLowerCase();
    const blob = this.voiceBlob(voice);
    let value = 0;
    if (lang.indexOf("en-us") === 0 || lang.indexOf("en_us") === 0 || blob.indexOf("en-us") !== -1) value += 40;
    else if (lang.indexOf("en") === 0 || name.indexOf("english") !== -1) value += 12;
    const rank = this.femaleRank(name);
    if (rank >= 0) value += 500 - rank * 20;
    if (/\bfemale\b/.test(blob)) value += 40;
    if (/\bnatural\b/.test(name)) value += 10;
    if (this.isMaleVoice(voice)) value -= 1000;
    return value;
  },

  chooseVoice(voices, savedName) {
    const list = voices || [];
    if (!list.length) return null;
    const saved = savedName
      ? list.find((voice) => voice.name === savedName && this.isFemaleVoice(voice))
      : null;
    const best = list.slice().sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a))[0];
    if (saved && this.scoreVoice(saved) >= this.scoreVoice(best)) return saved;
    return best;
  },

  readVoiceName() {
    try { return localStorage.getItem("maeve-reads-voice") || ""; }
    catch (err) { return ""; }
  },

  writeVoiceName(name) {
    try { localStorage.setItem("maeve-reads-voice", name); }
    catch (err) { /* private mode */ }
  },

  pickVoice() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) return this.voice || null;
    const chosen = this.chooseVoice(voices, this.readVoiceName());
    const incumbent = this.voice && this.isFemaleVoice(this.voice) ? this.voice : null;
    let next = chosen;
    if (incumbent && this.scoreVoice(incumbent) >= this.scoreVoice(chosen)) next = incumbent;
    if (next && this.isFemaleVoice(next)) this.writeVoiceName(next.name);
    return next;
  },

  unlock() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && !this.ctx) this.ctx = new Ctx();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    try {
      speechSynthesis.resume();
    } catch (err) {
      /* ignore */
    }
  },

  arm() {
    this.stopped = false;
  },

  stop() {
    this.stopped = true;
    this.playToken = (this.playToken || 0) + 1;
    this.abortListen();
    if (this._endPlay) this._endPlay(false);
    try {
      speechSynthesis.cancel();
    } catch (err) {
      /* ignore */
    }
    if (this.audio) {
      try {
        this.audio.pause();
      } catch (err) {
        /* ignore */
      }
      this.audio = null;
    }
    this.seaStop();
    const pip = document.getElementById("pip");
    if (pip) pip.classList.remove("talking");
    if (this.keepAlive) {
      clearInterval(this.keepAlive);
      this.keepAlive = null;
    }
  },

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  clipCache: [],

  clipUrl(id) {
    if (id.indexOf("w:") === 0) return "audio/voice/words/" + id.slice(2) + ".mp3";
    return "audio/phonemes/" + id + ".mp3";
  },

  voiceKey(text) {
    return String(text || "")
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  clipForSpeech(text) {
    const key = this.voiceKey(text);
    if (!key || typeof VoiceClips === "undefined" || !VoiceClips[key]) return "";
    return VoiceClips[key];
  },

  /* A whole utterance that is one letter, or a sentence that names a letter
     ("say k", "says c"). The words "a" and "I" are allowed.
     Contractions stay one word, so "Let's" is not a bare s. */
  hasBareLetter(text) {
    const raw = String(text || "").trim();
    if (/^[a-zA-Z][.!?]?$/.test(raw)) return true;
    const tokens = raw.toLowerCase()
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[a-z]'[a-z]/g, (part) => part.replace("'", ""))
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const allowed = { a: 1, i: 1 };
    return tokens.some((token) => token.length === 1 && !allowed[token]);
  },

  async cachedSrc(url) {
    const found = this.clipCache.find((item) => item.url === url);
    if (found) return found.src;
    const res = await fetch(url);
    if (!res.ok) throw new Error("missing clip");
    const blob = await res.blob();
    const src = URL.createObjectURL(blob);
    this.clipCache.push({ url, src });
    if (this.clipCache.length > 12) {
      const old = this.clipCache.shift();
      try { URL.revokeObjectURL(old.src); } catch (err) { /* ignore */ }
    }
    return src;
  },

  playUrl(url, maxMs) {
    if (this._endPlay) this._endPlay(false);
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.loop = false;
      this.audio = audio;
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (this._endPlay === finish) this._endPlay = null;
        resolve(ok);
      };
      this._endPlay = finish;
      const timer = setTimeout(() => {
        try { audio.pause(); } catch (err) { /* ignore */ }
        finish(true);
      }, maxMs || 1600);
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      const play = audio.play();
      if (play && play.catch) play.catch(() => finish(false));
    });
  },

  async playClip(id) {
    const word = String(id).indexOf("w:") === 0;
    await this.playUrl(this.clipUrl(id), word ? 1500 : 600);
  },

  async playVoice(url, maxMs, token) {
    if (this._endPlay) this._endPlay(false);
    let src = url;
    try { src = await this.cachedSrc(url); }
    catch (err) { src = url; }
    if (token !== this.playToken || this.stopped) return false;
    return this.playUrl(src, maxMs);
  },

  speak(text) {
    const key = this.voiceKey(text);
    const clip = this.clipForSpeech(key);
    if (clip) {
      this.playToken = (this.playToken || 0) + 1;
      const token = this.playToken;
      this.stopped = false;
      const pip = document.getElementById("pip");
      if (pip) pip.classList.add("talking");
      return this.playVoice(clip, 12000, token).then((ok) => {
        if (pip) pip.classList.remove("talking");
        return ok;
      });
    }
    return new Promise((resolve) => {
      if (!key || !window.speechSynthesis || this.hasBareLetter(key)) {
        if (key && this.hasBareLetter(key)) this.blockedLetters = (this.blockedLetters || 0) + 1;
        resolve();
        return;
      }
      this.stopped = false;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        const pip = document.getElementById("pip");
        if (pip) pip.classList.remove("talking");
        resolve();
      };
      try {
        speechSynthesis.cancel();
      } catch (err) {
        /* ignore */
      }
      const utter = new SpeechSynthesisUtterance(text);
      const words = String(text).trim().split(/\s+/).length;
      utter.rate = words <= 2 ? 1 : 0.95;
      utter.pitch = 1.1;
      utter.lang = "en-US";
      if (!this.voice) this.voice = this.pickVoice();
      if (this.voice) utter.voice = this.voice;
      utter.onend = finish;
      utter.onerror = finish;
      const pip = document.getElementById("pip");
      if (pip) pip.classList.add("talking");
      window.setTimeout(() => {
        try { speechSynthesis.speak(utter); } catch (err) { finish(); }
      }, 40);
      setTimeout(finish, 5000);
    });
  },

  tone(freq, when, dur, gain) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(gain, when + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  },

  pop() {
    this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  },

  seaStart() {
    this.unlock();
    if (!this.ctx || this.sea) return;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = 0.02;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.sea = src;
  },

  seaStop() {
    if (!this.sea) return;
    try { this.sea.stop(); } catch (err) { /* already stopped */ }
    this.sea = null;
  },

  chime(big) {
    this.unlock();
    if (!this.ctx) return;
    const notes = big ? [523, 659, 784, 1046] : [523, 659, 784];
    const now = this.ctx.currentTime;
    notes.forEach((freq, index) => this.tone(freq, now + index * 0.09, 0.22, 0.07));
  },

  whoosh() {
    this.unlock();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.28);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  },

  micSupported() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!(SR && window.isSecureContext);
  },

  listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return Promise.resolve(null);
    this.abortListen();
    return new Promise((resolve) => {
      const rec = new SR();
      this.rec = rec;
      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        this.finishListen = null;
        const mic = document.getElementById("mic");
        if (mic) mic.classList.remove("listening");
        resolve(value);
      };
      this.finishListen = finish;
      rec.lang = "en-US";
      rec.maxAlternatives = 5;
      rec.interimResults = false;
      rec.onresult = (event) => {
        const alts = [];
        const result = event.results[0];
        for (let i = 0; i < result.length; i += 1) alts.push(result[i].transcript);
        finish(alts);
        try { rec.stop(); } catch (err) { /* ignore */ }
      };
      rec.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") finish("denied");
        else finish([]);
      };
      rec.onend = () => finish([]);
      try {
        const mic = document.getElementById("mic");
        if (mic) mic.classList.add("listening");
        rec.start();
      } catch (err) {
        finish(null);
      }
      const timer = setTimeout(() => {
        try { rec.stop(); } catch (err) { /* ignore */ }
      }, 5500);
    });
  },

  abortListen() {
    const finish = this.finishListen;
    this.finishListen = null;
    if (this.rec) {
      try { this.rec.abort(); } catch (err) { /* ignore */ }
      this.rec = null;
    }
    const mic = document.getElementById("mic");
    if (mic) mic.classList.remove("listening");
    if (finish) finish(null);
  },
};
