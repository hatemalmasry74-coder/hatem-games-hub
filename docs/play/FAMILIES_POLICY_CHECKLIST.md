# Google Play "Designed for Families" / Families Policy checklist

Rules change; the wording below is from my knowledge of the policy, not a copy of today's text. **Read the current Families Policy page in Play Console (Policy → Families) and tick each line yourself.** Status key: **OK** = satisfied by the build as it exists; **DEP** = depends on the other workstreams (Play-edition build / entitlement layer) — verify in the actual build; **OWNER** = you must do/declare it in Play Console.

| # | Requirement | Status | Notes / what to do |
|---|---|---|---|
| 1 | Declare target audience correctly (children included) and keep Store listing, screenshots and description consistent with it | OWNER | Select **6–8** and **9–12**. Appeals to children = Yes. Do not use teen/adult imagery or "for all ages" wording. |
| 2 | Content appropriate for children | OK | Cartoon characters, values/habits stories, no violence, no scary content. Re-read the final family edition once. IARC in `CONTENT_RATING.md`. |
| 3 | No ads (or only Play-certified ad SDKs, no behavioural ads) | OK | No ads, no ad SDK. Declare "No ads". |
| 4 | No analytics/tracking/other SDKs that collect child data; only SDKs that self-certify for Families | OK | Only Google Play Billing. `make_www.js` lint fails on analytics/ads names. |
| 5 | No personal and sensitive data collected from children; no advertising ID; no location, camera, mic, contacts | OK | Manifest has no such permissions; `AD_ID` removed. Names typed by a parent stay on the device. |
| 6 | No accounts/sign-in, chat, user-generated sharing | OK | None exist. |
| 7 | Privacy policy, accurate, linked in Console and reachable inside the app (parent area) | OWNER + DEP | Host `privacy.html`, fill placeholders, paste URL in Console. Add a "Privacy policy" link in the Parents' corner of the Play edition (opens in the system browser; keep it behind the parental gate). |
| 8 | Data safety form consistent with the app and policy | OWNER | `DATA_SAFETY.md`. |
| 9 | **Parental gate before purchases and before any external link** (e.g. maths question a 6–9-year-old cannot answer, or a long-press) | **DEP — critical** | Not part of the Android wrapper. The entitlement layer / game must show it before `MoodyBillingCapacitor.purchase()`, `manage()`, and any link out. Test as a reviewer would. |
| 10 | Purchases only through Google Play Billing; no external payment, codes, e-mail-to-buy, or links to payment pages | DEP | `paywall.js` (codes by e-mail) must not exist in the Play edition; `make_www.js` fails on its leftovers. |
| 11 | In-app purchase UI is not deceptive: price, period, renewal and "free vs paid" clear; no pressure/dark patterns aimed at children; no fake countdowns; nothing that lets a child buy without the gate | DEP + OWNER | Listing text says: one free mission per adventure, subscription unlocks the rest. Never call the app "free" without "with optional subscription". |
| 12 | No misleading "free" claims; no "download for free" while content is locked without saying so | OWNER | Use the provided listings. |
| 13 | WebView content limited to child-appropriate content; no third-party web content | OK | `allowNavigation: []`, no `server.url`, no remote pages. |
| 14 | No external links / social media buttons for children | DEP | Any link (support e-mail, privacy policy) only in the gated parent area. |
| 15 | COPPA / GDPR-K / Egypt PDPL / KSA PDPL | OK by design | No personal data collected. Not legal advice. |
| 16 | App must work as described, no crashes (Play also reviews quality for family apps) | OWNER | Test on a real phone and tablet; read the **pre-launch report**. |
| 17 | Developer account / contact details accurate; support e-mail answers | OWNER | |
| 18 | Optional programs: *Teacher Approved*, *Family Library* | OWNER | Opt in only after approval of the app. |
| 19 | Keep consistent over time: any new SDK, ad, analytics or data flow needs a policy review | OWNER | See `DATA_SAFETY.md` "Re-check". |
| 20 | Check the Play Console **Policy status** page and the pre-launch report for new warnings (Android 15/16 edge-to-edge, large-screen orientation, target API, billing library version) | OWNER | I cannot know today's exact requirements. |

## What you must declare in the Console (summary)
Target age groups 6–8 and 9–12 · appeals to children Yes · no ads · no data collected (Data safety) · privacy policy URL · IARC questionnaire · app contains in-app purchases/subscriptions (Monetise section) · content ratings.
