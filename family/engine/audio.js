/* Family Adventures - engine/audio.js : WebAudio sfx (lazy ctx) + optional owner cheer clips. */
(function () {
  'use strict';
  const M = window.Moody;
  let AC = null, master = null, lastCheer = -99, tries = 0;
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=';
  const A = M.audio = {
    /* create / resume the AudioContext. Safe to call from any gesture handler, any number of times. */
    init() {
      if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) { AC = null; } }
      if (AC && (AC.state === 'suspended' || AC.state === 'interrupted')) { try { const p = AC.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
    },
    ctx() { return AC; },
    /* iOS / Android autoplay unlock: runs on the first real gesture (touchend / click / pointerup / keydown): resumes the context, plays one silent buffer, primes an HTMLAudio element */
    unlock() {
      if (A.unlocked) return; A.init();
      try { if (AC) { const b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0); } } catch (e) { }
      try { const a = new Audio(SILENT); a.volume = 0; a.muted = true; const p = a.play(); if (p && p.then) p.then(() => { try { a.pause(); } catch (e) { } }).catch(() => { }); } catch (e) { }
      if (AC && AC.state === 'running') A.unlocked = true; else if (++tries > 6) A.unlocked = true;   // iOS may need a few gestures; stop trying after 6
    },
    /* tab hidden / portrait overlay: silence everything; resume() brings it back (iOS can leave the context 'interrupted') */
    suspend() { try { if (AC && AC.state === 'running') AC.suspend(); } catch (e) { } },
    resume() { try { if (AC && AC.state !== 'running' && AC.state !== 'closed') { const p = AC.resume(); if (p && p.catch) p.catch(() => { }); } } catch (e) { } },
    on() { return M.save.data.settings.sound !== false; },
    tone(f, d, type, vol, slide, delay) {
      if (!AC || !A.on()) return; try {
        const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
        gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol || .25, t + .012); gn.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(gn); gn.connect(master); o.start(t); o.stop(t + d + .05);
      } catch (e) { }
    },
    noise(d, vol, f0, f1, delay) {
      if (!AC || !A.on()) return; try {
        const t = AC.currentTime + (delay || 0), n = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, n, AC.sampleRate), ch = b.getChannelData(0);
        for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
        const s = AC.createBufferSource(); s.buffer = b; const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f0 || 1000, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d);
        const gn = AC.createGain(); gn.gain.setValueAtTime(vol || .2, t); gn.gain.exponentialRampToValueAtTime(.001, t + d);
        s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t);
      } catch (e) { }
    },
    sfx(n) {
      A.init(); const T = A.tone;
      switch (n) {
        case 'tap': T(620, .07, 'sine', .2, 820); break;
        case 'pop': T(380, .12, 'sine', .28, 900); break;
        case 'pick': T(500, .1, 'triangle', .25, 760); break;
        case 'drop': T(260, .12, 'sine', .3, 120); break;
        case 'good': [523, 659, 784].forEach((f, i) => T(f, .18, 'triangle', .25, 0, i * .09)); break;
        case 'star': [784, 988, 1175, 1568].forEach((f, i) => T(f, .25, 'triangle', .22, 0, i * .08)); A.noise(.3, .05, 5000, 9000, .1); break;
        case 'coin': T(988, .08, 'square', .12); T(1319, .18, 'square', .12, 0, .07); break;
        case 'wrong': T(330, .18, 'sine', .22, 250); T(262, .22, 'sine', .2, 200, .12); break;   // gentle "hmm"
        case 'whoosh': A.noise(.25, .12, 400, 2500); break;
        case 'splash': A.noise(.3, .18, 1800, 500); break;
        case 'drip': T(900, .09, 'sine', .22, 450); break;
        case 'alarm': for (let i = 0; i < 6; i++) T(i % 2 ? 880 : 1040, .09, 'square', .1, 0, i * .12); break;
        case 'boing': T(200, .25, 'sine', .3, 600); break;
        case 'flip': T(700, .05, 'triangle', .15, 1100); break;
        case 'bell': T(1318, .5, 'sine', .22); T(1976, .5, 'sine', .1, 0, .01); break;
        case 'click': T(1500, .03, 'square', .1); break;
        case 'sleepy': [523, 440, 392, 330].forEach((f, i) => T(f, .4, 'sine', .15, 0, i * .3)); break;
        case 'fanfare': [523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => T(f, .2, 'triangle', .26, 0, i * .12)); A.noise(.5, .06, 6000, 9000, .7); break;
        case 'unlock': [660, 880, 1175].forEach((f, i) => T(f, .15, 'square', .12, 0, i * .08)); break;
      }
    },
    /* optional cheer clips (disabled in this edition); ignore errors, at most one per ~5s */
    cheer(kind) { return; /* standalone edition: no cross-game clips */
      try {
        if (!M.save.data.settings.voice || !A.on() || (M.voice && M.voice.busy)) return; const now = M.time; if (now - lastCheer < 5) return;
        const map = { small: [['ring', 3], ['cp', 2]], big: [['done', 2], ['win', 2]], start: [['start', 4]], correct: [['kill', 4]], free: [['free', 3]] };
        const o = map[kind || 'small']; if (!o) return; const k = M.util.pick(o), f = k[0] + M.util.rndi(0, k[1] - 1);
        lastCheer = now; const a = new Audio('assets/v/' + f + '.mp3'); a.volume = .8; A.cheering = true; const fin = () => { A.cheering = false; }; a.addEventListener('error', fin); a.addEventListener('ended', fin); setTimeout(fin, 4000); const p = a.play(); if (p && p.catch) p.catch(() => { });
      } catch (e) { }
    }
  };
  /* unlock on the first user gestures (touchend is what iOS Safari accepts; pointerup / click / keydown cover the rest); stop listening once unlocked */
  const EV = ['touchend', 'pointerup', 'click', 'keydown'];
  const onG = () => { A.unlock(); if (A.unlocked) EV.forEach(e => document.removeEventListener(e, onG, true)); };
  EV.forEach(e => document.addEventListener(e, onG, true));
  document.addEventListener('pointerdown', () => A.init(), true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !(M.suspended)) A.resume(); });
  addEventListener('focus', () => { if (!M.suspended) A.resume(); });
  /* Lip-sync analyser off (low quality): voice.js routes a clip through createMediaElementSource only to measure its loudness; refusing it makes voice.js fall back to its rhythmic talk loop
     (its hook() is wrapped in try/catch). A clip that is already routed stays routed (a media element can only be wired once). */
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C && C.prototype.createMediaElementSource && !C.prototype.__moodyWrapped) { const o = C.prototype.createMediaElementSource; C.prototype.createMediaElementSource = function () { if (M.fx && M.fx.lipsync === false) throw new Error('lip-sync analyser disabled (low quality)'); return o.apply(this, arguments); }; C.prototype.__moodyWrapped = true; }
  } catch (e) { }
})();