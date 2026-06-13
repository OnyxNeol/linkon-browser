// ============================================================
// Linkon Tab Manager — Freeze Mode + HAW (Half Active Website)
// ============================================================

export class TabManager {
  constructor() {
    this.frozenTabs = new Map();   // tabId -> { url, title, favicon, snapshot }
    this.hawTabs = new Map();      // tabId -> { interval, lastPing, sessionToken }
    this.tabMeta = new Map();      // tabId -> { memoryMB, domain, group, status }
    this.stats = { frozen: 0, haw: 0, active: 0, savedMB: 0 };
  }

  async init() {
    const stored = await browser.storage.local.get(['frozenTabs', 'hawTabs', 'tabMeta']);
    if (stored.frozenTabs) {
      this.frozenTabs = new Map(Object.entries(stored.frozenTabs));
    }
    console.log('[TabManager] Initialized. Frozen:', this.frozenTabs.size);
  }

  // ── Freeze a tab ──────────────────────────────────────────
  // Replaces the tab's content with a lightweight placeholder
  // while storing the URL + scroll position + form state
  async freezeTab(tabId) {
    try {
      const tab = await browser.tabs.get(tabId);
      if (!tab) return { success: false, error: 'Tab not found' };

      // Capture scroll position + form state via content script
      const snapshot = await browser.tabs.sendMessage(tabId, {
        type: 'CAPTURE_STATE'
      }).catch(() => ({}));

      const frozenData = {
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl,
        snapshot,
        frozenAt: Date.now(),
        memoryEstimate: this.tabMeta.get(tabId)?.memoryMB || 50
      };

      this.frozenTabs.set(tabId, frozenData);

      // Navigate tab to frozen placeholder page
      await browser.tabs.update(tabId, {
        url: browser.runtime.getURL('src/panels/frozen.html') +
             `?tabId=${tabId}&title=${encodeURIComponent(tab.title)}`
      });

      this.tabMeta.set(tabId, {
        ...this.tabMeta.get(tabId),
        status: 'frozen',
        memoryMB: 2  // frozen tab uses ~2MB
      });

      await this._persist();
      this._updateStats();

      return { success: true, savedMB: frozenData.memoryEstimate - 2 };
    } catch (err) {
      console.error('[TabManager] freezeTab error:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Unfreeze a tab ────────────────────────────────────────
  async unfreezeTab(tabId) {
    const frozen = this.frozenTabs.get(tabId);
    if (!frozen) return { success: false, error: 'Tab not frozen' };

    await browser.tabs.update(tabId, { url: frozen.url });

    // Restore scroll + form state after page loads
    browser.tabs.onUpdated.addListener(function restorer(id, info) {
      if (id === tabId && info.status === 'complete') {
        browser.tabs.sendMessage(tabId, {
          type: 'RESTORE_STATE',
          snapshot: frozen.snapshot
        }).catch(() => {});
        browser.tabs.onUpdated.removeListener(restorer);
      }
    });

    this.frozenTabs.delete(tabId);
    this.tabMeta.set(tabId, { ...this.tabMeta.get(tabId), status: 'active' });

    await this._persist();
    this._updateStats();

    return { success: true };
  }

  // ── HAW: Half Active Website ──────────────────────────────
  // Keeps session cookies + auth tokens alive without rendering
  // Uses minimal background XHR pings to session endpoints
  async setHAW(tabId, enabled) {
    if (enabled) {
      const tab = await browser.tabs.get(tabId);
      const domain = new URL(tab.url).hostname;

      // Identify session-keep-alive endpoint for this domain
      const pingUrl = this._getKeepAliveUrl(domain, tab.url);

      const hawData = {
        domain,
        pingUrl,
        interval: null,
        lastPing: Date.now(),
        sessionAlive: true
      };

      this.hawTabs.set(tabId, hawData);
      this.tabMeta.set(tabId, { ...this.tabMeta.get(tabId), status: 'haw' });

      return { success: true, pingUrl };
    } else {
      this.hawTabs.delete(tabId);
      this.tabMeta.set(tabId, { ...this.tabMeta.get(tabId), status: 'active' });
      return { success: true };
    }
  }

  // ── HAW Heartbeat (runs every 60s via alarm) ──────────────
  async hawHeartbeat() {
    for (const [tabId, hawData] of this.hawTabs) {
      try {
        // Lightweight fetch to keep session alive
        if (hawData.pingUrl) {
          await fetch(hawData.pingUrl, {
            method: 'HEAD',
            credentials: 'include',
            cache: 'no-store'
          });
          hawData.lastPing = Date.now();
          hawData.sessionAlive = true;
        }
      } catch {
        hawData.sessionAlive = false;
      }
    }
  }

  // ── Get all tabs with Linkon metadata ────────────────────
  async getAllTabs() {
    const tabs = await browser.tabs.query({});
    return tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      favicon: tab.favIconUrl,
      active: tab.active,
      status: this._getTabStatus(tab.id),
      memoryMB: this.tabMeta.get(tab.id)?.memoryMB || 45,
      domain: tab.url ? new URL(tab.url).hostname : '',
      group: this.tabMeta.get(tab.id)?.group || 'ungrouped',
      hawAlive: this.hawTabs.get(tab.id)?.sessionAlive || false,
      frozenData: this.frozenTabs.get(tab.id) || null
    }));
  }

  getStats() {
    return this.stats;
  }

  _getTabStatus(tabId) {
    if (this.frozenTabs.has(tabId)) return 'frozen';
    if (this.hawTabs.has(tabId)) return 'haw';
    return this.tabMeta.get(tabId)?.status || 'active';
  }

  _getKeepAliveUrl(domain, originalUrl) {
    // Common session keep-alive patterns
    const patterns = {
      'github.com': 'https://github.com/session',
      'gitlab.com': 'https://gitlab.com/users/sign_in',
      'kaggle.com': 'https://www.kaggle.com/api/v1/ping',
      'huggingface.co': 'https://huggingface.co/api/ping'
    };
    return patterns[domain] || originalUrl;
  }

  _updateStats() {
    let frozen = 0, haw = 0, active = 0, savedMB = 0;
    for (const [, meta] of this.tabMeta) {
      if (meta.status === 'frozen') { frozen++; savedMB += (meta.memoryMB || 50); }
      else if (meta.status === 'haw') haw++;
      else active++;
    }
    this.stats = { frozen, haw, active, savedMB };
  }

  async _persist() {
    await browser.storage.local.set({
      frozenTabs: Object.fromEntries(this.frozenTabs)
    });
  }

  onTabCreated(tab) {
    this.tabMeta.set(tab.id, { status: 'active', memoryMB: 45, group: 'ungrouped' });
    this._updateStats();
  }

  onTabRemoved(tabId) {
    this.frozenTabs.delete(tabId);
    this.hawTabs.delete(tabId);
    this.tabMeta.delete(tabId);
    this._updateStats();
  }

  onTabUpdated(tabId, info, tab) {
    if (info.status === 'complete') {
      const meta = this.tabMeta.get(tabId) || {};
      this.tabMeta.set(tabId, {
        ...meta,
        domain: tab.url ? new URL(tab.url).hostname : '',
        title: tab.title
      });
    }
  }
}
