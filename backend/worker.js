// Winnow Sync — Cloudflare Worker + KV
// ------------------------------------------------------------------
// Anonymous, code-based settings sync. The "sync code" is the only secret:
// whoever holds it can read/write that settings blob. We never store the raw
// code as a key — the KV key is a SHA-256 hash of the code, so a KV dump does
// not reveal usable codes. No accounts, no emails, no PII.
//
// Endpoints:
//   GET  /sync?code=XXXX-...   -> { found, data, updatedAt } | 404
//   POST /sync  {code,data,updatedAt} -> { ok, updatedAt }
//   GET  /                     -> health check
//
// Bind a KV namespace named SIEVE_SYNC (see wrangler.toml).

const MAX_BODY = 64 * 1024; // 64 KB cap — settings blobs are tiny

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// Codes look like ABCD-EFGH-JKLM-NPQR; allow 16–64 chars of [A-Za-z0-9-].
function validCode(code) {
  return typeof code === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(code);
}

// Derive a stable, non-reversible KV key from the secret code.
async function keyForCode(code) {
  const bytes = new TextEncoder().encode('sieve-sync:' + code);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  return 'sync:' + hex;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    if (url.pathname !== '/sync') {
      return json({ ok: true, service: 'sieve-sync' }); // health check
    }
    if (!env || !env.SIEVE_SYNC) return json({ error: 'KV namespace SIEVE_SYNC not bound' }, 500);

    // ── PULL ──
    if (request.method === 'GET') {
      const code = url.searchParams.get('code') || '';
      if (!validCode(code)) return json({ error: 'invalid code' }, 400);
      const raw = await env.SIEVE_SYNC.get(await keyForCode(code));
      if (!raw) return json({ found: false }, 404);
      const rec = JSON.parse(raw);
      return json({ found: true, data: rec.data, updatedAt: rec.updatedAt });
    }

    // ── PUSH ──
    if (request.method === 'POST') {
      const text = await request.text();
      if (text.length > MAX_BODY) return json({ error: 'payload too large' }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }
      const { code, data, updatedAt } = body || {};
      if (!validCode(code)) return json({ error: 'invalid code' }, 400);
      if (typeof data !== 'object' || data === null) return json({ error: 'no data' }, 400);
      const record = { data, updatedAt: Number(updatedAt) || Date.now() };
      await env.SIEVE_SYNC.put(await keyForCode(code), JSON.stringify(record));
      return json({ ok: true, updatedAt: record.updatedAt });
    }

    return json({ error: 'method not allowed' }, 405);
  },
};
