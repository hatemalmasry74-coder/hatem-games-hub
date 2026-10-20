/* Moody & Aboody - engine/dress.js : OUTFIT SYSTEM (the dressing rooms' brain; panel = engine/dress_ui.js, rooms = worlds/rooms.js, data = content/dress_items.js).
   An outfit ("fit") is a tiny immutable object of item ids + colour ids per slot, saved under M.save.data.cosm.eq[heroId].fit:
       { v:2, top:{i,c,p}, bottom:{i,c,p}, shoes:{i,c}, head:{i,c} | {i:'none'}, hijab:{i,c}, acc:[{i,c}] | [] }       (a missing slot = the character's own signature look)
   Rendering: engine/chars.js asks `C.resolve(id, baseDef, drawOpts)`; this file answers with a DERIVED copy of the character's DEFS row (colours / top style / skirt / shoes / hat ...), cached per fit object.
   The character renderer then bakes it exactly like any other look (cached sprite sets keyed by `d._osig`), so every place that draws a character (stage actors, portraits, HUD chips, dialog faces,
   the runner hero from behind) shows the outfit.  Extra decorations (patterns, jacket zips, pinafore bib, glasses styles, scarf, badges, hijab prints, hats) are drawn from the hooks C.deco.* below.
   Gender / hijab come ONLY from the DEFS row (`gender`, `hair === 'scarf'`).  Legacy saves (eq.hat / eq.shirt, no `fit`) keep rendering through the old path until the child changes something. */
(function () {
  'use strict';
  const M = window.Moody, C = M.chars, K = C.kit, D = M.dress = M.dress || {};
  if (!D.items) return;   // data file missing: stay inert
  const { part, fold, line, dot, bead, pRR, pEll, pCirc, pPoly, lite, dark, mixc, rgba, star5, heart5 } = K, OL = M.OL, TAU = 6.2832;
  const byId = D.byId = {}; D.items.forEach(it => { byId[it.id] = it; });
  const SLOTS = D.slotList = ['top', 'bottom', 'shoes', 'head', 'hijab', 'acc'];
  D.ver = 0; const LIVE = D.live = {};   // LIVE[id] = the draft outfit shown while the panel is open (try-on items included)

  /* ------------------------------------------------------------- helpers */
  const hx = c => !c ? null : c[0] === '#' ? c : (D.colors[c] ? D.colors[c].c : null);
  const rgbOf = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const lum = h => { const a = rgbOf(h.length === 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h); return (.299 * a[0] + .587 * a[1] + .114 * a[2]) / 255; };
  const sec = c => lum(c) > .6 ? mixc(c, '#1a1030', .5) : mixc(c, '#ffffff', .78);   // contrasting pattern / trim colour
  D.hex = hx; D.contrast = sec;
  D.gender = id => C.gender(id);
  D.isHijab = id => !!(C.defs[id] && C.defs[id].hair === 'scarf');
  D.okFor = (it, id) => !!it && (it.g === '*' || it.g === D.gender(id)) && (it.slot !== 'hijab' || D.isHijab(id)) && !(it.slot === 'head' && D.isHijab(id) && !it.hj);
  D.itemsFor = (id, slot) => D.items.filter(it => it.slot === slot && D.okFor(it, id));
  D.setsFor = id => D.sets.filter(s => s.g === D.gender(id));
  D.itemName = it => it.n;
  D.colName = cid => (D.colors[cid] && D.colors[cid].n) || '';
  const cosm = () => { const sd = M.save.data; if (!sd.cosm) sd.cosm = { owned: [], eq: {} }; if (!sd.cosm.owned) sd.cosm.owned = []; if (!sd.cosm.eq) sd.cosm.eq = {}; return sd.cosm; };
  const peek = id => { const sd = M.save.data, c = sd && sd.cosm, e = c && c.eq && c.eq[id]; return e || null; };
  D.eq = id => { const c = cosm(); return c.eq[id] || (c.eq[id] = {}); };
  D.fitOf = id => LIVE[id] || (peek(id) && peek(id).fit) || null;
  const sigOf = fit => { if (fit._s !== undefined) return fit._s; const s = JSON.stringify([fit.top, fit.bottom, fit.shoes, fit.head, fit.hijab, fit.acc]); Object.defineProperty(fit, '_s', { value: s, enumerable: false }); return s; };
  D.sig = id => { const f = D.fitOf(id); return f ? sigOf(f) : ''; };
  D.isCustom = id => { const f = D.fitOf(id); return !!f && (f.top || f.bottom || f.shoes || f.head || f.hijab || f.acc); };
  D.dressed = D.isCustom;
  D.emptyFit = () => ({ v: 2 });
  D.clone = f => { const o = { v: 2 }; SLOTS.forEach(k => { if (f && f[k] !== undefined) o[k] = k === 'acc' ? f.acc.map(a => Object.assign({}, a)) : Object.assign({}, f[k]); }); return o; };
  D.withSlot = (fit, slot, val) => { const o = D.clone(fit); if (val === undefined || val === null) delete o[slot]; else o[slot] = val; return o; };

  /* ------------------------------------------------------------- derived def */
  const DRESSY_TOP = { cardigan: 'crew', dress: 'crew', blouse: 'crew', floral: 'crew' };
  const legUnder = c => lum(c) < .45 ? dark(c, .12) : '#efe2d5';
  const SHOE = {
    sneaker: c => ({ shoeK: 'sneaker', shoeAcc: '#ffffff' }), schoolshoe: c => ({ shoeK: 'dress', shoeAcc: '#fff' }), maryjane: c => ({ shoeK: 'mary', shoeAcc: lum(c) < .35 ? '#ffffff' : lite(c, .4) }),
    boots: c => ({ shoeK: 'boot', shoeAcc: lite(c, .3) }), sandals: c => ({ shoeK: 'sandal', shoeAcc: dark(c, .1), sockC: '#fbf7ee', sockT: '#ffffff' }), cleats: c => ({ shoeK: 'cleat', shoeAcc: '#26262c' }), flats: c => ({ shoeK: 'flat', shoeAcc: lite(c, .35) })
  };
  const FULL = {   // dresses / robe: top style + skirt geometry
    sundress: { top: 'floral', hem: .13, flare: 15, long: true }, partydress: { top: 'dress', hem: .22, flare: 17, long: true }, pinafore: { top: 'crew', hem: .22, flare: 15, long: true },
    denimdress: { top: 'crew', hem: .16, flare: 12, long: true }, tunic: { top: 'crew', hem: .3, flare: 4, long: true }, cardidress: { top: 'cardigan', hem: .2, flare: 13, long: true }, galabeya: { top: 'crew', hem: .09, flare: 6, long: true }
  };
  const SKIRT = { longskirt: { hem: .13, flare: 14 }, midiskirt: { hem: .3, flare: 12 }, pleated: { hem: .2, flare: 15 } };
  const PANTS = { pants: { f: 14 }, jeans: { f: 13.5 }, joggers: { f: 15 }, cargo: { f: 15 }, wide: { f: 18 }, leggings: { f: 10.5 } };
  const cache = new WeakMap();

  D.buildDef = function (id, d0, fit) {
    const hit = cache.get(fit); if (hit && hit.b === d0) return hit.d;
    const gender = D.gender(id), isH = D.isHijab(id), f = gender === 'f', d = Object.assign({}, d0), OK = it => D.okFor(it, id);
    d._fit = true; d._osig = sigOf(fit);
    const baseDressy = K.isDressy(d0), bsk = baseDressy ? K.skirtGeo(d0) : null;
    let skirtWorn = baseDressy, skirtCol = d0.skirt || d0.shirt, skHem = bsk ? -bsk.hemY / d0.L : null, skFlare = bsk ? bsk.hw1 - d0.sw : null, leg = d0.legC;
    /* ---- top (or dress / robe) ---- */
    const t = fit.top, ti = t && t.i ? byId[t.i] : null;
    if (ti && OK(ti)) {
      const col = hx(t.c) || hx(ti.c), c2 = sec(col), pat = t.p && t.p !== 'solid' && (ti.pats || []).indexOf(t.p) >= 0 ? t.p : null;
      ['flowers', 'stripes', 'trim', 'belt', 'cuff', 'ruffle', 'stitch', 'apron', 'apronTrim', 'hemShirt'].forEach(k => { d[k] = undefined; });
      d.shirt = col; d._tc2 = c2; d._tp = pat; d._tk = ti.kind; d.sleeveLong = true;
      const k = ti.kind, fl = FULL[k];
      if (fl) {   // one-piece: replaces the bottom
        d.top = fl.top; skirtWorn = true; skirtCol = col; skHem = fl.hem; skFlare = fl.flare; leg = legUnder(col);
        if (k === 'sundress') { d.flowers = [lum(col) > .6 ? '#ffffff' : '#fff6d8', '#ffd23c', mixc(col, '#ff6f91', .5)]; d.cuff = '#ffffff'; }
        else if (k === 'partydress') { d.trim = '#ffffff'; d.belt = lum(col) > .72 ? '#ffd23c' : c2 === '#ffffff' ? '#ffd23c' : c2; d.cuff = '#ffffff'; }
        else if (k === 'pinafore') { d.shirt = '#f7f4ee'; d.skirt = col; d._tc2 = col; d.cuff = '#ffffff'; }
        else if (k === 'cardidress') { d.cuff = '#fbf3ea'; d.belt = c2; }
        else if (k === 'galabeya') { d.cuff = lite(col, .35); leg = lum(col) < .4 ? dark(col, .1) : '#f4efe4'; }
        else if (k === 'tunic') { d.cuff = lite(col, .4); }
      } else {
        const tk = { tee: ['crew', f], longtee: ['crew', true], polo: ['polo', false], shirt: ['placket', true], hoodie: ['hoodie', true], sweater: ['crew', true], jersey: ['crew', f], jacket: ['crew', true], puffer: ['crew', true], rash: ['crew', true], blouse: ['crew', true], cardigan: ['crew', true] }[k] || ['crew', f];
        d.top = tk[0]; d.sleeveLong = tk[1];
        if (k === 'sweater') d.cuff = dark(col, .14); else if (k === 'jacket') d.cuff = dark(col, .22); else if (k === 'jersey' && f) d.cuff = c2; else if (k === 'rash') d.cuff = c2; else if (k === 'blouse') d.ruffle = lite(col, .4); else if (k === 'cardigan') d.cuff = lite(col, .5); else if (k === 'puffer') d.cuff = dark(col, .3);
        if (k === 'hoodie') d.cuff = undefined;
      }
    } else if (t && t.c && hx(t.c)) {   // legacy colour-only change (the old "shirt colour" shop items): keep the signature top, change its colour
      d.shirt = hx(t.c); if (baseDressy && !d0.keepSkirt) skirtCol = d.shirt; d._osk = 1;
    }
    const fullDress = !!(ti && OK(ti) && FULL[ti.kind]);
    /* ---- bottom ---- */
    const b = fit.bottom, bi = b && b.i ? byId[b.i] : null;
    if (!fullDress) {
      if (bi && OK(bi)) {
        const col = hx(b.c) || hx(bi.c), k = bi.kind, sk = SKIRT[k];
        if (sk) { skirtWorn = true; skirtCol = col; skHem = sk.hem; skFlare = sk.flare; leg = legUnder(col); d._bp = b.p && (bi.pats || []).indexOf(b.p) >= 0 && b.p !== 'solid' ? b.p : null; d._bc2 = sec(col); d._bk = k; }
        else {
          skirtWorn = false; d.pants = col; d.legC = col; d.hemC = dark(col, .14); d.shorts = undefined; d.legStripe = undefined; d.legSeam = undefined; d.sockC = undefined;
          const pw = PANTS[k]; if (pw && f) d.legW = pw.f; else if (!f && d0.legW) d.legW = d0.legW;
          if (k === 'joggers') { d.legStripe = sec(col); d.hemC = dark(col, .24); }
          else if (k === 'jeans') { d.legSeam = lum(col) < .3 ? '#7f9cc4' : '#e8c890'; }
          else if (k === 'cargo') { d.legSeam = lite(col, .3); d.hemC = dark(col, .28); }
          else if (k === 'shorts') { d.shorts = .56; d.sockC = '#f4f1ea'; d.hemC = dark(col, .16); d.legStripe = undefined; }
        }
      } else if (b && b.c && hx(b.c)) {   // colour of the signature bottom
        if (skirtWorn) skirtCol = hx(b.c); else { d.pants = hx(b.c); d.hemC = d0.hemC ? dark(hx(b.c), .14) : d.hemC; }
      }
    }
    if (skirtWorn) {
      d.skOn = true; d.skirt = skirtCol; d.keepSkirt = true; d.skHem = skHem; d.skFlare = skFlare; d.legC = leg || d0.legC || legUnder(skirtCol); if (!d.legW || d.legW > 12) d.legW = d0.legW || (f ? 10 : 11);
    } else {
      d.skOn = false; d.skirt = undefined; d.keepSkirt = undefined; d.skHem = undefined; d.skFlare = undefined;
      if (DRESSY_TOP[d.top]) { if (d.top === 'cardigan' && !d._tk) d._tk = 'cardi'; d.top = DRESSY_TOP[d.top]; if (!d._tk && d0.top === 'floral') d.stripes = undefined; }
      if (d0.top === 'hoodie' && baseDressy) { d.charm = d0.charm; }
      if (baseDressy && !(bi && OK(bi))) { d.pants = d.pants || d0.pants; }
    }
    /* ---- shoes ---- */
    const s = fit.shoes, si = s && s.i ? byId[s.i] : null;
    if (si && OK(si)) { const col = hx(s.c) || hx(si.c), sp = SHOE[si.kind](col); d.shoe = col; Object.assign(d, sp); if (si.kind !== 'sandals' && !(d.shorts)) d.sockC = d.shorts ? d.sockC : undefined; d._sk = si.kind; }
    else if (s && s.c && hx(s.c)) { d.shoe = hx(s.c); }
    /* ---- headwear ---- */
    const h = fit.head;
    if (h && h.i === 'none') { d.sunhat = undefined; d.hat = undefined; }
    else if (h && h.i) { const hi = byId[h.i]; if (OK(hi)) { d.sunhat = undefined; d.hat = undefined; d._hat = hi.id; d._hatC = hx(h.c) || hx(hi.c); d._hatP = null; } }
    /* ---- hijab (hijab-wearing characters only) ---- */
    const hj = fit.hijab, hji = hj && hj.i ? byId[hj.i] : null;
    if (isH && hj) {
      if (hj.p === 'short') d.hjLen = .42;   // short wrap: the top below stays visible
      const col = hx(hj.c) || (hji && OK(hji) ? hx(hji.c) : null);
      if (col) { d.scarf = col; d.hijab = col; d.under = mixc(col, '#000000', lum(col) > .7 ? .3 : .22); d._hjc2 = sec(col); d.pin = lum(col) < .35 ? '#e8c45a' : '#d9a441'; if (!hji) d.scarfDots = undefined; }
      if (hji && OK(hji)) d.scarfK = { hj_dots: 'dots', hj_stripes: 'stripes', hj_floral: 'floral', hj_stars: 'stars' }[hji.kind] || undefined, d.scarfDots = undefined;
    }
    /* ---- accessories ---- */
    const ac = fit.acc;
    if (ac) {
      d.glasses = undefined; d.glassK = undefined; d.bag = undefined; d.neckPhones = undefined; d.bunny = undefined; d.backpack = undefined; d.watch = undefined; d.watchC = undefined; d.charm = undefined; d.nscarf = undefined; d.badge2 = undefined;
      ac.forEach(a => {
        const it = byId[a.i]; if (!OK(it)) return; const col = hx(a.c) || hx(it.c), k = it.kind;
        if (k === 'g_round') { d.glasses = col; d.glassK = undefined; } else if (k === 'g_square') { d.glasses = col; d.glassK = 'square'; } else if (k === 'g_cat') { d.glasses = col; d.glassK = 'cat'; } else if (k === 'g_sun') { d.glasses = col; d.glassK = 'sun'; }
        else if (k === 'pack') d.backpack = col; else if (k === 'bag') d.bag = col; else if (k === 'scarf') { d.nscarf = col; }
        else if (k === 'watch') { d.watch = true; d.watchK = 'smart'; d.watchC = col; } else if (k === 'phones') d.neckPhones = col;
        else if (k.indexOf('bdg_') === 0) d.badge2 = { k: k.slice(4), c: col };
      });
    }
    d._ps = [d.pants, d.legC, d.shoe, d.shorts, d.sockC].join('|');
    d._pv = false;
    cache.set(fit, { b: d0, d }); return d;
  };

  /* hooks used by chars.js: C.resolve (defined below) */
  D.defFor = id => { const f = D.fitOf(id); return f ? D.buildDef(id, C.defs[id], f) : null; };
  /* preview defs are tagged so their sprite sets are evicted first */

  /* ------------------------------------------------------------- unlocks / shop */
  const starsTotal = () => { let n = 0; const p = M.save.data.progress || {}; for (const k in p) n += (p[k] && p[k].stars) || 0; return n; };
  D.starsTotal = starsTotal;
  D.owned = it => !it.price && !it.unlock ? true : (cosm().owned.indexOf(it.id) >= 0 || (!it.price && D.gateOk(it)));
  D.gateOk = it => { const u = it.unlock; if (!u) return true; if (u.stars) return starsTotal() >= u.stars; if (u.sticker) return !!(M.save.data.stickers && M.save.data.stickers[u.sticker]); return true; };
  /* state: 'own' (wear it) | 'buy' (try on, can buy: price) | 'gate' (locked by stars / sticker: try on only) */
  D.state = it => { if (!it || it.id === 'none' || D.owned(it)) return 'own'; if (!D.gateOk(it)) return 'gate'; return 'buy'; };
  D.gateText = it => { const u = it.unlock; if (!u) return ''; if (u.stars) return 'محتاج ' + M.util.ar(u.stars) + ' نجمة'; if (u.sticker) { const s = M.stickers[u.sticker]; return 'خلّص ' + (s ? s.title : 'مهمة'); } return ''; };
  D.buy = function (it) {
    const sd = M.save.data; if (D.owned(it)) return true; if (!D.gateOk(it)) return false; if (sd.coins < it.price) return false;
    sd.coins -= it.price; cosm().owned.push(it.id); M.save.commit(); return true;
  };
  D.isNew = it => !!it.isNew && !(cosm().seenItems || {})[it.id];
  D.markSeen = ids => { const c = cosm(); c.seenItems = c.seenItems || {}; let ch = false; ids.forEach(i => { if (!c.seenItems[i]) { c.seenItems[i] = 1; ch = true; } }); if (ch) M.save.commit(); };
  /* every item a fit uses that the child may not wear yet */
  D.lockedIn = fit => { const out = []; ['top', 'bottom', 'shoes', 'head', 'hijab'].forEach(k => { const v = fit[k]; if (v && v.i && byId[v.i] && !D.owned(byId[v.i])) out.push(byId[v.i]); }); (fit.acc || []).forEach(a => { if (byId[a.i] && !D.owned(byId[a.i])) out.push(byId[a.i]); }); return out; };
  /* the saved outfit never contains locked items: they are swapped back to what was saved before */
  D.sanitize = function (draft, saved) { const o = D.clone(draft); ['top', 'bottom', 'shoes', 'head', 'hijab'].forEach(k => { const v = o[k]; if (v && v.i && byId[v.i] && !D.owned(byId[v.i])) { if (saved && saved[k]) o[k] = Object.assign({}, saved[k]); else delete o[k]; } });
    if (o.acc) o.acc = o.acc.filter(a => !byId[a.i] || D.owned(byId[a.i]) || (saved && (saved.acc || []).some(x => x.i === a.i))); return o; };
  D.setSaved = function (id, fit) { const e = D.eq(id); e.fit = D.clone(fit); D.ver++; M.save.commit(); };
  /* first time the new panel is used on a hero with the OLD shop equipment: turn it into a fit (hats -> head item, shirt colour -> top colour) so nothing is lost */
  const LEG_SHIRT = { red: 'red', green: 'green', purple: 'purple', orange: 'orange', sky: 'sky', pink: 'pink' };
  D.migrate = function (id) {
    const e = D.eq(id); if (e.fit) return e.fit; const f = { v: 2 };
    if (e.hat && byId[e.hat] && D.okFor(byId[e.hat], id)) f.head = { i: e.hat };
    if (e.shirt) { if (LEG_SHIRT[e.shirt]) f.top = { c: LEG_SHIRT[e.shirt] }; else if (byId[e.shirt]) f.top = { i: e.shirt }; }
    e.fit = f; D.ver++; return f;
  };
  /* reset to the signature look (and forget old shop equipment too) */
  D.reset = function (id) { const e = D.eq(id); e.fit = { v: 2 }; e.hat = null; e.shirt = null; D.ver++; M.save.commit(); };
  D.saveBest = function (id, fit) { D.eq(id).best = D.clone(fit); M.save.commit(); };
  D.best = id => { const e = peek(id); return e && e.best ? e.best : null; };

  /* ------------------------------------------------------------- fit building blocks used by the panel / sets / surprise */
  D.defaultVal = (it, cur) => { const v = { i: it.id, c: (cur && cur.c && (!it.cols || it.cols.indexOf(cur.c) >= 0) ? cur.c : it.c) }; if (it.pats) { const p = cur && cur.p && it.pats.indexOf(cur.p) >= 0 ? cur.p : null; if (p && p !== 'solid') v.p = p; } return v; };
  D.equip = function (id, fit, it, o) {   // -> new fit with item `it` worn (replaces what shares its slot / group; a dress clears the bottom; a bottom clears a dress)
    o = o || {}; const slot = it.slot; let f = D.clone(fit);
    if (slot === 'acc') {
      const list = (f.acc || []).filter(a => !byId[a.i] || byId[a.i].cat !== it.cat), had = (f.acc || []).some(a => a.i === it.id);
      f.acc = had && !o.keep ? list : list.concat([D.defaultVal(it, (f.acc || []).find(a => a.i === it.id) || (o.col ? { c: o.col } : null))]);
      return f;
    }
    if (slot === 'top' && it.full) { delete f.bottom; }
    if (slot === 'bottom') { const t = f.top && byId[f.top.i]; if (t && t.full) delete f.top; }
    const cur = f[slot] && f[slot].i === it.id ? f[slot] : (f[slot] && o.keepColor ? f[slot] : null);
    f[slot] = D.defaultVal(it, cur); if (o.col && (!it.cols || it.cols.indexOf(o.col) >= 0)) f[slot].c = o.col; if (o.pat) f[slot].p = o.pat;
    return f;
  };
  D.setSet = function (id, set) {   // full ready-made set -> fit (only items allowed for this hero)
    let f = { v: 2 }; const put = (slot, arr) => { if (!arr) return; const it = byId[arr[0]]; if (!it || !D.okFor(it, id)) return; f[slot] = D.defaultVal(it); f[slot].c = arr[1] || it.c; if (arr[2] && arr[2] !== 'solid') f[slot].p = arr[2]; };
    put('top', set.top); const t = f.top && byId[f.top.i]; if (!(t && t.full)) put('bottom', set.bottom); put('shoes', set.shoes);
    if (D.isHijab(id)) { if (set.hijabSet) put('hijab', set.hijabSet); if (set.head && byId[set.head[0]] && byId[set.head[0]].hj) put('head', set.head); } else put('head', set.head);
    if (set.acc) { f.acc = []; set.acc.forEach(a => { const it = byId[a[0]]; if (it && D.okFor(it, id)) f.acc.push({ i: it.id, c: a[1] || it.c }); }); }
    return f;
  };
  D.setCost = (id, set) => { const f = D.setSet(id, set); return D.lockedIn(f).reduce((s, it) => s + it.price, 0); };
  D.setOk = (set) => !set.unlock || D.gateOk(set);
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  D.randomFit = function (id, o) {
    o = o || {}; let f = { v: 2 }; const own = it => D.owned(it) || o.any;
    const pick = (slot, p) => { const l = D.itemsFor(id, slot).filter(own); if (!l.length || Math.random() > p) return null; return rnd(l); };
    const put = (it) => { if (!it) return; f = D.equip(id, f, it); const v = it.slot === 'acc' ? f.acc.find(a => a.i === it.id) : f[it.slot]; const cols = it.cols || D.colorIds; v.c = rnd(cols); if (it.pats && Math.random() < .5) { const p = rnd(it.pats); if (p !== 'solid') v.p = p; else delete v.p; } };
    const tops = D.itemsFor(id, 'top').filter(own), t = rnd(tops); put(t);
    if (!t.full) put(pick('bottom', 1) || null);
    put(pick('shoes', 1));
    if (D.isHijab(id)) { put(pick('hijab', .9)); put(pick('head', .35)); } else put(pick('head', .6));
    const acc = D.itemsFor(id, 'acc').filter(own), used = {}; for (let i = 0; i < 2; i++) { const a = rnd(acc); if (a && !used[a.cat] && Math.random() < .7) { used[a.cat] = 1; put(a); } }
    return f;
  };
  /* what is worn right now, as plain item records (for the fashion show) */
  D.wornItems = function (id, fit) { const f = fit || D.fitOf(id) || {}, out = []; ['top', 'bottom', 'shoes', 'head', 'hijab'].forEach(k => { if (f[k] && byId[f[k].i]) out.push(byId[f[k].i]); }); (f.acc || []).forEach(a => { if (byId[a.i]) out.push(byId[a.i]); }); return out; };

  /* =====================================================================================================
     DECORATIONS (chars.js bake hooks).  All coordinates are the character's own (feet at 0, up = -y); K.LX = light side.
     ===================================================================================================== */
  function pattern(g, kind, col, x, y, w, h) {
    g.save(); g.fillStyle = col; g.strokeStyle = col;
    if (kind === 'stripes') { for (let yy = y + 7; yy < y + h; yy += 12) g.fillRect(x, yy, w, 5.4); }
    else if (kind === 'dots') { for (let r = 0, yy = y + 8; yy < y + h; yy += 11, r++) for (let xx = x + (r % 2 ? 5.5 : 0) + 3; xx < x + w; xx += 11) { g.beginPath(); g.arc(xx, yy, 2.5, 0, TAU); g.fill(); } }
    else if (kind === 'stars') { for (let r = 0, yy = y + 9; yy < y + h; yy += 13, r++) for (let xx = x + (r % 2 ? 7 : 0) + 4; xx < x + w; xx += 14) star5(g, xx, yy, 3.8, col, 0); }
    else if (kind === 'hearts') { for (let r = 0, yy = y + 9; yy < y + h; yy += 13, r++) for (let xx = x + (r % 2 ? 7 : 0) + 4; xx < x + w; xx += 14) heart5(g, xx, yy, 2.9, col, 0); }
    else if (kind === 'check') { g.globalAlpha = .42; for (let yy = y + 5; yy < y + h; yy += 12) g.fillRect(x, yy, w, 5); for (let xx = x + 3; xx < x + w; xx += 12) g.fillRect(xx, y, 5, h); g.globalAlpha = 1; }
    g.restore();
  }
  const C_ = C.deco = {};
  C_.torso = function (g, d, k) {
    const c = d.shirt, c2 = d._tc2 || sec(c), kd = d._tk;
    if (d._tp) pattern(g, d._tp, c2, k.tx, k.ty, k.tw, k.thh);
    if (kd === 'jersey') {
      g.fillStyle = c2; g.fillRect(k.tx, k.ty, 6.5, k.thh); g.fillRect(k.tx + k.tw - 6.5, k.ty, 6.5, k.thh);
      g.font = 'bold ' + Math.round(k.thh * .34) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = c2; g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeText('10', 0, k.ty + k.thh * .6); g.fillText('10', 0, k.ty + k.thh * .6);
    } else if (kd === 'rash') {
      g.fillStyle = c2; g.fillRect(k.tx, k.ty, k.tw, 11); g.fillRect(k.tx, k.ty + 12, 5.5, k.thh); g.fillRect(k.tx + k.tw - 5.5, k.ty + 12, 5.5, k.thh);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(k.tx, k.ty + 11, k.tw, 1.2);
    } else if (kd === 'puffer') {
      for (let yy = k.ty + 13; yy < k.ty + k.thh - 3; yy += 12.5) { g.beginPath(); g.moveTo(k.tx - 2, yy); g.quadraticCurveTo(0, yy + 3.4, k.tx + k.tw + 2, yy); g.lineWidth = 2.2; g.strokeStyle = 'rgba(20,5,25,.34)'; g.stroke(); g.beginPath(); g.moveTo(k.tx - 2, yy + 2.2); g.quadraticCurveTo(0, yy + 5.6, k.tx + k.tw + 2, yy + 2.2); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.28)'; g.stroke(); }
    } else if (kd === 'sweater') {
      g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.3; for (let r = 0, yy = k.ty + 12; yy < k.ty + k.thh - 9; yy += 6.5, r++) for (let xx = k.tx + (r % 2 ? 4 : 0); xx < k.tx + k.tw; xx += 8) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 2.6, yy + 3); g.lineTo(xx + 5.2, yy); g.stroke(); }
      g.fillStyle = dark(c, .16); g.fillRect(k.tx, k.ty + k.thh - 8, k.tw, 8); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (let xx = k.tx + 2; xx < k.tx + k.tw; xx += 4) { g.beginPath(); g.moveTo(xx, k.ty + k.thh - 8); g.lineTo(xx, k.ty + k.thh); g.stroke(); }
    } else if (kd === 'jacket') {
      g.fillStyle = dark(c, .2); g.fillRect(k.tx, k.ty + k.thh - 7, k.tw, 7); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; for (let xx = k.tx + 2; xx < k.tx + k.tw; xx += 4) { g.beginPath(); g.moveTo(xx, k.ty + k.thh - 7); g.lineTo(xx, k.ty + k.thh); g.stroke(); }
    } else if (kd === 'pinafore') {   // white blouse; the pinafore bib is drawn over it (body hook)
    } else if (kd === 'denimdress') { g.strokeStyle = 'rgba(255,230,170,.55)'; g.setLineDash([2.4, 2]); g.lineWidth = 1; g.beginPath(); g.moveTo(k.tx + 3, k.ty + 6); g.lineTo(k.tx + 3, k.ty + k.thh - 2); g.moveTo(k.tx + k.tw - 3, k.ty + 6); g.lineTo(k.tx + k.tw - 3, k.ty + k.thh - 2); g.stroke(); g.setLineDash([]); }
  };
  C_.skirt = function (g, d, k) {
    const c = d.skirt, c2 = d._bc2 || d._tc2 || sec(c);
    const x = -k.hw1, w = k.hw1 * 2, y = k.wy, h = k.hemY - k.wy;
    if (d._bp) pattern(g, d._bp, c2, x, y, w, h);
    else if (d._tp && FULL[d._tk]) pattern(g, d._tp, c2, x, y, w, h);
    const kd = d._tk, bk = d._bk;
    if (kd === 'tunic' || kd === 'galabeya') { g.fillStyle = c2; g.globalAlpha = .9; g.fillRect(x, k.hemY - 7, w, 4.4); g.globalAlpha = 1; if (kd === 'galabeya') { g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-1, y, 2, h); } }
    if (kd === 'denimdress') { g.strokeStyle = 'rgba(255,230,170,.6)'; g.setLineDash([2.4, 2]); g.lineWidth = 1; g.beginPath(); g.moveTo(x + 3, k.hemY - 6); g.quadraticCurveTo(0, k.hemY + 1, -x - 3, k.hemY - 6); g.stroke(); g.setLineDash([]); }
    if (kd === 'partydress') { g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 9; i++) { const fx = x + 6 + (i * 29) % (w - 12), fy = y + 10 + (i * 41) % Math.max(10, h - 18); star5(g, fx, fy, 3.1, 'rgba(255,248,200,.85)', 0); } }
    if (kd === 'sundress' || kd === 'cardidress') { g.fillStyle = c2; g.globalAlpha = .55; g.fillRect(x, k.hemY - 6, w, 3); g.globalAlpha = 1; }
    if (bk === 'pleated') { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.3; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * k.hw0 / 6.5, y + 2); g.lineTo(i * k.hw1 / 6.5, k.hemY + 3); g.stroke(); } }
  };
  C_.body = function (g, d, k) {
    const c = d.shirt, c2 = d._tc2 || sec(c), kd = d._tk, ty = k.ty, thh = k.thh, sw = k.sw, OV = { hi: .2, sh: .3, spec: .1, rim: 0, crescent: .22 };
    if (kd === 'jacket' || kd === 'puffer') {
      if (kd === 'puffer') part(g, pEll(0, ty + 2, 16, 7.5), lite(c, .06), [-16, ty - 6, 16, ty + 10], { hi: .2, sh: .3, spec: .2, rim: .2, crescent: .3 }, 3);
      else [[[-3, ty + 1], [-15, ty + 2], [-5, ty + 16]], [[3, ty + 1], [15, ty + 2], [5, ty + 16]]].forEach(p => part(g, pPoly(p), lite(c, .12), [-15, ty, 15, ty + 16], OV, 2.6));
      line(g, 0, ty + 8, 0, ty + thh - 2, 2.6, 'rgba(0,0,0,.5)'); line(g, 0, ty + 8, 0, ty + thh - 2, 1.2, '#e8e2d2');
      part(g, pRR(-2.4, ty + 8, 4.8, 6, 1.6), '#d9d4cc', [-2, ty + 8, 2, ty + 14], { hi: .2, sh: .3, spec: 0, rim: 0 }, 1.6);
      [-1, 1].forEach(s => { line(g, s * 6, ty + thh - 19, s * 13, ty + thh - 14, 1.8, 'rgba(0,0,0,.32)'); });
    } else if (kd === 'cardi') {
      part(g, pPoly([[-10, ty + 1], [10, ty + 1], [0, ty + thh * .78]]), lite(c, .55), [-10, ty, 10, ty + thh * .78], { hi: .1, sh: .28, spec: 0, rim: 0, crescent: .3 }, 2.4);
      [-1, 1].forEach(s => { line(g, s * 1.4, ty + 4, s * 1.6, ty + thh - 1, 2.2, 'rgba(0,0,0,.28)'); });
      for (let i = 0; i < 3; i++) { bead(g, -2.2, ty + 14 + i * 12, 1.7, lite(c, .75), 1); }
      [[[-10, ty + 1], [-18, ty + 3], [0, ty + thh * .78]], [[10, ty + 1], [18, ty + 3], [0, ty + thh * .78]]].forEach(p => part(g, pPoly(p), lite(c, .08), [-18, ty, 18, ty + thh * .78], { hi: .16, sh: .26, crescent: .22, rim: 0, spec: .1 }, 2.6));
    } else if (kd === 'blouse') {
      [-1, 1].forEach(s => part(g, pEll(s * 7, ty + 4, 8, 4.4, s * .35), lite(c, .3), [s * 7 - 8, ty, s * 7 + 8, ty + 8], { hi: .2, sh: .26, spec: 0, rim: 0 }, 2.4));
      bead(g, 0, ty + 7, 3.2, lite(c, .5), 1.4); [-1, 1].forEach(s => part(g, pPoly([[0, ty + 7], [s * 11, ty + 2], [s * 11, ty + 13]]), lite(c, .38), [-11, ty + 2, 11, ty + 13], { hi: .2, sh: .26, spec: 0, rim: 0 }, 2));
      line(g, 0, ty + 12, 0, ty + thh - 8, 1.4, 'rgba(0,0,0,.2)');
    } else if (kd === 'pinafore') {
      const bw = sw * .56, by = ty + 13, bp = pRR(-bw, by, bw * 2, thh - 11 + 8, 3);
      part(g, bp, d.skirt, [-bw, by, bw, ty + thh + 8], { hi: .2, sh: .32, spec: .1, rim: .2, crescent: .22 }, 2.8, gg => { fold(gg, -bw + 3, by + 6, -bw + 4, by + 14, -bw + 6, by + thh - 10, 2.6, .12); });
      [-1, 1].forEach(s => { const p = new Path2D(); p.moveTo(s * (bw - 1), by + 1); p.lineTo(s * (bw + 4.5), by + 1); p.lineTo(s * (bw + 6.5), ty + 1); p.lineTo(s * (bw + 1.4), ty + 1); p.closePath(); part(g, p, dark(d.skirt, .06), [s * bw, ty, s * (bw + 6), by], OV, 2.2); bead(g, s * (bw + .6), by + 4, 1.6, '#f4e6b0', 1); });
      part(g, pRR(-6, by + 15, 12, 10, 2), dark(d.skirt, .12), [-6, by + 15, 6, by + 25], { hi: .12, sh: .22, spec: 0, rim: 0, crescent: .3 }, 2);
    } else if (kd === 'galabeya') {
      line(g, 0, ty + 4, 0, ty + thh + 4, 1.6, 'rgba(0,0,0,.22)'); for (let i = 0; i < 4; i++) bead(g, 0, ty + 10 + i * 11, 1.8, '#f6efe0', 1);
      part(g, pEll(0, ty + 2.4, 11, 5), lite(c, .3), [-11, ty - 3, 11, ty + 8], { hi: .1, sh: .3, spec: 0, rim: 0 }, 2.4);
    } else if (kd === 'sundress' || kd === 'cardidress') {
      /* base look already has the collar */
    } else if (kd === 'partydress') { for (let i = 0; i < 5; i++) star5(g, -sw * .55 + (i * 13) % (sw * 1.1), ty + 12 + (i * 11) % 28, 3, 'rgba(255,248,200,.85)', 0); }
    /* chest badge (accessory) */
    const bd = d.badge2; if (bd) {
      const x = -sw * .42, y = ty + 21;   // left chest (away from the shirt pocket)
      if (bd.k === 'star') star5(g, x, y, 6, bd.c, 1.8); else if (bd.k === 'heart') heart5(g, x, y + 1, 5, bd.c, 1.8);
      else if (bd.k === 'flag') { g.save(); g.translate(x, y); part(g, pRR(-7.5, -5, 15, 10, 1.4), '#f7f4ee', [-7.5, -5, 7.5, 5], { hi: .1, sh: .2, spec: 0, rim: 0, crescent: .2 }, 1.6); g.fillStyle = '#ce1126'; g.fillRect(-7, -4.6, 14, 3.1); g.fillStyle = '#222'; g.fillRect(-7, 1.5, 14, 3.1); dot(g, 0, 0, 1.5, '#c8a53a'); g.restore(); }
      else if (bd.k === 'ball') { bead(g, x, y, 5.4, '#ffffff', 1.8); g.fillStyle = '#26262c'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; i ? g.lineTo(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6) : g.moveTo(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6); } g.closePath(); g.fill(); }
    }
  };
  C_.after = function (g, d, k) {   // after the neck: winter scarf around the neck
    const sc = d.nscarf; if (!sc) return; const ty = k.ty, c2 = sec(sc);
    part(g, pEll(0, ty + 1.5, 17.5, 8.2), sc, [-17.5, ty - 7, 17.5, ty + 10], { hi: .24, sh: .34, spec: .2, rim: .25, crescent: .28 }, 3, gg => { gg.fillStyle = c2; gg.globalAlpha = .8; [-9, 0, 9].forEach(xx => { gg.fillRect(xx - 1.4, ty - 8, 2.8, 20); }); gg.globalAlpha = 1; });
    const tail = new Path2D(); tail.moveTo(-12, ty + 5); tail.lineTo(-4.5, ty + 7); tail.lineTo(-3, ty + 36); tail.lineTo(-13, ty + 35); tail.closePath();
    part(g, tail, sc, [-13, ty + 4, -3, ty + 36], { hi: .22, sh: .32, spec: .1, rim: .2, crescent: .3 }, 2.8, gg => { gg.fillStyle = c2; gg.globalAlpha = .8; gg.fillRect(-14, ty + 17, 12, 2.6); gg.fillRect(-14, ty + 25, 12, 2.6); gg.globalAlpha = 1; });
    g.strokeStyle = dark(sc, .15); g.lineWidth = 1.6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-12 + i * 2.2, ty + 35); g.lineTo(-12.4 + i * 2.2, ty + 39.5); g.stroke(); }
  };
  C_.glasses = function (g, d, fg, ex, ey) {
    const gr = fg.gr, gc = d.glasses, kd = d.glassK, sun = kd === 'sun', w = d.glassW || (sun ? 2.6 : 2.2);
    const shape = s => { const P = new Path2D(); if (kd === 'square') { const hw = gr * .98, hh = gr * .78, x0 = s * ex - hw, y0 = ey - hh, r = 3.4; P.moveTo(x0 + r, y0); P.arcTo(x0 + hw * 2, y0, x0 + hw * 2, y0 + hh * 2, r); P.arcTo(x0 + hw * 2, y0 + hh * 2, x0, y0 + hh * 2, r); P.arcTo(x0, y0 + hh * 2, x0, y0, r); P.arcTo(x0, y0, x0 + hw * 2, y0, r); P.closePath(); }
      else if (kd === 'cat') { const cx = s * ex, o = s * gr * .22; P.moveTo(cx - s * gr * 1.0, ey - gr * .35); P.quadraticCurveTo(cx - s * gr * .6, ey - gr * .95, cx + o * 2, ey - gr * .82); P.quadraticCurveTo(cx + s * gr * 1.2, ey - gr * 1.0, cx + s * gr * 1.15, ey - gr * .45); P.quadraticCurveTo(cx + s * gr * 1.0, ey + gr * .95, cx - s * gr * .05, ey + gr * .9); P.quadraticCurveTo(cx - s * gr * 1.1, ey + gr * .8, cx - s * gr * 1.0, ey - gr * .35); P.closePath(); }
      else { P.ellipse(s * ex, ey, gr * (sun ? 1.02 : 1.0), gr * (sun ? .9 : .98), 0, 0, TAU); } return P; };
    [-1, 1].forEach(s => {
      const P = shape(s);
      g.save(); g.translate(.8, 1.5); g.lineWidth = w + .8; g.strokeStyle = 'rgba(80,30,20,.14)'; g.stroke(P); g.restore();
      if (sun) { const lg = g.createLinearGradient(0, ey - gr, 0, ey + gr); lg.addColorStop(0, 'rgba(25,25,40,.6)'); lg.addColorStop(1, 'rgba(25,25,40,.42)'); g.fillStyle = lg; g.fill(P); }
      else { g.fillStyle = 'rgba(235,246,255,.12)'; g.fill(P); }
      g.save(); g.clip(P); g.lineCap = 'round'; g.beginPath(); g.moveTo(s * ex - gr * .6, ey + gr * .1); g.lineTo(s * ex - gr * .1, ey - gr * .6); g.lineWidth = gr * .2; g.strokeStyle = 'rgba(255,255,255,' + (sun ? .4 : .5) + ')'; g.stroke(); g.restore();
      g.lineWidth = w; g.strokeStyle = gc; g.stroke(P);
    });
    g.beginPath(); g.moveTo(-ex + gr * .96, ey - gr * .1); g.quadraticCurveTo(0, ey - gr * .42, ex - gr * .96, ey - gr * .1); g.lineWidth = w; g.strokeStyle = gc; g.stroke();
  };
  C_.print = function (g, d, x0, y0, x1, y1) {   // hijab prints
    const c2 = d._hjc2 || sec(d.scarf), kd = d.scarfK; g.save();
    const n = 34; for (let i = 0; i < n; i++) {
      const fx = x0 + ((i * 37.3) % 100) / 100 * (x1 - x0), fy = y0 + ((i * 53.7) % 100) / 100 * (y1 - y0);
      if (kd === 'dots') { g.fillStyle = rgba(c2, .7); g.beginPath(); g.arc(fx, fy, 3, 0, TAU); g.fill(); }
      else if (kd === 'stars') star5(g, fx, fy, 3.6, rgba(c2, .85), 0);
      else if (kd === 'floral') { for (let q = 0; q < 5; q++) { const a = q * TAU / 5; g.fillStyle = rgba(c2, .75); g.beginPath(); g.arc(fx + Math.cos(a) * 2.5, fy + Math.sin(a) * 2.5, 1.7, 0, TAU); g.fill(); } g.fillStyle = '#ffd23c'; g.beginPath(); g.arc(fx, fy, 1.2, 0, TAU); g.fill(); }
    }
    if (kd === 'stripes') { g.strokeStyle = rgba(c2, .6); g.lineWidth = 2.6; for (let xx = x0 - (y1 - y0); xx < x1; xx += 11) { g.beginPath(); g.moveTo(xx, y1); g.lineTo(xx + (y1 - y0) * .9, y0); g.stroke(); } }
    g.restore();
  };

  /* =====================================================================================================
     HEADWEAR (registered in Moody.chars.hats so every consumer finds them; the legacy ids keep their original default colours when no colour is passed)
     draw(g, R, colour, pattern, def)  -  head-centred coordinates (head radius R, rx = R * hr)
     ===================================================================================================== */
  const OVH = R => ({ hi: .26, sh: .34, spec: .3, sy: .25, rim: .26, crescent: .26, off: R * .12, blur: R * .18 });
  const RX = (R, d) => R * ((d && d.hr) || 1);
  const regHat = (id, draw, o) => { const old = C.hats[id] || {}; C.hats[id] = Object.assign({ id, name: (byId[id] || {}).n || old.name || id, price: (byId[id] || {}).price || 0 }, old, o || {}, { draw }); };
  regHat('cap', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#ef5350', br = dark(c, .2); const P = new Path2D(); P.moveTo(-rx * 1.05, -R * .5); P.bezierCurveTo(-rx * 1.12, -R * 1.15, -rx * .5, -R * 1.42, 0, -R * 1.42); P.bezierCurveTo(rx * .5, -R * 1.42, rx * 1.12, -R * 1.15, rx * 1.05, -R * .5); P.quadraticCurveTo(0, -R * .66, -rx * 1.05, -R * .5); P.closePath();
    part(g, P, c, [-rx * 1.1, -R * 1.45, rx * 1.1, -R * .4], OVH(R), 3.5, gg => { gg.strokeStyle = 'rgba(0,0,0,.2)'; gg.lineWidth = 1.6; [-1, 1].forEach(s => { gg.beginPath(); gg.moveTo(s * rx * .02, -R * 1.42); gg.quadraticCurveTo(s * rx * .5, -R * 1.1, s * rx * .55, -R * .56); gg.stroke(); }); });
    const B = new Path2D(); B.moveTo(-rx * 1.08, -R * .52); B.quadraticCurveTo(0, -R * .06, rx * 1.08, -R * .52); B.quadraticCurveTo(0, -R * .5, -rx * 1.08, -R * .52); B.closePath(); part(g, B, br, [-rx * 1.1, -R * .5, rx * 1.1, -R * .1], { hi: .2, sh: .34, spec: .2, rim: .2, crescent: .3 }, 3.2);
    bead(g, 0, -R * 1.42, R * .09, br, 1.6);
  }, { wide: 1.45 });
  regHat('capb', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#3b6fd0', br = dark(c, .24);
    [-1, 1].forEach(s => { part(g, pEll(s * rx * 1.07, -R * .5, R * .2, R * .1, s * .5), br, [s * rx * 1.07 - R * .2, -R * .6, s * rx * 1.07 + R * .2, -R * .4], { hi: .2, sh: .3, spec: 0, rim: 0 }, 2.6); });
    const P = new Path2D(); P.moveTo(-rx * 1.05, -R * .48); P.bezierCurveTo(-rx * 1.12, -R * 1.15, -rx * .5, -R * 1.42, 0, -R * 1.42); P.bezierCurveTo(rx * .5, -R * 1.42, rx * 1.12, -R * 1.15, rx * 1.05, -R * .48); P.quadraticCurveTo(0, -R * .6, -rx * 1.05, -R * .48); P.closePath();
    part(g, P, c, [-rx * 1.1, -R * 1.45, rx * 1.1, -R * .4], OVH(R), 3.5, gg => { gg.strokeStyle = 'rgba(0,0,0,.2)'; gg.lineWidth = 1.6; gg.beginPath(); gg.moveTo(0, -R * 1.42); gg.lineTo(0, -R * .6); gg.stroke(); });
    part(g, pRR(-rx * .26, -R * .74, rx * .52, R * .2, 2), lite(c, .25), [-rx * .26, -R * .74, rx * .26, -R * .54], { hi: .2, sh: .3, spec: 0, rim: 0 }, 2.2); [-1, 0, 1].forEach(i => dot(g, i * rx * .14, -R * .64, R * .028, 'rgba(0,0,0,.4)'));
  }, { wide: 1.45 });
  regHat('beanie', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#4a8dff', cuff = col ? lite(col, .16) : '#2f6fe0';
    const P = new Path2D(); P.moveTo(-rx * 1.04, -R * .5); P.bezierCurveTo(-rx * 1.12, -R * 1.2, -rx * .6, -R * 1.5, 0, -R * 1.5); P.bezierCurveTo(rx * .6, -R * 1.5, rx * 1.12, -R * 1.2, rx * 1.04, -R * .5); P.closePath();
    part(g, P, c, [-rx * 1.1, -R * 1.5, rx * 1.1, -R * .5], OVH(R), 3.5, gg => { gg.strokeStyle = 'rgba(255,255,255,.18)'; gg.lineWidth = 1.2; for (let i = -4; i <= 4; i++) { gg.beginPath(); gg.moveTo(i * rx * .12, -R * 1.5); gg.quadraticCurveTo(i * rx * .24, -R * 1.0, i * rx * .26, -R * .5); gg.stroke(); } });
    part(g, pRR(-rx * 1.08, -R * .82, rx * 2.16, R * .36, R * .1), cuff, [-rx * 1.08, -R * .82, rx * 1.08, -R * .46], { hi: .24, sh: .32, spec: .15, rim: .22, crescent: .24 }, 3.4, gg => { gg.strokeStyle = 'rgba(0,0,0,.16)'; gg.lineWidth = 1.2; for (let i = -9; i <= 9; i++) { gg.beginPath(); gg.moveTo(i * rx * .11, -R * .82); gg.lineTo(i * rx * .11, -R * .46); gg.stroke(); } });
    bead(g, 0, -R * 1.5, R * .2, col ? lite(col, .5) : '#fff', 2.6);
  }, { wide: 1.5 });
  regHat('bucket', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#c8b080', bd = sec(c);
    part(g, pEll(0, -R * .6, rx * 1.55, R * .27), dark(c, .08), [-rx * 1.55, -R * .87, rx * 1.55, -R * .33], { hi: .22, sh: .3, spec: .2, rim: .2, crescent: .22 }, 3.4);
    const P = new Path2D(); P.moveTo(-rx * .98, -R * .58); P.bezierCurveTo(-rx * .92, -R * 1.2, -rx * .7, -R * 1.34, 0, -R * 1.34); P.bezierCurveTo(rx * .7, -R * 1.34, rx * .92, -R * 1.2, rx * .98, -R * .58); P.quadraticCurveTo(0, -R * .5, -rx * .98, -R * .58); P.closePath();
    part(g, P, c, [-rx, -R * 1.34, rx, -R * .5], OVH(R), 3.5, gg => { gg.fillStyle = bd; gg.fillRect(-rx, -R * .84, rx * 2, R * .2); gg.strokeStyle = 'rgba(0,0,0,.14)'; gg.lineWidth = 1; for (let i = -5; i <= 5; i++) { gg.beginPath(); gg.moveTo(i * rx * .18, -R * 1.34); gg.lineTo(i * rx * .2, -R * .86); gg.stroke(); } });
    for (let i = 0; i < 5; i++) dot(g, (i - 2) * rx * .3, -R * .74, 1.4, 'rgba(0,0,0,.25)');
  }, { wide: 1.8, hjDy: .1 });
  regHat('sunhat', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#f8cdd8', rb = sec(c) === '#ffffff' ? '#ffffff' : dark(c, .25), band = lum(c) > .75 ? '#ff7fae' : lite(c, .6);
    const wv = (gg, w, h) => { gg.strokeStyle = 'rgba(190,120,130,.2)'; gg.lineWidth = 1.1; for (let i = 1; i < 5; i++) { gg.beginPath(); gg.ellipse(0, 0, w * i / 5, h * i / 5, 0, 0, TAU); gg.stroke(); } };
    part(g, pEll(0, -R * .66, rx * 2.0, R * .36), c, [-rx * 2, -R, rx * 2, -R * .3], { hi: .26, sh: .22, spec: .28, sy: .35, off: 7, blur: 9, crescent: .22 }, 3.5, gg => { gg.save(); gg.translate(0, -R * .66); wv(gg, rx * 2.0, R * .36); gg.restore(); });
    part(g, pEll(0, -R * 1.0, rx * .94, R * .62), lite(c, .1), [-rx, -R * 1.62, rx, -R * .38], { hi: .3, sh: .16, crescent: .18, spec: .4, sy: .25, off: 8, blur: 8 }, 3.5, gg => { gg.save(); gg.translate(0, -R * 1.0); wv(gg, rx * .94, R * .62); gg.restore(); });
    g.beginPath(); g.ellipse(0, -R * .78, rx * .96, R * .17, 0, .02, Math.PI - .02); g.lineWidth = 7; g.strokeStyle = OL; g.stroke(); g.lineWidth = 4.6; g.strokeStyle = band; g.stroke();
    [-1, 1].forEach(s => { part(g, pPoly([[s * rx * .62, -R * .72], [s * rx * 1.0, -R * .96], [s * rx * 1.0, -R * .56]]), band, [-rx, -R, rx, -R * .5], { hi: .24, sh: .3, spec: 0, rim: 0, crescent: .2 }, 2.2); }); bead(g, rx * .62, -R * .72, R * .1, dark(band, .1), 1.6);
  }, { wide: 2.15, hjDy: .06 });
  regHat('taqiyah', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#f7f4ee'; const P = new Path2D(); P.moveTo(-rx * .98, -R * .56); P.bezierCurveTo(-rx * 1.0, -R * 1.08, -rx * .56, -R * 1.26, 0, -R * 1.26); P.bezierCurveTo(rx * .56, -R * 1.26, rx * 1.0, -R * 1.08, rx * .98, -R * .56); P.quadraticCurveTo(0, -R * .66, -rx * .98, -R * .56); P.closePath();
    part(g, P, c, [-rx, -R * 1.26, rx, -R * .5], OVH(R), 3.5, gg => { gg.strokeStyle = lum(c) > .6 ? 'rgba(120,100,70,.3)' : 'rgba(255,255,255,.28)'; gg.lineWidth = 1; for (let r = 0, yy = -R * 1.2; yy < -R * .58; yy += 7, r++) for (let xx = -rx + (r % 2 ? 4 : 0); xx < rx; xx += 8) { gg.beginPath(); gg.moveTo(xx, yy + 3.5); gg.lineTo(xx + 4, yy); gg.lineTo(xx + 8, yy + 3.5); gg.lineTo(xx + 4, yy + 7); gg.closePath(); gg.stroke(); } });
    g.beginPath(); g.moveTo(-rx * .98, -R * .56); g.quadraticCurveTo(0, -R * .66, rx * .98, -R * .56); g.lineWidth = 4; g.strokeStyle = dark(c, .14); g.stroke();
  }, { wide: 1.35 });
  regHat('headband', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#e5534b'; const P = new Path2D(); P.moveTo(-rx * 1.04, -R * .56); P.quadraticCurveTo(0, -R * .9, rx * 1.04, -R * .56); P.lineTo(rx * 1.03, -R * .8); P.quadraticCurveTo(0, -R * 1.14, -rx * 1.03, -R * .8); P.closePath();
    part(g, P, c, [-rx * 1.05, -R * 1.1, rx * 1.05, -R * .5], { hi: .26, sh: .3, spec: .3, rim: .25, crescent: .22 }, 3.2, gg => { gg.strokeStyle = sec(c); gg.globalAlpha = .85; gg.lineWidth = 2; gg.beginPath(); gg.moveTo(-rx, -R * .64); gg.quadraticCurveTo(0, -R * .96, rx, -R * .64); gg.stroke(); gg.globalAlpha = 1; });
    [-1, 1].forEach(s => part(g, pPoly([[-rx * 1.02, -R * .7], [-rx * 1.02 - R * .3, -R * .5 - s * R * .0 + (s > 0 ? R * .08 : -R * .02)], [-rx * 1.02 - R * .26, -R * .9 + (s > 0 ? R * .02 : -R * .08)]]), c, [-rx - R * .4, -R * .95, -rx, -R * .45], { hi: .2, sh: .3, spec: 0, rim: 0 }, 2.4)); bead(g, -rx * 1.02, -R * .7, R * .1, dark(c, .12), 1.6);
  }, { wide: 1.5 });
  regHat('helmet', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#4aa8e8'; const P = new Path2D(); P.moveTo(-rx * 1.12, -R * .36); P.bezierCurveTo(-rx * 1.2, -R * 1.2, -rx * .6, -R * 1.58, 0, -R * 1.58); P.bezierCurveTo(rx * .6, -R * 1.58, rx * 1.2, -R * 1.2, rx * 1.12, -R * .36); P.quadraticCurveTo(0, -R * .52, -rx * 1.12, -R * .36); P.closePath();
    part(g, P, c, [-rx * 1.2, -R * 1.58, rx * 1.2, -R * .36], { hi: .3, sh: .34, spec: .4, sy: .22, rim: .28, crescent: .26, off: R * .14, blur: R * .2 }, 3.6, gg => { gg.fillStyle = 'rgba(0,0,0,.22)'; [-.55, -.2, .2, .55].forEach(k => { gg.beginPath(); gg.ellipse(k * rx, -R * 1.08, rx * .07, R * .26, k * .3, 0, TAU); gg.fill(); }); gg.fillStyle = sec(c); gg.globalAlpha = .7; gg.fillRect(-rx * 1.2, -R * .62, rx * 2.4, 3.6); gg.globalAlpha = 1; });
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * rx * 1.0, -R * .42); g.quadraticCurveTo(s * rx * 1.04, R * .3, s * rx * .62, R * .86); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); g.lineWidth = 1.7; g.strokeStyle = '#f2f2f2'; g.stroke(); bead(g, s * rx * .62, R * .88, 2.4, '#d9d4cc', 1.2); });
  }, { wide: 1.45, hjDy: 0 });
  regHat('party', (g, R, col, p, d) => {
    const c = col || '#ff6f91', c2 = sec(c); const P = pPoly([[-R * .58, -R * .72], [R * .58, -R * .72], [0, -R * 2.0]]);
    part(g, P, c, [-R * .6, -R * 2.0, R * .6, -R * .7], { hi: .26, sh: .32, spec: .2, rim: .2, crescent: .28 }, 3.5, gg => { [[-.28, -1.0], [.22, -1.34], [-.06, -1.62], [.3, -.88]].forEach(q => dot(gg, q[0] * R, q[1] * R, R * .09, col ? c2 : '#ffe14d')); gg.strokeStyle = col ? c2 : '#ffe14d'; gg.globalAlpha = .7; gg.lineWidth = 2.4; gg.beginPath(); gg.moveTo(-R * .46, -R * 1.1); gg.lineTo(R * .46, -R * 1.2); gg.stroke(); gg.globalAlpha = 1; });
    bead(g, 0, -R * 2.02, R * .17, col ? c2 : '#ffe14d', 2.6);
  }, { hjDy: .2 });
  regHat('crown', (g, R, col, p, d) => {
    const c = col || '#ffc93c'; const P = pPoly([[-R * .7, -R * .72], [-R * .7, -R * 1.45], [-R * .35, -R * 1.1], [0, -R * 1.6], [R * .35, -R * 1.1], [R * .7, -R * 1.45], [R * .7, -R * .72]]);
    part(g, P, c, [-R * .7, -R * 1.6, R * .7, -R * .72], { hi: .3, sh: .3, spec: .4, rim: .3, crescent: .24 }, 3.5);
    bead(g, 0, -R * .95, R * .12, '#ef5350', 1.6); bead(g, -R * .4, -R * .9, R * .08, '#4a8dff', 1.4); bead(g, R * .4, -R * .9, R * .08, '#5cc96b', 1.4);
  }, { hjDy: .18 });
  regHat('chef', (g, R, col, p, d) => {
    const c = col || '#ffffff'; [[-.45, -1.25, .42], [0, -1.5, .5], [.45, -1.25, .42]].forEach(q => part(g, pCirc(q[0] * R, q[1] * R, q[2] * R), c, [(q[0] - q[2]) * R, (q[1] - q[2]) * R, (q[0] + q[2]) * R, (q[1] + q[2]) * R], { hi: .2, sh: .28, spec: .2, rim: .2, crescent: .26 }, 3.5));
    part(g, pRR(-R * .62, -R * 1.0, R * 1.24, R * .42, R * .08), c, [-R * .62, -R, R * .62, -R * .58], { hi: .2, sh: .28, spec: .15, rim: .2, crescent: .26 }, 3.5);
  }, { hjDy: .18 });
  regHat('bow', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#ff6f91'; g.save(); g.translate(-rx * .5, -R * 1.03); g.rotate(-.28);
    [-1, 1].forEach(s => part(g, pPoly([[0, 0], [s * R * .62, -R * .34], [s * R * .6, R * .34]]), c, [-R * .65, -R * .36, R * .65, R * .36], { hi: .26, sh: .3, spec: .2, rim: .2, crescent: .24 }, 3));
    [-1, 1].forEach(s => part(g, pPoly([[0, R * .05], [s * R * .2, R * .6], [s * R * .02, R * .52]]), dark(c, .08), [-R * .2, 0, R * .2, R * .6], { hi: .2, sh: .3, spec: 0, rim: 0 }, 2.2));
    bead(g, 0, 0, R * .15, dark(c, .12), 2); g.restore();
  }, { hjDy: .12 });
  regHat('ribbon', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#ffb3cc'; [-1, 1].forEach(s => { g.save(); g.translate(s * rx * .86, -R * .86); g.rotate(s * .55); [-1, 1].forEach(q => part(g, pPoly([[0, 0], [q * R * .46, -R * .26], [q * R * .46, R * .26]]), c, [-R * .5, -R * .28, R * .5, R * .28], { hi: .26, sh: .3, spec: 0, rim: 0, crescent: .22 }, 2.6)); bead(g, 0, 0, R * .11, dark(c, .12), 1.8); g.restore(); });
  }, { hjDy: 0 });
  regHat('hairband', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#c9b6ec'; g.beginPath(); g.moveTo(-rx * 1.04, -R * .2); g.bezierCurveTo(-rx * 1.1, -R * 1.2, rx * 1.1, -R * 1.2, rx * 1.04, -R * .2); g.lineWidth = R * .2 + 3.4; g.strokeStyle = OL; g.stroke(); g.lineWidth = R * .2; g.strokeStyle = c; g.stroke(); g.lineWidth = R * .05; g.strokeStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(-rx * 1.02, -R * .26); g.bezierCurveTo(-rx * 1.06, -R * 1.2, rx * 1.06, -R * 1.2, rx * 1.02, -R * .26); g.stroke();
    g.save(); g.translate(-rx * .6, -R * 1.02); g.rotate(-.3); [-1, 1].forEach(s => part(g, pPoly([[0, 0], [s * R * .4, -R * .22], [s * R * .4, R * .22]]), lite(c, .15), [-R * .4, -R * .22, R * .4, R * .22], { hi: .26, sh: .3, spec: 0, rim: 0 }, 2.4)); bead(g, 0, 0, R * .1, dark(c, .1), 1.6); g.restore();
  }, { hjDy: .06 });
  regHat('tiara', (g, R, col, p, d) => {
    const c = col || '#d9e6ff', rx = RX(R, d); const P = new Path2D(); P.moveTo(-rx * .62, -R * .85); [[-.42, -1.3], [-.2, -.98], [0, -1.48], [.2, -.98], [.42, -1.3], [.62, -.85]].forEach(q => P.lineTo(q[0] * rx, q[1] * R)); P.closePath();
    part(g, P, c, [-rx * .62, -R * 1.5, rx * .62, -R * .85], { hi: .3, sh: .3, spec: .4, rim: .3, crescent: .22 }, 3); bead(g, 0, -R * 1.28, R * .1, '#ff6f91', 1.6); [-1, 1].forEach(s => bead(g, s * rx * .4, -R * 1.1, R * .06, '#fff6a8', 1));
  }, { hjDy: .2 });
  regHat('flower', (g, R, col, p, d) => {
    const cols = col ? [col, lite(col, .5), '#ffffff'] : ['#ff6f91', '#ffc93c', '#fff']; for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * .34, x = Math.cos(a) * R * 1.03, y = Math.sin(a) * R * 1.0 - R * .08; G_flower(g, x, y, R * .16, cols[(i + 3) % 3]); }
  }, { hjDy: .12 });
  function G_flower(g, x, y, r, col) { for (let q = 0; q < 5; q++) { const a = q * TAU / 5; bead(g, x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72, r * .52, col, 1.6); } bead(g, x, y, r * .4, '#ffe14d', 1); }
  regHat('clip', (g, R, col, p, d) => {
    const rx = RX(R, d), c = col || '#ffd23c'; G_flower(g, -rx * .62, -R * .8, R * .2, c); G_flower(g, -rx * .36, -R * .93, R * .12, lite(c, .5));
  }, { hjDy: .04 });
  /* ---- legacy default prices: kept in data ---- */
  D.hatIcon = (it, px) => { const c = document.createElement('canvas'); c.width = c.height = px * 2; c.style.width = c.style.height = px + 'px'; const g = c.getContext('2d'); g.scale(2, 2); g.translate(px / 2, px * .74); const R = px * .3; g.lineJoin = 'round'; try { C.hats[it.id].draw(g, R, hx(it.c)); } catch (e) { } return c; };

  /* =====================================================================================================
     PREVIEWS: the item drawn on the REAL character (cached canvases).  kind: full | upper | lower | feet | head
     ===================================================================================================== */
  const PV = new Map();
  const CROP = (id, kind) => {
    const d = C.defs[id], R = d.R, top = d.L + d.T + R * 2 + 10;
    if (kind === 'upper') return { y0: -top - 4, y1: -d.L * .45, w: Math.max(d.sw + 26, R * 1.9) };
    if (kind === 'lower') return { y0: -d.L - d.T * .35, y1: 14, w: Math.max(d.sw + 26, 44) };
    if (kind === 'feet') return { y0: -44, y1: 10, w: 38 };
    if (kind === 'head') return { y0: -(d.L + d.T) - R * 2.4 - 6, y1: -(d.L + d.T) + R * .2, w: Math.max(R * 1.9, 34) };
    return { y0: -top - 6, y1: 12, w: Math.max(d.sw + 30, R * 1.7) };
  };
  D.crop = CROP;
  D.preview = function (id, fit, kind, px, o) {
    o = o || {}; px = px || 96; const key = id + '|' + sigOf(fit) + '|' + kind + '|' + px + (o.bg || ''); let c = PV.get(key); if (c) return c;
    const W = px, H = px, cr = CROP(id, kind), d = C.defs[id], k = Math.min(W / (cr.w * 2), H / (cr.y1 - cr.y0)) / d.sc, cv = document.createElement('canvas'), S = 2; cv.width = W * S; cv.height = H * S; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const g = cv.getContext('2d'); g.scale(S, S); g.lineJoin = 'round'; g.lineCap = 'round';
    g.save(); g.translate(W / 2, H / 2 - ((cr.y0 + cr.y1) / 2) * k * d.sc); g.scale(k, k);
    try { const pd = fit.v ? fit : fit; C.draw(g, id, 0, 0, { outfit: pd, anim: 'idle', t: 1.3, snap: true, noShadow: true, key: 'pv:' + id, _pv: true }); } catch (e) { try { console.warn('dress preview', e); } catch (x) { } }
    g.restore(); PV.set(key, cv); if (PV.size > 600) { const first = PV.keys().next().value; PV.delete(first); } return cv;
  };
  D.clearPreviews = () => PV.clear();

  /* preview draws (o._pv) get a tagged copy of the def so their sprite sets are evicted first from the bake cache */
  const pvc = new WeakMap();
  C.resolve = function (id, d0, o) {
    if (o.outfit === false) return d0;
    const fit = o.outfit || D.fitOf(id); if (!fit) return d0;
    const d = D.buildDef(id, d0, fit); if (!o._pv) return d;
    let p = pvc.get(fit); if (!p || p.b !== d) { p = { b: d, d: Object.assign({}, d, { _pv: true }) }; pvc.set(fit, p); } return p.d;
  };

  /* --------------------------------------------------------------- runner hero (back view) */
  D.runnerLook = id => { const d = D.defFor(id); return d ? { d, shirt: d.shirt, hat: d._hat && C.hats[d._hat] ? d._hat : null, hatC: d._hatC, sig: d._osig } : null; };
})();
