/**
 * Linkon Browser — Shell Renderer
 * Handles: auth overlay, tabs, nav bar, sidebar, profile pill
 */

'use strict';

// ── Auth state ────────────────────────────────────────────────────────────────
const AUTH_KEY = 'linkon_user';

function getUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
}
function saveUser(u) { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function clearUser() { localStorage.removeItem(AUTH_KEY); }

// ── DOM refs ──────────────────────────────────────────────────────────────────
const authOverlay   = document.getElementById('auth-overlay');
const authStatus    = document.getElementById('auth-status');
const profilePill   = document.getElementById('profile-pill');
const profileAvatar = document.getElementById('profile-avatar');
const profileName   = document.getElementById('profile-name');
const profileBadge  = document.getElementById('profile-badge');
const tabStrip      = document.getElementById('tab-strip');
const urlBar        = document.getElementById('url-bar');
const urlSchemeIcon = document.getElementById('url-scheme-icon');

// ── Auth buttons ──────────────────────────────────────────────────────────────
document.getElementById('btn-login-github').addEventListener('click', () => loginWith('github'));
document.getElementById('btn-login-hf').addEventListener('click',     () => loginWith('huggingface'));
document.getElementById('btn-login-local').addEventListener('click',  () => loginLocal());

async function loginWith(provider) {
  setStatus('Opening ' + (provider === 'github' ? 'GitHub' : 'Hugging Face') + ' login…');

  // Tell main process to open OAuth window
  try {
    const user = await window.linkon.oauthLogin(provider);
    if (user) onLoggedIn(user);
    else setStatus('Login cancelled.');
  } catch (e) {
    setStatus('Login failed: ' + e.message);
  }
}

function loginLocal() {
  const user = {
    name:     'Local User',
    username: 'local',
    avatar:   '',
    provider: 'local',
    hfOrg:    null,
  };
  saveUser(user);
  onLoggedIn(user);
}

function onLoggedIn(user) {
  saveUser(user);
  authOverlay.style.display = 'none';

  // Show profile pill
  profilePill.style.display = 'flex';
  profileName.textContent   = user.name || user.username;
  profileBadge.textContent  = user.provider === 'local'
    ? 'Local Mode'
    : (user.provider === 'github' ? 'GitHub' : 'Hugging Face');
  if (user.avatar) {
    profileAvatar.src = user.avatar;
  } else {
    profileAvatar.style.display = 'none';
  }

  // Update sidebar: if HF logged in, show Universe with org name
  if (user.hfOrg) {
    document.querySelector('[data-page="linkon://universe"]').title = user.hfOrg;
  }

  // Open universe tab
  window.linkon.newTab('linkon://universe');
}

function setStatus(msg) {
  authStatus.textContent = msg;
  setTimeout(() => { if (authStatus.textContent === msg) authStatus.textContent = ''; }, 5000);
}

// Profile pill click → open settings
profilePill.addEventListener('click', () => window.linkon.newTab('linkon://settings'));

// ── Check if already logged in ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (user) {
    onLoggedIn(user);
  }
  // Set auth background to linkon-bg
  document.getElementById('auth-bg').style.setProperty(
    '--auth-bg-url', 'url(../../../assets/linkon-bg.png)'
  );
  document.getElementById('auth-bg').style.backgroundImage = 'url(../../../assets/linkon-bg.png)';
});

// ── Tab rendering ─────────────────────────────────────────────────────────────
window.linkon.onTabsUpdate(renderTabs);

function renderTabs(tabs) {
  tabStrip.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.active ? ' active' : '');
    el.setAttribute('role', 'tab');
    el.setAttribute('aria-selected', tab.active);
    el.innerHTML = `
      <span class="tab-title" title="${escHtml(tab.url)}">${escHtml(truncate(tab.title || 'New Tab', 22))}</span>
      <span class="tab-close" data-id="${tab.id}" title="Close">✕</span>
    `;
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        window.linkon.closeTab(tab.id);
      } else {
        window.linkon.switchTab(tab.id);
      }
    });
    tabStrip.appendChild(el);
  });

  // Update URL bar with active tab's URL
  const active = tabs.find(t => t.active);
  if (active) updateUrlBar(active.url);
}

// ── URL bar ───────────────────────────────────────────────────────────────────
window.linkon.onUrlChanged(url => updateUrlBar(url));

function updateUrlBar(url) {
  if (document.activeElement === urlBar) return; // don't interrupt typing
  urlBar.value = url.startsWith('file://') ? '' : url;
  // Scheme icon
  if (url.startsWith('https://')) urlSchemeIcon.textContent = '🔒';
  else if (url.startsWith('http://')) urlSchemeIcon.textContent = '⚠️';
  else urlSchemeIcon.textContent = '⬡';
}

urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = urlBar.value.trim();
    if (val) window.linkon.go(val);
    urlBar.blur();
  }
  if (e.key === 'Escape') urlBar.blur();
});
urlBar.addEventListener('focus', () => urlBar.select());

// ── Nav buttons ───────────────────────────────────────────────────────────────
document.getElementById('btn-new-tab').addEventListener('click',  () => window.linkon.newTab());
document.getElementById('btn-back').addEventListener('click',     () => window.linkon.back());
document.getElementById('btn-forward').addEventListener('click',  () => window.linkon.forward());
document.getElementById('btn-reload').addEventListener('click',   () => window.linkon.reload());
document.getElementById('btn-sgallery').addEventListener('click', () => window.linkon.newTab('linkon://sgallery'));
document.getElementById('btn-ai').addEventListener('click',       () => window.linkon.newTab('linkon://ai'));

// ── Window controls ───────────────────────────────────────────────────────────
document.getElementById('btn-min').addEventListener('click',   () => window.linkon.minimize());
document.getElementById('btn-max').addEventListener('click',   () => window.linkon.maximize());
document.getElementById('btn-close').addEventListener('click', () => window.linkon.close());

// ── Sidebar ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.sb-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.linkon.newTab(btn.dataset.page);
  });
});

// Toggle sidebar collapse
document.getElementById('btn-sidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('sidebar-collapsed');
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); window.linkon.newTab(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); window.linkon.closeTab(activeTabId()); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); urlBar.focus(); urlBar.select(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') { e.preventDefault(); window.linkon.reload(); }
});

function activeTabId() {
  const el = tabStrip.querySelector('.tab.active .tab-close');
  return el ? parseInt(el.dataset.id) : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function truncate(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }
