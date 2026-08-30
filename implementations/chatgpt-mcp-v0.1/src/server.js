import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { ShadowEngine } from "./engine.js";

const port = Number(process.env.PORT ?? 8787);
const allowedDomains = (process.env.SHADOW_ALLOWED_DOMAINS ?? "")
  .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

const engine = new ShadowEngine({
  stateFile: process.env.SHADOW_STATE_FILE ?? "data/transition-table.json",
  workerCount: Number(process.env.SHADOW_WORKERS ?? 3),
  ttlMs: Number(process.env.SHADOW_CACHE_TTL_MS ?? 60_000),
  prefetchTopK: Number(process.env.SHADOW_TOP_K ?? 3),
  minConfidence: Number(process.env.SHADOW_MIN_CONFIDENCE ?? 0.2),
  allowedDomains
});

function createServer() {
  const server = new McpServer({ name: "shadow-carrier-chatgpt", version: "0.1.0" });
  server.registerTool(
    "shadow_fetch",
    {
      title: "Shadow Fetch",
      description: "Fetch public text/HTML/JSON. Repeated tool trajectories may be prefetched invisibly by deterministic workers; unused speculative results are never returned to the model.",
      inputSchema: {
        url: z.string().url(),
        max_chars: z.number().int().min(1000).max(100000).optional()
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
    },
    async ({ url, max_chars }) => {
      try {
        const result = await engine.executeFetch({ url, maxChars: max_chars ?? 40_000 });
        const text = [`Source: ${result.url}`, "", result.text].join("\n");
        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: `shadow_fetch failed: ${error?.message ?? String(error)}` }], isError: true };
      }
    }
  );
  return server;
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => res.json({ ok: true, name: "shadow-carrier-chatgpt", version: "0.1.0" }));
app.get("/shadow/status", (_req, res) => res.json(engine.snapshot()));

const transports = new Map();
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => transports.set(id, transport)
    });
    transport.onclose = () => {
      if (transport.sessionId) transports.delete(transport.sessionId);
    };
    await createServer().connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});
app.get("/mcp", async (req, res) => {
  const transport = transports.get(req.headers["mcp-session-id"]);
  if (!transport) return res.status(400).json({ error: "Missing or invalid MCP session" });
  await transport.handleRequest(req, res);
});
app.delete("/mcp", async (req, res) => {
  const transport = transports.get(req.headers["mcp-session-id"]);
  if (!transport) return res.status(400).json({ error: "Missing or invalid MCP session" });
  await transport.handleRequest(req, res);
});

const listener = app.listen(port, "0.0.0.0", () => {
  console.error(`Shadow Carrier ChatGPT MCP listening on :${port}/mcp`);
});

async function shutdown() {
  listener.close();
  await engine.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
