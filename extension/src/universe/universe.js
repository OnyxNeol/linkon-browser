// ============================================================
// Linkon Universe — Main Dashboard JS
// ============================================================

// ── Starfield ────────────────────────────────────────────────
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random()
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,180,255,${s.opacity})`;
      ctx.fill();
      s.y += s.speed;
      s.opacity = Math.abs(Math.sin(Date.now() * 0.0005 + s.x));
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ── State ────────────────────────────────────────────────────
let state = {
  user: null,
  galaxies: [],
  tabs: [],
  sandboxes: [],
  agents: [],
  currentGalaxy: null,
  immediateItems: []
};

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  const stored = JSON.parse(localStorage.getItem('linkon-user') || 'null');
  if (stored) {
    state.user = stored;
    await enterUniverse();
  } else {
    showScreen('login-screen');
  }
}

// ── Screen Manager ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ── Login ─────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const statusEl = document.getElementById('login-status');
  const btn = document.getElementById('login-btn');

  btn.querySelector('.btn-text').textContent = 'LAUNCHING…';
  statusEl.textContent = 'Connecting to TeraBites auth…';

  // Simulate auth (real auth hits TeraBites server)
  await new Promise(r => setTimeout(r, 800));

  state.user = {
    username,
    displayName: username,
    universeOrg: `${username}-Linkon-Universe`,
    avatar: username[0].toUpperCase(),
    token: 'local-token'
  };

  localStorage.setItem('linkon-user', JSON.stringify(state.user));

  // Show entering animation
  showScreen('entering-screen');
  document.getElementById('entering-text').textContent =
    `Entering ${state.user.universeOrg}…`;

  await new Promise(r => setTimeout(r, 2200));
  await enterUniverse();
});

// ── Enter Universe ───────────────────────────────────────────
async function enterUniverse() {
  // Populate header
  document.getElementById('universe-name-display').textContent =
    state.user.universeOrg;
  document.getElementById('user-avatar').textContent = state.user.avatar;

  // Load data
  loadGalaxies();
  loadTabs();
  loadSandboxes();
  loadAgents();
  checkServices();

  showScreen('universe-screen');
}

// ── Galaxies ─────────────────────────────────────────────────
function loadGalaxies() {
  const stored = JSON.parse(localStorage.getItem('linkon-galaxies') || '[]');
  if (stored.length === 0) {
    state.galaxies = [
      { id: 'g1', name: 'Projects',  icon: '🚀', color: '#6e00ff', itemCount: 4, updatedAt: Date.now() - 3600000 },
      { id: 'g2', name: 'Datasets',  icon: '📊', color: '#00d4ff', itemCount: 7, updatedAt: Date.now() - 86400000 },
      { id: 'g3', name: 'Bookmarks', icon: '🔖', color: '#ff6b35', itemCount: 12, updatedAt: Date.now() - 172800000 },
      { id: 'g4', name: 'Notes',     icon: '📝', color: '#00ff88', itemCount: 3, updatedAt: Date.now() - 604800000 }
    ];
    localStorage.setItem('linkon-galaxies', JSON.stringify(state.galaxies));
  } else {
    state.galaxies = stored;
  }
  renderGalaxySidebar();
  renderGalaxyGrid();
  document.getElementById('stat-galaxies').textContent = state.galaxies.length;
}

function renderGalaxySidebar() {
  const list = document.getElementById('galaxy-list');
  list.innerHTML = state.galaxies.map(g => `
    <li class="galaxy-item ${state.currentGalaxy?.id === g.id ? 'active' : ''}"
        data-id="${g.id}" onclick="selectGalaxy('${g.id}')">
      <span>${g.icon}</span>
      <span>${g.name}</span>
      <span class="galaxy-count">${g.itemCount}</span>
    </li>
  `).join('');
}

function renderGalaxyGrid() {
  const grid = document.getElementById('galaxy-grid');
  const items = state.currentGalaxy
    ? [] // show items for selected galaxy
    : state.galaxies;

  grid.innerHTML = items.map(g => `
    <div class="galaxy-card" style="--card-color:${g.color}" onclick="selectGalaxy('${g.id}')">
      <div class="galaxy-icon">${g.icon}</div>
      <div class="galaxy-name">${g.name}</div>
      <div class="galaxy-meta">${g.itemCount} items · ${timeAgo(g.updatedAt)}</div>
    </div>
  `).join('');
}

function selectGalaxy(id) {
  state.currentGalaxy = id === state.currentGalaxy?.id
    ? null
    : state.galaxies.find(g => g.id === id);

  document.getElementById('current-galaxy-title').textContent =
    state.currentGalaxy ? state.currentGalaxy.name : 'All Galaxies';

  renderGalaxySidebar();
  renderGalaxyGrid();
}

// New galaxy modal
document.getElementById('btn-new-galaxy').addEventListener('click', () => {
  openModal('modal-galaxy');
});
document.getElementById('modal-galaxy-cancel').addEventListener('click', () => closeModal('modal-galaxy'));
document.getElementById('modal-galaxy-create').addEventListener('click', () => {
  const name = document.getElementById('galaxy-name-input').value.trim();
  const icon = document.getElementById('galaxy-icon-val').value;
  if (!name) return;
  const colors = ['#6e00ff','#00d4ff','#ff6b35','#00ff88','#ff00aa','#ffcc00'];
  const newG = {
    id: `g-${Date.now()}`, name, icon,
    color: colors[Math.floor(Math.random() * colors.length)],
    itemCount: 0, updatedAt: Date.now()
  };
  state.galaxies.push(newG);
  localStorage.setItem('linkon-galaxies', JSON.stringify(state.galaxies));
  renderGalaxySidebar(); renderGalaxyGrid();
  document.getElementById('stat-galaxies').textContent = state.galaxies.length;
  document.getElementById('galaxy-name-input').value = '';
  closeModal('modal-galaxy');
});

document.querySelectorAll('.emoji-picker span').forEach(s => {
  s.addEventListener('click', () => {
    document.querySelectorAll('.emoji-picker span').forEach(x => x.classList.remove('selected'));
    s.classList.add('selected');
    document.getElementById('galaxy-icon-val').value = s.dataset.icon;
  });
});

// Drop zone
const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
  if (text) addImmediateItem(text);
});

function addImmediateItem(content) {
  const item = { id: Date.now(), content, type: content.startsWith('http') ? '🔗' : '📝' };
  state.immediateItems.push(item);
  const container = document.getElementById('immediate-items');
  const chip = document.createElement('div');
  chip.className = 'item-chip';
  chip.innerHTML = `<span>${item.type}</span><span>${content.slice(0, 40)}${content.length > 40 ? '…' : ''}</span>`;
  container.appendChild(chip);
  document.getElementById('stat-items').textContent =
    state.immediateItems.length + state.galaxies.reduce((a, g) => a + g.itemCount, 0);
}

// ── Tab Manager ──────────────────────────────────────────────
function loadTabs() {
  // Simulated tabs (real implementation uses browser.tabs API in extension context)
  state.tabs = [
    { id: 1, title: 'GitHub — onyxlneo', url: 'https://github.com', status: 'active',   memoryMB: 87,  favicon: '🐙' },
    { id: 2, title: 'Hugging Face Spaces', url: 'https://huggingface.co', status: 'haw', memoryMB: 4,  favicon: '🤗' },
    { id: 3, title: 'Kaggle Notebook',    url: 'https://kaggle.com',     status: 'frozen', memoryMB: 2, favicon: '📊' },
    { id: 4, title: 'MDN Web Docs',       url: 'https://developer.mozilla.org', status: 'active', memoryMB: 54, favicon: '📖' },
    { id: 5, title: 'Stack Overflow',     url: 'https://stackoverflow.com',     status: 'frozen', memoryMB: 2, favicon: '❓' }
  ];
  renderTabs();
  updateTabBadge();
}

function renderTabs() {
  const list = document.getElementById('tab-list');
  list.innerHTML = state.tabs.map(t => `
    <div class="tab-row">
      <span class="tab-favicon">${t.favicon}</span>
      <span class="tab-title" title="${t.url}">${t.title}</span>
      <div class="tab-status-dot status-${t.status}"></div>
      <button class="tab-action" onclick="toggleTabStatus(${t.id})">
        ${t.status === 'frozen' ? '▶ Thaw' : t.status === 'haw' ? '❄ Freeze' : '❄ Freeze'}
      </button>
    </div>
  `).join('');

  const frozen = state.tabs.filter(t => t.status === 'frozen').length;
  const haw    = state.tabs.filter(t => t.status === 'haw').length;
  const savedMB = state.tabs.filter(t => t.status === 'frozen').reduce((a, t) => a + 50 - t.memoryMB, 0);
  document.getElementById('frozen-count').textContent = frozen;
  document.getElementById('haw-count').textContent = haw;
  document.getElementById('saved-mb').textContent = savedMB;
  document.getElementById('stat-frozen').textContent = frozen;
  document.getElementById('stat-haw').textContent = haw;
}

function toggleTabStatus(id) {
  const tab = state.tabs.find(t => t.id === id);
  if (!tab) return;
  if (tab.status === 'frozen') { tab.status = 'active'; tab.memoryMB = 55; }
  else { tab.status = 'frozen'; tab.memoryMB = 2; }
  renderTabs();
}

function updateTabBadge() {
  document.getElementById('tabs-count').textContent = state.tabs.length;
}

// ── S Gallery™ ───────────────────────────────────────────────
function loadSandboxes() {
  state.sandboxes = [
    { id: 'sb1', name: 'Python 3.11', icon: '🐍', runtime: 'python', status: 'idle', cpuPercent: 0, memoryMB: 0 },
    { id: 'sb2', name: 'Node.js 20',  icon: '🟢', runtime: 'node',   status: 'idle', cpuPercent: 0, memoryMB: 0 },
    { id: 'sb3', name: 'Rust',        icon: '🦀', runtime: 'rust',   status: 'idle', cpuPercent: 0, memoryMB: 0 },
    { id: 'sb4', name: 'Ubuntu',      icon: '🐧', runtime: 'linux',  status: 'idle', cpuPercent: 0, memoryMB: 0 },
    { id: 'sb5', name: 'Jupyter Lab', icon: '📓', runtime: 'jupyter',status: 'idle', cpuPercent: 0, memoryMB: 0 },
    { id: 'sb6', name: 'Go 1.22',     icon: '🐹', runtime: 'golang', status: 'idle', cpuPercent: 0, memoryMB: 0 }
  ];
  renderRuntimes();
  renderSandboxes();
}

function renderRuntimes() {
  const grid = document.getElementById('runtime-grid');
  grid.innerHTML = state.sandboxes.map(s => `
    <div class="runtime-card" onclick="launchSandbox('${s.id}')">
      <div class="r-icon">${s.icon}</div>
      <div class="r-name">${s.name}</div>
    </div>
  `).join('');
}

function renderSandboxes() {
  const running = state.sandboxes.filter(s => s.status === 'running');
  const list = document.getElementById('sandbox-list');
  if (running.length === 0) {
    list.innerHTML = '<div style="font-size:0.8rem;color:var(--text-dim);text-align:center;padding:1rem">No running sandboxes</div>';
    return;
  }
  list.innerHTML = running.map(s => `
    <div class="sandbox-row">
      <span style="font-size:1.25rem">${s.icon}</span>
      <div class="sandbox-info">
        <div class="sandbox-name">${s.name}</div>
        <div class="sandbox-meta">CPU: ${s.cpuPercent.toFixed(1)}% · RAM: ${s.memoryMB}MB</div>
        <div class="resource-bar"><div class="resource-fill" style="width:${s.cpuPercent}%"></div></div>
      </div>
      <button class="tab-action" onclick="stopSandbox('${s.id}')">■ Stop</button>
    </div>
  `).join('');
}

function launchSandbox(id) {
  const sb = state.sandboxes.find(s => s.id === id);
  if (!sb) return;
  sb.status = 'running';
  sb.cpuPercent = Math.random() * 20 + 5;
  sb.memoryMB = Math.floor(Math.random() * 200 + 80);
  renderRuntimes(); renderSandboxes();
}

function stopSandbox(id) {
  const sb = state.sandboxes.find(s => s.id === id);
  if (sb) { sb.status = 'idle'; sb.cpuPercent = 0; sb.memoryMB = 0; }
  renderSandboxes();
}

// ── Agents ───────────────────────────────────────────────────
function loadAgents() {
  state.agents = [];
  renderAgents();
}

function renderAgents() {
  const list = document.getElementById('agent-list');
  if (state.agents.length === 0) {
    list.innerHTML = '<div style="font-size:0.8rem;color:var(--text-dim);text-align:center;padding:1rem">No active agents. Launch one above.</div>';
  } else {
    list.innerHTML = state.agents.map(a => `
      <div class="agent-row">
        <span style="font-size:1.25rem">🤖</span>
        <div class="agent-info">
          <div class="agent-name">${a.name}</div>
          <div class="agent-task">${a.task || 'Idle'}</div>
        </div>
        <span class="agent-status-badge status-${a.status}">${a.status.toUpperCase()}</span>
      </div>
    `).join('');
  }
  document.getElementById('agents-count').textContent = state.agents.length;
}

document.getElementById('btn-launch-agent').addEventListener('click', () => {
  const types = ['CodeAgent','BrowseAgent','GitAgent','DataAgent'];
  const type = types[Math.floor(Math.random() * types.length)];
  const agent = {
    id: `agent-${Date.now()}`,
    name: `${type}-${state.agents.length + 1}`,
    type, status: 'running',
    task: 'Awaiting instructions…',
    startedAt: Date.now()
  };
  state.agents.push(agent);
  renderAgents();
});

// ── AI Copilot ───────────────────────────────────────────────
const responses = [
  "I've analyzed your code. The issue is likely a null reference on line 12 — add an optional chaining check: `obj?.property`.",
  "Here's a unit test for that function:\n```js\ntest('should return correct value', () => {\n  expect(fn(input)).toBe(expected);\n});\n```",
  "This code iterates O(n²) — you can optimize to O(n) using a hash map for lookups.",
  "The regex pattern `^[a-z0-9_-]{3,16}$` will validate that username field.",
  "I'd suggest breaking this into smaller functions — the single responsibility principle will make it much easier to test.",
  "Your Docker compose file looks correct. Make sure `depends_on` is set so the DB starts before the app container.",
  "For Rust: use `Result<T, E>` instead of unwrap() to handle errors gracefully without panicking.",
  "Running locally — no data leaves your machine. Ask me anything."
];

document.getElementById('copilot-toggle').addEventListener('click', () => {
  document.getElementById('ai-copilot').classList.toggle('collapsed');
});

function sendCopilotMessage(msg) {
  if (!msg.trim()) return;
  const messagesEl = document.getElementById('copilot-messages');

  const userEl = document.createElement('div');
  userEl.className = 'msg-user'; userEl.textContent = msg;
  messagesEl.appendChild(userEl);

  const aiEl = document.createElement('div');
  aiEl.className = 'msg-ai'; aiEl.textContent = '…';
  messagesEl.appendChild(aiEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  document.getElementById('ai-copilot').classList.remove('collapsed');

  setTimeout(() => {
    aiEl.textContent = responses[Math.floor(Math.random() * responses.length)];
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }, 800);

  document.getElementById('copilot-input').value = '';
}

document.getElementById('copilot-send').addEventListener('click', () =>
  sendCopilotMessage(document.getElementById('copilot-input').value));
document.getElementById('copilot-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendCopilotMessage(e.target.value);
});
document.querySelectorAll('.quick-btn').forEach(btn =>
  btn.addEventListener('click', () => sendCopilotMessage(btn.dataset.prompt))
);

// ── Panel System ─────────────────────────────────────────────
function openPanel(id) {
  closeAllPanels();
  document.getElementById(`panel-${id}`)?.classList.add('open');
  document.getElementById('backdrop').classList.add('visible');
}
function closeAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  document.getElementById('backdrop').classList.remove('visible');
}
document.querySelectorAll('.panel-close').forEach(btn =>
  btn.addEventListener('click', () => closeAllPanels()));
document.getElementById('backdrop').addEventListener('click', closeAllPanels);

document.getElementById('btn-tabs').addEventListener('click', () => openPanel('tabs'));
document.getElementById('btn-sgallery').addEventListener('click', () => openPanel('sgallery'));
document.getElementById('btn-agents').addEventListener('click', () => openPanel('agents'));
document.getElementById('btn-drop-item').addEventListener('click', () => {
  const url = prompt('Enter URL or text to drop into your Universe:');
  if (url) addImmediateItem(url);
});

// ── Modals ───────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.getElementById('backdrop').classList.add('visible');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.getElementById('backdrop').classList.remove('visible');
}

// ── Search (Stract) ──────────────────────────────────────────
document.getElementById('search-input').addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const q = e.target.value.trim();
  if (!q) return;
  // Try local Stract, fallback to Brave
  const stractUrl = `http://localhost:3000/search?q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(`http://localhost:3000/health`, { signal: AbortSignal.timeout(800) });
    if (res.ok) { window.open(stractUrl, '_blank'); return; }
  } catch {}
  window.open(`https://search.brave.com/search?q=${encodeURIComponent(q)}`, '_blank');
});

// ── Service Status Checks ────────────────────────────────────
async function checkServices() {
  // Stract
  try {
    await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(1000) });
    document.getElementById('stract-status').textContent = 'Online';
    document.getElementById('stract-status').style.color = 'var(--green)';
  } catch {
    document.getElementById('stract-status').textContent = 'Offline (Brave fallback)';
    document.getElementById('stract-status').style.color = 'var(--orange)';
  }
  // OpenHands
  try {
    await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(1000) });
    document.getElementById('openhands-status').textContent = 'Online';
    document.getElementById('openhands-status').style.color = 'var(--green)';
  } catch {
    document.getElementById('openhands-status').textContent = 'Offline';
    document.getElementById('openhands-status').style.color = 'var(--text-dim)';
  }
}

// ── Utils ────────────────────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}

// Make functions available globally
window.selectGalaxy = selectGalaxy;
window.toggleTabStatus = toggleTabStatus;
window.launchSandbox = launchSandbox;
window.stopSandbox = stopSandbox;

// ── Boot ─────────────────────────────────────────────────────
boot();
