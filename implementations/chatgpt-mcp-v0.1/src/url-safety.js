import dns from "node:dns/promises";
import net from "node:net";

function privateV4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a >= 224)
  );
}

function privateV6(ip) {
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
}

export function isPrivateIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) return privateV4(ip);
  if (kind === 6) return privateV6(ip);
  return true;
}

export async function assertPublicHttpUrl(rawUrl, allowedDomains = []) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http/https URLs are allowed");
  if (url.username || url.password) throw new Error("Credential-bearing URLs are not allowed");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Only ports 80/443 are allowed");

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Local hosts are not allowed");
  }
  if (allowedDomains.length && !allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
    throw new Error(`Host ${host} is not in SHADOW_ALLOWED_DOMAINS`);
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private IPs are not allowed");
  } else {
    const rows = await dns.lookup(host, { all: true, verbatim: true });
    if (!rows.length || rows.some((row) => isPrivateIp(row.address))) {
      throw new Error("Host resolves to a private or invalid address");
    }
  }
  return url;
}
