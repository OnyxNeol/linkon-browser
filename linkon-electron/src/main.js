/**
 * Linkon Browser — Main Process
 * Engine: Blink (via Electron) — NOT Chromium the browser, NOT Google
 * Auth:   GitHub OAuth + Hugging Face OAuth
 * Search: Stract (self-hosted) or DuckDuckGo fallback — zero Google
 */

const {
  app, BrowserWindow, BrowserView, session,
  ipcMain, Menu, shell, net
} = require('electron');
const path = require('path');
const http = require('http');
const url  = require('url');
const os   = require('os');

// ── App identity ──────────────────────────────────────────────────────────────
app.setName('Linkon Browser');
if (process.platform === 'linux') app.setDesktopName('linkon.desktop');

// Strip Electron/Chrome from UA → show as LinkonBlink
app.userAgentFallback = (app.userAgentFallback || '')
  .replace(/Electron\/[\d.]+\s*/g, '')
  .replace(/Chrome\//,   'LinkonBlink/')
  .replace(/Chromium\//, 'LinkonBlink/');

// ── OAuth config ──────────────────────────────────────────────────────────────
// These are filled by the user via linkon://settings or env vars
// For the GitHub App: https://github.com/settings/developers
// For HF: https://huggingface.co/settings/applications
const OAUTH = {
  github: {
    clientId:     process.env.GITHUB_CLIENT_ID     || 'YOUR_GITHUB_CLIENT_ID',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
    authUrl:      'https://github.com/login/oauth/authorize',
    tokenUrl:     'https://github.com/login/oauth/access_token',
    userUrl:      'https://api.github.com/user',
    scope:        'read:user user:email',
  },
  huggingface: {
    clientId:     process.env.HF_CLIENT_ID     || 'YOUR_HF_CLIENT_ID',
    clientSecret: process.env.HF_CLIENT_SECRET || 'YOUR_HF_CLIENT_SECRET',
    authUrl:      'https://huggingface.co/oauth/authorize',
    tokenUrl:     'https://huggingface.co/oauth/token',
    userUrl:      'https://huggingface.co/api/whoami-v2',
    scope:        'openid profile',
  }
};

const SEARCH_ENGINE    = 'https://stract.com/search?q=';   // swap to http://localhost:3000/search?q= when running locally
const REDIRECT_PORT    = 49821;
const REDIRECT_URI     = `http://localhost:${REDIRECT_PORT}/oauth/callback`;

// ── State ─────────────────────────────────────────────────────────────────────
let mainWindow = null;
let tabs       = [];
let activeTabId = 0;
let nextTabId   = 1;

// ── Block Google telemetry ─────────────────────────────────────────────────────
app.on('ready', () => {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['*://update.googleapis.com/*','*://clients*.google.com/*','*://safebrowsing.googleapis.com/*'] },
    (_, cb) => cb({ cancel: true })
  );
});

// ── Window ────────────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 600,
    title: 'Linkon Browser',
    icon: path.join(__dirname, '..', 'assets', 'linkon.png'),
    titleBarStyle:   'hidden',
    titleBarOverlay: false,
    backgroundColor: '#08000f',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
      webviewTag:       false,
      sandbox:          false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'shell', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.on('resize', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) positionView(tab.view);
  });

  buildMenu();
}

// ── Tab helpers ───────────────────────────────────────────────────────────────
function createTab(rawUrl = 'linkon://universe') {
  const resolved = resolveUrl(rawUrl);

  const view = new BrowserView({
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          true,
      userAgent:        app.userAgentFallback,
    }
  });

  const id = nextTabId++;
  tabs.push({ id, view, url: resolved, title: 'New Tab' });
  mainWindow.addBrowserView(view);
  positionView(view);
  view.webContents.loadURL(resolved);

  view.webContents.on('page-title-updated', (_, title) => {
    updateTab(id, { title });
    broadcastTabs();
  });
  view.webContents.on('did-navigate', (_, u) => {
    updateTab(id, { url: u });
    broadcastTabs();
    broadcastUrl(id, u);
  });
  view.webContents.on('did-navigate-in-page', (_, u) => {
    updateTab(id, { url: u });
    broadcastUrl(id, u);
  });
  view.webContents.setWindowOpenHandler(({ url: u }) => { createTab(u); return { action: 'deny' }; });

  switchToTab(id);
  broadcastTabs();
  return id;
}

function switchToTab(id) {
  activeTabId = id;
  tabs.forEach(t => mainWindow.removeBrowserView(t.view));
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  mainWindow.addBrowserView(tab.view);
  positionView(tab.view);
  broadcastTabs();
  broadcastUrl(id, tab.url);
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  mainWindow.removeBrowserView(tabs[idx].view);
  tabs[idx].view.webContents.destroy();
  tabs.splice(idx, 1);
  if (!tabs.length) createTab('linkon://universe');
  else if (activeTabId === id) switchToTab(tabs[Math.min(idx, tabs.length - 1)].id);
  broadcastTabs();
}

function updateTab(id, changes) {
  const t = tabs.find(t => t.id === id);
  if (t) Object.assign(t, changes);
}

function positionView(view) {
  const TOOLBAR = 80; // titlebar(36) + navbar(44)
  const SIDEBAR = 52;
  const [w, h]  = mainWindow.getContentSize();
  view.setBounds({ x: SIDEBAR, y: TOOLBAR, width: w - SIDEBAR, height: h - TOOLBAR });
  view.setAutoResize({ width: true, height: true });
}

function tabList() {
  return tabs.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.id === activeTabId }));
}
function broadcastTabs()      { mainWindow?.webContents.send('tabs:update', tabList()); }
function broadcastUrl(id, u)  { if (id === activeTabId) mainWindow?.webContents.send('nav:urlChanged', u); }

// ── URL resolver ──────────────────────────────────────────────────────────────
function resolveUrl(input = '') {
  const raw = input.trim();
  if (!raw) return resolveUrl('linkon://universe');

  const pageMap = {
    'linkon://universe': 'universe.html',
    'linkon://newtab':   'universe.html',
    'linkon://sgallery': 'sgallery.html',
    'linkon://agents':   'agents.html',
    'linkon://ai':       'ai.html',
    'linkon://settings': 'settings.html',
  };
  if (pageMap[raw]) return `file://${path.join(__dirname, 'pages', pageMap[raw])}`;
  if (/^https?:\/\//i.test(raw) || /^file:\/\//i.test(raw)) return raw;
  if (/^[\w-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return 'https://' + raw;
  return SEARCH_ENGINE + encodeURIComponent(raw);
}

// ── OAuth flow ─────────────────────────────────────────────────────────────────
async function oauthLogin(provider) {
  const cfg = OAUTH[provider];
  if (!cfg) throw new Error('Unknown provider: ' + provider);

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

  // 1. Start local callback server
  const { code, state: retState } = await startCallbackServer(state);
  if (retState !== state) throw new Error('State mismatch — CSRF check failed');

  // 2. Exchange code for access token
  const tokenRes = await httpPost(cfg.tokenUrl, {
    client_id:     cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri:  REDIRECT_URI,
  }, { Accept: 'application/json' });

  if (!tokenRes.access_token) throw new Error('No access_token in response');

  // 3. Fetch user profile
  const userRes = await httpGet(cfg.userUrl, tokenRes.access_token);

  // 4. Normalise profile
  let user;
  if (provider === 'github') {
    user = {
      provider: 'github',
      username: userRes.login,
      name:     userRes.name || userRes.login,
      avatar:   userRes.avatar_url || '',
      email:    userRes.email || '',
      hfOrg:    null,
      token:    tokenRes.access_token,
    };
  } else {
    // Hugging Face
    const hfName = userRes.name || userRes.fullname || userRes.id || 'hf-user';
    user = {
      provider: 'huggingface',
      username: hfName,
      name:     userRes.fullname || hfName,
      avatar:   userRes.avatarUrl || '',
      email:    userRes.email || '',
      hfOrg:    `${hfName}-Linkon-Universe`,
      token:    tokenRes.access_token,
    };
  }

  return user;
}

// Opens the OAuth authorization URL in a popup window, returns { code, state }
function startCallbackServer(expectedState) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname === '/oauth/callback') {
        const { code, state, error } = parsed.query;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html><body style="background:#08000f;color:#e8e0ff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <img src="data:image/png;base64," style="width:60px;border-radius:12px;margin-bottom:12px"/>
            <h2 style="color:#7c3aed">✓ Login successful</h2>
            <p style="color:#7060a0">You can close this window and return to Linkon.</p>
          </div>
        </body></html>`);
        server.close();
        if (error) return reject(new Error('OAuth error: ' + error));
        resolve({ code, state });
      }
    });
    server.listen(REDIRECT_PORT, '127.0.0.1', () => {});
    server.on('error', reject);
    setTimeout(() => { server.close(); reject(new Error('OAuth timeout')); }, 120000);
  });
}

// Open the browser popup for OAuth
function openOAuthWindow(provider) {
  const cfg   = OAUTH[provider];
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

  const params = new URLSearchParams({
    client_id:    cfg.clientId,
    redirect_uri: REDIRECT_URI,
    scope:        cfg.scope,
    state,
    response_type: 'code',
  });
  const authUrl = cfg.authUrl + '?' + params.toString();

  const popup = new BrowserWindow({
    width: 500, height: 680,
    title: provider === 'github' ? 'Login with GitHub' : 'Login with Hugging Face',
    parent: mainWindow, modal: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: path.join(__dirname, '..', 'assets', 'linkon.png'),
    backgroundColor: '#08000f',
  });
  popup.setMenu(null);
  popup.loadURL(authUrl);

  return { popup, state };
}

// IPC: trigger OAuth from renderer
ipcMain.handle('oauth:login', async (_, provider) => {
  try {
    // Start callback server first
    const cfg   = OAUTH[provider];
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

    // Open popup
    const { popup } = openOAuthWindow(provider);
    // But we need to pass state — rebuild with correct state
    popup.close();

    const params = new URLSearchParams({
      client_id:     cfg.clientId,
      redirect_uri:  REDIRECT_URI,
      scope:         cfg.scope,
      state,
      response_type: 'code',
    });
    const authUrl = cfg.authUrl + '?' + params.toString();

    const callbackPromise = startCallbackServer(state);

    const popup2 = new BrowserWindow({
      width: 500, height: 680,
      title: provider === 'github' ? 'Login with GitHub' : 'Login with Hugging Face',
      parent: mainWindow, modal: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      icon: path.join(__dirname, '..', 'assets', 'linkon.png'),
      backgroundColor: '#08000f',
    });
    popup2.setMenu(null);
    popup2.loadURL(authUrl);
    popup2.on('closed', () => {});

    // Wait for callback
    const { code, state: retState } = await callbackPromise;
    popup2.close();

    if (retState !== state) throw new Error('State mismatch');

    // Exchange code
    const tokenRes = await httpPost(cfg.tokenUrl, {
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri:  REDIRECT_URI,
    }, { Accept: 'application/json' });

    if (!tokenRes.access_token) throw new Error('No token received');

    // Fetch profile
    const userRes = await httpGet(cfg.userUrl, tokenRes.access_token);

    let user;
    if (provider === 'github') {
      user = {
        provider: 'github',
        username: userRes.login,
        name:     userRes.name || userRes.login,
        avatar:   userRes.avatar_url || '',
        email:    userRes.email || '',
        hfOrg:    null,
        token:    tokenRes.access_token,
      };
    } else {
      const hfName = userRes.name || userRes.fullname || userRes.id || 'hf-user';
      user = {
        provider:  'huggingface',
        username:  hfName,
        name:      userRes.fullname || hfName,
        avatar:    userRes.avatarUrl || '',
        email:     userRes.email || '',
        hfOrg:     `${hfName}-Linkon-Universe`,
        token:     tokenRes.access_token,
      };
    }

    return user;
  } catch (err) {
    console.error('OAuth error:', err);
    throw err;
  }
});

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function httpGet(endpoint, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(endpoint);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent':  'LinkonBrowser/1.0',
        Accept:        'application/json',
      }
    };
    const mod = u.protocol === 'https:' ? require('https') : http;
    const req = mod.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end',  () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Bad JSON')); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(endpoint, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u    = new URL(endpoint);
    const post = JSON.stringify(body);
    const opts = {
      hostname: u.hostname, path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(post),
        'User-Agent':     'LinkonBrowser/1.0',
        Accept:           'application/json',
        ...extraHeaders,
      }
    };
    const mod = u.protocol === 'https:' ? require('https') : http;
    const req = mod.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end',  () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Bad JSON from ' + endpoint)); } });
    });
    req.on('error', reject);
    req.write(post);
    req.end();
  });
}

// ── IPC: nav + tabs ───────────────────────────────────────────────────────────
ipcMain.handle('tab:new',     (_, u)  => createTab(u));
ipcMain.handle('tab:switch',  (_, id) => switchToTab(id));
ipcMain.handle('tab:close',   (_, id) => closeTab(id));
ipcMain.handle('tab:list',    ()      => tabList());
ipcMain.handle('nav:go',      (_, u)  => { const t = tabs.find(t=>t.id===activeTabId); if(t) { const r=resolveUrl(u); t.view.webContents.loadURL(r); updateTab(activeTabId,{url:r}); } });
ipcMain.handle('nav:back',    ()      => tabs.find(t=>t.id===activeTabId)?.view.webContents.goBack());
ipcMain.handle('nav:forward', ()      => tabs.find(t=>t.id===activeTabId)?.view.webContents.goForward());
ipcMain.handle('nav:reload',  ()      => tabs.find(t=>t.id===activeTabId)?.view.webContents.reload());
ipcMain.handle('nav:getUrl',  ()      => tabs.find(t=>t.id===activeTabId)?.url || '');
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.handle('window:close',    () => mainWindow?.close());

// ── App menu ──────────────────────────────────────────────────────────────────
function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Linkon', submenu: [
      { label: 'About Linkon Browser', click: () => createTab('linkon://universe') },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
    ]},
    { label: 'Navigation', submenu: [
      { label: 'New Tab',   accelerator: 'CmdOrCtrl+T', click: () => createTab() },
      { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => closeTab(activeTabId) },
      { label: 'Reload',    accelerator: 'CmdOrCtrl+R', click: () => tabs.find(t=>t.id===activeTabId)?.view.webContents.reload() },
    ]},
    { label: 'Edit', submenu: [{ role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'}] },
    { label: 'Developer', submenu: [
      { label: 'DevTools (Page)',  accelerator: 'F12', click: () => tabs.find(t=>t.id===activeTabId)?.view.webContents.openDevTools() },
      { label: 'DevTools (Shell)',               click: () => mainWindow?.webContents.openDevTools() },
    ]},
  ]));
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(createMainWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createMainWindow(); });
