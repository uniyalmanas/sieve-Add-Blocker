# Sieve — Block Distracting News & Content

Filter out the noise while you scroll. Sieve hides headlines, video cards, and
whole topics you never want to see — **Cricket, Bollywood, IPL, NFL, NBA,
Kardashians, crypto hype, and more** — across news sites and YouTube, in
**English and Hindi**.

Built for both Indian and global audiences. Clean feed. Clear mind.

---

## Features

- **Topic filtering with smart aliases** — block "Cricket" and it also catches
  IPL, Virat Kohli, RCB, CSK, T20, BCCI… you don't have to list every variant.
- **Region presets** — one-tap topic packs for 🇮🇳 India and 🌍 Western feeds.
- **Hindi / Devanagari support** — matches Hindi headlines (क्रिकेट, बॉलीवुड,
  मोदी) the way most blockers can't.
- **Word-boundary matching** — "Cricket" won't hide "Xiaomi" or "DC Comics" by
  accident.
- **YouTube control panel** — selectively hide just what bothers you:
  - Shorts (shelves, sidebar, and reels in any feed)
  - Comments
  - Like / Dislike buttons
  - Recommended ("up next") sidebar
  - End-screen suggested cards
  - Home feed grid
  - Live chat
- **Channel blocklist** — stop specific YouTube channels from ever appearing in
  your feed.
- **Focus Mode (scheduled filtering)** — filter only during the hours and days
  you choose (e.g. 9–5 on weekdays); your feed stays normal the rest of the time.
  Overnight windows supported.
- **Strict Mode** — lock your settings during an active focus window so you
  can't disable the filter or edit your lists on impulse until it ends.
- **Focus dashboard** — see estimated attention reclaimed, a 7-day activity
  chart, top blocked topics, and a daily streak.
- **Cross-browser sync (optional)** — link Chrome, Edge & Firefox with an
  anonymous sync code to keep your filter settings in step. Off by default;
  see [backend/](backend/) to self-host the free Cloudflare Worker.
- **On-device by default** — your browsing never leaves your machine; only your
  *filter settings* are uploaded, and only if you opt into sync.

---

## Install (developer / unpacked)

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or any Chromium browser).
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select this folder.
5. Pin **Sieve** and open the popup to configure your filters.

---

## Usage

- **Filter tab** — pick region presets or add custom keywords.
- **YouTube tab** — flip on only the elements you want hidden, and block channels
  by name or `@handle`.
- **Focus tab** — set a schedule (days + hours) and optional Strict Mode.
- **Sync tab** — create a code to sync settings across browsers (requires the
  backend; see [backend/README.md](backend/README.md)).
- **Stats tab** — track blocked counts, top topics, time reclaimed, and streak.

The master toggle in the header turns all filtering on/off instantly.

---

## How it works

- A content script scans page text (and YouTube video cards) for your keywords
  and aliases, hiding matching elements.
- YouTube element hiding is done with scoped CSS toggled per option, so each
  switch affects **only** that element — flipping "Comments" never touches your
  likes or Shorts settings.
- Settings sync across all your open tabs via `chrome.storage`.

---

## Privacy

Sieve runs in your browser and never collects or transmits your browsing
activity. Your keyword and channel lists live in Chrome's local/synced storage.

**Optional sync:** if you create or link a sync code, your *filter settings*
(keywords, channels, YouTube toggles, schedule) — and nothing else — are stored
on the Cloudflare Worker backend **you** deploy, under a SHA-256 hash of your
code. Your stats stay on each device. Sync is off until you turn it on.

---

## Status

Active development. Selectors for YouTube are centralized in `content.js`
(`YT_CSS`) for easy maintenance as YouTube's markup evolves.

© 2026 Manas Uniyal. All rights reserved.
