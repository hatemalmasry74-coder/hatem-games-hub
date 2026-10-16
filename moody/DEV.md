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
