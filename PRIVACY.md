# Privacy Policy — Sieve

**Last updated:** 7 June 2026

Sieve ("the extension") is a browser extension that filters distracting content
(news headlines, topics, and YouTube elements) from the pages you visit. This
policy explains exactly what data Sieve handles and what it does not.

**Short version:** Sieve does not collect, sell, or transmit your browsing
activity. Everything runs on your device. The only data that ever leaves your
machine is your *filter settings* — and only if **you** choose to turn on the
optional sync feature.

---

## What Sieve stores on your device

Sieve saves the following in your browser's local extension storage
(`chrome.storage`):

- The keywords and topics you choose to block
- YouTube channel names you choose to block
- Your YouTube element preferences (hide comments, Shorts, etc.)
- Your Focus Mode schedule (days and hours)
- Usage statistics shown in the popup (blocked counts, streak, a 7-day chart)

This data stays in your browser. It is used only to make the extension work.

## What Sieve does NOT do

- It does **not** collect your browsing history.
- It does **not** track the pages you visit or send them anywhere.
- It does **not** read, store, or transmit form data, passwords, or page
  content beyond matching it against your own keyword list in memory.
- It does **not** contain analytics, advertising, fingerprinting, or
  third-party tracking code.
- It does **not** sell or share any data with anyone.

## Permissions, and why they're needed

- **`storage`** — to save your filter settings and stats on your device.
- **`activeTab`** — to apply filtering to the page you're viewing.
- **Host access (`<all_urls>`)** — Sieve filters content on whatever sites you
  visit, so it needs permission to run on pages. It uses this **only** to scan
  page text against your keyword list and hide matching elements in your
  browser. No page content is recorded or sent anywhere.

## Optional sync (off by default)

Sieve includes an **optional** cross-browser sync feature. It is **off unless
you turn it on** by creating or entering a sync code.

If you enable sync:

- Only your **filter settings** (keywords, blocked channels, YouTube toggles,
  and Focus schedule) are uploaded. **Your statistics are never uploaded** —
  they stay on each device.
- Your browsing activity is **never** part of sync.
- Data is stored on a **Cloudflare Worker backend that you (or whoever
  distributes your copy) deploy and control** — there is no central Sieve
  server operated by the developer.
- Your sync code is **never stored in plain text** on the server; settings are
  stored under a SHA-256 hash of the code. Treat your code like a password:
  anyone who has it can read or overwrite that settings blob.
- You can stop syncing at any time by unlinking the code in the Sync tab.

## Data retention & deletion

- **On-device data:** removed when you uninstall the extension, or via your
  browser's "Clear data" for the extension.
- **Synced settings:** stored on the backend until overwritten. To stop using
  sync, unlink your code in the Sync tab; the operator of the backend controls
  deletion of stored blobs.

## Children's privacy

Sieve is a general-purpose productivity tool and is not directed at children
under 13. It collects no personal information.

## Changes to this policy

If this policy changes, the "Last updated" date above will change and the
revised policy will be published at the same URL.

## Contact

Manas Uniyal — uniyalmanas@gmail.com
