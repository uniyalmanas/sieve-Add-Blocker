// Winnow - Popup Script v3

let keywords = [];
let channels = [];
let ytSettings = {};
let schedule = {};   // { enabled, days:[], start, end, strict }
let aiSlop = {};     // { enabled, labels, phrases, domains:[] } — AI Slop Filter
let enabled = true;

// Rough estimate: each blocked item ~= 8 seconds of attention not lost.
const SECONDS_PER_BLOCK = 8;

// ── Sync backend ──
// Cross-browser sync is DISABLED for the v1 store build: the placeholder below
// makes endpointConfigured() false, so the extension makes ZERO network calls
// (100% on-device for the cleanest store review).
// To re-enable in v1.1 — or to use sync privately — set this to the live URL:
//   https://sieve-sync.uniyalmanas.workers.dev   (see backend/README.md)
const SYNC_ENDPOINT = 'https://YOUR-WORKER-SUBDOMAIN.workers.dev';
const endpointConfigured = () => !/YOUR-WORKER-SUBDOMAIN/.test(SYNC_ENDPOINT);

let syncState = { code: null, lastModified: 0, lastSynced: 0 };
let applyingRemote = false; // guard: don't re-push while applying a pulled blob
let pushTimer = null;

// YouTube selective-hide toggles (order = display order)
const YT_OPTIONS = [
  { key: 'shorts',      label: 'Shorts',          desc: 'Hide Shorts shelves, sidebar & reels' },
  { key: 'comments',    label: 'Comments',        desc: 'Hide the comment section on videos' },
  { key: 'likes',       label: 'Like / Dislike',  desc: 'Hide the like & dislike buttons' },
  { key: 'recommended', label: 'Recommended',     desc: 'Hide the up-next sidebar suggestions' },
  { key: 'endscreen',   label: 'End cards',       desc: 'Hide end-of-video suggested cards' },
  { key: 'homefeed',    label: 'Home feed',       desc: 'Blank the homepage recommendation grid' },
  { key: 'livechat',    label: 'Live chat',       desc: 'Hide live chat on streams' },
];

const ALIAS_HINTS = {
  'cricket':      ['IPL', 'Virat Kohli', 'MS Dhoni', 'RCB', 'CSK', 'T20', 'BCCI'],
  'football':     ['Ronaldo', 'Messi', 'FIFA', 'UEFA', 'Premier League', 'Mbappe'],
  'bollywood':    ['SRK', 'Salman Khan', 'Box Office', 'Karan Johar', 'Deepika'],
  'ipl':          ['RCB', 'CSK', 'KKR', 'T20 League', 'IPL Auction'],
  'politics':     ['Modi', 'BJP', 'Rahul Gandhi', 'Lok Sabha', 'Election'],
  'stock market': ['Sensex', 'Nifty', 'BSE', 'IPO', 'Mutual Fund', 'SEBI'],
  'celebrity':    ['Paparazzi', 'Red Carpet', 'Filmfare', 'Breakup'],
  'reality tv':   ['Bigg Boss', 'Indian Idol', 'Roadies', 'MasterChef'],
  'nfl':          ['Super Bowl', 'Tom Brady', 'Patrick Mahomes', 'NFL Draft'],
  'nba':          ['LeBron James', 'Stephen Curry', 'Lakers', 'NBA Finals'],
  'kardashians':  ['Kim Kardashian', 'Kylie Jenner', 'Khloe', 'SKIMS'],
  'trump':        ['Donald Trump', 'MAGA', 'Mar-a-Lago', 'Trump Trial'],
  'tiktok drama': ['TikTok Ban', 'TikToker', 'Viral TikTok'],
  'crypto':       ['Bitcoin', 'Ethereum', 'Dogecoin', 'NFT', 'Web3'],
  'war news':     ['Airstrike', 'Ceasefire', 'Missile Attack', 'Drone Strike'],
  'us politics':  ['Biden', 'Democrats', 'Republicans', 'Senate', 'White House'],
};

// ── Helpers ──
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── DOM refs ──
const tagContainer   = document.getElementById('tagContainer');
const kwInput        = document.getElementById('kwInput');
const addBtn         = document.getElementById('addBtn');
const clearBtn       = document.getElementById('clearBtn');
const kwCount        = document.getElementById('kwCount');
const enableToggle   = document.getElementById('enableToggle');
const statusSub      = document.getElementById('statusSub');
const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const toggleLabel    = document.getElementById('toggleLabel');
const aliasHint      = document.getElementById('aliasHint');
const resetStatsBtn  = document.getElementById('resetStats');
const ytToggles      = document.getElementById('ytToggles');
const chContainer    = document.getElementById('chContainer');
const chInput        = document.getElementById('chInput');
const chAddBtn       = document.getElementById('chAddBtn');
const chClearBtn     = document.getElementById('chClearBtn');
const chCount        = document.getElementById('chCount');
const schedEnabled   = document.getElementById('schedEnabled');
const schedConfig    = document.getElementById('schedConfig');
const schedStart     = document.getElementById('schedStart');
const schedEnd       = document.getElementById('schedEnd');
const schedStrict    = document.getElementById('schedStrict');
const schedHint      = document.getElementById('schedHint');
const focusStatus    = document.getElementById('focusStatus');
const dayRow         = document.getElementById('dayRow');
const aiEnabled      = document.getElementById('aiEnabled');
const aiConfig       = document.getElementById('aiConfig');
const aiLabels       = document.getElementById('aiLabels');
const aiPhrases      = document.getElementById('aiPhrases');
const aiUseBundled   = document.getElementById('aiUseBundled');
const aiBundledCount = document.getElementById('aiBundledCount');
const aiDomainInput  = document.getElementById('aiDomainInput');
const aiDomainAddBtn = document.getElementById('aiDomainAddBtn');
const aiDomainContainer = document.getElementById('aiDomainContainer');
const aiDomainCount  = document.getElementById('aiDomainCount');
const aiDomainClearBtn = document.getElementById('aiDomainClearBtn');
const aiStatus       = document.getElementById('aiStatus');
const syncWarn       = document.getElementById('syncWarn');
const syncUnlinked   = document.getElementById('syncUnlinked');
const syncLinked     = document.getElementById('syncLinked');
const syncCodeText   = document.getElementById('syncCodeText');
const syncCodeInput  = document.getElementById('syncCodeInput');
const syncCreateBtn  = document.getElementById('syncCreateBtn');
const syncLinkBtn    = document.getElementById('syncLinkBtn');
const syncCopyBtn    = document.getElementById('syncCopyBtn');
const syncNowBtn     = document.getElementById('syncNowBtn');
const syncUnlinkBtn  = document.getElementById('syncUnlinkBtn');
const syncStatus     = document.getElementById('syncStatus');

// ── Tab switching ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'stats') loadStats();
    if (tab.dataset.tab === 'focus') renderSchedule();
    if (tab.dataset.tab === 'aislop') renderAiSlop();
    if (tab.dataset.tab === 'sync') renderSync();
  });
});

// ── Region tabs ──
document.querySelectorAll('.rtab').forEach(rtab => {
  rtab.addEventListener('click', () => {
    document.querySelectorAll('.rtab').forEach(r => r.classList.remove('active'));
    rtab.classList.add('active');
    const region = rtab.dataset.region;
    document.getElementById('presets-india').style.display  = region === 'india'   ? 'flex' : 'none';
    document.getElementById('presets-western').style.display = region === 'western' ? 'flex' : 'none';
    syncPresetStates();
  });
});

// ── Storage ──
function save() {
  chrome.storage.sync.set({
    blockedKeywords: keywords,
    filterEnabled: enabled,
    blockedChannels: channels,
    ytSettings,
    schedule,
    aiSlop,
  }, notifyTab);
  if (!applyingRemote) {
    syncState.lastModified = Date.now();
    persistSyncState();
    schedulePush();
  }
}

function notifyTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'KEYWORDS_UPDATED', keywords, enabled, channels, yt: ytSettings, schedule, aiSlop
      }).catch(() => {});
    }
  });
}

// ── Render ──
// Reflect the master on/off state in the header so it's obvious at a glance
// whether filtering is live (like uBlock's power button).
function renderEnabledState() {
  enableToggle.checked = enabled;
  statusDot.classList.toggle('off', !enabled);
  statusSub.classList.toggle('off', !enabled);
  statusText.textContent = enabled ? 'filtering your internet' : 'paused — content visible';
  toggleLabel.textContent = enabled ? 'ON' : 'OFF';
  toggleLabel.classList.toggle('off', !enabled);
}

function syncPresetStates() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', keywords.map(k=>k.toLowerCase()).includes(btn.dataset.kw.toLowerCase()));
  });
}

function renderTags() {
  kwCount.textContent = keywords.length;
  syncPresetStates();
  if (!keywords.length) {
    tagContainer.innerHTML = '<span class="empty-state">No filters yet.</span>';
    return;
  }
  tagContainer.innerHTML = '';
  keywords.forEach((kw, i) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${escapeHtml(kw)}</span><button class="tag-remove" data-index="${i}">×</button>`;
    tagContainer.appendChild(tag);
  });
}

function addKeyword(kw) {
  kw = kw.trim();
  if (!kw || keywords.map(k=>k.toLowerCase()).includes(kw.toLowerCase())) return;
  keywords.push(kw);
  save(); renderTags();
}

function removeKeyword(i) {
  keywords.splice(i, 1);
  save(); renderTags();
}

// ── YouTube toggles ──
function renderYtToggles() {
  ytToggles.innerHTML = YT_OPTIONS.map(opt => `
    <div class="yt-row">
      <div>
        <div class="yt-row-label">${opt.label}</div>
        <div class="yt-row-desc">${opt.desc}</div>
      </div>
      <label class="toggle">
        <input type="checkbox" data-yt="${opt.key}" ${ytSettings[opt.key] ? 'checked' : ''}/>
        <span class="slider"></span>
      </label>
    </div>
  `).join('');
}

ytToggles.addEventListener('change', e => {
  const cb = e.target.closest('input[data-yt]');
  if (!cb) return;
  ytSettings[cb.dataset.yt] = cb.checked;
  save();
});

// ── Channel blocklist ──
function renderChannels() {
  chCount.textContent = channels.length;
  if (!channels.length) {
    chContainer.innerHTML = '<span class="empty-state">No channels blocked.</span>';
    return;
  }
  chContainer.innerHTML = '';
  channels.forEach((ch, i) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${escapeHtml(ch)}</span><button class="tag-remove" data-index="${i}">×</button>`;
    chContainer.appendChild(tag);
  });
}

function addChannel(ch) {
  ch = ch.trim();
  if (!ch || channels.map(c=>c.toLowerCase()).includes(ch.toLowerCase())) return;
  channels.push(ch);
  save(); renderChannels();
}

function removeChannel(i) {
  channels.splice(i, 1);
  save(); renderChannels();
}

chAddBtn.addEventListener('click', () => { addChannel(chInput.value); chInput.value = ''; chInput.focus(); });
chInput.addEventListener('keydown', e => { if (e.key === 'Enter') { addChannel(chInput.value); chInput.value = ''; } });
chContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tag-remove');
  if (btn) removeChannel(parseInt(btn.dataset.index));
});
chClearBtn.addEventListener('click', () => { if (!channels.length) return; channels = []; save(); renderChannels(); });

// ── Focus Mode (schedule + strict) ──
function toMin(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

// Mirrors content.js withinSchedule — true when a schedule window is active now.
function withinSchedule() {
  if (!schedule.enabled || !(schedule.days || []).length) return false;
  const start = toMin(schedule.start), end = toMin(schedule.end);
  const now = new Date();
  const day = now.getDay(), cur = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false;
  if (start < end) return schedule.days.includes(day) && cur >= start && cur < end;
  if (cur >= start) return schedule.days.includes(day);
  if (cur < end) return schedule.days.includes((day + 6) % 7);
  return false;
}

// Strict lock is active only while inside a strict-mode window.
function isLocked() {
  return !!(schedule.enabled && schedule.strict && withinSchedule());
}

function renderSchedule() {
  schedEnabled.checked = !!schedule.enabled;
  schedStart.value = schedule.start || '09:00';
  schedEnd.value = schedule.end || '17:00';
  schedStrict.checked = !!schedule.strict;
  const days = schedule.days || [];
  dayRow.querySelectorAll('.day-btn').forEach(b => {
    b.classList.toggle('active', days.includes(parseInt(b.dataset.day)));
  });
  schedConfig.style.opacity = schedule.enabled ? '1' : '.4';
  schedConfig.style.pointerEvents = schedule.enabled ? 'auto' : 'none';
  renderFocusStatus();
  applyLockState();
}

function renderFocusStatus() {
  if (!schedule.enabled) {
    focusStatus.className = 'status-banner on';
    focusStatus.textContent = 'Always filtering — Focus schedule off.';
    return;
  }
  const active = withinSchedule();
  if (active && schedule.strict) {
    focusStatus.className = 'status-banner locked';
    focusStatus.textContent = '🔒 Strict window active — settings locked until it ends.';
  } else if (active) {
    focusStatus.className = 'status-banner on';
    focusStatus.textContent = '🟢 Focus window active — filtering now.';
  } else {
    focusStatus.className = 'status-banner';
    focusStatus.textContent = '⏸ Outside window — filtering paused.';
  }
}

// Disable controls when a strict window is in force.
function applyLockState() {
  const locked = isLocked();
  enableToggle.disabled = locked;
  [addBtn, clearBtn, chAddBtn, chClearBtn, schedEnabled, schedStrict, schedStart, schedEnd, aiEnabled, aiLabels, aiPhrases, aiUseBundled, aiDomainAddBtn, aiDomainClearBtn].forEach(el => { if (el) el.disabled = locked; });
  dayRow.querySelectorAll('.day-btn').forEach(b => { b.disabled = locked; });
  document.querySelectorAll('.preset-btn, .tag-remove').forEach(b => { b.disabled = locked; });
}

schedEnabled.addEventListener('change', () => {
  if (isLocked()) { schedEnabled.checked = true; return; }
  schedule.enabled = schedEnabled.checked;
  if (schedule.enabled && !(schedule.days || []).length) schedule.days = [1, 2, 3, 4, 5];
  save(); renderSchedule();
});
schedStrict.addEventListener('change', () => { schedule.strict = schedStrict.checked; save(); renderSchedule(); });
schedStart.addEventListener('change', () => { schedule.start = schedStart.value; save(); renderSchedule(); });
schedEnd.addEventListener('change', () => { schedule.end = schedEnd.value; save(); renderSchedule(); });
dayRow.addEventListener('click', e => {
  const btn = e.target.closest('.day-btn');
  if (!btn || isLocked()) return;
  const d = parseInt(btn.dataset.day);
  schedule.days = schedule.days || [];
  const i = schedule.days.indexOf(d);
  if (i > -1) schedule.days.splice(i, 1); else schedule.days.push(d);
  save(); renderSchedule();
});

// ── AI Slop Filter ──
function aiDomains() {
  return Array.isArray(aiSlop.domains) ? aiSlop.domains : [];
}

function renderAiDomains() {
  const domains = aiDomains();
  aiDomainCount.textContent = domains.length;
  if (!domains.length) {
    aiDomainContainer.innerHTML = '<span class="empty-state">No domains blocked.</span>';
    return;
  }
  aiDomainContainer.innerHTML = '';
  domains.forEach((d, i) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${escapeHtml(d)}</span><button class="tag-remove" data-index="${i}">×</button>`;
    aiDomainContainer.appendChild(tag);
  });
}

function bundledCount() {
  return Array.isArray(self.WINNOW_AI_BLOCKLIST) ? self.WINNOW_AI_BLOCKLIST.length : 0;
}

function renderAiStatus() {
  if (!aiSlop.enabled) {
    aiStatus.className = 'status-banner';
    aiStatus.textContent = 'AI Slop Filter is off.';
    return;
  }
  const signals = [];
  if (aiSlop.labels  !== false) signals.push('platform labels');
  if (aiSlop.phrases !== false) signals.push('AI phrases');
  const siteCount = aiDomains().length + (aiSlop.useBundled ? bundledCount() : 0);
  if (siteCount) signals.push(siteCount.toLocaleString() + ' site' + (siteCount > 1 ? 's' : ''));
  aiStatus.className = 'status-banner on';
  aiStatus.textContent = signals.length
    ? '🤖 Filtering: ' + signals.join(' · ')
    : '🤖 On, but no signals selected — pick at least one.';
}

function renderAiSlop() {
  aiEnabled.checked = !!aiSlop.enabled;
  aiLabels.checked  = aiSlop.labels  !== false; // default on
  aiPhrases.checked = aiSlop.phrases !== false; // default on
  aiUseBundled.checked = !!aiSlop.useBundled;   // default OFF (opt-in)
  const n = bundledCount();
  aiBundledCount.textContent = n ? n.toLocaleString() : 'a community list of';
  aiConfig.style.opacity = aiSlop.enabled ? '1' : '.4';
  aiConfig.style.pointerEvents = aiSlop.enabled ? 'auto' : 'none';
  renderAiDomains();
  renderAiStatus();
}

function normalizeDomain(raw) {
  return String(raw || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

function addAiDomain(raw) {
  const d = normalizeDomain(raw);
  if (!d || !d.includes('.')) return; // require a dotted domain
  const domains = aiDomains();
  if (domains.map(x => x.toLowerCase()).includes(d)) return;
  domains.push(d);
  aiSlop.domains = domains;
  save(); renderAiDomains(); renderAiStatus();
}

function removeAiDomain(i) {
  const domains = aiDomains();
  domains.splice(i, 1);
  aiSlop.domains = domains;
  save(); renderAiDomains(); renderAiStatus();
}

aiEnabled.addEventListener('change', () => {
  if (isLocked()) { aiEnabled.checked = !!aiSlop.enabled; return; }
  aiSlop.enabled = aiEnabled.checked;
  save(); renderAiSlop();
});
aiLabels.addEventListener('change', () => { aiSlop.labels = aiLabels.checked; save(); renderAiStatus(); });
aiPhrases.addEventListener('change', () => { aiSlop.phrases = aiPhrases.checked; save(); renderAiStatus(); });
aiUseBundled.addEventListener('change', () => { aiSlop.useBundled = aiUseBundled.checked; save(); renderAiStatus(); });
aiDomainAddBtn.addEventListener('click', () => { addAiDomain(aiDomainInput.value); aiDomainInput.value = ''; aiDomainInput.focus(); });
aiDomainInput.addEventListener('keydown', e => { if (e.key === 'Enter') { addAiDomain(aiDomainInput.value); aiDomainInput.value = ''; } });
aiDomainContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tag-remove');
  if (btn) removeAiDomain(parseInt(btn.dataset.index));
});
aiDomainClearBtn.addEventListener('click', () => { if (!aiDomains().length) return; aiSlop.domains = []; save(); renderAiDomains(); renderAiStatus(); });

// ── Cross-browser sync ──
function persistSyncState() {
  chrome.storage.local.set({ syncState });
}

function currentSettings() {
  return {
    blockedKeywords: keywords,
    filterEnabled: enabled,
    blockedChannels: channels,
    ytSettings,
    schedule,
    aiSlop,
  };
}

// Apply a settings blob pulled from the server (without re-triggering a push).
function applySettings(data) {
  if (!data) return;
  applyingRemote = true;
  keywords   = Array.isArray(data.blockedKeywords) ? data.blockedKeywords : [];
  enabled    = data.filterEnabled !== false;
  channels   = Array.isArray(data.blockedChannels) ? data.blockedChannels : [];
  ytSettings = data.ytSettings || {};
  schedule   = data.schedule || {};
  aiSlop     = data.aiSlop || {};
  save();              // persists locally + notifies tabs; no push (guarded)
  applyingRemote = false;
  enableToggle.checked = enabled;
  renderEnabledState();
  renderTags();
  renderYtToggles();
  renderChannels();
  renderSchedule();
  renderAiSlop();
}

// High-entropy, human-friendly code: 16 chars from an unambiguous alphabet.
function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let out = '';
  for (let i = 0; i < 16; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i < 15) out += '-';
  }
  return out; // e.g. ABCD-EFGH-JKLM-NPQR
}

function setSyncStatus(text, cls) {
  syncStatus.className = 'status-banner' + (cls ? ' ' + cls : '');
  syncStatus.textContent = text;
}

function fmtAgo(ts) {
  if (!ts) return 'never';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

async function pushSync() {
  if (!syncState.code || !endpointConfigured()) return;
  setSyncStatus('Syncing…');
  const res = await fetch(SYNC_ENDPOINT + '/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: syncState.code, data: currentSettings(), updatedAt: syncState.lastModified }),
  });
  if (!res.ok) throw new Error('push ' + res.status);
  syncState.lastSynced = Date.now();
  persistSyncState();
  renderSync();
}

async function pullSync() {
  if (!syncState.code || !endpointConfigured()) return { found: false };
  const res = await fetch(SYNC_ENDPOINT + '/sync?code=' + encodeURIComponent(syncState.code));
  if (res.status === 404) return { found: false };
  if (!res.ok) throw new Error('pull ' + res.status);
  const j = await res.json();
  if (j.found && (j.updatedAt || 0) > (syncState.lastModified || 0)) {
    applySettings(j.data);
    syncState.lastModified = j.updatedAt;
  }
  syncState.lastSynced = Date.now();
  persistSyncState();
  renderSync();
  return j;
}

function schedulePush() {
  if (!syncState.code || !endpointConfigured()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushSync().catch(() => setSyncStatus('Sync failed — will retry on next change.', '')); }, 1500);
}

async function createSyncCode() {
  syncState.code = genCode();
  syncState.lastModified = Date.now();
  persistSyncState();
  renderSync();
  try { await pushSync(); setSyncStatus('Linked · backed up ' + fmtAgo(syncState.lastSynced), 'on'); }
  catch { setSyncStatus('Created, but upload failed. Check your endpoint.', ''); }
}

async function linkSyncCode(raw) {
  const code = (raw || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{16,64}$/.test(code)) { setSyncStatus('Invalid code format.', ''); return; }
  syncState.code = code;
  syncState.lastModified = 0; // force remote to win if it exists
  persistSyncState();
  renderSync();
  try {
    const r = await pullSync();
    if (r.found === false) { await pushSync(); setSyncStatus('Linked · this device seeded the code.', 'on'); }
    else setSyncStatus('Linked · pulled settings ' + fmtAgo(syncState.lastSynced), 'on');
  } catch { setSyncStatus('Link failed — check the code / endpoint.', ''); }
}

function unlinkSync() {
  syncState = { code: null, lastModified: syncState.lastModified, lastSynced: 0 };
  persistSyncState();
  renderSync();
}

function renderSync() {
  const configured = endpointConfigured();
  syncWarn.style.display = configured ? 'none' : 'block';
  const linked = !!syncState.code;
  syncUnlinked.style.display = linked ? 'none' : 'block';
  syncLinked.style.display = linked ? 'block' : 'none';
  [syncCreateBtn, syncLinkBtn, syncNowBtn, syncCodeInput].forEach(el => { if (el) el.disabled = !configured; });
  if (linked) {
    syncCodeText.textContent = syncState.code;
    if (syncStatus.textContent === 'Not linked.' || !syncStatus.textContent) {
      setSyncStatus('Linked · last synced ' + fmtAgo(syncState.lastSynced), 'on');
    }
  } else if (configured) {
    setSyncStatus('Not linked. Create a code to sync across browsers.');
  } else {
    setSyncStatus('Coming soon — sync your filters across browsers.');
  }
}

syncCreateBtn.addEventListener('click', () => createSyncCode().catch(() => {}));
syncLinkBtn.addEventListener('click', () => { linkSyncCode(syncCodeInput.value); syncCodeInput.value = ''; });
syncCodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') { linkSyncCode(syncCodeInput.value); syncCodeInput.value = ''; } });
syncNowBtn.addEventListener('click', async () => {
  try { await pullSync(); await pushSync(); setSyncStatus('Synced ' + fmtAgo(Date.now()), 'on'); }
  catch { setSyncStatus('Sync failed — check connection / endpoint.', ''); }
});
syncCopyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(syncState.code || '').then(() => {
    syncCopyBtn.textContent = 'Copied!';
    setTimeout(() => { syncCopyBtn.textContent = 'Copy'; }, 1200);
  }).catch(() => {});
});
syncUnlinkBtn.addEventListener('click', () => { if (confirm('Unlink this device? Settings stay, but stop syncing.')) unlinkSync(); });

// ── Events ──
addBtn.addEventListener('click', () => { addKeyword(kwInput.value); kwInput.value = ''; kwInput.focus(); });
kwInput.addEventListener('keydown', e => { if (e.key === 'Enter') { addKeyword(kwInput.value); kwInput.value = ''; } });
tagContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tag-remove');
  if (btn) removeKeyword(parseInt(btn.dataset.index));
});
clearBtn.addEventListener('click', () => { if (!keywords.length) return; keywords = []; save(); renderTags(); });
enableToggle.addEventListener('change', () => {
  if (isLocked()) { enableToggle.checked = true; return; } // strict mode: can't disable
  enabled = enableToggle.checked;
  renderEnabledState();
  save();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const hints = ALIAS_HINTS[btn.dataset.kw.toLowerCase()];
    aliasHint.innerHTML = hints ? `Also blocks: <strong>${hints.slice(0,5).join(', ')}</strong>` : '';
  });
  btn.addEventListener('mouseleave', () => { aliasHint.innerHTML = ''; });
  btn.addEventListener('click', () => {
    const kw = btn.dataset.kw;
    const idx = keywords.findIndex(k => k.toLowerCase() === kw.toLowerCase());
    if (idx > -1) removeKeyword(idx); else addKeyword(kw);
  });
});

// ── Stats ──
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h >= 1) return `${h}h ${m}m`;
  if (m >= 1) return `${m} min`;
  return `${totalSeconds}s`;
}

// Build the last-7-days bar chart from stats.history (date -> count).
function renderWeekChart(history) {
  const chart = document.getElementById('weekChart');
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ label: dayLabels[d.getDay()], count: history[key] || 0 });
  }
  const max = Math.max(1, ...days.map(d => d.count));
  chart.innerHTML = days.map(d => {
    const pct = Math.round((d.count / max) * 100);
    return `<div class="week-col" title="${d.count} blocked">
      <div class="week-bar ${d.count ? '' : 'empty'}" style="height:${d.count ? Math.max(pct, 6) : 4}%"></div>
      <div class="week-day">${d.label}</div>
    </div>`;
  }).join('');
}

function getWellness(total) {
  if (total === 0)  return { emoji: '🧘', msg: 'Your feed, your rules.', sub: 'Add filters and start reclaiming your attention.' };
  if (total < 10)   return { emoji: '🌱', msg: 'Getting started.', sub: 'A cleaner internet is taking shape. Keep going.' };
  if (total < 50)   return { emoji: '😌', msg: 'Noticeably calmer.', sub: "You've blocked a lot of noise. Your focus thanks you." };
  if (total < 200)  return { emoji: '🧠', msg: 'Sharp mind, clean feed.', sub: 'You are reclaiming serious amounts of attention.' };
  if (total < 500)  return { emoji: '🏆', msg: 'Distraction-free pro.', sub: 'Hundreds of distractions stopped. You are focused.' };
  return              { emoji: '🌟', msg: 'Internet zen master.', sub: 'You have blocked an extraordinary amount of noise.' };
}

function loadStats() {
  chrome.storage.local.get(['stats'], result => {
    const s = result.stats || { total: 0, today: 0, streak: 0, byKeyword: {}, history: {} };
    document.getElementById('statTotal').textContent  = (s.total  || 0).toLocaleString();
    document.getElementById('statToday').textContent  = (s.today  || 0).toLocaleString();
    document.getElementById('statStreak').textContent = (s.streak || 0);
    document.getElementById('statTopics').textContent = keywords.length;

    // Attention reclaimed (est.)
    const secs = (s.total || 0) * SECONDS_PER_BLOCK;
    document.getElementById('reclaimValue').textContent = formatDuration(secs);

    // 7-day chart
    renderWeekChart(s.history || {});

    // Top topics bar chart
    const byKw = s.byKeyword || {};
    const sorted = Object.entries(byKw).sort((a,b) => b[1]-a[1]).slice(0,5);
    const max = sorted[0]?.[1] || 1;
    const barList = document.getElementById('barList');
    if (!sorted.length) {
      barList.innerHTML = '<div style="font-family:monospace;font-size:11px;color:var(--muted)">No data yet — start browsing!</div>';
    } else {
      barList.innerHTML = sorted.map(([kw, count]) => `
        <div class="bar-item">
          <div class="bar-row">
            <span class="bar-name">${escapeHtml(kw)}</span>
            <span class="bar-count">${count.toLocaleString()}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
        </div>
      `).join('');
    }

    // Wellness message
    const w = getWellness(s.total || 0);
    document.getElementById('wellnessEmoji').textContent = w.emoji;
    document.getElementById('wellnessMsg').textContent   = w.msg;
    document.getElementById('wellnessSub').textContent   = w.sub;
  });
}

resetStatsBtn.addEventListener('click', () => {
  if (isLocked()) return; // can't wipe stats mid strict window
  if (!confirm('Reset all stats?')) return;
  chrome.storage.local.set({ stats: { total:0, today:0, streak:0, date:'', byKeyword:{}, history:{}, lastActiveDate:null } }, loadStats);
});

// ── Init ──
chrome.storage.sync.get(['blockedKeywords','filterEnabled','blockedChannels','ytSettings','schedule','aiSlop'], result => {
  keywords   = result.blockedKeywords || [];
  enabled    = result.filterEnabled !== false;
  channels   = result.blockedChannels || [];
  ytSettings = result.ytSettings || {};
  schedule   = result.schedule || {};
  aiSlop     = result.aiSlop || {};
  enableToggle.checked = enabled;
  renderEnabledState();
  renderTags();
  renderYtToggles();
  renderChannels();
  renderSchedule();
  renderAiSlop();

  // Load sync link state, then pull latest from the backend (if linked).
  chrome.storage.local.get(['syncState'], r => {
    if (r.syncState) syncState = r.syncState;
    renderSync();
    if (syncState.code && endpointConfigured()) {
      pullSync().catch(() => setSyncStatus('Could not reach sync backend.', ''));
    }
  });
});
