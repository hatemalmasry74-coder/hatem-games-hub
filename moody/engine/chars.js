/* Moody & Aboody - engine/chars.js : "Characters v2" - code-drawn articulated cartoon characters with a 3D-ish look.
   Rendering: static shaded layers (body, head skin, hair, glasses, beard, shoes, hands) are baked once to offscreen canvases
   (per character + outfit + hat + pixel density + light side) and re-used every frame; limbs, eyes, brows, mouth are drawn live.
   Animation: pose targets -> exponentially smoothed (150-250 ms blends), idle life (breathing, weight shift, blink, gaze, micro brows),
   secondary-motion springs (hair / scarf / pigtails / skirt), emotions, voice-driven mouth, gestures, tap reactions.
   M.chars.draw(g, id, x, y, o)   x,y = feet centre.
   o = { anim, t, dir(+1/-1), sc, hat, shirt, shirtId, talk, carry, alpha, emote, key, look:{x,y}, noShadow, plain, snap, tilt, lookX }
   anims: idle walk run jump pickup lift cheer oops think sleep wave phone cry scream | point shrug thumbs hug jumpcheer sad yawn giggle nod shake
   Full API + hooks: see DEV.md "Characters v2".  Backward compatible with v1 (draw/portrait/avatar/face:<id>:<pose>, DEFS rows).  */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, R2D = Math.PI / 180, TAU = 6.2832;
  const HAIR = '#3b2417', HAIR_HI = '#6a4630';
  const now = () => (window.performance && performance.now ? performance.now() : Date.now()) / 1000;

  /* ============ CHARACTER TABLE: the ONE place to tweak looks (palette / hair / outfit / proportions) ============
     top: 'placket' (button shirt, chest-pocket tag) | 'vneck' (dotted open collar) | 'polo' (dad's shirt) | 'dress' | 'floral' (long dress)
     hair: 'curly' | 'ponytail' | 'pigtails' | 'scarf' (headscarf) | 'short'.  Colours are plain CSS strings.
     abilities: tags kits can ask for with needs:'strong' (or a hero id). speed: walking speed factor.
     optional v2 keys: iris (eye colour) */
  const DEFS = {
    moody: { name: 'مودي', age: 9, sc: 1, L: 56, T: 58, R: 28, hr: .94, sw: 22, skin: '#dd9d6c', skinD: '#c98655', shirt: '#9ea4ab', pants: '#e7b038', shoe: '#7a5238', curl: .29, eye: 1, img: 'assets/moody_cartoon.jpg', w: 20, wf: 12, a1: 24, a2: 24, top: 'placket', hair: 'curly', hairC: HAIR, abilities: ['strong', 'tall'], ability: 'قوي وطويل', badge: ['م', '#ffc93c'], playable: true, speed: 230 },
    aboody: { name: 'عبودي', age: 6, sc: .76, L: 44, T: 46, R: 33, hr: 1.0, sw: 21, skin: '#cf8b5a', skinD: '#b9764a', shirt: '#26396e', pants: '#cdb68b', shoe: '#f3eee2', curl: .31, eye: 1.18, img: 'assets/aboody_cartoon.jpg', w: 18, wf: 11, a1: 20, a2: 20, top: 'vneck', hair: 'curly', hairC: HAIR, abilities: ['small', 'quick'], ability: 'صغير وسريع', badge: ['ع', '#4aa8e8'], playable: true, speed: 230 },
    toota: { name: 'توتا', full: 'تسنيم', age: 15, sc: 1.12, L: 56, T: 56, R: 28, hr: .93, sw: 20, skin: '#e8b389', skinD: '#d39a70', shirt: '#6b1f3d', skirt: '#f6ecdf', keepSkirt: true, flowers: ['#8b2346', '#e98fa6', '#2c3566'], pants: '#e8b389', legC: '#e8b389', legW: 11, shoe: '#f2ece4', eye: 1.0, w: 17, wf: 11, a1: 16, a2: 16, top: 'blouse', sleeveLong: true, ruffle: '#7d2a4c', hair: 'scarf', scarf: '#f8f3ea', under: '#6b1f3d', glasses: '#5a4636', lash: true, neckPhones: '#f4c5d2', bag: '#d9c3a0', img: 'assets/toota_cartoon.jpg', abilities: ['leader', 'order'], ability: 'قائدة ومنظمة', badge: ['ت', '#8b2346'], playable: true, speed: 230 },
    nemo: { name: 'نيمو', full: 'ترنيم', age: 12, sc: 1.04, L: 52, T: 52, R: 30, hr: .98, sw: 20, skin: '#d29566', skinD: '#bb7d52', shirt: '#f7a9c6', pants: '#8fa6d9', shoe: '#ffffff', eye: 1.12, w: 18, wf: 11, a1: 18, a2: 18, top: 'hoodie', hair: 'bob', hairC: '#2b1a12', sunhat: '#f6c3cf', glasses: '#d9a28f', lash: true, smile: 'big', neckPhones: '#f6b6cd', bunny: true, img: 'assets/nemo_cartoon.jpg', abilities: ['curious', 'finder', 'small'], ability: 'فضولية وبتلاقي المخفي', badge: ['ن', '#ff6f91'], playable: true, speed: 230 },
    nana: { name: 'ننا زوزا', age: 68, sc: .9, L: 50, T: 56, R: 30, hr: .96, sw: 22, skin: '#e4b58c', skinD: '#cf9f76', shirt: '#c9b6ec', skirt: '#c9b6ec', flowers: ['#ff6f91', '#ffd23c', '#ffffff'], pants: '#e4b58c', legC: '#e4b58c', legW: 11, shoe: '#6b5a74', eye: .95, w: 20, wf: 11, a1: 22, a2: 22, top: 'floral', hair: 'scarf', scarf: '#f6dfe8', hairC: '#cfcfd6', glasses: '#8a6b55', wrinkles: true, abilities: ['wise', 'kind'], ability: 'حكيمة وحنونة', badge: ['ز', '#c9b6ec'], playable: false, speed: 130, stoop: .03 },
    baba: { name: 'بابا', age: 40, sc: 1.22, L: 58, T: 62, R: 28, hr: .96, sw: 24, skin: '#c98f5f', skinD: '#b17848', shirt: '#2b2b30', pants: '#3b3f50', shoe: '#2a2320', eye: .95, w: 22, wf: 13, a1: 24, a2: 24, top: 'crew', hair: 'curly', curl: .22, hairC: '#17120e', beard: '#17120e', smile: 'big', browW: 5.4, watch: true, ring: true, img: 'assets/baba_cartoon.jpg', abilities: ['dad'], ability: 'بابا', badge: ['ب', '#555a6b'], playable: false, speed: 200 },
    /* ---- extended family (owner's edition only; tools/family/build.js strips these rows). All playable:false. Extra flags: phone/spoon/car/backpack/apron = props, idle = default idle pose, bow/quiff/part/fringe = hair details, fidget/curious = idle behaviour ---- */
    ofa: { name: 'أوفا', age: 10, sc: .98, L: 54, T: 56, R: 28, hr: .95, sw: 21, skin: '#d79a68', skinD: '#c0834f', shirt: '#3fae6a', pants: '#4a5f8c', shoe: '#f3eee2', eye: 1.02, w: 19, wf: 12, a1: 24, a2: 24, top: 'crew', hair: 'short', hairC: '#2a1a10', fringe: true, smile: 'big', abilities: ['cousin', 'friendly'], ability: 'ابن عمتهم المرح', badge: ['أ', '#3fae6a'], playable: false, speed: 230 },
    toti: { name: 'توتي', age: 4, sc: .62, L: 38, T: 40, R: 34, hr: 1.0, sw: 21, skin: '#e0a577', skinD: '#c98d5f', shirt: '#ff7fb0', trim: '#ffffff', belt: '#ffd23c', pants: '#e0a577', legC: '#e0a577', legW: 13, shoe: '#e5534b', eye: 1.25, w: 16, wf: 11, a1: 18, a2: 18, top: 'dress', hair: 'pigtails', hairC: '#2b1a12', tie: '#ff4a86', bow: '#ff4a86', lash: true, smile: 'big', fidget: true, abilities: ['naughty', 'tiny'], ability: 'شقية وبتحب نيمو', badge: ['ت', '#ff7fb0'], playable: false, speed: 190 },
    amani: { name: 'عمتو أماني', age: 42, sc: .96, L: 48, T: 56, R: 29, hr: .97, sw: 22, skin: '#dca878', skinD: '#c6905f', shirt: '#7fb08f', flowers: ['#ffffff', '#f2c14e', '#e07a5f'], pants: '#dca878', legC: '#dca878', legW: 11, shoe: '#8a5a44', eye: .97, w: 20, wf: 11, a1: 22, a2: 22, top: 'floral', hair: 'scarf', scarf: '#e0825e', apron: '#fff7e6', apronTrim: '#e5534b', spoon: true, lash: true, smile: 'big', abilities: ['cook', 'kind'], ability: 'بتحب الطبخ', badge: ['أ', '#e0825e'], playable: false, speed: 170 },
    nada: { name: 'عمتو ندى', age: 38, sc: 1, L: 54, T: 55, R: 28, hr: .95, sw: 20, skin: '#d9a070', skinD: '#c28858', shirt: '#4b86a8', skirt: '#2f3d5c', keepSkirt: true, pants: '#d9a070', legC: '#d9a070', legW: 11, shoe: '#f2ece4', eye: 1.0, w: 17, wf: 11, a1: 18, a2: 18, top: 'blouse', sleeveLong: true, ruffle: '#3a6f8e', hair: 'scarf', scarf: '#d8c3b0', under: '#4b86a8', lash: true, phone: true, idle: 'phone', abilities: ['phone'], ability: 'دايمًا في الموبايل', badge: ['ن', '#4b86a8'], playable: false, speed: 190 },
    beno: { name: 'بينو', age: 15, sc: 1.1, L: 55, T: 56, R: 27.5, hr: .93, sw: 21, skin: '#cf935f', skinD: '#b87d4b', shirt: '#4a4f6a', pants: '#2b2f3a', shoe: '#ffffff', eye: .95, w: 20, wf: 12, a1: 22, a2: 22, top: 'hoodie', hair: 'short', hairC: '#1e130c', quiff: true, neckPhones: '#3b3b46', abilities: ['teen'], ability: 'مراهق رياضي', badge: ['ب', '#4a4f6a'], playable: false, speed: 240 },
    medo: { name: 'ميدو', age: 18, sc: 1.2, L: 60, T: 60, R: 28, hr: .92, sw: 23, skin: '#c98b58', skinD: '#b27546', shirt: '#8a3b3b', pants: '#3d4a5e', shoe: '#2a2320', eye: .93, w: 22, wf: 13, a1: 24, a2: 24, top: 'crew', hair: 'short', hairC: '#17100b', glasses: '#2a2a2f', backpack: '#35507a', abilities: ['teen', 'tall'], ability: 'طويل ودحيح', badge: ['م', '#8a3b3b'], playable: false, speed: 240 },
    kamal: { name: 'عمو كمال', age: 34, sc: 1.18, L: 58, T: 62, R: 28, hr: .95, sw: 23, skin: '#c98f5f', skinD: '#b17848', shirt: '#6ea0d6', pants: '#bfae8a', shoe: '#5a3c28', eye: .97, w: 22, wf: 13, a1: 24, a2: 24, top: 'polo', hair: 'short', hairC: '#1a120d', part: true, smile: 'big', browW: 4.6, watch: true, ring: true, abilities: ['uncle'], ability: 'عمو مسافر', badge: ['ك', '#6ea0d6'], playable: false, speed: 200 },
    luka: { name: 'لوكا', age: 4, sc: .56, L: 36, T: 38, R: 34, hr: 1.0, sw: 20, skin: '#e0a272', skinD: '#c98a5c', shirt: '#ff9a3c', pants: '#4f78b8', shoe: '#ffffff', eye: 1.3, w: 17, wf: 11, a1: 18, a2: 18, top: 'crew', hair: 'curly', curl: .3, hairC: '#2b1a12', car: true, curious: true, smile: 'big', abilities: ['tiny', 'curious'], ability: 'فضولي وبيحب العربيات', badge: ['ل', '#ff9a3c'], playable: false, speed: 170 }
  };
  const C = M.chars = { defs: DEFS, hats: {}, shirts: {} };
  C.avatar = id => DEFS[id].img;
  C.extras = () => Object.keys(DEFS).filter(k => k !== 'moody' && k !== 'aboody');   // every non-hero character (stage keeps one actor for each)
  C.playable = () => Object.keys(DEFS).filter(k => DEFS[k].playable);
  C.has = (id, need) => id === need || (DEFS[id] && DEFS[id].abilities.indexOf(need) >= 0);
  C.badge = need => { if (DEFS[need]) return DEFS[need].badge; const k = Object.keys(DEFS).find(k => DEFS[k].abilities.indexOf(need) >= 0 && DEFS[k].playable); return k ? DEFS[k].badge : ['؟', '#ffc93c']; };
  C.height = id => { const d = DEFS[id]; return (d.L + d.T + 6 + d.R * 2 + 8) * d.sc; };

  /* ----- cosmetics registry (extensible: worlds may add more) ----- */
  C.registerHat = (id, name, price, draw) => { C.hats[id] = { id, name, price, draw }; };
  C.registerShirt = (id, name, price, color) => { C.shirts[id] = { id, name, price, color }; };
  C.registerHat('cap', 'كاب أحمر', 10, (g, R) => { g.beginPath(); g.ellipse(0, -R * .72, R * 1.0, R * .62, 0, Math.PI, 0); G.fs(g, '#ef5350', 3.5); G.ell(g, R * .55, -R * .48, R * .75, R * .17, '#c62f2c', 3.5); G.circ(g, 0, -R * 1.32, R * .1, '#c62f2c', 2.5); });
  C.registerHat('party', 'طاقية حفلة', 15, (g, R) => { G.poly(g, [[-R * .55, -R * .75], [R * .55, -R * .75], [0, -R * 2.0]], '#ff6f91', 3.5); [[-.25, -1.0], [.2, -1.35], [-.05, -1.6]].forEach(p => G.circ(g, p[0] * R, p[1] * R, R * .09, '#ffe14d', 0)); G.circ(g, 0, -R * 2.02, R * .17, '#ffe14d', 3); });
  C.registerHat('crown', 'تاج ملوكي', 30, (g, R) => { G.poly(g, [[-R * .7, -R * .72], [-R * .7, -R * 1.45], [-R * .35, -R * 1.1], [0, -R * 1.6], [R * .35, -R * 1.1], [R * .7, -R * 1.45], [R * .7, -R * .72]], '#ffc93c', 3.5); G.circ(g, 0, -R * .95, R * .12, '#ef5350', 2.5); G.circ(g, -R * .4, -R * .9, R * .08, '#4a8dff', 2); G.circ(g, R * .4, -R * .9, R * .08, '#5cc96b', 2); });
  C.registerHat('chef', 'طاقية الشيف', 20, (g, R) => { G.fillRR(g, -R * .62, -R * .95, R * 1.24, R * .38, R * .08, '#fff', 3.5); [[-.45, -1.25, .42], [0, -1.5, .5], [.45, -1.25, .42]].forEach(p => G.circ(g, p[0] * R, p[1] * R, p[2] * R, '#fff', 3.5)); G.fillRR(g, -R * .62, -R * 1.0, R * 1.24, R * .4, R * .08, '#fff', 0); });
  C.registerHat('beanie', 'طاقية شتا', 15, (g, R) => { g.beginPath(); g.ellipse(0, -R * .72, R * 1.0, R * .72, 0, Math.PI, 0); G.fs(g, '#4a8dff', 3.5); G.fillRR(g, -R * 1.02, -R * .86, R * 2.04, R * .3, R * .12, '#2f6fe0', 3.5); G.circ(g, 0, -R * 1.5, R * .2, '#fff', 3); });
  C.registerHat('flower', 'تاج ورد', 20, (g, R) => { for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * .34, x = Math.cos(a) * R * 1.03, y = Math.sin(a) * R * 1.0 - R * .08; G.circ(g, x, y, R * .16, ['#ff6f91', '#ffc93c', '#fff'][(i + 3) % 3], 2.5); G.circ(g, x, y, R * .05, '#ffe14d', 0); } });
  C.registerHat('bow', 'فيونكة', 10, (g, R) => { [-1, 1].forEach(s => G.poly(g, [[0, -R * 1.02], [s * R * .5, -R * 1.3], [s * R * .5, -R * .75]], '#ff6f91', 3)); G.circ(g, 0, -R * 1.02, R * .13, '#ff3d77', 2.5); }); C.hats.bow.for = ['toota', 'nemo'];
  C.registerHat('tiara', 'تاج أميرة', 25, (g, R) => { g.beginPath(); g.moveTo(-R * .6, -R * .85); [[-.4, -1.25], [-.2, -.95], [0, -1.4], [.2, -.95], [.4, -1.25], [.6, -.85]].forEach(p => g.lineTo(p[0] * R, p[1] * R)); g.closePath(); G.fs(g, '#d9e6ff', 3); G.circ(g, 0, -R * 1.25, R * .1, '#ff6f91', 2); }); C.hats.tiara.for = ['toota', 'nemo'];
  C.registerHat('clip', 'مشبك ورد', 10, (g, R) => { G.circ(g, -R * .55, -R * .75, R * .17, '#ffd23c', 2.5); G.circ(g, -R * .55, -R * .75, R * .07, '#ff6f91', 0); [-1, 1].forEach(s => G.circ(g, -R * .55 + s * R * .2, -R * .75, R * .1, '#fff', 2)); }); C.hats.clip.for = ['toota', 'nemo'];
  C.registerShirt('red', 'تيشيرت أحمر', 10, '#e5534b'); C.registerShirt('green', 'تيشيرت أخضر', 10, '#43a867');
  C.registerShirt('purple', 'تيشيرت بنفسجي', 10, '#8a6bd6'); C.registerShirt('orange', 'تيشيرت برتقالي', 10, '#ff8a2a');
  C.registerShirt('sky', 'تيشيرت سماوي', 10, '#4aa8e8'); C.registerShirt('pink', 'تيشيرت وردي', 10, '#f2679a');
  C.registerShirt('gmint', 'فستان نعناعي', 12, '#5fd0b0'); C.registerShirt('grose', 'فستان وردي', 12, '#ff86ad'); C.registerShirt('gblue', 'فستان أزرق', 12, '#5aa0f0'); C.registerShirt('gyel', 'فستان أصفر', 12, '#ffcf3d'); ['gmint', 'grose', 'gblue', 'gyel'].forEach(k => { C.shirts[k].for = ['toota', 'nemo']; });

  /* ================= colour + path helpers (used at bake time and for per-character palettes) ================= */
  const CC = {};
  function parse(c) {
    let v = CC[c]; if (v) return v; let r, g, b, a = 1;
    if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; const n = parseInt(h, 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    else { const m = c.match(/[\d.]+/g) || [0, 0, 0]; r = +m[0]; g = +m[1]; b = +m[2]; if (m[3] != null) a = +m[3]; }
    return (CC[c] = [r, g, b, a]);
  }
  function mixc(a, b, t) { const A = parse(a), B = parse(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
  const lite = (c, t) => mixc(c, '#ffffff', t), dark = (c, t) => mixc(c, '#000000', t);
  function rgba(c, a) { const A = parse(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }

  function pEll(cx, cy, rx, ry, rot) { const p = new Path2D(); p.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); return p; }
  function pRR(x, y, w, h, r) { const p = new Path2D(); r = Math.min(r, w / 2, h / 2); p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); return p; }
  function pPoly(pts) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; }
  function pCirc(x, y, r) { return pEll(x, y, r, r); }

  /* ----- sprite factory ----- */
  let LV = 1, LX = -1;   // current bake density (px per unit) and light side (-1 = key light from the left of the screen)
  function mkSpr(x0, y0, x1, y1, lvl, fn) {
    const c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil((x1 - x0) * lvl)); c.height = Math.max(2, Math.ceil((y1 - y0) * lvl));
    const g = c.getContext('2d'); g.scale(lvl, lvl); g.translate(-x0, -y0); g.lineJoin = 'round'; g.lineCap = 'round'; LV = lvl; fn(g);
    return { c, x: x0, y: y0, w: c.width / lvl, h: c.height / lvl };
  }
  const blit = (g, s) => { if (s) g.drawImage(s.c, s.x, s.y, s.w, s.h); };

  /* ----- volumetric overlay: alpha-only shading drawn over any flat fill/pattern, clipped to the shape P (top-left key light) -----
     o: hi (light corner alpha) sh (dark corner alpha) spec (soft highlight) rim (bounce/rim light alpha) crescent (inner form shadow alpha) tint (dark tint rgb string) */
  function overlay(g, P, bb, o) {
    o = o || {}; const x0 = bb[0], y0 = bb[1], x1 = bb[2], y1 = bb[3], w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, big = Math.max(w, h);
    const tint = o.tint || '40,10,30', warm = o.warm || '255,246,232';
    g.save(); g.clip(P);
    const gr = g.createLinearGradient(LX < 0 ? x0 : x1, y0, LX < 0 ? x1 : x0, y1);
    gr.addColorStop(0, 'rgba(' + warm + ',' + (o.hi == null ? .2 : o.hi) + ')'); gr.addColorStop(.36, 'rgba(' + warm + ',0)'); gr.addColorStop(.58, 'rgba(' + tint + ',0)'); gr.addColorStop(1, 'rgba(' + tint + ',' + (o.sh == null ? .3 : o.sh) + ')');
    g.fillStyle = gr; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    if (o.spec !== 0) {
      const hx = cx + LX * w * (o.sx == null ? .2 : o.sx), hy = y0 + h * (o.sy == null ? .27 : o.sy), rr = big * (o.sr || .5), rg = g.createRadialGradient(hx, hy, 0, hx, hy, rr);
      rg.addColorStop(0, 'rgba(' + warm + ',' + (o.spec == null ? .2 : o.spec) + ')'); rg.addColorStop(1, 'rgba(' + warm + ',0)'); g.fillStyle = rg; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    }
    try {
      const off = o.off == null ? big * .1 : o.off, bl = (o.blur == null ? big * .12 : o.blur), BIG = 3000;
      if (o.crescent !== 0) {
        const fr = new Path2D(); fr.rect(x0 - 400, y0 - 400, w + 800, h + 800); fr.addPath(P, { a: 1, b: 0, c: 0, d: 1, e: LX * off, f: -off * .85 });
        g.save(); g.shadowColor = 'rgba(' + (o.cres || tint) + ',' + (o.crescent == null ? .34 : o.crescent) + ')'; g.shadowBlur = bl * LV; g.shadowOffsetX = -BIG * LV; g.shadowOffsetY = 0; g.translate(BIG, 0); g.fillStyle = '#000'; g.fill(fr, 'evenodd'); g.restore();
      }
      if (o.rim !== 0) { const d = o.rimD == null ? 2.4 : o.rimD; g.save(); g.translate(LX * d, -d * .9); g.lineWidth = o.rimW || 2.6; g.strokeStyle = 'rgba(' + (o.rimC || '255,226,190') + ',' + (o.rim == null ? .3 : o.rim) + ')'; g.stroke(P); g.restore(); }
    } catch (e) { }
    g.restore();
  }
  /* flat fill (+ optional pattern callback while clipped) + volume overlay + outline */
  function part(g, P, fill, bb, ov, lw, pat) {
    g.fillStyle = fill; g.fill(P);
    if (pat) { g.save(); g.clip(P); pat(g); g.restore(); }
    overlay(g, P, bb, ov);
    if (lw !== 0) { g.lineWidth = lw == null ? 3.5 : lw; g.strokeStyle = OL; g.stroke(P); }
  }
  /* tapered cloth fold: dark crease + light edge on the lit side */
  function fold(g, x0, y0, cx, cy, x1, y1, w, a) {
    a = a == null ? .2 : a; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.lineWidth = w; g.strokeStyle = 'rgba(30,5,25,' + a + ')'; g.stroke();
    g.beginPath(); g.moveTo(x0 + LX * w * .9, y0 - w * .3); g.quadraticCurveTo(cx + LX * w * .9, cy - w * .3, x1 + LX * w * .9, y1 - w * .3); g.lineWidth = w * .55; g.strokeStyle = 'rgba(255,246,232,' + a * .75 + ')'; g.stroke();
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.lineWidth = w * .45; g.strokeStyle = 'rgba(30,5,25,' + a * .8 + ')'; g.stroke();
  }
  function line(g, x0, y0, x1, y1, w, col) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = col; g.stroke(); }
  function dot(g, x, y, r, col) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = col; g.fill(); }
  /* glossy round button / bead */
  function bead(g, x, y, r, col, lw) { const P = pCirc(x, y, r); g.fillStyle = col; g.fill(P); const rg = g.createRadialGradient(x + LX * r * .35, y - r * .4, 0, x, y, r * 1.1); rg.addColorStop(0, 'rgba(255,255,255,.75)'); rg.addColorStop(.45, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = rg; g.fill(P); if (lw !== 0) { g.lineWidth = lw == null ? 1.5 : lw; g.strokeStyle = OL; g.stroke(P); } }

  /* per-character palette (shading colours derived once) */
  const PALS = {};
  function palette(id, d, shirtC) {
    const k = id + '|' + shirtC; if (PALS[k]) return PALS[k];
    const hc = d.hairC || HAIR;
    return (PALS[k] = { skin: d.skin, skinL: mixc(d.skin, '#fff0dc', .36), skinS: mixc(d.skinD || d.skin, '#9a2f2a', .3), skinD: d.skinD || d.skin, hair: hc, hairL: mixc(hc, '#d9aa80', .34), hairD: mixc(hc, '#000', .38), shirt: shirtC, shirtL: lite(shirtC, .22), shirtD: dark(shirtC, .22),
      pants: d.pants, pantsL: lite(d.pants, .2), pantsD: dark(d.pants, .24), legC: d.legC || d.pants, shoe: d.shoe, iris: d.iris || '#5a331c', brow: d.hair === 'curly' && d.beard ? '#120d0a' : '#2e1b10' });
  }
  const SPRS = {};   // key -> sprite set
  const LEVELS = [.5, .75, 1, 1.5, 2, 3, 4];
  function pickLevel(s) { for (let i = 0; i < LEVELS.length; i++) if (LEVELS[i] >= s * .92) return LEVELS[i]; return 4; }

  /* ================= BAKED LAYERS ================= */
  const isDressy = d => d.top === 'dress' || d.top === 'floral' || d.top === 'blouse';
  function skirtGeo(d) { const L = d.L, T = d.T, sw = d.sw; return { wy: -L - T * .12, hemY: d.top === 'floral' ? -L * .16 : -L * .5, hw0: sw * .92, hw1: sw + (d.top === 'floral' ? 15 : d.top === 'blouse' ? 8 : 17) }; }

  function bakeBody(id, d, pal, shirtC, lvl) {
    const L = d.L, T = d.T, sw = d.sw, ty = -(L + T), tw = sw * 2, th = T + 5, tx = -sw, dressy = isDressy(d), sk = skirtGeo(d);
    const x0 = -(sw + 34), x1 = sw + 34, y0 = ty - 24, y1 = Math.max(ty + th + (d.apron ? 28 : 10), dressy ? sk.hemY + 18 : -99);
    return mkSpr(x0, y0, x1, y1, lvl, g => {
      const thh = th - (dressy ? 8 : 0);
      if (d.backpack) {
        const bc = d.backpack; part(g, pRR(tx - 9, ty + 2, tw + 18, th - 14, 12), bc, [tx - 9, ty + 2, tx + tw + 9, ty + th - 12], { hi: .2, sh: .34 });
        part(g, pRR(tx - 9, ty + th * .45, tw + 18, th * .22, 6), dark(bc, .15), [tx - 9, ty + th * .45, tx + tw + 9, ty + th * .67], { hi: .12, sh: .25, crescent: .2 }, 2.4);
      }
      if (dressy) {   // skirt first (behind the bodice)
        const wy = sk.wy, hemY = sk.hemY, hw0 = sk.hw0, hw1 = sk.hw1, p = new Path2D();
        p.moveTo(-hw0, wy); p.lineTo(hw0, wy); p.quadraticCurveTo(hw1 + 2, (wy + hemY) / 2, hw1, hemY); p.quadraticCurveTo(0, hemY + 7, -hw1, hemY); p.quadraticCurveTo(-hw1 - 2, (wy + hemY) / 2, -hw0, wy); p.closePath();
        part(g, p, (d.keepSkirt || shirtC === d.shirt) ? (d.skirt || shirtC) : shirtC, [-hw1 - 2, wy, hw1 + 2, hemY + 8], { hi: .22, sh: .36, spec: .14, off: 9, blur: 8 }, 3.5, gg => {
          if (d.stripes) { gg.fillStyle = d.stripes; [.28, .62].forEach(k => gg.fillRect(-hw1, wy + (hemY - wy) * k, hw1 * 2, 7)); }
          if (d.flowers) { for (let i = 0; i < 9; i++) { const fx = -hw1 + (i * 37) % (hw1 * 2), fy = wy + 8 + ((i * 53) % Math.max(8, hemY - wy - 12)); dot(gg, fx, fy, 3.4, d.flowers[i % d.flowers.length]); dot(gg, fx, fy, 1.1, '#ffe14d'); dot(gg, fx - 1.2, fy - 1.2, 1, 'rgba(255,255,255,.55)'); } }
          for (let k = 1; k <= 5; k++) { const a = -hw0 + hw0 * 2 * k / 6, b = a * hw1 / hw0; fold(gg, a, wy + 2, a * 1.04, (wy + hemY) / 2, b * 1.06, hemY + 3, 3.2, .14); }
        });
        g.beginPath(); g.moveTo(-hw1 + 3, hemY + 1); g.quadraticCurveTo(0, hemY + 8, hw1 - 3, hemY + 1); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.28)'; g.stroke();   // hem edge light
      }
      /* torso */
      const TP = pRR(tx, ty, tw, thh, 9);
      part(g, TP, shirtC, [tx, ty, tx + tw, ty + thh], { hi: .22, sh: .36, spec: .22, sy: .22, off: 10, blur: 8, rim: .3 }, 3.5, gg => {
        if (d.top === 'vneck') { gg.fillStyle = 'rgba(255,255,255,.92)'; for (let yy = 0; yy < th + 6; yy += 8) for (let xx = (yy / 8 % 2) * 4; xx < tw; xx += 8) { gg.beginPath(); gg.arc(tx + xx + 2, ty + yy + 3, 1.5, 0, 6.3); gg.fill(); } }
        if (d.stripes && dressy) { gg.fillStyle = d.stripes; gg.fillRect(tx, ty + th * .34, tw, 7); }
        if (d.flowers && d.top === 'floral') { for (let i = 0; i < 8; i++) { const fx = tx + (i * 29) % tw, fy = ty + 6 + (i * 41) % (th - 20); dot(gg, fx, fy, 3.1, d.flowers[i % 3]); dot(gg, fx - 1, fy - 1, 1, 'rgba(255,255,255,.5)'); } }
        fold(gg, tx + 2, ty + 12, tx + 9, ty + 20, tx + 14, ty + 34, 3.4, .16); fold(gg, tx + tw - 2, ty + 12, tx + tw - 9, ty + 20, tx + tw - 14, ty + 34, 3.4, .2);   // armpit creases
        if (!dressy) { fold(gg, tx + 4, ty + thh * .72, 0, ty + thh * .76, tx + tw - 4, ty + thh * .72, 3, .11); fold(gg, tx + 6, ty + thh - 7, 0, ty + thh - 4, tx + tw - 6, ty + thh - 7, 2.6, .12); }
        else fold(gg, tx + 4, ty + thh - 9, 0, ty + thh - 6, tx + tw - 4, ty + thh - 9, 2.6, .12);
        const ch = gg.createRadialGradient(tx + tw * (LX < 0 ? .34 : .66), ty + 14, 0, tx + tw * .5, ty + 20, tw * .6); ch.addColorStop(0, 'rgba(255,255,255,.12)'); ch.addColorStop(1, 'rgba(255,255,255,0)'); gg.fillStyle = ch; gg.fillRect(tx, ty, tw, thh);
        const cs = gg.createLinearGradient(0, ty, 0, ty + 16); cs.addColorStop(0, 'rgba(40,10,30,.3)'); cs.addColorStop(1, 'rgba(40,10,30,0)'); gg.fillStyle = cs; gg.fillRect(tx, ty, tw, 16);   // collar-line shadow
      });
      /* tops */
      const tl = shirtC, c15 = { hi: .16, sh: .26, crescent: .22, rim: 0, spec: .1 };
      if (d.top === 'placket' || d.top === 'polo') {
        g.fillStyle = d.top === 'placket' ? '#e3c58c' : G.shade(tl, -.15); g.fillRect(-3, ty + 8, 6, th - 8); line(g, -3, ty + 8, -3, ty + th - 1, 1.5, OL); line(g, 3, ty + 8, 3, ty + th - 1, 1.5, OL);
        [18, 32, 46].forEach(yy => bead(g, 0, ty + yy, 2.5, d.top === 'placket' ? '#c9a05e' : '#f3f3f3'));
        if (d.top === 'placket') { part(g, pRR(5, ty + 20, 15, 17, 2), 'rgba(255,255,255,.14)', [5, ty + 20, 20, ty + 37], { hi: .12, sh: .2, spec: 0, rim: 0 }, 2.5); g.fillStyle = '#222'; g.fillRect(9, ty + 24, 7, 4); line(g, 6, ty + 21.5, 19, ty + 21.5, 1.4, 'rgba(0,0,0,.25)'); }
        [[[-3, ty + 1], [-14, ty + 3], [-4, ty + 15]], [[3, ty + 1], [14, ty + 3], [4, ty + 15]]].forEach(pts => part(g, pPoly(pts), lite(tl, .14), [-14, ty, 14, ty + 16], c15, 2.8));
      } else if (d.top === 'vneck') {
        part(g, pPoly([[-9, ty + 1], [9, ty + 1], [0, ty + 19]]), d.skin, [-9, ty, 9, ty + 19], { hi: .1, sh: .35, tint: '120,40,30', crescent: .3, rim: 0, spec: 0 }, 2.8);
        [28, 38].forEach(yy => bead(g, 0, ty + yy, 2.5, '#e3c58c'));
        part(g, pRR(4, ty + 22, 14, 15, 2), 'rgba(255,255,255,.1)', [4, ty + 22, 18, ty + 37], { hi: .1, sh: .18, spec: 0, rim: 0 }, 2.5);
        [[[-9, ty + 1], [-17, ty + 4], [-9, ty + 17]], [[9, ty + 1], [17, ty + 4], [9, ty + 17]]].forEach(pts => part(g, pPoly(pts), tl, [-17, ty, 17, ty + 17], c15, 2.8));
      } else if (d.top === 'hoodie') {
        part(g, pRR(-sw + 4, ty + th * .5, tw - 8, th * .36, 8), dark(tl, .08), [-sw + 4, ty + th * .5, sw - 4, ty + th * .86], { hi: .14, sh: .3, crescent: .3, spec: 0, rim: 0 }, 2.8);
        g.beginPath(); g.moveTo(-sw + 10, ty + th * .52); g.lineTo(-4, ty + th * .66); g.moveTo(sw - 10, ty + th * .52); g.lineTo(4, ty + th * .66); g.lineWidth = 1.6; g.strokeStyle = 'rgba(0,0,0,.22)'; g.stroke();   // pocket opening
        [-1, 1].forEach(s => { line(g, s * 5, ty + 6, s * 6, ty + 24, 2.8, OL); line(g, s * 5, ty + 6, s * 6, ty + 24, 1.8, '#fff'); bead(g, s * 6, ty + 25, 1.7, '#fff', 1); });
        part(g, pEll(0, ty + 3, 14, 6), dark(tl, .12), [-14, ty - 3, 14, ty + 9], { hi: .1, sh: .4, crescent: .3, rim: 0, spec: 0 }, 2.8);
      } else if (d.top === 'crew') {
        part(g, pEll(0, ty + 2, 11, 5.5), d.skin, [-11, ty - 4, 11, ty + 8], { hi: .05, sh: .38, tint: '120,40,30', crescent: .3, rim: 0, spec: 0 }, 2.8);
        g.beginPath(); g.ellipse(0, ty + 2, 12, 6, 0, 0, Math.PI); g.lineWidth = 3.4; g.strokeStyle = lite(tl, .15); g.stroke(); g.beginPath(); g.ellipse(0, ty + 3.4, 11.4, 5.4, 0, .1, Math.PI - .1); g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.18)'; g.stroke();
      } else if (d.top === 'blouse') {
        part(g, pEll(0, ty + 3, 12, 5), lite(tl, .12), [-12, ty - 2, 12, ty + 8], { hi: .1, sh: .3, crescent: .25, rim: 0, spec: 0 }, 2.8);
        [-1, 1].forEach(s2 => { const rp = pCirc(s2 * (sw - 3), ty + 5, 5.5); part(g, rp, d.ruffle || tl, [s2 * (sw - 3) - 6, ty - 1, s2 * (sw - 3) + 6, ty + 11], { hi: .2, sh: .34, spec: .2, rim: 0 }, 2.2); });
        line(g, 0, ty + 8, 0, ty + th - 14, 1.6, 'rgba(0,0,0,.2)'); part(g, pRR(-sw, ty + th - 14, tw, 6, 2), dark(tl, .12), [-sw, ty + th - 14, sw, ty + th - 8], { hi: .12, sh: .3, crescent: .2, rim: 0, spec: 0 }, 2.4);
      } else if (dressy) {
        if (d.trim && d.top === 'dress' && !d.stripes) { part(g, pEll(0, ty + 3, 13, 6), d.trim, [-13, ty - 3, 13, ty + 9], { hi: .1, sh: .3, crescent: .25, rim: 0, spec: 0 }, 2.8); part(g, pRR(-sw, ty + th - 22, tw, 8, 2), d.belt || '#ffd23c', [-sw, ty + th - 22, sw, ty + th - 14], { hi: .22, sh: .3, crescent: .2, rim: 0, spec: .2 }, 2.8); bead(g, 0, ty + th - 18, 3.4, '#fff', 1.4); }
        else if (d.top === 'floral') { part(g, pEll(0, ty + 3, 12, 6), '#fff', [-12, ty - 3, 12, ty + 9], { hi: .05, sh: .22, crescent: .2, rim: 0, spec: 0 }, 2.8); bead(g, 0, ty + 18, 2.5, '#ffd23c'); bead(g, 0, ty + 30, 2.5, '#ffd23c'); }
        else part(g, pEll(0, ty + 3, 12, 6), d.trim || '#fff', [-12, ty - 3, 12, ty + 9], { hi: .05, sh: .22, crescent: .2, rim: 0, spec: 0 }, 2.8);
      }
      if (d.backpack) { [-1, 1].forEach(s2 => { line(g, s2 * (sw - 6), ty + 1, s2 * (sw - 8), ty + th - 12, 7.5, OL); line(g, s2 * (sw - 6), ty + 1, s2 * (sw - 8), ty + th - 12, 4.4, dark(d.backpack, .25)); line(g, s2 * (sw - 6) + LX * 1, ty + 3, s2 * (sw - 8) + LX * 1, ty + th - 14, 1.2, 'rgba(255,255,255,.25)'); }); }
      if (d.apron) {   // cooking apron: bib + neck strap + skirt panel + pocket
        const ac = d.apron, at = d.apronTrim || '#e5534b', ay = ty + 12, p = new Path2D(); p.moveTo(-9, ty + 1); p.lineTo(9, ty + 1); p.lineTo(sw - 5, ay + 6); p.lineTo(sw - 3, ty + th + 22); p.lineTo(-sw + 3, ty + th + 22); p.lineTo(-sw + 5, ay + 6); p.closePath();
        part(g, p, ac, [-sw, ty, sw, ty + th + 22], { hi: .2, sh: .3, spec: .14, off: 8, blur: 7 }, 3, gg => { fold(gg, -8, ay + 14, -10, ay + 30, -12, ty + th + 14, 3, .1); fold(gg, 8, ay + 14, 10, ay + 30, 12, ty + th + 14, 3, .12); });
        g.beginPath(); g.moveTo(-9, ty + 1); g.lineTo(9, ty + 1); g.lineWidth = 3; g.strokeStyle = at; g.stroke(); part(g, pRR(-sw + 3, ty + th + 14, sw * 2 - 6, 8, 2), at, [-sw, ty + th + 14, sw, ty + th + 22], { hi: .2, sh: .3, spec: 0, rim: 0 }, 2.2);
        part(g, pRR(-9, ty + th - 14, 18, 15, 3), 'rgba(0,0,0,.05)', [-9, ty + th - 14, 9, ty + th + 1], { hi: .12, sh: .25, spec: 0, rim: 0, crescent: .25 }, 2.4); dot(g, 0, ty + th - 6, 2.2, at);
        line(g, -9, ty + 1, -17, ty - 5, 3, at); line(g, 9, ty + 1, 17, ty - 5, 3, at);
      }
      if (d.bag) { line(g, -sw + 3, ty + 2, sw - 3, ty + th - 10, 6.5, OL); line(g, -sw + 3, ty + 2, sw - 3, ty + th - 10, 3.6, d.bag); line(g, -sw + 3 + LX * 1, ty + 1, sw - 3 + LX * 1, ty + th - 11, 1.1, 'rgba(255,255,255,.35)'); part(g, pRR(sw - 14, ty + th - 22, 22, 18, 4), d.bag, [sw - 14, ty + th - 22, sw + 8, ty + th - 4], { hi: .22, sh: .34, rim: .2 }, 2.8); line(g, sw - 12, ty + th - 17, sw + 6, ty + th - 17, 2, 'rgba(0,0,0,.25)'); bead(g, sw - 3, ty + th - 17, 1.8, '#e8d9b8', 1); }
      if (d.neckPhones) {
        const pc = d.neckPhones; g.beginPath(); g.moveTo(-15, ty - 4); g.quadraticCurveTo(0, ty + 20, 15, ty - 4); g.lineWidth = 9; g.strokeStyle = OL; g.stroke(); g.lineWidth = 5; g.strokeStyle = pc; g.stroke(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-14, ty - 5); g.quadraticCurveTo(0, ty + 17, 14, ty - 5); g.stroke();
        [-1, 1].forEach(s2 => { if (d.bunny) { g.save(); g.translate(s2 * 17, ty + 4); g.rotate(s2 * .35); part(g, pEll(0, -15, 4.2, 10), pc, [-5, -26, 5, -4], { hi: .2, sh: .25, rim: 0, spec: 0 }, 2.4); G.ell(g, 0, -15, 1.8, 6, '#ff9ec0', 0); g.restore(); } part(g, pCirc(s2 * 15, ty + 12, 10), pc, [s2 * 15 - 10, ty + 2, s2 * 15 + 10, ty + 22], { hi: .25, sh: .35, spec: .3 }, 3); part(g, pCirc(s2 * 15, ty + 12, 5), dark(pc, .12), [s2 * 15 - 5, ty + 7, s2 * 15 + 5, ty + 17], { hi: .1, sh: .3, spec: 0, rim: 0 }, 1.6); if (d.bunny) G.ell(g, s2 * 15, ty + 12, 2.2, 3.2, '#6fd0ff', 0); });
      }
      /* neck (with chin shadow) */
      part(g, pRR(-7, ty - 8, 14, 12, 4), d.skin, [-7, ty - 8, 7, ty + 4], { hi: .12, sh: .34, tint: '120,40,30', rim: 0, spec: 0, crescent: .25, blur: 3, off: 3 }, 3, gg => { const cs = gg.createLinearGradient(0, ty - 8, 0, ty + 1); cs.addColorStop(0, 'rgba(110,40,25,.5)'); cs.addColorStop(1, 'rgba(110,40,25,0)'); gg.fillStyle = cs; gg.fillRect(-8, ty - 9, 16, 12); });
    });
  }

  function bakeShoe(d, pal, id, lvl) {
    return mkSpr(-17, -11, 17, 11, lvl, g => {
      const P = pEll(0, 0, 12, 6.5); part(g, P, pal.shoe, [-12, -6.5, 12, 6.5], { hi: .3, sh: .38, spec: .3, sx: .25, sy: .25, crescent: .3, off: 3, blur: 3, rimW: 1.6, rimD: 1.4 }, 3.2);
      g.save(); g.clip(P); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-14, 3, 28, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-14, 3.4, 28, 1.2); g.restore();
      if (id === 'aboody') G.ell(g, 1, 2, 9, 2.2, '#d9d1bd', 0);
    });
  }
  function bakeHand(d, pal, lvl) {
    const r = d.wf * .62; return mkSpr(-r - 4, -r - 4, r + 4, r + 4, lvl, g => part(g, pCirc(0, 0, r), d.skin, [-r, -r, r, r], { hi: .26, sh: .4, tint: '120,40,30', spec: .3, crescent: .3, off: r * .3, blur: r * .4, rim: .35, rimW: 1.6, rimD: 1.2 }, 3));
  }

  function bakeSkin(d, pal, lvl) {
    const R = d.R, rx = R * d.hr, scarfy = d.hair === 'scarf', hx = rx + R * .22 + 6, E = d.eye, ex = rx * .42, ey = R * .2, er = R * .2 * E;
    return mkSpr(-hx, -R - 6, hx, R + 6, lvl, g => {
      const OVS = { hi: .24, sh: .36, tint: '120,40,30', spec: .22, sx: .2, sy: .3, sr: .55, off: R * .2, blur: R * .35, crescent: .36, cres: '150,45,35', rimC: '255,200,160', rim: .34, rimW: 3 };
      if (!scarfy) [-1, 1].forEach(s => {
        const P = pCirc(s * (rx - 1), R * .12, R * .2); part(g, P, d.skin, [s * (rx - 1) - R * .2, R * -.08, s * (rx - 1) + R * .2, R * .32], { hi: .2, sh: .4, tint: '120,40,30', spec: .15, off: 2.5, blur: 3, rim: .3, rimW: 1.6 }, 3);
        g.fillStyle = rgba(pal.skinS, .75); g.beginPath(); g.ellipse(s * (rx - 1), R * .12, R * .09, R * .11, 0, 0, TAU); g.fill();
      });
      const P = pEll(0, 0, rx * (scarfy ? .93 : 1), R * (scarfy ? .97 : 1)), bb = [-rx, -R, rx, R];
      g.fillStyle = d.skin; g.fill(P);
      g.save(); g.clip(P);
      const cs = g.createRadialGradient(0, -R * 1.0, R * .1, 0, -R * 1.0, R * 1.05); cs.addColorStop(0, 'rgba(60,20,10,.4)'); cs.addColorStop(1, 'rgba(60,20,10,0)'); g.fillStyle = cs; g.fillRect(-hx, -R - 6, hx * 2, R * 2 + 12);   // contact shadow from the hair
      [-1, 1].forEach(s => { const rg = g.createRadialGradient(s * ex, ey - er * .1, 0, s * ex, ey - er * .1, er * 2.2); rg.addColorStop(0, 'rgba(130,60,40,.13)'); rg.addColorStop(1, 'rgba(130,60,40,0)'); g.fillStyle = rg; g.fillRect(s * ex - er * 2.4, ey - er * 2.4, er * 4.8, er * 4.8); const cb = g.createRadialGradient(s * rx * .58, R * .52, 0, s * rx * .58, R * .52, R * .26); cb.addColorStop(0, 'rgba(240,100,95,.30)'); cb.addColorStop(1, 'rgba(240,100,95,0)'); g.fillStyle = cb; g.fillRect(s * rx * .58 - R * .3, R * .22, R * .6, R * .6); });
      const jw = g.createRadialGradient(0, R * .55, R * .05, 0, R * .55, R * .6); jw.addColorStop(0, 'rgba(255,255,255,.08)'); jw.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = jw; g.fillRect(-R, R * .1, R * 2, R * .9);
      g.restore();
      overlay(g, P, bb, OVS);
      g.lineWidth = 3.5; g.strokeStyle = OL; g.stroke(P);
    });
  }

  /* hair behind the head: array of swingable parts {s: sprite, px, py (pivot in head coords), k (spring gain)} */
  function bakeBacks(d, pal, lvl) {
    const R = d.R, rx = R * d.hr, hc = pal.hair, out = [], scarfy = d.hair === 'scarf';
    const hairPart = (P, bb) => part(P.g, P.p, hc, bb, { hi: .26, sh: .4, tint: '0,0,0', warm: '255,225,190', spec: .26, rim: .2, rimC: '190,215,255', off: 5, blur: 5 }, 3.5);
    if (d.hair === 'ponytail') {
      const px = rx * .9, py = -R * .25;
      out.push({ px, py, k: 1.3, s: mkSpr(-R * 1.2, -R * .4, R * 1.4, R * 1.8, lvl, g => { g.save(); g.rotate(-.55); const P = pEll(8, R * .62, R * .3, R * .78); part(g, P, hc, [8 - R * .3, R * -.16, 8 + R * .3, R * 1.4], { hi: .26, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .26, rim: .18, rimC: '190,215,255', off: 4, blur: 5 }, 3.5); [-.1, .1, .2].forEach(o => { g.beginPath(); g.moveTo(8 + o * R, R * .0); g.quadraticCurveTo(8 + o * R * 1.6, R * .6, 8 + o * R * .6, R * 1.3); g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,230,200,.18)'; g.stroke(); }); g.restore(); }) });
    } else if (d.hair === 'pigtails') {
      [-1, 1].forEach(s => { const px = s * (rx + 3), py = -R * .02; out.push({ px, py, k: 1.5, s: mkSpr(-R * .6, -R * .3, R * .6, R * 1.4, lvl, g => { g.save(); g.rotate(s * .3); const P = pEll(0, R * .58, R * .27, R * .62); part(g, P, hc, [-R * .27, -R * .04, R * .27, R * 1.2], { hi: .26, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .26, rim: .18, rimC: '190,215,255', off: 3, blur: 4 }, 3.5); [-.07, .07].forEach(o => { g.beginPath(); g.moveTo(o * R, R * .1); g.quadraticCurveTo(o * R * 1.5, R * .6, o * R * .6, R * 1.1); g.lineWidth = 1.3; g.strokeStyle = 'rgba(255,230,200,.18)'; g.stroke(); }); g.restore(); }) }); });
    } else if (d.hair === 'bob') {
      [-1, 1].forEach(s => { const px = s * rx * .85, py = -R * .05; out.push({ px, py, k: .8, s: mkSpr(-R * .6, -R * .2, R * .6, R * 1.2, lvl, g => { const P = pEll(s * rx * .07, R * .43, R * .3, R * .62); part(g, P, hc, [s * rx * .07 - R * .3, R * -.19, s * rx * .07 + R * .3, R * 1.05], { hi: .24, sh: .4, tint: '0,0,0', warm: '255,225,190', spec: .22, rim: .18, rimC: '190,215,255', off: 3, blur: 4 }, 3.5); }) }); });
    } else if (scarfy) {
      const dr = d.top === 'blouse' ? 1.22 : 1.1, sc = d.scarf;
      out.push({ px: 0, py: R * .6, k: .6, shear: true, s: mkSpr(-rx * 1.4, -R * 1.3, rx * 1.4, R * 1.7, lvl, g => {
        const P2 = pEll(0, R * 1.02, rx * dr, R * (dr > 1.2 ? .66 : .55)); part(g, P2, G.shade(sc, -.1), [-rx * dr, R * .4, rx * dr, R * 1.6], { hi: .2, sh: .4, spec: .12, off: 6, blur: 6 }, 3.5, gg => { fold(gg, -rx * .5, R * .72, -rx * .6, R * 1.0, -rx * .8, R * 1.5, 3.2, .16); fold(gg, rx * .5, R * .72, rx * .6, R * 1.0, rx * .8, R * 1.5, 3.2, .18); fold(gg, 0, R * .9, 0, R * 1.2, 0, R * 1.58, 3, .12); });
        const P1 = pEll(0, -R * .04, rx * 1.2, R * 1.17); part(g, P1, sc, [-rx * 1.2, -R * 1.2, rx * 1.2, R * 1.1], { hi: .24, sh: .36, spec: .2, off: 9, blur: 9 }, 3.5, gg => { fold(gg, -rx * 1.0, -R * .5, -rx * 1.15, R * .1, -rx * 1.05, R * .8, 3.4, .14); fold(gg, rx * 1.0, -R * .5, rx * 1.15, R * .1, rx * 1.05, R * .8, 3.4, .18); });
      }) });
    } else if (d.hair === 'short' && d.quiff) {
      out.push({ px: 0, py: -R * .7, k: .5, s: mkSpr(-rx * 1.2, -R * 1.8, rx * 1.2, -R * .4, lvl, g => { const p = new Path2D(); p.moveTo(-rx * .7, -R * .75); p.bezierCurveTo(-rx * .6, -R * 1.45, rx * .6, -R * 1.6, rx * 1.0, -R * .7); p.closePath(); part(g, p, hc, [-rx * .7, -R * 1.5, rx, -R * .7], { hi: .28, sh: .36, tint: '0,0,0', warm: '255,225,190', spec: .3, sy: .3, rim: .2, rimC: '190,215,255' }, 3.5); }) });
    }
    return out;
  }

  function hairCapShade(g, P, bb, hc, R, rx) {
    part(g, P, hc, bb, { hi: .26, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .3, sx: .15, sy: .25, rim: .22, rimC: '190,215,255', off: R * .14, blur: R * .2 }, 3.5);
  }
  function bakeHairFront(d, pal, hatId, lvl, shirtC) {
    const R = d.R, rx = R * d.hr, hc = pal.hair, scarfy = d.hair === 'scarf', cr = R * (d.curl || .3), hat = hatId && C.hats[hatId];
    const hx = d.sunhat ? rx * 2.15 + 8 : Math.max(rx * (d.hair === 'curly' ? 1.02 : 1.26) + (d.hair === 'curly' ? cr * 1.3 : 6), hat ? rx * 1.7 : 0) + 8;
    const y0 = hat || d.sunhat ? -R * 2.45 - 8 : -(R * 1.05 + cr * 1.3 + 8), y1 = R * .8;
    return mkSpr(-hx, Math.min(y0, -R * 1.5), hx, y1, lvl, g => {
      if (d.hair === 'curly') {
        const circles = [];
        for (let i = 0; i <= 11; i++) { const a = (200 + i * 14.5) * R2D; circles.push([Math.cos(a) * rx * 1.02, Math.sin(a) * R * .98, cr]); }
        for (let i = 0; i < 6; i++) circles.push([(-.68 + i * .272) * rx, -R * .5 + (i % 2) * R * .04, R * .19]);
        circles.push([-rx * 1.02, -R * .12, R * .2], [rx * 1.02, -R * .12, R * .2], [-rx * .88, -R * .62, cr * .9], [rx * .88, -R * .62, cr * .9], [0, -R * 1.05, cr * 1.05], [-rx * .45, -R * 1.0, cr], [rx * .45, -R * 1.0, cr]);
        g.beginPath(); circles.forEach(c => { g.moveTo(c[0] + c[2], c[1]); g.arc(c[0], c[1], c[2], 0, TAU); });
        g.lineWidth = 6.5; g.strokeStyle = OL; g.stroke(); g.fillStyle = hc; g.fill();
        g.fillStyle = hc; g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .4, 0, 0, TAU); g.fill();
        const hl = mixc(hc, '#d9aa80', .3), hm = mixc(hc, '#d9aa80', .12);
        circles.forEach((c, i) => {   // layered clumps: each curl a little ball with its own form light, drawn back to front
          const rr = Math.max(1, c[2] - 2.4), rg = g.createRadialGradient(c[0] + LX * rr * .38, c[1] - rr * .45, rr * .05, c[0], c[1], rr * 1.05);
          rg.addColorStop(0, hl); rg.addColorStop(.35, hm); rg.addColorStop(.7, hc); rg.addColorStop(1, mixc(hc, '#000', .45));
          g.fillStyle = rg; g.beginPath(); g.arc(c[0], c[1], rr, 0, TAU); g.fill();
          g.beginPath(); g.arc(c[0], c[1], rr * .92, LX < 0 ? .2 : Math.PI * .1 + 1.6, LX < 0 ? 1.7 : 2.9); g.lineWidth = 1.5; g.strokeStyle = 'rgba(8,3,0,.4)'; g.stroke();   // curl crease on the shadow side
        });
        g.lineCap = 'round';
        circles.forEach((c, i) => { if (i % 2 === 0 && c[1] < -R * .3) { g.beginPath(); g.arc(c[0] - c[2] * .1, c[1] + c[2] * .05, c[2] * .55, Math.PI * 1.05, Math.PI * 1.65); g.lineWidth = 2.4; g.strokeStyle = 'rgba(255,226,190,.07)'; g.stroke(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,236,210,.26)'; g.stroke(); } });
        g.beginPath(); g.ellipse(0, -R * .35, rx * .9, R * .9, 0, Math.PI * 1.18, Math.PI * 1.5); [7, 4, 1.8].forEach((w, k) => { g.lineWidth = w; g.strokeStyle = 'rgba(255,238,215,' + [.06, .1, .24][k] + ')'; g.stroke(); });   // glossy sheen band
        g.save(); g.beginPath(); g.moveTo(-rx * 1.1, -R * .1); g.bezierCurveTo(-rx * .6, -R * .6, rx * .6, -R * .6, rx * 1.1, -R * .1); g.lineTo(rx * 1.1, R * .4); g.lineTo(-rx * 1.1, R * .4); g.closePath(); g.restore();
      } else if (scarfy) {
        const sc = d.scarf, uc = d.under, a = d.under ? .46 : .3, b = d.under ? .66 : .5;
        if (uc) { const p = new Path2D(); p.moveTo(-rx * .95, R * .2); p.bezierCurveTo(-rx * 1.05, -R * 1.1, rx * 1.05, -R * 1.1, rx * .95, R * .2); p.quadraticCurveTo(rx * .8, -R * .1, rx * .45, -R * .2); p.quadraticCurveTo(0, -R * .3, -rx * .45, -R * .2); p.quadraticCurveTo(-rx * .8, -R * .1, -rx * .95, R * .2); p.closePath(); part(g, p, uc, [-rx, -R * 1.1, rx, R * .2], { hi: .22, sh: .4, spec: .22, off: 7, blur: 7 }, 3); }
        const p = new Path2D(); p.moveTo(-rx * 1.0, R * .3); p.bezierCurveTo(-rx * 1.2, -R * 1.3, rx * 1.2, -R * 1.3, rx * 1.0, R * .3); p.quadraticCurveTo(rx * .95, -R * .02, rx * .55, -R * a); p.quadraticCurveTo(0, -R * b, -rx * .55, -R * a); p.quadraticCurveTo(-rx * .95, -R * .02, -rx * 1.0, R * .3); p.closePath();
        part(g, p, sc, [-rx * 1.1, -R * 1.2, rx * 1.1, R * .3], { hi: .26, sh: .38, spec: .26, sy: .2, off: 8, blur: 8, rim: .26 }, 3.5, gg => {
          if (!uc) { gg.fillStyle = 'rgba(255,111,145,.55)'; for (let i = 0; i < 9; i++) { gg.beginPath(); gg.arc(-rx * .8 + (i * 19) % (rx * 1.6), -R * .9 + (i * 13) % (R * .55), 2.4, 0, 6.3); gg.fill(); } }
          fold(gg, -rx * .2, -R * 1.05, -rx * .75, -R * .8, -rx * .98, -R * .1, 3.4, .13); fold(gg, rx * .15, -R * 1.05, rx * .7, -R * .8, rx * .98, -R * .1, 3.4, .16); fold(gg, 0, -R * 1.1, -rx * .3, -R * .75, -rx * .5, -R * .45, 2.4, .1);
        });
        g.beginPath(); g.moveTo(-rx * .55, -R * a); g.quadraticCurveTo(0, -R * b, rx * .55, -R * a); g.lineWidth = 3.4; g.strokeStyle = 'rgba(40,10,30,.18)'; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(40,10,30,.3)'; g.stroke();
      } else {
        const hl = d.hair === 'short' ? .5 : .42, p = new Path2D();
        p.moveTo(-rx * 1.04, R * .22); p.bezierCurveTo(-rx * 1.18, -R * 1.25, rx * 1.18, -R * 1.25, rx * 1.04, R * .22); p.quadraticCurveTo(rx * .86, -R * .06, rx * .4, -R * (hl - .06)); p.quadraticCurveTo(-rx * .05, -R * (hl + .12), -rx * .42, -R * (hl - .1)); p.quadraticCurveTo(-rx * .86, -R * .06, -rx * 1.04, R * .22); p.closePath();
        part(g, p, hc, [-rx * 1.1, -R * 1.2, rx * 1.1, R * .3], { hi: .28, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .32, sx: .15, sy: .22, rim: .24, rimC: '190,215,255', off: R * .14, blur: R * .2 }, 3.5, gg => {
          gg.lineCap = 'round'; for (let k = -3; k <= 3; k++) { gg.beginPath(); gg.moveTo(k * rx * .1, -R * 1.1); gg.quadraticCurveTo(k * rx * .3, -R * .8, k * rx * .55 + (k > 0 ? 6 : -6), -R * .3); gg.lineWidth = 1.6; gg.strokeStyle = k % 2 ? 'rgba(0,0,0,.2)' : 'rgba(255,230,200,.16)'; gg.stroke(); }
          gg.beginPath(); gg.arc(-rx * .15, -R * .55, R * .6, Math.PI * 1.15, Math.PI * 1.6); [8, 4.5, 2].forEach((w, k) => { gg.lineWidth = w; gg.strokeStyle = 'rgba(255,240,220,' + [.07, .13, .3][k] + ')'; gg.stroke(); });
        });
        if (d.hair === 'ponytail') bead(g, rx * .92, -R * .18, R * .13, d.tie || '#ff6f91', 2.5);
        if (d.hair === 'pigtails') [-1, 1].forEach(s => { bead(g, s * (rx + 1), R * .05, R * .12, d.tie || '#fff', 2.5); if (d.bow) { g.save(); g.translate(s * (rx + 2), R * .02); const bw = R * .42; [[[0, 0], [s * bw, -R * .28], [s * bw, R * .28]], [[0, 0], [-s * R * .06, -R * .26], [-s * R * .06, R * .26]]].forEach((pts, qi) => part(g, pPoly(pts), d.bow, [Math.min(0, s * bw), -R * .3, Math.max(0, s * bw), R * .3], { hi: .26, sh: .34, spec: .2, rim: 0, crescent: .2 }, 2.6)); bead(g, 0, 0, R * .1, G.shade(d.bow, -.2), 2); g.restore(); } });
        if (d.part) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-rx * .3, -R * .98); g.quadraticCurveTo(-rx * .38, -R * .72, -rx * .5, -R * .46); g.stroke(); }
        if (d.fringe) { const f = new Path2D(); f.moveTo(-rx * .86, -R * .06); f.lineTo(-rx * .86, -R * .3); f.quadraticCurveTo(0, -R * .52, rx * .86, -R * .3); f.lineTo(rx * .86, -R * .06); f.quadraticCurveTo(rx * .45, -R * .36, 0, -R * .3); f.quadraticCurveTo(-rx * .45, -R * .36, -rx * .86, -R * .06); f.closePath(); part(g, f, hc, [-rx * .86, -R * .5, rx * .86, -R * .06], { hi: .2, sh: .4, tint: '0,0,0', warm: '255,225,190', spec: .2, rim: 0 }, 3); }
      }
      if (d.sunhat) {
        const hcol = d.sunhat;
        part(g, pEll(0, -R * .98, rx * .98, R * .66), lite(hcol, .12), [-rx, -R * 1.64, rx, -R * .32], { hi: .3, sh: .36, spec: .35, sy: .25, off: 8, blur: 8, rimC: '255,235,235' }, 3.5);
        part(g, pEll(0, -R * .6, rx * 2.05, R * .4), hcol, [-rx * 2.05, -R, rx * 2.05, -R * .2], { hi: .26, sh: .4, spec: .22, sy: .35, off: 7, blur: 9 }, 3.5, gg => { gg.strokeStyle = 'rgba(190,110,130,.35)'; gg.lineWidth = 1.6; for (let i = -9; i <= 9; i++) { gg.beginPath(); gg.moveTo(i * rx * .21, -R * .98); gg.lineTo(i * rx * .24, -R * .2); gg.stroke(); } });
        g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .18, 0, 0, Math.PI); g.lineWidth = 7; g.strokeStyle = '#ff8fb1'; g.stroke(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(0, -R * .74, rx * .98, R * .18, 0, .1, Math.PI - .1); g.stroke();
        [-1, 1].forEach(s => { const bx = s * rx * .98, by = -R * .93; g.save(); g.translate(bx, by); g.rotate(s * -.25); [[[0, 0], [s * 11, -7], [s * 11, 7]], [[0, 0], [-s * 10, -6], [-s * 10, 6]]].forEach(pts => part(g, pPoly(pts), '#ff6f9d', [-11, -7, 11, 7], { hi: .26, sh: .34, spec: 0, rim: 0, crescent: .2 }, 2.4)); bead(g, 0, 0, 3.4, '#ff4a86', 2); g.restore(); });
      }
      if (hat) { g.save(); try { hat.draw(g, R); } catch (e) { } g.restore(); }
    });
  }

  function bakeChin(d, pal, lvl) {   // beard (behind the mouth)
    const R = d.R, rx = R * d.hr; if (!d.beard) return null;
    return mkSpr(-rx - 8, R * .05, rx + 8, R * 1.3, lvl, g => {
      const p = new Path2D(); p.moveTo(-rx * .98, R * .16); p.bezierCurveTo(-rx * 1.02, R * .72, -rx * .6, R * 1.2, 0, R * 1.2); p.bezierCurveTo(rx * .6, R * 1.2, rx * 1.02, R * .72, rx * .98, R * .16);
      p.quadraticCurveTo(rx * .82, R * .38, rx * .5, R * .46); p.quadraticCurveTo(0, R * .38, -rx * .5, R * .46); p.quadraticCurveTo(-rx * .82, R * .38, -rx * .98, R * .16); p.closePath();
      part(g, p, d.beard, [-rx, R * .15, rx, R * 1.2], { hi: .3, sh: .22, tint: '0,0,0', warm: '255,225,190', spec: .16, sy: .5, rim: .12, crescent: .2, rimC: '190,215,255', off: R * .12, blur: R * .16 }, 3.5, gg => { gg.lineCap = 'round'; for (let k = -5; k <= 5; k++) { gg.beginPath(); gg.moveTo(k * rx * .15, R * .5); gg.quadraticCurveTo(k * rx * .18, R * .85, k * rx * .12, R * 1.15); gg.lineWidth = 1.3; gg.strokeStyle = k % 2 ? 'rgba(255,230,200,.1)' : 'rgba(0,0,0,.12)'; gg.stroke(); } });
    });
  }
  function bakeFront(d, pal, lvl) {   // moustache, stubble, wrinkles, glasses: drawn after the mouth
    const R = d.R, rx = R * d.hr, E = d.eye, ex = rx * .42, ey = R * .2, hx = rx + 8;
    if (!(d.beard || d.stubble || d.wrinkles || d.glasses)) return null;
    return mkSpr(-hx, -R * .6, hx, R * 1.0, lvl, g => {
      if (d.stubble) { g.fillStyle = 'rgba(35,25,20,.26)'; for (let i = 0; i < 34; i++) { const a = .35 + (i * 0.137) % 2.45, rr = .72 + ((i * 7) % 10) / 40; const px = Math.cos(a) * rx * rr, py = Math.sin(a) * R * rr * .98; if (py > R * .42 && Math.abs(px) > R * .08 || py > R * .72) { g.beginPath(); g.arc(px, py, .95, 0, 6.3); g.fill(); } } }
      if (d.wrinkles) { g.lineWidth = 1.6; g.strokeStyle = 'rgba(120,70,40,.4)'; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * ex * 1.5, ey + R * .22); g.quadraticCurveTo(s * ex * 1.75, ey + R * .3, s * ex * 1.45, ey + R * .4); g.stroke(); }); }
      if (d.beard) { const p = new Path2D(); p.moveTo(-rx * .55, R * .6); p.quadraticCurveTo(-rx * .25, R * .4, 0, R * .5); p.quadraticCurveTo(rx * .25, R * .4, rx * .55, R * .6); p.quadraticCurveTo(rx * .25, R * .56, 0, R * .53); p.quadraticCurveTo(-rx * .25, R * .56, -rx * .55, R * .6); p.closePath(); part(g, p, d.beard, [-rx * .55, R * .4, rx * .55, R * .6], { hi: .3, sh: .3, tint: '0,0,0', warm: '255,225,190', spec: .3, rim: 0, crescent: .2 }, 2.6); }
      if (d.glasses) {
        const gr = R * .2 * E * 1.55, gc = d.glasses;
        [-1, 1].forEach(s => {
          const P = pCirc(s * ex, ey, gr);
          g.beginPath(); g.arc(s * ex + 1, ey + 1.6, gr, 0, TAU); g.lineWidth = 2.8; g.strokeStyle = 'rgba(60,20,10,.16)'; g.stroke();   // frame shadow on the skin
          const lg = g.createRadialGradient(s * ex - gr * .3, ey - gr * .35, 0, s * ex, ey, gr); lg.addColorStop(0, 'rgba(235,248,255,.26)'); lg.addColorStop(1, 'rgba(160,200,235,.06)'); g.fillStyle = lg; g.fill(P);
          g.save(); g.clip(P); g.lineCap = 'round';
          g.beginPath(); g.moveTo(s * ex - gr * .62, ey + gr * .08); g.lineTo(s * ex - gr * .08, ey - gr * .62); g.lineWidth = gr * .22; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
          g.beginPath(); g.moveTo(s * ex - gr * .2, ey + gr * .45); g.lineTo(s * ex + gr * .4, ey - gr * .35); g.lineWidth = gr * .1; g.strokeStyle = 'rgba(255,255,255,.32)'; g.stroke();
          g.restore();
          g.lineWidth = 2.7; g.strokeStyle = gc; g.stroke(P); g.beginPath(); g.arc(s * ex, ey, gr, Math.PI * (s < 0 ? 1.0 : 1.05), Math.PI * (s < 0 ? 1.55 : 1.6)); g.lineWidth = 1.1; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
          g.beginPath(); g.arc(s * ex, ey, gr + 1.4, .2, Math.PI * .8); g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,.22)'; g.stroke();
        });
        g.beginPath(); g.moveTo(-ex + gr, ey - 1); g.quadraticCurveTo(0, ey - 6, ex - gr, ey - 1); g.lineWidth = 2.6; g.strokeStyle = gc; g.stroke();
      }
    });
  }

  /* sprite set for one look at one pixel density / light side */
  function getSet(id, d, shirtC, hatId, lvl, flip) {
    const key = id + '|' + shirtC + '|' + (hatId || '') + '|' + lvl + '|' + (flip ? 1 : 0); let S = SPRS[key]; if (S) return S;
    LX = flip ? 1 : -1; const pal = palette(id, d, shirtC);
    S = { key, pal };
    S.body = bakeBody(id, d, pal, shirtC, lvl); S.skin = bakeSkin(d, pal, lvl); S.backs = bakeBacks(d, pal, lvl); S.front = bakeFront(d, pal, lvl); S.chin = bakeChin(d, pal, lvl);
    S.hair = bakeHairFront(d, pal, hatId, lvl, shirtC); S.shoe = bakeShoe(d, pal, id, lvl); S.hand = bakeHand(d, pal, lvl);
    SPRS[key] = S; SPRN++; if (SPRN > 90) { /* keep memory bounded: drop an old set (not the one in use) */ const ks = Object.keys(SPRS); for (let i = 0; i < ks.length && SPRN > 70; i++) if (ks[i] !== key) { delete SPRS[ks[i]]; SPRN--; } }
    return S;
  }
  let SPRN = 0;

  /* ================= ANIMATION STATE ================= */
  const PK = ['bob', 'rot', 'sy', 'dip', 'dx', 'llx', 'lly', 'rlx', 'rly', 'la1', 'la2', 'ra1', 'ra2', 'head', 'pitch', 'sh', 'lean', 'pt', 'th', 'jy'];
  const PR = [20, 14, 26, 12, 3.2, 14, 14, 14, 14, 13, 13, 13, 13, 9, 9, 9, 7, 14, 14, 30];     // smoothing rates (1/s): ~60-250 ms blends
  const EK = ['lid', 'hap', 'sq', 'bY', 'bT', 'bA', 'mO', 'mW', 'mS', 'bl', 'pup'];
  const ER = [20, 12, 22, 14, 14, 10, 26, 16, 14, 5, 12];
  const EMO = {
    neutral: { lid: 1, hap: 0, sq: 0, bY: 0, bT: 0, bA: 0, mO: 0, mW: 1, mS: .75, bl: 0, pup: 1, head: 0, pitch: 0, sh: 0, gy: 0 },
    happy: { lid: 1, hap: .5, sq: 0, bY: .35, bT: 0, bA: 0, mO: .32, mW: 1.12, mS: 1, bl: .35, pup: 1.04, head: .03, pitch: -.04, sh: .5, gy: 0 },
    excited: { lid: 1.1, hap: .3, sq: 0, bY: .95, bT: 0, bA: 0, mO: .68, mW: 1.22, mS: 1, bl: .5, pup: 1.1, head: -.02, pitch: -.08, sh: 1.2, gy: 0 },
    sad: { lid: .74, hap: 0, sq: 0, bY: -.1, bT: 1.05, bA: 0, mO: 0, mW: .85, mS: -.85, bl: 0, pup: 1.06, head: .05, pitch: .5, sh: -3, gy: .8 },
    worried: { lid: 1.08, hap: 0, sq: 0, bY: .5, bT: .95, bA: 0, mO: .08, mW: .8, mS: -.4, bl: 0, pup: .9, head: .05, pitch: .12, sh: .8, gy: .15 },
    surprised: { lid: 1.26, hap: 0, sq: 0, bY: 1.25, bT: .1, bA: 0, mO: .58, mW: .52, mS: 0, bl: 0, pup: .78, head: 0, pitch: -.18, sh: 1.6, gy: 0 },
    thinking: { lid: .94, hap: 0, sq: 0, bY: .15, bT: -.1, bA: .9, mO: 0, mW: .62, mS: .05, bl: 0, pup: 1, head: -.08, pitch: -.08, sh: 0, gy: -.7 },
    proud: { lid: .9, hap: .32, sq: 0, bY: .55, bT: 0, bA: 0, mO: .1, mW: 1.02, mS: .95, bl: .2, pup: 1, head: -.02, pitch: -.34, sh: 1.6, gy: 0 },
    shy: { lid: .9, hap: 0, sq: 0, bY: .1, bT: .55, bA: 0, mO: .04, mW: .8, mS: .5, bl: 1, pup: 1.05, head: .1, pitch: .26, sh: 1.2, gy: .75 },
    angry: { lid: .8, hap: 0, sq: 0, bY: -.55, bT: -1.1, bA: 0, mO: .02, mW: .95, mS: -.5, bl: 0, pup: .94, head: 0, pitch: .16, sh: .6, gy: 0 }
  };
  C.emotions = Object.keys(EMO);
  const ANIM_EMO = { run: 'happy', jump: 'excited', cheer: 'excited', wave: 'happy', oops: 'surprised', think: 'thinking', lift: 'excited', point: 'happy', thumbs: 'proud', hug: 'happy', jumpcheer: 'excited', sad: 'sad', giggle: 'happy', cry: 'sad', scream: 'angry', shrug: 'neutral' };
  const IDLEISH = { idle: 1, walk: 1, run: 1, talk: 1, phone: 1 };

  const STS = {}, TMP = {}, EMO_OV = {};   // per-key animation states, scratch states for same-frame duplicates, per-id emotion overrides
  let FRAME = 0, REDUCED = false;
  try { const mq = window.matchMedia('(prefers-reduced-motion: reduce)'); REDUCED = !!mq.matches; if (mq.addEventListener) mq.addEventListener('change', e => { REDUCED = !!e.matches; }); } catch (e) { }
  C.setReduced = v => { REDUCED = !!v; }; C.isReduced = () => REDUCED;
  const fresh = (keys, v) => { const o = {}; keys.forEach(k => { o[k] = v; }); return o; };
  function newState(id, key) {
    const d = DEFS[id], st = { id, key, seed: Math.random() * 100, tPrev: 0, lastFrame: -9, vis: 0, x: 0, y: 0, px: 0, py: 0, hasPos: false, vx: 0, sc: 1, anim: 'idle', at: 0, ph: Math.random() * 20, wp: 0, wk: 0, ws: 0, wsS: 0, wsT: 2 + Math.random() * 3,
      p: fresh(PK, 0), tg: fresh(PK, 0), e: fresh(EK, 0), et: fresh(EK, 0), fl: { sweat: false, tears: false, zzz: false, dots: false, scream: false, closed: false, wink: false, gy: 0, gx: 0, big: false, mood: 0 },
      sp: { hair: 0, hairV: 0, tail: 0, tailV: 0, cloth: 0, clothV: 0, nod: 0, nodV: 0, hy: 0, hyV: 0 }, bk: 0, bkT: -1, nextBlink: 1 + Math.random() * 3, dblk: 0,
      gx: 0, gy: 0, yaw: 0, yawBias: 0, gtx: 0, gty: 0, wanderT: 0, saccX: 0, saccY: 0, saccT: 1, dirS: 1, spin: -1, react: null, hop: 0, tk: 0, lvl: 0, lvlPrev: 0, beat: 0, gest: -1, gestT: 0, gestDur: 1, gestNext: 1.5, browT: 1, browV: 0, ovAnim: null, ovUntil: 0, hearts: 0, gaze: null, lookUntil: 0, lookX: 0, lookY: 0 };
    Object.assign(st.e, EMO.neutral); Object.assign(st.et, EMO.neutral); st.p.sy = 1; st.p.la1 = st.p.ra1 = d.a1; st.p.la2 = st.p.ra2 = 6; st.tg.sy = 1; st.tg.la1 = st.tg.ra1 = d.a1; st.tg.la2 = st.tg.ra2 = 6;
    return st;
  }
  const stateFor = (id, key) => STS[key] || (STS[key] = newState(id, key));

  /* ---- voice level / speaking (driven by engine/voice.js; fallbacks inside) ---- */
  const MANUAL_TALK = {};
  C.speaking = id => { const V = M.voice; return !!(V && V.speaker === id && V.isSpeaking && V.isSpeaking()) || (MANUAL_TALK[id] || 0) > now(); };
  C.level = id => { const V = M.voice; return (V && V.speaker === id && V.getLevel) ? V.getLevel() : 0; };
  C.talkFor = (id, sec) => { MANUAL_TALK[id] = now() + (sec || 1.5); };   // make a character move its mouth without a voice clip

  /* ---- emotion API ---- */
  C.emote = function (id, emo, o) { o = o || {}; if (!emo || emo === 'none') { delete EMO_OV[id]; return; } if (!EMO[emo]) emo = 'neutral'; EMO_OV[id] = { name: emo, until: o.dur ? now() + o.dur : 0 }; };
  C.currentEmotion = id => { const e = EMO_OV[id]; return e && (!e.until || e.until > now()) ? e.name : null; };
  const RX_EXC = /برافو|ممتاز|شاطر|أحسنت|مبروك|هيييه|يلا|عظيم|حلو أوي|تحفة/, RX_SAD = /للأسف|زعلان|حزين|وحشتني|تعبان|مش عارف|آسف|معلش/, RX_WORRY = /خايف|حاسب|انتبه|ألحق|الحقوا|بسرعة|مشكلة|ضاع|اتأخرنا/;
  C.inferEmotion = function (text) {
    const t = String(text || ''); if (RX_SAD.test(t)) return 'sad'; if (RX_WORRY.test(t)) return 'worried'; if (RX_EXC.test(t) || /!{2,}/.test(t)) return 'excited';
    if (/!/.test(t)) return 'happy'; if (/[?؟]/.test(t)) return 'thinking'; return null;
  };
  /* ctx.say hook: C.line(who, text, {emote, anim, auto}) -> release() ; sets the emotion while the line is on screen */
  C.line = function (who, text, o) {
    o = o || {}; const emo = o.emote || (o.auto === false ? null : C.inferEmotion(text)); if (emo) C.emote(who, emo); return () => { if (emo && EMO_OV[who] && EMO_OV[who].name === emo) delete EMO_OV[who]; };
  };

  /* ---- gaze targets (pointer / tap / speaker) ---- */
  C.ptr = { x: 480, y: 270, t: -99 }; C.focus = { x: 0, y: 0, until: 0, id: null };
  try {
    const cv = M.cv, upd = e => { const r = cv.getBoundingClientRect(); if (!r.width) return; C.ptr.x = (e.clientX - r.left) * M.W / r.width; C.ptr.y = (e.clientY - r.top) * M.H / r.height; C.ptr.t = now(); };
    window.addEventListener('pointermove', upd, { passive: true }); window.addEventListener('pointerdown', upd, { passive: true, capture: true });
  } catch (e) { }
  C.look = function (id, x, y, dur) { const st = STS[id]; if (!st) return; st.lookX = x; st.lookY = y; st.lookUntil = now() + (dur || 2); };

  /* ================= POSES ================= */
  const sin = Math.sin, cos = Math.cos, ab = Math.abs, clamp = (v, a, b) => v < a ? a : v > b ? b : v, sstep = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  function setPose(st, d, anim, tk) {
    const tg = st.tg, F = st.fl, t = st.ph, at = st.at, sd = st.seed;
    tg.bob = 0; tg.rot = 0; tg.sy = 1; tg.dip = 0; tg.dx = 0; tg.llx = 0; tg.lly = 0; tg.rlx = 0; tg.rly = 0; tg.la1 = d.a1; tg.la2 = 6; tg.ra1 = d.a1; tg.ra2 = 6; tg.head = 0; tg.pitch = 0; tg.sh = 0; tg.lean = 0; tg.pt = 0; tg.th = 0; tg.jy = 0;
    F.sweat = F.tears = F.zzz = F.dots = F.scream = F.closed = F.wink = F.big = false; F.gy = 0; F.gx = 0; F.mood = 0; st.emoA = ANIM_EMO[anim] || null; st.mouthX = null; st.eyeSq = 0; st.holdGaze = false;
    const rd = REDUCED ? .5 : 1;
    switch (anim) {
      case 'walk': case 'run': break;   // walk overlay handles the legs / arms
      case 'jump': tg.llx = -9; tg.lly = 16; tg.rlx = 9; tg.rly = 16; tg.la1 = 150; tg.la2 = 160; tg.ra1 = 150; tg.ra2 = 160; tg.sy = 1.05; F.big = true; break;
      case 'cheer': { const s = sin(t * 9); tg.bob = -ab(sin(t * 7)) * 9; tg.la1 = 140 + s * 10; tg.la2 = 150 + s * 16; tg.ra1 = 140 - s * 10; tg.ra2 = 150 - s * 16; tg.rot = s * .025; tg.llx = -3; tg.lly = ab(sin(t * 7)) * 3; tg.rlx = 3; tg.rly = ab(sin(t * 7)) * 3; F.big = true; tg.sy = 1 + (sin(t * 7 + 1.6) > .8 ? .03 : 0); break; }
      case 'wave': { const s = sin(t * 9.5), e2 = sstep(0, .3, at); tg.bob = -ab(sin(t * 4)) * 2.4; tg.ra1 = d.a1 + (62 - d.a1) * e2; tg.ra2 = 6 + (148 + s * 24 - 6) * e2; tg.rot = sin(t * 4) * .02; tg.head = .06 * e2; tg.sh = 1.2; tg.la1 = d.a1 + sin(t * 4) * 3; F.big = true; break; }
      case 'oops': { const s = sin(t * 22); tg.la1 = 110; tg.la2 = -125; tg.ra1 = 110; tg.ra2 = -125; tg.bob = ab(s) * .8; tg.rot = s * .012; tg.sy = .98; F.sweat = true; tg.sh = 1.5; break; }
      case 'think': tg.ra1 = 26; tg.ra2 = -128; tg.rot = sin(t * 1.5) * .03; F.dots = true; tg.head = -.1; tg.bob = -sin(t * 2) * .4; break;
      case 'pickup': { const k = (sin(t * 3.2) + 1) / 2; tg.dip = 12 + k * 6; tg.la1 = -8; tg.la2 = 4; tg.ra1 = -8; tg.ra2 = 4; tg.llx = -6; tg.rlx = 6; F.gy = 1; tg.pitch = .35; break; }
      case 'lift': tg.la1 = 165; tg.la2 = 175; tg.ra1 = 165; tg.ra2 = 175; F.big = true; tg.bob = sin(t * 12) * .8; break;
      case 'phone': { const s = sin(t * 3.1); tg.ra1 = 34; tg.ra2 = -112 + s * 3; F.gy = 1; tg.head = .07; tg.bob = sin(t * 2) * 1; tg.rot = sin(t * .9) * .006; tg.pitch = .3; break; }
      case 'cry': { const s = sin(t * 17); tg.la1 = 112 + s * 5; tg.la2 = -150 + s * 8; tg.ra1 = 112 - s * 5; tg.ra2 = -150 - s * 8; F.tears = true; tg.bob = ab(s) * 2.4; tg.rot = sin(t * 11) * .035; tg.head = sin(t * 8) * .06; st.eyeSq = 1; break; }
      case 'scream': { const s = sin(t * 13); tg.la1 = 58; tg.la2 = 22 + s * 6; tg.ra1 = 58; tg.ra2 = 22 - s * 6; tg.llx = 0; tg.lly = Math.max(0, s) * 9; tg.rlx = 0; tg.rly = Math.max(0, -s) * 9; F.scream = true; tg.bob = -ab(s) * 5; tg.rot = sin(t * 26) * .035; tg.head = sin(t * 9) * .05; st.eyeSq = 1; break; }
      case 'sleep': F.closed = true; tg.bob = sin(t * 1.6) * 1.2; F.zzz = true; tg.rot = .04; tg.pitch = .4; break;
      case 'point': { const u = sstep(0, .22, at); tg.ra1 = d.a1 + (80 - d.a1) * u; tg.ra2 = 6 + (84 - 6) * u; tg.pt = u; tg.head = .05 * u; tg.rot = .012 * u; F.gx = u; tg.sh = .8 * u; tg.la1 = d.a1 + 2; break; }
      case 'shrug': { const u = sstep(0, .26, at); tg.sh = 7 * u; tg.la1 = d.a1 + (36 - d.a1) * u; tg.ra1 = tg.la1; tg.la2 = 6 + 112 * u; tg.ra2 = tg.la2; tg.head = .09 * u * (sin(t * 1.5) > 0 ? 1 : .8); tg.bob = -1.2 * u; st.emoA = 'neutral'; break; }
      case 'thumbs': { const u = sstep(0, .22, at); tg.ra1 = d.a1 + (50 - d.a1) * u; tg.ra2 = 6 + (170 - 6) * u; tg.th = u; tg.head = -.05 * u; tg.rot = -.01 * u; F.wink = at > .35 && at < 1.3 || (at > 1.6 && false); tg.sh = 1 * u; break; }
      case 'hug': { const u = sstep(0, .35, at), sq = sin(t * 3.2) * .5 + .5; tg.ra1 = d.a1 + (92 - d.a1) * u; tg.ra2 = 6 + (95 - 6) * u; tg.la1 = d.a1 + (46 - d.a1) * u; tg.la2 = 6 + (64 - 6) * u; tg.lean = .075 * u; tg.head = .1 * u; tg.sy = 1 - .012 * sq * u; tg.sh = 1.5 * u; st.hugU = u; break; }
      case 'jumpcheer': { const per = .72, u = (at % per) / per, h = 4 * u * (1 - u); tg.jy = 34 * h; tg.sy = u < .12 || u > .9 ? .86 : (u < .5 ? 1.07 : 1.0); tg.la1 = 150; tg.la2 = 165 + sin(t * 18) * 8; tg.ra1 = 150; tg.ra2 = 165 - sin(t * 18) * 8; tg.llx = -5; tg.rlx = 5; tg.lly = h * 7; tg.rly = h * 7; F.big = true; tg.rot = sin(t * 5) * .02; break; }
      case 'sad': { const br = sin(t * 1.15 + sd); tg.sh = -3.5; tg.la1 = d.a1 * .35; tg.ra1 = d.a1 * .35; tg.la2 = 0; tg.ra2 = 0; tg.pitch = .45; tg.head = .05 + sin(t * .6) * .02; tg.bob = -br * 1.2 + 1.5; tg.lean = .022; break; }
      case 'yawn': { const u = clamp(at / 2.4, 0, 1), env = Math.pow(sin(Math.PI * u), .7); tg.la1 = d.a1 + (150 - d.a1) * env; tg.la2 = 6 + (165 - 6) * env; tg.ra1 = d.a1 + (150 - d.a1) * env; tg.ra2 = 6 + (165 - 6) * env; tg.pitch = -.3 * env; tg.sy = 1 + .04 * env; tg.bob = -3 * env; st.eyeSq = env; st.mouthX = { o: env, w: .85 }; tg.sh = 2 * env; break; }
      case 'giggle': { const hp = ab(sin(at * 9.4)); tg.jy = hp * 5 * (at < 1.1 ? 1 : .3); tg.ra1 = 40; tg.ra2 = -138; tg.head = sin(at * 14) * .05 + .05; tg.rot = sin(at * 13) * .03; tg.sh = 1.4; tg.la1 = d.a1 + 8; tg.pitch = .15; st.hearts = 1; break; }
      case 'nod': { const k = Math.exp(-at * .9); tg.pitch = sin(at * 9) * .45 * k; tg.bob = -ab(sin(at * 9)) * 1.4 * k; break; }
      case 'shake': { const k = Math.exp(-at * .8); st.yawBias = sin(at * 11) * .85 * k; tg.head = sin(at * 11) * .05 * k; break; }
      default: {   // idle / talk: breathing, tiny sway, weight shift
        const br = sin(t * 2.05 + sd), sw = sin(t * 1.5 + sd);
        tg.bob = -br * .45 * rd; tg.la1 = d.a1 + (sw * 1.6 + br * .8) * rd; tg.ra1 = d.a1 + (-sw * 1.6 + br * .8) * rd; tg.la2 = 6 + br * 1.2 * rd; tg.ra2 = 6 + br * 1.2 * rd; tg.rot = sin(t * .9 + sd) * .006 * rd; tg.sh = br * .5 * rd; tg.head = sin(t * .7 + sd * 2) * .018 * rd;
        if (d.fidget) { tg.bob = ab(sin(t * 5)) * 3; tg.rot = sin(t * 4) * .03; tg.la1 += sin(t * 6) * 10; tg.ra1 -= sin(t * 6) * 10; tg.llx = sin(t * 5) * 3; tg.rlx = -sin(t * 5) * 1.5; }
        if (d.curious) { tg.head = sin(t * 1.3) * .1; F.gx = sin(t * 1.1) * .6; tg.bob = sin(t * 2.6) * 1.2; }
        const w = st.wsS * rd; tg.dx += w * 2.3; tg.rot += w * .012; if (w > 0) tg.lly += w * 1.3; else tg.rly -= w * 1.3; tg.la1 += w * 2.2; tg.ra1 += w * 2.2; tg.llx += w * -1.5; tg.rlx += w * -1.5;
      }
    }
    /* walk overlay (any idle-ish pose that is actually moving, or an explicit walk/run) */
    if (IDLEISH[anim] && st.wk > .02) {
      const run = anim === 'run', amp = (run ? 1.5 : 1) * st.wk, s = sin(st.wp), c = cos(st.wp), w = st.wk;
      tg.llx += s * 14 * amp; tg.lly += Math.max(0, -s) * 9 * amp; tg.rlx += -s * 14 * amp; tg.rly += Math.max(0, s) * 9 * amp;
      tg.la1 = tg.la1 + (d.a1 + 8 + s * 18 * amp - tg.la1) * w; tg.ra1 = tg.ra1 + (d.a1 + 8 - s * 18 * amp - tg.ra1) * w; const el = 8 + (run ? 40 : 6) + (anim === 'phone' ? 0 : 0); if (anim !== 'phone') { tg.la2 = tg.la2 + (el + Math.max(0, -s) * 8 - tg.la2) * w; tg.ra2 = tg.ra2 + (el + Math.max(0, s) * 8 - tg.ra2) * w; }
      tg.bob = tg.bob * (1 - w) + (-ab(c) * 3.6 * amp) * w; tg.rot += s * .03 * amp + (run ? .09 : .03) * w; tg.dx *= (1 - w); tg.pitch += -.04 * w; tg.head += -s * .012 * amp;
    }
  }

  function setExpr(st, d, anim, o, lv) {
    const et = st.et, F = st.fl, ov = EMO_OV[st.id]; let name = null;
    if (ov && (!ov.until || ov.until > now())) name = ov.name; else if (ov) delete EMO_OV[st.id];
    if (o.emote && EMO[o.emote]) name = o.emote;
    if (anim === 'cry' || anim === 'scream' || anim === 'sleep' || anim === 'oops') name = st.emoA; else if (!name) name = st.emoA || 'neutral';
    if (anim === 'sleep') name = 'neutral';
    const B = EMO[name] || EMO.neutral; for (let i = 0; i < EK.length; i++) et[EK[i]] = B[EK[i]];
    st.eHead = B.head; st.ePitch = B.pitch; st.eSh = B.sh; st.eGy = B.gy; st.mood = name;
    if (d.smile === 'big' && (name === 'neutral' || name === 'happy')) { et.mO = Math.max(et.mO, .4); et.mS = 1; et.mW = Math.max(et.mW, 1.1); }
    switch (anim) {
      case 'oops': et.bT = .95; et.bY = .6; et.mO = .42; et.mW = .5; et.lid = 1.22; et.pup = .78; break;
      case 'cry': et.sq = 1; et.bT = 1.1; et.mO = .85; et.mW = 1.1; et.mS = -.95; break;
      case 'scream': et.sq = 1; et.bT = .7; et.bY = .2; et.mO = 1; et.mW = 1.22; et.mS = -.25; break;
      case 'sleep': et.lid = 0; et.mO = 0; et.mS = .1; break;
      case 'hug': et.hap = 1; et.lid = .6; et.bl = .5; break;
      case 'giggle': et.hap = .95; et.bl = .8; et.mO = .5; et.mW = 1.15; break;
      case 'thumbs': et.hap = .35; et.mO = .3; et.mS = 1; break;
      case 'shrug': et.bY = .8; et.mS = -.15; et.mW = .85; et.mO = 0; et.bT = .35; break;
      case 'yawn': et.sq = st.eyeSq; et.mO = st.mouthX.o; et.mW = .85; et.mS = 0; break;
      case 'sad': et.mS = -.9; break;
      case 'wave': et.hap = .45; break;
    }
    if (anim === 'cry' || anim === 'scream') et.sq = 1;
    /* speech: mouth driven by the voice level (or the rhythmic fallback) */
    if (lv > .02) {
      const o2 = Math.min(1, Math.pow(lv, .75) * 1.15); et.mO = Math.max(et.mO * .6, o2 * (name === 'excited' ? 1 : .92)); et.mW = et.mW * (1 + (st.vow - .5) * .3) * (1 - .12 * o2); if (et.mS < .2 && name !== 'sad' && name !== 'angry' && name !== 'worried') et.mS = .35;
    }
    if (F.wink) et.hap = Math.max(et.hap, .0);
  }

  /* ---- secondary motion: under-damped spring toward a target */
  function spring(st, key, tgt, w, z, dt) { const sp = st.sp, a = sp[key], v = sp[key + 'V']; const acc = w * w * (tgt - a) - 2 * z * w * v; const nv = v + acc * dt; sp[key + 'V'] = nv; sp[key] = a + nv * dt; }

  function update(st, d, o, x, y, anim, dt, snap, sc, dirIn) {
    const p = st.p, tg = st.tg, e = st.e, et = st.et, F = st.fl, tnow = now();
    st.ph += dt; if (anim !== st.anim) { st.anim = anim; st.at = 0; } else st.at += dt;
    /* movement speed (screen px/s) -> walk cycle */
    let spd = 0; if (!snap) { if (st.hasPos && dt > 0) { const dx = x - st.px; if (ab(dx) < 160) { st.vx += (dx / dt - st.vx) * Math.min(1, dt * 12); } else st.vx = 0; } st.px = x; st.py = y; st.hasPos = true; spd = ab(st.vx) / Math.max(.3, sc); } else { st.hasPos = false; st.vx = 0; }
    const moving = spd > 18, walkAnim = anim === 'walk' || anim === 'run';
    const wkT = !IDLEISH[anim] ? 0 : walkAnim ? (spd > 18 ? 1 : .85) : clamp((spd - 14) / 40, 0, 1);
    st.wk += (wkT - st.wk) * Math.min(1, dt * 11); if (snap) st.wk = walkAnim ? 1 : wkT;
    if (st.wk > .01) { const run = anim === 'run', stride = run ? 150 : 125, rate = spd > 18 ? clamp(6.2832 * spd / stride, 6, 19) : (run ? 14 : 9); st.wp += rate * dt; if (snap) st.wp = st.ph * (run ? 14 : 9); }
    /* speech level */
    const V = M.voice; let lv = 0, talking = false;
    if (V && V.speaker === st.id && V.isSpeaking && V.isSpeaking()) { lv = V.getLevel(); talking = true; }
    else if (o.talk || (MANUAL_TALK[st.id] || 0) > tnow) { talking = true; lv = Math.max(0, (sin(st.ph * 17) * .5 + .35) * (.65 + .35 * sin(st.ph * 3.1)) + sin(st.ph * 7.3) * .12); }
    if (snap) { talking = !!o.talk; lv = o.talk ? .45 + .3 * sin(st.ph * 17) : 0; }
    const tkT = talking ? 1 : 0; st.tk += (tkT - st.tk) * Math.min(1, dt * 6);
    const dl = lv - st.lvlPrev; if (dl > .22 && !snap) { st.beat = 1; } st.beat *= Math.exp(-dt * 6); st.lvlPrev = lv; st.lvl = lv; st.vow = .5 + .5 * sin(st.ph * 5.3);
    /* pose + expression targets */
    setPose(st, d, anim, st.tk);
    if (st.tk > .3 && IDLEISH[anim] && st.wk < .3) gestures(st, d, dt, snap);
    setExpr(st, d, anim, o, lv);
    if (!snap && st.tk > .2) { tg.pitch += -.06 * st.tk - st.beat * .1; tg.sh += st.beat * .6; }
    tg.head += st.eHead * (1 - (IDLEISH[anim] ? 0 : .5)); tg.pitch += st.ePitch; tg.sh += st.eSh; if (anim === 'sad') { tg.pitch -= st.ePitch * .5; tg.sh -= st.eSh * .5; }
    /* weight shift timer (idle only) */
    if (!REDUCED && (anim === 'idle' || anim === 'talk') && st.wk < .1) { st.wsT -= dt; if (st.wsT <= 0) { const r = Math.random(); st.ws = r < .34 ? -1 : r < .68 ? 1 : 0; st.wsT = 3.5 + Math.random() * 4.5; } } else if (st.wk > .1) st.ws = 0;
    st.wsS += (st.ws - st.wsS) * Math.min(1, dt * 2.6);
    /* smoothing */
    if (snap) { for (let i = 0; i < PK.length; i++) p[PK[i]] = tg[PK[i]]; for (let i = 0; i < EK.length; i++) e[EK[i]] = et[EK[i]]; }
    else {
      for (let i = 0; i < PK.length; i++) { const k = PK[i]; p[k] += (tg[k] - p[k]) * (1 - Math.exp(-dt * PR[i])); }
      for (let i = 0; i < EK.length; i++) { const k = EK[i]; let r = ER[i]; if (k === 'mO') r = lv > .02 ? 38 : 20; p; e[k] += (et[k] - e[k]) * (1 - Math.exp(-dt * r)); }
    }
    /* blink */
    if (snap) { st.bk = 0; } else if (!F.closed) {
      st.nextBlink -= dt; if (st.nextBlink <= 0 && st.bkT < 0) { st.bkT = 0; st.nextBlink = (REDUCED ? 3.5 : 2.2) + Math.random() * (REDUCED ? 4 : 3.4); if (Math.random() < .16) st.dblk = 1; }
      if (st.bkT >= 0) { st.bkT += dt; const u = st.bkT / .15; st.bk = u < .4 ? u / .4 : u < .55 ? 1 : Math.max(0, 1 - (u - .55) / .45); if (u >= 1) { st.bkT = -1; st.bk = 0; if (st.dblk) { st.dblk = 0; st.nextBlink = .12; } } }
    } else st.bk = 0;
    /* gaze: speaker > tap focus > pointer > wander ; pupils lead, head follows */
    let tx = 0, ty = 0, has = false, wx = x, wy = y - (d.L + d.T + d.R) * sc;
    if (!snap) {
      const spk = V && V.speaker && V.speaker !== st.id && V.isSpeaking && V.isSpeaking() ? STS[V.speaker] : null;
      if (o.look) { tx = o.look.x; ty = o.look.y; has = true; }
      else if (st.lookUntil > tnow) { tx = st.lookX; ty = st.lookY; has = true; }
      else if (spk && spk.vis > FRAME - 8) { tx = spk.x; ty = spk.y - 90 * spk.sc; has = true; }
      else if (C.focus.until > tnow && C.focus.id !== st.id) { tx = C.focus.x; ty = C.focus.y; has = true; }
      else if (!REDUCED && tnow - C.ptr.t < 6 && IDLEISH[anim]) { tx = C.ptr.x; ty = C.ptr.y; has = true; }
      if (has) { st.gtx = clamp((tx - wx) / 170, -1, 1); st.gty = clamp((ty - wy) / 150, -1, 1); st.wanderT = 0; }
      else if (!REDUCED) { st.wanderT -= dt; if (st.wanderT <= 0) { st.wanderT = 1.8 + Math.random() * 3.6; const r = Math.random(); st.gtx = r < .3 ? 0 : (Math.random() * 2 - 1) * .55; st.gty = (Math.random() * .6 - .2); } } else { st.gtx = 0; st.gty = 0; }
      st.saccT -= dt; if (st.saccT <= 0) { st.saccT = .5 + Math.random() * 1.6; st.saccX = (Math.random() - .5) * .12; st.saccY = (Math.random() - .5) * .08; }
    } else { st.gtx = o.lookX ? clamp(o.lookX, -1, 1) : 0; st.gty = 0; st.saccX = st.saccY = 0; }
    const gdir = dirIn < 0 ? -1 : 1, gxl = st.gtx * gdir;   // gaze in the character's local (mirrored) space
    const kE = snap ? 1 : 1 - Math.exp(-dt * 16), kH = snap ? 1 : 1 - Math.exp(-dt * 3.2);
    st.gx += ((gxl + st.saccX + F.gx * (1 - ab(gxl) * .3)) - st.gx) * kE; st.gy += ((st.gty * .8 + st.saccY + F.gy * 1 + (st.eGy || 0) * .7) - st.gy) * kE;
    const yawT = clamp(gxl * (has ? .75 : .5), -.7, .7) * (REDUCED ? .4 : 1) * (anim === 'phone' ? .2 : 1) + st.yawBias + F.gx * .25; st.yaw += (yawT - st.yaw) * kH;
    st.yawBias *= snap ? 1 : Math.exp(-dt * 4);
    if (F.gx && anim === 'point') st.yaw = Math.max(st.yaw, .35);
    /* secondary motion springs (hair lags the head; tails lag lateral movement; cloth sways) */
    if (!snap) {
      const k = REDUCED ? .3 : 1, vloc = st.vx / Math.max(.3, sc) * gdir;
      const tH = (-p.head * .6 - vloc * .0012 - (p.rot) * .5 + sin(st.ph * 1.3 + st.seed) * .012) * k, tT = (-vloc * .0017 - p.rot * 1.1 - p.head * .5 + sin(st.ph * 1.7 + st.seed) * .018 + (anim === 'cheer' ? sin(st.ph * 9) * .08 : 0)) * k;
      const dB = (p.bob - (st.lastBob || 0)) / Math.max(dt, .001); st.lastBob = p.bob;
      spring(st, 'hair', tH, 15, .3, dt); spring(st, 'tail', tT, 12, .28, dt); spring(st, 'cloth', (-vloc * .0011 + st.wsS * .01 + sin(st.ph * 1.4 + st.seed) * .006) * k, 11, .3, dt);
      spring(st, 'hy', clamp(dB * .004, -.5, .5) * k, 18, .35, dt); st.sp.nodV += (st.beat > .5 ? 0 : 0);
    } else { st.sp.hair = st.sp.tail = st.sp.cloth = st.sp.hy = 0; st.sp.hairV = st.sp.tailV = st.sp.clothV = st.sp.hyV = 0; }
    /* eyebrow micro-motion (random lifts, a little life) */
    if (!snap && !REDUCED) { st.browT -= dt; if (st.browT <= 0) { st.browT = 1.5 + Math.random() * 4; st.browV = (Math.random() < .55 ? 1 : -.4) * (.3 + Math.random() * .5); } st.browK = (st.browK || 0) + ((st.browT > 1.2 ? 0 : st.browV * Math.min(1, (1.2 - st.browT) * 4)) - (st.browK || 0)) * Math.min(1, dt * 9); } else st.browK = 0;
    /* tap reaction overlay (spin / hop / hearts) */
    if (st.react) { const r = st.react, u = tnow - r.t0; if (u > r.dur) st.react = null; }
  }

  function gestures(st, d, dt, snap) {
    const tg = st.tg, F = st.fl, k = st.tk * (REDUCED ? .5 : 1);
    if (!snap) { st.gestNext -= dt; if (st.gestT <= 0 && st.gestNext <= 0) { st.gest = (Math.random() * 4) | 0; st.gestDur = .8 + Math.random() * .7; st.gestT = st.gestDur; st.gestNext = 1.1 + Math.random() * 1.8; } if (st.gestT > 0) st.gestT -= dt; }
    else { st.gest = 0; st.gestT = .5; st.gestDur = 1; }
    if (st.gestT <= 0 || st.gest < 0) { tg.ra2 += st.beat * 10 * k; return; }
    const u = 1 - st.gestT / st.gestDur, w = Math.pow(sin(Math.PI * clamp(u, 0, 1)), .7) * k, beat = st.beat * 14;
    switch (st.gest) {
      case 0: tg.ra1 += (50 - d.a1) * w; tg.ra2 += (110 - 6) * w + beat; tg.sh += .8 * w; break;                                         // right hand emphasis
      case 1: tg.la1 += (55 - d.a1) * w; tg.la2 += (95 - 6) * w - beat; tg.ra1 += (55 - d.a1) * w; tg.ra2 += (95 - 6) * w + beat; break;     // both hands open
      case 2: tg.ra1 += (28 - d.a1) * w; tg.ra2 += (-95) * w + beat * .6; tg.head += .05 * w; break;                                        // hand to chest
      default: tg.la1 += (40 - d.a1) * w; tg.la2 += (70 - 6) * w - beat; tg.head += -.04 * w; break;                                         // left hand
    }
  }

  /* ================= RENDER ================= */
  const GX = document.createElement('canvas').getContext('2d');   // owner of cached gradients (gradients are context independent)
  const G_EYEW = (() => { const l = GX.createLinearGradient(0, -1.2, 0, 1.2); l.addColorStop(0, '#d8cfcf'); l.addColorStop(.3, '#f7f3f0'); l.addColorStop(1, '#ffffff'); return l; })();
  const G_BLUSH = (() => { const r = GX.createRadialGradient(0, 0, 0, 0, 0, 1); r.addColorStop(0, 'rgba(236,84,92,1)'); r.addColorStop(1, 'rgba(236,84,92,0)'); return r; })();
  function irisGrad(pal) { if (pal.gI) return pal.gI; const r = GX.createRadialGradient(0, .22, .05, 0, 0, 1); r.addColorStop(0, mixc(pal.iris, '#f4c880', .6)); r.addColorStop(.5, pal.iris); r.addColorStop(1, dark(pal.iris, .55)); return (pal.gI = r); }
  const SHADOW = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 40; const g = c.getContext('2d'); g.translate(64, 20); g.scale(1, .31); const r = g.createRadialGradient(0, 0, 0, 0, 0, 62); r.addColorStop(0, 'rgba(50,25,10,.46)'); r.addColorStop(.55, 'rgba(50,25,10,.22)'); r.addColorStop(1, 'rgba(50,25,10,0)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill(); return c; })();

  const SK = { dk1: 'rgba(150,50,40,.13)', dk2: 'rgba(120,35,30,.17)', lt1: 'rgba(255,240,215,.15)', lt2: 'rgba(255,250,240,.2)' }, CL = { dk1: 'rgba(30,5,25,.09)', dk2: 'rgba(30,5,25,.13)', lt1: 'rgba(255,246,232,.08)', lt2: 'rgba(255,250,240,.1)' };
  const PT = new Float64Array(8), AP = [new Float64Array(6), new Float64Array(6)];
  function poly(g, n, ox, oy, w, col) { g.beginPath(); g.moveTo(PT[0] + ox, PT[1] + oy); for (let i = 1; i < n; i++) g.lineTo(PT[i * 2] + ox, PT[i * 2 + 1] + oy); g.lineWidth = w; g.strokeStyle = col; g.stroke(); }
  /* cel+soft shaded capsule chain: outline, base, form-shadow bands on the side away from the light, light bands on the lit side */
  function limb(g, n, w, base, K, lxs, outline) {
    if (outline) poly(g, n, 0, 0, w + 5, OL);
    poly(g, n, 0, 0, w, base); const sx = -lxs;
    poly(g, n, sx * w * .11, w * .03, w * .72, K.dk1); poly(g, n, sx * w * .22, w * .05, w * .46, K.dk2); poly(g, n, lxs * w * .2, -w * .03, w * .27, K.lt1); poly(g, n, lxs * w * .23, -w * .03, w * .1, K.lt2);
  }
  const NOOP = {};

  function handProp(g, d, A, anim, t, late) {
    const x = A[4], y = A[5];
    if (d.phone && (anim === 'phone') === !!late) {   // in the 'phone' pose the phone is drawn after the head so it stays visible
      const lit = .55 + .25 * Math.sin(t * 3); g.save(); g.translate(x + 1, y - 4); g.rotate(anim === 'phone' ? -.25 : -.1);
      G.fillRR(g, -8, -14, 16, 28, 4, '#2d3142', 2.6); G.fillRR(g, -6, -11, 12, 21, 2, '#9fd8ff', 0); g.fillStyle = 'rgba(255,255,255,' + lit * .5 + ')'; g.fillRect(-6, -11, 12, 5);
      g.fillStyle = '#2d3142'; g.fillRect(-3, -9, 6, 1.6); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-7.4, -13, 2, 24); g.restore(); G.circ(g, x + 4, y + 3, d.wf * .42, d.skin, 2.2);
    }
    if (d.spoon) { g.save(); g.translate(x, y); g.rotate(.35 + Math.sin(t * 2.4) * .12); G.fillRR(g, -2.6, -36, 5.2, 36, 2.4, '#c58a4a', 2.4); G.ell(g, 0, -42, 7.5, 10, '#d9a35f', 2.6); G.ell(g, 0, -42, 4, 6, '#b9763a', 0); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-1.8, -34, 1.4, 30); g.restore(); G.circ(g, x, y, d.wf * .62, d.skin, 3); }
    if (d.car) { g.save(); g.translate(x + 4, y + 3); G.fillRR(g, -13, -5, 26, 9, 3, '#e5534b', 2.4); G.fillRR(g, -7, -11, 14, 8, 3, '#ff8a85', 2.2); G.fillRR(g, -5, -10, 4, 5, 1, '#bfe8ff', 0); G.fillRR(g, 1, -10, 4, 5, 1, '#bfe8ff', 0); [-8, 8].forEach(wx => { G.circ(g, wx, 5, 4.4, '#2b2b30', 2); G.circ(g, wx, 5, 1.6, '#cfcfd6', 0); }); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-11, -4, 12, 1.6); g.restore(); G.circ(g, x, y, d.wf * .5, d.skin, 2.4); }
  }

  function drawArm(g, st, d, S, sd, A, lxs, anim, t) {   // sd = -1 left / +1 right
    const p = st.p, wf = d.wf, w = d.w, ex = A[2], ey = A[3];
    PT[0] = A[0]; PT[1] = A[1]; PT[2] = A[2]; PT[3] = A[3]; PT[4] = A[4]; PT[5] = A[5];
    limb(g, 3, wf + .5, S.pal.skin, SK, lxs, true);
    if (d.sleeveLong) {
      const mx = ex + (A[4] - ex) * .8, my = ey + (A[5] - ey) * .8; PT[4] = mx; PT[5] = my; limb(g, 3, w, S.pal.shirt, CL, lxs, true);
      if (d.ruffle) G.circ(g, A[0], A[1] - 2, w * .52, d.ruffle, 2.5);
      PT[0] = mx; PT[1] = my; PT[2] = mx + (A[4] - mx) * .1; PT[3] = my + (A[5] - my) * .1; poly(g, 2, 0, 0, w + 2, G.shade(S.pal.shirt, -.1));
    } else {
      PT[2] = A[0] + (ex - A[0]) * .72; PT[3] = A[1] + (ey - A[1]) * .72; limb(g, 2, w, S.pal.shirt, CL, lxs, true);
      PT[0] = PT[2] - (PT[2] - A[0]) * .0; PT[1] = PT[3]; poly(g, 1, 0, 0, 0, 'rgba(0,0,0,0)');
      g.beginPath(); g.arc(PT[2], PT[3], w * .5, 0, TAU); g.fillStyle = 'rgba(0,0,0,.08)'; g.fill();   // sleeve hem shadow
    }
    if (sd === 1 && (p.pt > .3 || p.th > .3)) {
      const dx = A[4] - ex, dy = A[5] - ey, dl = Math.hypot(dx, dy) || 1;
      if (p.pt > .3) { PT[0] = A[4]; PT[1] = A[5]; PT[2] = A[4] + dx / dl * wf * 1.05 * p.pt; PT[3] = A[5] + dy / dl * wf * 1.05 * p.pt; poly(g, 2, 0, 0, wf * .4 + 4, OL); poly(g, 2, 0, 0, wf * .4, S.pal.skin); }
      if (p.th > .3) { G.ell(g, A[4] + sd * 1.5, A[5] - wf * .62 * p.th, wf * .2, wf * .36 * p.th, S.pal.skin, 2.2); }
    }
    g.drawImage(S.hand.c, A[4] + S.hand.x, A[5] + S.hand.y, S.hand.w, S.hand.h);
    if (d.watch && sd === -1) { const wx = ex + (A[4] - ex) * .78, wy = ey + (A[5] - ey) * .78; G.fillRR(g, wx - 8, wy - 5, 16, 10, 3, '#7a4a28', 2.2); G.fillRR(g, wx - 5, wy - 5, 10, 10, 2, '#17120e', 1.5); G.circ(g, wx, wy, 1.6, '#6fd0ff', 0); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(wx - 4.4, wy - 4.2, 5, 1.4); }
    if (d.ring && sd === 1) G.circ(g, A[4] + 1, A[5] + 4, 2.6, '#ffd23c', 1.4);
    if (sd === 1) handProp(g, d, A, anim, t, false);
  }

  function drawEye(g, st, d, s, x, ey, er, lxs, pal) {
    const e = st.e, F = st.fl, ga = g.globalAlpha; let lid = e.lid * (1 - st.bk), hap = e.hap; if (F.closed) lid = 0; if (F.wink && s > 0) { lid = 0; hap = 1; }
    const lidMax = e.lid > 1 ? e.lid : 1, closed = clamp(1 - lid / .22, 0, 1), happyA = sstep(.66, .94, hap), sqA = e.sq, openA = (1 - sqA) * (1 - closed) * (1 - happyA);
    g.save(); g.translate(x, ey); g.lineCap = 'round';
    if (sqA > .02) { g.globalAlpha = ga * sqA; g.beginPath(); g.moveTo(s * er * 1.1, -er * .9); g.lineTo(-s * er * .8, 0); g.lineTo(s * er * 1.1, er * .9); g.lineWidth = 3.8; g.strokeStyle = OL; g.stroke(); }
    if (openA > .02) {
      g.globalAlpha = ga * openA; const w = e.lid > 1 ? 1 + (e.lid - 1) * .8 : 1, vs = clamp(lid / lidMax, .08, 1) * (1 - .3 * hap), cy = 1.18 * w * (1 - vs) * .34 + hap * .12, rY = 1.18 * w * vs;
      g.save(); g.scale(er, er); g.beginPath(); g.ellipse(0, cy, w, rY, 0, 0, TAU); g.fillStyle = G_EYEW; g.fill(); g.save(); g.clip();
      const ox = clamp(st.gx * .44, -.44, .44) * w, oy = clamp(st.gy * .34, -.3, .34) * w + cy * .35;
      g.translate(ox, oy); g.save(); g.scale(.56 * w, .7 * w); g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fillStyle = irisGrad(pal); g.fill(); g.restore();
      g.fillStyle = '#150a05'; g.beginPath(); g.arc(0, 0, .27 * w * e.pup, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.96)'; g.beginPath(); g.arc(lxs * .21 * w, -.26 * w, .2 * w, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(-lxs * .2 * w, .24 * w, .085 * w, 0, TAU); g.fill();
      g.restore();
      g.beginPath(); g.ellipse(0, cy, w, rY, 0, 0, TAU); g.lineWidth = 1.9 / er; g.strokeStyle = 'rgba(74,46,28,.9)'; g.stroke();
      g.beginPath(); g.ellipse(0, cy, w * 1.03, rY, 0, Math.PI * 1.07, Math.PI * 1.93); g.lineWidth = 3.1 / er; g.strokeStyle = OL; g.stroke();
      g.restore();
    }
    if (closed > .02 && happyA < .5) { g.globalAlpha = ga * closed * (1 - sqA) * (1 - happyA); g.beginPath(); g.arc(0, -er * .2, er * .9, Math.PI * .15, Math.PI * .85); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); }
    if (happyA > .02) { g.globalAlpha = ga * happyA * (1 - sqA); g.beginPath(); g.arc(0, er * .5, er * .95, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 3.6; g.strokeStyle = OL; g.stroke(); }
    g.globalAlpha = ga;
    if (d.lash) { line(g, s * er * 1.0, -er * .3, s * er * 1.65, -er * .75, 2.8, OL); line(g, s * er * 1.05, er * .05, s * er * 1.7, -er * .1, 2.4, OL); }
    g.restore();
  }
  function drawBrow(g, st, d, s, x, by, er, pal) {
    const e = st.e, raise = e.bY + (s > 0 ? e.bA : 0) + st.browK, inn = -e.bT * 5.2 - raise * 5.4 + 1, out = e.bT * 4.4 - raise * 5.4 + 1;
    const xi = x - s * er * 1.1, xo = x + s * er * 1.1; g.beginPath(); g.moveTo(xi, by + inn); g.quadraticCurveTo(x, (by + inn + by + out) / 2 - 5.2 + Math.abs(e.bT) * 1.5, xo, by + out); g.lineWidth = d.browW ? 4.4 : 3.4; g.strokeStyle = pal.brow; g.stroke();
  }
  function drawMouth(g, st, d, R, id) {
    const e = st.e, my = R * .6, wm = id === 'moody' ? .86 : 1, o = e.mO, sm = e.mS, wob = (st.anim === 'cry') ? Math.sin(st.ph * 17) * R * .04 : 0;
    if (o < .08) {
      const hw = R * .26 * e.mW * wm, cy = my - R * .055 - sm * R * .08, dep = R * (.02 + .2 * sm) * (.6 + .4 * Math.min(1, e.mW));
      g.beginPath(); g.moveTo(-hw, cy); g.quadraticCurveTo(0, cy + dep * 2, hw, cy); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke();
      if (sm > .5) { g.lineWidth = 1.6; g.beginPath(); g.moveTo(-hw - 2, cy - 2); g.lineTo(-hw, cy); g.moveTo(hw + 2, cy - 2); g.lineTo(hw, cy); g.stroke(); }   // smile dimples
      return;
    }
    const w = R * .4 * e.mW * wm, cy = my - R * .14 - sm * R * .05, topC = cy + R * (.03 + .1 * sm), bot = my - R * .1 + R * (.07 + .42 * o) + wob;
    g.beginPath(); g.moveTo(-w, cy); g.quadraticCurveTo(0, topC, w, cy); g.quadraticCurveTo(w * .85, bot, 0, bot + R * .01); g.quadraticCurveTo(-w * .85, bot, -w, cy); g.closePath();
    g.fillStyle = '#7b2428'; g.fill(); g.save(); g.clip();
    const th = R * .13 * Math.min(1, o * 3.2); g.fillStyle = '#fffaf2'; g.fillRect(-w, cy - R * .02, w * 2, th + (topC - cy) * .5);
    g.fillStyle = 'rgba(30,0,10,.28)'; g.fillRect(-w, cy, w * 2, R * .05);
    g.fillStyle = '#f2707e'; g.beginPath(); g.ellipse(0, bot + R * .02, w * .62, (bot - cy) * .5, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(-w * .12, bot - (bot - cy) * .2, w * .28, (bot - cy) * .1, 0, 0, TAU); g.fill();
    g.restore();
    g.lineWidth = 2.8; g.strokeStyle = OL; g.beginPath(); g.moveTo(-w, cy); g.quadraticCurveTo(0, topC, w, cy); g.quadraticCurveTo(w * .85, bot, 0, bot + R * .01); g.quadraticCurveTo(-w * .85, bot, -w, cy); g.stroke();
  }

  function drawHead(g, st, d, S, R, rx, o, lxs, anim, t) {
    const e = st.e, F = st.fl, sp = st.sp, pal = S.pal, ex = rx * .42, ey = R * .2, er = R * .2 * d.eye, fx = st.yaw * R * .3, fy = st.p.pitch * R * .09, hlag = (d.sunhat || o.hat) ? .2 : 1;
    for (let i = 0; i < S.backs.length; i++) {
      const b = S.backs[i]; g.save(); g.translate(b.px, b.py);
      if (b.shear) g.transform(1, 0, sp.cloth * 2.2, 1, 0, 0); else g.rotate(sp.tail * b.k);
      g.translate(-b.px, -b.py); blit(g, b.s); g.restore();
    }
    g.drawImage(S.skin.c, S.skin.x + fx * .14, S.skin.y, S.skin.w, S.skin.h);
    /* front hair / hat / hijab (parallax opposite to the face, lags the head) */
    g.save(); g.translate(-fx * .1, -fy * .3 + sp.hy * R * .05); g.rotate(sp.hair * .55 * hlag); blit(g, S.hair); g.restore();
    /* face features */
    g.save(); g.translate(fx, fy);
    if (e.bl > .03) { g.fillStyle = G_BLUSH; [-1, 1].forEach(s => { g.save(); g.translate(s * rx * .6, R * .5); g.scale(R * .22, R * .13); g.globalAlpha = (.1 + .34 * e.bl) * (g.globalAlpha || 1); g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); }); }
    for (let s = -1; s <= 1; s += 2) { drawEye(g, st, d, s, s * ex, ey, er, lxs, pal); drawBrow(g, st, d, s, s * ex, ey - er * (d.browW > 4 ? 1.85 : 1.55), er, pal); }
    g.beginPath(); g.arc(0, R * .36, R * .08, .2, Math.PI - .2); g.lineWidth = 2.6; g.strokeStyle = d.skinD; g.stroke(); g.beginPath(); g.arc(lxs * R * .035, R * .3, R * .028, 0, TAU); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
    g.restore();
    if (S.chin) { g.drawImage(S.chin.c, S.chin.x + fx * .75, S.chin.y + e.mO * R * .05, S.chin.w, S.chin.h); }
    g.save(); g.translate(fx, fy); drawMouth(g, st, d, R, st.id); if (S.front) blit(g, S.front); g.restore();
    if (F.tears) {
      [-1, 1].forEach(s => { const x = fx + s * ex, y0 = ey + R * .22; g.strokeStyle = 'rgba(120,200,255,.75)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + s * R * .1, y0 + R * .3, x + s * R * .06, y0 + R * .62); g.stroke();
        for (let k = 0; k < 3; k++) { const f = ((t * 1.7 + k / 3 + (s > 0 ? .17 : 0)) % 1), dy = f * R * .85; G.ell(g, x + s * R * (.05 + f * .06), y0 + dy, 3.4, 5.2, '#7cc9ff', 1.6); }
        const f2 = (t * 2.4 + (s > 0 ? .5 : 0)) % 1; G.ell(g, x + s * (R * .2 * 1.9 + f2 * 14), ey + R * .1 + f2 * 18, 3, 4.6, '#9fdcff', 1.4); });
    }
    if (F.scream) { g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = 3.4; const j = Math.sin(t * 26) * 2; [-1, 1].forEach(s => [-1, 0, 1].forEach(k => { g.beginPath(); g.moveTo(s * (rx + 9 + j), -R * .15 + k * 17); g.lineTo(s * (rx + 22 + j), -R * .15 + k * 25); g.stroke(); })); }
    if (F.sweat) { g.beginPath(); const sx = rx * .95, sy = -R * .1 + Math.sin(t * 3) * 1.5; g.moveTo(sx, sy - 10); g.quadraticCurveTo(sx + 8, sy + 2, sx, sy + 6); g.quadraticCurveTo(sx - 8, sy + 2, sx, sy - 10); G.fs(g, '#8fd6ff', 2.2); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(sx - 1.6, sy - 1, 1.5, 0, TAU); g.fill(); }
    if (st.hearts && st.anim === 'giggle') { for (let k = 0; k < 3; k++) { const u = (st.at * 1.4 + k / 3) % 1; g.save(); g.globalAlpha = (1 - u) * .95; G.heart(g, (k - 1) * 15 + Math.sin(u * 6 + k) * 4, -R * 1.35 - u * 28, 3.4 + k * .4, '#ff6f91', 1.2); g.restore(); } }
  }

  /* picks sprite density from the CURRENT canvas transform so portraits / big call views stay crisp */
  function levelFor(g, d, o) { const m = g.getTransform(); return pickLevel(Math.hypot(m.a, m.b) * d.sc * (o.sc || 1)); }

  C.draw = function (g, id, x, y, o) {
    o = o || {}; const d = DEFS[id]; if (!d) return; let anim = o.anim || 'idle', talk = o.talk;
    if (anim === 'idle' && d.idle && !o.plain) anim = d.idle; if (anim === 'talk') { anim = 'idle'; talk = true; }
    const key = o.key || id, tn = now(); let st = STS[key] || (STS[key] = newState(id, key)), snap = !!o.snap;
    if (st.lastFrame === FRAME && !o.key) { st = TMP[id] || (TMP[id] = newState(id, '~' + id)); snap = true; }   // 2nd draw of the same character in one frame (art props, icons): static snapshot, no side effects
    if (st.react && tn - st.react.t0 > st.react.dur) st.react = null;
    const baseAnim = anim; if (st.react && IDLEISH[anim] && anim !== 'walk' && anim !== 'run' && st.vx * st.vx < 400) anim = st.react.kind === 'spin' ? 'idle' : st.react.kind;
    const sc = d.sc * (o.sc || 1); let dt = 0;
    if (snap) { st.ph = o.t || 0; st.anim = anim; st.at = o.t == null ? 1.2 : Math.max(o.t, .05); st.tPrev = tn; }
    else { dt = st.tPrev ? tn - st.tPrev : .016; st.tPrev = tn; if (dt > .1) dt = .05; else if (dt < 0) dt = 0; if (st.lastFrame < FRAME - 2) { st.hasPos = false; st.nextBlink = Math.min(st.nextBlink, 1.5); } }
    const dirIn = o.dir || 1; if (snap) st.dirS = dirIn; else { st.dirS += (dirIn - st.dirS) * Math.min(1, dt * 15); if (Math.abs(st.dirS - dirIn) < .02) st.dirS = dirIn; }
    update(st, d, o, x, y, anim, dt, snap, sc, dirIn);
    if (!o.key && g === M.g && !snap) { st.x = x; st.y = y; st.sc = sc; st.vis = FRAME; st.base = baseAnim; }
    if (!snap) st.lastFrame = FRAME;
    const shirtC = o.shirt || (C.shirts[o.shirtId] && C.shirts[o.shirtId].color) || d.shirt, flip = st.dirS < 0, S = getSet(id, d, shirtC, o.hat && C.hats[o.hat] ? o.hat : '', levelFor(g, d, o), flip), lxs = flip ? 1 : -1;
    render(g, st, d, S, x, y, o, sc, anim, lxs);
  };

  function render(g, st, d, S, x, y, o, sc, anim, lxs) {
    const p = st.p, R = d.R, rx = R * d.hr, L = d.L, T = d.T, sw = d.sw, top = -(L + T), dip = p.dip, t = st.ph, rd = REDUCED ? .5 : 1, hip = 10;
    let spinK = 1, hop = 0, rT = st.react;
    if (rT && rT.kind === 'spin') { const u = clamp((now() - rT.t0) / rT.dur, 0, 1), ang = 6.2832 * (u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)); spinK = Math.cos(ang); if (Math.abs(spinK) < .24) spinK = spinK < 0 ? -.24 : .24; hop = Math.sin(Math.PI * u) * 20; }
    const yj = p.jy + hop; if (o.alpha != null) { g.save(); g.globalAlpha = o.alpha; }
    if (!o.noShadow) { const k = 1 - Math.min(.45, (-p.bob + yj * .9) / 60), w = 40 * sc * k * 1.05, h = 40 * sc * k * .34; g.globalAlpha = (o.alpha != null ? o.alpha : 1) * (.9 - Math.min(.35, yj / 90)); g.drawImage(SHADOW, x - w, y + 2 - h * .5, w * 2, h * 1.9); g.globalAlpha = o.alpha != null ? o.alpha : 1; }
    g.save(); g.translate(x, y - yj * sc); const bsy = p.sy, bsx = 1 + (1 - bsy) * .45; g.scale(st.dirS * spinK * sc * bsx, sc * bsy);
    g.rotate(p.rot + p.lean + (d.stoop || 0)); g.translate(p.dx, p.bob); g.lineJoin = 'round'; g.lineCap = 'round';
    const hy = -L + dip, dkL = S.pal.legC, legCol = isDressy(d) ? S.pal.legC : S.pal.pants, legK = isDressy(d) ? SK : CL;
    /* legs + shoes */
    const FX = [0, 0], FY = [0, 0];
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1, hx = s * hip, lx_ = i === 0 ? p.llx : p.rlx, ly_ = i === 0 ? p.lly : p.rly, fx = hx + lx_ + (dip ? s * 4 : 0), fy = -ly_ - 3; FX[i] = fx; FY[i] = fy;
      PT[0] = hx; PT[1] = hy; PT[2] = fx; PT[3] = fy; limb(g, 2, d.legW || 17, legCol, legK, lxs, true);
      if (d.top === 'placket') { g.beginPath(); g.moveTo(fx - 8, fy - 6); g.lineTo(fx + 8, fy - 6); g.lineWidth = 3; g.strokeStyle = 'rgba(120,80,0,.35)'; g.stroke(); }
      if (d.top !== 'placket' && !isDressy(d)) { g.beginPath(); g.moveTo(fx - 7, fy - 5); g.lineTo(fx + 7, fy - 5); g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.14)'; g.stroke(); }
    }
    for (let i = 0; i < 2; i++) g.drawImage(S.shoe.c, FX[i] + 3 + S.shoe.x, FY[i] + 1 + S.shoe.y, S.shoe.w, S.shoe.h);
    /* arms */
    const sY = top + dip + 10 - p.sh * .8, a1 = d.a1;
    const aL = AP[0], aR = AP[1];
    for (let i = 0; i < 2; i++) { const A = AP[i], side = i === 0 ? -1 : 1, an1 = (i === 0 ? p.la1 : p.ra1) * R2D, bn = (i === 0 ? p.la2 : p.ra2) * R2D; A[0] = side * (sw - 2); A[1] = sY; A[2] = A[0] + side * Math.sin(an1) * 22; A[3] = A[1] + Math.cos(an1) * 22; A[4] = A[2] + side * Math.sin(bn) * 22; A[5] = A[3] + Math.cos(bn) * 22; }
    drawArm(g, st, d, S, -1, aL, lxs, anim, t);
    /* body (breathing: chest rises, skirt sways) */
    const br = Math.sin(t * 2.05 + st.seed) * rd, tl = anim === 'sad' || anim === 'sleep' ? 1.8 : 1;
    g.save(); g.translate(0, dip); g.translate(0, -L); g.scale(1 + br * .005 * tl, 1 + br * .011 * tl); g.translate(0, L);
    if (isDressy(d)) { g.transform(1, 0, st.sp.cloth * 1.6, 1, -st.sp.cloth * 1.6 * (-L), 0); }
    blit(g, S.body); g.restore();
    drawArm(g, st, d, S, 1, aR, lxs, anim, t);
    /* head */
    const hcy = top + dip - 4 - R * .86 + p.pitch * 3.2 - p.sh * .45 - br * .35 + st.sp.hy * 2;
    g.save(); g.translate(Math.sin(st.yaw) * 1.2, hcy); g.rotate(p.head + (o.tilt || 0));
    drawHead(g, st, d, S, R, rx, o, lxs, anim, t);
    g.restore();
    if (d.phone && anim === 'phone') handProp(g, d, aR, anim, t, true);
    if (o.carry) { if (anim === 'lift') M.art.draw(g, o.carry, 0, hcy - R * 1.4, 70); else M.art.draw(g, o.carry, 0, top + dip + (T + 5) * .55, 52); }
    const F = st.fl;
    if (F.zzz) { const k = (t * .8) % 1; G.text(g, 'Z', 26 + k * 10, hcy - R - k * 22, { size: 20 + k * 8, color: '#4a8dff', stroke: '#fff', sw: 4 }); G.text(g, 'z', 40 + k * 8, hcy - R - 10 - ((k + .5) % 1) * 20, { size: 16, color: '#4a8dff', stroke: '#fff', sw: 4 }); }
    if (F.dots) { const n = Math.floor(t * 2.5) % 4; for (let i = 0; i < 3; i++) G.circ(g, 26 + i * 12, hcy - R - 16 - i * 5, 3 + i * 1.5, i < n ? '#fff' : 'rgba(255,255,255,.4)', 2); }
    if (rT && rT.kind === 'spin') { const u = clamp((now() - rT.t0) / rT.dur, 0, 1); for (let k = 0; k < 3; k++) { const a = u * 9 + k * 2.1; g.save(); g.globalAlpha = Math.sin(Math.PI * u); G.sparkle(g, Math.cos(a) * 40 * (k % 2 ? 1 : -1), hcy - R * .3 + Math.sin(a * 1.3) * 30, 6 + k * 1.5, '#fff6a8'); g.restore(); } }
    g.restore();
    if (o.alpha != null) g.restore();
  }

  /* ================= PORTRAITS (HUD avatars, dialogs, video call) ================= */
  C.portrait = function (g, id, cx, cy, r, o) {
    const d = DEFS[id], k = r * .62 / (d.R * d.sc), hy = (d.L + d.T + 4 + d.R * .86) * d.sc * k;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
    const bgc = (o && o.bg) || ['#ffe9b8', '#ffc98a']; g.fillStyle = G.lin(g, 0, cy - r, 0, cy + r, bgc); g.fillRect(cx - r, cy - r, r * 2, r * 2);
    const rg = g.createRadialGradient(cx - r * .3, cy - r * .35, r * .05, cx, cy, r * 1.1); rg.addColorStop(0, 'rgba(255,255,255,.4)'); rg.addColorStop(.6, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(60,20,0,.22)'); g.fillStyle = rg; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.translate(cx, cy + hy - r * .12); g.scale(k, k); C.draw(g, id, 0, 0, Object.assign({ anim: 'idle', t: 1.3, noShadow: true, snap: true }, o)); g.restore();
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.lineWidth = Math.max(2, r * .07); g.strokeStyle = OL; g.stroke();
  };
  C.hasPortraitArt = true;
  /* animated portrait on a DOM canvas: C.portraitLive(canvas, id, {anim, emote, bg, size}) -> {stop()} ; blinks, breathes, lip-syncs, shows emotions */
  const LIVE = []; let liveAcc = 0, liveN = 0;
  function liveDraw(L) {
    const cv = L.cv, g = cv.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.restore();
    g.save(); if (L.m) g.setTransform(L.m); else g.setTransform(cv.width / 100, 0, 0, cv.width / 100, cv.width / 2, cv.height / 2); g.lineJoin = 'round'; g.lineCap = 'round';
    C.portraitPose(g, L.id, 0, 0, L.r, { anim: L.anim, key: L.key, bg: L.bg, emote: L.emote, talk: L.talk }); g.restore();
  }
  C.portraitPose = function (g, id, cx, cy, r, o) {   // like portrait() but stateful (animated) when o.key is given
    const d = DEFS[id], k = r * .62 / (d.R * d.sc), hy = (d.L + d.T + 4 + d.R * .86) * d.sc * k;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
    const bgc = (o && o.bg) || ['#ffe9b8', '#ffc98a']; g.fillStyle = G.lin(g, 0, cy - r, 0, cy + r, bgc); g.fillRect(cx - r, cy - r, r * 2, r * 2);
    const rg = g.createRadialGradient(cx - r * .3, cy - r * .35, r * .05, cx, cy, r * 1.1); rg.addColorStop(0, 'rgba(255,255,255,.4)'); rg.addColorStop(.6, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(60,20,0,.22)'); g.fillStyle = rg; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.translate(cx, cy + hy - r * .12); g.scale(k, k); C.draw(g, id, 0, 0, Object.assign({ anim: 'idle', noShadow: true }, o)); g.restore();
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.lineWidth = Math.max(2, r * .07); g.strokeStyle = OL; g.stroke();
  };
  C.portraitLive = function (cv, id, o) {
    o = o || {}; const L = { cv, id, r: o.r || 46, anim: o.anim || 'idle', bg: o.bg, emote: o.emote, key: 'pl:' + id + ':' + (++liveN), t0: now(), seen: false, m: o.matrix || null };
    LIVE.push(L); return { stop() { const i = LIVE.indexOf(L); if (i >= 0) LIVE.splice(i, 1); } };
  };
  M.art.register('face', function (g, o) {
    const id = (o.args && o.args[0]) || 'moody', anim = o.args && o.args[1] ? o.args[1] : 'idle';
    C.portrait(g, id, 0, 0, 46, { anim, t: 1.3, bg: o.bg });
    try {   // an element made by M.art.el (square canvas, centred, scale = .94*px/100): animate it while it is on screen
      const cv = g.canvas, m = g.getTransform();
      if (cv && cv !== M.cv && LIVE.length < 8 && cv.width === cv.height && Math.abs(m.e - cv.width / 2) < 1 && Math.abs(m.f - cv.height / 2) < 1 && Math.abs(m.a - cv.width * .94 / 100 * 1) < .6 * (cv.width / 180 + .5) && !m.b && !m.c && !cv.__live) {
        cv.__live = 1; const L = { cv, id, r: 46, anim, bg: o.bg, key: 'pf:' + id + ':' + (++liveN), t0: now(), seen: false, m: m, auto: true }; LIVE.push(L);
      }
    } catch (e) { }
  });
  M.hooks.frame.push(() => {
    FRAME++;
    if (!LIVE.length) return; const tn = now(); if (tn - liveAcc < .033) return; liveAcc = tn;
    for (let i = LIVE.length - 1; i >= 0; i--) {
      const L = LIVE[i], cv = L.cv;
      if (cv.isConnected) { L.seen = true; const r = cv.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) continue; try { liveDraw(L); } catch (e) { } }
      else if (L.seen || tn - L.t0 > 4) { LIVE.splice(i, 1); }
    }
  });

  /* ================= REACTIONS / GESTURES / ENTER-EXIT ================= */
  const REACT_KINDS = ['giggle', 'wave', 'spin', 'jumpcheer'], REACT_DUR = { giggle: 1.25, wave: 1.5, spin: .95, jumpcheer: 1.05, shrug: 1.2, thumbs: 1.4, nod: 1.2, shake: 1.2, yawn: 2.4, point: 1.4, sad: 1.6 };
  C.react = function (id, kind, o) {
    o = o || {}; const st = STS[id]; if (!st) return 0; const tn = now(); if (tn - (st.reactT || -9) < .6 && !o.force) return 0;
    if (!kind || kind === 'auto') { st.reactN = ((st.reactN == null ? Math.floor(Math.random() * 4) : st.reactN) + 1) % REACT_KINDS.length; kind = REACT_KINDS[st.reactN]; }
    const dur = REACT_DUR[kind] || 1.2; st.react = { kind, t0: tn, dur }; st.reactT = tn; st.at = 0;
    if (o.sfx !== false && M.audio && M.audio.sfx) { try { M.audio.sfx(kind === 'spin' ? 'whoosh' : 'pop'); } catch (e) { } }
    return dur;
  };
  C.reactions = REACT_KINDS.slice();
  C.autoTap = true;
  try {
    M.cv.addEventListener('pointerdown', e => {
      if (!C.autoTap || M.paused) return; const sc = M.scene; if (!sc || sc.input) return;   // kits own the pointer: no reactions while a kit is active
      const r = M.cv.getBoundingClientRect(); if (!r.width) return; const x = (e.clientX - r.left) * M.W / r.width, y = (e.clientY - r.top) * M.H / r.height; let best = null, by = -1;
      for (const k in STS) { const st = STS[k]; if (st.vis < FRAME - 2 || st.key !== st.id || !IDLEISH[st.base || 'idle']) continue; const d = DEFS[st.id], h = (d.L + d.T + 6 + d.R * 2 + 8) * st.sc; if (Math.abs(x - st.x) < 36 * st.sc + 6 && y < st.y + 8 && y > st.y - h - 6 && st.y > by) { best = st; by = st.y; } }
      if (best) { if (C.react(best.id)) { C.focus.x = x; C.focus.y = best.y - 90 * best.sc; C.focus.until = now() + 2.2; C.focus.id = best.id; } }
    }, { passive: true });
  } catch (e) { }
  /* play a one-shot animation without the stage (stage.play(id,anim,dur) still works and takes priority) */
  C.gesture = function (id, anim, dur) { const st = STS[id]; if (!st) return 0; st.react = { kind: anim, t0: now(), dur: dur || REACT_DUR[anim] || 1.2 }; st.at = 0; return st.react.dur; };

  const sceneStage = s => s || M.scene;
  /* walk in from a screen edge (eased, with the walk cycle): C.enter(id, {from:'left'|'right'|x, to:x, y, dur, wave, stage}) -> Promise */
  C.enter = function (id, o) {
    o = o || {}; const stg = sceneStage(o.stage), h = stg && stg.heroes && stg.heroes[id]; if (!h) return Promise.resolve();
    const to = o.to != null ? o.to : h.x, from = o.from === 'right' ? 1030 : o.from === 'left' ? -70 : (o.from != null ? o.from : (to < 480 ? -70 : 1030)), dist = Math.abs(to - from), dur = o.dur || Math.max(.7, dist / ((h.speed || 230) * 1.25));
    h.visible = true; h.x = from; h.hx = from; if (o.y != null) { h.y = o.y; h.hy = o.y; } h.tx = null; h.dir = to >= from ? 1 : -1; h.fa = 'walk'; h.fat = 1e9; h.t = 0;
    return M.tw(h, { x: to }, dur, 'outCubic').then(() => { h.hx = h.x; h.fa = null; h.fat = 0; if (o.wave) return stg.play(id, 'wave', .9); });
  };
  /* walk out through an edge then hide: C.exit(id, {to:'left'|'right'|x, dur, hide:true, stage}) -> Promise */
  C.exit = function (id, o) {
    o = o || {}; const stg = sceneStage(o.stage), h = stg && stg.heroes && stg.heroes[id]; if (!h) return Promise.resolve();
    const to = o.to === 'right' ? 1030 : o.to === 'left' ? -70 : o.to != null ? o.to : (h.x < 480 ? -70 : 1030), dist = Math.abs(to - h.x), dur = o.dur || Math.max(.7, dist / ((h.speed || 230) * 1.25));
    h.tx = null; h.dir = to >= h.x ? 1 : -1; h.fa = 'walk'; h.fat = 1e9;
    return M.tw(h, { x: to }, dur, 'inCubic').then(() => { h.fa = null; h.fat = 0; if (o.hide !== false) h.visible = false; });
  };
  /* two characters walk together and hug: C.hug(idA, idB, {dur, stage}) -> Promise */
  C.hug = function (a, b, o) {
    o = o || {}; const stg = sceneStage(o.stage), A = stg && stg.heroes && stg.heroes[a], B = stg && stg.heroes && stg.heroes[b]; if (!A || !B) return Promise.resolve();
    const dA = DEFS[a], dB = DEFS[b], gap = (dA.sw * dA.sc * (A.sc || 1) + dB.sw * dB.sc * (B.sc || 1)) * .9 + 6, side = A.x <= B.x ? -1 : 1, tx = B.x + side * gap;
    return stg.walk(a, tx, B.y).then(() => { A.dir = side === -1 ? 1 : -1; B.dir = -A.dir; return Promise.all([stg.play(a, 'hug', o.dur || 2.2), stg.play(b, 'hug', o.dur || 2.2)]); });
  };

  /* pre-bake (call when idle / before a big scene appears): C.warm(['moody','aboody',...]) */
  C.warm = function (ids, scale) {
    (ids || Object.keys(DEFS)).forEach(id => { const d = DEFS[id]; if (!d) return; const lvl = pickLevel((scale || (M.cv ? M.cv.width / M.W : 1)) * d.sc); [false, true].forEach(fl => { if (fl && !scale) return; try { getSet(id, d, d.shirt, '', lvl, fl); } catch (e) { } }); });
  };
  C.stats = () => ({ sets: SPRN, states: Object.keys(STS).length, live: LIVE.length, frame: FRAME });
  C.clearCache = () => { for (const k in SPRS) delete SPRS[k]; SPRN = 0; };
  setTimeout(() => { try { if (navigator.connection && navigator.connection.saveData) return; const ids = Object.keys(DEFS); let i = 0; const nx = () => { if (i >= ids.length) return; try { C.warm([ids[i++]]); } catch (e) { } setTimeout(nx, 70); }; nx(); } catch (e) { } }, 2500);
  /* ----- people icons used in dialogs ----- */
  M.art.registerAll({
    mama(g) { G.circ(g, 0, -2, 40, '#ff8fb1', 4); G.ell(g, 0, 4, 29, 33, '#dd9d6c', 3.5); G.ell(g, 0, -4, 30, 24, '#ff8fb1', 0); g.beginPath(); g.ellipse(0, 6, 27, 29, 0, 0, 6.3); G.fs(g, '#e8aa7a', 3.5); [-1, 1].forEach(s => { G.ell(g, s * 11, 2, 5, 6, '#fff', 2); G.circ(g, s * 11, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 18, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.ellipse(0, -14, 31, 12, 0, Math.PI, 0); G.fs(g, '#ff8fb1', 3.5); },
    baba(g) { G.ell(g, 0, 4, 32, 36, '#dd9d6c', 3.5); g.beginPath(); g.ellipse(0, -18, 33, 18, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); [-1, 1].forEach(s => { G.ell(g, s * 12, 2, 5, 6, '#fff', 2); G.circ(g, s * 12, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 18, 14, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.ellipse(0, 24, 22, 9, 0, 0, Math.PI); g.fillStyle = '#3a2a1e'; g.fill(); },
    friend(g) { G.ell(g, 0, 2, 32, 35, '#e5b080', 3.5); g.beginPath(); g.ellipse(0, -16, 33, 20, 0, Math.PI, 0); G.fs(g, '#8a5a2b', 3); [-1, 1].forEach(s => { G.ell(g, s * 12, 2, 5, 6, '#fff', 2); G.circ(g, s * 12, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 16, 12, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    narrator(g) { G.circ(g, 0, 0, 40, '#8a6bd6', 4); G.star(g, 0, 2, 24, '#ffe14d', 3); }
  });
})();
