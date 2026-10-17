/* Moody & Aboody - engine/chars.js : the two heroes, drawn with canvas code (front-facing cartoon, outlines, shading).
   M.chars.draw(g, id, x, y, o)   x,y = feet centre.
   o = { anim, t, dir(+1/-1), sc, hat, shirt, talk, carry, alpha, expr, lookX }
   anims: idle walk run jump pickup lift cheer oops think sleep wave  */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, R2D = Math.PI / 180;
  const HAIR = '#3b2417', HAIR_HI = '#6a4630';

  /* ============ CHARACTER TABLE: the ONE place to tweak looks (palette / hair / outfit / proportions) ============
     top: 'placket' (button shirt, chest-pocket tag) | 'vneck' (dotted open collar) | 'polo' (dad's shirt) | 'dress' | 'floral' (long dress)
     hair: 'curly' | 'ponytail' | 'pigtails' | 'scarf' (headscarf) | 'short'.  Colours are plain CSS strings.
     abilities: tags kits can ask for with needs:'strong' (or a hero id). speed: walking speed factor.             */
  const DEFS = {
    moody: { name: 'مودي', age: 9, sc: 1, L: 56, T: 58, R: 28, hr: .94, sw: 22, skin: '#dd9d6c', skinD: '#c98655', shirt: '#9ea4ab', pants: '#e7b038', shoe: '#7a5238', curl: .29, eye: 1, img: 'assets/moody_cartoon.jpg', w: 20, wf: 12, a1: 24, a2: 24, top: 'placket', hair: 'curly', hairC: HAIR, abilities: ['strong', 'tall'], ability: 'قوي وطويل', badge: ['م', '#ffc93c'], playable: true, speed: 230 },
    aboody: { name: 'عبودي', age: 6, sc: .76, L: 44, T: 46, R: 33, hr: 1.0, sw: 21, skin: '#cf8b5a', skinD: '#b9764a', shirt: '#26396e', pants: '#cdb68b', shoe: '#f3eee2', curl: .31, eye: 1.18, img: 'assets/aboody_cartoon.jpg', w: 18, wf: 11, a1: 20, a2: 20, top: 'vneck', hair: 'curly', hairC: HAIR, abilities: ['small', 'quick'], ability: 'صغير وسريع', badge: ['ع', '#4aa8e8'], playable: true, speed: 230 },
    toota: { name: 'توتا', full: 'تسنيم', age: 15, sc: 1.12, L: 56, T: 56, R: 28, hr: .93, sw: 20, skin: '#e8b389', skinD: '#d39a70', shirt: '#6b1f3d', skirt: '#f6ecdf', keepSkirt: true, flowers: ['#8b2346', '#e98fa6', '#2c3566'], pants: '#e8b389', legC: '#e8b389', legW: 11, shoe: '#f2ece4', eye: 1.0, w: 17, wf: 11, a1: 16, a2: 16, top: 'blouse', sleeveLong: true, ruffle: '#7d2a4c', hair: 'scarf', scarf: '#f8f3ea', under: '#6b1f3d', glasses: '#5a4636', lash: true, neckPhones: '#f4c5d2', bag: '#d9c3a0', img: 'assets/toota_cartoon.jpg', abilities: ['leader', 'order'], ability: 'قائدة ومنظمة', badge: ['ت', '#8b2346'], playable: true, speed: 230 },
    nemo: { name: 'نيمو', full: 'ترنيم', age: 12, sc: 1.04, L: 52, T: 52, R: 30, hr: .98, sw: 20, skin: '#d29566', skinD: '#bb7d52', shirt: '#f7a9c6', pants: '#8fa6d9', shoe: '#ffffff', eye: 1.12, w: 18, wf: 11, a1: 18, a2: 18, top: 'hoodie', hair: 'bob', hairC: '#2b1a12', sunhat: '#f6c3cf', glasses: '#d9a28f', lash: true, smile: 'big', neckPhones: '#f6b6cd', bunny: true, img: 'assets/nemo_cartoon.jpg', abilities: ['curious', 'finder', 'small'], ability: 'فضولية وبتلاقي المخفي', badge: ['ن', '#ff6f91'], playable: true, speed: 230 },
    nana: { name: 'ننا زوزا', age: 68, sc: .9, L: 50, T: 56, R: 30, hr: .96, sw: 22, skin: '#e4b58c', skinD: '#cf9f76', shirt: '#c9b6ec', skirt: '#c9b6ec', flowers: ['#ff6f91', '#ffd23c', '#ffffff'], pants: '#e4b58c', legC: '#e4b58c', legW: 11, shoe: '#6b5a74', eye: .95, w: 20, wf: 11, a1: 22, a2: 22, top: 'floral', hair: 'scarf', scarf: '#f6dfe8', hairC: '#cfcfd6', glasses: '#8a6b55', wrinkles: true, abilities: ['wise', 'kind'], ability: 'حكيمة وحنونة', badge: ['ز', '#c9b6ec'], playable: false, speed: 130, stoop: .03 },
    baba: { name: 'بابا', age: 40, sc: 1.22, L: 58, T: 62, R: 28, hr: .96, sw: 24, skin: '#c98f5f', skinD: '#b17848', shirt: '#2b2b30', pants: '#3b3f50', shoe: '#2a2320', eye: .95, w: 22, wf: 13, a1: 24, a2: 24, top: 'crew', hair: 'curly', curl: .22, hairC: '#17120e', beard: '#17120e', smile: 'big', browW: 5.4, watch: true, ring: true, img: 'assets/baba_cartoon.jpg', abilities: ['dad'], ability: 'بابا', badge: ['ب', '#555a6b'], playable: false, speed: 200 },
    /* ---- extended family (owner's edition only; tools/family/build.js strips these rows). All playable:false. Extra flags: phone/spoon/car/backpack/apron = props, idle = default idle pose, bow/quiff/part/fringe = hair details, fidget/curious = idle behaviour ---- */
    ofa: { name: 'أوفا', age: 9, sc: .98, L: 54, T: 56, R: 28, hr: .95, sw: 21, skin: '#d79a68', skinD: '#c0834f', shirt: '#3fae6a', pants: '#4a5f8c', shoe: '#f3eee2', eye: 1.02, w: 19, wf: 12, a1: 24, a2: 24, top: 'crew', hair: 'short', hairC: '#2a1a10', fringe: true, smile: 'big', abilities: ['cousin', 'friendly'], ability: 'ابن عمتهم المرح', badge: ['أ', '#3fae6a'], playable: false, speed: 230 },
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

  /* ----- limb helper: outlined capsule chain ----- */
  function limbOutline(g, pts, w) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = w + 5; g.strokeStyle = OL; g.stroke(); }
  function limb(g, pts, w, col) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = w; g.strokeStyle = col; g.stroke(); }

  /* ----- pose from animation ----- */
  function pose(anim, t, d) {
    const p = { bob: 0, sy: 1, rot: 0, ll: [0, 0], rl: [0, 0], la: [d.a1, 6], ra: [d.a1, 6], head: 0, eyes: 'open', brows: 'flat', mouth: 'smile', sweat: false, look: 0, lookY: 0, dip: 0, zzz: false, dots: false };
    const sin = Math.sin, cos = Math.cos, ab = Math.abs;
    switch (anim) {
      case 'walk': case 'run': {
        const f = anim === 'run' ? 14 : 9, s = sin(t * f), amp = anim === 'run' ? 1.5 : 1;
        p.ll = [s * 13 * amp, Math.max(0, -s) * 9 * amp]; p.rl = [-s * 13 * amp, Math.max(0, s) * 9 * amp];
        p.la = [d.a1 + 8 + s * 18 * amp, 8 + (anim === 'run' ? 40 : 6)]; p.ra = [d.a1 + 8 - s * 18 * amp, 8 + (anim === 'run' ? 40 : 6)];
        p.bob = -ab(cos(t * f)) * 3.5 * amp; p.rot = s * .03 * amp; p.mouth = anim === 'run' ? 'big' : 'smile'; break;
      }
      case 'jump': p.ll = [-9, 16]; p.rl = [9, 16]; p.la = [150, 160]; p.ra = [150, 160]; p.mouth = 'big'; p.eyes = 'happy'; p.sy = 1.05; break;
      case 'cheer': case 'wave': {
        const s = sin(t * 9); p.bob = -ab(sin(t * 7)) * 9; p.la = [140 + s * 10, 150 + s * 16]; p.ra = [anim === 'wave' ? 40 : 140 - s * 10, anim === 'wave' ? 140 + s * 20 : 150 - s * 16];
        p.eyes = 'happy'; p.mouth = 'big'; p.brows = 'up'; p.rot = s * .025; p.ll = [-3, ab(sin(t * 7)) * 3]; p.rl = [3, ab(sin(t * 7)) * 3]; break;
      }
      case 'oops': { const s = sin(t * 22); p.la = [110, -125]; p.ra = [110, -125]; p.eyes = 'wide'; p.brows = 'worry'; p.mouth = 'o'; p.sweat = true; p.bob = ab(s) * .8; p.rot = s * .012; p.sy = .98; break; }
      case 'think': p.ra = [26, -128]; p.la = [d.a1, 6]; p.eyes = 'up'; p.brows = 'think'; p.mouth = 'flat'; p.rot = sin(t * 1.5) * .03; p.dots = true; p.look = .5; break;
      case 'pickup': { const k = (sin(t * 3.2) + 1) / 2; p.dip = 12 + k * 6; p.la = [-8, 4]; p.ra = [-8, 4]; p.ll = [-6, 0]; p.rl = [6, 0]; p.eyes = 'open'; p.lookY = 1; p.mouth = 'smile'; p.rot = 0; break; }
      case 'lift': p.la = [165, 175]; p.ra = [165, 175]; p.mouth = 'big'; p.brows = 'worry'; p.eyes = 'happy'; p.bob = sin(t * 12) * .8; break;
      case 'phone': { const s = sin(t * 3.1); p.ra = [34, -112 + s * 3]; p.eyes = 'down'; p.head = .07; p.mouth = 'smile'; p.bob = sin(t * 2) * 1; p.rot = sin(t * .9) * .006; break; }
      case 'cry': { const s = sin(t * 17); p.la = [112 + s * 5, -150 + s * 8]; p.ra = [112 - s * 5, -150 - s * 8]; p.eyes = 'squeeze'; p.brows = 'worry'; p.mouth = 'wail'; p.tears = true; p.bob = ab(s) * 2.4; p.rot = sin(t * 11) * .035; p.head = sin(t * 8) * .06; break; }
      case 'scream': { const s = sin(t * 13); p.la = [58, 22 + s * 6]; p.ra = [58, 22 - s * 6]; p.ll = [0, Math.max(0, s) * 9]; p.rl = [0, Math.max(0, -s) * 9]; p.eyes = 'squeeze'; p.brows = 'worry'; p.mouth = 'scream'; p.scream = true; p.bob = -ab(s) * 5; p.rot = sin(t * 26) * .035; p.head = sin(t * 9) * .05; break; }
      case 'sleep': p.eyes = 'closed'; p.mouth = 'flat'; p.bob = sin(t * 1.6) * 1.2; p.zzz = true; p.rot = .04; break;
      default: p.bob = sin(t * 2.2) * 1.4; p.la = [d.a1 + sin(t * 1.9) * 2, 6]; p.ra = [d.a1 - sin(t * 1.9) * 2, 6]; p.rot = sin(t * 1.1) * .008;
        if (d.fidget) { p.bob = ab(sin(t * 5)) * 3; p.rot = sin(t * 4) * .03; p.la[0] += sin(t * 6) * 10; p.ra[0] -= sin(t * 6) * 10; p.ll = [sin(t * 5) * 3, 0]; }
        if (d.curious) { p.head = sin(t * 1.3) * .1; p.lookW = sin(t * 1.1); p.bob = sin(t * 2.6) * 1.2; }
    }
    return p;
  }

  /* props held in the right hand (phone / wooden spoon / toy car); drawn on top of the hand */
  function handProp(g, d, A, anim, t, late) {
    const x = A.H[0], y = A.H[1];
    if (d.phone && (anim === 'phone') === !!late) {   // in the 'phone' pose the phone is drawn after the head so it stays visible
      const lit = .55 + .25 * Math.sin(t * 3); g.save(); g.translate(x + 1, y - 4); g.rotate(anim === 'phone' ? -.25 : -.1);
      G.fillRR(g, -8, -14, 16, 28, 4, '#2d3142', 2.6); G.fillRR(g, -6, -11, 12, 21, 2, '#9fd8ff', 0); g.fillStyle = 'rgba(255,255,255,' + lit * .5 + ')'; g.fillRect(-6, -11, 12, 5);
      g.fillStyle = '#2d3142'; g.fillRect(-3, -9, 6, 1.6); g.restore(); G.circ(g, x + 4, y + 3, d.wf * .42, d.skin, 2.2);
    }
    if (d.spoon) { g.save(); g.translate(x, y); g.rotate(.35 + Math.sin(t * 2.4) * .12); G.fillRR(g, -2.6, -36, 5.2, 36, 2.4, '#c58a4a', 2.4); G.ell(g, 0, -42, 7.5, 10, '#d9a35f', 2.6); G.ell(g, 0, -42, 4, 6, '#b9763a', 0); g.restore(); G.circ(g, x, y, d.wf * .62, d.skin, 3); }
    if (d.car) { g.save(); g.translate(x + 4, y + 3); G.fillRR(g, -13, -5, 26, 9, 3, '#e5534b', 2.4); G.fillRR(g, -7, -11, 14, 8, 3, '#ff8a85', 2.2); G.fillRR(g, -5, -10, 4, 5, 1, '#bfe8ff', 0); G.fillRR(g, 1, -10, 4, 5, 1, '#bfe8ff', 0); [-8, 8].forEach(wx => { G.circ(g, wx, 5, 4.4, '#2b2b30', 2); G.circ(g, wx, 5, 1.6, '#cfcfd6', 0); }); g.restore(); G.circ(g, x, y, d.wf * .5, d.skin, 2.4); }
  }

  C.draw = function (g, id, x, y, o) {
    o = o || {}; const d = DEFS[id], t = o.t || 0; let anim = o.anim || 'idle'; if (anim === 'idle' && d.idle && !o.plain) anim = d.idle;   // d.idle: character-specific default idle pose (e.g. 'phone')
    if (anim === 'talk' && !o.talk) o = Object.assign({}, o, { talk: true });
    const P = pose(anim, t, d), dir = o.dir || 1, sc = d.sc * (o.sc || 1);
    const shirtC = o.shirt || (C.shirts[o.shirtId] && C.shirts[o.shirtId].color) || d.shirt;
    const L = d.L, T = d.T, R = d.R, sw = d.sw, top = -(L + T), hipX = 10;
    if (o.alpha != null) { g.save(); g.globalAlpha = o.alpha; }
    if (!o.noShadow) G.shadow(g, x, y + 2, 30 * sc * (1 - Math.min(.4, (-P.bob) / 60)), 7 * sc, .2);
    g.save(); g.translate(x, y); g.scale(dir * sc, sc);
    g.rotate(P.rot + (d.stoop || 0)); g.translate(0, P.bob); g.lineJoin = 'round'; g.lineCap = 'round';
    const dip = P.dip;
    /* legs */
    const hy = -L + dip;
    [[-1, P.ll], [1, P.rl]].forEach(s => {
      const hx = s[0] * hipX, fx = hx + s[1][0] + (dip ? s[0] * 4 : 0), fy = -s[1][1] - 3;
      const pts = [[hx, hy], [fx, fy]]; limbOutline(g, pts, d.legW || 17); limb(g, pts, d.legW || 17, d.pants);
      if (d.top === 'placket') { g.beginPath(); g.moveTo(fx - 8, fy - 6); g.lineTo(fx + 8, fy - 6); g.lineWidth = 3; g.strokeStyle = 'rgba(120,80,0,.35)'; g.stroke(); }
    });
    [[-1, P.ll], [1, P.rl]].forEach(s => { const hx = s[0] * hipX, fx = hx + s[1][0] + (dip ? s[0] * 4 : 0), fy = -s[1][1] - 3; G.ell(g, fx + 3, fy + 1, 12, 6.5, d.shoe, 3.2); if (id === 'aboody') G.ell(g, fx + 4, fy + 3, 9, 2.2, '#d9d1bd', 0); });
    /* arms (back arm first = left) */
    const sY = top + dip + 10;
    function arm(side, ang) {
      const a1 = ang[0] * R2D, b = ang[1] * R2D, S = [side * (sw - 2), sY], len1 = 22, len2 = 22;
      const E = [S[0] + side * Math.sin(a1) * len1, S[1] + Math.cos(a1) * len1], H = [E[0] + side * Math.sin(b) * len2, E[1] + Math.cos(b) * len2];
      return { S, E, H, side };
    }
    const ArL = arm(-1, P.la), ArR = arm(1, P.ra);
    function drawArm(A) {
      limbOutline(g, [A.S, A.E, A.H], d.wf); limb(g, [A.S, A.E], d.wf + 1, d.skin); limb(g, [A.E, A.H], d.wf, d.skin);
      if (d.sleeveLong) {
        const m2 = [A.E[0] + (A.H[0] - A.E[0]) * .8, A.E[1] + (A.H[1] - A.E[1]) * .8]; limbOutline(g, [A.S, A.E, m2], d.w); limb(g, [A.S, A.E, m2], d.w, shirtC);
        if (d.ruffle) { G.circ(g, A.S[0], A.S[1] - 2, d.w * .52, d.ruffle, 2.5); }
        limb(g, [m2, [m2[0] + (A.H[0] - m2[0]) * .1, m2[1] + (A.H[1] - m2[1]) * .1]], d.w + 2, G.shade(shirtC, -.1));
      } else {
        const m = [A.S[0] + (A.E[0] - A.S[0]) * .72, A.S[1] + (A.E[1] - A.S[1]) * .72];
        g.beginPath(); g.moveTo(A.S[0], A.S[1]); g.lineTo(m[0], m[1]); g.lineWidth = d.w + 5; g.strokeStyle = OL; g.stroke(); limb(g, [A.S, m], d.w, shirtC);
      }
      G.circ(g, A.H[0], A.H[1], d.wf * .62, d.skin, 3);
      if (d.watch && A.side === -1) { const wx = A.E[0] + (A.H[0] - A.E[0]) * .78, wy = A.E[1] + (A.H[1] - A.E[1]) * .78; G.fillRR(g, wx - 8, wy - 5, 16, 10, 3, '#7a4a28', 2.2); G.fillRR(g, wx - 5, wy - 5, 10, 10, 2, '#17120e', 1.5); G.circ(g, wx, wy, 1.6, '#6fd0ff', 0); }
      if (d.ring && A.side === 1) G.circ(g, A.H[0] + 1, A.H[1] + 4, 2.6, '#ffd23c', 1.4);
      if (A.side === 1) handProp(g, d, A, anim, t, false);
    }
    if (o.carry && anim !== 'lift') { drawArm(ArL); }
    else drawArm(ArL);
    /* torso */
    const tx = -sw, tw = sw * 2, ty = top + dip, th = T + 5, dressy = d.top === 'dress' || d.top === 'floral' || d.top === 'blouse';
    if (dressy) {   // skirt first (behind the bodice)
      const wy = -L - T * .12 + dip, hemY = (d.top === 'floral' ? -L * .16 : -L * .5) + dip, hw0 = sw * .92, hw1 = sw + (d.top === 'floral' ? 15 : d.top === 'blouse' ? 8 : 17);
      g.save(); g.beginPath(); g.moveTo(-hw0, wy); g.lineTo(hw0, wy); g.quadraticCurveTo(hw1 + 2, (wy + hemY) / 2, hw1, hemY); g.quadraticCurveTo(0, hemY + 7, -hw1, hemY); g.quadraticCurveTo(-hw1 - 2, (wy + hemY) / 2, -hw0, wy); g.closePath(); G.fs(g, (d.keepSkirt || shirtC === d.shirt) ? (d.skirt || shirtC) : shirtC, 3.5);
      g.clip();
      if (d.stripes) { g.fillStyle = d.stripes; [.28, .62].forEach(k => g.fillRect(-hw1, wy + (hemY - wy) * k, hw1 * 2, 7)); }
      if (d.flowers) { for (let i = 0; i < 9; i++) { const fx = -hw1 + (i * 37) % (hw1 * 2), fy = wy + 8 + ((i * 53) % Math.max(8, hemY - wy - 12)); G.circ(g, fx, fy, 3.2, d.flowers[i % d.flowers.length], 1.2); G.circ(g, fx, fy, 1, '#ffe14d', 0); } }
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(hw0 * .3, wy, hw1, hemY - wy + 8);
      g.restore();
    }
    if (d.backpack) { G.fillRR(g, tx - 9, ty + 2, tw + 18, th - 14, 12, d.backpack, 3.5); G.fillRR(g, tx - 9, ty + th * .45, tw + 18, th * .22, 6, G.shade(d.backpack, -.15), 2.4); }
    G.fillRR(g, tx, ty, tw, th - (dressy ? 8 : 0), 9, shirtC, 3.5);
    g.save(); G.rr(g, tx, ty, tw, th - (dressy ? 8 : 0), 9); g.clip();
    g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(tx + tw * .62, ty, tw * .4, th); // soft shade
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(tx, ty, tw * .2, th);
    if (d.top === 'vneck') { g.fillStyle = 'rgba(255,255,255,.92)'; for (let yy = 0; yy < th + 6; yy += 8) for (let xx = (yy / 8 % 2) * 4; xx < tw; xx += 8) { g.beginPath(); g.arc(tx + xx + 2, ty + yy + 3, 1.5, 0, 6.3); g.fill(); } }
    if (d.stripes && dressy) { g.fillStyle = d.stripes; g.fillRect(tx, ty + th * .34, tw, 7); }
    if (d.flowers && d.top === 'floral') { for (let i = 0; i < 8; i++) { const fx = tx + (i * 29) % tw, fy = ty + 6 + (i * 41) % (th - 20); G.circ(g, fx, fy, 3, d.flowers[i % 3], 1.2); } }
    g.restore();
    if (d.top === 'placket' || d.top === 'polo') {
      g.fillStyle = d.top === 'placket' ? '#e3c58c' : G.shade(shirtC, -.15); g.fillRect(-3, ty + 8, 6, th - 8); G.line(g, -3, ty + 8, -3, ty + th - 1, 1.5, OL); G.line(g, 3, ty + 8, 3, ty + th - 1, 1.5, OL);
      [18, 32, 46].forEach(yy => G.circ(g, 0, ty + yy, 2.3, d.top === 'placket' ? '#c9a05e' : '#f3f3f3', 1.5));
      if (d.top === 'placket') { G.fillRR(g, 5, ty + 20, 15, 17, 2, 'rgba(255,255,255,.14)', 2.5); G.fillRR(g, 9, ty + 24, 7, 4, 1, '#222', 1); }
      G.poly(g, [[-3, ty + 1], [-14, ty + 3], [-4, ty + 15]], G.shade(shirtC, .12), 2.8); G.poly(g, [[3, ty + 1], [14, ty + 3], [4, ty + 15]], G.shade(shirtC, .12), 2.8);
    } else if (d.top === 'vneck') {
      G.poly(g, [[-9, ty + 1], [9, ty + 1], [0, ty + 19]], d.skin, 2.8);
      [28, 38].forEach(yy => G.circ(g, 0, ty + yy, 2.3, '#e3c58c', 1.5));
      G.fillRR(g, 4, ty + 22, 14, 15, 2, 'rgba(255,255,255,.1)', 2.5);
      G.poly(g, [[-9, ty + 1], [-17, ty + 4], [-9, ty + 17]], shirtC, 2.8); G.poly(g, [[9, ty + 1], [17, ty + 4], [9, ty + 17]], shirtC, 2.8);
    } else if (d.top === 'hoodie') {
      G.fillRR(g, -sw + 4, ty + th * .5, tw - 8, th * .36, 8, G.shade(shirtC, -.08), 2.8); G.line(g, -5, ty + 6, -6, ty + 24, 2.6, '#fff'); G.line(g, 5, ty + 6, 6, ty + 24, 2.6, '#fff'); G.ell(g, 0, ty + 3, 14, 6, G.shade(shirtC, -.12), 2.8);
    } else if (d.top === 'crew') {
      G.ell(g, 0, ty + 2, 11, 5.5, d.skin, 2.8); g.beginPath(); g.ellipse(0, ty + 2, 12, 6, 0, 0, Math.PI); g.lineWidth = 3.4; g.strokeStyle = G.shade(shirtC, .15); g.stroke();
    } else if (d.top === 'blouse') {
      G.ell(g, 0, ty + 3, 12, 5, G.shade(shirtC, .12), 2.8); [-1, 1].forEach(s2 => { G.circ(g, s2 * (sw - 3), ty + 5, 5.5, d.ruffle || shirtC, 2.2); }); G.line(g, 0, ty + 8, 0, ty + th - 14, 1.6, 'rgba(0,0,0,.2)'); G.fillRR(g, -sw, ty + th - 14, tw, 6, 2, G.shade(shirtC, -.12), 2.4);
    } else if (dressy) {
      if (d.trim && d.top === 'dress' && !d.stripes) { G.ell(g, 0, ty + 3, 13, 6, d.trim, 2.8); G.fillRR(g, -sw, ty + th - 22, tw, 8, 2, d.belt || '#ffd23c', 2.8); G.circ(g, 0, ty + th - 18, 3.2, '#fff', 1.4); }
      else if (d.top === 'floral') { G.ell(g, 0, ty + 3, 12, 6, '#fff', 2.8); G.circ(g, 0, ty + 18, 2.4, '#ffd23c', 1.2); G.circ(g, 0, ty + 30, 2.4, '#ffd23c', 1.2); }
      else { G.ell(g, 0, ty + 3, 12, 6, d.trim || '#fff', 2.8); }
    }
    if (d.backpack) { [-1, 1].forEach(s2 => { G.line(g, s2 * (sw - 6), ty + 1, s2 * (sw - 8), ty + th - 12, 7.5, OL); G.line(g, s2 * (sw - 6), ty + 1, s2 * (sw - 8), ty + th - 12, 4.4, G.shade(d.backpack, -.25)); }); }
    if (d.apron) {   // cooking apron: bib + neck strap + skirt panel + pocket
      const ac = d.apron, at = d.apronTrim || '#e5534b', ay = ty + 12;
      g.beginPath(); g.moveTo(-9, ty + 1); g.lineTo(9, ty + 1); g.lineTo(sw - 5, ay + 6); g.lineTo(sw - 3, ty + th + 22); g.lineTo(-sw + 3, ty + th + 22); g.lineTo(-sw + 5, ay + 6); g.closePath(); G.fs(g, ac, 3);
      g.beginPath(); g.moveTo(-9, ty + 1); g.lineTo(9, ty + 1); g.lineWidth = 3; g.strokeStyle = at; g.stroke(); G.fillRR(g, -sw + 3, ty + th + 14, sw * 2 - 6, 8, 2, at, 2.2);
      G.fillRR(g, -9, ty + th - 14, 18, 15, 3, 'rgba(0,0,0,.05)', 2.4); G.circ(g, 0, ty + th - 6, 2.2, at, 0);
      G.line(g, -9, ty + 1, -17, ty - 5, 3, at); G.line(g, 9, ty + 1, 17, ty - 5, 3, at);
    }
    if (d.bag) { G.line(g, -sw + 3, ty + 2, sw - 3, ty + th - 10, 6.5, OL); G.line(g, -sw + 3, ty + 2, sw - 3, ty + th - 10, 3.6, d.bag); G.fillRR(g, sw - 14, ty + th - 22, 22, 18, 4, d.bag, 2.8); G.line(g, sw - 12, ty + th - 17, sw + 6, ty + th - 17, 2, 'rgba(0,0,0,.25)'); }
    if (d.neckPhones) {
      const pc = d.neckPhones; g.beginPath(); g.moveTo(-15, ty - 4); g.quadraticCurveTo(0, ty + 20, 15, ty - 4); g.lineWidth = 9; g.strokeStyle = OL; g.stroke(); g.lineWidth = 5; g.strokeStyle = pc; g.stroke();
      [-1, 1].forEach(s2 => { if (d.bunny) { g.save(); g.translate(s2 * 17, ty + 4); g.rotate(s2 * .35); G.ell(g, 0, -15, 4.2, 10, pc, 2.4); G.ell(g, 0, -15, 1.8, 6, '#ff9ec0', 0); g.restore(); } G.circ(g, s2 * 15, ty + 12, 10, pc, 3); G.circ(g, s2 * 15, ty + 12, 5, G.shade(pc, -.12), 1.6); if (d.bunny) G.ell(g, s2 * 15, ty + 12, 2.2, 3.2, '#6fd0ff', 0); });
    }
    drawArm(ArR);
    /* neck + head */
    const hcy = ty - 4 - R * .86 + (P.lookY ? 5 : 0);
    G.fillRR(g, -7, ty - 8, 14, 12, 4, d.skin, 3);
    g.save(); g.translate(0, hcy); g.rotate(P.head + (o.tilt || 0) + (anim === 'think' ? -.1 : 0) + (anim === 'oops' ? 0 : 0));
    drawHead(g, id, d, R, P, t, o);
    g.restore();
    if (d.phone && anim === 'phone') handProp(g, d, ArR, anim, t, true);
    /* carried item / extras */
    if (o.carry) {
      if (anim === 'lift') M.art.draw(g, o.carry, 0, hcy - R * 1.4, 70);
      else M.art.draw(g, o.carry, 0, ty + th * .55, 52);
    }
    if (P.zzz) { const k = (t * .8) % 1; G.text(g, 'Z', 26 + k * 10, hcy - R - k * 22, { size: 20 + k * 8, color: '#4a8dff', stroke: '#fff', sw: 4 }); G.text(g, 'z', 40 + k * 8, hcy - R - 10 - ((k + .5) % 1) * 20, { size: 16, color: '#4a8dff', stroke: '#fff', sw: 4 }); }
    if (P.dots) { const n = Math.floor(t * 2.5) % 4; for (let i = 0; i < 3; i++) G.circ(g, 26 + i * 12, hcy - R - 16 - i * 5, 3 + i * 1.5, i < n ? '#fff' : 'rgba(255,255,255,.4)', 2); }
    g.restore();
    if (o.alpha != null) g.restore();
  };

  const er0 = R => R * .2;
  function drawHead(g, id, d, R, P, t, o) {
    const rx = R * d.hr, E = d.eye;
    const hc = d.hairC || HAIR, scarfy = d.hair === 'scarf';
    // hair parts that sit behind the head (ponytail / pigtails / headscarf)
    if (d.hair === 'ponytail') { g.save(); g.translate(rx * .9, -R * .25); g.rotate(-.55); G.ell(g, 8, R * .62, R * .3, R * .78, hc, 3.5); g.restore(); }
    else if (d.hair === 'pigtails') { [-1, 1].forEach(s => { g.save(); g.translate(s * (rx + 3), -R * .02); g.rotate(s * .3); G.ell(g, 0, R * .58, R * .27, R * .62, hc, 3.5); g.strokeStyle = 'rgba(255,255,255,.18)'; g.restore(); }); }
    else if (d.hair === 'short' && d.quiff) { g.beginPath(); g.moveTo(-rx * .7, -R * .75); g.bezierCurveTo(-rx * .6, -R * 1.45, rx * .6, -R * 1.6, rx * 1.0, -R * .7); g.closePath(); G.fs(g, hc, 3.5); }
    else if (d.hair === 'bob') { [-1, 1].forEach(s => G.ell(g, s * rx * .92, R * .38, R * .3, R * .62, hc, 3.5)); }
    else if (scarfy) { const dr = d.top === 'blouse' ? 1.22 : 1.1; G.ell(g, 0, R * 1.02, rx * dr, R * (dr > 1.2 ? .66 : .55), G.shade(d.scarf, -.1), 3.5); G.ell(g, 0, -R * .04, rx * 1.2, R * 1.17, d.scarf, 3.5); }
    // ears
    if (!scarfy) [-1, 1].forEach(s => { G.circ(g, s * (rx - 1), R * .12, R * .2, d.skin, 3); G.circ(g, s * (rx - 1), R * .12, R * .09, d.skinD, 0); });
    // head
    G.ell(g, 0, 0, rx * (scarfy ? .93 : 1), R * (scarfy ? .97 : 1), d.skin, 3.5);
    g.fillStyle = 'rgba(160,80,30,.14)'; g.beginPath(); g.ellipse(rx * .3, R * .15, rx * .7, R * .85, 0, -1.2, 1.4); g.fill();
    if (d.hair === 'curly') {
      // hair (union outline: strokes first, fills second)
      const cr = R * d.curl, circles = [];
      for (let i = 0; i <= 11; i++) { const a = (200 + i * 14.5) * R2D; circles.push([Math.cos(a) * rx * 1.02, Math.sin(a) * R * .98, cr]); }
      for (let i = 0; i < 6; i++) circles.push([(-.68 + i * .272) * rx, -R * .5 + (i % 2) * R * .04, R * .19]);
      circles.push([-rx * 1.02, -R * .12, R * .2], [rx * 1.02, -R * .12, R * .2], [-rx * .88, -R * .62, cr * .9], [rx * .88, -R * .62, cr * .9], [0, -R * 1.05, cr * 1.05], [-rx * .45, -R * 1.0, cr], [rx * .45, -R * 1.0, cr]);
      g.beginPath(); circles.forEach(c => { g.moveTo(c[0] + c[2], c[1]); g.arc(c[0], c[1], c[2], 0, 6.2832); });
      g.lineWidth = 6.5; g.strokeStyle = OL; g.stroke(); g.fillStyle = hc; g.fill();
      g.fillStyle = hc; g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .4, 0, 0, 6.2832); g.fill();
      g.strokeStyle = HAIR_HI; g.lineWidth = 2.2; g.lineCap = 'round';
      circles.forEach((c, i) => { if (i % 2 === 0 && c[1] < -R * .3) { g.beginPath(); g.arc(c[0] - c[2] * .1, c[1] + c[2] * .05, c[2] * .55, Math.PI * 1.05, Math.PI * 1.65); g.stroke(); } });
    } else if (scarfy) {
      if (d.under) { g.beginPath(); g.moveTo(-rx * .95, R * .2); g.bezierCurveTo(-rx * 1.05, -R * 1.1, rx * 1.05, -R * 1.1, rx * .95, R * .2); g.quadraticCurveTo(rx * .8, -R * .1, rx * .45, -R * .2); g.quadraticCurveTo(0, -R * .3, -rx * .45, -R * .2); g.quadraticCurveTo(-rx * .8, -R * .1, -rx * .95, R * .2); g.closePath(); G.fs(g, d.under, 3); }
      g.beginPath(); g.moveTo(-rx * 1.0, R * .3); g.bezierCurveTo(-rx * 1.2, -R * 1.3, rx * 1.2, -R * 1.3, rx * 1.0, R * .3); g.quadraticCurveTo(rx * .95, -R * .02, rx * .55, -R * (d.under ? .46 : .3)); g.quadraticCurveTo(0, -R * (d.under ? .66 : .5), -rx * .55, -R * (d.under ? .46 : .3)); g.quadraticCurveTo(-rx * .95, -R * .02, -rx * 1.0, R * .3); g.closePath(); G.fs(g, d.scarf, 3.5);
      if (!d.under) { g.save(); g.clip(); g.fillStyle = 'rgba(255,111,145,.55)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-rx * .8 + (i * 19) % (rx * 1.6), -R * .9 + (i * 13) % (R * .55), 2.4, 0, 6.3); g.fill(); } g.restore(); }
      g.beginPath(); g.moveTo(-rx * .55, -R * (d.under ? .46 : .3)); g.quadraticCurveTo(0, -R * (d.under ? .66 : .5), rx * .55, -R * (d.under ? .46 : .3)); g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke();
    } else {
      // smooth hair (ponytail / pigtails / short)
      const hl = d.hair === 'short' ? .5 : .42;
      g.beginPath(); g.moveTo(-rx * 1.04, R * .22); g.bezierCurveTo(-rx * 1.18, -R * 1.25, rx * 1.18, -R * 1.25, rx * 1.04, R * .22);
      g.quadraticCurveTo(rx * .86, -R * .06, rx * .4, -R * (hl - .06)); g.quadraticCurveTo(-rx * .05, -R * (hl + .12), -rx * .42, -R * (hl - .1)); g.quadraticCurveTo(-rx * .86, -R * .06, -rx * 1.04, R * .22); g.closePath(); G.fs(g, hc, 3.5);
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.beginPath(); g.arc(-rx * .15, -R * .55, R * .6, Math.PI * 1.15, Math.PI * 1.6); g.stroke();
      if (d.hair === 'ponytail') G.circ(g, rx * .92, -R * .18, R * .13, d.tie || '#ff6f91', 2.5);
      if (d.hair === 'pigtails') [-1, 1].forEach(s => { G.circ(g, s * (rx + 1), R * .05, R * .12, d.tie || '#fff', 2.5); if (d.bow) { g.save(); g.translate(s * (rx + 2), R * .02); G.poly(g, [[0, 0], [s * R * .42, -R * .28], [s * R * .42, R * .28]], d.bow, 2.6); G.poly(g, [[0, 0], [-s * R * .06, -R * .26], [-s * R * .06, R * .26]], d.bow, 2.6); G.circ(g, 0, 0, R * .1, G.shade(d.bow, -.2), 2); g.restore(); } });
      if (d.part) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-rx * .3, -R * .98); g.quadraticCurveTo(-rx * .38, -R * .72, -rx * .5, -R * .46); g.stroke(); }
      if (d.fringe) { g.beginPath(); g.moveTo(-rx * .86, -R * .06); g.lineTo(-rx * .86, -R * .3); g.quadraticCurveTo(0, -R * .52, rx * .86, -R * .3); g.lineTo(rx * .86, -R * .06); g.quadraticCurveTo(rx * .45, -R * .36, 0, -R * .3); g.quadraticCurveTo(-rx * .45, -R * .36, -rx * .86, -R * .06); g.closePath(); G.fs(g, hc, 3); }
    }
    if (d.sunhat) {
      const hcol = d.sunhat, hd = G.shade(hcol, -.08);
      G.ell(g, 0, -R * .98, rx * .98, R * .66, G.shade(hcol, .12), 3.5);
      G.ell(g, 0, -R * .6, rx * 2.05, R * .4, hcol, 3.5);
      g.save(); g.beginPath(); g.ellipse(0, -R * .6, rx * 2.05, R * .4, 0, 0, 6.3); g.clip(); g.strokeStyle = 'rgba(190,110,130,.35)'; g.lineWidth = 1.6; for (let i = -9; i <= 9; i++) { g.beginPath(); g.moveTo(i * rx * .21, -R * .98); g.lineTo(i * rx * .24, -R * .2); g.stroke(); } g.restore();
      g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .18, 0, 0, Math.PI); g.lineWidth = 7; g.strokeStyle = '#ff8fb1'; g.stroke();
      [-1, 1].forEach(s => { const bx = s * rx * .98, by = -R * .93; g.save(); g.translate(bx, by); g.rotate(s * -.25); G.poly(g, [[0, 0], [s * 11, -7], [s * 11, 7]], '#ff6f9d', 2.4); G.poly(g, [[0, 0], [-s * 10, -6], [-s * 10, 6]], '#ff6f9d', 2.4); G.circ(g, 0, 0, 3.4, '#ff4a86', 2); g.restore(); });
    }
    // cosmetic hat
    if (o.hat && C.hats[o.hat]) { g.save(); C.hats[o.hat].draw(g, R); g.restore(); }
    // face
    const ex = rx * .42, ey = R * .2;
    const blink = (t % 3.7) < .11 && P.eyes === 'open';
    [-1, 1].forEach(s => {
      const x = s * ex, lk = (o.lookX || 0) * 3 + P.look * s * 0 + (P.look ? 2.5 : 0) + (P.lookW || 0) * 3, ly = P.lookY ? 3 : (P.eyes === 'up' ? -4 : P.eyes === 'down' ? 4.5 : 0);
      const er = R * .2 * E;
      if (P.eyes === 'squeeze') { g.beginPath(); g.moveTo(x + s * er * 1.1, ey - er * .9); g.lineTo(x - s * er * .8, ey); g.lineTo(x + s * er * 1.1, ey + er * .9); g.lineWidth = 3.8; g.strokeStyle = OL; g.stroke(); }
      else if (P.eyes === 'happy') { g.beginPath(); g.arc(x, ey + er * .5, er * .95, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 3.6; g.strokeStyle = OL; g.stroke(); }
      else if (P.eyes === 'closed' || blink) { g.beginPath(); g.arc(x, ey - er * .2, er * .9, Math.PI * .15, Math.PI * .85); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); }
      else {
        const w = P.eyes === 'wide' ? 1.2 : 1;
        G.ell(g, x, ey, er * 1.0 * w, er * 1.18 * w, '#fff', 2.2);
        G.ell(g, x + lk, ey + ly, er * .56 * w, er * .7 * w, '#5a331c', 0); G.circ(g, x + lk, ey + ly, er * .26 * w, '#150a05', 0);
        G.circ(g, x + lk - er * .16, ey + ly - er * .24, er * .17 * w, '#fff', 0); G.circ(g, x + lk + er * .18, ey + ly + er * .2, er * .08 * w, 'rgba(255,255,255,.8)', 0);
        g.beginPath(); g.arc(x, ey, er * 1.02 * w, Math.PI * 1.08, Math.PI * 1.92); g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
      }
      if (d.lash) { G.line(g, x + s * er * 1.0, ey - er * .3, x + s * er * 1.65, ey - er * .75, 2.8); G.line(g, x + s * er * 1.05, ey + er * .05, x + s * er * 1.7, ey - er * .1, 2.4); }
      // brows
      const by = ey - er * (d.browW > 4 ? 1.85 : 1.55), lift = P.brows === 'up' ? -4 : 0;
      g.beginPath();
      if (P.brows === 'worry') { g.moveTo(x + s * er * 1.2, by + 6); g.lineTo(x - s * er * 1.2, by - 1); }
      else if (P.brows === 'think' && s > 0) { g.moveTo(x - er * 1.1, by - 3); g.quadraticCurveTo(x, by - 9, x + er * 1.1, by - 3); }
      else { g.moveTo(x - er * 1.1, by + 1 + lift); g.quadraticCurveTo(x, by - 4 + lift, x + er * 1.1, by + 1 + lift); }
      g.lineWidth = d.browW ? 4.4 : 3.4; g.strokeStyle = d.hair === 'curly' && d.beard ? '#120d0a' : '#2e1b10'; g.stroke();
      // cheeks
      g.fillStyle = 'rgba(240,110,100,.22)'; g.beginPath(); g.ellipse(s * rx * .6, R * .5, R * .14, R * .09, 0, 0, 6.3); g.fill();
    });
    if (d.beard) {
      g.beginPath(); g.moveTo(-rx * .98, R * .16); g.bezierCurveTo(-rx * 1.02, R * .72, -rx * .6, R * 1.2, 0, R * 1.2); g.bezierCurveTo(rx * .6, R * 1.2, rx * 1.02, R * .72, rx * .98, R * .16);
      g.quadraticCurveTo(rx * .82, R * .38, rx * .5, R * .46); g.quadraticCurveTo(0, R * .38, -rx * .5, R * .46); g.quadraticCurveTo(-rx * .82, R * .38, -rx * .98, R * .16); g.closePath(); G.fs(g, d.beard, 3.5);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.beginPath(); g.arc(0, R * .55, R * .6, .5, 2.6); g.stroke();
    }
    // nose
    g.beginPath(); g.arc(0, R * .36, R * .08, .2, Math.PI - .2); g.lineWidth = 2.6; g.strokeStyle = d.skinD; g.stroke();
    // mouth
    const my = R * .6;
    let m = P.mouth; if (d.smile === 'big' && m === 'smile') m = 'big'; if (o.talk && m === 'smile') m = (Math.floor(t * 9) % 2) ? 'talk' : 'smile';
    if (m === 'smile') { g.beginPath(); g.arc(0, my - R * .12, R * (id === 'moody' ? .2 : .26), .25, Math.PI - .25); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); }
    else if (m === 'big' || m === 'talk') {
      const w = R * (id === 'moody' ? .34 : .4), h = R * (m === 'talk' ? .2 : .34);
      g.beginPath(); g.moveTo(-w, my - R * .14); g.quadraticCurveTo(0, my - R * .1, w, my - R * .14); g.quadraticCurveTo(w * .8, my + h, 0, my + h); g.quadraticCurveTo(-w * .8, my + h, -w, my - R * .14); g.closePath();
      g.fillStyle = '#8c2a2a'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-w, my - R * .15, w * 2, R * .13); g.fillStyle = '#ff7f8a'; g.beginPath(); g.ellipse(0, my + h, w * .6, h * .55, 0, 0, 6.3); g.fill(); g.restore();
      g.lineWidth = 2.8; g.strokeStyle = OL; g.beginPath(); g.moveTo(-w, my - R * .14); g.quadraticCurveTo(0, my - R * .1, w, my - R * .14); g.quadraticCurveTo(w * .8, my + h, 0, my + h); g.quadraticCurveTo(-w * .8, my + h, -w, my - R * .14); g.stroke();
    }
    else if (m === 'wail' || m === 'scream') {
      const w = R * (m === 'scream' ? .5 : .42), top = R * .46, h = R * (m === 'scream' ? .5 : .4), wob = m === 'wail' ? Math.sin(t * 17) * R * .04 : 0;
      g.beginPath(); g.moveTo(-w, top); g.quadraticCurveTo(0, top - R * .08, w, top); g.quadraticCurveTo(w * 1.05, top + h + wob, 0, top + h * 1.15 + wob); g.quadraticCurveTo(-w * 1.05, top + h + wob, -w, top); g.closePath();
      g.fillStyle = '#8c2a2a'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-w, top - 1, w * 2, R * .11); g.fillStyle = '#ff7f8a'; g.beginPath(); g.ellipse(0, top + h * 1.1, w * .65, h * .5, 0, 0, 6.3); g.fill(); g.restore();
      g.lineWidth = 2.8; g.strokeStyle = OL; g.beginPath(); g.moveTo(-w, top); g.quadraticCurveTo(0, top - R * .08, w, top); g.quadraticCurveTo(w * 1.05, top + h + wob, 0, top + h * 1.15 + wob); g.quadraticCurveTo(-w * 1.05, top + h + wob, -w, top); g.stroke();
    }
    else if (m === 'o') G.ell(g, 0, my + 1, R * .1, R * .14, '#7a2323', 2.6);
    else { g.beginPath(); g.moveTo(-R * .12, my); g.lineTo(R * .12, my - 1); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); }
    if (d.beard) { g.beginPath(); g.moveTo(-rx * .55, R * .6); g.quadraticCurveTo(-rx * .25, R * .4, 0, R * .5); g.quadraticCurveTo(rx * .25, R * .4, rx * .55, R * .6); g.quadraticCurveTo(rx * .25, R * .56, 0, R * .53); g.quadraticCurveTo(-rx * .25, R * .56, -rx * .55, R * .6); g.closePath(); G.fs(g, d.beard, 2.6); }
    if (d.stubble) { g.fillStyle = 'rgba(35,25,20,.26)'; for (let i = 0; i < 34; i++) { const a = .35 + (i * 0.137) % 2.45, rr = .72 + ((i * 7) % 10) / 40; const px = Math.cos(a) * rx * rr, py = Math.sin(a) * R * rr * .98; if (py > R * .42 && Math.abs(px) > R * .08 || py > R * .72) { g.beginPath(); g.arc(px, py, .95, 0, 6.3); g.fill(); } } }
    if (d.glasses) { const gr = R * .2 * E * 1.55; g.lineWidth = 2.6; g.strokeStyle = d.glasses; [-1, 1].forEach(s => { g.beginPath(); g.arc(s * ex, ey, gr, 0, 6.3); g.stroke(); g.fillStyle = 'rgba(210,235,255,.12)'; g.fill(); }); g.beginPath(); g.moveTo(-ex + gr, ey - 1); g.quadraticCurveTo(0, ey - 6, ex - gr, ey - 1); g.stroke(); }
    if (d.wrinkles) { g.lineWidth = 1.6; g.strokeStyle = 'rgba(120,70,40,.4)'; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * ex * 1.5, ey + R * .22); g.quadraticCurveTo(s * ex * 1.75, ey + R * .3, s * ex * 1.45, ey + R * .4); g.stroke(); }); }
    if (P.tears) {
      [-1, 1].forEach(s => { const x = s * ex, y0 = ey + R * .22; g.strokeStyle = 'rgba(120,200,255,.75)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + s * R * .1, y0 + R * .3, x + s * R * .06, y0 + R * .62); g.stroke();
        for (let k = 0; k < 3; k++) { const f = ((t * 1.7 + k / 3 + (s > 0 ? .17 : 0)) % 1), dy = f * R * .85; G.ell(g, x + s * R * (.05 + f * .06), y0 + dy, 3.4, 5.2, '#7cc9ff', 1.6); }
        const f2 = (t * 2.4 + (s > 0 ? .5 : 0)) % 1; G.ell(g, x + s * (er0(R) * 1.9 + f2 * 14), ey + R * .1 + f2 * 18, 3, 4.6, '#9fdcff', 1.4); });
    }
    if (P.scream) { g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = 3.4; const j = Math.sin(t * 26) * 2; [-1, 1].forEach(s => [-1, 0, 1].forEach(k => { g.beginPath(); g.moveTo(s * (rx + 9 + j), -R * .15 + k * 17); g.lineTo(s * (rx + 22 + j), -R * .15 + k * 25); g.stroke(); })); }
    if (P.sweat) { g.beginPath(); const sx = rx * .95, sy = -R * .1; g.moveTo(sx, sy - 10); g.quadraticCurveTo(sx + 8, sy + 2, sx, sy + 6); g.quadraticCurveTo(sx - 8, sy + 2, sx, sy - 10); G.fs(g, '#8fd6ff', 2.2); }
  }

  /* head-and-shoulders portrait inside a circle (HUD avatars, dialogs, video call) */
  C.portrait = function (g, id, cx, cy, r, o) {
    const d = DEFS[id], k = r * .62 / (d.R * d.sc), hy = (d.L + d.T + 4 + d.R * .86) * d.sc * k;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip();
    g.fillStyle = G.lin(g, 0, cy - r, 0, cy + r, (o && o.bg) || ['#ffe9b8', '#ffc98a']); g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.translate(cx, cy + hy - r * .12); g.scale(k, k); C.draw(g, id, 0, 0, Object.assign({ anim: 'idle', t: 1, noShadow: true }, o)); g.restore();
    g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.lineWidth = Math.max(2, r * .07); g.strokeStyle = OL; g.stroke();
  };
  C.hasPortraitArt = true;
  M.art.register('face', function (g, o) { const id = (o.args && o.args[0]) || 'moody'; C.portrait(g, id, 0, 0, 46, o.args && o.args[1] ? { anim: o.args[1], t: 2.2 } : null); });   // 'face:toti:cry' = portrait with a pose

  /* ----- people icons used in dialogs ----- */
  M.art.registerAll({
    mama(g) { G.circ(g, 0, -2, 40, '#ff8fb1', 4); G.ell(g, 0, 4, 29, 33, '#dd9d6c', 3.5); G.ell(g, 0, -4, 30, 24, '#ff8fb1', 0); g.beginPath(); g.ellipse(0, 6, 27, 29, 0, 0, 6.3); G.fs(g, '#e8aa7a', 3.5); [-1, 1].forEach(s => { G.ell(g, s * 11, 2, 5, 6, '#fff', 2); G.circ(g, s * 11, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 18, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.ellipse(0, -14, 31, 12, 0, Math.PI, 0); G.fs(g, '#ff8fb1', 3.5); },
    baba(g) { G.ell(g, 0, 4, 32, 36, '#dd9d6c', 3.5); g.beginPath(); g.ellipse(0, -18, 33, 18, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); [-1, 1].forEach(s => { G.ell(g, s * 12, 2, 5, 6, '#fff', 2); G.circ(g, s * 12, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 18, 14, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.ellipse(0, 24, 22, 9, 0, 0, Math.PI); g.fillStyle = '#3a2a1e'; g.fill(); },
    friend(g) { G.ell(g, 0, 2, 32, 35, '#e5b080', 3.5); g.beginPath(); g.ellipse(0, -16, 33, 20, 0, Math.PI, 0); G.fs(g, '#8a5a2b', 3); [-1, 1].forEach(s => { G.ell(g, s * 12, 2, 5, 6, '#fff', 2); G.circ(g, s * 12, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 16, 12, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    narrator(g) { G.circ(g, 0, 0, 40, '#8a6bd6', 4); G.star(g, 0, 2, 24, '#ffe14d', 3); }
  });
})();
