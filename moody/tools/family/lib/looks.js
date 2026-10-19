/* config "look" -> chars.js properties.  Presets are used when a slot changes gender (so the character is not a boy in a skirt). */
'use strict';
const { shade } = require('./charspatch');
const HAIR = '#3b2417';
const TOPS = ['placket', 'vneck', 'polo', 'crew', 'dress', 'blouse', 'floral', 'hoodie', 'cardigan'];   // cardigan = the v3 long jacket of the older sister
const HAIRS = ['curly', 'ponytail', 'pigtails', 'bob', 'scarf', 'short'];
const GIRL_KEYS_OFF = { v3: null, v4: null, pk: null, hijab: null, pin: null, cuff: null, shoeAcc: null, braid: null, stitch: null, ribbon: null, charm: null, hat: null, iris: null, belt: null, skirt: null, keepSkirt: null, flowers: null, scarf: null, under: null, ruffle: null, sleeveLong: null, lash: null, neckPhones: null, bag: null, sunhat: null, bunny: null, smile: null, legC: null, legW: null, trim: null, belt: null, tie: null };
/* what to apply when the gender differs from the base character of that slot */
function genderPreset(slot, gender, skin) {
  if (gender === 'f') {   // boy slot -> girl
    const older = slot === 'moody';
    // characters v4 (V4P only fills fields that are undefined, so a changed style needs explicit values, not deletions)
    const v4 = { eyeK: 'girl', browK: .85, mw: .84, shoeK: 'flat', shoeAcc: '#ffffff', hemC: older ? '#8a6bd6' : '#ff86ad', lips: false, soft: false, lines: 0, blush: .28 };
    return Object.assign(v4, { top: 'dress', hair: older ? 'ponytail' : 'pigtails', hairC: HAIR, shirt: older ? '#8a6bd6' : '#ff86ad', pants: skin, legC: skin, legW: 11, lash: true, trim: '#fff', belt: '#ffd23c', shoe: '#ffffff', tie: older ? '#ff6f91' : '#ffffff', curl: null, stripes: null });
  }
  // girl/grandma slot -> boy/grandpa
  const base = Object.assign({}, GIRL_KEYS_OFF, { top: slot === 'nana' ? 'polo' : slot === 'toota' ? 'polo' : 'crew', hair: 'short', hairC: slot === 'nana' ? '#cfcfd6' : HAIR, shirt: slot === 'nana' ? '#8fa6b8' : '#3f86d6', pants: '#3b3f50', shoe: '#f3eee2', curl: null });
  if (slot === 'nana') Object.assign(base, { beard: '#cfcfd6', eyeK: 'man', browK: 1.1, lips: false, shoeK: 'dress', lines: 2, scarfDots: false, blush: .1 });
  return base;
}
/* explicit user look -> properties (null = remove the property) */
function lookProps(look, ctx) {
  look = look || {}; const p = {};
  const set = (k, v) => { p[k] = v; };
  if (look.skin) { set('skin', look.skin); set('skinD', shade(look.skin, -.1)); }
  if (look.hairStyle) { if (!HAIRS.includes(look.hairStyle)) throw new Error('look.hairStyle must be one of ' + HAIRS.join('|') + ' (got ' + look.hairStyle + ')'); set('hair', look.hairStyle); }
  if (look.hairColor) set('hairC', look.hairColor);
  if (look.outfit) { if (!TOPS.includes(look.outfit)) throw new Error('look.outfit must be one of ' + TOPS.join('|') + ' (got ' + look.outfit + ')'); set('top', look.outfit); }
  if (look.shirt) set('shirt', look.shirt);
  if (look.bottom) { if (/^(dress|blouse|floral|cardigan)$/.test(look.outfit || ctx.top)) { set('skirt', look.bottom); set('keepSkirt', true); } else set('pants', look.bottom); }
  if (look.shoe) set('shoe', look.shoe);
  if (look.shirt && !look.bottom && /^(dress|floral)$/.test(look.outfit || ctx.top)) set('skirt', look.shirt);   // one-piece dress: skirt follows the colour
  if (look.glasses === false) set('glasses', null); else if (look.glasses) set('glasses', look.glasses === true ? '#5a4636' : look.glasses);
  if (look.hijab === false) { set('scarf', null); set('under', null); if ((look.hairStyle || ctx.hair) === 'scarf') set('hair', 'bob'); }
  else if (look.hijab) { const h = look.hijab === true ? {} : look.hijab; set('hair', 'scarf'); set('scarf', h.scarf || '#f8f3ea'); set('under', 'under' in h ? h.under : (look.shirt || ctx.shirt || '#6b1f3d')); }
  if (look.hat === false) set('sunhat', null); else if (look.hat) set('sunhat', look.hat === true ? '#f6c3cf' : look.hat);
  if (look.headphones === false) { set('neckPhones', null); set('bunny', null); } else if (look.headphones) set('neckPhones', look.headphones === true ? '#f4c5d2' : look.headphones);
  if (look.bag === false) set('bag', null); else if (look.bag) set('bag', look.bag === true ? '#d9c3a0' : look.bag);
  if (look.beard === false) set('beard', null); else if (look.beard) set('beard', look.beard === true ? (look.hairColor || '#17120e') : look.beard);
  if (look.lashes === true) set('lash', true); if (look.lashes === false) set('lash', null);
  if (look.extra && typeof look.extra === 'object') Object.keys(look.extra).forEach(k => set(k, look.extra[k]));
  // characters v3 keep colour aliases next to the classic keys: hijab == scarf, hat == sunhat; pin belongs to the hijab
  if ('scarf' in p) { p.hijab = p.scarf; if (p.scarf === null) p.pin = null; }
  if ('sunhat' in p) p.hat = p.sunhat;
  return p;
}
module.exports = { genderPreset, lookProps, TOPS, HAIRS };
