// ============================================================
// Linkon Browser OS — Background Service Worker
// Manages: Tabs (Freeze/HAW), Agents, Universe sync, S Gallery
// ============================================================

import { TabManager } from './tabs/tab-manager.js';
import { AgentManager } from './agents/agent-manager.js';
import { UniverseSync } from './universe/universe-sync.js';
import { SGalleryManager } from './sgallery/sgallery-manager.js';
import { SearchRouter } from './search/search-router.js';

const tabManager = new TabManager();
const agentManager = new AgentManager();
const universeSync = new UniverseSync();
const sGallery = new SGalleryManager();
const searchRouter = new SearchRouter();

// ── Boot ────────────────────────────────────────────────────
browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await initLinkon();
  }
  await tabManager.init();
  await agentManager.init();
  await sGallery.init();
});

async function initLinkon() {
  // Set Stract as default search via omnibox keyword
  await browser.storage.local.set({
    linkonVersion: '1.0.0',
    searchEngine: 'stract',   // local Stract instance
    searchUrl: 'http://localhost:3000/search?q=',
    hawEnabled: true,
    freezeIdleMinutes: 30,
    universeUser: null,
    galaxies: [],
    activeSandboxes: []
  });
  console.log('[Linkon] Initialized — Welcome to your Universe.');
}

// ── Message Router ──────────────────────────────────────────
browser.runtime.onMessage.addListener(async (msg, sender) => {
  switch (msg.type) {

    // Tab Management
    case 'FREEZE_TAB':
      return tabManager.freezeTab(msg.tabId);
    case 'UNFREEZE_TAB':
      return tabManager.unfreezeTab(msg.tabId);
    case 'SET_HAW':
      return tabManager.setHAW(msg.tabId, msg.enabled);
    case 'GET_ALL_TABS':
      return tabManager.getAllTabs();
    case 'GET_TAB_STATS':
      return tabManager.getStats();

    // Search
    case 'SEARCH':
      return searchRouter.query(msg.query, msg.options);

    // Agents
    case 'LAUNCH_AGENT':
      return agentManager.launch(msg.agentConfig);
    case 'STOP_AGENT':
      return agentManager.stop(msg.agentId);
    case 'GET_AGENTS':
      return agentManager.list();
    case 'AGENT_TASK':
      return agentManager.runTask(msg.agentId, msg.task);

    // S Gallery
    case 'LAUNCH_SANDBOX':
      return sGallery.launch(msg.runtime);
    case 'STOP_SANDBOX':
      return sGallery.stop(msg.sandboxId);
    case 'GET_SANDBOXES':
      return sGallery.list();

    // Universe
    case 'UNIVERSE_LOGIN':
      return universeSync.login(msg.username, msg.password);
    case 'GET_GALAXIES':
      return universeSync.getGalaxies();
    case 'CREATE_GALAXY':
      return universeSync.createGalaxy(msg.galaxy);
    case 'DROP_ITEM':
      return universeSync.dropItem(msg.item);

    default:
      console.warn('[Linkon] Unknown message type:', msg.type);
  }
});

// ── Omnibox (address bar search via Stract) ─────────────────
browser.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const { searchUrl } = await browser.storage.local.get('searchUrl');
  const url = `${searchUrl}${encodeURIComponent(text)}`;
  if (disposition === 'currentTab') {
    browser.tabs.update({ url });
  } else {
    browser.tabs.create({ url });
  }
});

browser.omnibox.setDefaultSuggestion({
  description: 'Search with Linkon (Stract) — %s'
});

// ── Alarms: HAW heartbeat every 60s ────────────────────────
browser.alarms.create('haw-heartbeat', { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'haw-heartbeat') {
    await tabManager.hawHeartbeat();
  }
});

// ── Tab lifecycle hooks ─────────────────────────────────────
browser.tabs.onCreated.addListener((tab) => tabManager.onTabCreated(tab));
browser.tabs.onRemoved.addListener((tabId) => tabManager.onTabRemoved(tabId));
browser.tabs.onUpdated.addListener((tabId, info, tab) =>
  tabManager.onTabUpdated(tabId, info, tab)
);
