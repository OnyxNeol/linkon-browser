# ⬡ Linkon Browser

> A developer's operating system inside a browser.
> Built on Firefox ESR · Powered by Stract + OpenHands + Ollama · Branded by TeraBites

---

## Architecture

```
Linkon Browser
├── Core:          Firefox ESR (Gecko rendering engine)
├── Search:        Stract (open-source, self-hosted, zero Google)
├── AI Agent:      OpenHands (open-source, safe, local)
├── LLM Backend:   Ollama (CodeLlama 13B, runs fully offline)
├── Auth:          TeraBites Linkon Pass
└── Extension:     linkon-core.xpi (5 pillars)
```

---

## Five Pillars

### 1. ❄️ Infinite Tabs (Freeze Mode + HAW)
- `src/tabs/tab-manager.js`
- Freeze tabs → 2MB each vs 50–200MB active
- HAW (Half Active Website) keeps sessions alive with HEAD pings
- Tab groups by domain or project

### 2. 🧠 Offline AI Copilot
- Powered by **Ollama** + **CodeLlama 13B** (fully local)
- No internet required, no API key, no cloud
- Accessed via floating panel in every tab

### 3. ⚗️ S Gallery™ (Sandbox Gallery · TB™)
- `src/sgallery/sgallery-manager.js`
- Spins up Docker containers: Python, Node, Rust, Linux, Jupyter, Go
- Powered by **OpenHands** runtime
- Agents live here — compute only, never storage

### 4. 🤖 Linkon Agents + Extensions
- `src/agents/agent-manager.js`
- Powered by **OpenHands** (CodeActAgent, BrowsingAgent, etc.)
- Local LLM via Ollama (CodeLlama) — zero external API
- Native integrations: GitHub, Hugging Face, Kaggle

### 5. 🌌 Linkon Universe
- `src/universe/universe.html`
- Login with **Linkon Pass** (TeraBites auth)
- Auto-creates `{Username}-Linkon-Universe` HuggingFace org
- Workspace → Galaxies → Items hierarchy
- Quick Drop for immediate storage
- IndexedDB local + HuggingFace Datasets cloud sync

---

## Build Instructions

### Prerequisites
```
Firefox ESR     → downloaded by build scripts
Docker          → for S Gallery™ sandboxes
Node.js 18+     → extension build tooling
Python 3.11+    → Stract config helpers
```

### Start backend services
```bash
docker-compose up -d
# Wait for Ollama to pull CodeLlama (~8GB first run)
docker logs linkon-ollama-init -f
```

### Build on Windows
```powershell
cd build/windows
.\build-windows.ps1 -Version "1.0.0"
# Output: dist/windows/LinkonSetup-1.0.0.exe
```

### Build on macOS
```bash
cd build/macos
chmod +x build-macos.sh
./build-macos.sh 1.0.0
# Output: dist/macos/Linkon-1.0.0.dmg
```

---

## Search Engine

Linkon uses **Stract** — a fully open-source search engine written in Rust.

- GitHub: https://github.com/StractOrg/stract
- Self-hosted at `http://localhost:3000`
- Crawls dev-focused seed URLs (MDN, PyPI, crates.io, docs.github.com, etc.)
- No Google. No Bing. No tracking.
- Falls back to Brave Search if local Stract is offline.

---

## AI Agent

Linkon uses **OpenHands** — a safe, open-source AI agent framework.

- GitHub: https://github.com/All-Hands-AI/OpenHands
- LLM: **CodeLlama 13B** via Ollama (local, no API key)
- Agent types: CodeActAgent, BrowsingAgent
- Zero data leaves your machine

---

## File Structure

```
linkon/
├── browser-config/
│   ├── policies.json        # Firefox policy (removes Google)
│   ├── autoconfig.js        # Startup config loader
│   └── linkon.cfg           # Privileged browser prefs
├── extension/
│   ├── manifest/manifest.json
│   └── src/
│       ├── background.js
│       ├── content.js
│       ├── tabs/tab-manager.js
│       ├── agents/agent-manager.js
│       ├── sgallery/sgallery-manager.js
│       ├── search/search-router.js
│       └── universe/
│           ├── universe.html
│           ├── universe.css
│           ├── universe.js
│           └── universe-sync.js
├── skin/chrome/
│   ├── userChrome.css       # Browser UI skin
│   └── userContent.css      # Page overrides
├── stract-config/stract.toml
├── docker-compose.yml       # Stract + OpenHands + Ollama
├── build/
│   ├── windows/build-windows.ps1
│   └── macos/build-macos.sh
└── README.md
```

---

## License

Linkon Browser is built on open-source components:
- Firefox ESR: Mozilla Public License 2.0
- Stract: MIT License
- OpenHands: MIT License
- Ollama: MIT License
- Linkon Layer: TeraBites © 2025 — All rights reserved
