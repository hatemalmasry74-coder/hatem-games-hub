# مودي وعبودي – Moody & Aboody (developer guide)

Vanilla JS + canvas + HTML overlays. No libraries, fonts, images (except the two cartoon avatar jpgs in `assets/`), CDN or network calls.
Arabic RTL UI. Logical resolution **960x540**, scaled to fit with letterboxing (DPR capped at 2).
**Privacy rule: never add real photos of the children anywhere. Heroes are canvas drawings; only `assets/moody_cartoon.jpg` / `assets/aboody_cartoon.jpg` (cartoons) are used as avatars.**

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
