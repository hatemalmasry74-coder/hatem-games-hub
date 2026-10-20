# Play Console → App content → Data safety (exact answers)

Basis: the code was grepped for `fetch`, `WebSocket`, `XMLHttpRequest`, `sendBeacon`, `EventSource`, `http(s)://`: the game only (a) reads its **own bundled** `assets/voice/manifest.json` and `.mp3` files, (b) registers a service worker (disabled in the Android app), (c) uses `localStorage['hub_moody_v1']` for progress. No absolute URLs except the SVG namespace string. The Android wrapper adds Google Play Billing and nothing else (no Firebase, no ads, no analytics, no crash reporter). The Play-edition web build and `make_www.js` lint (no analytics/ads/payment-link strings) keep it that way.

**These answers are true only while that stays true.** If you add any server, analytics, crash reporting, a RevenueCat-style SDK or any feature that sends data off the device, redo this form first.

Play's definition: data is "collected" when it is **transmitted off the device**. Data that stays on the device (progress, settings, the names a parent types) is *not* collected.

## Form, step by step

| Console question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | not shown (no data collected) — if shown: *Yes* |
| Do you provide a way for users to request that their data is deleted? | not shown — if shown: *Not applicable; no data is collected. Local data is deleted by "Reset all progress" or uninstall* |
| Privacy policy URL | the public URL where you host `docs/play/privacy.html` (required, also for Families) |
| Data types: Location, Personal info, Financial info, Health & fitness, Messages, Photos & videos, Audio files, Files & docs, Calendar, Contacts, App activity, Web browsing, App info & performance, Device or other IDs | **none selected** |
| Is data shared with third parties? | **No** |
| Independent security review (optional) | No |

Result on the Play listing: "No data collected" / "No data shared".

### About Google Play Billing
Purchases are processed by Google Play. Google's guidance (verify the wording in the form's help text on the day) is that you declare what **your app** collects or shares; the purchase flow itself is Google's. We receive no payment data. If the form still asks you about "Purchase history", answer that **your app does not collect it** — as long as you do not use a validation server. With a server or a third-party billing SDK (e.g. RevenueCat) this changes: you would declare *Purchase history* and *Device or other IDs* (collected, linked to an app user id) and the privacy policy needs a rewrite.

## Other App-content declarations (same section of the Console)

| Declaration | Answer |
|---|---|
| Ads | **No, the app does not contain ads** |
| App access | All functionality available without login (free missions); premium via subscription — no special access instructions needed. Offer reviewers a **license-tester** account or explain the purchase flow in the notes. |
| Target audience and content | Age groups **6–8 and 9–12** (do not tick 13+; do not tick "5 and under" unless you accept the stricter under-5 rules). Appeals to children: **Yes**. See `FAMILIES_POLICY_CHECKLIST.md`. |
| Content ratings | questionnaire in `CONTENT_RATING.md` |
| News app / Government app / Financial features / Health apps / COVID | No / No / No / No / n.a. |
| Advertising ID | **No** (manifest removes `AD_ID`) |
| Data deletion URL (account deletion) | Not required: the app has no accounts |

## Re-check before every release
1. `unzip -p app-release.aab base/manifest/AndroidManifest.xml` has no new permissions (see `DECISION.md` §5).
2. `node android/scripts/make_www.js` prints no lint warnings you cannot explain (external URL, analytics).
3. The Play **pre-launch report** and the *App bundle explorer → SDKs* list show only Google Play Billing.
