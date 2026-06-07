# Chrome Web Store — Listing Copy

Paste-ready text for the Chrome Web Store Developer Dashboard. Fields are
labelled to match the dashboard. Character limits noted where they apply.

---

## Item name (max 75 chars)
```
Winnow — Block Distracting News, Topics & YouTube Clutter
```

## Summary (max 132 chars)
```
Hide Cricket, Bollywood, NFL, crypto hype & any topic you choose — across news sites and YouTube. English + Hindi. Clean feed.
```

## Category
`Productivity`

## Language
`English` (primary). Hindi keyword matching is a feature, but list language = English.

---

## Detailed description (max 16,000 chars)

```
Winnow quietly removes the topics you're tired of seeing — so your feed stops hijacking your attention.

Tell Winnow what you don't want to see (Cricket, Bollywood, IPL, NFL, NBA, the Kardashians, crypto hype, politics, a specific celebrity — whatever drains you), and it hides those headlines, video cards, and posts as you browse. It works across news sites and YouTube, in both English and Hindi.

No feeds to rebuild. No accounts required. Nothing about your browsing leaves your device.

━━━━━━━━━━━━━━━━━━━━
WHAT YOU CAN BLOCK
━━━━━━━━━━━━━━━━━━━━

• TOPICS WITH SMART ALIASES — Block "Cricket" and Winnow also catches IPL, Virat Kohli, RCB, CSK, T20, BCCI and more. You don't have to list every variation yourself.

• ONE-TAP REGION PACKS — Quick-start topic packs for 🇮🇳 India and 🌍 Western feeds.

• HINDI / DEVANAGARI — Matches Hindi headlines (क्रिकेट, बॉलीवुड, मोदी) that most blockers miss entirely.

• PRECISE WORD MATCHING — "Cricket" won't accidentally hide "Xiaomi" or "DC Comics". Winnow matches whole words, not fragments.

━━━━━━━━━━━━━━━━━━━━
YOUTUBE CONTROL PANEL
━━━━━━━━━━━━━━━━━━━━

Hide only what bothers you — each switch affects only its element:

• Shorts (shelves, sidebar, and reels)
• Comments
• Like / Dislike buttons
• Recommended "up next" sidebar
• End-screen suggested cards
• Home feed grid
• Live chat

Plus a CHANNEL BLOCKLIST — stop specific channels from ever showing up in your feed (by name or @handle).

━━━━━━━━━━━━━━━━━━━━
FOCUS MODE
━━━━━━━━━━━━━━━━━━━━

• SCHEDULED FILTERING — Filter only during the hours and days you choose (say, 9–5 on weekdays). Your feed is normal the rest of the time. Overnight windows supported.

• STRICT MODE — Lock your settings during an active focus window so you can't disable the filter on impulse until the window ends.

• FOCUS DASHBOARD — See estimated attention reclaimed, a 7-day activity chart, your top blocked topics, and a daily streak.

━━━━━━━━━━━━━━━━━━━━
OPTIONAL CROSS-BROWSER SYNC
━━━━━━━━━━━━━━━━━━━━

Link Chrome, Edge and Firefox with an anonymous sync code to keep your filter settings in step across browsers. It's completely OFF by default — your stats always stay on each device, and only your settings sync if you turn it on.

━━━━━━━━━━━━━━━━━━━━
PRIVACY FIRST
━━━━━━━━━━━━━━━━━━━━

• No accounts. No email. No sign-up.
• No analytics, ads, or trackers.
• Your browsing history is never collected or sent anywhere.
• On-device by default — only your filter settings sync, and only if you opt in.

Read the full privacy policy: [YOUR PRIVACY POLICY URL]

━━━━━━━━━━━━━━━━━━━━
WHO IT'S FOR
━━━━━━━━━━━━━━━━━━━━

Anyone whose feed has turned into noise — students avoiding match-score spoilers, professionals trying to focus during work hours, or anyone who just wants the internet to stop shouting about a topic they don't care about.

Install Winnow, tell it what to hide, and get a quieter feed.
```

---

## Single purpose (required justification field)
```
Winnow has one purpose: to hide user-selected distracting content (topics, keywords, and specific YouTube elements) from web pages and YouTube, so the user sees a less distracting feed.
```

## Permission justifications (required, per permission)

**`storage`**
```
Used to save the user's own filter settings (blocked keywords, channels, YouTube toggles, Focus schedule) and local usage stats on their device. No data is collected by the developer.
```

**`activeTab`**
```
Used to apply the user's filtering rules to the page they are currently viewing.
```

**Host permission `<all_urls>`**
```
Winnow lets users filter distracting content on any news site or web page they choose to visit, so it must be able to run its content script on pages in order to scan visible text against the user's own keyword list and hide matching elements. Page content is only read in-memory for matching; it is never stored or transmitted.
```

## Data usage disclosures (Privacy practices tab)
Check these answers in the dashboard's data-collection form:

- **Does your item collect or use user data?** → The honest answer is **Yes**,
  because the optional sync feature transmits user-entered settings. Disclose:
  - Data type: **"Website content" → No.** **"Personal communications" → No.**
    The relevant category is **"User activity" → No** and **"Website content" → No**.
    The only transmitted data is user-*configured settings* (keywords/channels).
    Select **"Personally identifiable information" → No**, and under the
    "Other" / configuration data, describe it as filter settings.
  - **Important:** if the published build still has `SYNC_ENDPOINT` set to the
    placeholder (sync disabled), you may answer that the item does **not**
    transmit data. If you ship with a live endpoint, answer **Yes** and disclose
    "user-configured filter settings, transmitted only when the user opts into
    sync."
- **Certify:** not sold to third parties; not used for purposes unrelated to
  core function; not used for creditworthiness/lending. ✅ All true.

> Decide before you publish: ship sync ON (live endpoint, disclose data
> transmission) or sync OFF (placeholder endpoint, simplest privacy review).
> For a first launch, shipping with sync OFF gets you the fastest, cleanest
> review. You can enable it in a later version.

---

## Assets you still need to produce
- **Icon:** 128×128 PNG (you already have `icons/icon128.png`).
- **Screenshots:** at least 1, up to 5. Size **1280×800** or **640×400**.
  Suggested set:
  1. Filter tab with a few keywords + region preset chips.
  2. A real news page with headlines visibly hidden (before/after).
  3. YouTube tab showing the element toggles.
  4. Focus tab with a schedule set.
  5. Stats tab showing the reclaim card + 7-day chart.
- **Small promo tile (optional):** 440×280 PNG.

## One-time setup
- **Developer account:** US$5 one-time registration fee.
- **Privacy policy URL:** required (you have one — host it, see PUBLISHING.md).
