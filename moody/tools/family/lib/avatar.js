/* Generic cartoon avatar (SVG) drawn from the character's final properties. Used when the family supplies no avatar,
   so that NOTHING of the base edition's portraits ships in a customer copy. 256x256, shown in a circle by the game. */
'use strict';
const { shade } = require('./charspatch');
function svg(p, o) {
  o = o || {}; const skin = p.skin || '#dd9d6c', skinD = p.skinD || shade(skin, -.1), hairC = p.hairC || '#3b2417', shirt = p.shirt || '#5aa0f0';
  const bg1 = o.bg1 || '#ffe9b8', bg2 = o.bg2 || '#ffc98a', hair = p.hair || 'short', ol = '#4a2e1c';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bg1 + '"/><stop offset="1" stop-color="' + bg2 + '"/></linearGradient></defs>';
  s += '<rect width="256" height="256" fill="url(#bg)"/>';
  const L = x => 'stroke="' + ol + '" stroke-width="' + x + '" stroke-linejoin="round"';
  const scarfy = hair === 'scarf';
  // behind-head hair
  if (hair === 'ponytail') s += '<ellipse cx="190" cy="140" rx="18" ry="40" transform="rotate(-25 190 140)" fill="' + hairC + '" ' + L(5) + '/>';
  if (hair === 'pigtails') s += '<ellipse cx="62" cy="150" rx="18" ry="34" transform="rotate(12 62 150)" fill="' + hairC + '" ' + L(5) + '/><ellipse cx="194" cy="150" rx="18" ry="34" transform="rotate(-12 194 150)" fill="' + hairC + '" ' + L(5) + '/>';
  if (hair === 'bob') s += '<ellipse cx="68" cy="140" rx="24" ry="48" fill="' + hairC + '" ' + L(5) + '/><ellipse cx="188" cy="140" rx="24" ry="48" fill="' + hairC + '" ' + L(5) + '/>';
  if (scarfy) s += '<path d="M40 190 Q38 60 128 52 Q218 60 216 190 Q200 230 128 232 Q56 230 40 190Z" fill="' + shade(p.scarf || '#f8f3ea', -.08) + '" ' + L(5) + '/>';
  // shoulders / shirt
  s += '<path d="M24 256 Q28 196 90 190 L166 190 Q228 196 232 256Z" fill="' + shirt + '" ' + L(6) + '/>';
  if (p.top === 'polo' || p.top === 'placket') s += '<path d="M104 190 L128 222 L152 190" fill="none" ' + L(4) + '/>';
  if (p.top === 'vneck') s += '<path d="M104 190 L128 224 L152 190" fill="#fff" ' + L(4) + '/>';
  // neck + head
  s += '<rect x="108" y="168" width="40" height="36" rx="10" fill="' + skinD + '" ' + L(5) + '/>';
  s += '<ellipse cx="128" cy="120" rx="62" ry="64" fill="' + skin + '" ' + L(6) + '/>';
  if (!scarfy) s += '<circle cx="66" cy="128" r="11" fill="' + skin + '" ' + L(4) + '/><circle cx="190" cy="128" r="11" fill="' + skin + '" ' + L(4) + '/>';
  // hair on top
  if (scarfy) {
    s += '<path d="M64 130 Q58 52 128 46 Q198 52 192 130 Q186 92 128 86 Q70 92 64 130Z" fill="' + (p.scarf || '#f8f3ea') + '" ' + L(5) + '/>';
    if (p.under) s += '<path d="M72 118 Q80 80 128 78 Q176 80 184 118 Q150 98 128 98 Q106 98 72 118Z" fill="' + p.under + '" ' + L(4) + '/>';
  } else if (hair === 'curly') {
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI, x = 128 + Math.cos(a) * 58, y = 112 + Math.sin(a) * 58; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="19" fill="' + hairC + '" ' + L(4) + '/>'; }
    s += '<path d="M72 96 Q128 56 184 96 Q160 80 128 80 Q96 80 72 96Z" fill="' + hairC + '"/>';
  } else {
    s += '<path d="M66 118 Q60 48 128 44 Q196 48 190 118 Q170 76 128 78 Q86 76 66 118Z" fill="' + hairC + '" ' + L(5) + '/>';
    if (hair === 'ponytail') s += '<circle cx="176" cy="84" r="8" fill="' + (p.tie || '#ff6f91') + '" ' + L(3) + '/>';
  }
  if (p.sunhat) s += '<ellipse cx="128" cy="78" rx="86" ry="22" fill="' + p.sunhat + '" ' + L(5) + '/><path d="M80 76 Q128 20 176 76Z" fill="' + p.sunhat + '" ' + L(5) + '/>';
  // face
  const ey = 124; [-1, 1].forEach(sd => { s += '<ellipse cx="' + (128 + sd * 24) + '" cy="' + ey + '" rx="9" ry="11" fill="#fff" ' + L(3) + '/><circle cx="' + (128 + sd * 24) + '" cy="' + (ey + 2) + '" r="6" fill="#3a2013"/><circle cx="' + (128 + sd * 24 + 2) + '" cy="' + (ey - 1) + '" r="2" fill="#fff"/>'; if (p.lash) s += '<path d="M' + (128 + sd * 24 + sd * 8) + ' ' + (ey - 7) + ' l' + sd * 7 + ' -5" ' + L(3) + ' fill="none"/>'; });
  s += '<path d="M' + (128 - 36) + ' ' + (ey - 20) + ' q12 -8 24 0 M' + (128 + 12) + ' ' + (ey - 20) + ' q12 -8 24 0" fill="none" ' + L(4) + '/>';
  s += '<circle cx="' + (128 - 40) + '" cy="150" r="9" fill="#ff8f8f" opacity=".35"/><circle cx="' + (128 + 40) + '" cy="150" r="9" fill="#ff8f8f" opacity=".35"/>';
  if (p.beard) s += '<path d="M72 138 Q76 196 128 200 Q180 196 184 138 Q168 168 128 168 Q88 168 72 138Z" fill="' + p.beard + '" ' + L(4) + '/>';
  s += '<path d="M104 156 Q128 178 152 156" fill="' + (p.beard ? '#fff' : '#fff') + '" ' + L(4) + '/>';
  if (p.glasses) s += '<circle cx="104" cy="' + ey + '" r="19" fill="none" stroke="' + p.glasses + '" stroke-width="4"/><circle cx="152" cy="' + ey + '" r="19" fill="none" stroke="' + p.glasses + '" stroke-width="4"/><path d="M123 ' + ey + ' h10" stroke="' + p.glasses + '" stroke-width="4"/>';
  if (p.neckPhones) s += '<path d="M60 150 Q60 238 128 238 Q196 238 196 150" fill="none" stroke="' + p.neckPhones + '" stroke-width="9" stroke-linecap="round" opacity=".9"/>';
  return s + '</svg>';
}
module.exports = { svg };
