/* Moody & Aboody - engine/runner_hero.js : BACK-VIEW run cycle of the playable heroes for the 3-lane runner kit.
   The hero is seen from behind, ~120 px tall at the bottom of the screen.  Everything is built from the character table
   (Moody.chars.defs[id]: skin, hair/hijab/sunhat, shirt, pants, shoe, bag ...) and baked ONCE per (hero, outfit, pixel density)
   into small painted sprites (G.paint = soft gradients + thin tone outlines, same look as the painted rooms):
        upper (torso + head + hair/hijab/hat + bag), 2 legs (+ 'sole up' variant), 2 arms, skirt (dresses), rocket pack.
   Per frame only transforms + drawImage are used (no allocation, no gradients).
   API:  Moody.runnerHero.draw(g, id, x, y, o)   x,y = feet centre (px)
           o = { pose:'run'|'jump'|'roll'|'stumble'|'cheer'|'idle', ph (run phase 0..1), t (seconds), lean (-1..1 sideways velocity),
                 sc (extra scale), alpha, rocket (bool), dbl (0..1 double-jump flip progress), spin (0..1 roll progress), carry (art name), stars (bool: dizzy stars) }
         Moody.runnerHero.height(id)  -> px at sc 1        Moody.runnerHero.warm(ids)   Moody.runnerHero.clear() */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, C = M.chars, A = M.art, TAU = Math.PI * 2;
  const RH = M.runnerHero = {};
  const RIG = {};
  const hexOf = c => c;

  /* px height of the hero on screen (feet to top of head) - damped so Aboody is clearly smaller but still readable */
  function designH(d) { return d.L + d.T + 4 + d.R * 2 + (d.sunhat ? d.R * .9 : 0); }
  RH.height = function (id) { const d = C.defs[id]; return 122 * Math.pow(designH(d) / designH(C.defs.moody), .55); };
  RH.scaleOf = function (id) { const d = C.defs[id]; return RH.height(id) / designH(d); };

  function mk(x0, y0, x1, y1, ppu, fn) {
    const c = G.mkCanvas((x1 - x0) * ppu + 2, (y1 - y0) * ppu + 2), x = c.getContext('2d');
    x.scale(ppu, ppu); x.translate(-x0, -y0); x.lineJoin = 'round'; x.lineCap = 'round';
    const pp = G.paint; G.paint = true; try { fn(x); } finally { G.paint = pp; }
    return { c, x0, y0, w: c.width / ppu, h: c.height / ppu };
  }
  /* shaded blob helpers (key light top-left): horizontal+vertical gradient, thin dark outline */
  function shade(x, col, bb, lw) {
    const T = G.tones(col), gr = x.createLinearGradient(bb[0], bb[1], bb[0] + bb[2], bb[1] + bb[3] * .35);
    gr.addColorStop(0, T[0]); gr.addColorStop(.42, col); gr.addColorStop(1, T[2]); x.fillStyle = gr; x.fill();
    const g2 = x.createLinearGradient(0, bb[1], 0, bb[1] + bb[3]); g2.addColorStop(0, 'rgba(255,255,255,.16)'); g2.addColorStop(.4, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(40,12,0,.16)');
    x.fillStyle = g2; x.fill(); if (lw !== 0) { x.lineWidth = lw || 1.8; x.strokeStyle = T[3]; x.stroke(); }
  }
  function rr(x, X, Y, W, H, r, col, lw) { G.rr(x, X, Y, W, H, r); shade(x, col, [X, Y, W, H], lw); }
  function ell(x, cx, cy, a, b, col, lw, rot) { x.beginPath(); x.ellipse(cx, cy, Math.abs(a), Math.abs(b), rot || 0, 0, TAU); shade(x, col, [cx - a, cy - b, a * 2, b * 2], lw); }
  function line(x, x0, y0, x1, y1, w, col) { x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.lineWidth = w; x.strokeStyle = col; x.stroke(); }
  function dot(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function cap(x, cx, cy, r, col) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); shade(x, col, [cx - r, cy - r, r * 2, r * 2], 1.5); }

  function outfit(id) {
    const d = C.defs[id], eq = (M.save.data.cosm && M.save.data.cosm.eq && M.save.data.cosm.eq[id]) || {};
    let shirt = d.shirt; if (eq.shirt && C.shirts[eq.shirt] && (!C.shirts[eq.shirt].for || C.shirts[eq.shirt].for.indexOf(id) >= 0)) shirt = C.shirts[eq.shirt].color;
    return { d, shirt, hat: eq.hat && C.hats[eq.hat] && (!C.hats[eq.hat].for || C.hats[eq.hat].for.indexOf(id) >= 0) ? eq.hat : null, key: id + '|' + shirt + '|' + (eq.hat || '') };
  }

  function bake(id, ppu) {
    const O = outfit(id), d = O.d, sh = O.shirt, L = d.L, T = d.T, R = d.R, rx = R * d.hr, sw = d.sw, ty = -(L + T), dressy = !!d.skirt;
    const legW = Math.max(12, d.w * .78), hy = ty - R + 8, rig = { d, L, T, R, sw, ty, legW, hy, dressy };
    const hairC = d.hairC || '#3b2417', skin = d.skin, skinD = d.skinD || G.shade(skin, -.12);
    const pants = dressy ? (d.legC || skin) : d.pants;

    /* ---------- upper body ---------- */
    const hatWide = d.sunhat ? R * 2.35 : (d.hair === 'scarf' ? rx * 1.5 : rx * 1.35 + R * (d.curl || .3) * 1.4);
    rig.upper = mk(-Math.max(sw + 14, hatWide), hy - R * 2.6, Math.max(sw + 14, hatWide), ty + T + 14, ppu, x => {
      /* seat / belt (pants) peeks under the shirt */
      if (!dressy) rr(x, -sw + 1, ty + T - 10, sw * 2 - 2, 26, 8, pants, 1.6);
      /* torso (back of the shirt) */
      rr(x, -sw, ty, sw * 2, T + 6, 11, sh, 1.8);
      x.save(); G.rr(x, -sw, ty, sw * 2, T + 6, 11); x.clip();
      if (d.top === 'vneck') { x.fillStyle = 'rgba(255,255,255,.92)'; for (let yy = 4; yy < T + 8; yy += 9) for (let xx = (((yy - 4) / 9) % 2) * 5 - sw + 3; xx < sw; xx += 10) { x.beginPath(); x.arc(xx + 2, ty + yy, 1.9, 0, TAU); x.fill(); } }
      if (d.top === 'placket') { line(x, -sw, ty + 15, sw, ty + 15, 1.6, 'rgba(40,20,10,.22)'); line(x, 0, ty + 2, 0, ty + 15, 1.4, 'rgba(40,20,10,.2)'); x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(-9, ty + 3, 18, 3); }
      if (d.top === 'hoodie') { line(x, 0, ty + T * .5, 0, ty + T * .5 + 4, 0.1, 'rgba(0,0,0,0)'); x.fillStyle = 'rgba(40,0,20,.1)'; x.fillRect(-sw, ty + T - 14, sw * 2, 2); }
      if (d.top === 'blouse') { x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(-sw, ty + 8, sw * 2, 3); line(x, 0, ty + 10, 0, ty + T - 6, 1.4, 'rgba(60,0,30,.18)'); }
      const hl = x.createLinearGradient(-sw, 0, sw, 0); hl.addColorStop(0, 'rgba(255,255,255,.14)'); hl.addColorStop(.5, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(30,5,0,.16)'); x.fillStyle = hl; x.fillRect(-sw, ty, sw * 2, T + 6);
      line(x, -sw + 3, ty + T * .7, sw - 3, ty + T * .7, 2, 'rgba(30,5,0,.1)');
      x.restore();
      if (dressy) { /* waist ribbon of the blouse */ line(x, -sw + 2, ty + T - 1, sw - 2, ty + T - 1, 3, G.shade(sh, -.22)); }
      /* hoodie hood bunched behind the neck (nemo) */
      if (d.top === 'hoodie') { ell(x, 0, ty + 3, sw * .62, 9, G.shade(sh, -.1), 1.6); line(x, -4, ty + 8, -5, ty + 24, 2.6, '#fff'); line(x, 4, ty + 8, 5, ty + 24, 2.6, '#fff'); dot(x, -5, ty + 25, 2.4, '#fff'); dot(x, 5, ty + 25, 2.4, '#fff'); }
      /* neck */
      if (d.hair !== 'scarf' && d.top !== 'hoodie') rr(x, -R * .34, hy + R * .55, R * .68, R * .8, 4, skinD, 1.4);
      /* bag with strap (toota) */
      if (d.bag) { line(x, -sw + 6, ty + 4, sw - 2, ty + T - 6, 4, G.shade(d.bag, -.25)); rr(x, sw - 20, ty + T - 22, 26, 22, 6, d.bag, 1.8); line(x, sw - 20, ty + T - 15, sw + 6, ty + T - 15, 1.5, 'rgba(60,30,10,.35)'); dot(x, sw - 7, ty + T - 13, 2, '#e8c36a'); }
      /* ----- head (from behind) ----- */
      if (d.hair === 'scarf') {   // hijab: drape over the shoulders + head shape
        const dr = d.top === 'blouse' ? 1.22 : 1.1;
        const hj = d.hijab || d.scarf; ell(x, 0, hy + R * 1.02, rx * dr, R * .66, G.shade(hj, -.08), 1.8);
        ell(x, 0, hy - R * .02, rx * 1.2, R * 1.17, hj, 1.8);
        x.save(); x.beginPath(); x.ellipse(0, hy - R * .02, rx * 1.2, R * 1.17, 0, 0, TAU); x.clip();
        [-1, 1].forEach(s => { x.beginPath(); x.moveTo(s * rx * .55, hy - R * .5); x.quadraticCurveTo(s * rx * 1.0, hy + R * .1, s * rx * .75, hy + R * .85); x.lineWidth = 3; x.strokeStyle = 'rgba(70,40,20,.13)'; x.stroke(); });
        x.restore();
        if (d.under) { x.beginPath(); x.ellipse(0, hy + R * .1, rx * 1.2, R * 1.17, 0, .62, 2.52); x.lineWidth = 4.5; x.strokeStyle = d.under; x.globalAlpha = .85; x.stroke(); x.globalAlpha = 1; }
        if (d.neckPhones) { x.beginPath(); x.ellipse(0, hy + R * .85, rx * 1.15, R * .42, 0, .1, Math.PI - .1); x.lineWidth = 5; x.strokeStyle = d.neckPhones; x.stroke(); [-1, 1].forEach(s => cap(x, s * rx * 1.12, hy + R * .78, 7, d.neckPhones)); }
      } else if (d.sunhat) {      // bob hair under a big woven sun hat with two bows
        ell(x, 0, hy + R * .22, rx * 1.12, R * 1.05, hairC, 1.6);
        if (d.braid) { const bl = T * .62, bx = -rx * .22; for (let i = 0; i < 6; i++) ell(x, bx + (i % 2 ? 3.2 : -3.2) * (1 - i * .08), hy + R * .95 + i * bl / 6, 8.4 - i * .5, 7.4, i % 2 ? G.shade(hairC, .1) : hairC, 1.2); [-1, 1].forEach(q => { x.beginPath(); x.moveTo(bx, hy + R * .95 + bl); x.lineTo(bx + q * 11, hy + R * .95 + bl + 7); x.lineTo(bx + q * 9, hy + R * .95 + bl - 4); x.closePath(); shade(x, d.ribbon || '#ff7fae', [bx - 11, hy + R * .95 + bl - 4, 22, 11], 1.2); }); cap(x, bx, hy + R * .95 + bl + 1, 3.2, G.shade(d.ribbon || '#ff7fae', -.12)); }
        [-1, 1].forEach(s => ell(x, s * rx * 1.02, hy + R * .85, rx * .22, R * .26, skin, 1.2));
        if (d.neckPhones) { x.beginPath(); x.ellipse(0, hy + R * 1.05, rx * 1.1, R * .3, 0, .1, Math.PI - .1); x.lineWidth = 4.5; x.strokeStyle = d.neckPhones; x.stroke(); [-1, 1].forEach(s => { cap(x, s * rx * 1.08, hy + R * 1.0, 6.5, d.neckPhones); if (d.bunny) ell(x, s * rx * 1.18, hy + R * .62, 4.6, 11, '#fff', 1.4, s * .18); }); }
        const hc = d.hat || d.sunhat, by = hy - R * .62, rib = d.ribbon || '#ff6f91';
        ell(x, 0, by + 4, R * 2.3, R * .72, G.shade(hc, -.08), 1.8);                       // brim
        x.save(); x.beginPath(); x.ellipse(0, by + 4, R * 2.3, R * .72, 0, 0, TAU); x.clip(); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 1.4; for (let i = -9; i <= 9; i++) { x.beginPath(); x.moveTo(i * R * .24, by - R * .5); x.lineTo(i * R * .24 + R * .4, by + R * 1.0); x.stroke(); } x.restore();
        ell(x, 0, by - R * .38, R * 1.16, R * .92, hc, 1.8);                                 // dome
        x.save(); x.beginPath(); x.ellipse(0, by - R * .38, R * 1.16, R * .92, 0, 0, TAU); x.clip(); x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 1.3; for (let i = -6; i <= 6; i++) { x.beginPath(); x.moveTo(i * R * .22, by - R * 1.4); x.lineTo(i * R * .22 - R * .3, by + R * .6); x.stroke(); } x.restore();
        rr(x, -R * 1.12, by + R * .02, R * 2.24, R * .24, 3, rib, 1.4);               // ribbon band
        [-1, 1].forEach(s => { x.beginPath(); x.moveTo(s * R * 0.2, by + R * .14); x.lineTo(s * R * 1.1, by + R * .7); x.lineTo(s * R * .95, by - R * .12); x.closePath(); shade(x, rib, [s * R * .1, by - R * .1, R, R * .8], 1.4); });
        cap(x, 0, by + R * .14, R * .17, G.shade(rib, -.1));
        [-1, 1].forEach(s => line(x, s * R * .1, by + R * .2, s * R * .45, by + R * 1.35, 3.4, rib));
      } else {                    // curly hair (moody / aboody) - back of the head
        const cr = R * (d.curl || .3);
        ell(x, 0, hy, rx * 1.0, R * .98, hairC, 0);
        for (let i = 0; i < 14; i++) { const a = Math.PI * 1.02 + i / 13 * (Math.PI * 1.0) - Math.PI * .02; const bx = Math.cos(a) * rx * 1.02, by2 = hy + Math.sin(a) * R * .98 * 1.0; cap(x, bx, by2, cr * 1.15, i % 3 ? hairC : G.shade(hairC, .16)); }
        for (let i = 0; i < 5; i++) cap(x, (i - 2) * cr * 1.5, hy - R * .85 - (i === 2 ? cr * .3 : 0), cr * 1.2, G.shade(hairC, .08 + (i % 2) * .08));
        ell(x, 0, hy + R * .05, rx * .96, R * .86, hairC, 0);
        for (let i = 0; i < 9; i++) cap(x, (i - 4) * cr * 1.15 + ((i % 2) ? cr * .3 : -cr * .3), hy - R * .1 + (i % 3) * cr * .9, cr * 1.1, G.shade(hairC, (i % 3) * .08));
        [-1, 1].forEach(s => ell(x, s * rx * .98, hy + R * .38, R * .17, R * .24, skin, 1.2));  // ears
        for (let i = 0; i < 5; i++) cap(x, (i - 2) * cr * 1.1, hy + R * .7 - Math.abs(i - 2) * cr * .45, cr * .95, hairC);   // nape curls
      }
      /* cosmetic hat from the shop */
      if (O.hat && C.hats[O.hat]) { x.save(); x.translate(0, hy); try { C.hats[O.hat].draw(x, R); } catch (e) { } x.restore(); }
    });
    rig.top = rig.upper.y0;

    /* ---------- legs (pants + shoe); variant 1 = sole up (lifted foot) ---------- */
    const lw2 = legW;
    [0, 1].forEach(v => {
      rig['leg' + v] = mk(-lw2 / 2 - 6, -L - 4, lw2 / 2 + 6, 6, ppu, x => {
        const sl = 13;
        rr(x, -lw2 / 2, -L, lw2, L - sl + 2, 6, pants, 1.6);
        if (!dressy) { x.fillStyle = 'rgba(30,5,0,.1)'; x.fillRect(lw2 * .12, -L + 6, lw2 * .38, L - sl - 4); }
        if (!v) { rr(x, -lw2 / 2 - 3, -sl, lw2 + 6, sl + 2, 6, d.shoe, 1.8); x.fillStyle = 'rgba(30,20,10,.28)'; x.fillRect(-lw2 / 2 - 3, 0, lw2 + 6, 2.4); }
        else { rr(x, -lw2 / 2 - 2, -sl, lw2 + 4, sl - 1, 5, G.shade(d.shoe, -.18), 1.8); ell(x, 0, -sl * .35, lw2 * .5, sl * .34, '#3a2a22', 1.2); ell(x, 0, -sl * .5, lw2 * .26, sl * .18, '#5b463a', 0); }
      });
    });

    /* ---------- arms (sleeve + skin + hand); pivot = top centre ---------- */
    const a1 = d.a1 || 22, a2 = d.a2 || 22, aw = Math.max(9, d.sw * .5);
    rig.arm = mk(-aw - 4, -4, aw + 4, a1 + a2 + 14, ppu, x => {
      const long = d.sleeveLong;
      rr(x, -aw / 2, 0, aw, a1 * (long ? 1.05 : .62), 5, sh, 1.5);
      if (!long) rr(x, -aw * .43, a1 * .55, aw * .86, a1 * .5 + a2, 5, skin, 1.4); else rr(x, -aw * .46, a1 * .95, aw * .92, a2 * 1.0, 5, sh, 1.4);
      if (d.cuff && long) rr(x, -aw * .5, a1 + a2 - 5, aw, 5, 2, d.cuff, 1.2);
      cap(x, 0, a1 + a2 + 3, aw * .56, skin);
    });
    rig.armLen = a1 + a2 + 8; rig.aw = aw;

    /* ---------- skirt (dresses) ---------- */
    if (dressy) {
      const wy = ty + T - 6, geo = ({ cardigan: [-L * .2, sw + 13], hoodie: [-L * .46, sw + 11], floral: [-L * .16, sw + 15], blouse: [-L * .5, sw + 8] })[d.top] || [-L * .5, sw + 17], hem = geo[0], hw0 = sw * .92, hw1 = geo[1];
      rig.skirt = mk(-hw1 - 8, wy - 4, hw1 + 8, hem + 14, ppu, x => {
        x.beginPath(); x.moveTo(-hw0, wy); x.lineTo(hw0, wy); x.quadraticCurveTo(hw1 + 3, (wy + hem) / 2, hw1, hem); x.quadraticCurveTo(0, hem + 8, -hw1, hem); x.quadraticCurveTo(-hw1 - 3, (wy + hem) / 2, -hw0, wy); x.closePath();
        shade(x, d.skirt, [-hw1, wy, hw1 * 2, hem - wy], 1.8);
        x.save(); x.clip();
        if (d.flowers) for (let i = 0; i < 14; i++) { const fx = -hw1 + (i * 37) % (hw1 * 2), fy = wy + 8 + ((i * 53) % Math.max(8, hem - wy - 12)); dot(x, fx, fy, 3.6, d.flowers[i % d.flowers.length]); dot(x, fx, fy, 1.2, '#ffe14d'); }
        for (let k = 1; k <= 5; k++) { const a = -hw0 + hw0 * 2 * k / 6, b = a * hw1 / hw0; line(x, a, wy + 2, b * 1.04, hem + 3, 2.6, 'rgba(60,20,30,.1)'); }
        if (d.stitch) { x.setLineDash([3.4, 2.6]); x.beginPath(); x.moveTo(-hw1, hem - 6); x.quadraticCurveTo(0, hem + 1, hw1, hem - 6); x.lineWidth = 1.2; x.strokeStyle = 'rgba(255,255,255,.7)'; x.stroke(); x.setLineDash([]); }
        x.restore();
        if (d.top === 'cardigan') {   // longline cardigan back (burgundy) over the cream inner dress
          const ch = -L * .5, cw = hw1 * .94; x.beginPath(); x.moveTo(-hw0, wy - 3); x.lineTo(hw0, wy - 3); x.quadraticCurveTo(cw + 2, (wy + ch) / 2, cw, ch); x.quadraticCurveTo(0, ch + 7, -cw, ch); x.quadraticCurveTo(-cw - 2, (wy + ch) / 2, -hw0, wy - 3); x.closePath(); shade(x, sh, [-cw, wy, cw * 2, ch - wy], 1.8);
          line(x, 0, wy + 2, 0, ch + 4, 1.8, 'rgba(30,5,15,.28)'); line(x, -cw * .5, wy + 4, -cw * .6, ch, 2.2, 'rgba(255,255,255,.1)'); line(x, -hw0, wy + 4, hw0, wy + 4, 3.4, d.belt || G.shade(sh, .25)); line(x, -cw, ch - 1, cw, ch - 1, 2.4, d.cuff || '#fbf3ea');
        }
      });
      rig.skW = hw1; rig.skY = wy;
    }
    /* ---------- rocket pack ---------- */
    rig.rocket = mk(-16, -34, 16, 40, ppu, x => {
      x.beginPath(); x.moveTo(0, -34); x.quadraticCurveTo(15, -12, 12, 22); x.lineTo(-12, 22); x.quadraticCurveTo(-15, -12, 0, -34); x.closePath(); shade(x, '#f4f4f8', [-14, -34, 28, 56], 1.8);
      x.beginPath(); x.moveTo(0, -34); x.quadraticCurveTo(9, -26, 10, -14); x.lineTo(-10, -14); x.quadraticCurveTo(-9, -26, 0, -34); x.closePath(); shade(x, '#ef5350', [-10, -34, 20, 20], 1.4);
      cap(x, 0, -2, 6.4, '#4aa8e8'); [-1, 1].forEach(s => { x.beginPath(); x.moveTo(s * 11, 6); x.lineTo(s * 21, 24); x.lineTo(s * 11, 22); x.closePath(); shade(x, '#ef5350', [s * 11, 6, 10, 18], 1.4); }); rr(x, -8, 22, 16, 6, 3, '#6b6f7d', 1.2);
    });
    return rig;
  }

  const RC = {};   // per-hero memo: (canvas width, equipped shirt/hat) -> rig, so the hot path allocates nothing
  function rigOf(id) {
    const eq = (M.save.data.cosm && M.save.data.cosm.eq && M.save.data.cosm.eq[id]) || EMPTY, w = M.cv ? M.cv.width : 960, m = RC[id];
    if (m && m.w === w && m.sh === eq.shirt && m.hat === eq.hat) return m.rig;
    const O = outfit(id), kq = w / 960, ppu = Math.max(.6, RH.scaleOf(id) * kq * 1.1), key = O.key + '|' + ppu.toFixed(2);
    let r = RIG[key]; if (!r) { r = RIG[key] = bake(id, ppu); r.k = RH.scaleOf(id); r.id = id; r.key = key; }
    RC[id] = { w, sh: eq.shirt, hat: eq.hat, rig: r }; return r;
  }
  const EMPTY = {};
  RH.warm = function (ids) { (ids || ['moody', 'aboody', 'toota', 'nemo']).forEach(id => { try { rigOf(id); } catch (e) { console.error(e); } }); };
  RH.clear = function () { for (const k in RIG) delete RIG[k]; for (const k in RC) delete RC[k]; };

  const put = (g, p) => g.drawImage(p.c, p.x0, p.y0, p.w, p.h);
  const SIN = Math.sin, COS = Math.cos;

  RH.draw = function (g, id, x, y, o) {
    o = o || {}; const r = rigOf(id), d = r.d, k = r.k * (o.sc || 1), pose = o.pose || 'run', ph = o.ph || 0, s = SIN(ph * TAU), c = COS(ph * TAU), L = r.L, ty = r.ty;
    g.save(); if (o.alpha != null && o.alpha < 1) g.globalAlpha = o.alpha;
    g.translate(x, y); g.scale(k, k);
    let bob = 0, tilt = (o.lean || 0) * .1, lA = 0, rA = 0, legLift0 = 0, legLift1 = 0, armSwing = 0, armOut = .12, upY = 0, squash = 1, spread = 0;
    if (pose === 'run') { bob = -Math.abs(s) * 4.2; tilt += s * .045; legLift0 = Math.max(0, s) * 19; legLift1 = Math.max(0, -s) * 19; armSwing = s; }
    else if (pose === 'jump') { legLift0 = 20; legLift1 = 9; armSwing = .2; armOut = .6; tilt -= .03; bob = 0; }
    else if (pose === 'stumble') { const w = SIN((o.t || 0) * 20); tilt += w * .16; armOut = 1.0; armSwing = w * .5; legLift0 = 6 + w * 5; legLift1 = 6 - w * 5; squash = .9; spread = 4; }
    else if (pose === 'cheer') { bob = -Math.abs(SIN((o.t || 0) * 9)) * 7; armOut = 1.5; armSwing = 0; legLift0 = Math.max(0, SIN((o.t || 0) * 9)) * 6; }
    else { bob = SIN((o.t || 0) * 2.2) * 1.2; armOut = .08; }
    /* roll = a compact forward somersault; double-jump flip likewise */
    let spin = 0, scl = 1; if (pose === 'roll') { spin = (o.spin || 0) * TAU; scl = .62; } else if (o.dbl > 0 && o.dbl < 1) { spin = o.dbl * TAU; scl = .86; }
    if (spin || scl !== 1) { const cy = -(L + r.T * .5); g.translate(0, cy * scl); g.rotate(spin); g.scale(scl, scl); g.translate(0, -cy); if (pose === 'roll') { legLift0 = legLift1 = 22; armOut = .15; armSwing = 0; } }
    if (tilt) { g.translate(0, -L); g.rotate(tilt); g.translate(0, L); }
    if (squash !== 1) { g.scale(1, squash); }
    /* legs */
    const lx = r.legW * .56 + spread;
    for (let q = 0; q < 2; q++) {
      const lift = q ? legLift1 : legLift0, up = lift > 7 ? 1 : 0, sc = 1 - lift / (L * 1.1);
      g.save(); g.translate((q ? 1 : -1) * lx, -lift * .35); g.translate(0, -L); g.scale(1, Math.max(.45, sc)); g.translate(0, L); put(g, up ? r.leg1 : r.leg0); g.restore();
    }
    /* skirt over the legs */
    if (r.skirt) { g.save(); g.translate(0, r.skY); g.rotate(s * .03 * (pose === 'run' ? 1 : 0)); g.scale(1 + (pose === 'run' ? Math.abs(c) * .05 : 0), 1); g.translate(0, -r.skY); g.translate(0, bob * .6); put(g, r.skirt); g.restore(); }
    /* arms (behind the upper body: drawn first) - shoulder pivots */
    const sy = ty + 9 + bob;
    for (let q = 0; q < 2; q++) {
      const sg = q ? 1 : -1, sv = q ? -armSwing : armSwing, oz = armOut + Math.abs(sv) * .08, len = 1 + sv * .24, rot = sg * (oz) + (pose === 'cheer' ? sg * 2.4 : 0);
      g.save(); g.translate(sg * (r.sw + 2), sy - (pose === 'run' ? sv * 3 : 0)); g.rotate(-rot); g.scale(1, pose === 'cheer' ? 1 : len); put(g, r.arm); g.restore();
    }
    /* carried item (right hand) */
    if (o.carry && A.sprite) {
      const sp = A.sprite(o.carry, 64); if (sp) { g.save(); g.translate(r.sw + 14, sy + r.armLen * .86 + (pose === 'run' ? s * 3 : 0)); g.rotate(.1 + s * .08); g.drawImage(sp.c, -sp.hx * .5, -sp.hy * .56, sp.w * .5, sp.h * .5); g.restore(); }
    }
    /* upper body */
    g.save(); g.translate(0, bob); put(g, r.upper); g.restore();
    /* rocket pack on the back (we see the hero from behind, so it is drawn over the torso) */
    if (o.rocket) { g.save(); g.translate(0, ty + r.T * .52 + bob); put(g, r.rocket); const t = o.t || 0, f = 18 + SIN(t * 38) * 6; g.fillStyle = '#ffd23c'; g.beginPath(); g.moveTo(-6, 28); g.quadraticCurveTo(0, 28 + f * 1.9, 6, 28); g.closePath(); g.fill(); g.fillStyle = '#ff7a2a'; g.beginPath(); g.moveTo(-4, 28); g.quadraticCurveTo(0, 28 + f * 1.3, 4, 28); g.closePath(); g.fill(); g.fillStyle = '#fff6c0'; g.beginPath(); g.moveTo(-2, 28); g.quadraticCurveTo(0, 28 + f * .7, 2, 28); g.closePath(); g.fill(); g.restore(); }
    /* dizzy stars */
    if (o.stars) { const t = (o.t || 0) * 6, hy = r.hy + bob - r.R * (d.sunhat ? 2.2 : 1.35); for (let i = 0; i < 3; i++) { const a = t + i * 2.094; G.sparkle(g, COS(a) * r.R * 1.1, hy + SIN(a) * 5, 7, i % 2 ? '#ffe14d' : '#fff6a8'); } }
    g.restore();
  };
})();
