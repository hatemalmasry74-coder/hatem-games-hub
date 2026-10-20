/* Moody & Aboody - engine/chars.js : "Characters v2" - code-drawn articulated cartoon characters with a 3D-ish look.
   Rendering: static shaded layers (body, head skin, hair, glasses, beard, shoes, hands) are baked once to offscreen canvases
   (per character + outfit + hat + pixel density + light side) and re-used every frame; limbs, eyes, brows, mouth are drawn live.
   Animation: pose targets -> exponentially smoothed (150-250 ms blends), idle life (breathing, weight shift, blink, gaze, micro brows),
   secondary-motion springs (hair / scarf / pigtails / skirt), emotions, voice-driven mouth, gestures, tap reactions.
   M.chars.draw(g, id, x, y, o)   x,y = feet centre.
   o = { anim, t, dir(+1/-1), sc, hat, shirt, shirtId, talk, carry, alpha, emote, key, look:{x,y}, noShadow, plain, snap, tilt, lookX }
   anims: idle walk run jump pickup lift cheer oops think sleep wave phone cry scream | point shrug thumbs hug jumpcheer sad yawn giggle nod shake
   v3 (toota, nemo) and v4 (every other character: flag v4:true, optional fields added in the V4P block under DEFS) = the polished look: tapered limbs + cuffs, shaped hands, shoes by shoeK, curls (curly4), short hair styles (short4), lips / lines / poise.
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
    moody: { name: 'مودي', gender: 'm', age: 9, sc: 1, L: 56, T: 58, R: 28, hr: .94, sw: 22, skin: '#dd9d6c', skinD: '#c98655', shirt: '#9ea4ab', pants: '#e7b038', shoe: '#7a5238', curl: .29, eye: 1, img: 'assets/moody_cartoon.jpg', w: 20, wf: 12, a1: 24, a2: 24, top: 'placket', hair: 'curly', hairC: HAIR, abilities: ['strong', 'tall'], ability: 'قوي وطويل', badge: ['م', '#ffc93c'], playable: true, speed: 230 },
    aboody: { name: 'عبودي', gender: 'm', age: 6, sc: .76, L: 44, T: 46, R: 33, hr: 1.0, sw: 21, skin: '#cf8b5a', skinD: '#b9764a', shirt: '#26396e', pants: '#cdb68b', shoe: '#f3eee2', curl: .31, eye: 1.18, img: 'assets/aboody_cartoon.jpg', w: 18, wf: 11, a1: 20, a2: 20, top: 'vneck', hair: 'curly', hairC: HAIR, abilities: ['small', 'quick'], ability: 'صغير وسريع', badge: ['ع', '#4aa8e8'], playable: true, speed: 230 },
    toota: { name: 'توتا', gender: 'f', full: 'تسنيم', age: 15, sc: 1.1, L: 58, T: 54, R: 30, hr: .93, sw: 19, skin: '#eebb92', skinD: '#d99c74', shirt: '#722246', skirt: '#f7ede3', keepSkirt: true, pants: '#efe2d5', legC: '#efe2d5', legW: 10, shoe: '#f4eae1', shoeAcc: '#b5456c', eye: 1.05, iris: '#6e4026', w: 14, wf: 11, a1: 13, a2: 16, top: 'cardigan', sleeveLong: true, cuff: '#fbf3ea', belt: '#c25a7e', hair: 'scarf', scarf: '#f6e4de', hijab: '#f6e4de', under: '#7d2447', pin: '#e2b05c', glasses: '#b3745f', lash: true, bag: '#cf9c8c', v3: true, pk: .9, img: 'assets/toota_cartoon.jpg', abilities: ['leader', 'order'], ability: 'قائدة ومنظمة', badge: ['ت', '#8b2346'], playable: true, speed: 230 },
    nemo: { name: 'نيمو', gender: 'f', full: 'ترنيم', age: 12, sc: 1.04, L: 52, T: 52, R: 30, hr: .98, sw: 19, skin: '#dba070', skinD: '#c4875a', shirt: '#f7a9c6', skirt: '#86a3dc', keepSkirt: true, stitch: true, pants: '#8fa6d9', legC: '#d9c8ef', legW: 10, shoe: '#ffffff', shoeAcc: '#ff7fae', eye: 1.05, iris: '#6a3e24', w: 15, wf: 11, a1: 15, a2: 18, top: 'hoodie', sleeveLong: true, cuff: '#ffd6e6', hair: 'bob', braid: true, hairC: '#2f1b13', sunhat: '#f8cdd8', hat: '#f8cdd8', ribbon: '#ff7fae', glasses: '#e8a38f', lash: true, smile: 'big', neckPhones: '#f6b6cd', bunny: true, charm: '#ffd23c', v3: true, pk: .78, img: 'assets/nemo_cartoon.jpg', abilities: ['curious', 'finder', 'small'], ability: 'فضولية وبتلاقي المخفي', badge: ['ن', '#ff6f91'], playable: true, speed: 230 },
    nana: { name: 'ننا زوزا', gender: 'f', age: 68, sc: .9, L: 50, T: 56, R: 30, hr: .96, sw: 22, skin: '#e4b58c', skinD: '#cf9f76', shirt: '#c9b6ec', skirt: '#c9b6ec', flowers: ['#ff6f91', '#ffd23c', '#ffffff'], pants: '#e4b58c', legC: '#e4b58c', legW: 11, shoe: '#6b5a74', eye: .95, w: 20, wf: 11, a1: 22, a2: 22, top: 'floral', hair: 'scarf', scarf: '#f6dfe8', hairC: '#cfcfd6', glasses: '#8a6b55', wrinkles: true, abilities: ['wise', 'kind'], ability: 'حكيمة وحنونة', badge: ['ز', '#c9b6ec'], playable: false, speed: 130, stoop: .03 },
    baba: { name: 'بابا', gender: 'm', age: 40, sc: 1.22, L: 58, T: 62, R: 28, hr: .96, sw: 24, skin: '#c98f5f', skinD: '#b17848', shirt: '#2b2b30', pants: '#3b3f50', shoe: '#2a2320', eye: .95, w: 22, wf: 13, a1: 24, a2: 24, top: 'crew', hair: 'curly', curl: .22, hairC: '#21170f', beard: '#5f4030', smile: 'big', browW: 5.4, watch: true, ring: true, img: 'assets/baba_cartoon.jpg', abilities: ['dad'], ability: 'بابا', badge: ['ب', '#555a6b'], playable: false, speed: 200 },
    /* ---- extended family (owner's edition only; tools/family/build.js strips these rows). All playable:false. Extra flags: phone/spoon/car/backpack/apron = props, idle = default idle pose, bow/quiff/part/fringe = hair details, fidget/curious = idle behaviour ---- */
    ofa: { name: 'أوفا', gender: 'm', age: 10, sc: .98, L: 54, T: 56, R: 28, hr: .95, sw: 21, skin: '#d79a68', skinD: '#c0834f', shirt: '#3fae6a', pants: '#4a5f8c', shoe: '#f3eee2', eye: 1.02, w: 19, wf: 12, a1: 24, a2: 24, top: 'crew', hair: 'short', hairC: '#2a1a10', fringe: true, smile: 'big', abilities: ['cousin', 'friendly'], ability: 'ابن عمتهم المرح', badge: ['أ', '#3fae6a'], playable: false, speed: 230 },
    toti: { name: 'توتي', gender: 'f', age: 4, sc: .62, L: 38, T: 40, R: 34, hr: 1.0, sw: 21, skin: '#e0a577', skinD: '#c98d5f', shirt: '#ff7fb0', trim: '#ffffff', belt: '#ffd23c', pants: '#e0a577', legC: '#e0a577', legW: 13, shoe: '#e5534b', eye: 1.25, w: 16, wf: 11, a1: 18, a2: 18, top: 'dress', hair: 'pigtails', hairC: '#2b1a12', tie: '#ff4a86', bow: '#ff4a86', lash: true, smile: 'big', fidget: true, abilities: ['naughty', 'tiny'], ability: 'شقية وبتحب نيمو', badge: ['ت', '#ff7fb0'], playable: false, speed: 190 },
    amani: { name: 'عمتو أماني', gender: 'f', age: 42, sc: .96, L: 48, T: 56, R: 29, hr: .97, sw: 22, skin: '#dca878', skinD: '#c6905f', shirt: '#7fb08f', flowers: ['#ffffff', '#f2c14e', '#e07a5f'], pants: '#dca878', legC: '#dca878', legW: 11, shoe: '#8a5a44', eye: .97, w: 20, wf: 11, a1: 22, a2: 22, top: 'floral', hair: 'scarf', scarf: '#e0825e', apron: '#fff7e6', apronTrim: '#e5534b', spoon: true, lash: true, smile: 'big', abilities: ['cook', 'kind'], ability: 'بتحب الطبخ', badge: ['أ', '#e0825e'], playable: false, speed: 170 },
    nada: { name: 'عمتو ندى', gender: 'f', age: 38, sc: 1, L: 54, T: 55, R: 28, hr: .95, sw: 20, skin: '#d9a070', skinD: '#c28858', shirt: '#4b86a8', skirt: '#2f3d5c', keepSkirt: true, pants: '#d9a070', legC: '#d9a070', legW: 11, shoe: '#f2ece4', eye: 1.0, w: 17, wf: 11, a1: 18, a2: 18, top: 'blouse', sleeveLong: true, ruffle: '#3a6f8e', hair: 'scarf', scarf: '#d8c3b0', under: '#4b86a8', lash: true, phone: true, idle: 'phone', abilities: ['phone'], ability: 'دايمًا في الموبايل', badge: ['ن', '#4b86a8'], playable: false, speed: 190 },
    beno: { name: 'بينو', gender: 'm', age: 15, sc: 1.1, L: 55, T: 56, R: 27.5, hr: .93, sw: 21, skin: '#cf935f', skinD: '#b87d4b', shirt: '#4a4f6a', pants: '#2b2f3a', shoe: '#ffffff', eye: .95, w: 20, wf: 12, a1: 22, a2: 22, top: 'hoodie', hair: 'short', hairC: '#1e130c', quiff: true, neckPhones: '#3b3b46', abilities: ['teen'], ability: 'مراهق رياضي', badge: ['ب', '#4a4f6a'], playable: false, speed: 240 },
    medo: { name: 'ميدو', gender: 'm', age: 18, sc: 1.2, L: 60, T: 60, R: 28, hr: .92, sw: 23, skin: '#c98b58', skinD: '#b27546', shirt: '#8a3b3b', pants: '#3d4a5e', shoe: '#2a2320', eye: .93, w: 22, wf: 13, a1: 24, a2: 24, top: 'crew', hair: 'short', hairC: '#17100b', glasses: '#2a2a2f', backpack: '#35507a', abilities: ['teen', 'tall'], ability: 'طويل ودحيح', badge: ['م', '#8a3b3b'], playable: false, speed: 240 },
    kamal: { name: 'عمو كمال', gender: 'm', age: 34, sc: 1.18, L: 58, T: 62, R: 28, hr: .95, sw: 23, skin: '#c98f5f', skinD: '#b17848', shirt: '#6ea0d6', pants: '#bfae8a', shoe: '#5a3c28', eye: .97, w: 22, wf: 13, a1: 24, a2: 24, top: 'polo', hair: 'short', hairC: '#1a120d', part: true, smile: 'big', browW: 4.6, watch: true, ring: true, abilities: ['uncle'], ability: 'عمو مسافر', badge: ['ك', '#6ea0d6'], playable: false, speed: 200 },
    luka: { name: 'لوكا', gender: 'm', age: 4, sc: .56, L: 36, T: 38, R: 34, hr: 1.0, sw: 20, skin: '#e0a272', skinD: '#c98a5c', shirt: '#ff9a3c', pants: '#4f78b8', shoe: '#ffffff', eye: 1.3, w: 17, wf: 11, a1: 18, a2: 18, top: 'crew', hair: 'curly', curl: .3, hairC: '#2b1a12', car: true, curious: true, smile: 'big', abilities: ['tiny', 'curious'], ability: 'فضولي وبيحب العربيات', badge: ['ل', '#ff9a3c'], playable: false, speed: 170 }
  };
  /* ---- "v4" polish (cel-3D, same family as the v3 girls): optional fields ONLY, added on top of the rows above (guarded: the family edition strips rows).
     v4:true -> v3 face geometry + round-iris eyes (eyeK: 'boy' lashless | 'man' | 'woman' | 'girl'), tapered limbs with sleeve / pants cuffs, shaped hands with thumbs, sneaker / flat / dress shoes (shoeK),
     shaped torso, richer curls (curly4) / hair shading, v3-style scarf for aunts + nana, lips, smile lines (lines), poise (idle posture: head / rot / sh / arm). Nothing here renames or removes a field. ---- */
  const V4P = {
    moody: { eyeK: 'boy', browK: 1.05, mw: .84, shoeK: 'sneaker', shoeAcc: '#efe3c8', hemC: '#c8922a', poise: { head: -.012, rot: -.004, sh: .3 }, iris: '#4e2b17', blush: .2 },
    aboody: { eyeK: 'boy', browK: .95, mw: .86, shoeK: 'sneaker', shoeAcc: '#26396e', hemC: '#b3a07a', poise: { head: .02, rot: .006, sh: .5, arm: 4 }, iris: '#4e2b17', blush: .24 },
    baba: { eyeK: 'man', browK: 1.25, mw: .8, mouthY: .8, soft: true, lips: true, shoeK: 'sneaker', shoeAcc: '#d9d4cc', lines: 1, hemC: '#2a2c36', beardHi: '#9a7a5c', poise: { head: -.018, rot: -.003, sh: .8 }, iris: '#4a2814', blush: .1 },
    nana: { eyeK: 'woman', browK: .8, mw: .8, lips: true, shoeK: 'flat', lines: 2, glassW: 1.8, poise: { head: .03, rot: .004, sh: -.4 }, iris: '#5a3a24', scarfDots: '#ff6f91', blush: .22 },
    ofa: { hairSt: 'part', eyeK: 'boy', browK: .95, mw: .86, shoeK: 'sneaker', shoeAcc: '#3fae6a', hemC: '#35507a', poise: { head: .01, rot: .005, sh: .3 }, iris: '#4e2b17', blush: .2 },
    toti: { eyeK: 'girl', browK: .8, mw: .84, shoeK: 'mary', shoeAcc: '#ffffff', poise: { head: .05, rot: .008, sh: .6, arm: 5 }, iris: '#5a331c', blush: .3 },
    amani: { eyeK: 'woman', browK: .85, mw: .8, lips: true, shoeK: 'flat', lines: 1, poise: { head: .025, rot: .002, sh: .2 }, iris: '#5a3a24', blush: .22, pin: '#e8c45a' },
    nada: { eyeK: 'woman', browK: .85, mw: .78, lips: true, shoeK: 'flat', lines: 1, poise: { head: .02, rot: .003, sh: .3 }, iris: '#5a3a24', blush: .18, pin: '#d9c4a4' },
    beno: { stoop: .02, eyeK: 'boy', browK: 1.1, mw: .8, shoeK: 'sneaker', shoeAcc: '#14161d', hemC: '#2b2f3a', poise: { head: .03, rot: .012, sh: -.8, arm: -3 }, iris: '#4a2814', blush: .12 },
    medo: { stoop: .025, eyeK: 'boy', browK: 1.1, mw: .8, shoeK: 'sneaker', shoeAcc: '#e8e4dc', hemC: '#3d4a5e', glassW: 2.7, poise: { head: .035, rot: .01, sh: -.9, arm: -3 }, iris: '#4a2814', blush: .1 },
    kamal: { eyeK: 'man', browK: 1.1, mw: .8, soft: true, lips: true, shoeK: 'dress', lines: 1, hemC: '#a89a78', poise: { head: -.015, rot: -.003, sh: .8 }, iris: '#4a2814', blush: .1 },
    luka: { eyeK: 'boy', browK: .8, mw: .88, shoeK: 'sneaker', shoeAcc: '#ff9a3c', hemC: '#3a5a98', poise: { head: .02, rot: .006, sh: .4 }, iris: '#4e2b17', blush: .26 }
  };
  Object.keys(V4P).forEach(k => { const d = DEFS[k]; if (!d) return; d.v4 = true; Object.keys(V4P[k]).forEach(f => { if (d[f] === undefined) d[f] = V4P[k][f]; }); });

  const C = M.chars = { defs: DEFS, hats: {}, shirts: {} };
  C.gender = id => (DEFS[id] && DEFS[id].gender) || 'm';   // 'm' | 'f' - the ONLY thing the dressing rooms / outfit items look at (never a name)
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
    const k = id + '|' + shirtC + '|' + (d._ps || ''); if (PALS[k]) return PALS[k];
    const hc = d.hairC || HAIR;
    return (PALS[k] = { skin: d.skin, skinL: mixc(d.skin, '#fff0dc', .36), skinS: mixc(d.skinD || d.skin, '#9a2f2a', .3), skinD: d.skinD || d.skin, hair: hc, hairL: mixc(hc, '#d9aa80', .34), hairD: mixc(hc, '#000', .38), shirt: shirtC, shirtL: lite(shirtC, .22), shirtD: dark(shirtC, .22),
      pants: d.pants, pantsL: lite(d.pants, .2), pantsD: dark(d.pants, .24), legC: d.legC || d.pants, shoe: d.shoe, iris: d.iris || '#5a331c', brow: d.v4 ? (d.eyeK === 'man' ? '#1f140d' : d.eyeK === 'woman' && d.age > 60 ? '#6a5a52' : '#2a190e') : d.hair === 'curly' && d.beard ? '#120d0a' : '#2e1b10', lip: mixc(d.skin, '#b5443f', .55), lipD: mixc(d.skinD || d.skin, '#6e2a2a', .55) });
  }
  const SPRS = {};   // key -> sprite set
  const LEVELS = [.5, .75, 1, 1.5, 2, 3, 4];
  function pickLevel(s) { for (let i = 0; i < LEVELS.length; i++) if (LEVELS[i] >= s * .92) return LEVELS[i]; return 4; }

  /* ================= BAKED LAYERS ================= */
  const isDressy = d => d.top === 'dress' || d.top === 'floral' || d.top === 'blouse' || d.top === 'cardigan' || (d.top === 'hoodie' && !!d.skirt) || !!d.skOn;   // skOn = outfit system: a skirt / dress / robe is worn
  function skirtGeo(d) { const L = d.L, T = d.T, sw = d.sw; let r; if (d.top === 'cardigan') r = { wy: -L - T * .12, hemY: -L * .2, hw0: sw * .92, hw1: sw + 13 }; else if (d.top === 'hoodie') r = { wy: -L - T * .12, hemY: -L * .46, hw0: sw * .92, hw1: sw + 11 }; else r = { wy: -L - T * .12, hemY: d.top === 'floral' ? -L * .16 : -L * .5, hw0: sw * .92, hw1: sw + (d.top === 'floral' ? 15 : d.top === 'blouse' ? 8 : 17) }; if (d.skHem != null) r.hemY = -L * d.skHem; if (d.skFlare != null) r.hw1 = sw + d.skFlare; return r; }
  /* face geometry (eye x / y / radius, glasses radius): the v3 girls (toota, nemo) get larger, lower-set eyes */
  const NV = d => d.v3 || d.v4;   // any 'new-look' character (v3 girls, v4 polish)
  const FG = d => { const R = d.R, rx = R * d.hr; if (d.v4) { const er = R * (d.eyeK === 'man' ? .205 : d.eyeK === 'woman' ? .21 : .225) * d.eye; return { ex: rx * .45, ey: R * .21, er, gr: er * 1.5 }; } if (d.v3) { const er = R * .225 * d.eye; return { ex: rx * .45, ey: R * .21, er, gr: er * 1.5 }; } const er = R * .2 * d.eye; return { ex: rx * .42, ey: R * .2, er, gr: er * 1.55 }; };
  function star5(g, x, y, r, col, lw) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .46 : r; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } }
  function heart5(g, x, y, r, col, lw) { g.beginPath(); g.moveTo(x, y + r * .9); g.bezierCurveTo(x - r * 1.5, y - r * .1, x - r * .7, y - r * 1.1, x, y - r * .35); g.bezierCurveTo(x + r * .7, y - r * 1.1, x + r * 1.5, y - r * .1, x, y + r * .9); g.fillStyle = col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = OL; g.stroke(); } }

  /* v4 torso: rounded shoulders that slope into the arms and a slightly narrower waist (instead of a plain rounded box) */
  function torsoPath4(x, y, w, h, n) {
    const p = new Path2D(), r1 = Math.min(15, w * .3), r2 = 8; p.moveTo(x + r1, y); p.lineTo(x + w - r1, y); p.quadraticCurveTo(x + w, y, x + w, y + r1 * 1.1);
    p.bezierCurveTo(x + w, y + h * .32, x + w - n, y + h * .56, x + w - n, y + h - r2); p.quadraticCurveTo(x + w - n, y + h, x + w - n - r2, y + h); p.lineTo(x + n + r2, y + h); p.quadraticCurveTo(x + n, y + h, x + n, y + h - r2);
    p.bezierCurveTo(x + n, y + h * .56, x, y + h * .32, x, y + r1 * 1.1); p.quadraticCurveTo(x, y, x + r1, y); p.closePath(); return p;
  }
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
          if (C.deco && d._fit) C.deco.skirt(gg, d, { hw0, hw1, wy, hemY });
          if (d.stripes) { gg.fillStyle = d.stripes; [.28, .62].forEach(k => gg.fillRect(-hw1, wy + (hemY - wy) * k, hw1 * 2, 7)); }
          if (d.flowers) { for (let i = 0; i < 9; i++) { const fx = -hw1 + (i * 37) % (hw1 * 2), fy = wy + 8 + ((i * 53) % Math.max(8, hemY - wy - 12)); dot(gg, fx, fy, 3.4, d.flowers[i % d.flowers.length]); dot(gg, fx, fy, 1.1, '#ffe14d'); dot(gg, fx - 1.2, fy - 1.2, 1, 'rgba(255,255,255,.55)'); } }
          for (let k = 1; k <= 5; k++) { const a = -hw0 + hw0 * 2 * k / 6, b = a * hw1 / hw0; fold(gg, a, wy + 2, a * 1.04, (wy + hemY) / 2, b * 1.06, hemY + 3, 3.2, .14); }
          if (d.stitch) { gg.save(); gg.setLineDash([3.4, 2.6]); gg.lineWidth = 1.2; gg.strokeStyle = 'rgba(255,255,255,.7)'; gg.beginPath(); gg.moveTo(-hw1, hemY - 6); gg.quadraticCurveTo(0, hemY + 1, hw1, hemY - 6); gg.stroke(); gg.beginPath(); gg.moveTo(-hw0, wy + 6); gg.lineTo(hw0, wy + 6); gg.stroke(); gg.restore(); gg.fillStyle = 'rgba(255,255,255,.18)'; gg.fillRect(-hw1, hemY - 12, hw1 * 2, 3); }
          if (d.top === 'cardigan') { gg.fillStyle = d.belt || '#c25a7e'; gg.fillRect(-hw1, hemY - 5.5, hw1 * 2, 3); gg.fillStyle = 'rgba(255,255,255,.35)'; gg.fillRect(-hw1, hemY - 5.5, hw1 * 2, 1); }
        });
        g.beginPath(); g.moveTo(-hw1 + 3, hemY + 1); g.quadraticCurveTo(0, hemY + 8, hw1 - 3, hemY + 1); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.28)'; g.stroke();   // hem edge light
      }
      /* torso */
      const TP = d.v4 ? torsoPath4(tx, ty, tw, thh, dressy ? 0 : 2.2) : pRR(tx, ty, tw, thh, 9);
      part(g, TP, shirtC, [tx, ty, tx + tw, ty + thh], { hi: .22, sh: .36, spec: .22, sy: .22, off: 10, blur: 8, rim: .3 }, 3.5, gg => {
        if (d.top === 'vneck') { gg.fillStyle = 'rgba(255,255,255,.92)'; for (let yy = 0; yy < th + 6; yy += 8) for (let xx = (yy / 8 % 2) * 4; xx < tw; xx += 8) { gg.beginPath(); gg.arc(tx + xx + 2, ty + yy + 3, 1.5, 0, 6.3); gg.fill(); } }
        if (d.stripes && dressy) { gg.fillStyle = d.stripes; gg.fillRect(tx, ty + th * .34, tw, 7); }
        if (d.flowers && d.top === 'floral') { for (let i = 0; i < 8; i++) { const fx = tx + (i * 29) % tw, fy = ty + 6 + (i * 41) % (th - 20); dot(gg, fx, fy, 3.1, d.flowers[i % 3]); dot(gg, fx - 1, fy - 1, 1, 'rgba(255,255,255,.5)'); } }
        if (C.deco && d._fit) C.deco.torso(gg, d, { tx, ty, tw, th, thh, sw, L, T, sk, dressy });
        fold(gg, tx + 2, ty + 12, tx + 9, ty + 20, tx + 14, ty + 34, 3.4, .16); fold(gg, tx + tw - 2, ty + 12, tx + tw - 9, ty + 20, tx + tw - 14, ty + 34, 3.4, .2);   // armpit creases
        if (!dressy) { fold(gg, tx + 4, ty + thh * .72, 0, ty + thh * .76, tx + tw - 4, ty + thh * .72, 3, .11); fold(gg, tx + 6, ty + thh - 7, 0, ty + thh - 4, tx + tw - 6, ty + thh - 7, 2.6, .12); }
        else fold(gg, tx + 4, ty + thh - 9, 0, ty + thh - 6, tx + tw - 4, ty + thh - 9, 2.6, .12);
        const ch = gg.createRadialGradient(tx + tw * (LX < 0 ? .34 : .66), ty + 14, 0, tx + tw * .5, ty + 20, tw * .6); ch.addColorStop(0, 'rgba(255,255,255,.12)'); ch.addColorStop(1, 'rgba(255,255,255,0)'); gg.fillStyle = ch; gg.fillRect(tx, ty, tw, thh);
        const cs = gg.createLinearGradient(0, ty, 0, ty + 16); cs.addColorStop(0, 'rgba(40,10,30,.3)'); cs.addColorStop(1, 'rgba(40,10,30,0)'); gg.fillStyle = cs; gg.fillRect(tx, ty, tw, 16);   // collar-line shadow
      });
      if (d.v3 && d.top === 'cardigan') {   // longline cardigan / abaya-style jacket: two flared front panels over the cream inner dress
        const hy2 = -L * .5, pl = new Path2D(); pl.moveTo(-sw + 1, -L - 14); pl.lineTo(-3, -L - 14); pl.bezierCurveTo(-4, -L + 2, -5, -L + 14, -6, hy2); pl.quadraticCurveTo(-sw - 1, hy2 + 5, -sw - 6, hy2 - 1); pl.bezierCurveTo(-sw - 5, -L * .85, -sw - 1, -L - 4, -sw + 1, -L - 14); pl.closePath();
        [-1, 1].forEach(s2 => { g.save(); g.scale(s2, 1); const lxb = LX; LX = LX * s2; part(g, pl, shirtC, [-sw - 10, -L - 14, -3, hy2 + 6], { hi: .2, sh: .4, spec: .16, off: 7, blur: 7, rim: .26 }, 3.3, gg => { fold(gg, -sw * .8, -L - 4, -sw * .95, -L * .7, -sw - 4, hy2 - 2, 3, .14); fold(gg, -sw * .35, -L - 2, -sw * .4, -L * .6, -sw * .5, hy2 - 3, 2.6, .1); }); g.beginPath(); g.moveTo(-3, -L - 14); g.bezierCurveTo(-4, -L + 2, -5, -L + 14, -6, hy2); g.lineWidth = 3; g.strokeStyle = d.cuff || '#fbf3ea'; g.stroke(); LX = lxb; g.restore(); });
      }
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
        part(g, pRR(-sw + 4, ty + th * (d.v3 ? .46 : .5), tw - 8, th * (d.v3 ? .3 : .36), 8), dark(tl, .08), [-sw + 4, ty + th * .5, sw - 4, ty + th * .86], { hi: .14, sh: .3, crescent: .3, spec: 0, rim: 0 }, 2.8);
        g.beginPath(); g.moveTo(-sw + 10, ty + th * (d.v3 ? .48 : .52)); g.lineTo(-4, ty + th * (d.v3 ? .6 : .66)); g.moveTo(sw - 10, ty + th * (d.v3 ? .48 : .52)); g.lineTo(4, ty + th * (d.v3 ? .6 : .66)); g.lineWidth = 1.6; g.strokeStyle = 'rgba(0,0,0,.22)'; g.stroke();   // pocket opening
        if (d.v3) { part(g, pRR(-sw + 1, ty + thh - 7, tw - 2, 7, 3), lite(tl, .08), [-sw, ty + thh - 7, sw, ty + thh], { hi: .12, sh: .3, crescent: .25, spec: 0, rim: 0 }, 2.4); for (let xx = -sw + 5; xx < sw - 2; xx += 4) line(g, xx, ty + thh - 6, xx, ty + thh - 1.5, 1, 'rgba(120,30,70,.16)'); }
        [-1, 1].forEach(s => { line(g, s * 5, ty + 6, s * 6, ty + 24, 2.8, OL); line(g, s * 5, ty + 6, s * 6, ty + 24, 1.8, '#fff'); if (d.v3 && d.charm) { (s < 0 ? star5 : heart5)(g, s * 6, ty + 27, 4.4, s < 0 ? d.charm : '#ff7fae', 1.6); } else bead(g, s * 6, ty + 25, 1.7, '#fff', 1); });
        part(g, pEll(0, ty + 3, 14, 6), dark(tl, .12), [-14, ty - 3, 14, ty + 9], { hi: .1, sh: .4, crescent: .3, rim: 0, spec: 0 }, 2.8);
      } else if (d.top === 'crew') {
        part(g, pEll(0, ty + 2, 11, 5.5), d.skin, [-11, ty - 4, 11, ty + 8], { hi: .05, sh: .38, tint: '120,40,30', crescent: .3, rim: 0, spec: 0 }, 2.8);
        g.beginPath(); g.ellipse(0, ty + 2, 12, 6, 0, 0, Math.PI); g.lineWidth = 3.4; g.strokeStyle = lite(tl, .15); g.stroke(); g.beginPath(); g.ellipse(0, ty + 3.4, 11.4, 5.4, 0, .1, Math.PI - .1); g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.18)'; g.stroke();
      } else if (d.top === 'cardigan') {
        part(g, pPoly([[-10, ty + 1], [10, ty + 1], [0, ty + 30]]), d.cuff || '#fbf3ea', [-10, ty, 10, ty + 30], { hi: .1, sh: .3, crescent: .3, rim: 0, spec: 0 }, 2.6);
        [[[-10, ty + 1], [-18, ty + 3], [0, ty + 30]], [[10, ty + 1], [18, ty + 3], [0, ty + 30]]].forEach(pts => part(g, pPoly(pts), lite(tl, .06), [-18, ty, 18, ty + 30], c15, 2.6));
        part(g, pRR(-sw, ty + thh - 10, tw, 7, 3), d.belt || '#c25a7e', [-sw, ty + thh - 10, sw, ty + thh - 3], { hi: .22, sh: .3, crescent: .2, rim: 0, spec: .2 }, 2.4); bead(g, 0, ty + thh - 6.5, 3.4, '#e2b05c', 1.4);
      } else if (d.top === 'blouse') {
        part(g, pEll(0, ty + 3, 12, 5), lite(tl, .12), [-12, ty - 2, 12, ty + 8], { hi: .1, sh: .3, crescent: .25, rim: 0, spec: 0 }, 2.8);
        [-1, 1].forEach(s2 => { const rp = pCirc(s2 * (sw - 3), ty + 5, 5.5); part(g, rp, d.ruffle || tl, [s2 * (sw - 3) - 6, ty - 1, s2 * (sw - 3) + 6, ty + 11], { hi: .2, sh: .34, spec: .2, rim: 0 }, 2.2); });
        line(g, 0, ty + 8, 0, ty + th - 14, 1.6, 'rgba(0,0,0,.2)'); part(g, pRR(-sw, ty + th - 14, tw, 6, 2), dark(tl, .12), [-sw, ty + th - 14, sw, ty + th - 8], { hi: .12, sh: .3, crescent: .2, rim: 0, spec: 0 }, 2.4);
      } else if (dressy) {
        if (d.trim && d.top === 'dress' && !d.stripes) { part(g, pEll(0, ty + 3, 13, 6), d.trim, [-13, ty - 3, 13, ty + 9], { hi: .1, sh: .3, crescent: .25, rim: 0, spec: 0 }, 2.8); part(g, pRR(-sw, ty + th - 22, tw, 8, 2), d.belt || '#ffd23c', [-sw, ty + th - 22, sw, ty + th - 14], { hi: .22, sh: .3, crescent: .2, rim: 0, spec: .2 }, 2.8); bead(g, 0, ty + th - 18, 3.4, '#fff', 1.4); }
        else if (d.top === 'floral') { part(g, pEll(0, ty + 3, 12, 6), '#fff', [-12, ty - 3, 12, ty + 9], { hi: .05, sh: .22, crescent: .2, rim: 0, spec: 0 }, 2.8); bead(g, 0, ty + 18, 2.5, '#ffd23c'); bead(g, 0, ty + 30, 2.5, '#ffd23c'); }
        else part(g, pEll(0, ty + 3, 12, 6), d.trim || '#fff', [-12, ty - 3, 12, ty + 9], { hi: .05, sh: .22, crescent: .2, rim: 0, spec: 0 }, 2.8);
      }
      if (C.deco && d._fit) C.deco.body(g, d, { tx, ty, tw, th, thh, sw, L, T, sk, dressy });
      if (d.backpack && d.v4) {   // padded shoulder straps with stitching + sternum strap and buckle
        const bc = d.backpack;
        [-1, 1].forEach(s2 => { const p = new Path2D(); p.moveTo(s2 * (sw - 11), ty + 1); p.lineTo(s2 * (sw - 2), ty + 1); p.bezierCurveTo(s2 * (sw - 1), ty + 18, s2 * (sw - 1), ty + th * .5, s2 * (sw - 3), ty + th - 11); p.lineTo(s2 * (sw - 11), ty + th - 11); p.bezierCurveTo(s2 * (sw - 9), ty + th * .5, s2 * (sw - 11), ty + 18, s2 * (sw - 11), ty + 1); p.closePath();
          part(g, p, dark(bc, .18), [s2 * (sw - 11), ty, s2 * (sw - 1), ty + th - 10], { hi: .2, sh: .3, spec: .1, rim: 0, crescent: .25 }, 2.6, gg => { gg.save(); gg.setLineDash([2.6, 2.2]); gg.lineWidth = 1; gg.strokeStyle = 'rgba(255,255,255,.4)'; gg.beginPath(); gg.moveTo(s2 * (sw - 9.2), ty + 3); gg.bezierCurveTo(s2 * (sw - 9), ty + 20, s2 * (sw - 9.5), ty + th * .5, s2 * (sw - 5.5), ty + th - 13); gg.stroke(); gg.restore(); }); });
        part(g, pRR(-sw + 10, ty + 20, sw * 2 - 20, 4.2, 2), dark(bc, .1), [-sw + 10, ty + 20, sw - 10, ty + 24], { hi: .2, sh: .3, spec: 0, rim: 0 }, 1.8); bead(g, 0, ty + 22, 2.8, '#d9d4cc', 1.3);
      } else if (d.backpack) { [-1, 1].forEach(s2 => { line(g, s2 * (sw - 6), ty + 1, s2 * (sw - 8), ty + th - 12, 7.5, OL); line(g, s2 * (sw - 6), ty + 1, s2 * (sw - 8), ty + th - 12, 4.4, dark(d.backpack, .25)); line(g, s2 * (sw - 6) + LX * 1, ty + 3, s2 * (sw - 8) + LX * 1, ty + th - 14, 1.2, 'rgba(255,255,255,.25)'); }); }
      if (d.apron) {   // cooking apron: bib + neck strap + skirt panel + pocket
        const ac = d.apron, at = d.apronTrim || '#e5534b', ay = ty + 12, p = new Path2D(); p.moveTo(-9, ty + 1); p.lineTo(9, ty + 1); p.lineTo(sw - 5, ay + 6); p.lineTo(sw - 3, ty + th + 22); p.lineTo(-sw + 3, ty + th + 22); p.lineTo(-sw + 5, ay + 6); p.closePath();
        part(g, p, ac, [-sw, ty, sw, ty + th + 22], { hi: .2, sh: .3, spec: .14, off: 8, blur: 7 }, 3, gg => { fold(gg, -8, ay + 14, -10, ay + 30, -12, ty + th + 14, 3, .1); fold(gg, 8, ay + 14, 10, ay + 30, 12, ty + th + 14, 3, .12); });
        g.beginPath(); g.moveTo(-9, ty + 1); g.lineTo(9, ty + 1); g.lineWidth = 3; g.strokeStyle = at; g.stroke(); part(g, pRR(-sw + 3, ty + th + 14, sw * 2 - 6, 8, 2), at, [-sw, ty + th + 14, sw, ty + th + 22], { hi: .2, sh: .3, spec: 0, rim: 0 }, 2.2);
        if (d.v4) {   // patch pocket with a trim hem, stitching and a little embroidered heart
          const pp = new Path2D(); pp.moveTo(-11, ty + th - 16); pp.lineTo(11, ty + th - 16); pp.lineTo(11, ty + th - 4); pp.quadraticCurveTo(11, ty + th + 2, 5, ty + th + 2); pp.lineTo(-5, ty + th + 2); pp.quadraticCurveTo(-11, ty + th + 2, -11, ty + th - 4); pp.closePath();
          part(g, pp, dark(ac, .05), [-11, ty + th - 16, 11, ty + th + 2], { hi: .14, sh: .26, spec: 0, rim: 0, crescent: .3 }, 2.4, gg => { gg.fillStyle = at; gg.fillRect(-12, ty + th - 16, 24, 4); gg.fillStyle = 'rgba(255,255,255,.35)'; gg.fillRect(-12, ty + th - 16, 24, 1); gg.save(); gg.setLineDash([2.4, 2]); gg.lineWidth = 1; gg.strokeStyle = 'rgba(120,80,60,.45)'; gg.beginPath(); gg.moveTo(-8.5, ty + th - 10.5); gg.lineTo(-8.5, ty + th - 3); gg.quadraticCurveTo(-8.5, ty + th - .2, -5, ty + th - .2); gg.lineTo(5, ty + th - .2); gg.quadraticCurveTo(8.5, ty + th - .2, 8.5, ty + th - 3); gg.lineTo(8.5, ty + th - 10.5); gg.stroke(); gg.restore(); heart5(gg, 0, ty + th - 5.4, 2.6, at, 0); });
        } else { part(g, pRR(-9, ty + th - 14, 18, 15, 3), 'rgba(0,0,0,.05)', [-9, ty + th - 14, 9, ty + th + 1], { hi: .12, sh: .25, spec: 0, rim: 0, crescent: .25 }, 2.4); dot(g, 0, ty + th - 6, 2.2, at); }
        line(g, -9, ty + 1, -17, ty - 5, 3, at); line(g, 9, ty + 1, 17, ty - 5, 3, at);
      }
      if (d.bag) { line(g, -sw + 3, ty + 2, sw - 3, ty + th - 10, 6.5, OL); line(g, -sw + 3, ty + 2, sw - 3, ty + th - 10, 3.6, d.bag); line(g, -sw + 3 + LX * 1, ty + 1, sw - 3 + LX * 1, ty + th - 11, 1.1, 'rgba(255,255,255,.35)'); part(g, pRR(sw - 14, ty + th - 22, 22, 18, 4), d.bag, [sw - 14, ty + th - 22, sw + 8, ty + th - 4], { hi: .22, sh: .34, rim: .2 }, 2.8); line(g, sw - 12, ty + th - 17, sw + 6, ty + th - 17, 2, 'rgba(0,0,0,.25)'); bead(g, sw - 3, ty + th - 17, 1.8, '#e8d9b8', 1); }
      if (d.neckPhones) {
        const pc = d.neckPhones; g.beginPath(); g.moveTo(-15, ty - 4); g.quadraticCurveTo(0, ty + 20, 15, ty - 4); g.lineWidth = 9; g.strokeStyle = OL; g.stroke(); g.lineWidth = 5; g.strokeStyle = pc; g.stroke(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-14, ty - 5); g.quadraticCurveTo(0, ty + 17, 14, ty - 5); g.stroke();
        [-1, 1].forEach(s2 => { if (d.bunny && !d.v3) { g.save(); g.translate(s2 * (d.v3 ? 17 : 17), ty + (d.v3 ? 9 : 4)); g.rotate(s2 * (d.v3 ? .5 : .35)); const bk = d.v3 ? .6 : 1; part(g, pEll(0, -15 * bk, 4.2 * bk, 10 * bk), pc, [-5, -26 * bk, 5, -4], { hi: .2, sh: .25, rim: 0, spec: 0 }, 2.4); G.ell(g, 0, -15 * bk, 1.8 * bk, 6 * bk, '#ff9ec0', 0); g.restore(); } part(g, pCirc(s2 * 15, ty + 12, d.v3 ? 8.4 : 10), pc, [s2 * 15 - 10, ty + 2, s2 * 15 + 10, ty + 22], { hi: .25, sh: .35, spec: .3 }, 3); part(g, pCirc(s2 * 15, ty + 12, d.v3 ? 4.2 : 5), dark(pc, .12), [s2 * 15 - 5, ty + 7, s2 * 15 + 5, ty + 17], { hi: .1, sh: .3, spec: 0, rim: 0 }, 1.6); if (d.bunny) G.ell(g, s2 * 15, ty + 12, 2.2, 3.2, '#6fd0ff', 0); });
      }
      if (d.v3 && d.charm && d.top === 'hoodie') {   // little star charm clipped to the skirt belt
        const cx0 = sw - 4, cy0 = sk.wy + 5; g.beginPath(); g.moveTo(cx0, cy0); g.quadraticCurveTo(cx0 + 6, cy0 + 8, cx0 + 3, cy0 + 15); g.lineWidth = 1.6; g.strokeStyle = '#d9c7a0'; g.stroke(); star5(g, cx0 + 3, cy0 + 19, 6.2, d.charm, 2); dot(g, cx0 + 1.4, cy0 + 17, 1.3, 'rgba(255,255,255,.8)');
      }
      /* neck (with chin shadow) */
      part(g, pRR(-7, ty - 8, 14, 12, 4), d.skin, [-7, ty - 8, 7, ty + 4], { hi: .12, sh: .34, tint: '120,40,30', rim: 0, spec: 0, crescent: .25, blur: 3, off: 3 }, 3, gg => { const cs = gg.createLinearGradient(0, ty - 8, 0, ty + 1); cs.addColorStop(0, 'rgba(110,40,25,.5)'); cs.addColorStop(1, 'rgba(110,40,25,0)'); gg.fillStyle = cs; gg.fillRect(-8, ty - 9, 16, 12); });
      if (C.deco && d._fit) C.deco.after(g, d, { tx, ty, tw, th, thh, sw, L, T, sk, dressy });
    });
  }

  function bakeShoe(d, pal, id, lvl) {
    return mkSpr(-17, -11, 17, 11, lvl, g => {
      const P = pEll(0, 0, 12, 6.5); part(g, P, pal.shoe, [-12, -6.5, 12, 6.5], { hi: .3, sh: .38, spec: .3, sx: .25, sy: .25, crescent: .3, off: 3, blur: 3, rimW: 1.6, rimD: 1.4 }, 3.2);
      g.save(); g.clip(P); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-14, 3, 28, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-14, 3.4, 28, 1.2);
      if (d.v3 && d.shoeAcc) {   // girly flat / sneaker details
        const ac = d.shoeAcc; g.fillStyle = ac; g.beginPath(); g.ellipse(7.6, .4, 5.2, 5.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(6.6, -1.8, 2.4, 1.4, -.4, 0, TAU); g.fill();   // toe cap
        if (id === 'nemo') { g.fillStyle = ac; g.fillRect(-12.5, -3.6, 5, 7); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = .9; [-4.4, -1.8].forEach(xx => { g.beginPath(); g.moveTo(xx, -4.6); g.lineTo(xx + 2.6, -2.4); g.stroke(); }); }
        else { g.strokeStyle = ac; g.lineWidth = 2; g.beginPath(); g.moveTo(-3, -6.6); g.quadraticCurveTo(-1, -.5, -3.4, 6.6); g.stroke(); dot(g, -2, -.4, 1.5, '#f3d9a0'); }
      }
      g.restore();
      if (id === 'aboody') G.ell(g, 1, 2, 9, 2.2, '#d9d1bd', 0);
    });
  }

  /* v4 hand: mitten palm + thumb on the inner side (baked per side) + finger creases; origin = palm centre, hanging pose (rotated live along the forearm) */
  function bakeHand4(d, pal, lvl, side) {
    const r = d.wf * .66; return mkSpr(-r - 6, -r - 6, r + 6, r + 7, lvl, g => {
      const inn = -side, ov = { hi: .28, sh: .4, tint: '120,40,30', spec: .3, crescent: .3, off: r * .25, blur: r * .35, rim: .35, rimW: 1.4, rimD: 1 };
      g.save(); g.translate(inn * r * .72, -r * .05); g.rotate(inn * -.42); part(g, pEll(0, 0, r * .34, r * .58), d.skin, [-r * .34, -r * .58, r * .34, r * .58], ov, 2.8); g.restore();
      part(g, pEll(0, r * .12, r * .84, r * .98), d.skin, [-r * .84, -r * .86, r * .84, r * 1.1], ov, 3, gg => { gg.lineCap = 'round'; gg.strokeStyle = rgba(pal.skinS, .55); gg.lineWidth = 1; [-.3, 0, .3].forEach(k => { gg.beginPath(); gg.moveTo(k * r, r * .62); gg.lineTo(k * r * 1.02, r * 1.05); gg.stroke(); }); });
    });
  }
  /* v4 shoes: shoeK sneaker (sole, toe cap, laces, collar, heel tab) | dress (polished leather, welt) | flat (soft closed flat with a strap) | mary (strap + button) */
  function bakeShoe4(d, pal, id, lvl) {
    return mkSpr(-19, d.shoeK === 'boot' ? -31 : -13, 19, 13, lvl, g => {
      const k = d.shoeK || 'sneaker', P = new Path2D(), acc = d.shoeAcc || '#fff', flat = k === 'flat' || k === 'mary' || k === 'sandal';
      if (k === 'sandal') {   // ankle sock (round cuff) behind the strappy sandal
        const sc = d.sockC || '#fbf7ee'; part(g, pRR(-9.5, -13, 12.5, 13, 3), sc, [-9.5, -13, 3, 0], { hi: .2, sh: .3, spec: 0, rim: 0, crescent: .2 }, 2.4); g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1; for (let xx = -7; xx < 3; xx += 3) { g.beginPath(); g.moveTo(xx, -12); g.lineTo(xx, -5); g.stroke(); }
        g.fillStyle = d.sockT || acc; g.fillRect(-9.2, -12.6, 11.8, 2.2);
      }
      if (k === 'boot') {   // pants tucked into a boot: shaft with a turned-over cuff
        const sh = new Path2D(); sh.moveTo(-10.4, -24); sh.lineTo(3.2, -24); sh.lineTo(3.6, -4); sh.lineTo(-10.8, -4); sh.closePath();
        part(g, sh, pal.shoe, [-10.8, -24, 3.6, -4], { hi: .3, sh: .38, spec: .26, sy: .3, rim: .3, crescent: .3, off: 3, blur: 3 }, 3.1, gg => { gg.fillStyle = acc; gg.fillRect(-12, -24, 17, 5); gg.fillStyle = 'rgba(255,255,255,.4)'; gg.fillRect(-12, -24, 17, 1.2); gg.strokeStyle = 'rgba(0,0,0,.22)'; gg.lineWidth = 1; gg.beginPath(); gg.moveTo(-5, -18); gg.lineTo(-5, -5); gg.stroke(); });
      }
      P.moveTo(-10.5, flat ? -4.6 : -6.6); P.quadraticCurveTo(-12.6, flat ? -4 : -6, -12.2, 2); P.quadraticCurveTo(-12, 6.8, -8, 6.9); P.lineTo(10.5, 6.9); P.quadraticCurveTo(15.6, 6.6, 14.8, 2.2); P.quadraticCurveTo(13.6, flat ? -.4 : -1.4, 7, flat ? -2 : -2.8); P.quadraticCurveTo(2.5, flat ? -2.6 : -3.6, -1, flat ? -4.8 : -6.8); P.closePath();
      part(g, P, pal.shoe, [-12.6, -6.8, 15.6, 6.9], { hi: .3, sh: .38, spec: .3, sx: .25, sy: .25, crescent: .3, off: 3, blur: 3, rimW: 1.6, rimD: 1.4 }, 3.1, gg => {
        if (k === 'sneaker') {
          gg.fillStyle = acc; gg.fillRect(-14, 4.1, 32, 4); gg.fillStyle = 'rgba(0,0,0,.18)'; gg.fillRect(-14, 6.2, 32, 2); gg.fillStyle = 'rgba(255,255,255,.55)'; gg.fillRect(-14, 4.1, 32, 1);   // sole
          gg.beginPath(); gg.ellipse(11.4, 1.8, 4.9, 5.2, 0, 0, TAU); gg.fillStyle = lite(pal.shoe, .16); gg.fill(); gg.lineWidth = 1; gg.strokeStyle = 'rgba(0,0,0,.28)'; gg.stroke();   // toe cap
          gg.fillStyle = dark(pal.shoe, .45); gg.beginPath(); gg.ellipse(-5.6, -6.3, 5.4, 1.5, 0, 0, TAU); gg.fill();   // dark collar opening
          gg.fillStyle = acc; gg.beginPath(); gg.moveTo(-12.4, -1); gg.quadraticCurveTo(-12.2, 3.6, -10.4, 4.2); gg.lineTo(-8.4, 3.2); gg.quadraticCurveTo(-9.6, 1.4, -9.6, -1.6); gg.closePath(); gg.fill();   // heel tab
          gg.lineCap = 'round'; gg.strokeStyle = 'rgba(255,255,255,.92)'; gg.lineWidth = 1.5; [[-1.4, -5.2, .8, -3.6], [1.6, -4, 3.6, -2.4], [4.4, -3, 6.2, -1.6]].forEach(q => { gg.beginPath(); gg.moveTo(q[0], q[1]); gg.lineTo(q[2], q[3]); gg.stroke(); });
        } else if (k === 'boot' || k === 'cleat') {
          gg.fillStyle = k === 'cleat' ? acc : 'rgba(0,0,0,.4)'; gg.fillRect(-14, 4.6, 32, 4.4); gg.fillStyle = 'rgba(255,255,255,.28)'; gg.fillRect(-14, 4.6, 32, .9);
          if (k === 'cleat') { gg.fillStyle = 'rgba(0,0,0,.45)'; [-7, -1, 5, 11].forEach(xx => gg.fillRect(xx, 7.4, 2.4, 2)); gg.beginPath(); gg.ellipse(11.4, 1.8, 4.9, 5.2, 0, 0, TAU); gg.fillStyle = lite(pal.shoe, .14); gg.fill(); gg.strokeStyle = 'rgba(255,255,255,.9)'; gg.lineWidth = 1.4; [[-1.4, -5.2, .8, -3.6], [1.6, -4, 3.6, -2.4], [4.4, -3, 6.2, -1.6]].forEach(q => { gg.beginPath(); gg.moveTo(q[0], q[1]); gg.lineTo(q[2], q[3]); gg.stroke(); }); }
          else { gg.beginPath(); gg.ellipse(11, 2, 4.6, 4.8, 0, 0, TAU); gg.fillStyle = lite(pal.shoe, .1); gg.fill(); gg.lineWidth = 1; gg.strokeStyle = 'rgba(0,0,0,.3)'; gg.stroke(); }
        } else if (k === 'dress') {
          gg.fillStyle = 'rgba(0,0,0,.34)'; gg.fillRect(-14, 4.6, 32, 4); gg.fillStyle = 'rgba(255,255,255,.3)'; gg.fillRect(-14, 4.6, 32, .9); gg.beginPath(); gg.moveTo(5, -2.7); gg.quadraticCurveTo(7.5, 1.4, 6.6, 4.6); gg.lineWidth = 1.1; gg.strokeStyle = 'rgba(0,0,0,.3)'; gg.stroke();
        } else {
          gg.fillStyle = 'rgba(255,255,255,.35)'; gg.fillRect(-14, 5.2, 32, 1.1); gg.fillStyle = 'rgba(0,0,0,.2)'; gg.fillRect(-14, 5.8, 32, 3);
          gg.beginPath(); gg.moveTo(-1.2, -4.8); gg.quadraticCurveTo(1.6, -.4, -.2, 5); gg.lineWidth = 2.6; gg.strokeStyle = k === 'mary' ? acc : lite(pal.shoe, .22); gg.stroke();
        }
      });
      if (k === 'mary' || k === 'flat') bead(g, 0.1, -1.2, k === 'mary' ? 1.9 : 1.5, k === 'mary' ? acc : '#e8d9b8', 1);
      if (k === 'sneaker' && (id === 'aboody' || id === 'luka')) { g.lineWidth = 2.6; g.strokeStyle = acc; g.beginPath(); g.moveTo(-1, -5); g.quadraticCurveTo(1, -1, -.6, 3); g.stroke(); }   // velcro strap for the little ones
    });
  }
  function bakeHand(d, pal, lvl) {
    const r = d.wf * .62; return mkSpr(-r - 4, -r - 4, r + 4, r + 4, lvl, g => part(g, pCirc(0, 0, r), d.skin, [-r, -r, r, r], { hi: .26, sh: .4, tint: '120,40,30', spec: .3, crescent: .3, off: r * .3, blur: r * .4, rim: .35, rimW: 1.6, rimD: 1.2 }, 3));
  }

  function bakeSkin(d, pal, lvl) {
    const R = d.R, rx = R * d.hr, scarfy = d.hair === 'scarf', hx = rx + R * .22 + 6, E = d.eye, fg = FG(d), ex = fg.ex, ey = fg.ey, er = fg.er;
    return mkSpr(-hx, -R - 6, hx, R + 6, lvl, g => {
      const OVS = { hi: .24, sh: .36, tint: '120,40,30', spec: .22, sx: .2, sy: .3, sr: .55, off: R * .2, blur: R * .35, crescent: .36, cres: '150,45,35', rimC: '255,200,160', rim: .34, rimW: 3 };
      if (!scarfy) [-1, 1].forEach(s => {
        const P = pCirc(s * (rx - 1), R * .12, R * .2); part(g, P, d.skin, [s * (rx - 1) - R * .2, R * -.08, s * (rx - 1) + R * .2, R * .32], { hi: .2, sh: .4, tint: '120,40,30', spec: .15, off: 2.5, blur: 3, rim: .3, rimW: 1.6 }, 3);
        g.fillStyle = rgba(pal.skinS, .75); g.beginPath(); g.ellipse(s * (rx - 1), R * .12, R * .09, R * .11, 0, 0, TAU); g.fill();
      });
      const P = pEll(0, 0, rx * (scarfy && !d.v3 ? .93 : 1), R * (scarfy && !d.v3 ? .97 : 1)), bb = [-rx, -R, rx, R];
      g.fillStyle = d.skin; g.fill(P);
      g.save(); g.clip(P);
      const cs = g.createRadialGradient(0, -R * 1.0, R * .1, 0, -R * 1.0, R * 1.05); cs.addColorStop(0, 'rgba(60,20,10,.4)'); cs.addColorStop(1, 'rgba(60,20,10,0)'); g.fillStyle = cs; g.fillRect(-hx, -R - 6, hx * 2, R * 2 + 12);   // contact shadow from the hair
      [-1, 1].forEach(s => { const rg = g.createRadialGradient(s * ex, ey - er * .1, 0, s * ex, ey - er * .1, er * 2.2); rg.addColorStop(0, 'rgba(130,60,40,.13)'); rg.addColorStop(1, 'rgba(130,60,40,0)'); g.fillStyle = rg; g.fillRect(s * ex - er * 2.4, ey - er * 2.4, er * 4.8, er * 4.8); const cb = g.createRadialGradient(s * rx * .58, R * .52, 0, s * rx * .58, R * .52, R * .26); cb.addColorStop(0, d.v3 ? 'rgba(244,112,112,.36)' : 'rgba(240,100,95,.30)'); cb.addColorStop(1, 'rgba(240,100,95,0)'); g.fillStyle = cb; g.fillRect(s * rx * .58 - R * .3, R * .22, R * .6, R * .6); });
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
      if (d.braid) {   // side braid over the shoulder with a ribbon bow (swings with the hair springs)
        const bx = -rx * .94, by = R * .1, rb = d.ribbon || '#ff7fae', br = [];
        out.push({ px: bx, py: by, k: 1.25, s: mkSpr(-rx * 1.8, -R * .1, -rx * .1, R * 2.7, lvl, g => {
          for (let i = 0; i < 7; i++) { const t = i / 6, cx = bx - 2.4 * Math.sin(t * 2.6) + 1.2 * t, cy = by + R * .35 + i * R * .27, rr = 5.9 - t * 2.2; br.push([cx, cy, rr]); }
          br.forEach((c, i) => { g.save(); g.translate(c[0], c[1]); g.rotate(i % 2 ? .5 : -.5); const P = pEll(0, 0, c[2], c[2] * 1.22); part(g, P, pal.hair, [-c[2], -c[2] * 1.2, c[2], c[2] * 1.2], { hi: .3, sh: .38, tint: '0,0,0', warm: '255,225,190', spec: .3, rim: .2, rimC: '190,215,255', off: 2, blur: 3, rimW: 1.3, rimD: 1 }, 2.4); g.beginPath(); g.moveTo(-c[2] * .3, -c[2] * 1.0); g.quadraticCurveTo(c[2] * .5, 0, -c[2] * .2, c[2] * 1.0); g.lineWidth = 1; g.strokeStyle = 'rgba(255,230,200,.25)'; g.stroke(); g.restore(); });
          const e = br[6]; part(g, pEll(e[0] + .5, e[1] + 9, 2.8, 6), pal.hair, [e[0] - 3, e[1] + 3, e[0] + 3, e[1] + 15], { hi: .2, sh: .4, spec: .1, rim: 0 }, 2);
          const bwx = e[0], bwy = e[1] + 4; [[[0, 0], [-10, -6], [-10, 6]], [[0, 0], [10, -6], [10, 6]]].forEach(pts => part(g, pPoly(pts.map(q => [q[0] + bwx, q[1] + bwy])), rb, [bwx - 10, bwy - 6, bwx + 10, bwy + 6], { hi: .26, sh: .34, spec: 0, rim: 0, crescent: .2 }, 2.2)); bead(g, bwx, bwy, 3, G.shade(rb, -.12), 1.6);
        }) });
      }
      [-1, 1].forEach(s => { const px = s * rx * .85, py = -R * .05; out.push({ px, py, k: .8, s: mkSpr(-R * .6, -R * .2, R * .6, R * 1.2, lvl, g => { const P = pEll(s * rx * .07, R * .43, R * .3, R * .62); part(g, P, hc, [s * rx * .07 - R * .3, R * -.19, s * rx * .07 + R * .3, R * 1.05], { hi: .24, sh: .4, tint: '0,0,0', warm: '255,225,190', spec: .22, rim: .18, rimC: '190,215,255', off: 3, blur: 4 }, 3.5); }) }); });
    } else if (scarfy && NV(d)) {   // modern hijab: head dome + under-chin wrap + softly tapered shoulder drape + brooch
      const sc = d.scarf, sw = d.sw, ov = { hi: .2, sh: .38, spec: .14, off: 6, blur: 6 };
      out.push({ px: 0, py: R * .6, k: .6, shear: true, s: mkSpr(-rx * 1.5, -R * 1.4, rx * 1.5, R * 2.9, lvl, g => {
        { const ou = new Path2D(); ou.moveTo(-rx * 1.16, R * .7); ou.bezierCurveTo(-rx * 1.27, -R * .35, -rx * .95, -R * 1.16, 0, -R * 1.14); ou.bezierCurveTo(rx * .95, -R * 1.16, rx * 1.27, -R * .35, rx * 1.16, R * .7); const dm = new Path2D(); dm.addPath(ou); dm.lineTo(rx * .7, R * 1.0); dm.lineTo(-rx * .7, R * 1.0); dm.closePath();
          part(g, dm, sc, [-rx * 1.2, -R * 1.2, rx * 1.2, R * 1.0], { hi: .26, sh: .34, spec: .26, sy: .2, off: 9, blur: 8, rim: .3 }, 0); g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = 3.5; g.stroke(ou); }
        const Yh = v => R * (.9 + (v - .9) * (d.hjLen || 1)), D = new Path2D(); D.moveTo(-rx * 1.16, R * .6); D.bezierCurveTo(-rx * 1.2, R * .95, -(sw + 6), R * .95, -(sw + 5.5), Yh(1.35)); D.bezierCurveTo(-(sw + 5.5), Yh(1.6), -(sw + 3), Yh(1.8), -sw * .5, Yh(1.9)); D.bezierCurveTo(-sw * .1, Yh(1.97), sw * .4, Yh(2.08), sw * .9, Yh(2.12)); D.bezierCurveTo(sw + 4, Yh(1.97), sw + 6.5, Yh(1.7), sw + 5.5, Yh(1.35)); D.bezierCurveTo(sw + 6, R * .95, rx * 1.2, R * .95, rx * 1.16, R * .6); D.closePath();
        part(g, D, G.shade(sc, -.05), [-sw - 6, R * .5, sw + 6, R * 2.5], ov, 3.4, gg => {
          scarfPrint(gg, d, -sw - 6, R * .6, sw + 6, R * 2.1);
          fold(gg, -rx * .55, R * 1.2, -sw * 1.0, R * 1.5, -sw * .7, R * 1.85, 3.2, .15); fold(gg, rx * .45, R * 1.25, sw * 1.0, R * 1.55, sw * .8, R * 2.0, 3.2, .17); fold(gg, rx * .05, R * 1.45, rx * .1, R * 1.75, -sw * .05, R * 1.95, 2.6, .1);
          const sg = gg.createRadialGradient(0, R * 1.05, 0, 0, R * 1.2, R * .75); sg.addColorStop(0, 'rgba(70,25,35,.34)'); sg.addColorStop(1, 'rgba(70,25,35,0)'); gg.fillStyle = sg; gg.fillRect(-rx * 1.4, R * .6, rx * 2.8, R * 1.2);
        });
        const W = new Path2D(); W.moveTo(-rx * 1.12, R * .5); W.bezierCurveTo(-rx * 1.04, R * 1.05, -rx * .55, R * 1.3, 0, R * 1.3); W.bezierCurveTo(rx * .55, R * 1.3, rx * 1.04, R * 1.05, rx * 1.12, R * .5); W.lineTo(rx * .9, R * .1); W.lineTo(-rx * .9, R * .1); W.closePath();
        g.save(); g.shadowColor = 'rgba(60,20,35,.4)'; g.shadowBlur = 6 * LV; g.shadowOffsetY = 3 * LV; g.fillStyle = sc; g.fill(W); g.restore();
        part(g, W, lite(sc, .1), [-rx * 1.12, R * .1, rx * 1.12, R * 1.3], { hi: .26, sh: .36, spec: .26, sy: .55, off: 7, blur: 7, rim: .3 }, 3.4, gg => {
          scarfPrint(gg, d, -rx * 1.1, R * .3, rx * 1.1, R * 1.3);
          fold(gg, -rx * .7, R * .75, -rx * .55, R * 1.1, -rx * .22, R * 1.26, 2.8, .13); fold(gg, rx * .75, R * .78, rx * .6, R * 1.05, rx * .3, R * 1.26, 2.8, .15); fold(gg, rx * .1, R * .95, rx * .12, R * 1.1, rx * .02, R * 1.26, 2.2, .09);
          const sg = gg.createRadialGradient(0, R * .95, R * .05, 0, R * .98, R * .55); sg.addColorStop(0, 'rgba(70,25,35,.45)'); sg.addColorStop(1, 'rgba(70,25,35,0)'); gg.fillStyle = sg; gg.fillRect(-rx * 1.2, R * .3, rx * 2.4, R * 1.2);
        });
        const px = -rx * .62, py = R * 1.05, pc = d.pin || '#e2b05c';   // brooch pin (gold flower + pearl)
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6; bead(g, px + Math.cos(a) * 3.5, py + Math.sin(a) * 3.5, 2.5, pc, 1); }
        bead(g, px, py, 2.6, '#fff7ec', 1);
      }) });
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

  function scarfPrint(gg, d, x0, y0, x1, y1) {   // small polka print for printed headscarves (d.scarfDots)
    if (d.scarfK && C.deco && C.deco.print) { C.deco.print(gg, d, x0, y0, x1, y1); return; }
    if (!d.scarfDots) return; for (let i = 0; i < 34; i++) { const fx = x0 + ((i * 37.3) % 100) / 100 * (x1 - x0), fy = y0 + ((i * 53.7) % 100) / 100 * (y1 - y0); gg.fillStyle = rgba(d.scarfDots, .55); gg.beginPath(); gg.arc(fx, fy, 2.5, 0, TAU); gg.fill(); gg.fillStyle = 'rgba(255,255,255,.4)'; gg.beginPath(); gg.arc(fx - .8, fy - .8, .8, 0, TAU); gg.fill(); }
  }

  /* v4 short hair: volume on top, proper hairline per style (crop / side part / bangs / quiff) with short sideburns, flowing strand highlights and one soft gloss band */
  function short4(g, d, pal, R, rx, hc) {
    const st = d.hairSt || (d.fringe || d.hair === 'pigtails' ? 'fringe' : d.quiff ? 'quiff' : d.part ? 'part' : 'crop'), top = st === 'quiff' ? 1.3 : 1.2, p = new Path2D(), hy = [-.12, -.5];
    p.moveTo(-rx * 1.03, R * .26); p.bezierCurveTo(-rx * 1.12, R * .0, -rx * 1.16, -R * .62, -rx * .62, -R * .98); p.bezierCurveTo(-rx * .3, -R * top, rx * .3, -R * top, rx * .62, -R * .98); p.bezierCurveTo(rx * 1.16, -R * .62, rx * 1.12, R * .0, rx * 1.03, R * .26);
    p.lineTo(rx * .95, R * .22); p.quadraticCurveTo(rx * .9, R * .04, rx * .88, -R * .12);
    if (st === 'crop') { p.bezierCurveTo(rx * .78, -R * .4, rx * .4, -R * .5, 0, -R * .5); p.bezierCurveTo(-rx * .4, -R * .5, -rx * .78, -R * .4, -rx * .88, -R * .12); }
    else if (st === 'part' || st === 'quiff') { p.bezierCurveTo(rx * .8, -R * .3, rx * .55, -R * .36, rx * .2, -R * .52); p.bezierCurveTo(-rx * .1, -R * .66, -rx * .3, -R * .6, -rx * .42, -R * .46); p.bezierCurveTo(-rx * .6, -R * .36, -rx * .82, -R * .26, -rx * .88, -R * .12); }
    else { p.bezierCurveTo(rx * .84, -R * .24, rx * .74, -R * .16, rx * .6, -R * .2); p.quadraticCurveTo(rx * .45, -R * .06, rx * .3, -R * .24); p.quadraticCurveTo(rx * .14, -R * .1, -rx * .02, -R * .26); p.quadraticCurveTo(-rx * .2, -R * .1, -rx * .34, -R * .26); p.quadraticCurveTo(-rx * .5, -R * .08, -rx * .62, -R * .22); p.quadraticCurveTo(-rx * .8, -R * .2, -rx * .88, -R * .12); }
    p.lineTo(-rx * .95, R * .22); p.closePath();
    part(g, p, hc, [-rx * 1.2, -R * 1.3, rx * 1.2, R * .3], { hi: .3, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .3, sx: .15, sy: .2, rim: .12, rimC: '255,226,190', off: R * .14, blur: R * .2 }, 3.5, gg => {
      gg.lineCap = 'round'; const dir = st === 'part' || st === 'quiff' ? 1 : 0;
      for (let k = -3; k <= 3; k++) { const x0 = (k + .5) * rx * .13 + dir * rx * .1, y1 = st === 'fringe' ? -R * .22 : -R * .46; gg.beginPath(); gg.moveTo(x0, -R * 1.02); gg.quadraticCurveTo((k + .5) * rx * .3 + dir * rx * .22, -R * .85, (k + .5) * rx * .52 + dir * rx * .3, y1 + Math.abs(k) * R * .02); gg.lineWidth = 1.4; gg.strokeStyle = k % 2 ? 'rgba(0,0,0,.14)' : 'rgba(255,230,200,.12)'; gg.stroke(); }
      gg.beginPath(); gg.arc(-rx * .12, -R * .55, R * .62, Math.PI * 1.17, Math.PI * 1.58); [9, 5, 2].forEach((w, k) => { gg.lineWidth = w; gg.strokeStyle = 'rgba(255,240,220,' + [.06, .12, .32][k] + ')'; gg.stroke(); });
      if (st === 'part' || st === 'quiff') { gg.strokeStyle = 'rgba(0,0,0,.35)'; gg.lineWidth = 1.8; gg.beginPath(); gg.moveTo(-rx * .38, -R * .5); gg.quadraticCurveTo(-rx * .3, -R * .86, -rx * .16, -R * 1.12); gg.stroke(); }
      gg.fillStyle = 'rgba(0,0,0,.14)'; [-1, 1].forEach(s => { gg.beginPath(); gg.ellipse(s * rx * .98, R * .1, rx * .1, R * .17, 0, 0, TAU); gg.fill(); });   // fade / sideburn shadow
    });
  }
  function hairCapShade(g, P, bb, hc, R, rx) {
    part(g, P, hc, bb, { hi: .26, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .3, sx: .15, sy: .25, rim: .22, rimC: '190,215,255', off: R * .14, blur: R * .2 }, 3.5);
  }

  /* v4 curls: silhouette of overlapping clumps (one dark outline), soft clump shading + crease on the shadow side, warm specular glints on alternate clumps, tiny spiral strokes, scalloped hairline */
  function curly4(g, d, pal, R, rx, cr, hc) {
    const cl = [], rnd = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * .5 + .5, front = [];
    for (let i = 0; i <= 10; i++) { const a = (196 + i * 14.8) * R2D; cl.push([Math.cos(a) * rx * 1.0, Math.sin(a) * R * .98, cr * (.98 + .2 * rnd(i, 1))]); }
    cl.push([-rx * 1.02, -R * .16, R * .2], [rx * 1.02, -R * .16, R * .2], [-rx * .9, -R * .6, cr * .95], [rx * .9, -R * .6, cr * .95], [0, -R * 1.04, cr * 1.1], [-rx * .46, -R * 1.02, cr * 1.05], [rx * .46, -R * 1.02, cr * 1.05]);
    for (let i = 0; i < 7; i++) { const a = (208 + i * 20.5) * R2D; front.push([Math.cos(a) * rx * .72, Math.sin(a) * R * .7 - R * .02, cr * (.86 + .16 * rnd(i, 2))]); }
    for (let i = 0; i < 7; i++) front.push([(-.72 + i * .24) * rx, -R * .5 + (i % 2) * R * .045 - Math.abs(i - 3) * R * .012, R * (.165 + .02 * rnd(i, 3))]);
    const U = new Path2D(); cl.concat(front).forEach(c => { U.moveTo(c[0] + c[2], c[1]); U.arc(c[0], c[1], c[2], 0, TAU); });
    g.lineWidth = 6.5; g.strokeStyle = OL; g.stroke(U); g.fillStyle = hc; g.fill(U);
    g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .4, 0, 0, TAU); g.fill();
    const hl = mixc(hc, '#c98a58', .24), hd = mixc(hc, '#000', .4), lx = LX;
    overlay(g, U, [-rx * 1.3, -R * 1.5, rx * 1.3, R * .2], { hi: .12, sh: .46, tint: '0,0,0', warm: '255,214,170', spec: .12, sx: .2, sy: .22, sr: .5, crescent: 0, rim: 0 });
    const clump = (c, outline, k) => {
      const rr = Math.max(1, c[2] - (outline ? 0 : 2.2)), rg = g.createRadialGradient(c[0] + lx * rr * .3, c[1] - rr * .4, rr * .05, c[0], c[1], rr * 1.08);
      rg.addColorStop(0, hl); rg.addColorStop(.5, hc); rg.addColorStop(1, hd); g.globalAlpha = outline ? .92 : .8; g.fillStyle = rg; g.beginPath(); g.arc(c[0], c[1], rr, 0, TAU); g.fill(); g.globalAlpha = 1;
      if (outline) { g.lineWidth = 1.5; g.strokeStyle = 'rgba(14,5,0,.5)'; g.stroke(); }
      g.lineCap = 'round'; const a0 = lx < 0 ? Math.PI * 1.08 : Math.PI * 1.42, a1 = lx < 0 ? Math.PI * 1.52 : Math.PI * 1.92;   // crease on the shadow side
      g.beginPath(); g.arc(c[0], c[1], rr * .9, lx < 0 ? .1 : Math.PI * .1 + 1.9, lx < 0 ? 1.5 : 3.1); g.lineWidth = 1.5; g.strokeStyle = 'rgba(8,3,0,.34)'; g.stroke();
      if (k % 3 === 0) { g.beginPath(); g.arc(c[0], c[1], rr * .6, a0, a1); g.lineWidth = rr * .22; g.strokeStyle = 'rgba(255,226,190,.1)'; g.stroke(); g.lineWidth = Math.max(1, rr * .08); g.strokeStyle = 'rgba(255,238,212,.42)'; g.stroke(); }
      if (k % 3 === 1 && rr > 5) { g.beginPath(); for (let th = 0; th < 4.4; th += .25) { const r = rr * (.1 + th * .075), x = c[0] + Math.cos(th + k) * r, y = c[1] + .08 * rr + Math.sin(th + k) * r; th ? g.lineTo(x, y) : g.moveTo(x, y); } g.lineWidth = 1.1; g.strokeStyle = 'rgba(8,3,0,.4)'; g.stroke(); }
    };
    cl.forEach((c, k) => clump(c, false, k)); front.forEach((c, k) => clump(c, true, k + 1));
  }
  function bakeHairFront(d, pal, hatId, lvl, shirtC) {
    const R = d.R, rx = R * d.hr, hc = pal.hair, scarfy = d.hair === 'scarf', cr = R * (d.curl || .3), hat = hatId && C.hats[hatId];
    const hx = d.sunhat ? rx * 2.15 + 8 : Math.max(rx * (d.hair === 'curly' ? 1.02 : 1.26) + (d.hair === 'curly' ? cr * 1.3 : 6), hat ? rx * (hat.wide || 1.7) : 0) + 8;
    const y0 = hat || d.sunhat ? -R * 2.45 - 8 : -(R * 1.05 + cr * 1.3 + 8), y1 = R * .8;
    return mkSpr(-hx, Math.min(y0, -R * 1.5), hx, y1, lvl, g => {
      if (d.hair === 'curly' && d.v4) { curly4(g, d, pal, R, rx, cr, hc); }
      else if (d.hair === 'curly') {
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
      } else if (scarfy && NV(d)) {   // modern hijab front: soft band around an oval face opening, plum under-cap, fades into the under-chin wrap
        const sc = d.scarf, uc = d.under, a = rx * .96;
        const I1 = [[-a * .9, R * .66], [-a * 1.04, R * .3, -a * 1.0, -R * .3, -a * .64, -R * .56], [-a * .4, -R * .66, a * .4, -R * .66, a * .64, -R * .56], [a * 1.0, -R * .28, a * 1.04, R * .3, a * .9, R * .66]];
        const inner = new Path2D(); inner.moveTo(I1[0][0], I1[0][1]); for (let i = 1; i < 4; i++) inner.bezierCurveTo.apply(inner, I1[i]);
        const hole = new Path2D(); hole.addPath(inner); hole.lineTo(a * .9, R * 1.3); hole.lineTo(-a * .9, R * 1.3); hole.closePath();
        const outer = new Path2D(); outer.moveTo(-rx * 1.16, R * .7); outer.bezierCurveTo(-rx * 1.27, -R * .35, -rx * .95, -R * 1.16, 0, -R * 1.14); outer.bezierCurveTo(rx * .95, -R * 1.16, rx * 1.27, -R * .35, rx * 1.16, R * .7);
        const band = new Path2D(); band.addPath(outer); band.lineTo(a * .9, R * .66); band.bezierCurveTo(a * 1.04, R * .3, a * 1.0, -R * .3, a * .64, -R * .56); band.bezierCurveTo(a * .4, -R * .66, -a * .4, -R * .66, -a * .64, -R * .56); band.bezierCurveTo(-a * 1.0, -R * .3, -a * 1.04, R * .3, -a * .9, R * .66); band.closePath();
        /* soft shadow the scarf throws on the face, and the plum under-cap peeking inside the opening */
        g.save(); g.clip(hole);
        g.lineCap = 'round'; g.strokeStyle = 'rgba(110,40,30,.07)'; g.lineWidth = 9; g.stroke(inner); g.strokeStyle = 'rgba(110,40,30,.09)'; g.lineWidth = 4.5; g.stroke(inner);
        const cap = new Path2D(); cap.moveTo(-a * 1.2, -R * .9); cap.lineTo(a * 1.2, -R * .9); cap.lineTo(a * 1.2, -R * .06); cap.bezierCurveTo(a * .6, -R * .46, -a * .6, -R * .46, -a * 1.2, -R * .06); cap.closePath();
        if (uc) { part(g, cap, uc, [-a * 1.2, -R * .9, a * 1.2, R * .0], { hi: .2, sh: .38, spec: .24, sy: .45, off: 5, blur: 5, rim: 0 }, 0); g.strokeStyle = 'rgba(30,5,20,.45)'; g.lineWidth = 2.2; g.stroke(cap); }
        g.restore();
        part(g, band, sc, [-rx * 1.2, -R * 1.25, rx * 1.2, R * .7], { hi: .28, sh: .36, spec: .3, sy: .2, off: 9, blur: 8, rim: .3 }, 0, gg => {
          scarfPrint(gg, d, -rx * 1.2, -R * 1.2, rx * 1.2, R * .5);
          fold(gg, -rx * .1, -R * 1.2, -rx * .7, -R * .95, -rx * 1.05, -R * .3, 3.4, .13); fold(gg, rx * .2, -R * 1.2, rx * .75, -R * .9, rx * 1.05, -R * .2, 3.4, .16); fold(gg, rx * .0, -R * 1.15, -rx * .35, -R * .85, -rx * .72, -R * .62, 2.4, .1); fold(gg, -rx * .3, -R * .75, -rx * .95, -R * .15, -rx * 1.05, R * .5, 2.6, .09); fold(gg, rx * .3, -R * .75, rx * .95, -R * .15, rx * 1.05, R * .5, 2.6, .1);
        });
        g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = OL; g.lineWidth = 3.5; g.stroke(outer); g.lineWidth = 2.6; g.strokeStyle = 'rgba(60,20,25,.9)'; g.stroke(inner); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,248,240,.5)'; g.save(); g.translate(LX * -1.4, 1.6); g.clip(band); g.stroke(inner); g.restore();
        g.save(); g.globalCompositeOperation = 'destination-out'; const fd = g.createLinearGradient(0, R * .4, 0, R * .72); fd.addColorStop(0, 'rgba(0,0,0,0)'); fd.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fd; g.fillRect(-hx, R * .4, hx * 2, R); g.restore();
      } else if (scarfy) {
        const sc = d.scarf, uc = d.under, a = d.under ? .46 : .3, b = d.under ? .66 : .5;
        if (uc) { const p = new Path2D(); p.moveTo(-rx * .95, R * .2); p.bezierCurveTo(-rx * 1.05, -R * 1.1, rx * 1.05, -R * 1.1, rx * .95, R * .2); p.quadraticCurveTo(rx * .8, -R * .1, rx * .45, -R * .2); p.quadraticCurveTo(0, -R * .3, -rx * .45, -R * .2); p.quadraticCurveTo(-rx * .8, -R * .1, -rx * .95, R * .2); p.closePath(); part(g, p, uc, [-rx, -R * 1.1, rx, R * .2], { hi: .22, sh: .4, spec: .22, off: 7, blur: 7 }, 3); }
        const p = new Path2D(); p.moveTo(-rx * 1.0, R * .3); p.bezierCurveTo(-rx * 1.2, -R * 1.3, rx * 1.2, -R * 1.3, rx * 1.0, R * .3); p.quadraticCurveTo(rx * .95, -R * .02, rx * .55, -R * a); p.quadraticCurveTo(0, -R * b, -rx * .55, -R * a); p.quadraticCurveTo(-rx * .95, -R * .02, -rx * 1.0, R * .3); p.closePath();
        part(g, p, sc, [-rx * 1.1, -R * 1.2, rx * 1.1, R * .3], { hi: .26, sh: .38, spec: .26, sy: .2, off: 8, blur: 8, rim: .26 }, 3.5, gg => {
          if (!uc) { gg.fillStyle = 'rgba(255,111,145,.55)'; for (let i = 0; i < 9; i++) { gg.beginPath(); gg.arc(-rx * .8 + (i * 19) % (rx * 1.6), -R * .9 + (i * 13) % (R * .55), 2.4, 0, 6.3); gg.fill(); } }
          fold(gg, -rx * .2, -R * 1.05, -rx * .75, -R * .8, -rx * .98, -R * .1, 3.4, .13); fold(gg, rx * .15, -R * 1.05, rx * .7, -R * .8, rx * .98, -R * .1, 3.4, .16); fold(gg, 0, -R * 1.1, -rx * .3, -R * .75, -rx * .5, -R * .45, 2.4, .1);
        });
        g.beginPath(); g.moveTo(-rx * .55, -R * a); g.quadraticCurveTo(0, -R * b, rx * .55, -R * a); g.lineWidth = 3.4; g.strokeStyle = 'rgba(40,10,30,.18)'; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(40,10,30,.3)'; g.stroke();
      } else if (d.v3) {   // Nemo: soft side-swept fringe + face-framing locks under the hat
        const p = new Path2D(); p.moveTo(-rx * 1.04, R * .24); p.bezierCurveTo(-rx * 1.2, -R * 1.25, rx * 1.2, -R * 1.25, rx * 1.04, R * .24); p.bezierCurveTo(rx * .98, R * .1, rx * .9, -R * .02, rx * .84, -R * .08); p.quadraticCurveTo(rx * .66, -R * .36, rx * .2, -R * .42); p.quadraticCurveTo(-rx * .3, -R * .4, -rx * .6, -R * .17); p.quadraticCurveTo(-rx * .8, -R * .02, -rx * .86, R * .04); p.quadraticCurveTo(-rx * .95, R * .06, -rx * 1.04, R * .24); p.closePath();
        part(g, p, hc, [-rx * 1.1, -R * 1.2, rx * 1.1, R * .3], { hi: .3, sh: .42, tint: '0,0,0', warm: '255,225,190', spec: .34, sx: .15, sy: .3, rim: .24, rimC: '190,215,255', off: R * .14, blur: R * .2 }, 3.5, gg => {
          gg.lineCap = 'round'; for (let k = -2; k <= 3; k++) { gg.beginPath(); gg.moveTo(rx * .2 + k * rx * .08, -R * .42); gg.quadraticCurveTo(rx * .45 + k * rx * .06, -R * .3, rx * .72 + k * rx * .02, -R * .06); gg.lineWidth = 1.4; gg.strokeStyle = k % 2 ? 'rgba(0,0,0,.2)' : 'rgba(255,230,200,.2)'; gg.stroke(); }
          for (let k = 0; k < 4; k++) { gg.beginPath(); gg.moveTo(rx * .15 - k * rx * .18, -R * .42 + k * 1.5); gg.quadraticCurveTo(-rx * .1 - k * rx * .18, -R * .36, -rx * .4 - k * rx * .12, -R * .12 + k * 2); gg.lineWidth = 1.4; gg.strokeStyle = k % 2 ? 'rgba(0,0,0,.2)' : 'rgba(255,230,200,.18)'; gg.stroke(); }
          gg.beginPath(); gg.arc(-rx * .15, -R * .55, R * .6, Math.PI * 1.15, Math.PI * 1.55); [8, 4.5, 2].forEach((w, k) => { gg.lineWidth = w; gg.strokeStyle = 'rgba(255,240,220,' + [.07, .13, .3][k] + ')'; gg.stroke(); });
        });
        [-1, 1].forEach(s => { const lk = new Path2D(); lk.moveTo(s * rx * 1.0, -R * .12); lk.bezierCurveTo(s * rx * 1.12, R * .2, s * rx * 1.04, R * .56, s * rx * .86, R * .74); lk.bezierCurveTo(s * rx * .82, R * .5, s * rx * .86, R * .26, s * rx * .84, -R * .08); lk.closePath(); part(g, lk, hc, [Math.min(s * rx * .82, s * rx * 1.12), -R * .12, Math.max(s * rx * .82, s * rx * 1.12), R * .74], { hi: .26, sh: .4, tint: '0,0,0', warm: '255,225,190', spec: .2, rim: .2, rimC: '190,215,255', off: 3, blur: 4 }, 2.8); });
      } else if (d.v4 && (d.hair === 'short' || d.hair === 'pigtails')) {
        short4(g, d, pal, R, rx, hc);
        if (d.hair === 'pigtails') [-1, 1].forEach(s => { bead(g, s * (rx + 1), R * .05, R * .12, d.tie || '#fff', 2.5); if (d.bow) { g.save(); g.translate(s * (rx + 2), R * .02); const bw = R * .42; [[[0, 0], [s * bw, -R * .28], [s * bw, R * .28]], [[0, 0], [-s * R * .06, -R * .26], [-s * R * .06, R * .26]]].forEach((pts, qi) => part(g, pPoly(pts), d.bow, [Math.min(0, s * bw), -R * .3, Math.max(0, s * bw), R * .3], { hi: .26, sh: .34, spec: .2, rim: 0, crescent: .2 }, 2.6)); bead(g, 0, 0, R * .1, G.shade(d.bow, -.2), 2); g.restore(); } });
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
      if (d.sunhat && d.v3) {   // cuter sun hat: raised + slightly tilted, woven texture, ribbon band, big bow and a little daisy
        const hcol = d.sunhat, rb = d.ribbon || '#ff7fae', wv = (gg, w, h) => { gg.strokeStyle = 'rgba(200,130,150,.16)'; gg.lineWidth = 1.1; for (let i = 1; i < 5; i++) { gg.beginPath(); gg.ellipse(0, 0, w * i / 5, h * i / 5, 0, 0, TAU); gg.stroke(); } gg.strokeStyle = 'rgba(200,130,150,.12)'; for (let i = -8; i <= 8; i += 2) { gg.beginPath(); gg.moveTo(i * w * .06, -h * .2); gg.lineTo(i * w * .11, h); gg.stroke(); } };
        const sh = g.createLinearGradient(0, -R * .5, 0, -R * .14); sh.addColorStop(0, 'rgba(60,20,25,.26)'); sh.addColorStop(1, 'rgba(60,20,25,0)'); g.save(); g.clip(pEll(0, 0, rx * .96, R * .98)); g.fillStyle = sh; g.fillRect(-rx, -R * .5, rx * 2, R * .4); g.restore();   // brim shadow on the forehead
        g.save(); g.translate(0, -R * .86); g.rotate(-.05);
        part(g, pEll(0, -R * .32, rx * .92, R * .7), lite(hcol, .14), [-rx, -R * 1.02, rx, R * .38], { hi: .3, sh: .16, crescent: .18, spec: .4, sy: .25, off: 8, blur: 8, rimC: '255,235,235', tint: '150,60,80' }, 3.5, gg => { gg.save(); gg.translate(0, -R * .32); wv(gg, rx * .92, R * .7); gg.restore(); });
        part(g, pEll(0, 0, rx * 2.0, R * .38), hcol, [-rx * 2, -R * .38, rx * 2, R * .38], { hi: .26, sh: .2, crescent: .22, spec: .28, sy: .35, off: 7, blur: 9, tint: '150,60,80' }, 3.5, gg => wv(gg, rx * 2.0, R * .38));
        g.beginPath(); g.ellipse(0, -R * .1, rx * .93, R * .2, 0, .02, Math.PI - .02); g.lineWidth = 7.5; g.strokeStyle = OL; g.stroke(); g.lineWidth = 5; g.strokeStyle = rb; g.stroke(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(0, -R * .125, rx * .93, R * .2, 0, .1, Math.PI - .1); g.stroke();
        { const bx = rx * .6, by = R * .0; g.save(); g.translate(bx, by); [[[0, 2], [-4, 12], [1, 13]], [[0, 2], [5, 11], [9, 9]]].forEach(pts => part(g, pPoly(pts), rb, [-6, 2, 10, 13], { hi: .24, sh: .3, spec: 0, rim: 0, crescent: .2 }, 2)); [[[0, 0], [-11, -7], [-10, 6]], [[0, 0], [11, -7], [10, 6]]].forEach(pts => part(g, pPoly(pts), lite(rb, .06), [-11, -7, 11, 6], { hi: .28, sh: .34, spec: .1, rim: 0, crescent: .22 }, 2.4)); bead(g, 0, 0, 3.2, G.shade(rb, -.14), 1.6); g.restore(); }
        { const fx = -rx * .62, fy = R * .02; [[-9, 3, -.5], [9, 3, .5]].forEach(l => { g.save(); g.translate(fx + l[0], fy + l[1]); g.rotate(l[2]); G.ell(g, 0, 0, 7, 3.2, '#7fcf8a', 2); g.restore(); }); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; bead(g, fx + Math.cos(a) * 4.8, fy + Math.sin(a) * 4.8, 3.1, '#fff', 1.3); } bead(g, fx, fy, 3, '#ffd23c', 1.3); }
        g.restore();
      } else if (d.sunhat) {
        const hcol = d.sunhat;
        part(g, pEll(0, -R * .98, rx * .98, R * .66), lite(hcol, .12), [-rx, -R * 1.64, rx, -R * .32], { hi: .3, sh: .36, spec: .35, sy: .25, off: 8, blur: 8, rimC: '255,235,235' }, 3.5);
        part(g, pEll(0, -R * .6, rx * 2.05, R * .4), hcol, [-rx * 2.05, -R, rx * 2.05, -R * .2], { hi: .26, sh: .4, spec: .22, sy: .35, off: 7, blur: 9 }, 3.5, gg => { gg.strokeStyle = 'rgba(190,110,130,.35)'; gg.lineWidth = 1.6; for (let i = -9; i <= 9; i++) { gg.beginPath(); gg.moveTo(i * rx * .21, -R * .98); gg.lineTo(i * rx * .24, -R * .2); gg.stroke(); } });
        g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .18, 0, 0, Math.PI); g.lineWidth = 7; g.strokeStyle = '#ff8fb1'; g.stroke(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(0, -R * .74, rx * .98, R * .18, 0, .1, Math.PI - .1); g.stroke();
        [-1, 1].forEach(s => { const bx = s * rx * .98, by = -R * .93; g.save(); g.translate(bx, by); g.rotate(s * -.25); [[[0, 0], [s * 11, -7], [s * 11, 7]], [[0, 0], [-s * 10, -6], [-s * 10, 6]]].forEach(pts => part(g, pPoly(pts), '#ff6f9d', [-11, -7, 11, 7], { hi: .26, sh: .34, spec: 0, rim: 0, crescent: .2 }, 2.4)); bead(g, 0, 0, 3.4, '#ff4a86', 2); g.restore(); });
      }
      if (hat) { g.save(); if (scarfy && d._fit) g.translate(0, -R * (hat.hjDy == null ? .16 : hat.hjDy)); try { hat.draw(g, R, d._hatC, d._hatP, d); } catch (e) { } g.restore(); }
    });
  }

  function bakeChin(d, pal, lvl) {   // beard (behind the mouth)
    const R = d.R, rx = R * d.hr; if (!d.beard) return null;
    if (d.v4) return mkSpr(-rx - 8, R * .0, rx + 8, R * 1.34, lvl, g => {   // v4 beard: trimmed, lighter brown with warm strand highlights, wraps the jaw and leaves a clear mouth patch
      const bc = d.beard, hi = d.beardHi || lite(bc, .3), my = (d.mouthY || .72) * R, p = new Path2D();
      p.moveTo(-rx * .99, R * .22); p.bezierCurveTo(-rx * 1.04, R * .68, -rx * .74, R * 1.04, -rx * .2, R * 1.18); p.quadraticCurveTo(0, R * 1.22, rx * .2, R * 1.18); p.bezierCurveTo(rx * .74, R * 1.04, rx * 1.04, R * .68, rx * .99, R * .22);
      p.bezierCurveTo(rx * .93, R * .36, rx * .76, R * .5, rx * .5, R * .5); p.quadraticCurveTo(0, R * .42, -rx * .5, R * .5); p.bezierCurveTo(-rx * .76, R * .5, -rx * .93, R * .36, -rx * .99, R * .22); p.closePath();
      const hole = pEll(0, my - R * .005, R * .27, R * .095), bp = new Path2D(); bp.addPath(p); bp.addPath(hole);
      g.fillStyle = bc; g.fill(bp, 'evenodd'); g.save(); g.clip(bp, 'evenodd');
      overlay(g, p, [-rx, 0, rx, R * 1.2], { hi: .34, sh: .3, tint: '0,0,0', warm: '255,225,190', spec: .18, sy: .55, rim: 0, crescent: 0 });
      g.lineCap = 'round'; for (let k = -6; k <= 6; k++) { const x0 = k * rx * .14, y0 = R * (.44 + .06 * Math.abs(k) * .3), sw = Math.sin(k * 3.1) * rx * .03; g.beginPath(); g.moveTo(x0, y0 + R * .22); g.quadraticCurveTo(x0 * 1.1 + sw, R * .84, x0 * .9, R * (1.08 + .02 * Math.cos(k))); g.lineWidth = 1.4; g.strokeStyle = k % 2 ? 'rgba(' + parse(hi).slice(0, 3).join(',') + ',.38)' : 'rgba(0,0,0,.2)'; g.stroke(); }
      for (let k = 0; k < 9; k++) { const a = Math.PI * (.15 + k * .085), x0 = Math.cos(a) * rx * .88 * (k % 2 ? -1 : 1), y0 = Math.sin(a) * R * .95; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 * .93, y0 + R * .1); g.lineWidth = 1.2; g.strokeStyle = 'rgba(' + parse(hi).slice(0, 3).join(',') + ',.3)'; g.stroke(); }
      g.restore(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(40,18,8,.4)'; g.stroke(p); g.stroke(hole);
      const jw = new Path2D(); jw.moveTo(-rx * .99, R * .22); jw.bezierCurveTo(-rx * 1.04, R * .68, -rx * .74, R * 1.04, -rx * .2, R * 1.18); jw.quadraticCurveTo(0, R * 1.22, rx * .2, R * 1.18); jw.bezierCurveTo(rx * .74, R * 1.04, rx * 1.04, R * .68, rx * .99, R * .22); g.lineWidth = 3.4; g.strokeStyle = OL; g.stroke(jw);   // soft edge of the mouth patch
    });
    return mkSpr(-rx - 8, R * .05, rx + 8, R * 1.3, lvl, g => {
      const p = new Path2D(); p.moveTo(-rx * .98, R * .16); p.bezierCurveTo(-rx * 1.02, R * .72, -rx * .6, R * 1.2, 0, R * 1.2); p.bezierCurveTo(rx * .6, R * 1.2, rx * 1.02, R * .72, rx * .98, R * .16);
      p.quadraticCurveTo(rx * .82, R * .38, rx * .5, R * .46); p.quadraticCurveTo(0, R * .38, -rx * .5, R * .46); p.quadraticCurveTo(-rx * .82, R * .38, -rx * .98, R * .16); p.closePath();
      part(g, p, d.beard, [-rx, R * .15, rx, R * 1.2], { hi: .3, sh: .22, tint: '0,0,0', warm: '255,225,190', spec: .16, sy: .5, rim: .12, crescent: .2, rimC: '190,215,255', off: R * .12, blur: R * .16 }, 3.5, gg => { gg.lineCap = 'round'; for (let k = -5; k <= 5; k++) { gg.beginPath(); gg.moveTo(k * rx * .15, R * .5); gg.quadraticCurveTo(k * rx * .18, R * .85, k * rx * .12, R * 1.15); gg.lineWidth = 1.3; gg.strokeStyle = k % 2 ? 'rgba(255,230,200,.1)' : 'rgba(0,0,0,.12)'; gg.stroke(); } });
    });
  }
  function bakeFront(d, pal, lvl) {   // moustache, stubble, wrinkles, glasses: drawn after the mouth
    const R = d.R, rx = R * d.hr, E = d.eye, fg = FG(d), ex = fg.ex, ey = fg.ey, hx = rx + 8;
    if (!(d.beard || d.stubble || d.wrinkles || d.glasses || d.lines)) return null;
    return mkSpr(-hx, -R * .6, hx, R * 1.0, lvl, g => {
      if (d.stubble) { g.fillStyle = 'rgba(35,25,20,.26)'; for (let i = 0; i < 34; i++) { const a = .35 + (i * 0.137) % 2.45, rr = .72 + ((i * 7) % 10) / 40; const px = Math.cos(a) * rx * rr, py = Math.sin(a) * R * rr * .98; if (py > R * .42 && Math.abs(px) > R * .08 || py > R * .72) { g.beginPath(); g.arc(px, py, .95, 0, 6.3); g.fill(); } } }
      if (d.lines) {   // subtle character lines for grown-ups: crow's feet + soft smile lines (stronger with age)
        const k = d.lines, a = .16 + .1 * k; g.lineCap = 'round'; g.strokeStyle = 'rgba(110,55,35,' + a + ')'; g.lineWidth = 1.2;
        [-1, 1].forEach(s => { for (let i = 0; i < 2 + (k > 1 ? 1 : 0); i++) { g.beginPath(); g.moveTo(s * (ex + fg.gr * 1.02), ey + (i - .6) * 3.2); g.lineTo(s * (ex + fg.gr * 1.02 + 4.2 - i * .8), ey + (i - .6) * 5.2 + 1.6); g.stroke(); }
          if (!d.beard) { g.save(); g.globalAlpha = .6; g.beginPath(); g.moveTo(s * rx * .4, R * .56); g.quadraticCurveTo(s * rx * .5, R * .66, s * rx * .5, R * .78); g.stroke(); g.restore(); }
          if (k > 1) { g.beginPath(); g.moveTo(s * (ex - fg.gr * .7), ey + fg.gr * 1.05); g.quadraticCurveTo(s * ex, ey + fg.gr * 1.25, s * (ex + fg.gr * .8), ey + fg.gr * 1.1); g.stroke(); } });
      }
      if (d.wrinkles) { g.lineWidth = 1.6; g.strokeStyle = 'rgba(120,70,40,.4)'; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * ex * 1.5, ey + R * .22); g.quadraticCurveTo(s * ex * 1.75, ey + R * .3, s * ex * 1.45, ey + R * .4); g.stroke(); }); }
      if (d.beard && d.v4) {   // neat moustache sitting above the lips (does not cover the mouth)
        const bc = d.beard, my = (d.mouthY || .72) * R, y0 = my - R * .36, p = new Path2D();
        p.moveTo(-rx * .5, y0 + R * .17); p.bezierCurveTo(-rx * .42, y0 + R * .02, -rx * .16, y0 - R * .04, 0, y0 + R * .03); p.bezierCurveTo(rx * .16, y0 - R * .04, rx * .42, y0 + R * .02, rx * .5, y0 + R * .17);
        p.bezierCurveTo(rx * .36, y0 + R * .14, rx * .2, y0 + R * .17, 0, y0 + R * .11); p.bezierCurveTo(-rx * .2, y0 + R * .17, -rx * .36, y0 + R * .14, -rx * .5, y0 + R * .17); p.closePath();
        part(g, p, bc, [-rx * .5, y0, rx * .5, y0 + R * .18], { hi: .34, sh: .28, tint: '0,0,0', warm: '255,225,190', spec: .3, sy: .3, rim: .1, crescent: .15 }, 0, gg => { gg.lineCap = 'round'; for (let k = -4; k <= 4; k++) { gg.beginPath(); gg.moveTo(k * rx * .1, y0 + R * .03); gg.quadraticCurveTo(k * rx * .12, y0 + R * .08, k * rx * .14 + Math.sign(k) * 3, y0 + R * .15); gg.lineWidth = 1.1; gg.strokeStyle = k % 2 ? 'rgba(' + parse(d.beardHi || '#7a5c44').slice(0, 3).join(',') + ',.45)' : 'rgba(0,0,0,.2)'; gg.stroke(); } });
        g.lineWidth = 1.3; g.strokeStyle = 'rgba(40,18,8,.55)'; g.stroke(p);
      } else if (d.beard) { const p = new Path2D(); p.moveTo(-rx * .55, R * .6); p.quadraticCurveTo(-rx * .25, R * .4, 0, R * .5); p.quadraticCurveTo(rx * .25, R * .4, rx * .55, R * .6); p.quadraticCurveTo(rx * .25, R * .56, 0, R * .53); p.quadraticCurveTo(-rx * .25, R * .56, -rx * .55, R * .6); p.closePath(); part(g, p, d.beard, [-rx * .55, R * .4, rx * .55, R * .6], { hi: .3, sh: .3, tint: '0,0,0', warm: '255,225,190', spec: .3, rim: 0, crescent: .2 }, 2.6); }
      if (d.glasses && d.glassK && C.deco && C.deco.glasses) { C.deco.glasses(g, d, fg, ex, ey); }
      else if (d.glasses && NV(d)) {   // light cat-eye frames: thin rose-gold rims, faint lens tint, tiny sheen that stays clear of the eyes
        const gr = fg.gr, gc = d.glasses, gl = lite(gc, .55);
        [-1, 1].forEach(s => {
          g.save(); g.translate(s * ex, ey); g.rotate(-s * .07);
          const P = pEll(0, 0, gr * 1.05, gr * .98);
          g.save(); g.translate(.8, 1.5); g.lineWidth = 2.6; g.strokeStyle = 'rgba(80,30,20,.13)'; g.stroke(P); g.restore();
          const lg = g.createLinearGradient(-gr, -gr, gr, gr); lg.addColorStop(0, 'rgba(255,255,255,.2)'); lg.addColorStop(.5, 'rgba(235,246,255,.05)'); lg.addColorStop(1, 'rgba(200,225,250,.08)'); g.fillStyle = lg; g.fill(P);
          g.save(); g.clip(P); g.lineCap = 'round';
          g.beginPath(); g.arc(0, 0, gr * .88, Math.PI * 1.1, Math.PI * 1.34); g.lineWidth = 1.3; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
          g.beginPath(); g.arc(0, 0, gr * .88, Math.PI * 1.4, Math.PI * 1.45); g.lineWidth = 1.3; g.strokeStyle = 'rgba(255,255,255,.45)'; g.stroke();
          g.beginPath(); g.moveTo(gr * .45, gr * .8); g.lineTo(gr * .75, gr * .45); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
          g.restore();
          g.lineWidth = d.glassW || 1.9; g.strokeStyle = gc; g.stroke(P);
          g.beginPath(); g.ellipse(0, 0, gr * 1.05, gr * .98, 0, Math.PI * 1.05, Math.PI * 1.45); g.lineWidth = .8; g.strokeStyle = gl; g.stroke();
          g.restore();
        });
        g.beginPath(); g.moveTo(-ex + gr * 1.04, ey - gr * .05); g.quadraticCurveTo(0, ey - gr * .42, ex - gr * 1.04, ey - gr * .05); g.lineWidth = d.glassW || 1.9; g.strokeStyle = gc; g.stroke();
        dot(g, -ex + gr * 1.2, ey + gr * .22, 1.2, 'rgba(255,255,255,.5)'); dot(g, ex - gr * 1.2, ey + gr * .22, 1.2, 'rgba(255,255,255,.5)');
      } else if (d.glasses) {
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
    const key = id + '|' + shirtC + '|' + (hatId || '') + '|' + lvl + '|' + (flip ? 1 : 0) + (d._osig ? '|' + d._osig : ''); let S = SPRS[key]; if (S) return S;
    LX = flip ? 1 : -1; const pal = palette(id, d, shirtC);
    S = { key, pal };
    S.body = bakeBody(id, d, pal, shirtC, lvl); S.skin = bakeSkin(d, pal, lvl); S.backs = bakeBacks(d, pal, lvl); S.front = bakeFront(d, pal, lvl); S.chin = bakeChin(d, pal, lvl);
    S.hair = bakeHairFront(d, pal, hatId, lvl, shirtC); S.shoe = (d.v4 || d.shoeK) ? bakeShoe4(d, pal, id, lvl) : bakeShoe(d, pal, id, lvl); S.hand = bakeHand(d, pal, lvl); if (d.v4) { S.handL = bakeHand4(d, pal, lvl, -1); S.handR = bakeHand4(d, pal, lvl, 1); }
    S.pv = !!d._pv; SPRS[key] = S; SPRN++; if (SPRN > 150) { /* keep memory bounded: drop old sets (preview sets first; never the one in use) */ for (let pass = 0; pass < 2 && SPRN > 110; pass++) for (const k of Object.keys(SPRS)) { if (SPRN <= 110) break; if (k !== key && (pass === 1 || SPRS[k].pv)) { delete SPRS[k]; SPRN--; } } }
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
        if (d.v3) { tg.head += .035 + sw * .006 * rd; tg.rot += .004; tg.sh += .6; }   // graceful: a soft head tilt and relaxed shoulders
        if (d.poise) { const q = d.poise; tg.head += q.head || 0; tg.rot += q.rot || 0; tg.sh += q.sh || 0; if (q.arm) { tg.la1 += q.arm; tg.ra1 += q.arm; } }   // v4 posture by age / personality
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
    if (d.soft && (name === 'neutral' || name === 'happy')) { et.mO = Math.max(et.mO, .2); et.mS = 1; et.mW = Math.max(et.mW, 1.08); } else if (d.smile === 'big' && (name === 'neutral' || name === 'happy')) { et.mO = Math.max(et.mO, .4); et.mS = 1; et.mW = Math.max(et.mW, 1.1); }
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
      const k = REDUCED ? .3 : 1, vloc = clamp(st.vx / Math.max(.3, sc) * gdir, -420, 420);   // clamped: a fast tween (enter / group move) must not shear the hijab drape into huge streaks
      const tH = (-p.head * .6 - vloc * .0012 - (p.rot) * .5 + sin(st.ph * 1.3 + st.seed) * .012) * k, tT = (-vloc * .0017 - p.rot * 1.1 - p.head * .5 + sin(st.ph * 1.7 + st.seed) * .018 + (anim === 'cheer' ? sin(st.ph * 9) * .08 : 0)) * k;
      const dB = (p.bob - (st.lastBob || 0)) / Math.max(dt, .001); st.lastBob = p.bob;
      spring(st, 'hair', tH, 15, .3, dt); spring(st, 'tail', tT, 12, .28, dt); spring(st, 'cloth', (-vloc * .0011 + st.wsS * .01 + sin(st.ph * 1.4 + st.seed) * .006) * k, 11, .3, dt);
      spring(st, 'hy', clamp(dB * .004, -.5, .5) * k, 18, .35, dt); st.sp.nodV += (st.beat > .5 ? 0 : 0);
      const spc = st.sp; if (spc.cloth > .32 || spc.cloth < -.32) { spc.cloth = clamp(spc.cloth, -.32, .32); spc.clothV *= .3; } if (spc.tail > .7 || spc.tail < -.7) { spc.tail = clamp(spc.tail, -.7, .7); spc.tailV *= .3; } if (spc.hair > .6 || spc.hair < -.6) { spc.hair = clamp(spc.hair, -.6, .6); spc.hairV *= .3; }
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
  const NOOP = {}, sx_ = l => -l;

  /* ===== v4 tapered limbs: a smooth quadratic through shoulder-elbow-wrist (or hip-knee-ankle), radius changes along the length, round caps;
     cel outline + a soft gradient across the limb (light side from the baked light side) + one specular streak.  Hands / sleeves / cuffs are layered on top. ===== */
  const TX = new Float64Array(24), TY = new Float64Array(24), TRr = new Float64Array(24), TNX = new Float64Array(24), TNY = new Float64Array(24), LEGA = new Float64Array(6);
  const TKS = { hi: 'rgba(255,238,212,.32)', hz: 'rgba(255,238,212,0)', sh: 'rgba(130,42,32,.36)', sz: 'rgba(130,42,32,0)', sp: 'rgba(255,248,236,.28)' }, TKC = { hi: 'rgba(255,246,232,.22)', hz: 'rgba(255,246,232,0)', sh: 'rgba(25,6,22,.3)', sz: 'rgba(25,6,22,0)', sp: 'rgba(255,250,240,.2)' };
  function tsample(A, ta, tb, r0, r1, n, mid) {
    const cx = 2 * A[2] - (A[0] + A[4]) * .5, cy = 2 * A[3] - (A[1] + A[5]) * .5;
    for (let i = 0; i <= n; i++) { const f = i / n, t = ta + (tb - ta) * f, u = 1 - t; TX[i] = u * u * A[0] + 2 * u * t * cx + t * t * A[4]; TY[i] = u * u * A[1] + 2 * u * t * cy + t * t * A[5]; TRr[i] = r0 + (r1 - r0) * f + mid * Math.sin(Math.PI * f); }
    for (let i = 0; i <= n; i++) { const a = i > 0 ? i - 1 : 0, b = i < n ? i + 1 : n, dx = TX[b] - TX[a], dy = TY[b] - TY[a], l = Math.hypot(dx, dy) || 1; TNX[i] = -dy / l; TNY[i] = dx / l; }
  }
  function tpath(n, flat) {   // flat: 1 = flat end (sleeve / hem cut), 2 = flat at both ends (bands)
    const P = new Path2D(); for (let i = 0; i <= n; i++) { const x = TX[i] + TNX[i] * TRr[i], y = TY[i] + TNY[i] * TRr[i]; i ? P.lineTo(x, y) : P.moveTo(x, y); }
    if (!flat) P.arc(TX[n], TY[n], TRr[n], Math.atan2(TNY[n], TNX[n]), Math.atan2(TNY[n], TNX[n]) - Math.PI, true);
    for (let i = n; i >= 0; i--) P.lineTo(TX[i] - TNX[i] * TRr[i], TY[i] - TNY[i] * TRr[i]);
    if (flat !== 2) P.arc(TX[0], TY[0], TRr[0], Math.atan2(TNY[0], TNX[0]) + Math.PI, Math.atan2(TNY[0], TNX[0]), true); P.closePath(); return P;
  }
  function tfill(g, P, n, base, K, lxs, lw, outline) {
    g.fillStyle = base; g.fill(P);
    let mn = 1e9, mx = -1e9; for (let i = 0; i <= n; i++) { mn = Math.min(mn, TX[i] - TRr[i]); mx = Math.max(mx, TX[i] + TRr[i]); }
    g.save(); g.clip(P);
    const gr = g.createLinearGradient(lxs < 0 ? mn : mx, 0, lxs < 0 ? mx : mn, 0); gr.addColorStop(0, K.hi); gr.addColorStop(.3, K.hz); gr.addColorStop(.56, K.sz); gr.addColorStop(1, K.sh); g.fillStyle = gr; g.fillRect(mn - 2, -400, mx - mn + 4, 800);
    g.beginPath(); for (let i = 0; i <= n; i++) { const x = TX[i] + lxs * TRr[i] * .42 + TNX[i] * 0, y = TY[i]; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.lineWidth = Math.max(1.2, TRr[Math.max(0, n >> 1)] * .34); g.strokeStyle = K.sp; g.stroke();
    g.restore(); if (outline !== false) { g.lineWidth = lw || 3.3; g.strokeStyle = OL; g.stroke(P); }
  }
  function tband(g, ta, tb, A, r0, r1, base, K, lxs, lw) { tsample(A, ta, tb, r0, r1, 3, 0); tfill(g, tpath(3, 2), 3, base, K, lxs, 3, true); }

  function drawArm4(g, st, d, S, sd, A, lxs, anim, t) {
    const p = st.p, wf = d.wf, w = d.w, pal = S.pal, ex = A[2], ey = A[3], lg = !!d.sleeveLong;
    tsample(A, 0, 1, wf * .54, wf * .4, 10, wf * .04); tfill(g, tpath(10), 10, pal.skin, TKS, lxs, 3.3);
    /* sleeve: short = flared T-shirt sleeve with a folded hem; long = fitted sleeve + cuff */
    const ts = lg ? .8 : .42;
    tsample(A, 0, ts, w * .5, lg ? w * .42 : w * .56, 8, 0); tfill(g, tpath(8, 1), 8, pal.shirt, TKC, lxs, 3.3);
    if (d.ruffle) G.circ(g, A[0], A[1] - 2, w * .52, d.ruffle, 2.5);
    if (lg) { if (d.cuff) tband(g, ts - .06, ts + .05, A, w * .42 + 1.4, w * .42 + 1.4, d.cuff, TKC, lxs); else tband(g, ts - .05, ts + .03, A, w * .42 + 1, w * .42 + 1, G.shade(pal.shirt, -.1), TKC, lxs); }
    else tband(g, ts - .07, ts + .005, A, w * .56 + .9, w * .56 + 1.1, d.hemShirt || lite(pal.shirt, .08), TKC, lxs);
    if (sd === 1 && (p.pt > .3 || p.th > .3)) {
      const dx = A[4] - ex, dy = A[5] - ey, dl = Math.hypot(dx, dy) || 1;
      if (p.pt > .3) { PT[0] = A[4]; PT[1] = A[5]; PT[2] = A[4] + dx / dl * wf * 1.05 * p.pt; PT[3] = A[5] + dy / dl * wf * 1.05 * p.pt; poly(g, 2, 0, 0, wf * .4 + 4, OL); poly(g, 2, 0, 0, wf * .4, pal.skin); }
      if (p.th > .3) { G.ell(g, A[4] + sd * 1.5, A[5] - wf * .62 * p.th, wf * .2, wf * .36 * p.th, pal.skin, 2.2); }
    }
    const th = Math.atan2(-(A[4] - ex), A[5] - ey), H = sd < 0 ? S.handL : S.handR;
    g.save(); g.translate(A[4], A[5]); g.rotate(th); g.drawImage(H.c, H.x, H.y, H.w, H.h);
    if (d.ring && sd === 1) { g.fillStyle = '#ffd23c'; g.beginPath(); g.ellipse(-sd * wf * .08, wf * .5, wf * .2, wf * .09, 0, 0, TAU); g.fill(); g.lineWidth = 1.1; g.strokeStyle = OL; g.stroke(); }
    g.restore();
    if (d.watch && sd === -1) {   // wrist watch worn on the left wrist: strap band + case + glass (smart: dark glass with a lit face; classic: round steel with a white dial)
      const wx = ex + (A[4] - ex) * .8, wy = ey + (A[5] - ey) * .8; g.save(); g.translate(wx, wy); g.rotate(th);
      const bw = wf * .5; G.fillRR(g, -bw - 1.2, -3.2, bw * 2 + 2.4, 6.4, 2, d.watchC || (d.watchK === 'classic' ? '#7a4a28' : '#2f3238'), 1.9); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-bw, -2.6, bw * 2, 1.2);
      if (d.watchK === 'classic') { G.circ(g, 0, 0, 5.6, '#d9dde3', 1.9); G.circ(g, 0, 0, 4, '#fbfbf7', 0); line(g, 0, 0, 0, -2.8, 1, '#2a2a2a'); line(g, 0, 0, 2, .6, 1, '#2a2a2a'); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-3.4, -3.8, 3, 1); }
      else { G.fillRR(g, -5.4, -5.4, 10.8, 10.8, 3, '#2a2d36', 2); g.fillStyle = '#0d1b2a'; g.fillRect(-3.6, -3.6, 7.2, 7.2); g.fillStyle = '#6fd0ff'; g.fillRect(-2.7, -1.2, 5.4, 1.5); g.fillStyle = '#bff0ff'; g.fillRect(-2.7, 1, 3, 1); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-3.6, -3.6, 7.2, 1.3); }
      g.restore();
    }
    if (sd === 1) handProp(g, d, A, anim, t, false);
  }
  /* legs: tapered thigh -> ankle with a small knee, pants hem (cuff) for trousers */
  function drawLeg4(g, d, S, hx, hy, fx, fy, legCol, dressy, lxs) {
    const lw = ((d.legW || 17) + 1.5) * .5; LEGA[0] = hx; LEGA[1] = hy; LEGA[2] = (hx + fx) / 2 + (fx - hx) * .0 + 1.2; LEGA[3] = (hy + fy) / 2; LEGA[4] = fx; LEGA[5] = fy;
    const r0 = lw + .6, r1 = lw - (dressy ? 2.6 : 1.1);
    if (d.shorts && !dressy) {   // knee-length shorts + long socks (outfit system): socks first, then the shorts leg on top
      const sk = d.shorts, rk = r0 + (r1 - r0) * sk;
      tsample(LEGA, 0, 1, r0 - 1, r1 - .4, 8, .5); tfill(g, tpath(8), 8, d.sockC || '#f4f1ea', TKC, lxs, 3.3);
      tband(g, sk + .02, sk + .14, LEGA, rk - 1.1, rk - 1.1, d.sockT || dark(d.sockC || '#f4f1ea', .1), TKC, lxs);
      tsample(LEGA, 0, sk, r0 + 1.4, rk + 2.6, 6, .5); tfill(g, tpath(6, 1), 6, legCol, TKC, lxs, 3.3);
      tsample(LEGA, sk - .05, sk, rk + 2.2, rk + 2.8, 3, 0); tfill(g, tpath(3, 2), 3, d.hemC || dark(legCol, .14), TKC, lxs, 2.6, true);
      if (d.legStripe) { g.beginPath(); g.moveTo(hx + Math.sign(hx || 1) * (r0 + .2), hy + 6); g.lineTo(LEGA[0] + (LEGA[4] - LEGA[0]) * sk + Math.sign(hx || 1) * (rk + 2.2), LEGA[1] + (LEGA[5] - LEGA[1]) * sk - 2); g.lineWidth = 2.6; g.strokeStyle = d.legStripe; g.stroke(); }
      return;
    }
    tsample(LEGA, 0, 1, r0, r1, 8, .5); tfill(g, tpath(8), 8, legCol, dressy ? TKS : TKC, lxs, 3.3);
    if (d.legStripe && !dressy) { const sg = Math.sign(hx || 1); g.beginPath(); g.moveTo(hx + sg * (r0 - .6), hy + 8); g.quadraticCurveTo(LEGA[2] + sg * (lw - .2), LEGA[3], fx + sg * (r1 - .6), fy - 6); g.lineWidth = 2.8; g.strokeStyle = d.legStripe; g.stroke(); }
    if (d.legSeam && !dressy) { const sg = Math.sign(hx || 1); g.save(); g.setLineDash([2.4, 2]); g.beginPath(); g.moveTo(hx + sg * (r0 - 1.6), hy + 8); g.quadraticCurveTo(LEGA[2] + sg * (lw - 1.4), LEGA[3], fx + sg * (r1 - 1.6), fy - 8); g.lineWidth = 1.1; g.strokeStyle = d.legSeam; g.stroke(); g.restore(); }
    if (!dressy) {
      tsample(LEGA, .0, 1, r0, r1, 8, .5); const P0 = tpath(8); g.save(); g.clip(P0); g.beginPath(); g.moveTo(LEGA[2] - lw, LEGA[3] + 1); g.quadraticCurveTo(LEGA[2], LEGA[3] + 3.4, LEGA[2] + lw, LEGA[3] + 1); g.lineWidth = 1.6; g.strokeStyle = 'rgba(0,0,0,.16)'; g.stroke(); g.restore();   // knee crease
      tband(g, .9, 1.0, LEGA, r1 + .6, r1 + .9, d.hemC || dark(legCol, .12), TKC, lxs);
    }
  }

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
    if (d.v4) return drawArm4(g, st, d, S, sd, A, lxs, anim, t);
    const p = st.p, wf = d.wf, w = d.w, ex = A[2], ey = A[3];
    PT[0] = A[0]; PT[1] = A[1]; PT[2] = A[2]; PT[3] = A[3]; PT[4] = A[4]; PT[5] = A[5];
    limb(g, 3, wf + .5, S.pal.skin, SK, lxs, true);
    if (d.sleeveLong) {
      const mx = ex + (A[4] - ex) * .8, my = ey + (A[5] - ey) * .8; PT[4] = mx; PT[5] = my; limb(g, 3, w, S.pal.shirt, CL, lxs, true);
      if (d.ruffle) G.circ(g, A[0], A[1] - 2, w * .52, d.ruffle, 2.5);
      PT[0] = mx; PT[1] = my; PT[2] = mx + (A[4] - mx) * .1; PT[3] = my + (A[5] - my) * .1; if (d.cuff) { poly(g, 2, 0, 0, w + 6, OL); poly(g, 2, 0, 0, w + 2.4, d.cuff); poly(g, 2, sx_(lxs) * 1.2, .6, w * .5, 'rgba(60,20,30,.12)'); } else poly(g, 2, 0, 0, w + 2, G.shade(S.pal.shirt, -.1));
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
    if (d.watch && sd === -1) { const wx = ex + (A[4] - ex) * .78, wy = ey + (A[5] - ey) * .78; G.fillRR(g, wx - 8, wy - 5, 16, 10, 3, d.watchC || '#7a4a28', 2.2); G.fillRR(g, wx - 5, wy - 5, 10, 10, 2, '#17120e', 1.5); G.circ(g, wx, wy, 1.6, '#6fd0ff', 0); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(wx - 4.4, wy - 4.2, 5, 1.4); }
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
  /* v3 eyes: big round iris with warm gradient, upper-lid shade, two highlights, soft liner with a little flick and 3 curled lashes */
  function irisGradC(pal) { if (pal.gC) return pal.gC; const r = GX.createRadialGradient(0, .38, .04, 0, 0, 1); r.addColorStop(0, mixc(pal.iris, '#f0b869', .62)); r.addColorStop(.5, mixc(pal.iris, '#f0b869', .12)); r.addColorStop(.82, pal.iris); r.addColorStop(1, dark(pal.iris, .5)); return (pal.gC = r); }
  const G_LIDSH = (() => { const l = GX.createLinearGradient(0, -1.3, 0, .3); l.addColorStop(0, 'rgba(60,28,20,.5)'); l.addColorStop(1, 'rgba(60,28,20,0)'); return l; })();
  function drawEyeC(g, st, d, s, x, ey, er, lxs, pal) {
    const e = st.e, F = st.fl, ga = g.globalAlpha; let lid = e.lid * (1 - st.bk), hap = e.hap; if (F.closed) lid = 0; if (F.wink && s > 0) { lid = 0; hap = 1; }
    const lidMax = e.lid > 1 ? e.lid : 1, closed = clamp(1 - lid / .22, 0, 1), happyA = sstep(.66, .94, hap), sqA = e.sq, openA = (1 - sqA) * (1 - closed) * (1 - happyA), PI = Math.PI;
    g.save(); g.translate(x, ey); g.lineCap = 'round'; g.lineJoin = 'round';
    if (sqA > .02) { g.globalAlpha = ga * sqA; g.beginPath(); g.moveTo(s * er * 1.1, -er * .9); g.lineTo(-s * er * .8, 0); g.lineTo(s * er * 1.1, er * .9); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); }
    if (openA > .02) {
      g.globalAlpha = ga * openA; const w = e.lid > 1 ? 1 + (e.lid - 1) * .8 : 1, vs = clamp(lid / lidMax, .08, 1) * (1 - .3 * hap), cy = 1.08 * w * (1 - vs) * .34 + hap * .12, rY = 1.08 * w * vs;
      g.save(); g.scale(er, er); g.beginPath(); g.ellipse(0, cy, w, rY, 0, 0, TAU); g.fillStyle = G_EYEW; g.fill(); g.save(); g.clip();
      const ox = clamp(st.gx * .4, -.4, .4) * w, oy = clamp(st.gy * .3, -.28, .3) * w + cy * .35;
      g.translate(ox, oy); g.save(); g.scale((d.eyeK === 'man' ? .66 : d.eyeK === 'woman' ? .69 : .72) * w, (d.eyeK === 'man' ? .8 : .86) * w); g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fillStyle = irisGradC(pal); g.fill(); g.lineWidth = .1; g.strokeStyle = 'rgba(40,20,10,.55)'; g.stroke(); g.restore();
      g.fillStyle = '#1a0c06'; g.beginPath(); g.arc(0, .02 * w, .3 * w * e.pup, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.98)'; g.beginPath(); g.ellipse(lxs * .25 * w, -.32 * w, .22 * w, .25 * w, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-lxs * .24 * w, .3 * w, .1 * w, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,240,210,.35)'; g.beginPath(); g.arc(-lxs * .02 * w, .5 * w, .12 * w, 0, TAU); g.fill();
      g.fillStyle = G_LIDSH; g.fillRect(-w * 1.2, -rY - 1 + cy, w * 2.4, rY * 1.0 + 1);
      g.restore();
      g.beginPath(); g.ellipse(0, cy, w, rY, 0, 0, TAU); g.lineWidth = 1.1 / er; g.strokeStyle = 'rgba(70,36,22,.75)'; g.stroke();
      g.beginPath(); g.ellipse(0, cy, w * 1.03, rY, 0, PI * 1.03, PI * 1.97); g.lineWidth = (d.eyeK === 'man' ? 3.2 : d.v4 && !d.lash ? 2.6 : 2.9) / er; g.strokeStyle = OL; g.stroke();
      if (d.lash || !d.v4) { g.beginPath(); g.moveTo(s * w * .98, cy - rY * .15); g.quadraticCurveTo(s * w * 1.12, cy - rY * .2, s * w * 1.2, cy - rY * .42); g.lineWidth = 1.9 / er; g.strokeStyle = OL; g.stroke(); }
      if (d.eyeK === 'man' || d.eyeK === 'woman') { g.beginPath(); g.ellipse(0, cy - rY * .12, w * 1.0, rY * 1.32, 0, PI * 1.18, PI * 1.82); g.lineWidth = .9 / er; g.strokeStyle = 'rgba(70,36,22,.38)'; g.stroke(); }   // subtle lid crease for grown-ups
      if (d.lash) for (let k = 0; k < 3; k++) { const a = PI * 1.5 + s * (.3 + .1 * k) * PI, bx = w * 1.03 * Math.cos(a), by = cy + rY * Math.sin(a), L = .3 - k * .045; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + s * L * .55, by - L * .2 - .08, bx + s * L * .9 + .06 * s, by - L * .72 + k * .08); g.lineWidth = 1.35 / er; g.strokeStyle = OL; g.stroke(); }
      g.restore();
    }
    if (closed > .02 && happyA < .5) { g.globalAlpha = ga * closed * (1 - sqA) * (1 - happyA); g.beginPath(); g.arc(0, -er * .25, er * .92, PI * .13, PI * .87); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); if (d.lash) { g.lineWidth = 1.8; for (let k = 0; k < 3; k++) { const a = PI * (.13 - k * .1), bx = Math.cos(a) * er * .92 * s, by = -er * .25 + Math.sin(a) * er * .92; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + s * er * (.34 - k * .05), by + er * (.3 + k * .1)); g.stroke(); } } }
    if (happyA > .02) { g.globalAlpha = ga * happyA * (1 - sqA); g.beginPath(); g.arc(0, er * .5, er * .95, PI * 1.1, PI * 1.9); g.lineWidth = 3.3; g.strokeStyle = OL; g.stroke(); if (d.lash) { g.lineWidth = 1.8; for (let k = 0; k < 3; k++) { const a = s < 0 ? PI * (1.1 + k * .09) : PI * (1.9 - k * .09), bx = Math.cos(a) * er * .95, by = er * .5 + Math.sin(a) * er * .95; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + s * er * .32, by - er * (.2 + k * .05)); g.stroke(); } } }
    g.globalAlpha = ga; g.restore();
  }
  function drawBrowC(g, st, d, s, x, by, er, pal) {   // graceful tapered arch: heavier at the inner end, fading outwards
    const e = st.e, raise = e.bY + (s > 0 ? e.bA : 0) + st.browK, inn = -e.bT * 4.6 - raise * 5 + 1.6, out = e.bT * 3.8 - raise * 5 + 2.6, xi = x - s * er * 1.0, xo = x + s * er * 1.15, ym = (by + inn + by + out) / 2 - (d.eyeK === 'man' || d.eyeK === 'boy' ? 2.5 : 3.3) + Math.abs(e.bT) * 1.2, xm = (xi + xo) / 2 + s * er * .12, yi = by + inn, yo = by + out;
    const m1x = (xi + xm) / 2, m1y = (yi + ym) / 2, m2x = (xm + xo) / 2, m2y = (ym + yo) / 2, cx = (m1x + m2x) / 2, cy = (m1y + m2y) / 2;
    const bk = d.browK || 1; g.lineCap = 'round'; g.strokeStyle = pal.brow; g.beginPath(); g.moveTo(xi, yi); g.quadraticCurveTo(m1x, m1y, cx, cy); g.lineWidth = 3 * bk; g.stroke(); g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(m2x, m2y, xo, yo); g.lineWidth = 2 * bk; g.stroke();
  }
  function drawBrow(g, st, d, s, x, by, er, pal) {
    const e = st.e, raise = e.bY + (s > 0 ? e.bA : 0) + st.browK, inn = -e.bT * 5.2 - raise * 5.4 + 1, out = e.bT * 4.4 - raise * 5.4 + 1;
    const xi = x - s * er * 1.1, xo = x + s * er * 1.1; g.beginPath(); g.moveTo(xi, by + inn); g.quadraticCurveTo(x, (by + inn + by + out) / 2 - 5.2 + Math.abs(e.bT) * 1.5, xo, by + out); g.lineWidth = d.browW ? 4.4 : 3.4; g.strokeStyle = pal.brow; g.stroke();
  }
  function drawMouth(g, st, d, R, id, S_) {
    const e = st.e, nv = NV(d), my = d.mouthY ? R * d.mouthY : nv ? R * .72 : R * .6, wm = d.mw || (id === 'moody' ? .86 : d.v3 ? .76 : 1), hs = nv ? .66 : 1, o = e.mO, sm = e.mS, wob = (st.anim === 'cry') ? Math.sin(st.ph * 17) * R * .04 : 0;
    if (o < .08) {
      const hw = R * .26 * e.mW * wm, cy = my - R * .055 - sm * R * .08, dep = R * (.02 + (d.v4 ? .12 : .2) * sm) * (.6 + .4 * Math.min(1, e.mW));
      g.beginPath(); g.moveTo(-hw, cy); if (d.v4) g.bezierCurveTo(-hw * .5, cy + dep * 1.7, hw * .5, cy + dep * 1.7, hw, cy); else g.quadraticCurveTo(0, cy + dep * 2, hw, cy); g.lineWidth = nv ? 2.6 : 3.2; g.strokeStyle = nv ? (d.lips ? S_.lipD : '#7d3430') : OL; g.stroke();
      if (d.lips) {   // soft lower lip under the mouth line (+ tiny shine) so the smile reads even over a beard
        const lh = R * (.05 + .02 * Math.max(0, sm)); g.beginPath(); g.moveTo(-hw * .72, cy + dep * .72 + lh * .1); g.quadraticCurveTo(0, cy + dep * 2 + lh * 2.1, hw * .72, cy + dep * .72 + lh * .1); g.quadraticCurveTo(0, cy + dep * 2 - .2, -hw * .72, cy + dep * .72 + lh * .1); g.closePath(); g.fillStyle = S_.lip; g.fill();
        g.beginPath(); g.ellipse(-hw * .12, cy + dep + lh * .95, hw * .22, lh * .2, 0, 0, TAU); g.fillStyle = 'rgba(255,235,225,.5)'; g.fill();
      }
      if (sm > .5) { g.lineWidth = 1.6; g.beginPath(); g.moveTo(-hw - 2, cy - 2); g.lineTo(-hw, cy); g.moveTo(hw + 2, cy - 2); g.lineTo(hw, cy); g.stroke(); }   // smile dimples
      return;
    }
    const w = R * .4 * e.mW * wm, cy = my - R * .14 - sm * R * .05, topC = cy + R * (.03 + .1 * sm), bot = my - R * .1 + R * (.07 + .42 * o) * hs + wob;
    g.beginPath(); g.moveTo(-w, cy); g.quadraticCurveTo(0, topC, w, cy); g.quadraticCurveTo(w * .85, bot, 0, bot + R * .01); g.quadraticCurveTo(-w * .85, bot, -w, cy); g.closePath();
    g.fillStyle = '#7b2428'; g.fill(); g.save(); g.clip();
    const th = R * .13 * Math.min(1, o * 3.2); g.fillStyle = '#fffaf2'; g.fillRect(-w, cy - R * .02, w * 2, th + (topC - cy) * .5);
    g.fillStyle = 'rgba(30,0,10,.28)'; g.fillRect(-w, cy, w * 2, R * .05);
    g.fillStyle = '#f2707e'; g.beginPath(); g.ellipse(0, bot + R * .02, w * .62, (bot - cy) * .5, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(-w * .12, bot - (bot - cy) * .2, w * .28, (bot - cy) * .1, 0, 0, TAU); g.fill();
    g.restore();
    g.lineWidth = nv ? 2.3 : 2.8; g.strokeStyle = nv ? (d.lips ? S_.lipD : '#6a2a2a') : OL; g.beginPath(); g.moveTo(-w, cy); g.quadraticCurveTo(0, topC, w, cy); g.quadraticCurveTo(w * .85, bot, 0, bot + R * .01); g.quadraticCurveTo(-w * .85, bot, -w, cy); g.stroke();
  }

  function drawHead(g, st, d, S, R, rx, o, lxs, anim, t) {
    const e = st.e, F = st.fl, sp = st.sp, pal = S.pal, fg = FG(d), ex = fg.ex, ey = fg.ey, er = fg.er, fx = st.yaw * R * .3, fy = st.p.pitch * R * .09, hlag = (d.sunhat || o.hat || d._hat) ? .2 : 1;
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
    if (e.bl > .03 || NV(d)) { g.fillStyle = G_BLUSH; [-1, 1].forEach(s => { g.save(); g.translate(s * rx * (NV(d) ? .66 : .6), R * (NV(d) ? .55 : .5)); g.scale(R * (NV(d) ? .2 : .22), R * (NV(d) ? .11 : .13)); g.globalAlpha = ((NV(d) ? (d.blush == null ? .16 : d.blush) : .1) + .34 * e.bl) * (g.globalAlpha || 1); g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); }); }
    if (NV(d)) {
      for (let s = -1; s <= 1; s += 2) { drawEyeC(g, st, d, s, s * ex, ey, er, lxs, pal); drawBrowC(g, st, d, s, s * ex, ey - fg.gr - 3.2, er, pal); }
      g.beginPath(); g.arc(0, R * .38, R * .05, .3, Math.PI - .3); g.lineWidth = 2; g.strokeStyle = 'rgba(160,80,55,.6)'; g.stroke(); g.beginPath(); g.arc(lxs * R * .02, R * .34, R * .022, 0, TAU); g.fillStyle = 'rgba(255,255,255,.42)'; g.fill();
    } else {
    for (let s = -1; s <= 1; s += 2) { drawEye(g, st, d, s, s * ex, ey, er, lxs, pal); drawBrow(g, st, d, s, s * ex, ey - er * (d.browW > 4 ? 1.85 : 1.55), er, pal); }
    g.beginPath(); g.arc(0, R * .36, R * .08, .2, Math.PI - .2); g.lineWidth = 2.6; g.strokeStyle = d.skinD; g.stroke(); g.beginPath(); g.arc(lxs * R * .035, R * .3, R * .028, 0, TAU); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill();
    }
    g.restore();
    if (S.chin) { g.drawImage(S.chin.c, S.chin.x + fx * .75, S.chin.y + e.mO * R * .05, S.chin.w, S.chin.h); }
    g.save(); g.translate(fx, fy); drawMouth(g, st, d, R, st.id, pal); if (S.front) blit(g, S.front); g.restore();
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
    o = o || {}; const d0 = DEFS[id]; if (!d0) return; const d = C.resolve ? C.resolve(id, d0, o) : d0; let anim = o.anim || 'idle', talk = o.talk;
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
    const shirtC = d._fit ? d.shirt : (o.shirt || (C.shirts[o.shirtId] && C.shirts[o.shirtId].color) || d.shirt), hatId = d._fit ? (d._hat && C.hats[d._hat] ? d._hat : '') : (o.hat && C.hats[o.hat] ? o.hat : ''), flip = st.dirS < 0, S = getSet(id, d, shirtC, hatId, levelFor(g, d, o), flip), lxs = flip ? 1 : -1;
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
      if (d.v4) drawLeg4(g, d, S, hx, hy, fx, fy, legCol, isDressy(d), lxs); else { PT[0] = hx; PT[1] = hy; PT[2] = fx; PT[3] = fy; if (d.shorts && !isDressy(d)) { limb(g, 2, (d.legW || 17) - 1.5, d.sockC || '#f4f1ea', legK, lxs, true); PT[2] = hx + (fx - hx) * d.shorts; PT[3] = hy + (fy - hy) * d.shorts; limb(g, 2, (d.legW || 17) + 3, legCol, legK, lxs, true); } else limb(g, 2, d.legW || 17, legCol, legK, lxs, true); if (d.legStripe && !isDressy(d)) { const sg = Math.sign(hx || 1); PT[0] = hx + sg * (d.legW || 17) * .4; PT[1] = hy + 6; PT[2] = fx + sg * (d.legW || 17) * .4; PT[3] = fy - 8; poly(g, 2, 0, 0, 2.6, d.legStripe); } }
      if (!d.v4 && d.top === 'placket') { g.beginPath(); g.moveTo(fx - 8, fy - 6); g.lineTo(fx + 8, fy - 6); g.lineWidth = 3; g.strokeStyle = 'rgba(120,80,0,.35)'; g.stroke(); }
      if (!d.v4 && d.top !== 'placket' && !isDressy(d)) { g.beginPath(); g.moveTo(fx - 7, fy - 5); g.lineTo(fx + 7, fy - 5); g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.14)'; g.stroke(); }
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

  /* drawing helpers shared with engine/dress.js (outfit decorations are drawn with the same shaded-part toolkit as the base look) */
  C.kit = { skirtGeo, isDressy, part, fold, line, dot, bead, overlay, pRR, pEll, pCirc, pPoly, lite, dark, mixc, rgba, star5, heart5, mkSpr, tsample, tfill, tpath, tband, TKC, TKS, OL, TAU, get LX() { return LX; }, get LV() { return LV; } };

  /* ================= PORTRAITS (HUD avatars, dialogs, video call) ================= */
  C.portrait = function (g, id, cx, cy, r, o) {
    const d = DEFS[id], k = r * .62 / (d.R * d.sc) * (d.pk || 1), hy = (d.L + d.T + 4 + d.R * .86) * d.sc * k;
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
    const d = DEFS[id], k = r * .62 / (d.R * d.sc) * (d.pk || 1), hy = (d.L + d.T + 4 + d.R * .86) * d.sc * k;
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
