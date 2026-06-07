# Firefox Add-ons (AMO) — Listing Copy

For addons.mozilla.org. Firefox supports Manifest V3, but note the MV3
differences below before you submit.

---

## Name
```
Sieve — Block Distracting News, Topics & YouTube Clutter
```

## Summary (max 250 chars)
```
Hide Cricket, Bollywood, NFL, crypto hype, or any topic you choose — across news sites and YouTube. Smart aliases, English + Hindi matching, a YouTube control panel, scheduled Focus Mode, and optional cross-browser sync. No accounts, no tracking.
```

## Categories
Primary: `Privacy & Security` or `Other` → best fit is **Tabs** is wrong; use
**"Privacy & Security"** is acceptable, but the closest is actually
**"Other"**. Recommended: select **"Privacy & Security"** as primary and
**"Productivity"**-equivalent ("Other") as secondary if offered.

## Tags
```
productivity, focus, content-filter, youtube, news, distraction, hindi, ad-free-feed
```

---

## Description

```
Sieve quietly removes the topics you're tired of seeing, so your feed stops hijacking your attention.

Tell Sieve what you don't want to see — Cricket, Bollywood, IPL, NFL, the Kardashians, crypto hype, politics, a specific name — and it hides those headlines, video cards, and posts as you browse, across news sites and YouTube, in English and Hindi.

No accounts. No tracking. Nothing about your browsing leaves your device.

WHAT YOU CAN BLOCK
• Topics with smart aliases — block "Cricket" and it also catches IPL, Virat Kohli, RCB, CSK, T20, BCCI.
• One-tap region packs for India and Western feeds.
• Hindi / Devanagari headlines (क्रिकेट, बॉलीवुड, मोदी) that most blockers miss.
• Whole-word matching — "Cricket" won't hide "Xiaomi" or "DC Comics".

YOUTUBE CONTROL PANEL (each switch affects only its element)
• Shorts • Comments • Like/Dislike buttons • Recommended sidebar • End-screen cards • Home feed grid • Live chat
• Channel blocklist — stop specific channels from ever appearing.

FOCUS MODE
• Scheduled filtering — filter only during chosen hours/days (overnight windows supported).
• Strict Mode — lock settings during a focus window so you can't disable on impulse.
• Focus dashboard — attention reclaimed, 7-day chart, top topics, daily streak.

OPTIONAL CROSS-BROWSER SYNC
Link Chrome, Edge and Firefox with an anonymous sync code. Off by default; only settings sync, never your stats or browsing.

PRIVACY FIRST
No accounts, no email, no analytics, no ads, no trackers. On-device by default.

Privacy policy: [YOUR PRIVACY POLICY URL]
```

---

## "This add-on requires the following permissions" — notes for reviewers
AMO has a notes-to-reviewer field. Paste:
```
- storage: saves the user's own filter settings and local stats on-device.
- <all_urls> host access + content script: required so the user can filter
  distracting content on any site they visit. Page text is only read in-memory
  to match against the user's keyword list and hide matching elements; it is
  never stored or transmitted.
- The optional sync feature is OFF by default and only transmits user-configured
  filter settings to a self-hosted Cloudflare Worker when the user explicitly
  opts in. No browsing data is ever transmitted.
- No minified/obfuscated code; all source is human-readable.
```

---

## MV3 / Firefox gotchas to check before submitting
- Firefox MV3 uses `browser.*` APIs but supports the `chrome.*` namespace as an
  alias for most of what Sieve uses (`storage`, `runtime`, `tabs`). Sieve uses
  callback-style `chrome.storage` calls — these work in Firefox. **Test in
  Firefox before submitting** (load via `about:debugging`).
- Firefox requires an **add-on ID** for MV3. Add this to `manifest.json` before
  packaging for Firefox (Chrome ignores it):
  ```json
  "browser_specific_settings": {
    "gecko": { "id": "sieve@uniyalmanas", "strict_min_version": "121.0" }
  }
  ```
- `host_permissions: ["<all_urls>"]` on Firefox MV3 are **opt-in** — Firefox
  shows them as optional and the user grants them from the add-on's permissions
  screen. Confirm filtering still activates after granting.
- AMO does **source-code review** and rejects obfuscated code. Sieve's source is
  plain JS, so you're fine — just don't minify.

## Packaging
```bash
# From the extension root (the folder with manifest.json), zip the needed files:
zip -r sieve-firefox.zip manifest.json popup.html popup.js content.js icons/
```
Upload the zip at https://addons.mozilla.org/developers/ → "Submit a New Add-on".
AMO is free (no registration fee, unlike Chrome).
