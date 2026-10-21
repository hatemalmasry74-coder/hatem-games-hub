/* Moody & Aboody - engine/soundscape.js : global UI sounds, footsteps, per-world ambience beds + sparse nature/place sounds, and a tiny procedural music loop.
   Everything is synthesized with WebAudio (no assets). Cheap by design: per world at most ONE looping noise bed (5 nodes), one music scheduler and a few one-shot notes.
   API (all optional for worlds):
     Moody.sound.enter(worldId)   a mission world (or 'menu') became current           (called by engine/ctx.js)
     Moody.sound.scene(bgName)    the mission switched backdrop (accents per scene)       (called by ctx.scene)
     Moody.sound.sync()           settings changed (sound / music / volume) -> apply now
     Moody.sound.swish()          soft transition whoosh
   Voice stays untouched: ducking only READS Moody.voice.busy / Moody.audio.cheering. */
(function () {
  'use strict';
  const M = window.Moody, A = M.audio, S = M.sound = { world: 'menu', sceneName: '' };
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];

  /* ------------------------------------------------------------------ profiles */
  /* bed: noise colour (f = filter Hz, ft = filter type, vol, lfo = swell rate Hz, depth = swell depth 0..1).  ev: sparse one-shots [name, minGap s, maxGap s]. */
  const BED = {
    room: { ft: 'lowpass', f: 220, q: .5, vol: .16 },
    wind: { ft: 'lowpass', f: 520, q: .6, vol: .30, lfo: .09, depth: .55 },
    waves: { ft: 'lowpass', f: 700, q: .5, vol: .42, lfo: .11, depth: .8 },
    crowd: { ft: 'bandpass', f: 520, q: .6, vol: .16, lfo: .27, depth: .45 },
    street: { ft: 'lowpass', f: 300, q: .6, vol: .26, lfo: .06, depth: .3 },
    night: { ft: 'lowpass', f: 380, q: .5, vol: .24, lfo: .05, depth: .6 }
  };
  const WORLD = {
    menu: { bed: 'wind', bedVol: .5, ev: [['bird', 7, 16]], music: 'menu' },
    home: { bed: 'room', ev: [['bird', 9, 20], ['clink', 14, 30]], music: 'home', surface: 'tile' },
    school: { bed: 'crowd', bedVol: .6, ev: [['bird', 8, 16]], music: 'school', surface: 'tile', enter: 'schoolbell' },
    street: { bed: 'street', ev: [['car', 5, 11], ['honk', 14, 28], ['bird', 12, 25]], music: 'street', surface: 'hard' },
    market: { bed: 'crowd', ev: [['cash', 9, 18], ['clink', 10, 22], ['bell', 20, 40]], music: 'market', surface: 'hard' },
    park: { bed: 'wind', ev: [['bird', 2.5, 6], ['chime', 16, 30]], music: 'park', surface: 'grass' },
    sea: { bed: 'waves', ev: [['gull', 8, 16], ['surf', 6, 12], ['splash', 18, 34]], music: 'sea', surface: 'sand' },
    nana: { bed: 'room', ev: [['clock', 4, 4], ['chime', 20, 40], ['bird', 14, 26]], music: 'nana', surface: 'tile' },
    saudi: { bed: 'wind', bedVol: .8, ev: [['chime', 14, 28], ['bird', 18, 36]], music: 'saudi', surface: 'sand' },
    habits: { bed: 'room', ev: [['bird', 10, 22], ['clink', 20, 40]], music: 'habits', surface: 'tile' },
    gathering: { bed: 'room', bedVol: 1.2, ev: [['clink', 6, 14], ['bird', 16, 30]], music: 'gathering', surface: 'tile' },
    runs: { bed: 'wind', bedVol: .6, ev: [['bird', 8, 16]], music: 'runs', surface: 'hard' },
    mystery: { bed: 'night', ev: [['creak', 9, 18], ['owl', 14, 28], ['drip', 7, 14], ['chime', 18, 34]], music: 'mystery', surface: 'tile' },
    call: { bed: null, ev: [], music: null, surface: 'tile' },
    room: { bed: 'room', ev: [], music: 'menu', surface: 'tile' }
  };
  /* scene accents: first matching regexp adds events (and may set the walking surface) */
  const SCENE = [
    [/kitchen|dining|pantry|bakery/, { ev: [['clink', 4, 9], ['drip', 10, 20]] }],
    [/bath/, { ev: [['drip', 2.5, 5], ['splash', 14, 26]] }],
    [/bed/, { ev: [['clock', 4, 4]] }],
    [/garden|yard|tree|balcony|station/, { ev: [['bird', 2.5, 6]], surface: 'grass' }],
    [/gym/, { ev: [['ball', 3, 7]] }],
    [/class|lab|library|study/, { ev: [['clock', 4, 4]] }],
    [/street|block|alley|shops|road|mk_market/, { ev: [['car', 5, 10], ['honk', 15, 30]], surface: 'hard' }],
    [/mk_checkout/, { ev: [['cash', 4, 9]] }],
    [/attic|hall|living|pantry/, {}]
  ];
  /* played once when a scene appears (after the transition) */
  const ENTER = [[/door/, ['doorbell', 'knock']], [/lift/, ['liftding']], [/class/, ['schoolbell']], [/mk_checkout/, ['cash']]];

  /* mood = music. root = MIDI-ish note number, sc = scale steps (pentatonic), bpm, w = oscillator, v = note volume, dens = chance a step has a note,
     len = note length in steps (bell/pluck feel), oct = melody octave shift, drone = low sustained fifth */
  const MAJ = [0, 2, 4, 7, 9], MIN = [0, 3, 5, 7, 10];
  const MOOD = {
    menu: { root: 60, sc: MAJ, bpm: 76, w: 'sine', v: .13, dens: .5, len: 3 },
    home: { root: 57, sc: MAJ, bpm: 72, w: 'sine', v: .12, dens: .48, len: 3.5 },          // calm
    school: { root: 67, sc: MAJ, bpm: 100, w: 'triangle', v: .12, dens: .62, len: 2 },
    street: { root: 62, sc: MAJ, bpm: 108, w: 'triangle', v: .11, dens: .66, len: 1.4 },
    market: { root: 64, sc: MAJ, bpm: 112, w: 'triangle', v: .11, dens: .7, len: 1.2 },
    park: { root: 72, sc: MAJ, bpm: 90, w: 'sine', v: .12, dens: .55, len: 2.5, oct: 0 },
    sea: { root: 62, sc: MAJ, bpm: 84, w: 'sine', v: .12, dens: .62, len: 3 },
    nana: { root: 58, sc: MAJ, bpm: 64, w: 'sine', v: .11, dens: .42, len: 4 },                // lullaby
    saudi: { root: 62, sc: [0, 2, 3, 7, 8], bpm: 82, w: 'triangle', v: .11, dens: .5, len: 2.5, drone: 1 },
    habits: { root: 67, sc: MAJ, bpm: 88, w: 'sine', v: .12, dens: .55, len: 2.5 },
    gathering: { root: 65, sc: MAJ, bpm: 104, w: 'triangle', v: .12, dens: .62, len: 2 },
    runs: { root: 64, sc: MAJ, bpm: 124, w: 'triangle', v: .11, dens: .72, len: 1.1 },        // bouncy
    mystery: { root: 57, sc: MIN, bpm: 58, w: 'sine', v: .11, dens: .3, len: 5, drone: 1 }    // mysterious: slow, sparse, minor, low drone
  };

  /* ------------------------------------------------------------------ state */
  let want = { w: 'menu', s: '' };   // what the game currently is
  let bedL = null;                    // the live bed layer {key,src,filt,gain,lfo,lg}
  let evs = [];                       // active sparse events [{name, lo, hi, next}]
  let mus = null;                     // {mood, step, next, phrase, cnt}
  let lastBell = 0, musFadeAt = 0, pendingMood = undefined, wasOn = false;
  const AC = () => A.ctx();

  /* ------------------------------------------------------------------ beds */
  let pinkB = null;
  function pinkBuf(ac) {
    if (pinkB && pinkB.sampleRate === ac.sampleRate) return pinkB;
    const n = Math.floor(ac.sampleRate * 4), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, pk = 0;
    for (let i = 0; i < n; i++) {   // Paul Kellet pink-noise filter
      const w = Math.random() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
      d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362; b6 = w * .115926; pk = Math.max(pk, Math.abs(d[i]));
    }
    const g = .8 / pk; for (let i = 0; i < n; i++) d[i] *= g;
    const X = 2048; for (let i = 0; i < X; i++) { const k = i / X; d[i] = d[i] * k + d[n - X + i] * (1 - k); }   // seamless loop
    return (pinkB = b);
  }
  function startBed(key, mul) {
    const ac = AC(), bus = A.bus(); if (!ac || !bus || !BED[key]) return null; const def = BED[key], vol = def.vol * (mul || 1);
    const src = ac.createBufferSource(); src.buffer = pinkBuf(ac); src.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = def.ft; fl.frequency.value = def.f; fl.Q.value = def.q || .6;
    const g = ac.createGain(), t = ac.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 2.2);
    src.connect(fl); fl.connect(g); g.connect(bus.amb); let lfo = null, lg = null;
    if (def.lfo) { lfo = ac.createOscillator(); lfo.frequency.value = def.lfo; lg = ac.createGain(); lg.gain.value = vol * def.depth * .5; lfo.connect(lg); lg.connect(g.gain); lfo.start(t); }
    src.start(t, Math.random() * 3);
    return { key, mul: mul || 1, src, fl, g, lfo, lg };
  }
  function stopBed(L, fast) {
    if (!L) return; const ac = AC(); if (!ac) return; const t = ac.currentTime, tc = fast ? .05 : .5, end = t + (fast ? .3 : 2.5);
    try { L.g.gain.cancelScheduledValues(t); L.g.gain.setValueAtTime(L.g.gain.value, t); L.g.gain.setTargetAtTime(0, t, tc); } catch (e) { }
    try { L.src.stop(end); if (L.lfo) L.lfo.stop(end); } catch (e) { }
    L.src.onended = () => { try { L.src.disconnect(); L.fl.disconnect(); L.g.disconnect(); if (L.lg) L.lg.disconnect(); } catch (e) { } };
  }

  /* ------------------------------------------------------------------ sparse events */
  function playEv(name) {
    if (name === 'clock') { A.tone(1900, .025, 'sine', .018, 0, 0, A.bus().amb); return; }
    if (name === 'bell') { A.tone(1568, .6, 'sine', .035, 0, 0, A.bus().amb); return; }
    if (name === 'splash') { A.noise(.35, .035, 1800, 500, 0, A.bus().amb); return; }
    if (name === 'drip') { A.tone(rnd(750, 1000), .1, 'sine', .05, 420, 0, A.bus().amb); return; }
    if (name === 'ball') { A.tone(170, .12, 'sine', .06, 90, 0, A.bus().amb); return; }
    A.amb(name);
  }
  function setEvents(list) { const ac = AC(), t = ac ? ac.currentTime : 0; evs = (list || []).map(e => ({ name: e[0], lo: e[1], hi: e[2], next: t + rnd(e[1] * .4, e[2]) })); }
  let prof = null;
  const profile = () => prof || (prof = computeProfile());
  function computeProfile() {
    const w = WORLD[want.w] || WORLD.menu; let ev = w.ev.slice(), surface = w.surface;
    if (want.s) for (const r of SCENE) if (r[0].test(want.s)) { if (r[1].ev) ev = ev.concat(r[1].ev); if (r[1].surface) surface = r[1].surface; break; }
    return { w, ev, surface: surface || 'hard' };
  }
  S.surface = () => profile().surface;

  /* ------------------------------------------------------------------ music */
  function newPhrase(m, seed) {
    const ph = [], N = m.sc.length * 2; let d = 2 + (seed % 3);
    for (let i = 0; i < 16; i++) {
      const strong = i % 4 === 0, on = strong ? Math.random() < Math.min(1, m.dens + .35) : Math.random() < m.dens * .75 * (i % 2 ? .6 : 1);
      d = Math.max(0, Math.min(N - 1, d + pick([-2, -1, -1, 0, 1, 1, 2]))); ph.push(on ? d : -1);
    }
    return ph;
  }
  function startMusic(mood) {
    const m = MOOD[mood]; if (!m) { mus = null; return; } const ac = AC();
    mus = { mood, m, step: 0, next: ac.currentTime + .25, phrase: newPhrase(m, mood.length), n: 0 };
  }
  function freq(m, deg) { const sc = m.sc, o = Math.floor(deg / sc.length), midi = m.root + sc[((deg % sc.length) + sc.length) % sc.length] + 12 * o + 12 * (m.oct || 0); return 440 * Math.pow(2, (midi - 69) / 12); }
  /* schedule notes up to `horizon` seconds ahead of the audio clock (called by the 250 ms tick; tests call pump(20) on an offline context) */
  function pump(horizon) {
    const ac = AC(), bus = A.bus(); if (!ac || !bus || !mus || !A.musicOn()) return; const m = mus.m, sd = 30 / m.bpm;   // one step = an eighth note
    let guard = 0;
    while (mus.next < ac.currentTime + horizon && guard++ < 200) {
      const i = mus.step % 16, dl = mus.next - ac.currentTime + rnd(0, .008), deg = mus.phrase[i];
      if (deg >= 0) A.tone(freq(m, deg), Math.max(.12, sd * m.len), m.w, m.v * (i % 4 === 0 ? 1 : .8), 0, Math.max(0, dl), bus.mus);
      if (i % 8 === 0) A.tone(freq(m, 0) / 2, sd * 5, 'triangle', m.v * .9, 0, Math.max(0, dl), bus.mus);
      else if (i % 8 === 4 && mus.n % 2) A.tone(freq(m, 3) / 2, sd * 3, 'triangle', m.v * .6, 0, Math.max(0, dl), bus.mus);
      if (m.drone && i === 0 && mus.step % 32 === 0) A.tone(freq(m, 0) / 4, sd * 14, 'sine', m.v * .8, 0, Math.max(0, dl), bus.mus);
      mus.next += sd; mus.step++;
      if (mus.step % 16 === 0) { mus.n++; if (mus.n % 2 === 0) { for (let k = 0; k < 3; k++) { const j = Math.floor(Math.random() * 16); mus.phrase[j] = Math.random() < .35 ? -1 : Math.max(0, Math.min(m.sc.length * 2 - 1, (mus.phrase[j] < 0 ? 3 : mus.phrase[j]) + pick([-1, 1]))); } } if (mus.n % 8 === 0) mus.phrase = newPhrase(m, mus.n); }
    }
  }
  S._pump = pump; S._reconcile = () => reconcile(); S._start = startMusic; S._moods = MOOD;

  /* ------------------------------------------------------------------ reconcile + tick */
  function killAll() {
    if (bedL) { stopBed(bedL, true); bedL = null; } evs = []; mus = null; pendingMood = undefined; wasOn = false;
  }
  function reconcile() {
    const ac = AC(), bus = A.bus(); if (!ac || !bus) return;
    if (document.hidden || M.suspended) { if (bedL || mus) killAll(); return; }
    const soundOn = A.on(), musicOn = A.musicOn(), P = profile(), runner = !!(M.runner && M.runner.cur), t = ac.currentTime;
    /* ambience bed */
    const bedKey = soundOn && !(want.w === 'call') ? P.w.bed : null, mul = P.w.bedVol || 1;
    if (bedL && (!bedKey || bedL.key !== bedKey || bedL.mul !== mul)) { stopBed(bedL, !soundOn); bedL = null; }
    if (!bedL && bedKey) bedL = startBed(bedKey, mul);
    /* sparse events */
    if (!soundOn) evs = []; else { const sig = P.ev.map(e => e[0]).join(','), cur = evs.map(e => e.name).join(','); if (sig !== cur) setEvents(P.ev); }
    /* music: crossfade by dipping the music bus, then switching the mood */
    const wantMood = musicOn && !runner ? P.w.music : null, targetG = musicOn ? .3 : 0;
    if (!wantMood) { if (mus) { mus = null; } pendingMood = undefined; }
    else if (!mus) { startMusic(wantMood); try { bus.mus.gain.cancelScheduledValues(t); bus.mus.gain.setValueAtTime(0, t); bus.mus.gain.linearRampToValueAtTime(targetG, t + 2); } catch (e) { } }
    else if (mus.mood !== wantMood) {
      if (pendingMood === undefined) { pendingMood = wantMood; musFadeAt = t + .7; try { bus.mus.gain.cancelScheduledValues(t); bus.mus.gain.setTargetAtTime(0, t, .2); } catch (e) { } }
    }
    if (pendingMood !== undefined && t >= musFadeAt) { startMusic(pendingMood); pendingMood = undefined; try { bus.mus.gain.cancelScheduledValues(t); bus.mus.gain.setTargetAtTime(targetG, t, .6); } catch (e) { } }
    /* music toggled off/on: silence instantly (notes already scheduled go quiet), restore smoothly */
    if (musicOn !== wasOn) { wasOn = musicOn; try { bus.mus.gain.cancelScheduledValues(t); if (musicOn) { bus.mus.gain.setValueAtTime(bus.mus.gain.value, t); bus.mus.gain.linearRampToValueAtTime(.3, t + 1.5); } else bus.mus.gain.setValueAtTime(0, t); } catch (e) { } }
  }
  function tick() {
    const ac = AC(), bus = A.bus(); if (!ac || !bus) return;
    if (document.hidden || M.suspended) { if (bedL || mus) killAll(); return; }
    if (ac.state !== 'running') return;
    reconcile();
    /* ducking: music + ambience sit under narration and the owner's cheer clips */
    const voice = (M.voice && M.voice.busy) || A.cheering, tg = voice ? .32 : (M.paused ? .6 : 1);
    try { bus.bed.gain.setTargetAtTime(tg, ac.currentTime, .18); } catch (e) { }
    if (A.on()) {
      const t = ac.currentTime;
      for (const e of evs) if (t >= e.next) { e.next = t + rnd(e.lo, e.hi); if (!M.paused) playEv(e.name); }
    }
    pump(1.2);
  }
  setInterval(tick, 250);
  A.onReady = () => { setTimeout(() => { reconcile(); }, 0); };

  S.enter = function (w) { prof = null; want = { w: WORLD[w] ? w : 'menu', s: '' }; S.world = want.w; S.sceneName = ''; if (AC()) { reconcile(); const P = WORLD[want.w]; if (P && P.enter && want.w !== 'menu') setTimeout(() => { if (S.world === want.w) { lastBell = performance.now(); A.sfx(P.enter); } }, 900); } };
  S.scene = function (name) {
    name = typeof name === 'string' ? name : ''; prof = null; want.s = name; S.sceneName = name; if (!AC()) return;
    reconcile(); for (const r of ENTER) if (r[0].test(name)) { const w = want.w, nm = name; r[1].forEach((s, i) => setTimeout(() => { if (S.world === w && S.sceneName === nm && !M.paused && !document.hidden && !(s === 'schoolbell' && performance.now() - lastBell < 4000)) A.sfx(s); }, 700 + i * 900)); break; }
  };
  S.sync = function () {
    const bus = A.bus(); if (!AC()) return; if (!A.on() || !A.musicOn()) { try { if (bus) bus.mus.gain.setValueAtTime(0, AC().currentTime); } catch (e) { } if (!A.on()) { if (bedL) { stopBed(bedL, true); bedL = null; } evs = []; } if (!A.musicOn()) mus = null; }
    reconcile();
  };
  S.swish = function () { if (AC() && A.on() && !M.paused) A.sfx('swish'); };
  S.state = () => ({ world: want.w, scene: want.s, bed: bedL ? bedL.key : null, music: mus ? mus.mood : null, events: evs.map(e => e.name), surface: profile().surface });

  /* ------------------------------------------------------------------ global UI tap sound (capture phase, delegated) */
  const SEL = 'button,[role=button],a[href],.card,.mcard,.opt,.choicecard,.seqcard,.cardmem,.chip,.rn-card,.fw-sw,.fw-kid,.fw-tab,summary,label,input[type=checkbox],input[type=radio]';
  document.addEventListener('click', ev => {
    try {
      const t = ev.target && ev.target.closest ? ev.target.closest(SEL) : null; if (!t || !A.on()) return;
      if (t.closest('[data-nosound]') || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
      const s0 = A.stamp; setTimeout(() => { if (A.stamp === s0) A.sfx('tap'); }, 0);   // only when the element's own handler did not already make a sound
    } catch (e) { }
  }, true);

  /* ------------------------------------------------------------------ footsteps / hop / land for characters on the stage */
  const trk = {}; let lastStep = 0, lastT = 0;
  M.hooks.frame.push(() => {
    const sc = M.scene, ac = AC(); const now = performance.now(), dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    if (!ac || !sc || !sc.heroes || !sc.cast || M.paused || M.suspended || !A.on() || ac.state !== 'running') return;
    const surface = profile().surface;
    for (const id in sc.heroes) {
      const h = sc.heroes[id]; if (!h || h.visible === false || (sc.cast.indexOf(id) < 0)) continue;
      const s = trk[id] || (trk[id] = { x: h.x, y: h.y, a: 0, air: false, t: 0 });
      const moved = Math.hypot(h.x - s.x, h.y - s.y); s.x = h.x; s.y = h.y;
      const walking = h.tx != null && moved > .01, running = h.fa === 'run' && !(h.jy > 2), air = h.fa === 'jump' || h.jy > 2;
      if ((walking && moved < 60) || running) {
        s.a += walking ? moved : 0; s.t += dt;
        if ((walking && s.a > 62) || (running && s.t > .24)) { s.a = 0; s.t = 0; if (now - lastStep > 110) { lastStep = now; A.sfx('step', surface); } }
      } else { s.t = 0; }
      if (air && !s.air) A.sfx('hop'); else if (!air && s.air) A.sfx('land');
      s.air = air;
    }
  });
})();
