// Sieve - Popup Script v3

let keywords = [];
let channels = [];
let ytSettings = {};
let enabled = true;

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
const aliasHint      = document.getElementById('aliasHint');
const resetStatsBtn  = document.getElementById('resetStats');
const ytToggles      = document.getElementById('ytToggles');
const chContainer    = document.getElementById('chContainer');
const chInput        = document.getElementById('chInput');
const chAddBtn       = document.getElementById('chAddBtn');
const chClearBtn     = document.getElementById('chClearBtn');
const chCount        = document.getElementById('chCount');

// ── Tab switching ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'stats') loadStats();
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
  }, notifyTab);
}

function notifyTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'KEYWORDS_UPDATED', keywords, enabled, channels, yt: ytSettings
      }).catch(() => {});
    }
  });
}

// ── Render ──
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

// ── Events ──
addBtn.addEventListener('click', () => { addKeyword(kwInput.value); kwInput.value = ''; kwInput.focus(); });
kwInput.addEventListener('keydown', e => { if (e.key === 'Enter') { addKeyword(kwInput.value); kwInput.value = ''; } });
tagContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tag-remove');
  if (btn) removeKeyword(parseInt(btn.dataset.index));
});
clearBtn.addEventListener('click', () => { if (!keywords.length) return; keywords = []; save(); renderTags(); });
enableToggle.addEventListener('change', () => { enabled = enableToggle.checked; save(); });

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
    const s = result.stats || { total: 0, today: 0, streak: 0, byKeyword: {} };
    document.getElementById('statTotal').textContent  = (s.total  || 0).toLocaleString();
    document.getElementById('statToday').textContent  = (s.today  || 0).toLocaleString();
    document.getElementById('statStreak').textContent = (s.streak || 0);
    document.getElementById('statTopics').textContent = keywords.length;

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
  if (!confirm('Reset all stats?')) return;
  chrome.storage.local.set({ stats: { total:0, today:0, streak:0, date:'', byKeyword:{}, lastActiveDate:null } }, loadStats);
});

// ── Init ──
chrome.storage.sync.get(['blockedKeywords','filterEnabled','blockedChannels','ytSettings'], result => {
  keywords   = result.blockedKeywords || [];
  enabled    = result.filterEnabled !== false;
  channels   = result.blockedChannels || [];
  ytSettings = result.ytSettings || {};
  enableToggle.checked = enabled;
  renderTags();
  renderYtToggles();
  renderChannels();
});
