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
      this.voice = this.pickVoice();
    };
    try {
      pick();
      if (window.speechSynthesis) speechSynthesis.addEventListener("voiceschanged", pick);
    } catch (err) {
      /* speech optional */
    }
  },

  pickVoice() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) return null;
    const score = (voice) => {
      const name = (voice.name + " " + voice.lang).toLowerCase();
      let value = 0;
      if (name.includes("en-us") || name.includes("en_us")) value += 3;
      else if (name.includes("en")) value += 2;
      if (/female|samantha|jenny|aria|uk english female/.test(name)) value += 4;
      if (name.includes("google us english")) value += 3;
      if (name.includes("male")) value -= 2;
      return value;
    };
    return voices.slice().sort((a, b) => score(b) - score(a))[0];
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

  clipUrl(id) {
    if (id.indexOf("w:") === 0) return "audio/words/" + id.slice(2) + ".mp3";
    return "audio/phonemes/" + id + ".mp3";
  },

  /* A whole utterance that is one letter, or a sentence that names a letter
     ("say k", "says c"). The words "a" and "I" are allowed. */
  hasBareLetter(text) {
    const raw = String(text || "").trim();
    if (/^[a-zA-Z][.!?]?$/.test(raw)) return true;
    const tokens = raw.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
    const allowed = { a: 1, i: 1 };
    return tokens.some((token) => token.length === 1 && !allowed[token]);
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

  speak(text) {
    return new Promise((resolve) => {
      if (!text || !window.speechSynthesis || this.hasBareLetter(text)) {
        if (text && this.hasBareLetter(text)) this.blockedLetters = (this.blockedLetters || 0) + 1;
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
      utter.pitch = 1.05;
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
