import { parentPort } from "node:worker_threads";
import * as cheerio from "cheerio";

function normalizeText(text) {
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchText(task) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), task.timeoutMs ?? 12_000);
  try {
    const response = await fetch(task.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Shadow-Carrier-ChatGPT/0.1 (+https://github.com/Valon-Jang/Shadow-Carrier)",
        accept: "text/html,text/plain,application/json;q=0.9,*/*;q=0.5"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    const raw = await response.text();
    const maxChars = task.maxChars ?? 40_000;
    let text = raw;
    if (type.includes("text/html")) {
      const $ = cheerio.load(raw);
      $("script,style,noscript,svg").remove();
      const title = normalizeText($("title").first().text());
      const body = normalizeText($("body").text());
      text = title ? `${title}\n\n${body}` : body;
    } else if (type.includes("application/json")) {
      try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch {}
    }
    text = text.slice(0, maxChars);
    return {
      url: response.url,
      requestedUrl: task.url,
      contentType: type,
      text
    };
  } finally {
    clearTimeout(timer);
  }
}

parentPort.on("message", async ({ id, task }) => {
  try {
    const result = await fetchText(task);
    parentPort.postMessage({ id, ok: true, result });
  } catch (error) {
    parentPort.postMessage({ id, ok: false, error: error?.message ?? String(error) });
  }
});
