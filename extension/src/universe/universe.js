/**
 * Linkon Universe — Dashboard JS
 * Free & Open-Source. No charges. No paywalls. Ever.
 * TeraBites™ | MPL 2.0
 */

// ── Constants ─────────────────────────────────────────────────
const LINKON_VERSION = "1.0.0";
const LINKON_LICENSE = "MPL 2.0 — Free & Open-Source";

// ── State ─────────────────────────────────────────────────────
let currentUser = null;
let galaxies = [];
let activeGalaxy = null;
let sandboxes = [];
let tabs = [];
let agents = [];

// ── Boot sequence ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  showLoginScreen();
  bindLoginForm();
  renderFOSSBadge();
});

// ── FOSS Badge — always visible ────────────────────────────────
function renderFOSSBadge() {
  const badge = document.createElement("div");
  badge.id = "foss-badge";
  badge.innerHTML = `
    <span class="foss-icon">⬡</span>
    <span>Free &amp; Open-Source · MPL 2.0 · No charges, ever</span>
    <a href="https://github.com/OnyxNeol/linkon-browser" target="_blank">GitHub</a>
  `;
  document.body.appendChild(badge);
}

// ── Particle starfield ─────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById("cosmos-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.8 + 0.2,
    alpha: Math.random(),
    speed: Math.random() * 0.004 + 0.001,
    color: ["#ffffff", "#00d4ff", "#6e00ff", "#ff6b35"][Math.floor(Math.random() * 4)],
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0) s.speed *= -1;
      ctx.globalAlpha = Math.abs(Math.sin(s.alpha));
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

// ── Login ──────────────────────────────────────────────────────
function showLoginScreen() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("universe-dashboard").style.display = "none";
}

function bindLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (!username) return;

    await runLoginSequence(username, password);
  });
}

async function runLoginSequence(username, password) {
  const loginBtn = document.getElementById("login-btn");
  const statusEl = document.getElementById("login-status");

  loginBtn.disabled = true;
  loginBtn.textContent = "Entering universe…";

  const steps = [
    { msg: `Authenticating via Linkon Pass…`, delay: 600 },
    { msg: `Initializing ${username}-Linkon-Universe…`, delay: 800 },
    { msg: `Connecting to Hugging Face org…`, delay: 700 },
    { msg: `Loading galaxies…`, delay: 600 },
    { msg: `Syncing S Gallery™ sandboxes…`, delay: 500 },
    { msg: `Activating Linkon Agents…`, delay: 400 },
    { msg: `Universe ready ✦`, delay: 300 },
  ];

  for (const step of steps) {
    statusEl.textContent = step.msg;
    statusEl.style.opacity = "1";
    await sleep(step.delay);
    statusEl.style.opacity = "0.5";
  }

  currentUser = {
    username,
    universeName: `${username}-Linkon-Universe`,
    workspaceName: "My Workspace",
    hfOrg: `${username}-Linkon-Universe`,
    joinedAt: new Date().toISOString(),
  };

  initDefaultData();
  enterDashboard();
}

// ── Default demo data ─────────────────────────────────────────
function initDefaultData() {
  galaxies = [
    { id: "g1", name: "Projects", icon: "🚀", color: "#6e00ff", items: 12, updated: "2 hours ago" },
    { id: "g2", name: "Datasets", icon: "📊", color: "#00d4ff", items: 7, updated: "1 day ago" },
    { id: "g3", name: "Bookmarks", icon: "⭐", color: "#ff6b35", items: 34, updated: "3 hours ago" },
    { id: "g4", name: "Notes", icon: "📝", color: "#00ff88", items: 5, updated: "Just now" },
    { id: "g5", name: "Models", icon: "🧠", color: "#ff00aa", items: 3, updated: "5 days ago" },
  ];

  sandboxes = [
    { id: "s1", name: "Python 3.11", icon: "🐍", runtime: "python:3.11", status: "idle",    cpu: 0,  mem: 0   },
    { id: "s2", name: "Node 20",    icon: "🟩", runtime: "node:20",      status: "running", cpu: 12, mem: 180 },
    { id: "s3", name: "Ubuntu LTS", icon: "🐧", runtime: "ubuntu:22.04", status: "idle",    cpu: 0,  mem: 0   },
    { id: "s4", name: "Rust",       icon: "🦀", runtime: "rust:latest",  status: "idle",    cpu: 0,  mem: 0   },
    { id: "s5", name: "Custom",     icon: "⚙️", runtime: "custom",       status: "idle",    cpu: 0,  mem: 0   },
  ];

  tabs = [
    { id: "t1", title: "GitHub — OnyxNeol/linkon-browser", url: "https://github.com", status: "active", mem: 210, domain: "github.com" },
    { id: "t2", title: "Hugging Face — Models",            url: "https://huggingface.co", status: "frozen", mem: 8, domain: "huggingface.co" },
    { id: "t3", title: "Kaggle — Competitions",            url: "https://kaggle.com", status: "haw",    mem: 22, domain: "kaggle.com" },
    { id: "t4", title: "MDN Web Docs",                     url: "https://developer.mozilla.org", status: "active", mem: 95, domain: "mdn.io" },
    { id: "t5", title: "Stack Overflow — Q&A",             url: "https://stackoverflow.com", status: "frozen", mem: 5,  domain: "stackoverflow.com" },
  ];

  agents = [
    { id: "a1", name: "Code Reviewer",  status: "idle",    task: "Waiting for diff…" },
    { id: "a2", name: "Dataset Syncer", status: "running", task: "Syncing HF datasets…" },
    { id: "a3", name: "PR Watcher",     status: "idle",    task: "Monitoring OnyxNeol/linkon-browser" },
  ];
}

// ── Dashboard ─────────────────────────────────────────────────
function enterDashboard() {
  document.getElementById("login-screen").style.display = "none";
  const dash = document.getElementById("universe-dashboard");
  dash.style.display = "grid";
  dash.style.opacity = "0";
  dash.style.transition = "opacity 0.6s ease";
  setTimeout(() => { dash.style.opacity = "1"; }, 50);

  renderDashboard();
}

function renderDashboard() {
  renderTopNav();
  renderSidebar();
  renderGalaxyGrid();
  renderDropZone();
  renderStatsBar();
  renderSGalleryPanel();
  renderTabsPanel();
  renderAIPanel();
  renderAgentsPanel();
  bindPanelToggles();
}

// ── Top Nav ────────────────────────────────────────────────────
function renderTopNav() {
  const nav = document.getElementById("top-nav");
  if (!nav) return;
  nav.innerHTML = `
    <div class="nav-logo">
      <img src="https://base44.app/api/apps/6a22ad5e307574a9f51fd903/files/mp/public/6a22ad5e307574a9f51fd903/c75f9f987_linkon-logo.png"
           alt="Linkon" class="nav-logo-img" />
      <span class="logo-text">Linkon</span>
      <span class="logo-version">${LINKON_VERSION}</span>
    </div>
    <div class="nav-universe-name">${currentUser.universeName}</div>
    <div class="nav-actions">
      <button class="nav-btn" id="btn-tabs" title="Infinite Tabs">❄️ Tabs</button>
      <button class="nav-btn" id="btn-sgallery" title="S Gallery">⚗️ S Gallery™</button>
      <button class="nav-btn" id="btn-agents" title="Linkon Agents">🤖 Agents</button>
      <div class="nav-avatar" title="${currentUser.username}">${currentUser.username[0].toUpperCase()}</div>
    </div>
  `;
}

// ── Sidebar ────────────────────────────────────────────────────
function renderSidebar() {
  const sb = document.getElementById("sidebar");
  if (!sb) return;

  const wsNameEl = `
    <div class="workspace-header">
      <span class="workspace-label">Workspace</span>
      <span class="workspace-name" id="workspace-name" contenteditable="true"
        title="Click to rename">${currentUser.workspaceName}</span>
    </div>
  `;

  const galaxyList = galaxies.map(g => `
    <div class="galaxy-sidebar-item" data-id="${g.id}" onclick="openGalaxy('${g.id}')">
      <span class="galaxy-sb-icon">${g.icon}</span>
      <span class="galaxy-sb-name">${g.name}</span>
      <span class="galaxy-sb-count">${g.items}</span>
    </div>
  `).join("");

  sb.innerHTML = `
    ${wsNameEl}
    <div class="sidebar-section-title">Galaxies</div>
    <div class="galaxy-sidebar-list">${galaxyList}</div>
    <button class="btn-new-galaxy" onclick="createGalaxy()">+ New Galaxy</button>
    <div class="sidebar-footer">
      <span class="foss-label">Free &amp; Open-Source</span>
      <span class="foss-license">MPL 2.0</span>
    </div>
  `;

  // Workspace rename
  const wsName = document.getElementById("workspace-name");
  if (wsName) {
    wsName.addEventListener("blur", () => {
      currentUser.workspaceName = wsName.textContent.trim() || "My Workspace";
    });
  }
}

// ── Galaxy Grid ────────────────────────────────────────────────
function renderGalaxyGrid() {
  const grid = document.getElementById("galaxy-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="section-title">
      <span>✦ Your Galaxies</span>
      <button class="btn-sm" onclick="createGalaxy()">+ New Galaxy</button>
    </div>
    <div class="galaxy-cards">
      ${galaxies.map(g => renderGalaxyCard(g)).join("")}
    </div>
  `;
}

function renderGalaxyCard(g) {
  return `
    <div class="galaxy-card" data-id="${g.id}" onclick="openGalaxy('${g.id}')"
         style="--galaxy-color: ${g.color}">
      <div class="galaxy-card-orb" style="background: ${g.color}22; border-color: ${g.color}">
        <span class="galaxy-card-icon">${g.icon}</span>
      </div>
      <div class="galaxy-card-name">${g.name}</div>
      <div class="galaxy-card-meta">
        <span>${g.items} items</span>
        <span>${g.updated}</span>
      </div>
      <div class="galaxy-card-glow" style="background: radial-gradient(circle, ${g.color}33, transparent 70%)"></div>
    </div>
  `;
}

function openGalaxy(id) {
  const g = galaxies.find(g => g.id === id);
  if (!g) return;
  activeGalaxy = g;
  showModal(`
    <div class="modal-galaxy-header" style="border-color:${g.color}">
      <span style="font-size:2rem">${g.icon}</span>
      <div>
        <div class="modal-title">${g.name}</div>
        <div class="modal-sub">${g.items} items · ${g.updated}</div>
      </div>
    </div>
    <div class="modal-galaxy-items">
      ${Array.from({length: Math.min(g.items, 6)}, (_, i) => `
        <div class="galaxy-item-row">
          <span class="galaxy-item-icon">${["📁","📄","🔗","📊","🧠","⚗️"][i % 6]}</span>
          <span class="galaxy-item-name">${g.name} item ${i + 1}</span>
          <span class="galaxy-item-type">${["repo","dataset","bookmark","note","model","sandbox"][i % 6]}</span>
        </div>
      `).join("")}
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="closeModal()">Close</button>
      <button class="btn-ghost" onclick="addItemToGalaxy('${g.id}')">+ Add Item</button>
    </div>
  `);
}

function createGalaxy() {
  showModal(`
    <div class="modal-title">New Galaxy</div>
    <div class="modal-sub">A galaxy is a folder in your Universe</div>
    <input class="modal-input" id="new-galaxy-name" placeholder="Galaxy name…" />
    <div class="emoji-picker">
      ${["🚀","📊","⭐","📝","🧠","🔬","🎮","🌍","🔧","📦"].map(e =>
        `<span class="emoji-opt" onclick="selectEmoji('${e}')">${e}</span>`
      ).join("")}
    </div>
    <input type="hidden" id="new-galaxy-emoji" value="🚀" />
    <div class="modal-actions">
      <button class="btn-primary" onclick="submitNewGalaxy()">Create Galaxy</button>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function selectEmoji(e) {
  document.getElementById("new-galaxy-emoji").value = e;
  document.querySelectorAll(".emoji-opt").forEach(el => el.classList.remove("selected"));
  event.target.classList.add("selected");
}

function submitNewGalaxy() {
  const name  = document.getElementById("new-galaxy-name").value.trim();
  const emoji = document.getElementById("new-galaxy-emoji").value;
  if (!name) return;
  const colors = ["#6e00ff","#00d4ff","#ff6b35","#00ff88","#ff00aa","#ffcc00"];
  galaxies.push({
    id: "g" + Date.now(),
    name,
    icon: emoji,
    color: colors[galaxies.length % colors.length],
    items: 0,
    updated: "Just now",
  });
  closeModal();
  renderGalaxyGrid();
  renderSidebar();
  renderStatsBar();
}

function addItemToGalaxy(galaxyId) {
  const g = galaxies.find(x => x.id === galaxyId);
  if (g) { g.items++; g.updated = "Just now"; }
  closeModal();
  renderGalaxyGrid();
  renderStatsBar();
}

// ── Quick Drop Zone ────────────────────────────────────────────
function renderDropZone() {
  const dz = document.getElementById("drop-zone");
  if (!dz) return;
  dz.innerHTML = `
    <div class="dropzone-title">⚡ Quick Drop</div>
    <div class="dropzone-sub">Drop items here — store instantly, organize later</div>
    <div class="dropzone-area" id="drop-area"
         ondragover="event.preventDefault()" ondrop="handleDrop(event)">
      <span class="dropzone-icon">⬇</span>
      <span>Drag files, URLs, or repos here</span>
    </div>
    <div class="dropzone-actions">
      <button class="btn-ghost btn-sm" onclick="pasteURL()">Paste URL</button>
      <button class="btn-ghost btn-sm" onclick="addFromHF()">From Hugging Face</button>
      <button class="btn-ghost btn-sm" onclick="addFromGitHub()">From GitHub</button>
    </div>
    <div class="dropzone-recent" id="drop-recent"></div>
  `;
}

function handleDrop(e) {
  e.preventDefault();
  const files = [...e.dataTransfer.files];
  const urls  = e.dataTransfer.getData("text/uri-list");
  const text  = e.dataTransfer.getData("text/plain");
  const label = files.length ? files.map(f => f.name).join(", ") : (urls || text || "Item");
  addDroppedItem(label, files.length ? "file" : "url");
}

function addDroppedItem(label, type) {
  const recent = document.getElementById("drop-recent");
  if (!recent) return;
  const item = document.createElement("div");
  item.className = "dropped-item";
  item.innerHTML = `
    <span>${type === "file" ? "📄" : "🔗"}</span>
    <span>${label}</span>
    <span class="dropped-ts">Just now</span>
  `;
  recent.prepend(item);
  if (recent.children.length > 5) recent.lastChild.remove();
}

function pasteURL() {
  const url = prompt("Paste a URL to store in your Universe:");
  if (url) addDroppedItem(url, "url");
}

function addFromHF()     { addDroppedItem("Hugging Face resource", "hf");     }
function addFromGitHub() { addDroppedItem("GitHub repository",     "github"); }

// ── Stats Bar ─────────────────────────────────────────────────
function renderStatsBar() {
  const bar = document.getElementById("stats-bar");
  if (!bar) return;
  const totalItems = galaxies.reduce((s, g) => s + g.items, 0);
  bar.innerHTML = `
    <span class="stat-item">🌌 ${currentUser.universeName}</span>
    <span class="stat-sep">·</span>
    <span class="stat-item">${galaxies.length} Galaxies</span>
    <span class="stat-sep">·</span>
    <span class="stat-item">${totalItems} Items</span>
    <span class="stat-sep">·</span>
    <span class="stat-item">${sandboxes.filter(s => s.status === "running").length} Sandboxes Running</span>
    <span class="stat-sep">·</span>
    <span class="stat-item foss-stat">⬡ Free &amp; Open-Source</span>
  `;
}

// ── S Gallery™ Panel ──────────────────────────────────────────
function renderSGalleryPanel() {
  const panel = document.getElementById("sgallery-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="panel-header">
      <span>⚗️ S Gallery™</span>
      <span class="tb-badge">TB™</span>
      <button class="panel-close" onclick="togglePanel('sgallery-panel')">✕</button>
    </div>
    <div class="panel-note foss-note">Free. No limits. Powered by local Docker.</div>
    <div class="sandbox-list">
      ${sandboxes.map(s => renderSandboxCard(s)).join("")}
    </div>
    <button class="btn-primary btn-full" onclick="newSandbox()">+ New Sandbox</button>
    <div class="panel-section-title">Active Agents</div>
    <div class="agent-list">
      ${agents.map(a => `
        <div class="agent-row">
          <span class="agent-status ${a.status}">${a.status === "running" ? "●" : "○"}</span>
          <span class="agent-name">${a.name}</span>
          <span class="agent-task">${a.task}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSandboxCard(s) {
  const isRunning = s.status === "running";
  return `
    <div class="sandbox-card ${isRunning ? "sandbox-running" : ""}">
      <div class="sandbox-icon">${s.icon}</div>
      <div class="sandbox-info">
        <div class="sandbox-name">${s.name}</div>
        <div class="sandbox-runtime">${s.runtime}</div>
        ${isRunning ? `<div class="sandbox-usage">CPU ${s.cpu}% · RAM ${s.mem}MB</div>` : ""}
      </div>
      <button class="sandbox-btn ${isRunning ? "btn-stop" : "btn-launch"}"
        onclick="toggleSandbox('${s.id}')">
        ${isRunning ? "Stop" : "Launch"}
      </button>
    </div>
  `;
}

function toggleSandbox(id) {
  const s = sandboxes.find(x => x.id === id);
  if (!s) return;
  if (s.status === "running") {
    s.status = "idle"; s.cpu = 0; s.mem = 0;
  } else {
    s.status = "running";
    s.cpu = Math.floor(Math.random() * 30) + 5;
    s.mem = Math.floor(Math.random() * 400) + 80;
  }
  renderSGalleryPanel();
  renderStatsBar();
}

function newSandbox() {
  showModal(`
    <div class="modal-title">New Sandbox</div>
    <div class="modal-sub foss-note">Free. Runs locally via Docker.</div>
    <select class="modal-input" id="runtime-select">
      <option value="python:3.11">Python 3.11</option>
      <option value="node:20">Node 20</option>
      <option value="ubuntu:22.04">Ubuntu 22.04</option>
      <option value="rust:latest">Rust (latest)</option>
      <option value="golang:latest">Go (latest)</option>
      <option value="ruby:3.2">Ruby 3.2</option>
      <option value="custom">Custom image…</option>
    </select>
    <input class="modal-input" id="sandbox-name-input" placeholder="Sandbox name (optional)" />
    <div class="modal-actions">
      <button class="btn-primary" onclick="launchNewSandbox()">Launch Sandbox</button>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function launchNewSandbox() {
  const rt   = document.getElementById("runtime-select").value;
  const name = document.getElementById("sandbox-name-input").value.trim() || rt.split(":")[0];
  const icons = { python:"🐍", node:"🟩", ubuntu:"🐧", rust:"🦀", golang:"🐹", ruby:"💎", custom:"⚙️" };
  const icon = icons[rt.split(":")[0]] || "⚙️";
  sandboxes.push({
    id: "s" + Date.now(), name, icon, runtime: rt,
    status: "running",
    cpu: Math.floor(Math.random() * 20) + 2,
    mem: Math.floor(Math.random() * 200) + 50,
  });
  closeModal();
  renderSGalleryPanel();
  renderStatsBar();
}

// ── Infinite Tabs Panel ───────────────────────────────────────
function renderTabsPanel() {
  const panel = document.getElementById("tabs-panel");
  if (!panel) return;
  const frozen  = tabs.filter(t => t.status === "frozen");
  const haw     = tabs.filter(t => t.status === "haw");
  const active  = tabs.filter(t => t.status === "active");
  const savedMB = frozen.reduce((s, t) => s + t.mem, 0) + haw.reduce((s, t) => s + (t.mem * 0.5), 0);

  panel.innerHTML = `
    <div class="panel-header">
      <span>❄️ Infinite Tabs</span>
      <button class="panel-close" onclick="togglePanel('tabs-panel')">✕</button>
    </div>
    <div class="tabs-stats">
      <span>🟢 Active: ${active.length}</span>
      <span>❄️ Frozen: ${frozen.length}</span>
      <span>👁 HAW: ${haw.length}</span>
      <span>💾 Saved: ~${Math.round(savedMB)}MB</span>
    </div>
    <div class="tab-list">
      ${tabs.map(t => renderTabRow(t)).join("")}
    </div>
    <button class="btn-ghost btn-sm" onclick="addDemoTab()">+ Simulate New Tab</button>
  `;
}

function renderTabRow(t) {
  const statusIcon = { active:"🟢", frozen:"❄️", haw:"👁" }[t.status] || "⚪";
  const statusLabel = { active:"Active", frozen:"Frozen", haw:"HAW" }[t.status];
  return `
    <div class="tab-row">
      <span class="tab-status-icon">${statusIcon}</span>
      <div class="tab-info">
        <div class="tab-title" title="${t.url}">${t.title}</div>
        <div class="tab-meta">${t.domain} · ${t.mem}MB · ${statusLabel}</div>
      </div>
      <div class="tab-actions">
        <button class="tab-btn" onclick="cycleTabState('${t.id}')" title="Toggle state">
          ${t.status === "active" ? "Freeze" : t.status === "frozen" ? "HAW" : "Activate"}
        </button>
      </div>
    </div>
  `;
}

function cycleTabState(id) {
  const t = tabs.find(x => x.id === id);
  if (!t) return;
  if      (t.status === "active") { t.status = "frozen"; t.mem = Math.max(4, Math.round(t.mem * 0.04)); }
  else if (t.status === "frozen") { t.status = "haw";    t.mem = Math.max(8, Math.round(t.mem * 2.5));  }
  else                            { t.status = "active"; t.mem = Math.round(t.mem * 10);                }
  renderTabsPanel();
}

function addDemoTab() {
  tabs.push({
    id: "t" + Date.now(),
    title: "New Tab — " + new Date().toLocaleTimeString(),
    url: "about:blank", status: "active",
    mem: Math.floor(Math.random() * 200) + 50,
    domain: "new tab",
  });
  renderTabsPanel();
}

// ── Offline AI Copilot ─────────────────────────────────────────
const AI_RESPONSES = {
  debug:   "I found a potential issue on line 42. The variable `result` may be undefined if the async call resolves to `null`. Add a null check: `if (!result) return;`",
  explain: "This function uses a closure to capture `config` from the outer scope. Each call to `createHandler()` returns a new function that remembers the `config` at the time it was created — that's the classic closure pattern.",
  test:    "Here's a Jest test for this function:\n\n```js\ntest('returns correct value', () => {\n  const result = myFunction('input');\n  expect(result).toBe('expected');\n});\n```",
  default: "I'm your Linkon AI Copilot — running locally, no cloud needed. Ask me about code, debugging, architecture, or anything dev-related.",
};

function renderAIPanel() {
  const panel = document.getElementById("ai-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="panel-header">
      <span>🧠 AI Copilot</span>
      <span class="offline-badge">● Offline</span>
      <button class="panel-close" onclick="togglePanel('ai-panel')">✕</button>
    </div>
    <div class="ai-foss-note">Runs locally · Powered by Ollama + CodeLlama · No cloud · Free</div>
    <div class="ai-chat" id="ai-chat">
      <div class="ai-msg ai-msg-bot">
        <span class="ai-avatar">🧠</span>
        <span>${AI_RESPONSES.default}</span>
      </div>
    </div>
    <div class="ai-quick-actions">
      <button class="ai-quick-btn" onclick="aiQuickAction('debug')">🔍 Debug this</button>
      <button class="ai-quick-btn" onclick="aiQuickAction('explain')">💡 Explain code</button>
      <button class="ai-quick-btn" onclick="aiQuickAction('test')">🧪 Write test</button>
    </div>
    <div class="ai-input-row">
      <input class="ai-input" id="ai-input" placeholder="Ask anything…" onkeydown="if(event.key==='Enter')sendAIMessage()" />
      <button class="ai-send-btn" onclick="sendAIMessage()">↑</button>
    </div>
  `;
}

function sendAIMessage() {
  const input = document.getElementById("ai-input");
  const chat  = document.getElementById("ai-chat");
  const msg   = input.value.trim();
  if (!msg) return;

  const userBubble = document.createElement("div");
  userBubble.className = "ai-msg ai-msg-user";
  userBubble.innerHTML = `<span>${msg}</span>`;
  chat.appendChild(userBubble);
  input.value = "";

  const typing = document.createElement("div");
  typing.className = "ai-msg ai-msg-bot";
  typing.innerHTML = `<span class="ai-avatar">🧠</span><span class="ai-typing">thinking…</span>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  setTimeout(() => {
    const lower = msg.toLowerCase();
    const key = lower.includes("debug") ? "debug"
              : lower.includes("explain") || lower.includes("what") ? "explain"
              : lower.includes("test") ? "test"
              : "default";
    typing.innerHTML = `<span class="ai-avatar">🧠</span><pre class="ai-pre">${AI_RESPONSES[key]}</pre>`;
    chat.scrollTop = chat.scrollHeight;
  }, 900);
}

function aiQuickAction(type) {
  const chat = document.getElementById("ai-chat");
  const typing = document.createElement("div");
  typing.className = "ai-msg ai-msg-bot";
  typing.innerHTML = `<span class="ai-avatar">🧠</span><span class="ai-typing">thinking…</span>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => {
    typing.innerHTML = `<span class="ai-avatar">🧠</span><pre class="ai-pre">${AI_RESPONSES[type]}</pre>`;
    chat.scrollTop = chat.scrollHeight;
  }, 700);
}

// ── Agents Panel ──────────────────────────────────────────────
function renderAgentsPanel() {
  const panel = document.getElementById("agents-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="panel-header">
      <span>🤖 Linkon Agents</span>
      <button class="panel-close" onclick="togglePanel('agents-panel')">✕</button>
    </div>
    <div class="panel-note foss-note">All agents are free. Powered by OpenHands (open-source).</div>
    <div class="integrations-grid">
      <div class="integration-card" style="--int-color:#333">
        <div class="int-icon">🐙</div>
        <div class="int-name">GitHub</div>
        <div class="int-detail">3 repos · 2 open PRs</div>
        <button class="btn-sm btn-ghost" onclick="openIntegration('github')">Open</button>
      </div>
      <div class="integration-card" style="--int-color:#ff9f1c">
        <div class="int-icon">🤗</div>
        <div class="int-name">Hugging Face</div>
        <div class="int-detail">5 models · 2 datasets</div>
        <button class="btn-sm btn-ghost" onclick="openIntegration('hf')">Open</button>
      </div>
      <div class="integration-card" style="--int-color:#20beff">
        <div class="int-icon">📊</div>
        <div class="int-name">Kaggle</div>
        <div class="int-detail">4 notebooks · 1 competition</div>
        <button class="btn-sm btn-ghost" onclick="openIntegration('kaggle')">Open</button>
      </div>
    </div>
    <div class="panel-section-title">Active Agents</div>
    ${agents.map(a => `
      <div class="agent-full-row">
        <span class="agent-dot ${a.status}"></span>
        <div class="agent-details">
          <div class="agent-full-name">${a.name}</div>
          <div class="agent-full-task">${a.task}</div>
        </div>
        <button class="btn-sm btn-ghost" onclick="toggleAgent('${a.id}')">
          ${a.status === "running" ? "Pause" : "Start"}
        </button>
      </div>
    `).join("")}
    <button class="btn-primary btn-full" onclick="newAgent()">+ New Agent</button>
  `;
}

function toggleAgent(id) {
  const a = agents.find(x => x.id === id);
  if (!a) return;
  a.status = a.status === "running" ? "idle" : "running";
  renderAgentsPanel();
}

function openIntegration(type) {
  const info = {
    github: { icon:"🐙", name:"GitHub", items:["OnyxNeol/linkon-browser","OnyxNeol/terabites","OnyxNeol/stract-config"] },
    hf:     { icon:"🤗", name:"Hugging Face", items:["codellama-7b-instruct","linkon-embeddings","linkon-dataset-v1","flan-t5-small","custom-model-1"] },
    kaggle: { icon:"📊", name:"Kaggle", items:["Intro to ML","Titanic Survival","NLP Notebook","Vision Transformer"] },
  };
  const d = info[type];
  showModal(`
    <div class="modal-title">${d.icon} ${d.name}</div>
    <div class="modal-list">
      ${d.items.map(item => `<div class="modal-list-item">
        <span>${item}</span>
        <button class="btn-sm btn-ghost" onclick="addToGalaxyFromIntegration('${item}')">Add to Galaxy</button>
      </div>`).join("")}
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Close</button>
    </div>
  `);
}

function addToGalaxyFromIntegration(item) {
  closeModal();
  const g = galaxies[0];
  if (g) { g.items++; g.updated = "Just now"; }
  renderGalaxyGrid();
  renderStatsBar();
}

function newAgent() {
  const names = ["Refactor Bot","Test Writer","Doc Generator","Dependency Checker","PR Reviewer"];
  const name = names[Math.floor(Math.random() * names.length)];
  agents.push({ id:"a" + Date.now(), name, status:"idle", task:"Ready to run…" });
  renderAgentsPanel();
}

// ── Panel toggles ──────────────────────────────────────────────
function bindPanelToggles() {
  const toggles = {
    "btn-tabs":     "tabs-panel",
    "btn-sgallery": "sgallery-panel",
    "btn-agents":   "agents-panel",
  };
  for (const [btnId, panelId] of Object.entries(toggles)) {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener("click", () => togglePanel(panelId));
  }

  // AI panel toggle via floating button
  const aiBtn = document.getElementById("ai-float-btn");
  if (aiBtn) aiBtn.addEventListener("click", () => togglePanel("ai-panel"));
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const visible = panel.style.display === "flex" || panel.style.display === "block";
  // Close all panels
  ["sgallery-panel","tabs-panel","agents-panel","ai-panel"].forEach(id => {
    const p = document.getElementById(id);
    if (p) p.style.display = "none";
  });
  // Open target if it was hidden
  if (!visible) panel.style.display = "flex";
}

// ── Modal ─────────────────────────────────────────────────────
function showModal(content) {
  let modal = document.getElementById("linkon-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "linkon-modal";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-box" onclick="event.stopPropagation()">
        ${content}
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("linkon-modal");
  if (modal) modal.style.display = "none";
}

// ── Utils ─────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
