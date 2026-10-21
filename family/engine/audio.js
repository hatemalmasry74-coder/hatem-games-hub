/* Family Adventures - engine/audio.js : WebAudio sfx (lazy ctx) + optional owner cheer clips. */
(function () {
  'use strict';
  const M = window.Moody;
  let AC = null, master = null, sfxBus = null, ambBus = null, musBus = null, bed = null, nbuf = null, live = 0, lastCheer = -99, tries = 0;
  const lastSfx = {};   // name -> performance.now() of the last play (tiny anti-spam so a held button never stacks 50 oscillators)
  const MAXLIVE = 90, MAXBG = 40;   // caps of simultaneously live one-shot nodes: gameplay sounds (90) always win over background notes / ambience (40)
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=';
  const A = M.audio = {
    /* create / resume the AudioContext. Safe to call from any gesture handler, any number of times. */
    init() {
      if (!AC) {
        /* never build the context before a real user gesture (Chrome would log an autoplay warning); every caller is a gesture handler anyway */
        try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; } catch (e) { }
        try {
          AC = new (window.AudioContext || window.webkitAudioContext)();
          /* graph: sfxBus ----------------------------------> master -> limiter -> out
                    ambBus -> bed (ducking) -> master      musBus -> bed */
          master = AC.createGain(); master.gain.value = .5 * A.vol();
          let out = master; try { const c = AC.createDynamicsCompressor(); c.threshold.value = -14; c.knee.value = 18; c.ratio.value = 8; c.attack.value = .004; c.release.value = .2; master.connect(c); out = c; } catch (e) { }
          out.connect(AC.destination);
          sfxBus = AC.createGain(); sfxBus.connect(master);
          bed = AC.createGain(); bed.connect(master);
          ambBus = AC.createGain(); ambBus.gain.value = .25; ambBus.connect(bed);
          musBus = AC.createGain(); musBus.gain.value = A.musicOn() ? .3 : 0; musBus.connect(bed);
        } catch (e) { AC = null; }
        if (AC && A.onReady) { try { A.onReady(); } catch (e) { } }
      }
      if (AC && (AC.state === 'suspended' || AC.state === 'interrupted')) { try { const p = AC.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
    },
    /* the buses, for the soundscape (engine/soundscape.js) */
    bus() { return AC && sfxBus ? { sfx: sfxBus, amb: ambBus, mus: musBus, bed, master } : null; },
    stamp: 0,                      // counts played one-shots (the global UI tap listener uses it to avoid doubling a sound a handler already made)
    liveNodes() { return live; },
    /* master volume 0.1..1 (settings.vol), music toggle (settings.music) */
    vol() { const v = M.save && M.save.data && M.save.data.settings ? M.save.data.settings.vol : 1; return typeof v === 'number' && v >= .1 && v <= 1 ? v : 1; },
    setVol(v) { M.save.data.settings.vol = Math.max(.1, Math.min(1, v)); M.save.commit(); if (master) master.gain.setTargetAtTime(.5 * A.vol(), AC.currentTime, .05); },
    musicOn() { return A.on() && M.save.data.settings.music !== false; },
    setMusic(on) { M.save.data.settings.music = !!on; M.save.commit(); if (M.sound && M.sound.sync) M.sound.sync(); },
    /* a shared 1.5 s white-noise buffer: noise() bursts and the soundscape beds slice it instead of allocating a new buffer per call */
    noiseBuf() {
      if (!AC) return null; if (nbuf && nbuf.sampleRate === AC.sampleRate) return nbuf;
      const n = Math.floor(AC.sampleRate * 1.5); nbuf = AC.createBuffer(1, n, AC.sampleRate); const ch = nbuf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1; return nbuf;
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
    /* one oscillator note. `bus` (optional) = A.bus().amb / .mus for soundscape layers; default = the sfx bus */
    tone(f, d, type, vol, slide, delay, bus) {
      if (!AC || !A.on() || live > (bus ? MAXBG : MAXLIVE)) return; if (bus && bus === musBus && !A.musicOn()) return; try {
        const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
        gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol || .25, t + .012); gn.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(gn); gn.connect(bus || sfxBus); o.start(t); o.stop(t + d + .05); live++; o.onended = () => { live--; try { gn.disconnect(); } catch (e) { } };
      } catch (e) { }
    },
    noise(d, vol, f0, f1, delay, bus) {
      if (!AC || !A.on() || live > (bus ? MAXBG : MAXLIVE)) return; try {
        const t = AC.currentTime + (delay || 0), nb = A.noiseBuf(), s = AC.createBufferSource(); s.buffer = nb; s.loop = d > 1.4;
        const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f0 || 1000, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d);
        const gn = AC.createGain(); gn.gain.setValueAtTime(vol || .2, t); gn.gain.exponentialRampToValueAtTime(.001, t + d);
        s.connect(fl); fl.connect(gn); gn.connect(bus || sfxBus); s.start(t, Math.random() * Math.max(0, 1.4 - Math.min(d, 1.4))); s.stop(t + d + .05); live++; s.onended = () => { live--; try { gn.disconnect(); fl.disconnect(); } catch (e) { } };
      } catch (e) { }
    },
    /* soft swell of filtered noise (attack + release): passing cars, surf, crowd murmur bursts */
    puff(d, peak, f0, f1, delay, bus, q) {
      if (!AC || !A.on() || live > MAXBG) return; try {
        const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(); s.buffer = A.noiseBuf(); s.loop = d > 1.4;
        const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = q || .8; fl.frequency.setValueAtTime(f0 || 800, t); if (f1) fl.frequency.linearRampToValueAtTime(f1, t + d);
        const gn = AC.createGain(); gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(peak || .1, t + d * .4); gn.gain.linearRampToValueAtTime(.0001, t + d);
        s.connect(fl); fl.connect(gn); gn.connect(bus || ambBus || sfxBus); s.start(t, Math.random() * .1); s.stop(t + d + .05); live++; s.onended = () => { live--; try { gn.disconnect(); fl.disconnect(); } catch (e) { } };
      } catch (e) { }
    },
    /* play a named sound on the sfx bus */
    sfx(n, a) { return play(n, a, null); },
    /* same sounds, routed to the ambience bus (ducked under narration, follows the ambience volume) */
    amb(n, a) { return play(n, a, ambBus); },
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
  /* the sound library. All synthesized (oscillators + filtered noise); levels are kept low (peak well under 0.9 after the master limiter).
     n = name, a = optional argument (surface for 'step', note for 'chime'), bus = target bus (null = sfx bus). */
  function play(n, a, bus) {
    A.init(); if (!AC) return;
    const now = performance.now(); if (lastSfx[n] && now - lastSfx[n] < (n === 'step' ? 70 : 40)) return; lastSfx[n] = now; A.stamp++;
    const T = (f, d, ty, v, sl, dl) => A.tone(f, d, ty, v, sl, dl, bus), N = (d, v, f0, f1, dl) => A.noise(d, v, f0, f1, dl, bus), R = (x, y) => x + Math.random() * (y - x);
    switch (n) {
      case 'tap': T(620, .07, 'sine', .2, 820); break;
      case 'pop': T(380, .12, 'sine', .28, 900); break;
      case 'pick': T(500, .1, 'triangle', .25, 760); break;
      case 'drop': T(260, .12, 'sine', .3, 120); break;
      case 'good': [523, 659, 784].forEach((f, i) => T(f, .18, 'triangle', .25, 0, i * .09)); break;
      case 'star': [784, 988, 1175, 1568].forEach((f, i) => T(f, .25, 'triangle', .22, 0, i * .08)); N(.3, .05, 5000, 9000, .1); break;
      case 'coin': T(988, .08, 'square', .12); T(1319, .18, 'square', .12, 0, .07); break;
      case 'wrong': T(330, .18, 'sine', .22, 250); T(262, .22, 'sine', .2, 200, .12); break;   // gentle "hmm"
      case 'whoosh': N(.25, .12, 400, 2500); break;
      case 'splash': N(.3, .18, 1800, 500); break;
      case 'drip': T(900, .09, 'sine', .22, 450); break;
      case 'alarm': for (let i = 0; i < 6; i++) T(i % 2 ? 880 : 1040, .09, 'square', .1, 0, i * .12); break;
      case 'boing': T(200, .25, 'sine', .3, 600); break;
      case 'flip': T(700, .05, 'triangle', .15, 1100); break;
      case 'bell': T(1318, .5, 'sine', .22); T(1976, .5, 'sine', .1, 0, .01); break;
      case 'click': T(1500, .03, 'square', .1); break;
      case 'sleepy': [523, 440, 392, 330].forEach((f, i) => T(f, .4, 'sine', .15, 0, i * .3)); break;
      case 'fanfare': [523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => T(f, .2, 'triangle', .26, 0, i * .12)); N(.5, .06, 6000, 9000, .7); break;
      case 'unlock': [660, 880, 1175].forEach((f, i) => T(f, .15, 'square', .12, 0, i * .08)); break;
      /* ---- sound-design pass: transitions, bumps, movement ---- */
      case 'swish': N(.2, .05, 600, 2000); break;                                                      // soft scene / screen transition
      case 'start': [392, 523, 659].forEach((f, i) => T(f, .14, 'triangle', .14, 0, i * .07)); break;   // mission begins
      case 'bump': T(150, .12, 'sine', .22, 70); N(.07, .08, 700, 300); break;                           // soft collision (never scary)
      case 'thud': T(110, .1, 'sine', .2, 60); break;
      case 'ball': T(180, .12, 'sine', .16, 90); N(.04, .04, 1200, 600); break;
      case 'step': { const k = a || 'hard', v = R(.8, 1.15); if (k === 'grass') N(.05, .02 * v, 900, 450); else if (k === 'sand') N(.07, .024 * v, 500, 280); else if (k === 'tile') { T(R(160, 190), .035, 'sine', .04 * v, 110); N(.03, .02 * v, 2600, 1800); } else { T(R(120, 150), .05, 'sine', .05 * v, 80); N(.03, .025 * v, 1400, 800); } break; }
      case 'hop': T(320, .1, 'sine', .1, 560); break;
      case 'land': T(140, .07, 'sine', .1, 70); N(.04, .03, 900, 400); break;
      /* ---- places ---- */
      case 'doorbell': T(784, .5, 'sine', .18); T(1568, .35, 'sine', .04, 0, .01); T(622, .75, 'sine', .18, 0, .4); T(1244, .5, 'sine', .04, 0, .41); break;
      case 'knock': for (let i = 0; i < 3; i++) { T(190, .07, 'sine', .22, 95, i * .17); N(.04, .07, 500, 300, i * .17); } break;
      case 'ring': for (let b = 0; b < 2; b++) for (let k = 0; k < 6; k++) T(k % 2 ? 1046 : 880, .07, 'triangle', .12, 0, b * .55 + k * .07); break;   // phone trill
      case 'hangup': T(660, .12, 'sine', .13); T(440, .2, 'sine', .13, 0, .13); break;
      case 'clink': { const f = R(2300, 3000); T(f, .14, 'sine', .06); T(f * 1.4, .09, 'sine', .035, 0, .015); break; }
      case 'cash': T(2093, .4, 'sine', .07); T(1568, .5, 'sine', .05, 0, .06); N(.05, .03, 3000, 5000); break;
      case 'schoolbell': for (let i = 0; i < 10; i++) { T(1568, .1, 'sine', .11, 0, i * .08); T(2349, .08, 'sine', .04, 0, i * .08); } break;
      case 'liftding': T(1047, .6, 'sine', .15); T(1568, .5, 'sine', .04, 0, .01); break;
      case 'honk': T(392, .22, 'triangle', .05); T(494, .22, 'triangle', .045); break;
      case 'bird': { const f = R(2200, 3400); for (let i = 0; i < 3; i++) T(f * (1 + i * .06), .07, 'sine', .04, f * (1.25 + i * .05), i * .09); break; }
      case 'gull': T(1500, .26, 'triangle', .045, 1000); T(1250, .32, 'triangle', .04, 800, .3); break;
      case 'chime': { const f = a || [1047, 1175, 1319, 1568, 1760][Math.floor(Math.random() * 5)]; T(f, 1, 'sine', .05); T(f * 2.4, .5, 'sine', .015); break; }
      case 'creak': A.puff(.7, .05, 280, 650, 0, bus || ambBus, 3); T(110, .6, 'sawtooth', .01, 85); break;
      case 'owl': T(420, .35, 'sine', .06, 380); T(380, .55, 'sine', .06, 320, .45); break;
      case 'car': A.puff(2.2, .08, 160, 90, 0, bus || ambBus, .9); break;
      case 'surf': A.puff(2.4, .07, 500, 700, 0, bus || ambBus, .5); break;
    }
  }
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