# Store screenshots

Put your Chrome Web Store / Firefox AMO screenshots in **this folder**.

## Requirements
- **Size:** exactly **1280×800** (preferred) or **640×400**. Chrome rejects other sizes.
- **Format:** PNG (or JPG). No alpha/transparency needed.
- **Count:** 1 minimum, up to **5**. Do all 5 — more screenshots = more installs.
- These are **listing assets only** — they are NOT part of the extension build
  (`winnow-chrome.zip`) and never get shipped to users' browsers.

## Suggested shots (name them in this order so they upload sorted)
| File | What to show |
|------|--------------|
| `01-filter.png`   | Filter tab — a few keywords added + region preset chips |
| `02-news.png`     | A real news site with headlines hidden (before/after composite works great) |
| `03-youtube.png`  | YouTube tab — the element toggles (Shorts/comments/etc.) |
| `04-focus.png`    | Focus tab — a schedule set (e.g. 9–5 weekdays) |
| `05-stats.png`    | Stats tab — reclaim card + 7-day chart |

*(Skip a "Sync" screenshot — sync ships in V2.)*

## How to capture a clean 1280×800 shot on Windows
The popup itself is small, so don't just screenshot the popup raw. Two easy ways:

**Option A — popup on a backdrop (cleanest):**
1. Open the Winnow popup, screenshot just the popup (`Win + Shift + S`, drag around it).
2. Paste into any image editor (even PowerPoint / Canva / Figma / Photos).
3. Place it on a 1280×800 canvas with a solid or subtle-gradient background.
4. Export as PNG at 1280×800.

**Option B — real page with popup (most convincing for `02-news.png`):**
1. Open a news site that has stuff hidden by Winnow.
2. Open the popup over it, `Win + Shift + S` a 1280×800-ish region, then crop/pad to exactly 1280×800.

Free tools that make this 2 minutes: **Canva** (has a "Chrome screenshot" preset), **Figma**, or **Photopea** (free Photoshop in-browser).

## Tip
Use the same background colour across all 5 so the listing looks like a set, not
a grab-bag. Your brand accent is `#c8f135` (lime) on a dark `#14160f` — a dark
backdrop with a lime detail will match the extension.
