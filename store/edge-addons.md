# Microsoft Edge Add-ons — Listing Guide

Edge is Chromium, so **you upload the exact same `winnow-chrome.zip`** — no code
changes, no separate build. Registration is **free** (no $5 fee).

## Register
1. Go to **Microsoft Partner Center**:
   https://partner.microsoft.com/dashboard/microsoftedge/overview
2. Sign in with a Microsoft account, complete the free developer registration.
   (Individual accounts are free; you may be asked to verify email.)

## Submit
1. **Edge Add-ons → Create new extension** → upload **`winnow-chrome.zip`**.
2. **Listing details** — reuse the Chrome copy from `chrome-web-store.md`:
   - **Name:** Winnow — Block Distracting News, Topics & YouTube Clutter
   - **Short / summary:** same as Chrome summary
   - **Description:** paste the Chrome detailed description
   - **Category:** Productivity
3. **Store logo:** Edge wants a **300×300** PNG logo (separate from the 128px
   extension icon). If you don't have one yet, upscale/letterbox your 128px icon
   to 300×300, or make a simple branded square (dark `#14160f` + lime `#c8f135`).
   *(This is the one asset Chrome doesn't require but Edge does.)*
4. **Screenshots:** upload the same set from `store/screenshots/upload/`
   (1280×800). Edge accepts these.
5. **Privacy policy URL:**
   https://uniyalmanas.github.io/winnow/docs/privacy.html
6. **Privacy / data practices:** same as Chrome — this v1 build is on-device and
   transmits nothing, so answer "does not collect user data."
7. **Permissions justification:** Edge asks why you need `<all_urls>` — reuse the
   Chrome justification from `chrome-web-store.md`.
8. Submit. **Edge review can take up to ~7 business days** (often faster).

## Notes
- Edge pulls some metadata from the manifest automatically.
- You can later turn on automatic publishing from a Chrome listing, but manual
  upload is simplest for v1.
- The one extra asset vs Chrome: the **300×300 store logo**.
