# ⬡ Linkon

> **A developer's operating system inside a browser — the foundation is here, the universe is coming.**  
> Free. Open-source. No accounts required. No charges. Ever.

---

## ⬇️ Download v1.0.2

| Platform | Download |
|---|---|
| 🪟 **Windows** | [Linkon.Setup.1.0.2.exe](https://github.com/OnyxNeol/linkon-browser/releases/download/v1.0.2/Linkon.Browser.Setup.1.0.1.exe) |
| 🍎 **macOS** | [Linkon-1.0.2.dmg](https://github.com/OnyxNeol/linkon-browser/releases/download/v1.0.2/Linkon.Browser-1.0.1.dmg) |
| 🐧 **Linux AppImage** | [Linkon-1.0.2.AppImage](https://github.com/OnyxNeol/linkon-browser/releases/download/v1.0.2/Linkon.Browser-1.0.1.AppImage) |
| 🐧 **Linux DEB** | [linkon_1.0.2_amd64.deb](https://github.com/OnyxNeol/linkon-browser/releases/download/v1.0.2/linkon-browser_1.0.1_amd64.deb) |

---

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Build](https://github.com/OnyxNeol/linkon-browser/actions/workflows/build-electron.yml/badge.svg)](https://github.com/OnyxNeol/linkon-browser/actions/workflows/build-electron.yml)
[![Engine: Electron + Blink](https://img.shields.io/badge/Engine-Electron_+_Blink-blue)](https://www.electronjs.org/)

---

## ✦ What Linkon Is

Linkon is an **ambitious, free, open-source platform** being built in layers. The kernel is ready. The rest is unfolding.

**What ships today (v1.0.2)**:
- **Electron + Blink engine** — a clean, fast browser with zero Google/Chromium telemetry
- **Tabbed browsing** — with a cosmic dark UI
- **GitHub OAuth + Hugging Face OAuth** — log in with your dev accounts
- **Google-free** — all telemetry endpoints blocked at the network level
- **Cosmic UI shell** — the visual foundation for everything to come

**What's on the roadmap (the Five Pillars)**:
1. **Infinite Tabs** (Freeze Mode + HAW) — open 500 tabs, freeze them to near-zero resource usage
2. **Offline AI Copilot** — local AI via Ollama + CodeLlama, works on a plane
3. **S Gallery™ Sandboxes** — spin up Python, Node, Rust sandboxes from a browser tab
4. **Linkon Agents** — AI agents that orchestrate workflows directly in the browser
5. **Linkon Universe** — your personal dev hub with galaxies, workspaces, and instant drops

All features, present and future, are **100% free**. No subscriptions. No premium tiers. No telemetry. No ads.

> Licensed under **MPL 2.0** — fork it, build on it, make it yours.

---

## Quick Start

### Option A — Download a build
See the [Download](#️-download-v102) table above.

### Option B — Build from source

```bash
git clone https://github.com/OnyxNeol/linkon-browser
cd linkon-browser/linkon-electron
npm install
npm run build:win    # Windows .exe
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux .AppImage + .deb
```

### Option C — Run the backend locally

```bash
docker-compose up -d
```

Starts:
- **Stract** — self-hosted search at `localhost:3000`
- **OpenHands** — AI agent dashboard at `localhost:3001`
- **S Gallery** sandbox manager at `localhost:3002`

---

## Architecture

```
Linkon
├── Engine          Electron + Blink ✓ (v1.0.2)
├── Tabs            Cosmic UI shell   ✓ (v1.0.2)
├── Auth            GitHub + HF OAuth ✓ (v1.0.2)
├── Search          Stract / DuckDuckGo ✓ (v1.0.2)
├── AI Copilot      Ollama + CodeLlama (roadmap)
├── Sandboxes       Docker → ttyd/Jupyter (roadmap)
├── Agents          OpenHands runtime (roadmap)
├── Universe        Workspace hub (roadmap)
└── Skin            Cosmic UI (custom CSS)
```

---

## Project Structure

```
linkon-browser/
├── linkon-electron/         # Electron + Blink app
│   ├── src/
│   │   ├── main.js          # Main process (Blink, OAuth, tabs)
│   │   └── renderer/        # Cosmic UI
│   └── package.json
├── .github/workflows/
│   ├── build-electron.yml   # CI: Windows + macOS + Linux
│   └── build-all.yml        # Legacy (v1.0.0 / Firefox ESR)
├── extension/
│   └── src/                 # Future: agent runtime, sandbox UI
├── browser-config/
│   ├── policies.json
│   └── linkon.cfg
├── stract-config/
│   └── stract.toml
└── docker-compose.yml       # Stract + OpenHands + S Gallery
```

---

## Version History

### v1.0.2 — Electron + Blink (current)
- Clean release — Electron 31 + Blink engine
- Tabbed browsing with cosmic UI
- GitHub OAuth + Hugging Face OAuth
- Google/Chromium telemetry blocked

### v1.0.1 — skipped
- CI release issues, use v1.0.2 instead

### v1.0.0 — Firefox ESR (legacy)
- Original Firefox ESR-based build
- **Deprecated** — no active development

---

## Contributing

All contributions welcome. This is a community project.

- Fork → branch → PR
- No CLA required
- Issues, ideas, and feedback: open an issue

---

## License

**Mozilla Public License 2.0**  
See [LICENSE](LICENSE) for full text.

Linkon is built on Electron (MIT), Stract (MIT), and OpenHands (MIT).  
The Linkon name, cosmic UI, and S Gallery™ branding are by **TeraBites™**.

---

*"Every developer deserves a universe."*
