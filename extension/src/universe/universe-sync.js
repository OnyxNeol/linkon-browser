// ============================================================
// Linkon Universe Sync
// Workspace + Galaxies storage layer
// Auth: TeraBites Linkon Pass
// Storage: Local IndexedDB (primary) + HuggingFace Datasets (cloud sync)
// ============================================================

export class UniverseSync {
  constructor() {
    this.user = null;
    this.terabytesAuthUrl = 'https://auth.terabytes.dev/api'; // TeraBites auth
    this.hfApiUrl = 'https://huggingface.co/api';
    this.db = null;
  }

  async init() {
    this.db = await this._openDB();
    const stored = await browser.storage.local.get('universeUser');
    if (stored.universeUser) {
      this.user = stored.universeUser;
    }
  }

  // ── Login with Linkon Pass (TeraBites auth) ──────────────
  async login(username, password) {
    try {
      const response = await fetch(`${this.terabytesAuthUrl}/linkon-pass/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, client: 'linkon-browser' })
      });

      if (!response.ok) throw new Error('Auth failed');
      const data = await response.json();

      this.user = {
        username: data.username,
        displayName: data.display_name,
        universeOrg: `${data.username}-Linkon-Universe`,
        token: data.access_token,
        hfToken: data.hf_token,   // HuggingFace token from TeraBites
        avatar: data.avatar_url,
        joinedAt: data.created_at
      };

      await browser.storage.local.set({ universeUser: this.user });

      // Auto-create HuggingFace org if first login
      if (data.is_first_login) {
        await this._createHFOrg(this.user.universeOrg, this.user.hfToken);
      }

      // Init default workspace + galaxies
      await this._initDefaultWorkspace();

      return { success: true, user: this.user };
    } catch (err) {
      // Dev mode: offline login for testing
      this.user = {
        username,
        displayName: username,
        universeOrg: `${username}-Linkon-Universe`,
        token: 'dev-token',
        hfToken: null,
        avatar: null,
        offline: true
      };
      await browser.storage.local.set({ universeUser: this.user });
      await this._initDefaultWorkspace();
      return { success: true, user: this.user, offline: true };
    }
  }

  // ── Galaxy CRUD ──────────────────────────────────────────
  async getGalaxies() {
    const tx = this.db.transaction('galaxies', 'readonly');
    const store = tx.objectStore('galaxies');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async createGalaxy(galaxy) {
    const newGalaxy = {
      id: `galaxy-${Date.now()}`,
      name: galaxy.name,
      description: galaxy.description || '',
      icon: galaxy.icon || '🌌',
      color: galaxy.color || '#6e00ff',
      itemCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workspaceId: 'default'
    };

    const tx = this.db.transaction('galaxies', 'readwrite');
    tx.objectStore('galaxies').put(newGalaxy);

    // Sync to HF dataset if online
    if (this.user?.hfToken) {
      this._syncGalaxyToHF(newGalaxy).catch(console.warn);
    }

    return { success: true, galaxy: newGalaxy };
  }

  // ── Drop an item (immediate storage) ────────────────────
  async dropItem(item) {
    const newItem = {
      id: `item-${Date.now()}`,
      galaxyId: item.galaxyId || 'immediate',
      type: item.type || 'link',     // link | file | note | repo | dataset
      name: item.name,
      url: item.url || null,
      content: item.content || null,
      metadata: item.metadata || {},
      droppedAt: Date.now()
    };

    const tx = this.db.transaction('items', 'readwrite');
    tx.objectStore('items').put(newItem);

    return { success: true, item: newItem };
  }

  // ── Auto-create HF org for new user ─────────────────────
  async _createHFOrg(orgName, hfToken) {
    if (!hfToken) return;
    try {
      await fetch(`${this.hfApiUrl}/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: orgName,
          fullname: `${orgName} — Powered by Linkon Browser`,
          description: 'Personal developer universe created by Linkon Browser',
          type: 'org'
        })
      });
    } catch (err) {
      console.warn('[UniverseSync] HF org creation deferred:', err.message);
    }
  }

  async _initDefaultWorkspace() {
    const galaxies = await this.getGalaxies();
    if (galaxies.length === 0) {
      // Create default galaxies
      await this.createGalaxy({ name: 'Projects', icon: '🚀', color: '#6e00ff' });
      await this.createGalaxy({ name: 'Datasets', icon: '📊', color: '#00d4ff' });
      await this.createGalaxy({ name: 'Bookmarks', icon: '🔖', color: '#ff6b35' });
      await this.createGalaxy({ name: 'Notes', icon: '📝', color: '#00ff88' });
    }
  }

  async _syncGalaxyToHF(galaxy) {
    // Store galaxy metadata as HF dataset file
    const datasetName = `${this.user.universeOrg}/linkon-universe-index`;
    await fetch(`${this.hfApiUrl}/datasets/${datasetName}/commit/main`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.user.hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ops: [{
          key: `galaxies/${galaxy.id}.json`,
          value: JSON.stringify(galaxy)
        }],
        commit_message: `Add galaxy: ${galaxy.name}`
      })
    });
  }

  // ── IndexedDB setup ──────────────────────────────────────
  _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('LinkonUniverse', 1);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('galaxies')) {
          const gs = db.createObjectStore('galaxies', { keyPath: 'id' });
          gs.createIndex('workspaceId', 'workspaceId');
        }
        if (!db.objectStoreNames.contains('items')) {
          const is = db.createObjectStore('items', { keyPath: 'id' });
          is.createIndex('galaxyId', 'galaxyId');
          is.createIndex('type', 'type');
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}
