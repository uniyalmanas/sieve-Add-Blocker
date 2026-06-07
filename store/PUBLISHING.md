# Winnow — Publishing & Deploy Runbook

Everything from "code is done" to "live in the stores", in order. Tick the boxes
as you go.

---

## Phase A — Deploy the sync backend (only you can do this)

This needs **your** Cloudflare login, so it can't be automated for you.
~15–20 min the first time.

```bash
# 1. Install the Cloudflare CLI (one time)
npm install -g wrangler

# 2. Log in — opens a browser to YOUR Cloudflare account
wrangler login
wrangler whoami          # confirm it's the right account before deploying

# 3. From the backend folder, create the KV store
cd backend
wrangler kv namespace create SIEVE_SYNC
#  -> prints:  id = "abc123..."   ← copy the id (keep the quotes when pasting)

# 4. Paste that id into wrangler.toml, replacing PASTE_YOUR_KV_NAMESPACE_ID_HERE

# 5. Deploy
wrangler deploy
#  -> prints your URL, e.g. https://sieve-sync.<subdomain>.workers.dev

# 6. Smoke-test the health endpoint
curl https://sieve-sync.<subdomain>.workers.dev/
#  -> {"ok":true,"service":"sieve-sync"}
```

- [ ] Worker deployed
- [ ] Health check returns `ok:true`

> **Decision point:** Do you want to ship the public extension with sync ON?
> - **Sync OFF (recommended for first launch):** leave `SYNC_ENDPOINT` as the
>   placeholder in the *published* build. Simplest store privacy review, no data
>   transmission to disclose. You can still use sync privately. Enable it in a
>   later version once you have users.
> - **Sync ON:** set `SYNC_ENDPOINT` to your Worker URL before packaging, and
>   answer the store data-disclosure forms as "transmits user-configured
>   settings on opt-in" (see `chrome-web-store.md`).

---

## Phase B — Connect & test sync (your machine, two browsers)

```js
// In popup.js, near the top:
const SYNC_ENDPOINT = 'https://sieve-sync.<subdomain>.workers.dev';
```
Then reload the extension at `chrome://extensions` (click ↻ on Winnow's card).

**Test cross-browser (NOT on a phone — mobile Chrome has no extensions):**
- [ ] Chrome: add 2–3 keywords → Sync tab → **Create code** → copy it.
- [ ] Edge (or Firefox): load the extension → Sync tab → **paste the code** → Link.
- [ ] Confirm the keywords appear in the second browser.
- [ ] Change a setting in Edge → back in Chrome, hit "Sync now" → change appears.

---

## Phase C — Host the privacy policy (required for Chrome)

The store needs a public **URL**, not a file. Free options:

**Option 1 — GitHub Pages (recommended, uses the file already in `docs/`):**
1. Push the repo (the `docs/privacy.html` file is already there).
2. GitHub repo → **Settings → Pages**.
3. Source: **Deploy from a branch** → branch `main` → folder **/docs** → Save.
4. Wait ~1 min. Your URL:
   `https://uniyalmanas.github.io/sieve-Add-Blocker/privacy.html`
- [ ] Page loads at that URL.

**Option 2 — a public GitHub Gist** of `PRIVACY.md` (quick, but Pages looks more legit).

Then paste that URL into:
- [ ] `chrome-web-store.md` description (replace `[YOUR PRIVACY POLICY URL]`)
- [ ] `firefox-amo.md` description
- [ ] The dedicated "Privacy policy URL" field in each store dashboard.

---

## Phase D — Make the screenshots (required)

Chrome needs ≥1 screenshot at **1280×800** or **640×400**. Make 3–5:
- [ ] Filter tab with keywords + region chips
- [ ] A real news page: headlines hidden (a before/after composite reads great)
- [ ] YouTube tab with the element toggles
- [ ] Focus tab with a schedule set
- [ ] Stats tab: reclaim card + 7-day chart

Tip: open the popup, screenshot at a clean window size, crop/pad to 1280×800.

---

## Phase E — Chrome Web Store submission

- [ ] Register developer account (one-time **US$5**) at
      https://chrome.google.com/webstore/devconsole
- [ ] Zip the extension (exclude backend/, store/, docs/, tests):
      ```bash
      # from headline-filter.3/
      zip -r winnow-chrome.zip manifest.json popup.html popup.js content.js icons/
      ```
- [ ] Upload zip → fill listing from `chrome-web-store.md`
- [ ] Add screenshots + 128px icon
- [ ] Paste privacy policy URL
- [ ] Complete the **Privacy practices** / data-disclosure form (see notes in
      `chrome-web-store.md`)
- [ ] Fill **single purpose** + **permission justifications**
- [ ] Submit for review (typically a few days)

---

## Phase F — Firefox AMO submission (free)

- [ ] Add `browser_specific_settings.gecko.id` to `manifest.json` (see
      `firefox-amo.md`) — Chrome ignores it, Firefox MV3 requires it.
- [ ] Test in Firefox via `about:debugging` → "Load Temporary Add-on".
- [ ] Zip and submit at https://addons.mozilla.org/developers/
- [ ] Paste the reviewer notes from `firefox-amo.md`.

---

## Phase G — Launch

- [ ] Grab your live store links.
- [ ] Follow the staggered sequence in `marketing.md` (don't blast everything
      day one).
- [ ] Reply to every comment/review in the first 48h.
- [ ] Watch the Chrome dashboard's acquisition data; double down on whatever
      channel actually drives installs.

---

## Pre-submit sanity checklist
- [ ] `node --check` passes on content.js / popup.js (no syntax errors)
- [ ] Icons present at 16/48/128
- [ ] Version bumped in `manifest.json` if this is a re-submission
- [ ] No leftover console spam / test code in the shipped files
- [ ] Decided sync ON vs OFF for the published build (Phase A decision point)
