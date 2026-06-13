// ============================================================
// S Gallery™ — Sandbox Gallery (TB™)
// Compute hub: spins up real isolated sandboxes via Docker
// Powered by OpenHands runtime + local Docker daemon
// ============================================================

export class SGalleryManager {
  constructor() {
    this.sandboxes = new Map();
    this.dockerApi = 'http://localhost:2375'; // Docker Engine API (local)
    this.openHandsUrl = 'http://localhost:3000';

    // Available runtimes
    this.runtimes = {
      python: {
        name: 'Python 3.11',
        image: 'python:3.11-slim',
        icon: '🐍',
        color: '#3776AB',
        defaultCmd: 'python3',
        ports: [8888]
      },
      node: {
        name: 'Node.js 20',
        image: 'node:20-alpine',
        icon: '🟢',
        color: '#339933',
        defaultCmd: 'node',
        ports: [3000]
      },
      rust: {
        name: 'Rust',
        image: 'rust:1.75-slim',
        icon: '🦀',
        color: '#CE4A00',
        defaultCmd: 'rustc',
        ports: []
      },
      linux: {
        name: 'Ubuntu 22.04',
        image: 'ubuntu:22.04',
        icon: '🐧',
        color: '#E95420',
        defaultCmd: 'bash',
        ports: [22]
      },
      jupyter: {
        name: 'Jupyter Lab',
        image: 'jupyter/scipy-notebook:latest',
        icon: '📓',
        color: '#F37626',
        defaultCmd: 'jupyter lab',
        ports: [8888]
      },
      golang: {
        name: 'Go 1.22',
        image: 'golang:1.22-alpine',
        icon: '🐹',
        color: '#00ADD8',
        defaultCmd: 'go',
        ports: []
      }
    };
  }

  async init() {
    const stored = await browser.storage.local.get('sandboxes');
    if (stored.sandboxes) {
      this.sandboxes = new Map(Object.entries(stored.sandboxes));
    }
    console.log('[SGallery™] Initialized. Sandboxes:', this.sandboxes.size);
  }

  // ── Launch a sandbox ─────────────────────────────────────
  async launch(runtimeKey) {
    const runtime = this.runtimes[runtimeKey];
    if (!runtime) return { error: `Unknown runtime: ${runtimeKey}` };

    const sandboxId = `sb-${runtimeKey}-${Date.now()}`;

    // Create container via Docker Engine API
    try {
      const createResponse = await fetch(`${this.dockerApi}/containers/create?name=${sandboxId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Image: runtime.image,
          Cmd: [runtime.defaultCmd],
          Tty: true,
          OpenStdin: true,
          WorkingDir: '/workspace',
          Labels: { 'linkon.sandbox': 'true', 'linkon.runtime': runtimeKey },
          HostConfig: {
            Memory: 512 * 1024 * 1024,   // 512MB limit
            CpuPeriod: 100000,
            CpuQuota: 50000,              // 50% CPU limit
            NetworkMode: 'bridge',
            Binds: [`linkon-${sandboxId}:/workspace`],
            PortBindings: this._buildPortBindings(runtime.ports)
          },
          ExposedPorts: this._buildExposedPorts(runtime.ports)
        })
      });

      const container = await createResponse.json();

      // Start the container
      await fetch(`${this.dockerApi}/containers/${container.Id}/start`, {
        method: 'POST'
      });

      const sandbox = {
        id: sandboxId,
        containerId: container.Id,
        runtime: runtimeKey,
        name: runtime.name,
        icon: runtime.icon,
        color: runtime.color,
        status: 'running',
        ports: runtime.ports,
        startedAt: Date.now(),
        cpuPercent: 0,
        memoryMB: 0,
        agentId: null
      };

      this.sandboxes.set(sandboxId, sandbox);
      await this._persist();

      return { success: true, sandboxId, containerId: container.Id };
    } catch (err) {
      // Docker not available — create simulated sandbox record
      const sandbox = {
        id: sandboxId,
        runtime: runtimeKey,
        name: runtime.name,
        icon: runtime.icon,
        color: runtime.color,
        status: 'simulated',
        ports: runtime.ports,
        startedAt: Date.now(),
        cpuPercent: Math.random() * 10,
        memoryMB: Math.floor(Math.random() * 200 + 50),
        agentId: null,
        error: 'Docker unavailable — sandbox simulated'
      };
      this.sandboxes.set(sandboxId, sandbox);
      await this._persist();
      return { success: true, sandboxId, simulated: true };
    }
  }

  // ── Stop a sandbox ───────────────────────────────────────
  async stop(sandboxId) {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return { error: 'Sandbox not found' };

    try {
      if (sandbox.containerId) {
        await fetch(`${this.dockerApi}/containers/${sandbox.containerId}/stop`, {
          method: 'POST'
        });
        await fetch(`${this.dockerApi}/containers/${sandbox.containerId}`, {
          method: 'DELETE',
          headers: {},
          body: null
        });
      }
    } catch {}

    this.sandboxes.delete(sandboxId);
    await this._persist();
    return { success: true };
  }

  list() {
    return {
      sandboxes: Array.from(this.sandboxes.values()),
      availableRuntimes: Object.entries(this.runtimes).map(([key, r]) => ({
        key,
        name: r.name,
        icon: r.icon,
        color: r.color
      }))
    };
  }

  _buildPortBindings(ports) {
    const bindings = {};
    ports.forEach(p => {
      bindings[`${p}/tcp`] = [{ HostPort: String(p + 10000) }];
    });
    return bindings;
  }

  _buildExposedPorts(ports) {
    const exposed = {};
    ports.forEach(p => { exposed[`${p}/tcp`] = {}; });
    return exposed;
  }

  async _persist() {
    await browser.storage.local.set({
      sandboxes: Object.fromEntries(this.sandboxes)
    });
  }
}
