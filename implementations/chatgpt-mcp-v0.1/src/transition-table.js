import fs from "node:fs";
import path from "node:path";

export class TransitionTable {
  constructor() {
    this.counts = new Map();
    this.wrong = new Map();
    this.examples = new Map();
  }

  static pairKey(prev, next) {
    return `${prev}\u0000${next}`;
  }

  record(prev, next, example = null) {
    const pair = TransitionTable.pairKey(prev, next);
    this.counts.set(pair, (this.counts.get(pair) ?? 0) + 1);
    if (example) {
      const bucket = this.examples.get(next) ?? new Map();
      const encoded = JSON.stringify(example);
      bucket.set(encoded, (bucket.get(encoded) ?? 0) + 1);
      this.examples.set(next, bucket);
    }
  }

  recordMiss(prev, predicted) {
    const pair = TransitionTable.pairKey(prev, predicted);
    this.wrong.set(pair, (this.wrong.get(pair) ?? 0) + 1);
  }

  top(prev, limit = 3, minConfidence = 0.15) {
    const rows = [];
    let total = 0;
    for (const [pair, count] of this.counts.entries()) {
      const [p, next] = pair.split("\u0000");
      if (p !== prev) continue;
      total += count;
      rows.push({ next, count });
    }
    if (!total) return [];

    return rows
      .map(({ next, count }) => {
        const misses = this.wrong.get(TransitionTable.pairKey(prev, next)) ?? 0;
        const confidence = count / total;
        return { next, confidence, misses, example: this.bestExample(next) };
      })
      .filter((row) => row.confidence >= minConfidence && row.misses < 3 && row.example)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  bestExample(next) {
    const bucket = this.examples.get(next);
    if (!bucket?.size) return null;
    let best = null;
    let bestCount = -1;
    for (const [encoded, count] of bucket.entries()) {
      if (count > bestCount) {
        best = encoded;
        bestCount = count;
      }
    }
    try {
      return JSON.parse(best);
    } catch {
      return null;
    }
  }

  toJSON() {
    return {
      version: 1,
      counts: [...this.counts.entries()],
      wrong: [...this.wrong.entries()],
      examples: [...this.examples.entries()].map(([key, bucket]) => [key, [...bucket.entries()]])
    };
  }

  static fromJSON(value) {
    const table = new TransitionTable();
    if (!value || value.version !== 1) return table;
    table.counts = new Map(value.counts ?? []);
    table.wrong = new Map(value.wrong ?? []);
    table.examples = new Map((value.examples ?? []).map(([k, rows]) => [k, new Map(rows)]));
    return table;
  }

  static load(file) {
    try {
      return TransitionTable.fromJSON(JSON.parse(fs.readFileSync(file, "utf8")));
    } catch {
      return new TransitionTable();
    }
  }

  save(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.toJSON(), null, 2));
    fs.renameSync(tmp, file);
  }
}
