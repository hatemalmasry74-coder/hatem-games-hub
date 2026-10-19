# مودي وعبودي – Moody & Aboody (developer guide)

Vanilla JS + canvas + HTML overlays. No libraries, fonts, images (except the two cartoon avatar jpgs in `assets/`), CDN or network calls.
Arabic RTL UI. Logical resolution **960x540**, scaled to fit with letterboxing (DPR capped at 2).
**Privacy rule: never add real photos of the children anywhere. Heroes are canvas drawings; only the cartoon portraits in `assets/` (`moody_/aboody_/toota_/nemo_/baba_cartoon.jpg`) are used as circular avatars.**

Heroes: **مودي** (Moody, 9, tall/strong: lifts heavy things, reaches high places, harder puzzles = tier 9),
**عبودي** (Aboody, 6, small/quick: fits through gaps, crawls under furniture, easier puzzles = tier 6). Both are always on screen; the child switches the controlled hero with the HUD avatars (or by tapping the hero).

## File map

```
index.html            shell (viewport-fit=cover, no-cache meta, ?v=1 cache busters, #app > canvas#c + #ui, #rot overlay)
engine/core.js        namespace Moody, utils, save (localStorage 'hub_moody_v1'), fixed-step loop, pointer input, tweens, registries
engine/gfx.js         drawing helpers (Moody.gfx) + ART registry (Moody.art) + UI icons
engine/audio.js       WebAudio sfx (lazy), mute, optional cheer clips from ../sonic/assets/v/ (max 1 per 5 s, errors ignored)
engine/chars.js       the two heroes (Moody.chars.draw), cosmetics registry (hats/shirts), people icons (mama, baba, friend)
engine/stage.js       Stage = canvas scene of a mission: bg, layers, heroes, particles, bubbles
engine/ui.js          HTML overlay UI: screens (title/map/missions/result/album/diary/closet/parent/pause), HUD, dialog, quiz card
engine/minigames.js   reusable kits (Moody.kits.*): dragdrop hidden choice sequence memory scrub measure runner lanes ritual
engine/ctx.js         mission runner (Moody.flow) + the `ctx` API + question picker (tiers)
engine/boot.js        loads Moody.load files sequentially, then shows the title
engine/ui.css         all UI styling (UI scale: everything is authored in 960x540 logical px)
worlds/registry.js    THE file you edit to add a world: Moody.plan([...]) (cards, "قريبًا" stubs) + Moody.load (script list)
worlds/home.js        world 1 (6 missions) - reference implementation, copy it
worlds/home_art.js    home rooms (backgrounds) - example of world-specific art
content/art_common.js shared props (toys, food, kitchen, school...)
content/q_tier6.js    question bank tier 6 (Aboody, age 6)
content/q_tier9.js    question bank tier 9 (Moody, age 9)
content/meta.js       parent-panel labels for values + skills
```

**To add a world you only create `worlds/<id>.js` (+ optional `worlds/<id>_art.js`, `content/q_<id>.js`) and add the file names to `Moody.load` in `worlds/registry.js` (and make sure the world exists in `Moody.plan`). No engine file needs changes.** Only list files that exist (a 404 is a console error).
Add `?unlock=1` to the URL to unlock every mission while testing.

## Registering a world

```js
Moody.registerWorld({
  id: 'school', order: 2, title: 'المدرسة', icon: 'w_school',      // icon = art name (see registry.js for the card icons)
  theme: { c1: '#9ed8ff', c2: '#4a8dff' },                           // card gradient
  finalSticker: 's_school',                                          // shown on the world-complete celebration
  stickers: [ { id:'s_bus', title:'سائق الباص', art:'car', bg:'#fff3c4' } ],  // registered automatically
  missions: [ { id:'m1', title:'...', intro:'...', values:['polite'], sticker:'s_bus', wisdom:'...', diary:{pic:'bag', text:'...'},
                async run(ctx) { ... return ctx.nav.complete(); } } ]
});
```
Mission fields: `id` (unique in the world), `title`, `intro` (title card), `values` (tags counted in the parent panel when completed),
`sticker` (id given on completion), `wisdom` ("حكمة اليوم", one line), `diary` (`{pic:<art name>, text}` default diary entry), `run(ctx)`.
Missions are linear and unlock in order (mission i unlocks when i-1 is done). Keep each one 1-3 minutes, 3 star chances.
Text may contain `{m}` `{a}` `{me}` = Moody / Aboody / player names (editable by the child). Use plain Egyptian colloquial Arabic, no lecturing: values live inside situations.

## ctx API (everything async returns a Promise; leaving the mission aborts all pending ones)

| call | meaning |
|---|---|
| `await ctx.scene(bg, {state, heroes, instant})` | fade to a background. `bg` = name in `Moody.rooms` or a function `(g,t,stage)`. `state` = flags object (`stage.state`) read by your bg. `heroes` = `'floor'`(default) / `'corner'` (small, bottom corners, for overlay puzzles) / `'hidden'` / `{moody:{x,y,dir}, aboody:{...}}` |
| `await ctx.say(who, text, {anim, name, icon})` | story dialog. `who`: `'moody' 'aboody' 'mama' 'baba' 'friend' 'narrator'` or any art name (+`name`). Tap/Space advances |
| `await ctx.dialog([[who,text,opts],...])` | several lines |
| `ctx.prompt(text)` | top instruction chip (cleared automatically after each kit) |
| `await ctx.wait(sec)`, `ctx.walk(who,x,y)`, `ctx.anim(who,anim,sec)` | timing / hero movement. anims: idle walk run jump pickup lift cheer oops think sleep wave |
| `ctx.react('good'|'oops'|'think', who|'both')`, `ctx.praise(who)` | juicy reactions (+ Egyptian praise bubble) |
| `await ctx.requireHero('moody', msg)` | waits until the child switches to that hero (pulses the switch) |
| `ctx.reward.star(n)` | +n stars (max 3 per mission) with popup. A completed mission always has >= 1 star |
| `ctx.reward.coins(n)` | bonus coins added at the end |
| `ctx.diary.add({id,pic,text})` | diary entry (saved on completion; same id replaces) |
| `ctx.sticker.give(id)` | sticker (saved on completion, shown in the result) |
| `ctx.value(tag)`, `ctx.skill(tag)` | count a value / skill for the parent panel |
| `ctx.mistake()` | count a mistake |
| `ctx.fx.burst(x,y,{kind:'star'|'spark'|'conf'|'heart'})`, `.float(text,x,y)`, `.shake()`, `.flash()`, `.confetti()` | effects |
| `ctx.every(sec, fn)` | interval that stops by itself when the mission ends |
| `ctx.stage`, `ctx.active` (current hero id), `ctx.names` | low level access |
| `return ctx.nav.complete({wisdom, sticker})` | finish the mission (throws a signal; code after it does not run) |
| `await ctx.quiz.ask(q, {who})` | one question -> `{correct, tries, misses, revealed}` |
| `await ctx.quiz.fromBank({n, cat, tier, who})` | `n` questions from the banks. Tier follows the active hero (Aboody 6, Moody 9) unless `tier` given or the parent forced one |
| `await ctx.quiz.pair({cat, aboody:q6, moody:q9})` | two-part puzzle: tier-6 part for Aboody then tier-9 part for Moody -> `{firstTry, correct, results}` |
| `await ctx.games.<kit>(opts)` | any kit in `Moody.kits` (below) |

Quiz feedback is always kind: 1st miss "قريب! جرّب تاني", 2nd miss shows `hint` and removes a wrong option, 3rd miss highlights the answer. Never negative.

## Kits (`ctx.games.*`)

All kits add a "تخطّي" button after ~45 s idle or 3 failures (so nothing can soft-lock) and return a result object (`{skipped:true}` when skipped).
`opts.prompt` sets the top chip.

* **dragdrop** `{items:[{id,art,to,x,y,s,needs:'moody'|'aboody',hint}], targets:[{id,x,y,w,h,art,s,label,cols,dx,itemScale,accepts(item)}], panel:{x,y,w,h}, wrongHint}` -> `{mistakes}`. Heavy items (`needs:'moody'`) wobble and tell the child to switch if Aboody is active. Multi-touch capable.
* **hidden** (alias **tap**) `{spots:[{id,art,x,y,s,needs,keep,listArt,draw(g,t,stage,spot),onFound(spot),walkOff,hit}], list:false, hintAfter}` -> `{wrong}`. Tap objects; the right hero walks over and picks them up. `needs:'aboody'` = small gap, `needs:'moody'` = high/heavy. `keep:true` leaves the object in the scene. `onFound` may be async (dialogue).
* **choice** `{prompt, options:[{text,art,good,reply:[[who,text]], consequence:[[who,text]]|async fn(ctx)}]}` -> `{good,firstTry,tries,index}`. A bad option plays a short gentle consequence and returns to the choice; good option(s) end it. Several `good:true` options are allowed (all-good choice).
* **sequence** `{steps:[{art,label}] (in correct order)}` -> `{mistakes}`.
* **memory** `{pairs:[artNames], cols, timeLimit(sec)}` -> `{moves, timeUp}`.
* **scrub** `{dirt:n, tool:artName, base(g,t,stage)}` -> `{}` (drag a tool to clean germs / dirt).
* **measure** `{target, unit, max, label}` -> `{tries}` (+cups into a jug).
* **runner** `{distance, speed, obstacles:[{art,h}], bg(g,t,stage)}` -> `{hits, stars}` (tap/Space to jump, both brothers run; hitting is only a stumble).
* **lanes** `{lanes, goal, good:[art], bad:[art], who, bg}` -> `{caught, hits}` (move between lanes, catch good things).
* **ritual** `{text, sub, who}` -> big tap button ("بسم الله", "الحمد لله", thanks).

Add your own kit: `Moody.kits.myKit = function (ctx, opts, done, cleanup) { ...; cleanup(()=>/*remove DOM/layers*/); done(result); }` -> available as `ctx.games.myKit(opts)`.
Use `ctx.stage.addLayer({z, update(dt), draw(g,t)})` (returns a remover; pass it to `cleanup`), `ctx.stage.input = {down(x,y,id), move, up}` for pointer input, `ctx.skipper(done, cleanup)` for the skip net.
Set `ctx.stage.dbg = {kit:'name', ...}` with item positions so the test bot can solve it.

## Art

```js
Moody.art.register('name', (g, o) => { /* draw in a 100x100 box centred on 0,0; o.args from 'name:a:b' */ });
Moody.art.draw(g, 'name', x, y, size)       // canvas
Moody.art.el('name', px)                    // <canvas> element for DOM (icons)
Moody.art.sticker(id, px, locked)           // sticker badge
```
Art names may carry args: `'shape:circle:red'` -> `o.args=['circle','red']`. Backgrounds are plain functions in `Moody.rooms[name] = (g,t,stage)=>{}`.
Helpers: `Moody.gfx.fillRR, circ, ell, poly, star, heart, text (RTL), sparkle, cloud, sun, shade, lin`.

### Visual style guide
* Warm cartoon, **outline `#4a2e1c` (Moody.OL), 3.5-5 px** (art is authored at 100 units, outlines scale with it), flat fills + one soft highlight/shade.
* Palette (Moody.pal): ink `#3a2a1e`, cream `#fff7e3`, orange `#ff8a2a`, teal `#1fb5a6`, pink `#ff6f91`, yellow `#ffc93c`, navy `#2b3a67`, green `#5cc96b`, purple `#8a6bd6`, sky `#8fd6ff`.
* UI: Tahoma/Arial bold, buttons >= 68x68 logical px (`.btn`), body text >= 24 px, titles with thick brown outline. Everything lives in the 960x540 `#ui` box (so 844x390 phones scale to 0.72).
* Floor line of rooms ~y=430, heroes stand at y=480-495; keep the top 100 px for the HUD/prompt and the bottom 140 px for the dialog.
* No emoji in UI chrome (icons are drawn). Questions may use an `emoji` picture field.
* Egyptian colloquial, short sentences, always encouraging, never scary or punishing.

## Question banks

`Moody.registerQuestions([ ... ])`, schema:

```js
{ id:'t9_m1',                    // unique
  category:'math',               // counting math shapes_colors patterns logic analogies arabic riddles english science animals geography history ethics health time_money general
  tier: 6 | 9 | 'both',          // 6 = Aboody (age 6), 9 = Moody (age 9)
  q:'٦ × ٧ = ؟',
  choices:['٤٢','٣٦','٤٨'],      // 2-4; strings or {text, art}
  answer:0,                      // index of the correct choice in `choices` (the UI shuffles on display)
  hint:'...',                    // shown after the 2nd miss
  explain:'...',                 // optional, shown after a correct answer
  emoji:'🐱',                    // optional picture (text glyph)
  art:'apple', row:['shape:circle:red','?'], count:{art:'apple',n:3}, fixed:true   // optional visuals (row = pattern/odd-one-out, '?' = empty slot)
}
```
Tier 6: counting to 20, +/- within 10, colors, shapes, simple patterns, first letters, animals, simple safety/hygiene, easy memory.
Tier 9: times tables, word problems, patterns/logic, Arabic spelling & riddles, English words, science, geography, Egyptian history, gentle Islamic/ethics knowledge, health & safety, time/money, analogies.
The picker (`Moody.pickQuestions`) rotates through unseen questions (`save.seen`), never repeats the same question twice in a row, and spreads categories. Parents can force a tier or "auto" in ركن الأهل (`settings.tier`).

## Save (`localStorage['hub_moody_v1']`, all in try/catch, never leaves the device)
`{names, hero, progress:{'world/mission':{done,stars,plays}}, coins, stickers:{id:ts}, diary:[{id,pic,text,date}], cosm:{owned,eq:{moody:{hat,shirt},aboody:{}}}, settings:{sound,voice,tier}, skills:{cat:n}, valuesPracticed:{tag:n}, seen:{qid:n}}`.
`Moody.save.data`, `.commit()`, `.reset()`. Default player name is read from `hubPlayerName` if present.
Coins: first completion 5 + 5/star improvement (+ `reward.coins`), replays 2. Spend them on hats / shirt colors in "تغيير الشكل" (register more with `Moody.chars.registerHat/registerShirt`).
Register labels for new values/skills in `content/meta.js` style: `Moody.registerValue('polite',{label,desc})`, `Moody.registerSkill(cat,{label,desc})`.

## Testing recipe
1. `cd` to the hub root and `python3 -m http.server 8765`, open `http://localhost:8765/moody/index.html?unlock=1`.
2. Playwright (`require('/opt/node-tools/node_modules/playwright')`): viewports 1280x720 (mouse), 844x390 (`hasTouch,isMobile`), 1180x820. Collect `console` errors/warnings, `pageerror`, failed requests: there must be none.
3. Drive the game like a kid: DOM buttons are real elements (`.card[data-world]`, `.mcard[data-mission]`, `.opt[data-correct]`, `.choicecard[data-good]`, `.seqcard[data-i]`, `.cardmem[data-art]`); canvas kits expose their targets in `Moody.scene.dbg` (e.g. `{kit:'dragdrop', items:[{id,x,y,tx,ty,needs}]}`) so a bot can convert logical 960x540 coordinates to page coordinates through `#c`'s bounding rect and drag with real mouse or CDP touch events.
4. Check: stars/coins/stickers/diary survive `reload`, parent panel reset works, skip appears after 3 failures, switching heroes works, no soft-lock (every kit finishes).
5. Look at screenshots in all three viewports: nothing overlaps the HUD (top 100 px), text readable, nothing needs scrolling except scroll panels.


---
# PHASE B additions (voice, family characters, companions, daily call)

## Voice narration system (engine/voice.js) - for kids who cannot read yet
Everything the game shows as an instruction/dialog/question is also *speakable*. Audio is **pre-recorded clips** (generated neural Egyptian TTS now, replaceable by the owner's own recordings later) - never `speechSynthesis`.

* **Clip id** = `Moody.voice.hash(text)`. Normalisation (identical in `tools/voice_hash.py`): replace `{m}`->مودي `{a}`->عبودي `{t}`->توتا `{n}`->نيمو `{me}`->يا بطل (always the *default* names, so renaming a hero never changes the clip id); collapse runs of space/tab/CR/LF/NBSP to one space and trim; delete tashkeel U+064B..U+065F, U+0670 and tatweel U+0640. Hash = UTF-8 bytes -> two 32-bit FNV-1a hashes (offset bases `0x811c9dc5` and `0x9747b28c`, prime `0x01000193`) -> 16 hex digits -> **first 12**. Speaker is *not* part of the hash.
* **Files**: `assets/voice/<hash>.mp3` and `assets/voice/manifest.json` = `{hash: {voice, text}}` (voice = `narrator | mama | baba | boy_big (Moody) | boy_small (Aboody) | girl_big (Toota) | girl_small (Nemo) | nana`). The engine only requests a clip whose hash is **in the manifest**, so a missing clip is silent (no 404, no throw). To replace a clip with your own recording: save it as `assets/voice/<same hash>.mp3` (keep it short, clear, one sentence) and make sure the hash is in the manifest (`python3 tools/voice_hash.py --manifest tools/voice_strings.json` rebuilds the manifest from the clips that exist).
* **Pipeline**: `node tools/collect_voice.js` -> `tools/voice_strings.json` `[{text, speaker(voice id), hash}]` (all question banks incl. choices/hints/explain, the Baba call pool, mission titles/intros/wisdom, fixed UI phrases, a static scan of dialogue lines in worlds/*.js, plus a bot play-through of every mission of every world with `?unlock=1&collectvoice=1`). Generate the TTS clips from that file, name them `<hash>.mp3`, then rebuild the manifest. `python3 tools/voice_hash.py "text"` prints a hash; `--check file.json` verifies the JS/Python hashes agree and lists missing clips.
* **Hooks inside the engine** (world files need no changes): `ctx.say` (speaker = who), HUD prompt (`ctx.prompt` / kit prompts -> "instruction", replayable), mission title card (`المهمة N: title. intro`), quiz stem (auto), each answer (speaker icon button, or press-and-hold 0.5 s), "اسمع الاختيارات" (reads the choices one after another), hints / "قريب! جرّب تاني" / explain, choice-scene prompt + cards, result screen ("برافو" + "حكمة اليوم" + wisdom), toasts, hero bubbles (soft: never cut a playing clip), rituals.
* **API**: `Moody.voice.speak(text,{speaker, force, soft})`, `.speakSeq([texts])`, `.setInstruction(text)`, `.replay()` (the "ماذا نفعل؟" HUD button), `.stop()`, `.setEnabled(bool)` (setting `narr`, default ON, toggles in title / pause / ركن الأهل), `.pressSpeak(el, getText)`, `.hash/.normalize/.resolve`, `.voiceFor(speaker)` (extend with `Moody.voice.extraVoices.sara='girl_big'`), `.fixedStrings`, `.note(text,speaker)`.
* **Behaviour**: one clip at a time, a new line cancels the previous; never overlaps the owner's cheer clips (narration waits for a cheer to end, cheers are skipped while narrating); pauses/resumes with the game pause; respects the sound mute; never blocks gameplay (all async, errors swallowed).
* **Collection harness**: open the game with `?collectvoice=1` -> every spoken/shown `(text, voice)` is appended to `window.__voiceLog`; `Moody.voice.dump()` returns the JSON.
* **Writing for non-readers**: short sentences, slow/simple colloquial wording, one idea per line; always pair an instruction with a picture (art icon). Put the *pictures* in `art`/`row`/`count`, the sentence in `prompt`.

## Characters (engine/chars.js) - ONE table
`Moody.chars.defs` holds every look: proportions (`sc L T R hr sw`), palette (`skin shirt skirt pants shoe hairC scarf under tie ...`), `top` (placket | vneck | polo | crew | dress | blouse | floral | hoodie), `hair` (curly | ponytail | pigtails | bob | scarf | short), accessories (`glasses neckPhones bunny bag watch ring beard sunhat stripes flowers`), `abilities` tags, `badge`, `img` (cartoon avatar jpg) and `speed`. Changing a colour/hair/outfit = edit that row only.

| id | who | age | look (from the owner's cartoon references) | abilities |
|---|---|---|---|---|
| moody | مودي | 9 | gray button shirt, mustard pants, curls | strong, tall |
| aboody | عبودي | 6 | navy dotted shirt, khaki pants, curls | small, quick |
| toota | توتا (تسنيم) | 15 | cream hijab + burgundy underscarf, round glasses, burgundy blouse, cream floral skirt, pink headphones, beige bag | leader, order |
| nemo | نيمو (ترنيم) | 12 | big pink woven sun hat with 2 bows, rose-gold glasses, dark bob, pink hoodie, bunny-ear headphones, big smile | curious, finder, small |
| nana | ننا زوزا | ~68 | light headscarf, glasses, lilac flowery dress, slow gentle walk (`speed`) | wise, kind |
| baba | بابا | ~40 | black curly hair, thick brows, full beard + mustache, big laugh, black tee, smartwatch + ring, olive skin | dad |

### Extended family (all `playable:false`; ids = speakers = `ctx.cast` ids; age of `ofa` is PROVISIONAL)
| id | who | age | look / props |
|---|---|---|---|
| ofa | أوفا (ابن عمة أماني, cousin of the kids; also the friend NPC of all worlds) | 10 | green tee, jeans, short straight hair with a fringe |
| toti | توتي (بنت عمتو ندى, very naughty) | 4 | tiny, pigtails with pink bows, pink dress; extra poses `cry` (tears + wail) and `scream` (tantrum); fidgets when idle; loves Nemo |
| amani | عمتو أماني (loves cooking) | ~42 | casual terracotta headscarf, sage floral dress, cream apron, wooden spoon in hand |
| nada | عمتو ندى (mother of Toti) | ~38 | casual beige headscarf, teal blouse, navy skirt, phone in hand; default idle = pose `phone` (looks down at the phone) |
| beno | بينو (ثالثة إعدادي, son of Amani) | 15 | quiff, slate hoodie, headphones round the neck |
| medo | ميدو (ثالثة ثانوي, son of Amani) | 18 | tall, round glasses, maroon tee, backpack |
| kamal | عمو كمال (owner's younger brother, lives in Saudi with Baba) | 34 | clean-shaven, neat side-parted hair, light-blue polo, watch + ring |
| luka | لوكا (son of Kamal, lives in Egypt) | 4 | tiny, curls, orange tee, toy car in hand, curious head tilt |

Use: `ctx.say('toti','...',{anim:'cry'})` (portrait + stage pose follow `cry|scream|phone`; or `{face:'cry'}` for the portrait only), `ctx.cast(['moody','aboody','nemo','toti'])` / `ctx.companions(['toti','luka'])`, `stage.play('toti','scream',2)`, art `face:<id>[:<pose>]`. Voices: `ofa boy_mid, toti girl_tiny, luka boy_tiny, amani aunt_a, nada aunt_n, beno teen_a, medo teen_b, kamal uncle` (`engine/voice.js`, `tools/collect_voice.js`, `tools/gen_voice.py`). Stickers `f_amani f_nada f_kamal f_cousins` come from daily calls 15/18/21/24. The family-edition builder strips all of this (`stripExtendedFamily` in `tools/family/build.js`; `ofa` turns into a generic friend named by `friendName`, default كريم).

Draw: `Moody.chars.draw(g, id, x, y, {anim, t, dir, sc, hat, shirtId, talk, carry})`; anims `idle walk run jump pickup lift cheer(=happy) wave oops think sleep`, `talk:true` animates the mouth. Portrait: `Moody.chars.portrait(g,id,cx,cy,r)` and art `face:<id>`. Cosmetics: `chars.registerHat(id,name,price,draw)` / `registerShirt(id,name,price,color)`; set `.for=['toota','nemo']` to restrict an item to some heroes (the shop has a tab per playable hero).
Family facts: school = **مدرسة آل زياد الابتدائية**; the family lives on the **6th floor**, Nana Zoza on the **3rd floor** of the same building; Baba lives/works in **أبها (Abha), Asir, Saudi Arabia**: mountains, light mist and cool weather, stone-and-clay buildings with white-and-ochre towers, white minarets, the Abha cable car (التلفريك), Al-Souda mountain, Habala - use this as the visual style of the Saudi world.

## Heroes, companions, abilities (stage + ctx)
A mission/world may declare who is on stage and who the child can control:
```js
{ id:'m1', title:'..', heroes:['moody','aboody','toota','nemo'],   // present (also allowed on the world object)
  control:['moody','aboody','toota','nemo'],                       // controllable (default: the brothers only)
  abilities:{ toota:['leader'] },                                  // optional extra tags
  async run(ctx){ ctx.cast([...],[...]); ctx.companions(['toota','nemo']); ctx.tip('جرّبوا الكرسي!'); } }
```
* Default = the two brothers (all older worlds are unchanged). Extra heroes who are present but not controllable are **companions**: they cheer/oops with `ctx.react('good','both')` and give light hints with `ctx.tip(text, who?)`.
* Kits accept ability tags: `needs:'strong'` (Moody), `'small'` (Aboody/Nemo), `'leader'` (Toota), `'finder'`/`'curious'` (Nemo) or a hero id. `stage.can(id, need)`, `stage.who(need)`; `Moody.scene.dbg` items expose `hero` (the hero who satisfies `needs`) for bots.
* The HUD switcher shows the controllable heroes: 2 = big avatars + swap icon, 3-4 = compact row (works at 844x390). `Tab` cycles heroes, `Esc` pauses. A round **"ماذا نفعل؟"** button (top-left) replays the current instruction by voice.
* Speakers for dialogue: `'moody' 'aboody' 'toota' 'nemo' 'nana' 'baba' 'mama' 'friend' 'narrator'`; tokens `{m} {a} {t} {n} {me}`.

## "بابا بيتصل" daily video call (engine/call.js + content/baba_calls.js)
A button on the world map (with a red notification dot until today's call is done) starts a hidden world `call`: ringing -> Baba greets the kids by name -> "how was your day" choice -> ONE challenge from the pool (>= 30: habits, puzzles, counting, memory, ordering) -> praise -> rewards (2-3 stars, 8 coins; family stickers `f_baba`, `f_toota` (3rd call), `f_nemo` (5th), `f_nana` (8th), `f_family` (12th)) -> goodbye. One counted/rewarded call per calendar day (`callDay/callId/callCount` in the save); replays of the same call are allowed without extra rewards. Add challenges to `Moody.babaCalls` (schema at the top of `content/baba_calls.js`); every string is voiced (voice `baba`). Worlds can set `hidden:true` to stay off the map.

## Adding the two planned worlds in parallel (only new files + registry lines)
`worlds/registry.js` already plans **nana** ("بيت ننا زوزا", order 7, icon `w_nana`) and **saudi** ("السفر لبابا في السعودية", order 8, icon `w_saudi`) as locked "قريبًا" cards. To implement one: create `worlds/nana.js` (+ `nana_art.js`, `content/q_nana.js`) with `Moody.registerWorld({id:'nana', ...})` (same id replaces the stub, keep `order`) and add the files to `Moody.load` in `registry.js`. Declare `heroes/control` per mission to use the sisters; use `ctx.say('nana'|'baba'|'toota'|'nemo', ...)` - voices and avatars are automatic. Nana's house = 3rd floor of the same building (elevator/stairs from the 6th); Saudi world = Abha (see facts above).

## Tools
`tools/botlib.js` (kid-bot: real mouse/touch, all kits), `tools/regress.js [desk|phone|ipad] [wrong] [worlds]` (plays every mission), `tools/collect_voice.js`, `tools/voice_hash.py`. Test hooks: `?unlock=1`, `?collectvoice=1`, `Moody.scene.dbg`.



---
# Visual system (scene look: painted rooms, light, depth, ambient life)

Everything below lives in `engine/gfx.js` (toolkit), `engine/stage.js` (baking, compositing, transitions, fx) and the room drawers in `worlds/*_art.js`.
Characters are still drawn through `Moody.chars.draw` (unchanged API; the stage passes `noShadow:true` because it draws its own contact shadow).

## How a room is drawn
A background `Moody.rooms[name] = (g, t, stage) => {...}` is **baked once** (per canvas size + per change of `stage.state`) into shared offscreen canvases:

| layer | what | per frame |
|---|---|---|
| **far** | sky / window views / distant scenery, painted at half resolution (soft, hazed = cheap depth-of-field) and upscaled once | 1:1 blit of the occupied tiles only, shifted by the **parallax** offset (opposite to the camera) |
| ambient `far` | clouds, birds, stars, traffic behind the glass | animated |
| **mid** | the room itself (opaque, painted mode, contact shadows, wall/floor occlusion) | one 1:1 blit |
| ambient `mid` | curtains, steam, blinking lights, flags, drips, `G.live` pieces | animated |
| hero contact shadows + heroes | soft shadow offset away from the room's key light, shrinks while jumping | |
| **near** | foreground framing (hanging vines, string lights) + colour grade: time-of-day tint, vignette, ceiling/floor falloff | 1:1 blit of occupied tiles, shifted the other way |
| ambient `top` | light shafts (god rays), dust motes, lamp / TV / oven glows, pollen, leaves | animated, additive |
| glows | pulsing ring under draggable items (auto from `stage.dbg`), manual `stage.addGlow` | |
| kit layers, particles, bubbles ... | unchanged | |

Per-frame cost of a baked room is ~3 blits + a handful of sprites, independent of how many shapes the room has.
**Paint mode** (`G.paint`, only while baking or building a sprite): `G.fs` (used by fillRR/circ/ell/poly/star/heart/line) turns flat fills into soft vertical gradients with a top sheen + inner rim shade and swaps the black outline for a thin darker tone of the fill; things that stand on the floor line get an ambient-occlusion contact shadow (`G.ao`). Every legacy art/room therefore upgrades automatically.
`Moody.art.draw` at runtime renders each prop once into a cached painted sprite (`A.sprite`) and blits it, so kit items match the rooms. Animated arts are excluded in `A.noCache` (tap, alarm, clock, fan, sun...). `?sprites=0` disables it.

## Writing / editing a room
```js
Moody.look.setAll({ my_room: s => ({ tod:'morning', floor:430, lightX:465, live:['door'], vig:.26 }) });   // or a plain object
Moody.rooms.my_room = function (g, t, s) {
  const S = s.state, RK = Moody.gfx.room, G = Moody.gfx;
  RK.wall(g, 430, '#ffe8cc', '#ffd6ac', {pattern:'stripes', dado:{h:70, c:'#ffcc9c'}});   // + 'dots' 'stars' 'tiles' 'brick'
  RK.floor(g, 430, '#dba670', '#a8733f', {kind:'wood'});                                  // 'wood' 'tile' 'carpet' 'stone' (perspective)
  G.window(g, s, 390, 90, 150, 140, {view:'morning', curtains:'#ff8fb8'});               // far view + hole + frame + sill + sun shaft + dust + swaying curtains + clouds
  RK.rug(g, 580, 480, 190, 36, '#ff9ec0', '#ffd0e0', {star:true});  RK.frame(...)  RK.shelf(...)  RK.stringLights(...)
  G.fillRR(...), G.circ(...), A.draw(g,'sofa',...)                                         // normal drawing code - painted automatically
  G.amb(s, {k:'steam', x:525, y:222, sc:1, n:4});                                         // ambient animation (see kinds)
  G.live(g, s, (g, t) => { if (S.door) ... });                                            // anything that changes every frame / by tween
};
```
* **Meta (`Moody.look`)**: `tod` (`day morning noon sunset evening night warm cool` = tint/vignette/glow colour), `floor` (floor line y: occlusion strip + AO band), `lightX` (key-light x: shadow direction), `vig`, `indoor` (ceiling falloff + floor sheen), `ao`, `par` (parallax multiplier, 0 = off), `glow:{x,y,r,a,col}`, `tint`, `haze`, `shadow` (hero shadow strength), `live:[stateKeys]`, `raw:true` (never bake; draw every frame - used for `callroom`). May be a function of the stage.
* **State and baking**: the bake is re-done when `JSON.stringify(stage.state)` changes (minus the keys listed in `live`). Keys that are **tweened or mutated every frame** (door openness, positions, `prog`, `scroll` ...) MUST be listed in `live` and drawn inside `G.live(g, s, fn, z)` (`z` = `'far'|'mid'|'top'`), otherwise the room would re-bake each frame (a guard falls back to raw drawing after 6 bakes in 1.5 s). Call `stage.dirty()` after mutating nested state objects in place.
* **Layers inside a room function**: `G.far(g,s,c=>{...})` draws into the far layer, `G.near(g,s,c=>{...})` into the foreground layer, `G.hole(g,s,x,y,w,h,r)` cuts a window through the mid layer. When a room function is called outside the stage bake (e.g. directly by a kit) these degrade to plain drawing.
* **Views** (`G.views[name](ctx,x,y,w,h)`, used by `G.window`, `RK.sky`): `day morning sunset night city citysunset citynight garden mountain sea plainsky dusksky` (+ world specific ones registered by the art files). `RK.sky(g, s, view, height)` = full-width sky with clouds + birds for outdoor rooms.
* **Outdoor kit**: `RK.building`, `RK.tree`, `RK.road`, `RK.sidewalk`, `RK.grass`, `RK.flag`, `G.hills`, `G.skyline`, `G.blobTrees`.
* **Scrolling parallax**: `G.tile(key, P, y0, y1, res, fn)` bakes a seamless layer (fn periodic in P), `G.drawTile(g, tile, scroll)` blits it wrapped (see `saudiRoad`). `G.nzp`/`G.kq` give periodic noise.
* **Ambient kinds** (`G.amb(stage, {k, ...})`, table `G.amb.kinds`): `curtain shaft dust glow clouds birds stars steam blink waves cars second(clock hand) leaves pollen bubbles drip flag live`. Add one: `G.amb.kinds.mine = {z:'mid', opt:true, draw(g,t,spec,stage){...}}` (`opt` = decorative, skipped when ambient is off). `t` is 0 when motion is off, so every kind must look right frozen.
* Colour helpers: `G.shade G.tones G.mix G.rgba G.parse`, light helpers `G.glowSprite G.glowAt G.shadowSprite G.cloudSprite G.ao G.aoEll`.

## Global switches (`Moody.fx`)
`fx.motion` (follows `prefers-reduced-motion`; `?motion=0` forces off: no parallax, no sway, everything frozen), `fx.ambient` (`?ambient=0`: skips decorative ambient), `fx.parallax`, `fx.shadows`, `fx.glow`, `fx.sprites`. Parallax follows the active hero, the pointer and (when the device reports it) the tilt - always tiny, quantised to device pixels so blits stay 1:1.

## Scene transitions, title card, effects (stage API; `ctx` wrappers where it makes sense)
* `await ctx.scene(bg, {...})` now runs `stage.transition(applyFn)`: a soft iris closes on the active hero (210 ms), the scene swaps, it opens with a slight zoom-out (300 ms). **Any tap/click skips it** (`stage.skipTr()`); `{instant:true}` is unchanged. `stage.transition(apply, {closeMs, openMs, instant})` can be used directly.
* `ctx.titleCard` switches `stage.setMood(true)`: cinematic bars, dimming and a slow zoom behind the title panel (`setMood(false)` when it closes).
* `stage.sparkle(x,y,{n,spread,cols})` / `ctx.fx.sparkle` : glittering burst + ring + glow. `stage.reward(x,y)` / `ctx.fx.reward` : sparkle + stars.
* `stage.addGlow(x,y,r,col)` / `ctx.fx.glow` : pulsing "tap me" ring (returns a remover). Draggable items of the `dragdrop` kit get it automatically (read from `stage.dbg`); the `hidden` kit shows one on the first remaining spot after 12 s idle.
* `stage.doorOpen(x,y,w,h,{col,light,dur,hold})` / `ctx.fx.doorOpen` : two door leaves swing open over a warm light, resolves when done.
* `stage.dirty()`: force a re-bake (after mutating nested `state` objects in place).

## Performance notes
Bake ~10-60 ms once per scene/state change (hidden behind the iris), then ~1 ms of blits per frame; far/near are blitted only where they have pixels (`occRects`). Memory: 3 full-size canvases + 2 half-size scratch canvases shared by all stages (~28 MB at 1920x1080, ~13 MB on a typical phone). Runtime prop sprites are capped (400 sprites / 60 Mpx, LRU). The DPR cap (2) and the single rAF loop are unchanged. Benchmark helper: see `tools2/bench.js` in the working copy (frame time over 120 frames per room, optional CDP CPU throttling).
Anonymous background functions (runner / lanes kits pass their own `bg`) are not baked: they are drawn as before with a generic vignette on top.



---
# Characters v2 (engine/chars.js + engine/voice.js lip-sync)

3D-look shaded characters + living animation. **API is backward compatible** (`draw/portrait/avatar/face:<id>:<pose>`, `defs`, abilities, `ctx.say/cast`).

**Rendering**: static layers (body+clothes, head skin, hair/hijab/hat, beard, glasses/moustache, shoes, hands, hair tails) are baked once to offscreen canvases per *character + outfit + hat + pixel density + light side* (top-left key light; mirrored sprite sets for `dir:-1` so light stays top-left) and drawn with `drawImage`; limbs, eyes, brows, mouth are live vectors (gradients cached, no per-frame allocation in the hot path except one `getTransform()` per draw). `M.chars.warm(ids)` pre-bakes (auto-runs for all 14 ~2.5 s after load); `M.chars.clearCache()`.
Per-character animation state is keyed by id (or `o.key`). A 2nd draw of the same id in the same frame (art props, icons) renders a static snapshot with no side effects.

**Draw options** `draw(g,id,x,y,{anim,t,dir,sc,hat,shirt,shirtId,talk,carry,alpha,noShadow,plain,tilt, emote, key, look:{x,y}, snap})` (`snap:true` = deterministic pose, no blending/blink; used by static portraits/art).
**Anims**: idle walk run jump pickup lift cheer oops think sleep wave phone cry scream (as v1) + `point shrug thumbs hug jumpcheer sad yawn giggle nod shake`. Pose changes blend over ~150-250 ms; the walk cycle is phase-locked to the measured ground speed (also steps when a tween moves an `idle` actor); characters turn with a quick squash instead of snapping.
**Idle life**: breathing, weight shift, random blink (double blinks), eye saccades, eyes then head follow the gaze target (priority: active speaker > last tapped character > pointer > wander), eyebrow micro-motion, spring follow-through for hair / pigtails / ponytail / scarf drape / skirt. `prefers-reduced-motion` (or `Moody.chars.setReduced(true)`) cuts secondary motion, wander and blink rate.

**Emotions** `neutral happy excited sad worried surprised thinking proud shy angry`:
* `Moody.chars.emote(id, 'sad', {dur})` (no dur = until `emote(id,null)`), `chars.emotions`, `chars.currentEmotion(id)`; also `draw(..., {emote})`.
* `ctx.say(who, text, {emote:'happy'})` (small hook in ctx.js) - when `emote` is omitted an emotion is *inferred* from the text (`!` happy, `!!`/praise excited, `؟` thinking, sad / worry words); pass `{auto:false}` to disable. The emotion is released when the line closes. Stage actor AND dialog portrait share it.

**Mouth sync**: `engine/voice.js` exposes `Moody.voice.speaker` (character id of the playing clip), `.isSpeaking()`, `.getLevel()` (0..1). Real clips go through a WebAudio `AnalyserNode` (only when the AudioContext is `running` and the clip is same-origin, so autoplay policy / audibility are never affected); otherwise (no analyser, suspended context, tainted/silent signal) a rhythmic talk loop tied to play/ended is used. Lines without a clip, or with narration off, still move the mouth (~55 ms/char). `Moody.chars.speaking(id)`, `.level(id)`, `.talkFor(id,sec)`. The stage's `h.talk` flag keeps working (rhythmic fallback).
**Portraits**: `chars.portrait(g,id,cx,cy,r,o)` is static (shaded). Art `face:<id>[:pose]` elements created with `Moody.art.el` (dialog avatars of characters without a jpg, e.g. toti/ofa/luka...) are **animated automatically** while attached to the DOM (blink, breath, emotion, lip-sync; 30 fps, max 8). Manual: `chars.portraitLive(canvas, id, {anim, emote, r})` -> `{stop()}`.

**Tap reaction**: `Moody.chars.react(id[, 'giggle'|'wave'|'spin'|'jumpcheer'|'auto'], {sfx:false})` returns the duration (0 if on cooldown / unknown). Characters also react by themselves when the canvas is tapped on an idle visible character while no kit owns the pointer (`stage.input` unset); set `Moody.chars.autoTap = false` if stage.js prefers to call `react` itself. Other characters look at the tapped one for ~2 s. `chars.gesture(id, anim, dur)` plays a one-shot without the stage.
**Enter / exit** (eased walk with the walk cycle): `chars.enter(id,{from:'left'|'right'|x, to:x, y, dur, wave:true, stage})` -> Promise; `chars.exit(id,{to:'left'|'right'|x, hide:true})` -> Promise; `chars.hug(idA, idB, {dur})` walks A next to B then both play `hug`. Defaults to `Moody.scene` as the stage.
Other: `chars.look(id,x,y,sec)`, `chars.stats()`.


---
# UI system v2 (engine/ui.css + ui.js) - premium kids-game look

* **Design tokens** (`:root` in ui.css): `--font` (Arabic-first stack, no web fonts), palette (`--orange --teal --pink --yellow --green --purple --blue --red --night`), radii `--r-s/m/l/pill`, depth `--sh-1/-2`, `--gloss`, easings `--ease-out --spring`, `--hud-h`, `--us` (UI scale, set by ui.js) and `--tap` (= 48 physical px in logical px; `min-height:max(64px,var(--tap))` keeps touch targets >= 48 px on phones).
* **Buttons** (`.btn` + colour `green teal pink blue purple yellow gray red orange`, size `sm big round`): per-colour vars `--b` (base) `--t` (top) `--d` (dark edge); 3D bottom edge, glossy highlight, pressed state (translate down), hover on `(hover:hover)`, `:focus-visible` ring, ripple + sparkle on tap (delegated in ui.js), `.shine` sweep for CTAs. Same look for `.tile`, `.opt`, `.choicecard`, `.seqcard`, `.cardmem`, `.mcard`, `.card`.
* **Icons**: `Moody.ui.i(name, px, {off, color})` = inline SVG sprite (coin star pause sound replay home back arrow lock check heart settings album diary parent phone play x swap plus minus whatnow narr hanger). `Moody.ui.ico(name)` still returns canvas art for game art, except `sound pause swap arrow whatnow narr coin star` which map to the SVG set. Colour via CSS vars `--ic` (fill) / `--ics` (shadow).
* **FX helpers**: `ui.flyTo('coin'|'star', x, y, {n, onArrive})` (flies to the `[data-ctr=kind]` counter in the HUD / result and bumps it; `ctx.reward.star` already uses it through `ui.starPop`), `ui.sparks(x,y,{n,r,colors})`, `ui.sparkEl(el)`, `ui.countTo(el, n, ms)`, `ui.bump(el)`.
* **HUD**: top band 0..76 only. Left: hero chips (`#sw .h[data-hero]`, active ring + name tag), `#what` (voice replay). Centre: `#prompt .p` + `#mprog` mission progress strip (`ui.hud.step(n)` / `ui.hud.progress(f)`; beats = new instruction, answered question, star, every 3rd dialog line; the total is learned from the last finished play of that mission, kept in `localStorage['moody_ui_v1']`). Right: pause + star pill + coin pill (count-up).
* **Dialog** `ui.say({who,text,x,dock,speed,name,icon,face,emotion,onTalk,register,auto})`: slim bubble, speaker portrait at the RTL start side, name tag, tail to the speaker (`x`, default = hero x on the stage, centred/hidden if unknown), typewriter (tap/Enter skips; speed follows the voice clip length when `Moody.voice.cur.duration` is known, else `speed` or 26 ms/char), auto-fit font (27..17 px, bubble <= ~26% of the screen height), enter/exit animation, 🔊 replay. `dock:'auto'` (default) docks at the bottom unless that would cover a hero; then it goes to the top, under the HUD. Optional hooks if the character module provides them: `Moody.chars.speaking(id,bool)`, `Moody.chars.emotion(id,name)`.
* **Safe-area API**: `Moody.ui.safeArea()` -> `{x,y,w,h,top,bottom,dock}` = the rectangle not covered by UI chrome (top = 76 under the HUD, or below a top-docked dialog; bottom = top edge of a bottom-docked dialog, else 540); `Moody.ui.onSafe(fn)` subscribes (returns unsubscribe); CSS vars `--safe-t/--safe-b` on `#ui`. Keep heroes and hotspots inside it.
* **Screens**: `UI.show(el, cls, level)`: levels title 0 / map 1 / world 2 / sub-screens + result 3 give fade-scale transitions forward or back; the previous screen leaves for 190 ms (inert, its data-* hooks removed). Showing any screen hides the mission HUD. `#splash` (index.html) is removed when the title appears.
* **Reduced motion**: `@media (prefers-reduced-motion)` disables animations, typewriter, confetti-like fx.
* **Hooks kept for the bot / kits**: `#hud #sw .h[data-hero] #what #prompt .p #skip #dlg .nx(display none while typing) #qz .qt .opt[data-correct] .spk .choicecard[data-good] .seqcard[data-i] .cardmem[data-art].back/.match .mch[data-k][data-side] .pkcnt .bar2 .btn[data-act] #over .btn.big.pink (ritual) #fadeov .card[data-world] .mcard[data-mission]`.


---
# Human replies + voice v2 (content/reactions.js, tools/voice2/)

**Reactions** (`content/reactions.js`, loaded after `baba_calls.js`): every automatic reply of the engine comes from `Moody.reactions.pick(context, {hero, speaker, tier, cat, helper, maxLen, mood})` / `.react()` (adds an occasional filler like "إيه ده!" and says who speaks) instead of fixed strings. Contexts: `correct1 correct2 wrong1 leadhint hintless reveal streak3/5/8 end1/2/3 praise misplace needhelp needstrong nudge start proud cat_* filler think`. Pools are `data[context][voice]` (voice = narrator, boy_big=Moody, boy_small=Aboody, girl_big=Toota, girl_small=Nemo, mama, baba, nana; arrays or `{any, n6, n9, m}`; `{x}` = the child, `{h}` = the helper hero). Anti-repeat memory per (context, voice), name lines ~30%, buddy cheers 60% / narrator 40%, streak counter resets after 90 s idle. **One text = one clip = one voice**: never put the same line in two voices (`Moody.reactions.audit()`; `collect_voice.js` warns). Hooks: `UI.quiz` (correct/wrong/hint/reveal), `UI.result` ribbon, `ctx.react('good')` (spoken cheer ~50 %, pass `{nopraise:true}` to skip), `ctx.praise`, `ctx.skipper` (idle nudge after 24 s, max 3), dragdrop wrong-place + `needMsg` in `minigames.js`. Adding lines: edit the pools, then `node tools/collect_voice.js --merge` and `python3 tools/gen_voice.py` (only the new strings are generated).

**Voice v2**: see `tools/voice2/README.md`. `python3 tools/gen_voice.py` = phrase-level prosody (per-phrase rate/pitch by punctuation + emotion class, jittered pauses, crossfades, question end-rise, warmth EQ, -18 LUFS, 40 kbps mono mp3); `--v1` = old flat pipeline; `tools/voice2/ledger.json` records what was rendered with which pipeline tag.
