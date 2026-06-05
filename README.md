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
- **Stats & streaks** — see how much noise you've blocked, top topics, and a
  daily focus streak.
- **100% on-device** — nothing you browse ever leaves your machine.

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
- **Stats tab** — track blocked counts, top topics, and your streak.

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

Sieve runs entirely in your browser. It does not collect, transmit, or store any
browsing data on external servers. Your keyword and channel lists live in
Chrome's local/synced storage only.

---

## Status

Active development. Selectors for YouTube are centralized in `content.js`
(`YT_CSS`) for easy maintenance as YouTube's markup evolves.

© 2026 Manas Uniyal. All rights reserved.
