export class HiddenCache {
  constructor({ ttlMs = 60_000, maxEntries = 128 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.rows = new Map();
  }

  get(key, now = Date.now()) {
    const row = this.rows.get(key);
    if (!row) return null;
    if (now - row.createdAt > this.ttlMs) {
      this.rows.delete(key);
      return null;
    }
    return row.value;
  }

  set(key, value, now = Date.now()) {
    this.rows.delete(key);
    this.rows.set(key, { createdAt: now, value });
    while (this.rows.size > this.maxEntries) {
      this.rows.delete(this.rows.keys().next().value);
    }
  }

  has(key, now = Date.now()) {
    return this.get(key, now) !== null;
  }

  size() {
    return this.rows.size;
  }
}
