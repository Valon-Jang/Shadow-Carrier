import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerFile = path.join(__dirname, "interceptor-worker.js");

export class WorkerPool {
  constructor(size = 3) {
    this.workers = [];
    this.queue = [];
    this.pending = new Map();
    for (let i = 0; i < Math.max(1, size); i++) this.spawn();
  }

  spawn() {
    const worker = new Worker(workerFile);
    const slot = { worker, busy: false };
    worker.on("message", (msg) => {
      const item = this.pending.get(msg.id);
      if (!item) return;
      this.pending.delete(msg.id);
      slot.busy = false;
      msg.ok ? item.resolve(msg.result) : item.reject(new Error(msg.error));
      this.drain();
    });
    worker.on("error", (err) => {
      slot.busy = false;
      for (const [id, item] of this.pending.entries()) {
        if (item.slot === slot) {
          this.pending.delete(id);
          item.reject(err);
        }
      }
      this.drain();
    });
    this.workers.push(slot);
  }

  run(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.drain();
    });
  }

  drain() {
    while (this.queue.length) {
      const slot = this.workers.find((s) => !s.busy);
      if (!slot) return;
      const item = this.queue.shift();
      const id = crypto.randomUUID();
      slot.busy = true;
      item.slot = slot;
      this.pending.set(id, item);
      slot.worker.postMessage({ id, task: item.task });
    }
  }

  async close() {
    await Promise.all(this.workers.map(({ worker }) => worker.terminate()));
  }
}
