# ⬡ Linkon Browser

> **A developer's operating system inside a browser.**  
> Free. Open-source. No accounts required. No charges. Ever.

---

## ⬇️ Download

| Platform | File | Status |
|---|---|---|
| 🪟 **Windows** | [LinkonSetup-1.0.1.exe](https://github.com/OnyxNeol/linkon-browser/releases/latest) | 🔄 Building… |
| 🍎 **macOS** | [Linkon-1.0.1.dmg](https://github.com/OnyxNeol/linkon-browser/releases/latest) | 🔄 Building… |
| 🐧 **Linux AppImage** | [Linkon-1.0.1-x86_64.AppImage](https://github.com/OnyxNeol/linkon-browser/releases/latest) | 🔄 Building… |
| 🐧 **Linux DEB** | [Linkon-1.0.1-amd64.deb](https://github.com/OnyxNeol/linkon-browser/releases/latest) | 🔄 Building… |

> v1.0.1: Electron + Blink engine — full rebuild. Links go live when CI completes.  
> All files also listed on the [Releases page](https://github.com/OnyxNeol/linkon-browser/releases).

---

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Build Status](https://github.com/OnyxNeol/linkon-browser/actions/workflows/build-electron.yml/badge.svg)](https://github.com/OnyxNeol/linkon-browser/actions/workflows/build-electron.yml)
[![Engine: Electron + Blink](https://img.shields.io/badge/Engine-Electron_+_Blink-blue)](https://www.electronjs.org/)
[![Search: Stract](https://img.shields.io/badge/Search-Stract_(self--hosted)-blueviolet)](https://stract.com)

---

## ✦ Free & Open-Source — Always

Linkon is **100% free**. Every feature, every service, every pillar — free forever.

| Feature | Cost |
|---|---|
| Linkon Browser | Free |
| Linkon Agents | Free |
| Linkon Universe | Free |
| S Gallery™ Sandboxes | Free |
| Infinite Tabs | Free |
| Offline AI Copilot | Free |
| All future features | Free |

No subscriptions. No premium tiers. No telemetry. No ads.  
Licensed under **MPL 2.0** — fork it, build on it, make it yours.

---

## Five Pillars

### ❄️ 1. Infinite Tabs (Freeze Mode + HAW)
Freeze tabs to near-zero resource usage while keeping sessions, cookies, and auth alive.  
Half Active Website (HAW) mode polls just enough to stay verified — open 500 tabs without crashing.

### 🧠 2. Offline AI Copilot
A local AI assistant powered by [Ollama](https://ollama.ai) + CodeLlama.  
Zero cloud. Works on a plane. Helps you code, debug, and automate — privately.

### ⚗️ 3. S Gallery™ *(TB™)*
The compute hub. Spin up sandboxes instantly — Python, Node, Rust, Linux, custom.  
Sandboxes open as browser tabs via `ttyd` (terminal) or Jupyter (notebooks).  
Agents live here. Powered by local Docker. Branded as mythic by TeraBites™.

### 🤖 4. Linkon Agents + Extensions
Agents orchestrate workflows directly inside the browser.  
Built-in integrations: **GitHub**, **Hugging Face**, **Kaggle** — native, not scattered tabs.  
Powered by [OpenHands](https://github.com/All-Hands-AI/OpenHands).

### 🌌 5. Linkon Universe
Login with **Linkon Pass** via TeraBites auth.  
Auto-creates a Hugging Face org: `(YourName)-Linkon-Universe`.  
- **Workspace** — your central hub (renameable)  
- **Galaxies** — folders for projects, datasets, bookmarks, notes  
- **Immediate Drop** — store anything instantly, organize later  

*Compute stays in S Gallery. Storage lives in the Universe. Clean separation.*

---

## Architecture

```
Linkon Browser
├── Engine          Electron + Blink
├── Search          Stract (self-hosted, no Google)
├── AI Agent        OpenHands (local Docker)
├── AI Model        Ollama + CodeLlama (offline)
├── Sandboxes       Docker → ttyd / Jupyter (browser tabs)
├── Storage         Hugging Face Repos + Datasets API
├── Auth            GitHub OAuth + Hugging Face OAuth
├── App             linkon-electron/ (Electron, Node.js)
└── Skin            Cosmic UI (custom CSS)
```

---

## Quick Start

### Option A — Download a build
See the [Download](#️-download) table above. All platforms build via GitHub Actions (Electron + Blink).

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

## Project Structure

```
linkon-browser/
├── linkon-electron/         # Electron + Blink app (current engine)
│   ├── src/
│   │   ├── main.js          # Main process (Blink, OAuth, Stract)
│   │   └── renderer/        # Cosmic UI
│   └── package.json
├── .github/workflows/
│   └── build-electron.yml   # Windows + macOS + Linux CI (Electron + Blink)
│   └── build-all.yml        # Legacy Firefox ESR CI
├── browser-config/
│   ├── policies.json        # Enterprise policies
│   └── linkon.cfg           # AutoConfig (disables telemetry)
├── extension/
│   ├── manifest/manifest.json
│   └── src/
│       ├── background.js
│       ├── tabs/            # Infinite Tabs + HAW
│       ├── sgallery/        # S Gallery sandbox manager
│       ├── agents/          # Linkon Agents runtime
│       ├── universe/        # Universe dashboard
│       └── search/          # Stract search router
├── skin/chrome/
│   ├── userChrome.css       # Cosmic UI skin
│   └── userContent.css
├── stract-config/
│   └── stract.toml
└── docker-compose.yml       # Stract + OpenHands + S Gallery
```

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
