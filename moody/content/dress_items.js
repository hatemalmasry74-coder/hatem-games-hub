/* Moody & Aboody - content/dress_items.js : DATA of the dressing-room outfit system (items, colours, patterns, ready-made sets, fashion-show goals).
   No drawing code here (engine/dress.js draws, engine/dress_ui.js shows the panel).  Everything is selected by the character's DEFS `gender` ('m' | 'f') and by
   whether the character wears a hijab (DEFS hair === 'scarf'): NEVER by name, so the family-edition builder can flip a slot's gender by editing its DEFS row only.
   MODESTY RULES (children, Egyptian / Muslim family): every item covers the body fully - no sleeveless / shirtless / swim-trunk looks.  Girls: long sleeves, long skirts,
   leggings, tunics, hijab styles.  Boys: tee / shirt / hoodie / long or knee-length pants (with long socks).  The beach outfit is a rash-guard style full-cover set + sun hat.
   Item schema:
     { id, slot:'top'|'bottom'|'shoes'|'head'|'acc'|'hijab', g:'m'|'f'|'*', n:'Arabic name', kind:<drawing kind in engine/dress.js>, price:coins (0 = free),
       unlock:{stars:n}|{sticker:id}|null, cols:[colour ids] (default = every colour), pats:[pattern ids] (tops; default solid), c:default colour, p:default pattern,
       full:true (a dress / robe: replaces the bottom), hj:true (headwear that also suits a hijab), cat (accessory slot group), tags:[weather / occasion tags], isNew:true ('جديد' badge) }
   Colours are FREE (every colour of an owned item).  Items cost coins (the game's normal coins) or unlock with stars / stickers; never real money. */
(function () {
  'use strict';
  const M = window.Moody, D = M.dress = M.dress || {};

  /* ---- colours: id -> [Arabic name, hex] (names are spoken: 'حلو أوي اللون ده!') ---- */
  const COLORS = [['red', 'أحمر', '#e5534b'], ['orange', 'برتقالي', '#ff8a2a'], ['yellow', 'أصفر', '#ffcf3d'], ['green', 'أخضر', '#43a867'], ['mint', 'نعناعي', '#5fd0b0'], ['teal', 'تركواز', '#1fb5a6'],
    ['sky', 'سماوي', '#4aa8e8'], ['blue', 'أزرق', '#3b6fd0'], ['navy', 'كحلي', '#26396e'], ['purple', 'بنفسجي', '#8a6bd6'], ['lilac', 'ليلكي', '#c9b6ec'], ['pink', 'وردي', '#f2679a'],
    ['rose', 'وردي فاتح', '#ffb3cc'], ['peach', 'خوخي', '#ffb48a'], ['cream', 'كريمي', '#f3e6cf'], ['white', 'أبيض', '#f7f4ee'], ['gray', 'رمادي', '#9ea4ab'], ['black', 'أسود', '#34343c'],
    ['brown', 'بني', '#8a5a3a'], ['khaki', 'كاكي', '#c8b080'], ['maroon', 'عنابي', '#8b2346'], ['olive', 'زيتي', '#6b7a3a'], ['denim', 'جينز', '#4a6fa5']];
  D.colors = {}; COLORS.forEach(c => { D.colors[c[0]] = { id: c[0], n: c[1], c: c[2] }; });
  D.colorIds = COLORS.map(c => c[0]);
  D.pats = { solid: 'سادة', stripes: 'مقلّم', dots: 'منقّط', stars: 'نجوم', check: 'كاروهات', hearts: 'قلوب', long: 'طويل', short: 'قصير' };
  const PASTEL = ['rose', 'peach', 'lilac', 'mint', 'sky', 'cream', 'white', 'pink', 'yellow'], BRIGHT = ['red', 'orange', 'yellow', 'green', 'teal', 'sky', 'blue', 'purple', 'pink'], DARK = ['navy', 'black', 'maroon', 'brown', 'olive', 'gray', 'denim', 'blue'];
  const ANY = D.colorIds, JEANS = ['denim', 'navy', 'black', 'gray', 'blue', 'khaki'], PANTS = ['navy', 'black', 'gray', 'khaki', 'brown', 'olive', 'cream', 'maroon', 'denim', 'white', 'blue'];
  const ALLP = ['solid', 'stripes', 'dots', 'stars', 'check'], GP = ['solid', 'stripes', 'dots', 'stars', 'hearts', 'check'];

  const items = D.items = [];
  const reg = (slot, id, g, n, kind, o) => { items.push(Object.assign({ id, slot, g, n, kind, price: 0, unlock: null }, o || {})); };

  /* ---- tops (T): boys 10, girls 10 (several shared) ---- */
  reg('top', 'tee', '*', 'تيشيرت', 'tee', { c: 'sky', cols: ANY, pats: ALLP, tags: ['light'] });
  reg('top', 'longtee', '*', 'تيشيرت كم طويل', 'longtee', { c: 'teal', cols: ANY, pats: ALLP, tags: ['light', 'mid'] });
  reg('top', 'polo', 'm', 'بولو', 'polo', { c: 'blue', cols: ANY, pats: ['solid', 'stripes'], price: 8, tags: ['light', 'school'] });
  reg('top', 'shirt', '*', 'قميص بزراير', 'shirt', { c: 'white', cols: ANY, pats: ['solid', 'stripes', 'check'], price: 10, tags: ['school', 'formal'] });
  reg('top', 'hoodie', '*', 'هودي', 'hoodie', { c: 'orange', cols: ANY, pats: ['solid', 'stripes', 'stars'], price: 12, tags: ['warm'] });
  reg('top', 'sweater', '*', 'بلوفر', 'sweater', { c: 'maroon', cols: ANY, pats: ['solid', 'stripes', 'hearts', 'stars'], price: 12, tags: ['warm'] });
  reg('top', 'jersey', '*', 'فانلة رياضية', 'jersey', { c: 'red', cols: BRIGHT.concat(['navy', 'white']), pats: ['solid', 'stripes'], price: 10, tags: ['sport', 'light'], isNew: true });
  reg('top', 'jacket', '*', 'جاكيت', 'jacket', { c: 'navy', cols: ANY, pats: ['solid', 'check'], price: 18, tags: ['warm', 'rain'] });
  reg('top', 'puffer', '*', 'جاكيت شتوي', 'puffer', { c: 'red', cols: ANY, pats: ['solid'], price: 22, unlock: { stars: 6 }, tags: ['warm', 'warm2', 'rain'], isNew: true });
  reg('top', 'rash', '*', 'تيشيرت البحر', 'rash', { c: 'teal', cols: BRIGHT.concat(['navy']), pats: ['solid', 'stripes'], price: 10, tags: ['beach', 'sport'], isNew: true });
  reg('top', 'blouse', 'f', 'بلوزة بكشكش', 'blouse', { c: 'rose', cols: PASTEL.concat(['white', 'lilac', 'mint']), pats: ['solid', 'dots', 'hearts'], price: 10, tags: ['formal', 'light'] });
  reg('top', 'cardigan', 'f', 'كارديجان', 'cardigan', { c: 'lilac', cols: ANY, pats: ['solid', 'stripes'], price: 14, tags: ['warm', 'mid'] });
  /* ---- dresses / robes (full outfits: replace the bottom) ---- */
  reg('top', 'sundress', 'f', 'فستان ورد طويل', 'sundress', { c: 'mint', cols: PASTEL.concat(['sky', 'peach']), full: true, price: 16, tags: ['light', 'formal'], isNew: true });
  reg('top', 'partydress', 'f', 'فستان حفلة', 'partydress', { c: 'pink', cols: ANY, pats: ['solid', 'stars', 'dots'], full: true, price: 24, tags: ['party', 'formal'], isNew: true });
  reg('top', 'pinafore', 'f', 'مريلة مدرسة', 'pinafore', { c: 'navy', cols: ['navy', 'gray', 'maroon', 'denim', 'olive', 'black'], full: true, price: 0, tags: ['school', 'formal'], isNew: true });
  reg('top', 'denimdress', 'f', 'فستان جينز طويل', 'denimdress', { c: 'denim', cols: JEANS.concat(['rose']), full: true, price: 20, tags: ['mid'] });
  reg('top', 'tunic', 'f', 'تونيك طويلة', 'tunic', { c: 'peach', cols: ANY, pats: ['solid', 'dots', 'stripes'], full: true, price: 14, tags: ['light', 'mid'] });
  reg('top', 'cardidress', 'f', 'كارديجان طويل', 'cardidress', { c: 'maroon', cols: ANY, full: true, price: 26, unlock: { stars: 12 }, tags: ['warm', 'formal'] });
  reg('top', 'galabeya', 'm', 'جلابية', 'galabeya', { c: 'white', cols: ['white', 'cream', 'sky', 'gray', 'khaki', 'navy', 'mint'], full: true, price: 16, tags: ['formal', 'eid'], isNew: true });
  /* legacy shop items (ids kept so earlier purchases stay owned): colour dresses for the girls, colour tees for everybody (free now: the 'tee' item has every colour) */
  [['gmint', 'فستان نعناعي', '#5fd0b0', 'mint'], ['grose', 'فستان وردي', '#ff86ad', 'rose'], ['gblue', 'فستان أزرق', '#5aa0f0', 'sky'], ['gyel', 'فستان أصفر', '#ffcf3d', 'yellow']].forEach(a => reg('top', a[0], 'f', a[1], 'sundress', { c: a[3], cols: [a[3]], full: true, price: 12, legacy: true, tags: ['light', 'formal'] }));

  /* ---- bottoms (B): boys 6, girls 7 ---- */
  reg('bottom', 'pants', '*', 'بنطلون', 'pants', { c: 'khaki', cols: PANTS, tags: ['mid'] });
  reg('bottom', 'jeans', '*', 'جينز', 'jeans', { c: 'denim', cols: JEANS, price: 8, tags: ['mid'] });
  reg('bottom', 'joggers', '*', 'ترينج رياضي', 'joggers', { c: 'gray', cols: ['gray', 'navy', 'black', 'maroon', 'olive', 'blue', 'teal', 'purple'], price: 8, tags: ['sport', 'mid'] });
  reg('bottom', 'shorts', 'm', 'شورت للركبة', 'shorts', { c: 'khaki', cols: ['khaki', 'navy', 'blue', 'gray', 'olive', 'red', 'teal', 'black', 'white', 'denim'], price: 8, tags: ['light', 'sport', 'beach'], isNew: true });
  reg('bottom', 'school', 'm', 'بنطلون المدرسة', 'pants', { c: 'navy', cols: ['navy', 'gray', 'black', 'khaki'], tags: ['school', 'formal'] });
  reg('bottom', 'cargo', 'm', 'كارجو', 'cargo', { c: 'olive', cols: ['olive', 'khaki', 'gray', 'brown', 'navy', 'black'], price: 12, tags: ['mid'] });
  reg('bottom', 'wide', 'f', 'بنطلون واسع', 'wide', { c: 'cream', cols: PANTS.concat(['rose', 'lilac', 'mint']), tags: ['mid'] });
  reg('bottom', 'leggings', 'f', 'ليجن', 'leggings', { c: 'black', cols: ANY, tags: ['light', 'sport', 'mid'] });
  reg('bottom', 'longskirt', 'f', 'جيبة طويلة', 'longskirt', { c: 'cream', cols: ANY, pats: ['solid', 'stripes', 'dots', 'hearts', 'stars'], price: 10, tags: ['formal', 'mid'] });
  reg('bottom', 'midiskirt', 'f', 'جيبة للركبة وأطول', 'midiskirt', { c: 'denim', cols: ANY, pats: ['solid', 'check', 'dots'], price: 10, tags: ['formal', 'mid'], isNew: true });
  reg('bottom', 'pleated', 'f', 'جيبة بليسيه', 'pleated', { c: 'navy', cols: ANY, pats: ['solid', 'stripes', 'check'], price: 14, unlock: { sticker: 's_school' }, tags: ['school', 'formal'], isNew: true });

  /* ---- shoes (S): boys 5, girls 5 ---- */
  reg('shoes', 'sneaker', '*', 'كوتشي سبورت', 'sneaker', { c: 'white', cols: ANY, tags: ['sport', 'light', 'mid'] });
  reg('shoes', 'schoolshoe', 'm', 'جزمة المدرسة', 'schoolshoe', { c: 'black', cols: ['black', 'brown', 'navy', 'maroon'], price: 0, tags: ['school', 'formal'] });
  reg('shoes', 'maryjane', 'f', 'جزمة بحزام', 'maryjane', { c: 'black', cols: ['black', 'brown', 'navy', 'maroon', 'pink', 'white', 'rose', 'lilac'], tags: ['school', 'formal'] });
  reg('shoes', 'boots', '*', 'جزمة شتا', 'boots', { c: 'brown', cols: ['brown', 'black', 'navy', 'red', 'olive', 'maroon', 'yellow'], price: 14, tags: ['warm', 'rain'], isNew: true });
  reg('shoes', 'sandals', '*', 'صندل بشراب', 'sandals', { c: 'brown', cols: ['brown', 'cream', 'navy', 'rose', 'sky', 'black', 'white'], price: 8, tags: ['light', 'beach'], isNew: true });
  reg('shoes', 'cleats', 'm', 'كوتشي الكورة', 'cleats', { c: 'yellow', cols: BRIGHT.concat(['black', 'white']), price: 12, tags: ['sport'], isNew: true });
  reg('shoes', 'flats', 'f', 'جزمة بالية', 'flats', { c: 'rose', cols: ANY, price: 8, tags: ['light', 'formal'] });

  /* ---- headwear (H): boys 10, girls 10 (+ hijab styles for hijab-wearing girls) ---- */
  reg('head', 'cap', '*', 'كاب', 'cap', { c: 'red', cols: ANY, price: 10, tags: ['sun', 'sport'] });
  reg('head', 'capb', 'm', 'كاب للخلف', 'capb', { c: 'blue', cols: ANY, price: 10, tags: ['sun', 'sport'], isNew: true });
  reg('head', 'beanie', '*', 'طاقية شتا', 'beanie', { c: 'blue', cols: ANY, price: 15, tags: ['warm'] });
  reg('head', 'bucket', '*', 'برنيطة شمس', 'bucket', { c: 'khaki', cols: ANY, price: 12, hj: true, tags: ['sun', 'beach'], isNew: true });
  reg('head', 'sunhat', 'f', 'قبعة القش الكبيرة', 'sunhat', { c: 'rose', cols: ['rose', 'cream', 'peach', 'lilac', 'sky', 'mint', 'yellow'], price: 14, hj: true, tags: ['sun', 'beach'] });
  reg('head', 'taqiyah', 'm', 'طاقية', 'taqiyah', { c: 'white', cols: ['white', 'cream', 'sky', 'gray', 'navy', 'black'], price: 0, tags: ['eid', 'formal'], isNew: true });
  reg('head', 'headband', '*', 'رباط رياضي', 'headband', { c: 'red', cols: ANY, price: 6, tags: ['sport'], isNew: true });
  reg('head', 'helmet', '*', 'خوذة العجلة', 'helmet', { c: 'sky', cols: ANY, price: 14, tags: ['sport', 'safe'], isNew: true });
  reg('head', 'party', '*', 'طاقية حفلة', 'party', { c: 'pink', cols: ANY, price: 15, hj: true, tags: ['party'] });
  reg('head', 'crown', '*', 'تاج ملوكي', 'crown', { c: 'yellow', cols: ['yellow', 'sky', 'pink', 'lilac', 'mint'], price: 30, tags: ['party'] });
  reg('head', 'chef', '*', 'طاقية الشيف', 'chef', { c: 'white', cols: ['white', 'cream', 'rose', 'sky', 'yellow'], price: 20, tags: ['fun'] });
  reg('head', 'bow', 'f', 'فيونكة كبيرة', 'bow', { c: 'pink', cols: ANY, price: 10, hj: true, tags: ['party'] });
  reg('head', 'ribbon', 'f', 'شرائط شعر', 'ribbon', { c: 'rose', cols: ANY, price: 6, tags: ['light'], isNew: true });
  reg('head', 'hairband', 'f', 'عصابة شعر', 'hairband', { c: 'lilac', cols: ANY, price: 6, tags: ['light'], isNew: true });
  reg('head', 'tiara', 'f', 'تاج أميرة', 'tiara', { c: 'sky', cols: ['sky', 'pink', 'lilac', 'yellow', 'mint', 'white'], price: 25, hj: true, tags: ['party'] });
  reg('head', 'flower', 'f', 'تاج ورد', 'flower', { c: 'pink', cols: ANY, price: 20, hj: true, tags: ['party', 'light'] });
  reg('head', 'clip', 'f', 'مشبك ورد', 'clip', { c: 'yellow', cols: ANY, price: 10, hj: true, tags: ['light'] });
  /* hijab styles: only offered to characters whose hair is 'scarf' (hijab); each has its own colours + a print */
  reg('hijab', 'hj_plain', 'f', 'حجاب سادة', 'hj_plain', { c: 'cream', pats: ['long', 'short'], cols: ['cream', 'white', 'rose', 'pink', 'lilac', 'purple', 'sky', 'blue', 'navy', 'mint', 'teal', 'green', 'peach', 'brown', 'black', 'maroon', 'gray', 'yellow'], tags: ['mid'] });
  reg('hijab', 'hj_dots', 'f', 'حجاب منقّط', 'hj_dots', { c: 'rose', pats: ['long', 'short'], cols: ['cream', 'white', 'rose', 'pink', 'lilac', 'sky', 'mint', 'peach', 'navy', 'maroon'], price: 8, tags: ['mid'] });
  reg('hijab', 'hj_stripes', 'f', 'حجاب مقلّم', 'hj_stripes', { c: 'sky', pats: ['long', 'short'], cols: ['cream', 'white', 'rose', 'lilac', 'sky', 'mint', 'peach', 'navy', 'gray'], price: 8, tags: ['mid'] });
  reg('hijab', 'hj_floral', 'f', 'حجاب ورد', 'hj_floral', { c: 'cream', pats: ['long', 'short'], cols: ['cream', 'white', 'rose', 'lilac', 'sky', 'mint', 'peach', 'navy', 'maroon'], price: 12, tags: ['formal'], isNew: true });
  reg('hijab', 'hj_stars', 'f', 'حجاب نجوم', 'hj_stars', { c: 'navy', pats: ['long', 'short'], cols: ['navy', 'purple', 'maroon', 'teal', 'black', 'blue'], price: 14, unlock: { stars: 6 }, tags: ['party'], isNew: true });

  /* ---- accessories (A): boys 9, girls 10.  `cat` = what it is worn as: one item per group at a time ---- */
  reg('acc', 'g_round', '*', 'نضارة دايرة', 'g_round', { cat: 'face', c: 'brown', cols: ['brown', 'black', 'gold', 'rose', 'blue', 'red', 'green'], price: 6, tags: ['look'] });
  reg('acc', 'g_square', 'm', 'نضارة مربعة', 'g_square', { cat: 'face', c: 'black', cols: ['black', 'brown', 'blue', 'red', 'gray', 'green'], price: 6, tags: ['look'], isNew: true });
  reg('acc', 'g_cat', 'f', 'نضارة قطة', 'g_cat', { cat: 'face', c: 'rose', cols: ['rose', 'pink', 'purple', 'black', 'brown', 'sky', 'red'], price: 6, tags: ['look'], isNew: true });
  reg('acc', 'g_sun', '*', 'نضارة شمس', 'g_sun', { cat: 'face', c: 'black', cols: ['black', 'brown', 'blue', 'red', 'pink', 'yellow', 'green'], price: 8, tags: ['sun', 'beach'], isNew: true });
  reg('acc', 'pack', '*', 'شنطة ضهر', 'pack', { cat: 'back', c: 'blue', cols: ANY, price: 0, tags: ['school'] });
  reg('acc', 'bag', 'f', 'شنطة كتف', 'bag', { cat: 'back', c: 'cream', cols: ANY, price: 8, tags: ['look'] });
  reg('acc', 'scarf', '*', 'شال رقبة', 'scarf', { cat: 'neck', c: 'red', cols: ANY, price: 8, tags: ['warm'], isNew: true });
  reg('acc', 'watch', '*', 'ساعة إيد', 'watch', { cat: 'wrist', c: 'black', cols: ['black', 'brown', 'red', 'blue', 'pink', 'green', 'white'], price: 10, tags: ['look'] });
  reg('acc', 'phones', '*', 'سماعات', 'phones', { cat: 'phones', c: 'sky', cols: ANY, price: 10, tags: ['look'] });
  reg('acc', 'bdg_star', '*', 'دبوس نجمة', 'bdg_star', { cat: 'badge', c: 'yellow', cols: ['yellow', 'red', 'sky', 'pink', 'green', 'purple'], price: 0, tags: ['look'] });
  reg('acc', 'bdg_flag', '*', 'دبوس علم مصر', 'bdg_flag', { cat: 'badge', c: 'red', cols: ['red'], price: 0, tags: ['look', 'eid'], isNew: true });
  reg('acc', 'bdg_heart', 'f', 'دبوس قلب', 'bdg_heart', { cat: 'badge', c: 'pink', cols: ['pink', 'red', 'rose', 'purple', 'sky'], price: 0, tags: ['look'] });
  reg('acc', 'bdg_ball', 'm', 'دبوس كورة', 'bdg_ball', { cat: 'badge', c: 'white', cols: ['white'], price: 4, tags: ['look', 'sport'] });
  /* extra colour ids only accessories use */
  D.colors.gold = { id: 'gold', n: 'دهبي', c: '#e0b24a' };

  /* ---- ready-made sets (أطقم): one tap dresses all the slots; also what the fashion show asks for.  Each = {top:[itemId,colour,pattern], bottom, shoes, head, hijab, acc:[[id,colour]]} ---- */
  D.sets = [
    { id: 'st_school_m', g: 'm', n: 'طقم المدرسة', tags: ['school'], top: ['shirt', 'white', 'solid'], bottom: ['school', 'navy'], shoes: ['schoolshoe', 'black'], acc: [['pack', 'blue']] },
    { id: 'st_ball_m', g: 'm', n: 'طقم الكورة', tags: ['sport'], top: ['jersey', 'red', 'stripes'], bottom: ['shorts', 'white'], shoes: ['cleats', 'yellow'], head: ['headband', 'red'] },
    { id: 'st_winter_m', g: 'm', n: 'طقم الشتا', tags: ['warm'], top: ['puffer', 'red', 'solid'], bottom: ['jeans', 'denim'], shoes: ['boots', 'brown'], head: ['beanie', 'blue'], acc: [['scarf', 'yellow']] },
    { id: 'st_sea_m', g: 'm', n: 'طقم البحر', tags: ['beach'], top: ['rash', 'teal', 'stripes'], bottom: ['shorts', 'navy'], shoes: ['sandals', 'brown'], head: ['bucket', 'yellow'], acc: [['g_sun', 'black']], unlock: { sticker: 's_sea' } },
    { id: 'st_eid_m', g: 'm', n: 'طقم العيد', tags: ['eid', 'formal'], top: ['galabeya', 'white'], shoes: ['schoolshoe', 'brown'], head: ['taqiyah', 'white'], acc: [['bdg_flag', 'red']] },
    { id: 'st_park_m', g: 'm', n: 'طقم الحديقة', tags: ['sport', 'light'], top: ['tee', 'orange', 'stripes'], bottom: ['joggers', 'navy'], shoes: ['sneaker', 'white'], head: ['cap', 'red'] },
    { id: 'st_school_f', g: 'f', n: 'طقم المدرسة', tags: ['school'], top: ['pinafore', 'navy'], shoes: ['maryjane', 'black'], acc: [['pack', 'rose']], hijabSet: ['hj_plain', 'white'] },
    { id: 'st_sport_f', g: 'f', n: 'طقم الرياضة', tags: ['sport'], top: ['jersey', 'purple', 'stripes'], bottom: ['joggers', 'gray'], shoes: ['sneaker', 'white'], head: ['headband', 'pink'], hijabSet: ['hj_plain', 'lilac'] },
    { id: 'st_winter_f', g: 'f', n: 'طقم الشتا', tags: ['warm'], top: ['puffer', 'maroon', 'solid'], bottom: ['wide', 'cream'], shoes: ['boots', 'brown'], head: ['beanie', 'rose'], acc: [['scarf', 'cream']], hijabSet: ['hj_plain', 'cream'] },
    { id: 'st_sea_f', g: 'f', n: 'طقم البحر', tags: ['beach'], top: ['rash', 'sky', 'stripes'], bottom: ['leggings', 'navy'], shoes: ['sandals', 'cream'], head: ['sunhat', 'rose'], acc: [['g_sun', 'rose']], unlock: { sticker: 's_sea' } },
    { id: 'st_party_f', g: 'f', n: 'طقم الحفلة', tags: ['party', 'formal'], top: ['partydress', 'pink', 'stars'], shoes: ['maryjane', 'white'], head: ['tiara', 'sky'], hijabSet: ['hj_floral', 'rose'] },
    { id: 'st_eid_f', g: 'f', n: 'طقم العيد', tags: ['eid', 'formal'], top: ['sundress', 'mint'], shoes: ['flats', 'rose'], head: ['clip', 'yellow'], acc: [['bdg_flag', 'red']], hijabSet: ['hj_floral', 'cream'] }
  ];

  /* ---- fashion show: a weather picture + a goal; `need` = every entry must be satisfied by what is worn (tag lists = any of) ---- */
  D.goals = [
    { id: 'park', pic: 'sun', title: 'البس لبس رياضة للحديقة', say: 'الجو حلو والشمس طالعة. البس بدلة رياضية للحديقة!', need: [{ slot: 'top', tags: ['sport', 'light'], n: 'لبس خفيف' }, { slot: 'shoes', tags: ['sport'], n: 'كوتشي' }] },
    { id: 'winter', pic: 'snow', title: 'البس لبس شتوي', say: 'الجو برد أوي! البس لبس شتوي دافي.', need: [{ slot: 'top', tags: ['warm'], n: 'لبس دافي' }, { slot: 'shoes', tags: ['warm', 'rain'], n: 'جزمة' }, { slot: 'any', tags: ['warm'], also: ['head', 'acc'], n: 'طاقية أو شال' }] },
    { id: 'rain', pic: 'rain', title: 'البس لبس للمطرة', say: 'الدنيا بتمطر! البس جاكيت وجزمة.', need: [{ slot: 'top', tags: ['rain'], n: 'جاكيت' }, { slot: 'shoes', tags: ['rain'], n: 'جزمة' }] },
    { id: 'beach', pic: 'beach', title: 'البس لبس البحر', say: 'رايحين البحر! البس تيشيرت البحر وبرنيطة الشمس.', need: [{ slot: 'top', tags: ['beach'], n: 'تيشيرت البحر' }, { slot: 'head', tags: ['sun', 'beach'], n: 'برنيطة' }] },
    { id: 'school', pic: 'school', title: 'البس لبس المدرسة', say: 'النهارده مدرسة! البس لبس المدرسة وخُد الشنطة.', need: [{ slot: 'top', tags: ['school'], n: 'لبس المدرسة' }, { slot: 'acc', tags: ['school'], n: 'شنطة' }] },
    { id: 'party', pic: 'party', title: 'البس لبس الحفلة', say: 'في حفلة النهارده! البس حاجة شيك.', need: [{ slot: 'any', tags: ['party', 'formal', 'eid'], also: ['top', 'head'], n: 'لبس حفلة' }, { slot: 'head', tags: ['party'], n: 'طاقية أو تاج' }] }
  ];

  /* ---- spoken lines (all go through ctx.say / ctx.prompt / voice so they are collectable) ---- */
  D.lines = {
    welcomeM: 'أهلًا في أوضتي! اختار لبس حلو.', welcomeF: 'أهلًا في أوضتي! اختاري لبس حلو.',
    pick: 'اختار لبس حلو', door: 'اختاروا مين هيلبس', wardrobe: 'افتح الدولاب واختار لبسك',
    look: ['شكلي بقى شيك!', 'حلو أوي اللون ده!', 'ده لبس جامد!', 'يا سلام، حبيته!', 'أنا كده زي القمر!', 'كده تمام!'],
    lookM: ['شكلي بقى شيك!', 'ده لبس جامد!', 'حبيت اللبس ده!', 'يلا بينا بقى!'], lookF: ['شكلي بقى حلو أوي!', 'يا سلام، حبيته!', 'ده لبس جميل!', 'شكلي زي القمر!'],
    color: 'حلو أوي اللون ده!', reset: 'رجعت لشكلي الأصلي', saved: 'حفظت ده كأفضل لبس!', bought: 'مبروك! اللبس بقى بتاعك', tryon: 'بتجرّب اللبس. اشتريه عشان تحتفظ بيه',
    noCoins: 'محتاجين عملات أكتر! كمّلوا المهام', locked: 'ده لسه مقفول', surprise: 'مفاجأة! جرّب اللبس ده', mirror: 'شوف نفسك في المراية!', zoomOut: 'كفاية كده؟',
    robot: ['بيب بوب! أنا الروبوت!', 'روبوت: أنا جاهز للعب!'], ball: 'جول! جون حلو!', blocks: 'بنيت برج عالي!', telescope: 'شفت نجوم كتير!', poster: 'صورة حلوة!',
    doll: 'بيت العرايس منوّر!', plush: 'الدبدوب حلو أوي، احضنه!', paints: 'ألوان حلوة أوي!', books: 'الكتاب ده حلو!', flowers: 'ريحة الورد حلوة!', lights: 'الأنوار الحلوة!',
    bye: 'يلا نرجع للخريطة', fashionStart: 'يلا نعمل عرض أزياء!', fashionWin: 'برافو! لبس مناسب جدًا!', fashionTry: 'قريب! جرّب تغيّر حاجة', fashionHint: 'محتاج',
    done: 'خلّصت! شوفوا لبسي'
  };
})();
