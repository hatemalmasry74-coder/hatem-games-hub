/* Family Adventures - engine/voice.js : pre-recorded voice narration (NOT speechSynthesis).
   Clips live in assets/voice/<hash>.mp3 and are listed in assets/voice/manifest.json {hash:{voice,text}}.
   id = voiceHash(text) (see DEV.md "Voice system" + tools/voice_hash.py: the two MUST stay identical).
   A clip is only requested when its hash is in the manifest, so a missing clip is silent and never an error. */
(function () {
  'use strict';
  const M = window.Moody;
  const DEFAULTS = { m: 'يوسف', a: 'آدم', me: 'يا بطل', t: 'مريم', n: 'ليلى' };
  const V = M.voice = { manifest: null, loading: null, last: null, instruction: null, cur: null, queue: [], busy: false, collect: /[?&]collectvoice=1/.test(location.search), log: [] };
  if (V.collect) { window.__voiceLog = V.log; setTimeout(() => V.noteFixed && V.noteFixed(), 0); }

  /* ---- normalisation + hash (identical to tools/voice_hash.py) ---- */
  /* NEUTRAL rendering (Play edition: Moody.voice.neutral = true).  The pre-generated clips cannot say a family's names, so every role token is spoken as a neutral word:
     vocative ("يا {a}") -> NT.k[x][1] / NT.f[x][1], elsewhere NT.k[x][0] / NT.f[x][0];  grandparent tokens -> the TITLE the parents chose (V.vars.gm / V.vars.gf, set by engine/family.js).
     The same table + algorithm live in tools/voice_hash.py (tools/play/check_neutral.js compares them): keep BOTH in sync.  Inert while V.neutral is false. */
  const NT = /*NEUTRAL-TABLE*/{"k":{"m":["الكبير","يا بطل"],"a":["الصغير","يا بطل"],"t":["الكبيرة","يا بطلة"],"n":["الصغيرة","يا بطلة"]},"f":{"aunt1":["عمتو","يا عمتو"],"aunt2":["عمتو","يا عمتو"],"uncle1":["عمو","يا عمو"],"aunt1n":["عمتو","يا عمتو"],"aunt2n":["عمتو","يا عمتو"],"uncle1n":["عمو","يا عمو"],"cz1":["ابن عمك","يا صاحبي"],"cz2":["بنت عمك","يا حبيبتي"],"cz3":["ابن عمك الصغير","يا حبيبي"],"cz4":["ابن عمك الكبير","يا صاحبي"],"cz5":["ابن عمك الأكبر","يا صاحبي"],"fr":["صاحبك","يا صاحبي"],"school":["المدرسة","المدرسة"],"dcity":["مدينة بابا","مدينة بابا"],"dcountry":["بلد بابا","بلد بابا"]},"kf":{"m":["الكبيرة","يا بطلة"],"a":["الصغيرة","يا بطلة"]},"t":{"gm":"gm","gmt":"gm","gmn":"gm","gf":"gf","gft":"gf"}}/*END-NEUTRAL-TABLE*/;
  V.neutral = true; V.vars = { gm: 'تيتة', gf: 'جدو', fl: {} }; V.NT = NT;   // fl = {m:true,a:true}: the duo heroes that are girls (Play edition, engine/family_flip.js)
  const NAMES = Object.keys(NT.k).concat(Object.keys(NT.f), Object.keys(NT.t));
  const RE_VOC = new RegExp('يا\\s+\\{(' + NAMES.join('|') + ')\\}', 'g'), RE_BARE = new RegExp('([وفبكل]{0,2}ـ?)\\{(' + NAMES.join('|') + ')\\}', 'g');
  const nword = (k, voc) => { if (NT.k[k]) return (V.vars.fl && V.vars.fl[k] && NT.kf[k] ? NT.kf[k] : NT.k[k])[voc ? 1 : 0]; if (NT.f[k]) return NT.f[k][voc ? 1 : 0]; const t = V.vars[NT.t[k]]; return voc ? 'يا ' + t : t; };
  V.neutralize = s => String(s == null ? '' : s).replace(/\{k([1-4])\}/g, (m, i) => '{' + 'matn'.charAt(i - 1) + '}').replace(/\{me\}/g, DEFAULTS.me)
    .replace(RE_VOC, (m, k) => nword(k, true)).replace(RE_BARE, (m, pre, k) => { let w = nword(k, false); if (/لـ?$/.test(pre) && w.indexOf('ال') === 0) { pre = pre.replace(/ـ$/, ''); w = w.slice(1); } return pre + w; });
  V.resolve = s => (V.neutral ? V.neutralize(s) : String(s == null ? '' : s).replace(/\{m\}/g, DEFAULTS.m).replace(/\{a\}/g, DEFAULTS.a).replace(/\{t\}/g, DEFAULTS.t).replace(/\{n\}/g, DEFAULTS.n).replace(/\{me\}/g, DEFAULTS.me)).replace(/[ \t\r\n ]+/g, ' ').trim();
  V.normalize = s => V.resolve(s).replace(/[ً-ٰٟـ]/g, '');
  function fnv(bytes, h) { for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  const hex8 = n => ('00000000' + n.toString(16)).slice(-8);
  V.hash = (s, salt) => { const b = new TextEncoder().encode(V.normalize(s) + (salt ? '\u0001' + salt : '')); return (hex8(fnv(b, 0x811c9dc5)) + hex8(fnv(b, 0x9747b28c))).slice(0, 12); };

  /* ---- speaker -> voice id (what the offline TTS should use) ---- */
  const VOICES = { narrator: 'narrator', moody: 'boy_big', aboody: 'boy_small', mama: 'mama', baba: 'baba', toota: 'girl_big', nemo: 'girl_small', nana: 'nana', friend: 'boy_big' };
  Object.assign(VOICES, { gf: 'uncle', cz1: 'boy_mid', cz2: 'girl_tiny', cz3: 'boy_tiny', aunt1: 'aunt_a', aunt2: 'aunt_n', cz4: 'teen_a', cz5: 'teen_b', uncle1: 'uncle' });   // extended family = role characters of the Play edition
  V.voiceFor = sp => VOICES[sp] || (M.voice.extraVoices && M.voice.extraVoices[sp]) || 'narrator';
  V.extraVoices = {};                       // worlds may add: Moody.voice.extraVoices.sara = 'girl_big'

  V.enabled = () => M.save.data.settings.narr !== false && M.audio.on();
  V.setEnabled = on => { M.save.data.settings.narr = !!on; M.save.commit(); if (!on) V.stop(); };

  /* ---- collection harness ---- */
  V.note = function (text, speaker) {
    if (!V.collect || !text) return; const pr = prep(text, speaker || 'narrator'), t = V.resolve(pr.raw); if (!t) return; const sp = V.voiceFor(speaker || 'narrator');
    if (!V.log.some(e => e.text === t && e.speaker === sp && (e.salt || '') === pr.salt)) V.log.push({ text: t, raw: pr.raw, who: speaker || 'narrator', speaker: sp, salt: pr.salt, hash: V.hash(t, pr.salt) });
  };
  V.dump = () => JSON.stringify(V.log);

  /* fixed UI phrases that the engine speaks by itself (collected by tools/collect_voice.js) */
  V.fixedStrings = [['قريب! جرّب تاني', 'narrator'], ['شبه الإجابة! جرّب مرة كمان', 'narrator'], ['محاولة حلوة! كمّل', 'narrator'], ['تعالوا نشوفها سوا!', 'narrator'], ['فكّر تاني بهدوء', 'narrator'],
    ['برافو! ممتاز!', 'narrator'], ['شاطرين أوي!', 'narrator'], ['أحسنتم!', 'narrator'], ['حكمة اليوم', 'narrator'], ['اللي يعمل خير يلاقي خير', 'narrator'],
    ['صوت التعليمات شغّال', 'narrator'], ['خلّصوا المهمة اللي قبلها الأول', 'narrator'], ['قريبًا! لسه بنجهّزه', 'narrator'], ['محتاجين عملات أكتر! كمّلوا المهام', 'narrator'],
    ['دوري الأول!', 'aboody'], ['وأنا دوري!', 'moody'], ['دوس في أي مكان عشان تقفز!', 'narrator'], ['اسحب الفرشة على الأماكن الوسخة', 'narrator'],
    ['مش هنا.. جرّب مكان تاني', 'narrator'], ['مش دلوقتي.. فكّر في الأول', 'aboody'], ['ده تقيل أوي! محتاجين {m}', 'aboody'], ['محتاجين {m} الطويل', 'aboody'], ['محتاجين {a} الصغير', 'moody'],
    ['بابا بيتصل بيكم! اضغطوا عشان تردّوا.', 'narrator'], ['احكوا لبابا عن يومكم', 'narrator'], ['يوم حلو أوي', 'narrator'], ['يوم عادي', 'narrator'], ['تعبانين شوية', 'narrator'], ['ردّوا على بابا', 'narrator'], ['عملنا كده!', 'narrator'], ['اضغطوا لما تخلّصوا', 'narrator']];
  V.noteFixed = () => V.fixedStrings.forEach(x => V.note(x[0], x[1]));
  /* ---- manifest (lazy, silent on failure) ---- */
  function load() {
    if (V.loading) return V.loading;
    V.loading = new Promise(res => { try { fetch('assets/voice/manifest.json?v=' + M.VERSION).then(r => r.ok ? r.json() : {}).then(j => { V.manifest = j && typeof j === 'object' ? j : {}; res(); }).catch(() => { V.manifest = {}; res(); }); } catch (e) { V.manifest = {}; res(); } });
    return V.loading;
  }
  V.has = (text, salt) => !!(V.manifest && V.manifest[V.hash(text, salt)]);
  /* optional hooks (Play edition): V.xform(raw, speakerId) -> raw (gender agreement of the duo heroes) ; V.salt(speakerId) -> '' | 'g' (a clip made for a girl voice of a hero the base game voices as a boy) */
  V.xform = null; V.salt = null;
  const prep = (text, sp) => { const raw = V.xform ? V.xform(String(text), sp) : String(text); return { raw, salt: V.salt ? V.salt(sp) : '' }; };

  /* ---- lip-sync: V.speaker (who is talking), V.getLevel() 0..1 mouth energy, V.isSpeaking().
     Real clips: WebAudio AnalyserNode on the clip (same-origin + running AudioContext only). Otherwise: rhythmic talk loop tied to play/ended. ---- */
  let AC = null, AN = null, buf = null, lvl = 0, speakEnd = 0, ana = null, anaZero = 0, rhythm = false, pseudoUntil = 0;
  V.speaker = null;
  function ensureAC() {
    if (AC) return AC; try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); AN = AC.createAnalyser(); AN.fftSize = 512; AN.smoothingTimeConstant = .2; buf = new Uint8Array(AN.fftSize); AN.connect(AC.destination); } catch (e) { AC = null; } return AC;
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, () => { try { if (!AC) ensureAC(); if (AC && AC.state === 'suspended') AC.resume(); } catch (e) { } }, { capture: true, passive: true }));
  function hook(a, url) {   // route the clip through the analyser only when that is safe (audio must stay audible and un-tainted)
    ana = null; anaZero = 0; if (!AC || AC.state !== 'running') return;
    try { if (new URL(url, location.href).origin !== location.origin) return; const src = AC.createMediaElementSource(a); src.connect(AN); ana = a; } catch (e) { ana = null; }
  }
  V.isSpeaking = () => (V.cur && !V.cur.paused && !!V.speaker) || performance.now() < pseudoUntil;
  V.getLevel = () => lvl;
  function pseudo(sp, ms) { V.speaker = sp || V.speaker; pseudoUntil = performance.now() + ms; rhythm = true; }
  M.hooks.frame.push(() => {
    const tn = performance.now() / 1000; let target = 0;
    if (V.cur && !V.cur.paused) {
      if (ana === V.cur) {
        AN.getByteTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; } const rms = Math.sqrt(sum / buf.length); target = Math.min(1, rms * 3.6);
        if (rms < .0008) { anaZero++; if (anaZero > 40 && V.cur.currentTime > .3) ana = null; } else anaZero = 0;   // silent analyser (tainted / unsupported): fall back to the rhythmic loop
      }
      if (ana !== V.cur) target = Math.max(0, (Math.sin(tn * 17) * .5 + .4) * (.65 + .35 * Math.sin(tn * 3.1)) + Math.sin(tn * 7.3) * .1);
    } else if (performance.now() < pseudoUntil) target = Math.max(0, (Math.sin(tn * 17) * .5 + .4) * (.65 + .35 * Math.sin(tn * 3.1)));
    lvl += (target - lvl) * (target > lvl ? .6 : .3); if (lvl < .01) lvl = 0;
    if (!V.cur && performance.now() >= pseudoUntil && V.speaker && lvl === 0) V.speaker = null;
  });

  /* ---- playback (one clip at a time; a new line cancels the previous) ---- */
  let token = 0, pausedByGame = false;
  V.stop = function () { token++; V.queue = []; if (V.cur) { try { V.cur.pause(); } catch (e) { } V.cur = null; } V.busy = false; V.speaker = null; pseudoUntil = 0; ana = null; };
  function playNext(tk) {
    if (tk !== token) return;
    const it = V.queue.shift(); if (!it) { V.busy = false; V.cur = null; V.speaker = null; return; }
    if (!V.has(it.text, it.salt)) { pseudo(it.speaker, Math.max(900, it.text.length * 55)); playNext(tk); return; }            // missing clip: silent (mouth still moves), move on
    try {
      const url = 'assets/voice/' + V.hash(it.text, it.salt) + '.mp3', a = new Audio(url); V.cur = a; V.busy = true; a.volume = 1; V.speaker = it.speaker || null; hook(a, url);
      const nxt = () => { if (tk !== token) return; V.cur = null; ana = null; setTimeout(() => { if (tk === token && !V.cur) { V.speaker = V.queue.length ? V.speaker : null; } playNext(tk); }, it.gap == null ? 250 : it.gap); };
      a.addEventListener('ended', nxt); a.addEventListener('error', nxt);
      const p = a.play(); if (p && p.catch) p.catch(nxt);
    } catch (e) { V.busy = false; }
  }
  function start(items, opts) {
    opts = opts || {};
    if (opts.soft && V.busy) return;                           // soft lines never cut a playing clip
    V.stop(); const tk = token;
    V.queue = items.slice();
    const go = () => {
      if (tk !== token) return;
      if (M.audio.cheering) { const iv = setInterval(() => { if (tk !== token) { clearInterval(iv); return; } if (!M.audio.cheering) { clearInterval(iv); playNext(tk); } }, 120); return; }   // never overlap the owner's cheer clips
      playNext(tk);
    };
    if (V.manifest) go(); else load().then(go);
  }
  V.speak = function (text, o) {
    o = o || {}; if (!text) return; const pr = prep(text, o.speaker || 'narrator'), t = V.resolve(pr.raw);
    V.note(text, o.speaker); V.last = { text: t, speaker: o.speaker || 'narrator' };
    if (o.instruction) V.instruction = V.last;
    if (!V.enabled() && !o.force) { if (!o.soft && o.speaker && o.speaker !== 'narrator' && M.chars && M.chars.defs[o.speaker]) pseudo(o.speaker, Math.max(900, t.length * 55)); return; }   // voice off: the mouth still moves
    start([{ text: t, speaker: o.speaker, salt: pr.salt }], o);
  };
  /* read several texts one after another (e.g. the answer choices) */
  V.speakSeq = function (texts, o) {
    o = o || {}; const items = texts.filter(Boolean).map(t => { const pr = prep(t, o.speaker || 'narrator'), r = V.resolve(pr.raw); V.note(t, o.speaker); return { text: r, speaker: o.speaker, gap: 450, salt: pr.salt }; });
    if (!items.length || (!V.enabled() && !o.force)) return; start(items, o);
  };
  /* the current task instruction (HUD prompt): spoken when it appears, replayable with the "ماذا نفعل؟" button */
  V.setInstruction = function (text) { if (!text) return; V.speak(text, { speaker: 'narrator', instruction: true }); };
  V.replay = function () { const x = V.instruction || V.last; if (x) { V.speak(x.text, { speaker: x.speaker, force: true }); } };
  V.replayLast = function () { if (V.last) V.speak(V.last.text, { speaker: V.last.speaker, force: true }); };
  V.clearInstruction = () => { V.instruction = null; };

  /* pause / resume with the game, respect mute */
  M.hooks.frame.push(() => {
    if (!V.cur) return;
    if (M.paused && !pausedByGame) { pausedByGame = true; try { V.cur.pause(); } catch (e) { } }
    else if (!M.paused && pausedByGame) { pausedByGame = false; try { const p = V.cur.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
    if (!M.audio.on() && V.cur) V.stop();
  });
  /* long-press helper: pressing an element for 500 ms speaks `getText()` and swallows the click */
  V.pressSpeak = function (el, getText, speaker) {
    let tm = null, fired = false;
    el.addEventListener('pointerdown', () => { fired = false; tm = setTimeout(() => { fired = true; V.speak(getText(), { speaker: speaker || 'narrator', force: true }); }, 500); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => el.addEventListener(e, () => clearTimeout(tm)));
    el.addEventListener('click', e => { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
  };
})();
