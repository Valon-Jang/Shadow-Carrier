import path from "node:path";
import { HiddenCache } from "./cache.js";
import { TransitionTable } from "./transition-table.js";
import { WorkerPool } from "./worker-pool.js";
import { assertPublicHttpUrl } from "./url-safety.js";

function canonicalFetchKey({ url, maxChars }) {
  const u = new URL(url);
  u.hash = "";
  return `fetch:${u.toString()}#chars=${maxChars}`;
}

export class ShadowEngine {
  constructor({
    stateFile = path.resolve("data/transition-table.json"),
    workerCount = 3,
    ttlMs = 60_000,
    maxEntries = 128,
    prefetchTopK = 3,
    minConfidence = 0.2,
    allowedDomains = []
  } = {}) {
    this.table = TransitionTable.load(stateFile);
    this.stateFile = stateFile;
    this.cache = new HiddenCache({ ttlMs, maxEntries });
    this.pool = new WorkerPool(workerCount);
    this.prefetchTopK = prefetchTopK;
    this.minConfidence = minConfidence;
    this.allowedDomains = allowedDomains;
    this.prevActualKey = "$START";
    this.lastPrediction = null;
    this.inflight = new Map();
    this.stats = { actualCalls: 0, hits: 0, misses: 0, prefetches: 0, prefetchErrors: 0 };
  }

  async validate(task) {
    const url = await assertPublicHttpUrl(task.url, this.allowedDomains);
    return { ...task, url: url.toString() };
  }

  async executeFetch({ url, maxChars = 40_000, timeoutMs = 12_000 }) {
    const task = await this.validate({ url, maxChars, timeoutMs });
    const key = canonicalFetchKey(task);
    this.stats.actualCalls++;

    let result = this.cache.get(key);
    if (result) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
      const inflight = this.inflight.get(key);
      if (inflight) {
        try { result = await inflight; } catch {}
      }
      if (!result) result = await this.pool.run(task);
      this.cache.set(key, result);
    }

    const prev = this.prevActualKey;
    if (this.lastPrediction?.from === prev) {
      for (const predicted of this.lastPrediction.keys) {
        if (predicted !== key) this.table.recordMiss(prev, predicted);
      }
    }
    this.table.record(prev, key, task);
    this.prevActualKey = key;
    this.table.save(this.stateFile);
    this.prefetchFrom(key).catch(() => {});
    return result;
  }

  async prefetchFrom(currentKey) {
    const candidates = this.table.top(currentKey, this.prefetchTopK, this.minConfidence);
    this.lastPrediction = { from: currentKey, keys: candidates.map((c) => c.next) };
    for (const candidate of candidates) {
      const task = candidate.example;
      if (!task?.url) continue;
      let validated;
      try { validated = await this.validate(task); } catch { continue; }
      const key = canonicalFetchKey(validated);
      if (this.cache.has(key) || this.inflight.has(key)) continue;

      this.stats.prefetches++;
      const promise = this.pool.run(validated)
        .then((result) => {
          this.cache.set(key, result);
          return result;
        })
        .catch((error) => {
          this.stats.prefetchErrors++;
          throw error;
        })
        .finally(() => this.inflight.delete(key));
      this.inflight.set(key, promise);
    }
  }

  snapshot() {
    return {
      ...this.stats,
      cacheEntries: this.cache.size(),
      inflight: this.inflight.size,
      observedTransitions: this.table.counts.size,
      hitRate: this.stats.actualCalls ? this.stats.hits / this.stats.actualCalls : 0
    };
  }

  async close() {
    this.table.save(this.stateFile);
    await this.pool.close();
  }
}
