/* engine/family.js : RUNTIME family personalisation (the "Play edition" core).
   One module, no network.  The parents' answers live in  Moody.save.data.family  (device only).  Everything else in the game talks about people through ROLE TOKENS
   that are resolved here when text is shown (Moody.fmt) - the clip ids of the narration use a NEUTRAL rendering of the same tokens (engine/voice.js, tools/voice_hash.py).

   TOKENS (usable in every string of the game: dialogue, titles, questions, diary, ...)
     kids by slot (the slot fixes the GENDER, see "limits" below):  {m}={k1} older boy (id moody) | {a}={k2} younger boy (aboody) | {t}={k3} older girl (toota) | {n}={k4} younger girl (nemo)
     {me} the child's own nickname ("يا بطل" when empty)
     grandmother {gm} title+name | {gmt} title only | {gmn} name only (title when no name);  grandfather {gf} {gft}
     {aunt1} {aunt2} = "عمتو "+name    {uncle1} = "عمو "+name    {aunt1n} {aunt2n} {uncle1n} = the bare name (what dad / grandma call them)    cousins {cz1}..{cz5} (name)    {fr} = the friend of every world = cousin 1
     {school} the school name   {dcity} {dcountry} the city / country where dad works (the trip world)
   LIMITS (honest): a kid slot's gender is FIXED by the slot (text is gendered Arabic); a family chooses WHICH slots are its children, their names, ages, looks;
     slots that are not the family's children stay in the stories as FRIENDS with default names; relatives that are not enabled stay as default "family friends" (never removed:
     no scene, counting question or mission can break); only worlds that cannot make sense are hidden (grandmother's house + gathering without a grandmother, the trip without a travelling dad). */
(function () {
  'use strict';
  const M = window.Moody;
  const F = M.family = { VERSION: 1, ready: false };

  /* ------------------------------------------------------------------ roles */
  const D = {   // default (persona) data of every role.  ids = DEFS ids of engine/chars.js
    moody: { kind: 'kid', slot: 1, g: 'm', name: 'يوسف', age: 9, tok: 'm', label: 'ولد أكبر' },
    aboody: { kind: 'kid', slot: 2, g: 'm', name: 'آدم', age: 6, tok: 'a', label: 'ولد أصغر' },
    toota: { kind: 'kid', slot: 3, g: 'f', name: 'مريم', age: 13, tok: 't', label: 'بنت أكبر' },
    nemo: { kind: 'kid', slot: 4, g: 'f', name: 'ليلى', age: 10, tok: 'n', label: 'بنت أصغر' },
    nana: { kind: 'gm', g: 'f', name: '', title: 'تيتة', age: 68, tok: 'gm', label: 'الجدة' },
    gf: { kind: 'gf', g: 'm', name: '', title: 'جدو', age: 70, tok: 'gf', label: 'الجد' },
    aunt1: { kind: 'aunt', g: 'f', name: 'سلوى', title: 'عمتو', age: 42, tok: 'aunt1', label: 'العمة الأولى' },
    aunt2: { kind: 'aunt', g: 'f', name: 'هدى', title: 'عمتو', age: 38, tok: 'aunt2', label: 'العمة الثانية' },
    uncle1: { kind: 'uncle', g: 'm', name: 'سامي', title: 'عمو', age: 34, tok: 'uncle1', label: 'العم' },
    cz1: { kind: 'cz', g: 'm', name: 'كريم', age: 10, tok: 'cz1', label: 'ولد ١٠ سنين' },
    cz2: { kind: 'cz', g: 'f', name: 'جودي', age: 4, tok: 'cz2', label: 'بنت صغيرة' },
    cz3: { kind: 'cz', g: 'm', name: 'حمزة', age: 4, tok: 'cz3', label: 'ولد صغير' },
    cz4: { kind: 'cz', g: 'm', name: 'هشام', age: 15, tok: 'cz4', label: 'ولد كبير' },
    cz5: { kind: 'cz', g: 'm', name: 'عمر', age: 18, tok: 'cz5', label: 'شاب' }
  };
  F.D = D; F.KIDS = ['moody', 'aboody', 'toota', 'nemo']; F.REL = ['nana', 'gf', 'aunt1', 'aunt2', 'uncle1', 'cz1', 'cz2', 'cz3', 'cz4', 'cz5']; F.IDS = F.KIDS.concat(F.REL);
  F.GM_TITLES = ['جدتي', 'تيتة', 'ننا', 'ستو', 'ماما']; F.GF_TITLES = ['جدو', 'سيدو', 'جدي'];
  F.DESTS = [{ id: 'generic', city: 'مدينة بابا', country: 'بلد بابا' }, { id: 'taif', city: 'الطائف', country: 'السعودية' }, { id: 'baha', city: 'الباحة', country: 'السعودية' }, { id: 'salalah', city: 'صلالة', country: 'عُمان' }, { id: 'ajloun', city: 'عجلون', country: 'الأردن' }];   // hill towns with mist: the trip world's scenery (mountains, mist, cable car) fits all of them
  /* roles that are only a cameo in some worlds: when NOT enabled by the parents they are simply left out there (no persona) */
  F.MUTE = { uncle1: ['saudi'], cz3: ['saudi'], aunt2: ['nana'], gf: ['*'] };

  /* look presets (the wizard shows exactly these) */
  F.SKINS = ['#f3d2b3', '#e9bd94', '#d79a68', '#c18455', '#9a6540', '#6f4529'];
  F.HAIRC = ['#17110c', '#3b2417', '#6a4630', '#b88a4a', '#9a4a22', '#cfcfd6'];
  F.FAV = ['#3fae6a', '#4a8dff', '#ff6f91', '#8a6bd6', '#ff8a2a', '#1fb5a6', '#e5534b', '#ffc93c'];
  F.HIJ = ['#f6e4de', '#7d2447', '#2b3a67', '#1fb5a6', '#c9b6ec', '#3a3a40', '#e0825e', '#7fb08f'];
  F.HATC = ['#f8cdd8', '#ffd23c', '#7cc4ff', '#9be0a4'];
  F.HAIR_BOY = [['short', 'قصير'], ['curly', 'مجعّد']];
  F.HAIR_GIRL = [['ponytail', 'ذيل حصان'], ['pigtails', 'ضفيرتين'], ['bob', 'كاريه'], ['curly', 'مجعّد']];
  F.HAIR_WOMAN = [['bob', 'كاريه'], ['ponytail', 'ذيل']];
  const hairList = id => { const d = D[id]; return d.kind === 'kid' || d.kind === 'cz' ? (d.g === 'f' ? F.HAIR_GIRL : F.HAIR_BOY) : d.g === 'f' ? F.HAIR_WOMAN : F.HAIR_BOY; };
  F.hairList = hairList;
  F.canHijab = id => D[id].g === 'f' && (D[id].kind === 'kid' || D[id].kind === 'gm' || D[id].kind === 'aunt');

  /* ------------------------------------------------------------------ config */
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>{}\\'"`$&\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 12);
  F.clean = clean;
  const blankLook = () => ({});
  F.defaults = function () {
    const c = { v: 1, done: false, kids: {}, dad: { travels: true, dest: 'generic' }, school: '', friend: '' };
    F.IDS.forEach(id => { const d = D[id]; c[id] = { on: false, name: d.name, age: d.age, look: blankLook() }; if (d.title) c[id].title = d.title; });
    return c;
  };
  F.normalize = function (raw) {
    const c = F.defaults(); if (!raw || typeof raw !== 'object') return c;
    c.done = !!raw.done; c.school = clean(raw.school, 22); c.dad.travels = !(raw.dad && raw.dad.travels === false);
    c.dad.dest = raw.dad && F.DESTS.some(x => x.id === raw.dad.dest) ? raw.dad.dest : 'generic';
    F.IDS.forEach(id => {
      const r = raw[id], d = D[id]; if (!r || typeof r !== 'object') return; const o = c[id];
      o.on = !!r.on; if (r.name != null) o.name = clean(r.name, 12); if (d.kind === 'gm' || d.kind === 'gf') { o.name = clean(r.name, 12); o.title = (d.kind === 'gm' ? F.GM_TITLES : F.GF_TITLES).indexOf(r.title) >= 0 ? r.title : d.title; }
      else if (!o.name) o.name = d.name;
      const a = parseInt(r.age, 10); if (a >= 2 && a <= 99) o.age = a;
      if (r.look && typeof r.look === 'object') { const l = r.look, q = o.look;
        if (/^#[0-9a-f]{6}$/i.test(l.skin || '')) q.skin = l.skin; if (hairList(id).some(h => h[0] === l.hair)) q.hair = l.hair; if (/^#[0-9a-f]{6}$/i.test(l.hairC || '')) q.hairC = l.hairC;
        if (/^#[0-9a-f]{6}$/i.test(l.fav || '')) q.fav = l.fav; if (typeof l.gl === 'boolean') q.gl = l.gl; if (l.hat === false || /^#[0-9a-f]{6}$/i.test(l.hat || '')) q.hat = l.hat;
        if (F.canHijab(id) && (l.hij === false || /^#[0-9a-f]{6}$/i.test(l.hij || ''))) q.hij = l.hij; }
    });
    return c;
  };
  let CFG = null;
  F.cfg = function () { if (!CFG) CFG = F.normalize(M.save && M.save.data && M.save.data.family); return CFG; };
  F.done = () => !!F.cfg().done;
  F.save = function (cfg, opts) {
    CFG = F.normalize(cfg); CFG.done = !(opts && opts.done === false) && (opts && opts.done != null ? !!opts.done : true);
    try { M.save.data.family = JSON.parse(JSON.stringify(CFG)); M.save.data.named = true; M.save.commit(); } catch (e) { }
    F.apply(); return CFG;
  };
  F.on = id => !!F.cfg()[id] && F.cfg()[id].on;
  F.dad = () => F.cfg().dad;
  F.dest = () => F.DESTS.find(x => x.id === F.cfg().dad.dest) || F.DESTS[0];
  F.dadTravels = () => !!F.cfg().dad.travels;
  F.age = id => (F.cfg()[id] || D[id]).age || D[id].age;
  F.tierFor = id => { if (!D[id] || D[id].kind !== 'kid') return 9; return F.age(id) <= 7 ? 6 : 9; };

  /* ------------------------------------------------------------------ names + tokens */
  const nameOf = id => { const o = F.cfg()[id], d = D[id]; return clean(o && o.name ? o.name : d.name, 12) || d.name; };
  F.nameOf = nameOf;
  F.titleOf = id => { const o = F.cfg()[id], d = D[id]; return d.kind === 'gm' || d.kind === 'gf' ? ((o && o.title) || d.title) : d.title || ''; };
  F.fullName = function (id) {
    const d = D[id], n = nameOf(id), t = F.titleOf(id);
    if (d.kind === 'gm' || d.kind === 'gf') return n ? t + ' ' + n : t;
    if (d.kind === 'aunt' || d.kind === 'uncle') return t + ' ' + n;
    return n;
  };
  let TOK = null;
  F.tokens = function () {
    if (TOK) return TOK; const T = {}, c = F.cfg(), nm = (M.save && M.save.data && M.save.data.names) || {};
    F.KIDS.forEach(id => { const n = nameOf(id); T[D[id].tok] = n; T['k' + D[id].slot] = n; });
    T.me = (nm.me || '').trim() || 'يا بطل';
    T.gm = F.fullName('nana'); T.gmt = F.titleOf('nana'); T.gmn = nameOf('nana') || F.titleOf('nana');
    T.gf = F.fullName('gf'); T.gft = F.titleOf('gf');
    ['aunt1', 'aunt2', 'uncle1'].forEach(id => { T[id] = F.fullName(id); T[id + 'n'] = nameOf(id); }); ['cz1', 'cz2', 'cz3', 'cz4', 'cz5'].forEach(id => { T[id] = nameOf(id); });
    T.fr = nameOf('cz1');
    T.school = c.school || 'مدرسة الأمل الابتدائية'; T.dcity = F.dest().city; T.dcountry = F.dest().country;
    return (TOK = T);
  };
  F.invalidate = () => { TOK = null; };
  F.fmt = function (s) {
    s = String(s == null ? '' : s); if (s.indexOf('{') < 0) return s; const T = F.tokens();
    return s.replace(/\{([a-z][a-z0-9]*)\}/g, (m, k) => Object.prototype.hasOwnProperty.call(T, k) ? T[k] : m);
  };
  M.fmt = F.fmt;

  /* title words used by the NEUTRAL narration (engine/voice.js reads these) */
  F.voiceTitles = () => ({ gm: F.titleOf('nana'), gf: F.titleOf('gf') });

  /* ------------------------------------------------------------------ characters */
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); return m ? m[1] : null; };
  function shade(c, k) { const h = hex(c); if (!h) return c; const n = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); return '#' + n.map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))).toString(16).padStart(2, '0')).join(''); }
  F.shade = shade;
  let BASE = null;
  function snapshot() { if (BASE) return; BASE = {}; F.IDS.concat(['baba']).forEach(id => { const d = M.chars.defs[id]; if (d) BASE[id] = JSON.parse(JSON.stringify(d)); }); }
  F.base = id => { snapshot(); return BASE[id]; };
  F.lookProps = function (id, look, base) {
    look = look || {}; const p = {}, g = D[id] ? D[id].g : 'm', set = (k, v) => { p[k] = v; };
    if (look.skin) { set('skin', look.skin); set('skinD', shade(look.skin, -.1)); if (base.legC && base.legC === base.skin) set('legC', look.skin); if (base.pants === base.skin) set('pants', look.skin); }
    if (look.hair) { set('hair', look.hair); if (look.hair === 'curly' && !base.curl) set('curl', .3); }
    if (look.hairC) set('hairC', look.hairC);
    if (look.fav) { set('shirt', look.fav); if (base.top === 'dress' || base.top === 'floral') set('skirt', look.fav); if (base.under) set('under', look.fav); if (base.hemC && g === 'f') set('hemC', shade(look.fav, -.15)); if (base.tie) set('tie', shade(look.fav, .2)); if (base.cuff) set('cuff', shade(look.fav, .7)); }
    if (look.gl === false) set('glasses', null); else if (look.gl === true) set('glasses', base.glasses || '#4a3a2e');
    if (look.hij === false) { set('scarf', null); set('hijab', null); set('under', null); set('pin', null); set('scarfDots', null); set('hair', look.hair && look.hair !== 'scarf' ? look.hair : 'bob'); if (!look.hairC && (!base.hairC || base.hairC === '#cfcfd6') && D[id].kind !== 'gm') set('hairC', '#3b2417'); }
    else if (look.hij) { set('hair', 'scarf'); set('scarf', look.hij); set('hijab', look.hij); set('under', look.fav || base.under || base.shirt); }
    if (look.hat === false) { set('sunhat', null); set('hat', null); } else if (look.hat) { set('sunhat', look.hat); set('hat', look.hat); }
    return p;
  };
  F.apply = function (cfg) {
    cfg = cfg ? F.normalize(cfg) : F.cfg(); const prev = CFG; if (cfg !== CFG) CFG = cfg; snapshot(); const C = M.chars, defs = C.defs, nm = M.save.data.names;
    F.IDS.forEach(id => {
      const b = BASE[id]; if (!b) return; const o = cfg[id], d = D[id], p = F.lookProps(id, o.look, b), row = Object.assign({}, b);
      Object.keys(p).forEach(k => { if (p[k] === null) delete row[k]; else row[k] = p[k]; });
      row.name = F.fullName(id); row.age = o.age || d.age; row.gender = d.g; delete row.img; delete row.full;
      const lt = (nameOf(id) || F.titleOf(id)).replace(/^ال/, '').charAt(0) || '؟'; row.badge = [lt, (b.badge && b.badge[1]) || '#ffc93c'];
      defs[id] = row; nm[id] = row.name;
    });
    ['moody', 'aboody', 'toota', 'nemo'].forEach(id => { nm[id] = nameOf(id); });
    nm.nana = F.fullName('nana');
    F.invalidate(); try { if (C.clearCache) C.clearCache(); if (M.stageImpostors) M.stageImpostors.clear(); } catch (e) { }
    F.syncWorlds(); (F.listeners || []).forEach(fn => { try { fn(cfg); } catch (e) { } });
    try { if (M.voice) M.voice.vars = F.voiceTitles(); } catch (e) { }
    return cfg;
  };
  F.listeners = []; F.onChange = fn => { F.listeners.push(fn); return () => { const i = F.listeners.indexOf(fn); if (i >= 0) F.listeners.splice(i, 1); }; };

  /* ------------------------------------------------------------------ availability + soft removal */
  F.worldOn = function (id) {
    if (id === 'nana' || id === 'gathering') return F.on('nana');
    if (id === 'saudi' || id === 'call') return F.dadTravels();
    return true;
  };
  const reqOk = r => !r || (r === 'gm' ? F.on('nana') : r === 'dad' ? F.dadTravels() : true);
  F.syncWorlds = function () {
    (M.worlds || []).forEach(w => {
      if (w.id === 'call') return;
      const off = !F.worldOn(w.id);
      if (off) { if (!w._famOff) { w._famOff = true; w._famWas = !!w.hidden; } w.hidden = true; } else if (w._famOff) { w.hidden = !!w._famWas; w._famOff = false; }
      /* levels / missions that need a grandmother or a travelling dad (property `req`) are filtered out of the list (progress is keyed by id, so nothing is lost) */
      if (w.missions && (w._all || w.missions.some(m => m.req))) { if (!w._all) w._all = w.missions.slice(); w.missions = w._all.filter(m => reqOk(m.req)); }
    });
  };
  /* is a cameo role left out of the current world?  (only roles listed in F.MUTE, only when the parents did not enable them) */
  F.muted = function (id, wid) {
    const w = F.MUTE[id]; if (!w || F.on(id)) return false; wid = wid || (M.flow && M.flow.cur && M.flow.cur.wid); return w.indexOf('*') >= 0 || w.indexOf(wid) >= 0;
  };

  /* ------------------------------------------------------------------ presets for tests / the "try with default names" button */
  F.preset = function (name) {
    const c = F.defaults(); c.done = true;
    const kid = (id, nm, age, look) => { c[id].on = true; c[id].name = nm; c[id].age = age; if (look) c[id].look = look; };
    if (name === 'one') { kid('toota', 'سلمى', 8, { skin: F.SKINS[1], hair: 'pigtails', hairC: F.HAIRC[2], fav: F.FAV[2], gl: true, hij: false }); c.nana.on = true; c.nana.title = 'ننا'; c.nana.name = 'فاطمة'; c.dad.travels = true; c.dad.dest = 'taif'; }
    else if (name === 'two') { kid('moody', 'ياسين', 10, { skin: F.SKINS[3], hair: 'short', fav: F.FAV[1] }); kid('aboody', 'مالك', 6, { skin: F.SKINS[2], hair: 'curly', hat: F.HATC[2] }); c.nana.on = true; c.nana.title = 'جدتي'; c.aunt1.on = true; c.aunt1.name = 'سوسن'; c.cz1.on = true; c.cz1.name = 'ياسر'; c.dad.travels = false; c.school = 'مدرسة النور'; }
    else if (name === 'four') { kid('moody', 'عمرو', 11, { skin: F.SKINS[4], hair: 'curly', gl: true }); kid('aboody', 'إياد', 5, { skin: F.SKINS[0], hair: 'short' }); kid('toota', 'جنى', 14, { skin: F.SKINS[2], hij: F.HIJ[3], gl: false, fav: F.FAV[3] }); kid('nemo', 'روان', 9, { skin: F.SKINS[1], hair: 'ponytail', hat: F.HATC[1] });
      c.nana.on = true; c.nana.title = 'ستو'; c.nana.name = 'عفاف'; c.gf.on = true; c.gf.title = 'سيدو'; c.gf.name = 'محمود'; c.aunt1.on = true; c.aunt1.name = 'نهى'; c.aunt2.on = true; c.aunt2.name = 'رشا'; c.uncle1.on = true; c.uncle1.name = 'طارق'; c.cz1.on = true; c.cz1.name = 'مازن'; c.cz2.on = true; c.cz2.name = 'تاليا'; c.cz3.on = true; c.cz3.name = 'سليم'; c.dad.travels = true; c.dad.dest = 'salalah'; c.school = 'مدرسة المستقبل'; }
    else if (name === 'nogm') { kid('moody', 'باسل', 9, null); kid('nemo', 'هالة', 7, { hij: false }); c.dad.travels = true; c.dad.dest = 'generic'; }   // no grandparent, no aunts, no uncle
    return c;
  };

  /* ------------------------------------------------------------------ boot (called by engine/boot.js after every world is registered) */
  F.boot = function () {
    snapshot(); CFG = null; F.apply(); F.ready = true;
    /* "reset all progress" in the parents' corner must not erase the family */
    try { const rs = M.save.reset; if (!rs._fam) { const nr = function () { const keep = M.save.data.family; rs.apply(M.save, arguments); if (keep) { M.save.data.family = keep; M.save.data.named = true; M.save.commit(); CFG = null; F.apply(); } }; nr._fam = 1; M.save.reset = nr; } } catch (e) { }
  };
})();
