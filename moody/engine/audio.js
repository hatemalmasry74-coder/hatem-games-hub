/* Moody & Aboody - engine/audio.js : WebAudio sfx (lazy ctx) + optional owner cheer clips. */
(function () {
  'use strict';
  const M = window.Moody;
  let AC = null, master = null, lastCheer = -99;
  const A = M.audio = {
    init() {
      if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) { AC = null; } }
      if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) { } }
    },
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
    /* optional owner cheer clips from the sonic game; ignore errors, at most one per ~5s */
    cheer(kind) {
      try {
        if (!M.save.data.settings.voice || !A.on() || (M.voice && M.voice.busy)) return; const now = M.time; if (now - lastCheer < 5) return;
        const map = { small: [['ring', 3], ['cp', 2]], big: [['done', 2], ['win', 2]], start: [['start', 4]], correct: [['kill', 4]], free: [['free', 3]] };
        const o = map[kind || 'small']; if (!o) return; const k = M.util.pick(o), f = k[0] + M.util.rndi(0, k[1] - 1);
        lastCheer = now; const a = new Audio('../sonic/assets/v/' + f + '.mp3'); a.volume = .8; A.cheering = true; const fin = () => { A.cheering = false; }; a.addEventListener('error', fin); a.addEventListener('ended', fin); setTimeout(fin, 4000); const p = a.play(); if (p && p.catch) p.catch(() => { });
      } catch (e) { }
    }
  };
})();
