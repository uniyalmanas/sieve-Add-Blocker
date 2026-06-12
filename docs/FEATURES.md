# Winnow — Features Guide

How each Winnow feature works, what it does and doesn't do, and the design
decisions behind it. Written for v3.2.0.

Winnow is **100% on-device** in this release. Nothing about your browsing
leaves your machine. The optional cross-browser sync is built but disabled.

---

## Tabs at a glance

| Tab | What it does |
|-----|--------------|
| ⚙ Filter | Block topics & keywords (with smart aliases, English + Hindi) |
| ▶ YT | Hide YouTube elements (Shorts, comments, etc.) + block channels |
| ⏱ Focus | Schedule when filtering is active; Strict Mode lock |
| 🤖 AI | **AI Slop Filter** — hide AI-generated clutter (new in v3.2.0) |
| ☁ Sync | Cross-browser sync (built; off in this release) |
| 📊 Stats | What you've blocked: totals, streak, top topics, attention reclaimed |

---

## Master ON / OFF switch (v3.1.0)

The switch in the **top-right of the header** is the master power button — like
uBlock Origin's. It controls *all* filtering at once.

- **ON** — lime pulsing dot, subtitle reads "filtering your internet".
- **OFF** — red dot, subtitle reads "paused — content visible".

When you flip it OFF, every open tab is updated immediately and any content
Winnow had hidden **reappears without a reload**. Flip it ON and filtering
resumes at once. The state persists until you change it.

**Exception:** if a Strict Focus window is active, the switch is locked until
the window ends (by design — see Focus Mode).

**How it works:** the popup writes `filterEnabled` to `chrome.storage.sync`.
The content script's `isActive()` gates all filtering on it, and `unblockAll()`
restores hidden elements when it goes off.

---

## AI Slop Filter (v3.2.0)

Hides AI-generated clutter as you browse. It lives in the **🤖 AI** tab and is
**off by default**.

### The core principle: we don't "detect AI"

Reliably detecting whether text or an image was AI-generated is an unsolved
problem — even OpenAI retired its own AI-text detector for being inaccurate, and
image detectors lose to each new model generation. Worse, naive detectors throw
**false positives**, flagging real people's writing as "AI".

So Winnow deliberately does **not** guess. Instead it filters three **honest,
matchable signals** — each one a fact, not a guess — and lets you toggle each:

#### 1. Platform AI labels (default: on)

Platforms increasingly tag AI content themselves — Instagram, YouTube, TikTok,
and others render an "AI generated" / "Made with AI" badge. Winnow scans a
card's visible text for that **platform-provided label** and hides the card if
present.

This is the most reliable signal because you're reading the platform's *own
admission*, not inferring anything.

Patterns matched include: `AI generated`, `made with AI`, `created with AI`,
`AI-assisted`, `altered or synthetic`, and Hindi equivalents.

#### 2. Tell-tale AI phrases (default: on)

Lazy AI content often leaves giveaway phrases in the text. Winnow hides content
containing conservative, low-false-positive tells such as:

- "As an AI language model…"
- "Certainly! Here's…"
- "I cannot fulfill that request"
- "My knowledge cutoff…"

**Honest limitation:** this catches *careless* slop. Polished AI content that's
been edited leaves no tells and won't be caught — that's expected. The phrase
list is intentionally short and specific to avoid hiding legitimate content.

#### 3. AI-content-farm sites (two ways)

Hides links to AI-content-farm sites in feeds and search results. There are two
sources, used together:

**a) Built-in blocklist (one toggle, ~2,200 sites)** — flip *"Use built-in
blocklist"* and Winnow blocks links to a large, community-curated list of known
AI-content-farm domains with **zero typing**. It's **off by default** (opt-in),
so it never surprises anyone and keeps store review clean.
- Source: [laylavish/uBlockOrigin-HUGE-AI-Blocklist](https://github.com/laylavish/uBlockOrigin-HUGE-AI-Blocklist),
  licensed **CC0-1.0** (public domain), bundled as `ai-blocklist.js`.
- It's a *snapshot* — it doesn't auto-update. Refreshing it ships with app updates.
- The list is opinionated/image-focused and may include sites you consider fine;
  that's why it's opt-in and separate from your own list.

**b) Your own sites (manual)** — see an AI-slop site? Paste its address and
Winnow hides its links from then on. This is the reactive, power-user path:
*see a bad site → copy its address → add it → never see it again.*

Both sources share the same matching rules:
- Matching is **subdomain-aware**: blocking `example.com` also hides
  `news.example.com`. (Lookup is O(domain labels) via a Set, so even ~2,200
  bundled domains add no measurable cost.)
- Input is auto-normalized — `https://`, `www.`, and trailing paths are stripped,
  so `https://www.example.com/foo` becomes `example.com`.
- A domain must contain a dot to be accepted.

Only your *toggle choice* and your *own* domains sync across browsers — the
2,200-entry bundled list ships with the extension, it is never transmitted.

### How it integrates

- Runs inside the existing filtering engine, scanning the same news cards and
  YouTube cards as keyword filtering.
- Respects the **master ON/OFF switch** and **Focus Mode** — if filtering is
  paused or outside a Focus window, the AI filter is paused too.
- Blocked items feed the **Stats** counters, labeled `AI-labeled`, `AI slop`, or
  `AI-farm site` so you can see which signal caught them.
- Settings are stored under the `aiSlop` key in `chrome.storage.sync`:
  `{ enabled, labels, phrases, useBundled, domains: [] }`. The `useBundled`
  boolean opts into the ~2,200-site bundled list; `domains` holds your own.

### What it does NOT do

- It does not analyze images or video for AI generation.
- It does not run any ML model or send anything to a server — it's pure on-device
  string/domain matching, so there's no performance cost beyond the existing scan.
- It will not catch well-edited AI content with no labels or tells. By design,
  Winnow would rather miss some slop than wrongly hide a real person's post.

### Status banner

The AI tab shows what's active, e.g. `🤖 Filtering: platform labels · AI phrases
· 3 sites`. If the filter is on but every signal is disabled, it warns you to
pick at least one.

---

## Privacy

Both features are entirely local:

- The master switch and AI Slop settings are stored in `chrome.storage.sync`
  (your browser's own storage).
- The AI Slop Filter performs only in-memory string and domain matching on the
  pages you visit. No page content is stored or transmitted.

See [PRIVACY.md](../PRIVACY.md) for the full policy.
