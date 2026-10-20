# Release checklist — what only YOU (the owner) can do

Things marked **(verify)** are from my memory of Google's rules; Google changes them often. When this file and Play Console disagree, Play Console wins.

## A. Before touching Play Console
1. [ ] **Pick the package name** and set it once: `node android/scripts/set_app_id.js com.yourname.moodyadventures` (lowercase, reverse-domain, never `com.example.*`). It can **never** be changed after the first upload.
2. [ ] Get the **Play-edition web build** from the other workstream (`node tools/play/build.js play_dist`) and confirm it has: the parental gate before purchase, no `paywall.js`/activation codes, no hub link, a Privacy-policy link in the gated Parents' corner, `Moody.billing` using `window.MoodyBillingCapacitor` (see `BILLING_CONTRACT.md`).
3. [ ] Decide: one family's edition (names of your kids) or the generic edition with the runtime family wizard. For a public store release use the **generic** one — never publish a build containing real children's names/photos (the code's privacy rule: cartoon avatars only).
4. [ ] Fill the placeholders `[DEVELOPER NAME]`, `[CONTACT EMAIL]`, `[DATE]` in `privacy.html` / `PRIVACY_POLICY.md`; **host `privacy.html` at a public https URL** (e.g. GitHub Pages: `https://<user>.github.io/hatem-games-hub/docs/play/privacy.html`). The URL must be reachable without login.
5. [ ] Create a **keystore for uploading** (keep 2 offline copies + the passwords in a password manager; losing it is recoverable only through Play's upload-key reset):
   `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
   Never commit it. Put the base64 in the GitHub secret `ANDROID_KEYSTORE_BASE64` (`base64 -w0 upload.jks`), plus `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## B. Developer account and app
6. [ ] Create a Google Play developer account (**one-time registration fee, US$25 as far as I know — verify**). Choose *personal* or *organization*. Identity verification (ID, address, phone, sometimes D-U-N-S for organizations) takes days — start early.
7. [ ] **Payments profile / merchant account** to sell subscriptions: confirm your country is a supported merchant location and which payout method works for you (**verify for Egypt/KSA** — if not supported you need a business/payments profile in a supported country).
8. [ ] **Personal accounts created after Nov 2023 must run a closed test before applying for production** — as I remember, **at least 12 testers opted in for 14 continuous days** (it was 20 before Dec 2024). **(verify the current numbers; organization accounts are treated differently)**. Plan ~3 weeks. Recruit testers by e-mail/Google Group before you start the clock.
9. [ ] Console → **Create app**: name, default language (Arabic), type **Game** (Families rules still apply), free/paid = **Free** (subscriptions are in-app), accept declarations.

## C. App content (all required before any release; see the other docs)
10. [ ] **Privacy policy** URL (step 4).
11. [ ] **Ads:** No.
12. [ ] **Target audience & content:** age groups **6–8 and 9–12**; appeals to children = Yes → `FAMILIES_POLICY_CHECKLIST.md` (tick each line yourself).
13. [ ] **Data safety** → `DATA_SAFETY.md` (No data collected / No data shared).
14. [ ] **Content rating** (IARC) → `CONTENT_RATING.md`.
15. [ ] Other declarations: no news app, no government app, no financial features, no health features. Advertising ID: No.
16. [ ] **Families / "Designed for Families"** section if shown.

## D. App signing and first upload
17. [ ] Opt in to **Play App Signing** (default for new apps): Google keeps the app-signing key, you sign uploads with the *upload key* from step 5.
18. [ ] Build the AAB: run the GitHub workflow **Android (Play)** (secrets set) → download artifact `moody-release-aab` — or locally `android/scripts/build.sh release --build-web play_dist` with the 4 env vars. If the voice clips push the base module over ~170 MB (`make_www.js` warns), add `--split-voice` (workflow input `split_voice`).
19. [ ] Console → Testing → **Internal testing** → create release → upload the AAB (versionCode must be higher than any earlier upload; the workflow uses run number + offset) → add testers (your own accounts) → roll out → open the opt-in link on a **real Android phone**, install from Play.
20. [ ] **First-hour test on the device** (this has never been done): launches in landscape, no system bars, voice plays, music/sfx, rotating between the two landscape sides works, Back button pauses a mission / closes dialogs / double-back exits, screen stays on, airplane mode: still works, rest of the app persists after killing it, no hub link, Parents' corner → privacy link opens the browser **only after the gate**.
21. [ ] Read the **Pre-launch report** (Play runs the app on real devices: crashes, accessibility, Android 15/16 edge-to-edge, large-screen/orientation warnings, target-API and billing-library warnings). I cannot know today's requirements — fix whatever it flags.

## E. Subscriptions
22. [ ] Console → Monetize → **Products → Subscriptions → Create**: ids **`moody_premium_monthly`** and **`moody_premium_yearly`** (ids are permanent). Each: one **base plan**, auto-renewing, billing period 1 month / 1 year; add a benefits list (≤ 4 short bullets: all adventures, new missions, no ads, works offline). Optionally a free trial/intro offer (then say so truthfully in the listing).
23. [ ] **Pricing:** set base price in your home currency and let Play convert, or set per country. Starting point from your hub: **49 EGP / 30 days, 5 USD / 30 days** — decide the monthly and yearly prices yourself (yearly usually ~10× monthly). Local-price rounding and VAT are handled by Play. Choose **countries**: Egypt, KSA, other Arab countries, plus others you want (every extra country adds tax/legal duties for you — **verify** what Play handles).
24. [ ] **Activate** both base plans. Subscriptions in the app only work once the app is on a testing track with the product active, installed **from Play** by a tester account.
25. [ ] **License testers:** Console → Settings → License testing → add the Google accounts of your testers (purchases are free/refund-like and renew fast). Test: buy → unlocks; kill app → still unlocked offline; cancel in Play → after the test period it locks (`EXPIRED`); "pending" payment; restore on a second device; user cancels the sheet; parental gate blocks a child.
26. [ ] Make sure the app shows the subscription terms next to the buy button (price from Play, period, auto-renew, how to cancel) — Play policy on subscription transparency **(verify)**.

## F. Store listing (Grow → Store presence)
27. [ ] Paste texts from `LISTING_AR.md` (default language) and `LISTING_EN.md` (translation). Title ≤ 30, short ≤ 80, full ≤ 4000.
28. [ ] Upload graphics from `docs/play/assets/out/` (regenerate from the **Play edition** with `node docs/play/assets/make_assets.js --url http://localhost:8921/play_dist/index.html?unlock=1`):
    - app icon 512×512 → `icon_512.png`
    - feature graphic 1024×500 → `feature_1024x500.jpg`
    - phone screenshots 2–8 → `phone_01..08.jpg` (1920×1080, landscape)
    - 7-inch tablet → `tablet7_*.jpg`, 10-inch tablet → `tablet10_*.jpg` (**verify** the current size rules; tablet screenshots are optional but raise ranking on tablets)
    - no real photos of children; no "free" claims in graphics; no store-badge or competitor imagery.
29. [ ] Category *Games → Educational* (or Adventure), contact e-mail, website (optional), privacy URL.

## G. Closed → production
30. [ ] **Closed testing**: promote the build, add ≥ the required testers (step 8), keep them opted in for the required days, collect feedback.
31. [ ] **Apply for production access** (Dashboard → "Apply for production") and answer the questions honestly.
32. [ ] Production → create release → **countries** → roll out (consider a staged rollout 10–20 %) → review takes from hours to a few days (new accounts and Families apps may take longer).
33. [ ] After launch: monitor Android vitals/crash rate, reply to reviews, keep `privacy.html` in sync with the app, bump `android/version.json` + versionCode for each update.

## H. Policy cautions (plain language)
- Subscriptions/digital unlocks **must** use Google Play Billing. **No** unlock codes, e-mail-to-buy, bank/wallet/InstaPay links, or links to payment pages anywhere in the Play build. (`paywall.js` of the web hub does exactly that — it must not be in the Play edition.)
- The **Families program** restricts ads, SDKs and data. Adding any analytics, crash reporting, ads, social login or a third-party billing SDK means re-doing Data safety, the privacy policy and the Families review.
- **Parental gate** before purchase and before any external link is expected for child-directed apps. Test it yourself as a 7-year-old would.
- Do not call the app "free" without saying the content is mostly a subscription.
- Android 15/16 edge-to-edge, large-screen orientation rules, target API and Billing Library versions: **I don't know today's exact requirements** — trust the Pre-launch report and Policy status pages.
- Google can reject or remove an app after launch for policy changes; keep a support e-mail you read.

## I. Things in this kit that are placeholders or untested
`com.example.moodyadventures` (appId) · developer/contact/date in the policy · product prices · keystore · the GitHub workflow (never run) · the app has never been launched on a device · billing never run against real Play · R8 left off · `tools/play/build.js` is not mine and may differ from what `make_www.js` assumes (an `index.html` in the output root, voice under `assets/voice/`).
