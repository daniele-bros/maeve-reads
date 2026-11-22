/* Saved only on this device. No accounts, no uploads. */
const Progress = {
  KEY: "maeve-reads-v1",
  data: null,

  load() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(this.KEY) || "null");
    } catch (err) {
      raw = null;
    }
    if (!raw || raw.v !== 1) {
      raw = { v: 1, stars: 0, stickers: [], mic: true, micTold: false, spin: 0, skills: {} };
    }
    raw.skills = raw.skills || {};
    raw.stickers = raw.stickers || [];
    raw.stars = raw.stars || 0;
    if (typeof raw.mic !== "boolean") raw.mic = true;
    if (raw.chapter !== 1 && raw.chapter !== 2) raw.chapter = 2;
    this.data = raw;
    this.save();
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (err) {
      /* private mode */
    }
  },

  skill(id) {
    if (!this.data.skills[id]) {
      this.data.skills[id] = { tries: 0, correct: 0, recent: [], mastered: false };
    }
    return this.data.skills[id];
  },

  isMastered(id) {
    return !!(this.data.skills[id] && this.data.skills[id].mastered);
  },

  record(id, ok) {
    const skill = this.skill(id);
    skill.tries += 1;
    if (ok) skill.correct += 1;
    skill.recent.push(ok ? 1 : 0);
    if (skill.recent.length > 8) skill.recent.shift();
    const last = skill.recent.slice(-5);
    if (last.length >= 5 && last.reduce((sum, n) => sum + n, 0) >= 4) {
      skill.mastered = true;
    }
    this.save();
    return skill.mastered;
  },

  reset() {
    try {
      localStorage.removeItem(this.KEY);
    } catch (err) {
      /* ignore */
    }
    this.load();
  },
};
