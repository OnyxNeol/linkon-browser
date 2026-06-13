// ============================================================
// Linkon Agent Manager
// Powered by OpenHands (open-source, safe AI agent framework)
// OpenHands: https://github.com/All-Hands-AI/OpenHands
// No OpenAI required — runs with local Ollama LLM backend
// ============================================================

export class AgentManager {
  constructor() {
    this.agents = new Map();       // agentId -> AgentInstance
    this.openHandsUrl = 'http://localhost:3000'; // local OpenHands server
    this.ollamaUrl = 'http://localhost:11434';   // local Ollama LLM
  }

  async init() {
    // Check if OpenHands backend is running
    const alive = await this._ping(this.openHandsUrl);
    const ollamaAlive = await this._ping(this.ollamaUrl);
    console.log(`[AgentManager] OpenHands: ${alive ? 'UP' : 'DOWN'}, Ollama: ${ollamaAlive ? 'UP' : 'DOWN'}`);

    // Load persisted agent sessions
    const stored = await browser.storage.local.get('agents');
    if (stored.agents) {
      for (const [id, data] of Object.entries(stored.agents)) {
        this.agents.set(id, { ...data, status: 'idle' });
      }
    }
  }

  // ── Launch a Linkon Agent ────────────────────────────────
  // config: { name, type, model, task, sandboxId }
  // type: 'CodeAgent' | 'BrowseAgent' | 'FileAgent' | 'GitAgent'
  async launch(config) {
    const agentId = `agent-${Date.now()}`;

    const agentPayload = {
      // OpenHands API payload
      agent: {
        cls: this._mapAgentType(config.type),
        config: {
          model: config.model || 'ollama/codellama',   // local model, no API
          api_key: 'LOCAL',                            // no external key needed
          base_url: this.ollamaUrl + '/v1'
        }
      },
      runtime: {
        runtime_type: 'local',
        sandbox_id: config.sandboxId || null
      },
      initial_user_action: config.task || ''
    };

    try {
      const response = await fetch(`${this.openHandsUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPayload)
      });

      const data = await response.json();

      const agent = {
        id: agentId,
        conversationId: data.conversation_id,
        name: config.name || `Agent-${agentId.slice(-4)}`,
        type: config.type || 'CodeAgent',
        model: config.model || 'codellama',
        status: 'running',
        task: config.task || '',
        startedAt: Date.now(),
        logs: []
      };

      this.agents.set(agentId, agent);
      await this._persist();

      return { success: true, agentId, conversationId: data.conversation_id };
    } catch (err) {
      // Fallback: queue agent for when backend comes online
      const agent = {
        id: agentId,
        name: config.name || `Agent-${agentId.slice(-4)}`,
        type: config.type || 'CodeAgent',
        status: 'queued',
        task: config.task || '',
        startedAt: Date.now(),
        logs: ['Backend offline — agent queued for launch']
      };
      this.agents.set(agentId, agent);
      return { success: true, agentId, queued: true };
    }
  }

  // ── Send a task to a running agent ───────────────────────
  async runTask(agentId, task) {
    const agent = this.agents.get(agentId);
    if (!agent) return { error: 'Agent not found' };

    try {
      const response = await fetch(
        `${this.openHandsUrl}/api/conversations/${agent.conversationId}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'message',
            args: { content: task, image_urls: [] }
          })
        }
      );

      const data = await response.json();
      agent.logs.push({ task, response: data, at: Date.now() });
      return { success: true, response: data };
    } catch (err) {
      return { error: err.message };
    }
  }

  // ── Stop an agent ────────────────────────────────────────
  async stop(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return { error: 'Agent not found' };

    try {
      await fetch(
        `${this.openHandsUrl}/api/conversations/${agent.conversationId}`,
        { method: 'DELETE' }
      );
    } catch {}

    agent.status = 'stopped';
    await this._persist();
    return { success: true };
  }

  list() {
    return Array.from(this.agents.values());
  }

  // ── Map Linkon agent type to OpenHands agent class ───────
  _mapAgentType(type) {
    const map = {
      'CodeAgent':   'CodeActAgent',
      'BrowseAgent': 'BrowsingAgent',
      'FileAgent':   'CodeActAgent',
      'GitAgent':    'CodeActAgent',
      'DataAgent':   'CodeActAgent'
    };
    return map[type] || 'CodeActAgent';
  }

  async _ping(url) {
    try {
      const res = await fetch(url + '/health', {
        signal: AbortSignal.timeout(2000)
      });
      return res.ok;
    } catch { return false; }
  }

  async _persist() {
    await browser.storage.local.set({
      agents: Object.fromEntries(this.agents)
    });
  }
}
