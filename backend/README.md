# Sieve Sync Backend (Cloudflare Workers + KV)

A tiny, free, serverless backend that lets Sieve sync filter settings across
browsers using an anonymous **sync code**. No accounts, no emails, no PII —
the code is the only secret, and the server stores data under a SHA-256 hash
of it.

**What syncs:** keywords, blocked channels, YouTube toggles, Focus schedule.
**What doesn't:** stats/streaks (those stay on each device).

---

## Deploy in 5 minutes

You need a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and
[Node.js](https://nodejs.org).

```bash
# 1. Install the Cloudflare CLI
npm install -g wrangler

# 2. Log in (opens a browser)
wrangler login

# 3. From this backend/ folder, create the KV namespace
cd backend
wrangler kv namespace create SIEVE_SYNC
#  -> prints:  id = "abc123..."   ← copy that id

# 4. Paste the id into wrangler.toml (replace PASTE_YOUR_KV_NAMESPACE_ID_HERE)

# 5. Deploy
wrangler deploy
#  -> prints your URL, e.g.  https://sieve-sync.<your-subdomain>.workers.dev
```

## Connect the extension

Open `popup.js` and set the endpoint constant near the top to your Worker URL:

```js
const SYNC_ENDPOINT = 'https://sieve-sync.YOUR-SUBDOMAIN.workers.dev';
```

Reload the extension. The **☁ Sync** tab will now be active.

---

## API

| Method | Path | Body / Query | Response |
|--------|------|--------------|----------|
| `GET`  | `/sync?code=CODE` | — | `{ found:true, data, updatedAt }` or `404 { found:false }` |
| `POST` | `/sync` | `{ code, data, updatedAt }` | `{ ok:true, updatedAt }` |
| `GET`  | `/` | — | `{ ok:true, service:"sieve-sync" }` (health) |

- **Code format:** 16–64 chars of `[A-Za-z0-9-]` (the extension generates e.g. `ABCD-EFGH-JKLM-NPQR`).
- **Payload cap:** 64 KB.
- **Conflict resolution:** last-write-wins by `updatedAt` (client-side compares timestamps before applying a pull).

## Cost & limits

Cloudflare's free tier covers ~100k KV reads/day and 1k writes/day — far beyond
what a personal/early-stage user base needs. KV values here are a few KB each.

## Security notes

- The code **is** the credential. Anyone with a code can read/write that blob —
  treat it like a password. Codes are high-entropy (~80 bits) so they can't be
  guessed.
- Raw codes are never stored as keys (SHA-256 hashed), so a KV leak doesn't
  expose usable codes.
- For extra protection you can add a Cloudflare **Rate Limiting** rule on
  `/sync` in the dashboard (e.g. 60 req/min per IP).
- Data stored is only filter settings (keywords/channels) — low sensitivity,
  but still user data. Mention this in your privacy policy if you publish.
