// ============================================================
// Linkon Search Router
// Routes all searches to LOCAL Stract instance (port 3000)
// Stract: https://github.com/StractOrg/stract
// Zero Google. Zero Bing. Zero API keys. Real open-source index.
// ============================================================

export class SearchRouter {
  constructor() {
    this.stractUrl = 'http://localhost:3000';
    this.fallbackUrl = 'https://search.brave.com/search'; // only if local Stract down
    this.isLocal = false;
  }

  async init() {
    this.isLocal = await this._checkStract();
  }

  // ── Main search query ────────────────────────────────────
  async query(q, options = {}) {
    if (!q || q.trim() === '') return { results: [], query: q };

    const isUrl = this._isUrl(q);
    if (isUrl) return { redirect: q.startsWith('http') ? q : `https://${q}` };

    // Try local Stract first
    if (await this._checkStract()) {
      return this._stractSearch(q, options);
    }

    // Fallback: Brave Search (still no Google)
    return this._fallbackSearch(q);
  }

  // ── Stract local search ──────────────────────────────────
  async _stractSearch(q, options = {}) {
    try {
      const params = new URLSearchParams({
        q,
        page: options.page || 0,
        num_results: options.limit || 10,
        safe_search: options.safe || 'moderate',
        optic: options.optic || ''   // Stract optics = search lenses
      });

      const response = await fetch(`${this.stractUrl}/beta/api/search?${params}`, {
        headers: { 'Accept': 'application/json' }
      });

      const data = await response.json();

      return {
        source: 'stract-local',
        query: q,
        results: (data.webpages || []).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          domain: new URL(r.url).hostname,
          score: r.score
        })),
        sidebar: data.sidebar || null,
        spellCheck: data.spell_corrected_query || null,
        totalResults: data.num_hits || 0
      };
    } catch (err) {
      console.error('[SearchRouter] Stract error:', err);
      return this._fallbackSearch(q);
    }
  }

  // ── Fallback: Brave Search (no Google) ──────────────────
  async _fallbackSearch(q) {
    return {
      source: 'brave-fallback',
      query: q,
      redirect: `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
      note: 'Local Stract index offline — redirecting to Brave Search'
    };
  }

  // ── URL detection ────────────────────────────────────────
  _isUrl(str) {
    return /^(https?:\/\/|www\.)/.test(str) ||
           /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(str);
  }

  async _checkStract() {
    try {
      const res = await fetch(`${this.stractUrl}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      return res.ok;
    } catch { return false; }
  }
}
