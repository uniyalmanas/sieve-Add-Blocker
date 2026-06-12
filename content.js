// Winnow - Content Script v3
// Blocks headlines, thumbnails, cards, channels by keyword + aliases
// Tracks block stats and reports them to storage

const BLOCKED_ATTR = 'data-sieve-blocked';
const OBSERVER_THROTTLE_MS = 300;

const ALIAS_MAP = {
  // Indian topics
  'cricket':      ['ipl', 'bcci', 't20', 'odi', 'test match', 'virat kohli', 'rohit sharma',
                   'ms dhoni', 'bumrah', 'shubman gill', 'hardik pandya', 'rcb', 'csk', 'mi ',
                   'kkr', 'srh', 'dc ', 'lsg', 'pbks', 'gt ', 'world cup cricket', 'ranji',
                   'क्रिकेट', 'विराट कोहली', 'रोहित शर्मा', 'धोनी', 'टीम इंडिया', 'गेंदबाज', 'बल्लेबाज'],
  'football':     ['fifa', 'uefa', 'premier league', 'la liga', 'bundesliga', 'serie a',
                   'ronaldo', 'messi', 'mbappe', 'neymar', 'champions league', 'epl',
                   'transfer window', 'isl ', 'goal ', 'फुटबॉल', 'रोनाल्डो', 'मेसी'],
  'bollywood':    ['box office', 'srk', 'shah rukh', 'salman khan', 'aamir khan',
                   'deepika', 'ranveer', 'karan johar', 'dharma', 'yash raj',
                   'akshay kumar', 'katrina', 'film review', 'trailer launch', 'first look',
                   'priyanka chopra', 'anushka', 'ranbir',
                   'बॉलीवुड', 'शाहरुख', 'सलमान', 'आमिर', 'अक्षय', 'दीपिका', 'बॉक्स ऑफिस', 'फिल्म'],
  'ipl':          ['ipl', 't20 league', 'rcb', 'csk', 'mi ', 'kkr', 'srh', 'pbks',
                   'dc ', 'lsg', 'gt ', 'ipl auction', 'mega auction', 'आईपीएल'],
  'politics':     ['modi', 'rahul gandhi', 'bjp', 'congress party', 'aap ', 'kejriwal',
                   'election commission', 'lok sabha', 'rajya sabha', 'pm modi',
                   'parliament session', 'manifesto', 'by-election',
                   'मोदी', 'राहुल गांधी', 'भाजपा', 'कांग्रेस', 'केजरीवाल', 'लोकसभा', 'चुनाव', 'संसद'],
  'stock market': ['sensex', 'nifty', 'bse', 'nse', 'stock crash', 'market rally',
                   'ipo ', 'mutual fund', 'share price', 'equity market', 'bull run',
                   'bear market', 'sebi', 'सेंसेक्स', 'निफ्टी', 'शेयर बाजार', 'म्यूचुअल फंड'],
  'celebrity':    ['paparazzi', 'red carpet', 'award night', 'filmfare', 'iifa',
                   'spotted at', 'breakup', 'relationship', 'wedding rumour'],
  'reality tv':   ['bigg boss', 'kbc ', 'kaun banega', 'indian idol', 'dance india',
                   'jhalak dikhhla', 'roadies', 'splitsvilla', 'masterchef india',
                   'the voice india', 'fear factor', 'बिग बॉस', 'इंडियन आइडल'],
  // Western topics
  'nfl':          ['super bowl', 'touchdown', 'quarterback', 'tom brady', 'patrick mahomes',
                   'fantasy football nfl', 'nfl draft', 'monday night football'],
  'nba':          ['lakers', 'celtics', 'lebron james', 'stephen curry', 'nba finals',
                   'nba draft', 'slam dunk', 'nba trade'],
  'kardashians':  ['kim kardashian', 'kylie jenner', 'kendall jenner', 'khloe', 'kourtney',
                   'kris jenner', 'travis scott', 'skims', 'keeping up'],
  'trump':        ['donald trump', 'trump tower', 'mar-a-lago', 'truth social',
                   'maga ', 'trump trial', 'trump rally'],
  'tiktok drama': ['tiktok ban', 'tiktok drama', 'tiktoker', 'tiktok trend',
                   'viral tiktok', 'tiktok influencer'],
  'crypto':       ['bitcoin', 'ethereum', 'crypto crash', 'dogecoin', 'nft ', 'web3',
                   'blockchain hype', 'altcoin', 'crypto market', 'defi '],
  'war news':     ['airstrike', 'ceasefire', 'casualty count', 'war update',
                   'conflict zone', 'missile attack', 'drone strike'],
  'us politics':  ['biden', 'democrats', 'republicans', 'gop ', 'congress vote',
                   'senate hearing', 'white house', 'oval office', 'filibuster'],
};

const YT_CARD_SELECTORS = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-reel-item-renderer',
  'ytd-shelf-renderer',
  'ytd-movie-renderer',
  'ytd-playlist-renderer',
  'ytd-channel-renderer',
  'ytd-radio-renderer',
];

const TITLE_SELECTORS = [
  'h1', 'h2', 'h3', 'h4',
  '#video-title', 'yt-formatted-string',
  '[class*="title"]', '[class*="headline"]',
  'a[href]', 'span', 'p',
];

let blockedKeywords = [];
let compiledMatchers = []; // [{ regex, keyword }] — regex per alias, mapped back to the user keyword
let blockedChannels = [];  // YouTube channel names/handles to hide from feeds
let ytSettings = {};       // { shorts, comments, likes, recommended, endscreen, homefeed, livechat }
let schedule = {};         // { enabled, days:[0-6], start, end, strict } — Focus Mode window
let aiSlop = {};           // { enabled, labels, phrases, domains:[] } — AI Slop Filter
let enabled = true;

// ── AI Slop Filter ──
// We do NOT try to "detect AI" (an unsolved problem). Instead we filter the
// honest, matchable proxies for AI slop:
//   1. labels  — the platform's OWN "AI generated" disclosure badge text
//   2. phrases — strong tell-tale phrases lazy AI content leaves behind
//   3. domains — a user-managed blocklist of known AI-content-farm sites
// Each card is hidden only when the matching signal is enabled by the user.
const AI_LABEL_PATTERNS = [
  'ai-generated', 'ai generated', 'made with ai', 'generated with ai',
  'created with ai', 'generated by ai', 'ai-assisted', 'ai assisted',
  'altered or synthetic', 'synthetic content', 'ai content',
  'इस वीडियो को ai', 'ai द्वारा',
];
// Conservative, low-false-positive tells. Whole-substring match on visible text.
const AI_PHRASE_PATTERNS = [
  'as an ai language model', 'as a large language model', 'as an ai, i',
  'i am an ai language model', "i'm an ai language model",
  "i'm sorry, but i cannot", 'i cannot fulfill that request',
  'i cannot fulfill this request', "certainly! here's", 'certainly! here is',
  "here's a comprehensive guide", 'as an artificial intelligence',
  'my knowledge cutoff', 'i do not have personal opinions',
];

// ── YouTube selective element hiding ──
// Each toggle adds a class on <html>; CSS below hides ONLY that element type,
// so flipping "Comments" leaves likes/shorts/etc. untouched.
const YT_STYLE_ID = 'sieve-yt-style';
const YT_KEYS = ['shorts', 'comments', 'likes', 'recommended', 'endscreen', 'homefeed', 'livechat'];
const YT_CSS = `
/* Shorts — shelves, sidebar entries, and individual reels in any feed */
html.sieve-yt-shorts ytd-rich-shelf-renderer[is-shorts],
html.sieve-yt-shorts ytd-reel-shelf-renderer,
html.sieve-yt-shorts ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
html.sieve-yt-shorts ytd-guide-entry-renderer:has(a[title="Shorts"]),
html.sieve-yt-shorts ytd-mini-guide-entry-renderer[aria-label="Shorts"],
html.sieve-yt-shorts ytd-rich-item-renderer:has(a[href^="/shorts"]),
html.sieve-yt-shorts ytd-video-renderer:has(a[href^="/shorts"]),
html.sieve-yt-shorts ytd-reel-item-renderer,
html.sieve-yt-shorts grid-shelf-view-model { display: none !important; }

/* Comments (watch page) */
html.sieve-yt-comments ytd-comments#comments,
html.sieve-yt-comments #comments.ytd-watch-flexy { display: none !important; }

/* Like / Dislike buttons (watch page) */
html.sieve-yt-likes #top-level-buttons-computed segmented-like-dislike-button-view-model,
html.sieve-yt-likes ytd-watch-metadata segmented-like-dislike-button-view-model,
html.sieve-yt-likes like-button-view-model,
html.sieve-yt-likes dislike-button-view-model { display: none !important; }

/* Recommended / "Up next" sidebar (watch page) */
html.sieve-yt-recommended #related,
html.sieve-yt-recommended ytd-watch-next-secondary-results-renderer { display: none !important; }

/* End-screen suggested cards (in-player) */
html.sieve-yt-endscreen .ytp-ce-element,
html.sieve-yt-endscreen .ytp-endscreen-content { display: none !important; }

/* Home feed — scoped to the homepage only */
html.sieve-yt-homefeed ytd-browse[page-subtype="home"] ytd-rich-grid-renderer { display: none !important; }

/* Live chat (streams) */
html.sieve-yt-livechat ytd-live-chat-frame#chat,
html.sieve-yt-livechat #chat-container { display: none !important; }
`;

function isYouTube() {
  return window.location.hostname.includes('youtube.com');
}

// ── Focus Mode (scheduled filtering) ──
// schedule = { enabled, days:[0..6], start:"HH:MM", end:"HH:MM", strict }
// When schedule.enabled, filtering is only ON inside the window. Overnight
// windows (end <= start, e.g. 22:00–06:00) are supported.
function withinSchedule(now) {
  if (!schedule || !schedule.enabled) return true; // no schedule => always allowed
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  if (!days.length) return true;
  const toMin = hhmm => {
    const [h, m] = String(hhmm || '').split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  const start = toMin(schedule.start || '09:00');
  const end = toMin(schedule.end || '17:00');
  const day = now.getDay();
  const cur = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false;            // zero-length window => never
  if (start < end) {                          // same-day window
    return days.includes(day) && cur >= start && cur < end;
  }
  // Overnight window: active late today (>=start) OR early "tomorrow" (<end),
  // where the early-morning part belongs to the *previous* scheduled day.
  if (cur >= start) return days.includes(day);
  if (cur < end) return days.includes((day + 6) % 7);
  return false;
}

// The single source of truth: is filtering active right now?
function isActive() {
  return enabled && withinSchedule(new Date());
}

function injectYtStyle() {
  if (!isYouTube() || document.getElementById(YT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = YT_STYLE_ID;
  style.textContent = YT_CSS;
  (document.head || document.documentElement).appendChild(style);
}

function applyYtSettings() {
  if (!isYouTube()) return;
  injectYtStyle();
  const root = document.documentElement;
  const on = isActive();
  YT_KEYS.forEach(key => {
    // Hide only when filtering is active (master on AND within schedule).
    root.classList.toggle('sieve-yt-' + key, on && !!ytSettings[key]);
  });
}

// Returns the original blocked-channel entry that matches, or null.
function channelBlocked(channelText) {
  const c = (channelText || '').trim().toLowerCase();
  if (!c) return null;
  for (const orig of blockedChannels) {
    const b = orig.trim().toLowerCase();
    if (b && (c === b || c.includes(b))) return orig;
  }
  return null;
}

// Stats tracking
let sessionBlocked = 0;

// ── AI Slop matching ──
// Returns a reason string (the matched signal) if this card looks like AI slop
// under the user's enabled signals, else null. `text` is the card's visible
// text; `href` is its primary link (for domain matching).
function aiSlopMatch(text, href) {
  if (!aiSlop || !aiSlop.enabled) return null;
  const lower = (text || '').toLowerCase();

  // 1. Platform's own "AI generated" label/badge.
  if (aiSlop.labels !== false) {
    for (const p of AI_LABEL_PATTERNS) {
      if (lower.includes(p)) return 'AI-labeled';
    }
  }

  // 2. Tell-tale leftover phrases from lazy AI generation.
  if (aiSlop.phrases !== false) {
    for (const p of AI_PHRASE_PATTERNS) {
      if (lower.includes(p)) return 'AI slop';
    }
  }

  // 3. User-managed AI-content-farm domain blocklist (+ optional bundled list).
  if (aiDomainSet && aiDomainSet.size && href) {
    let host = '';
    try { host = new URL(href, location.href).hostname.toLowerCase().replace(/^www\./, ''); } catch { host = ''; }
    if (host) {
      // Check the host and each parent domain against the Set (O(labels), not O(list)).
      const parts = host.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        const candidate = parts.slice(i).join('.');
        if (aiDomainSet.has(candidate)) return 'AI-farm site';
      }
    }
  }
  return null;
}

// Build the active domain Set from the user's custom domains plus, if enabled,
// the bundled CC0 AI-content-farm list (exposed by ai-blocklist.js).
let aiDomainSet = null;
function rebuildAiDomainSet() {
  const set = new Set();
  const custom = Array.isArray(aiSlop.domains) ? aiSlop.domains : [];
  custom.forEach(d => {
    const dom = String(d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (dom) set.add(dom);
  });
  if (aiSlop.useBundled && Array.isArray(self.WINNOW_AI_BLOCKLIST)) {
    self.WINNOW_AI_BLOCKLIST.forEach(d => { if (d) set.add(d); });
  }
  aiDomainSet = set;
}

function normalize(text) {
  // Keep latin alphanumerics AND Devanagari (U+0900–U+097F) so Hindi
  // headlines survive; everything else collapses to whitespace.
  return (text || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ\s]/g, ' ');
}

// Build a whole-word matcher for a term. Internal spaces become flexible
// whitespace; boundaries are any non-word char (or string edge), where
// "word" spans latin + Devanagari. Short codes like "mi" / "dc" match
// standalone tokens but NOT inside words ("Xiaomi"), and Hindi terms get
// Devanagari-aware boundaries instead of latin-only ones.
function buildMatcher(term) {
  const t = term.trim().toLowerCase();
  if (!t) return null;
  const escaped = t
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex metachars
    .replace(/\s+/g, '\\s+');               // collapse internal whitespace
  return new RegExp(`(?:^|[^a-z0-9\\u0900-\\u097f])${escaped}(?:[^a-z0-9\\u0900-\\u097f]|$)`);
}

function compileMatchers(raw) {
  const matchers = [];
  raw.forEach(kw => {
    const k = kw.trim().toLowerCase();
    if (!k) return;
    const terms = new Set([k, ...(ALIAS_MAP[k] || []).map(a => a.trim().toLowerCase())]);
    terms.forEach(term => {
      const regex = buildMatcher(term);
      if (regex) matchers.push({ regex, keyword: kw }); // map alias -> original keyword
    });
  });
  return matchers;
}

function getMatchedKeyword(text) {
  const n = normalize(text);
  for (const { regex, keyword } of compiledMatchers) {
    if (regex.test(n)) return keyword; // return original user keyword
  }
  return null;
}

function recordBlock(keyword) {
  sessionBlocked++;
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || { total: 0, today: 0, date: today, byKeyword: {}, history: {}, streak: 0, lastActiveDate: null };
    if (stats.date !== today) {
      stats.today = 0;
      stats.date = today;
      // streak logic
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      stats.streak = (stats.lastActiveDate === yStr) ? (stats.streak || 0) + 1 : 1;
    }
    stats.total = (stats.total || 0) + 1;
    stats.today = (stats.today || 0) + 1;
    stats.lastActiveDate = today;
    stats.byKeyword = stats.byKeyword || {};
    const kLower = keyword.toLowerCase();
    stats.byKeyword[kLower] = (stats.byKeyword[kLower] || 0) + 1;
    // Per-day history for the 7-day chart (capped to last 30 days).
    stats.history = stats.history || {};
    stats.history[today] = (stats.history[today] || 0) + 1;
    const days = Object.keys(stats.history).sort();
    while (days.length > 30) delete stats.history[days.shift()];
    chrome.storage.local.set({ stats });
  });
}

function getContainer(el) {
  if (window.location.hostname.includes('youtube.com')) {
    let node = el;
    while (node && node !== document.body) {
      if (YT_CARD_SELECTORS.some(s => node.matches?.(s))) return node;
      node = node.parentElement;
    }
  }
  let node = el;
  while (node && node !== document.body) {
    if (node.matches?.('article, li, [class*="card"], [class*="story"], [class*="post"], [class*="item"]'))
      return node;
    node = node.parentElement;
  }
  return el;
}

function blockElement(el, keyword) {
  const container = getContainer(el);
  if (container.getAttribute(BLOCKED_ATTR)) return;
  container.setAttribute(BLOCKED_ATTR, 'true');
  container.style.setProperty('display', 'none', 'important');
  if (keyword) recordBlock(keyword);
}

function unblockAll() {
  document.querySelectorAll(`[${BLOCKED_ATTR}]`).forEach(el => {
    el.removeAttribute(BLOCKED_ATTR);
    el.style.removeProperty('display');
  });
}

// Is the AI Slop Filter doing anything right now? (master on AND at least one signal)
function aiSlopActive() {
  if (!aiSlop || !aiSlop.enabled) return false;
  if (aiSlop.labels !== false) return true;
  if (aiSlop.phrases !== false) return true;
  if (aiSlop.useBundled && Array.isArray(self.WINNOW_AI_BLOCKLIST) && self.WINNOW_AI_BLOCKLIST.length) return true;
  return Array.isArray(aiSlop.domains) && aiSlop.domains.length > 0;
}

// Is there any text/card work to schedule? (keywords, channels, or AI slop)
function hasScanWork() {
  return compiledMatchers.length > 0 || blockedChannels.length > 0 || aiSlopActive();
}

function filterPage() {
  if (!isActive()) return;

  if (isYouTube()) {
    applyYtSettings(); // keep element-hiding classes alive across SPA navigation
    if (!hasScanWork()) return;
    const aiOn = aiSlopActive();
    document.querySelectorAll(YT_CARD_SELECTORS.join(', ')).forEach(card => {
      if (card.getAttribute(BLOCKED_ATTR)) return;
      const titleEl = card.querySelector(TITLE_SELECTORS.join(', '));
      const text = titleEl?.innerText || titleEl?.textContent || card.innerText || '';
      const channelEl = card.querySelector('#channel-name, #text.ytd-channel-name, .ytd-channel-name');
      const channel = channelEl?.innerText || '';
      // Channel blocklist takes priority over keyword matching.
      const blockedCh = channelBlocked(channel);
      if (blockedCh) {
        card.setAttribute(BLOCKED_ATTR, 'true');
        card.style.setProperty('display', 'none', 'important');
        recordBlock(blockedCh);
        return;
      }
      // AI Slop: scan the card's full text (catches the platform's AI badge).
      if (aiOn) {
        const href = card.querySelector('a[href]')?.getAttribute('href') || '';
        const aiReason = aiSlopMatch(card.innerText || text, href);
        if (aiReason) {
          card.setAttribute(BLOCKED_ATTR, 'true');
          card.style.setProperty('display', 'none', 'important');
          recordBlock(aiReason);
          return;
        }
      }
      const kw = getMatchedKeyword(text + ' ' + channel);
      if (kw) {
        card.setAttribute(BLOCKED_ATTR, 'true');
        card.style.setProperty('display', 'none', 'important');
        recordBlock(kw);
      }
    });
    return;
  }

  const aiOn = aiSlopActive();
  if (!compiledMatchers.length && !aiOn) return;
  TITLE_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      const text = el.innerText || el.textContent || el.getAttribute('href') || '';
      const kw = getMatchedKeyword(text);
      if (kw) { blockElement(el, kw); return; }
      if (aiOn) {
        const href = el.getAttribute('href') || el.querySelector?.('a[href]')?.getAttribute('href') || '';
        const aiReason = aiSlopMatch(text, href);
        if (aiReason) blockElement(el, aiReason);
      }
    });
  });
}

let filterTimer = null;
const observer = new MutationObserver(() => {
  if (!isActive()) return;
  // Element hiding is pure CSS; only schedule a scan if there's text/channel/AI work.
  if (!hasScanWork()) return;
  clearTimeout(filterTimer);
  filterTimer = setTimeout(filterPage, OBSERVER_THROTTLE_MS);
});

// Re-evaluate the schedule periodically so filtering switches on/off at the
// window boundary without needing a page reload or settings change.
let lastActive = null;
setInterval(() => {
  const now = isActive();
  if (now === lastActive) return;
  lastActive = now;
  applyYtSettings();
  if (now) {
    filterPage();
  } else {
    unblockAll(); // window just ended (non-strict) — reveal hidden content
  }
}, 30 * 1000);

function init() {
  chrome.storage.sync.get(
    ['blockedKeywords', 'filterEnabled', 'blockedChannels', 'ytSettings', 'schedule', 'aiSlop'],
    (result) => {
      blockedKeywords = result.blockedKeywords || [];
      enabled = result.filterEnabled !== false;
      blockedChannels = result.blockedChannels || [];
      ytSettings = result.ytSettings || {};
      schedule = result.schedule || {};
      aiSlop = result.aiSlop || {};
      rebuildAiDomainSet();
      compiledMatchers = compileMatchers(blockedKeywords);
      lastActive = isActive();
      applyYtSettings();
      filterPage();
      observer.observe(document.body, { childList: true, subtree: true });
    }
  );
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'KEYWORDS_UPDATED') {
    blockedKeywords = msg.keywords || [];
    enabled = msg.enabled !== false;
    blockedChannels = msg.channels || [];
    ytSettings = msg.yt || {};
    if (msg.schedule !== undefined) schedule = msg.schedule || {};
    if (msg.aiSlop !== undefined) aiSlop = msg.aiSlop || {};
    rebuildAiDomainSet();
    compiledMatchers = compileMatchers(blockedKeywords);
    lastActive = isActive();
    applyYtSettings();
    unblockAll();
    filterPage();
  }
});

// Keep every tab (not just the active one) in sync when settings change.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (!changes.blockedKeywords && !changes.filterEnabled &&
      !changes.blockedChannels && !changes.ytSettings && !changes.schedule &&
      !changes.aiSlop) return;
  if (changes.blockedKeywords) {
    blockedKeywords = changes.blockedKeywords.newValue || [];
    compiledMatchers = compileMatchers(blockedKeywords);
  }
  if (changes.filterEnabled) enabled = changes.filterEnabled.newValue !== false;
  if (changes.blockedChannels) blockedChannels = changes.blockedChannels.newValue || [];
  if (changes.ytSettings) ytSettings = changes.ytSettings.newValue || {};
  if (changes.schedule) schedule = changes.schedule.newValue || {};
  if (changes.aiSlop) aiSlop = changes.aiSlop.newValue || {};
  rebuildAiDomainSet();
  lastActive = isActive();
  applyYtSettings();
  unblockAll();
  filterPage();
});

init();
