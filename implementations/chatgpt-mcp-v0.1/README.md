# Shadow Carrier ChatGPT v0.1

Experimental ChatGPT MCP prototype for **zero-incremental-model-token speculation**.

The MCP tool exposed to ChatGPT is `shadow_fetch`. Actual requests are returned normally. After real tool trajectories are observed, deterministic worker threads predict likely next exact fetches and execute them in the background. Speculative bodies stay in a server-side hidden cache and are never sent to the model unless ChatGPT later requests the exact matching call.

```text
ChatGPT reasoning
      ↓
shadow_fetch(actual A)
      ↓
record A and return A normally
      ├─────────────→ Interceptor worker predicts/fetches likely B/C
      │                               ↓
      │                         hidden RAM cache
      ↓
ChatGPT later asks B
      ↓
exact cache hit → return B
miss → normal fetch
```

## Why this is ChatGPT-specific

ChatGPT custom apps connect to remote MCP servers. They do not let a third-party process transparently intercept built-in Web/GitHub/Drive tools, so v0.1 makes the Shadow server own the read/fetch surface that it can accelerate.

The speculative predictor itself calls **no LLM**. It uses persisted observed transitions and deterministic workers. Unused prefetched content never becomes model-visible context.

## Safety boundary

- GET only.
- `http`/`https` only.
- localhost/private-network targets are rejected (SSRF guard).
- optional domain allowlist: `SHADOW_ALLOWED_DOMAINS=example.com,github.com`.
- speculative content is RAM-only; only transition metadata is persisted.
- exact URL + output-size key is required for reuse.
- stale cache entries expire.

## Run

Requires Node.js 20+.

```bash
npm install
npm test
npm start
```

Default endpoint: `http://localhost:8787/mcp`.

Useful environment variables:

```text
PORT=8787
SHADOW_WORKERS=3
SHADOW_TOP_K=3
SHADOW_MIN_CONFIDENCE=0.2
SHADOW_CACHE_TTL_MS=60000
SHADOW_ALLOWED_DOMAINS=github.com,openai.com
SHADOW_STATE_FILE=data/transition-table.json
```

For ChatGPT, deploy the server remotely or expose it through a supported secure MCP tunnel, then connect `/mcp` as a custom app in Developer Mode.

## v0.1 limits

- one generic public URL fetch tool only; it does not intercept ChatGPT built-in tools.
- transition state is global to one deployment; multi-user isolation is not implemented yet.
- generic web search is not included because a search provider/API adapter has not been selected.
- no portable pretrained proficiency pack yet.
- cache compatibility is exact-key + TTL, not semantic authority/freshness matching yet.

## Next

1. per-user/session trajectory state,
2. search adapters,
3. task-class proficiency packs,
4. counterfactual replay,
5. source/authority/freshness-aware compatibility,
6. benchmark against Normal MCP fetch and ToolAhead-like baselines.
