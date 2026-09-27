import { LookupError } from "./errors";

const OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4 = new RegExp(`^${OCTET}(\\.${OCTET}){3}$`);
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD = /^(xn--[a-z0-9-]{2,59}|[a-z]{2,63})$/;

export const isIPv4 = (s) => IPV4.test(s);

// Returns the compressed, lowercase form of an IPv6 address, or null.
function normalizeIPv6(s) {
  if (!s.includes(":")) return null;
  try {
    return new URL(`http://[${s}]`).hostname.slice(1, -1);
  } catch {
    return null;
  }
}

function normalizeDomain(host) {
  let name;
  try {
    name = new URL(`http://${host}`).hostname; // lowercases and punycodes IDNs
  } catch {
    return null;
  }
  if (name.length > 253) return null;
  const labels = name.split(".");
  if (labels.length < 2) return null;
  if (!labels.every((l) => LABEL.test(l))) return null;
  return TLD.test(labels.at(-1)) ? name : null;
}

// Strips scheme, credentials, path and port so pasted URLs and host:port work.
function extractHost(raw) {
  let s = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    return end > 0 ? s.slice(1, end) : s;
  }
  s = s.split(/[/?#]/)[0];
  s = s.slice(s.lastIndexOf("@") + 1);
  if ((s.match(/:/g) || []).length === 1) s = s.split(":")[0];
  return s.replace(/\.$/, "");
}

/**
 * Parses free-form input into `{ kind: "ip" | "domain", value }`.
 * Throws a LookupError with a user-facing explanation when it can't.
 */
export function parseQuery(input) {
  const raw = input.trim();
  if (!raw) {
    throw new LookupError(
      "empty",
      "Nothing to look up",
      "Enter an IP address (like 8.8.8.8) or a domain (like example.com).",
    );
  }
  if (/\s/.test(raw)) {
    throw invalid(raw);
  }

  const host = extractHost(raw);

  if (isIPv4(host)) return { kind: "ip", value: host };

  const v6 = normalizeIPv6(host);
  if (v6) return { kind: "ip", value: v6 };

  if (/^[\d.]+$/.test(host)) {
    throw new LookupError(
      "invalid",
      "Not a valid IPv4 address",
      `“${raw}” has the shape of an IPv4 address, but it needs four numbers from 0 to 255, like 203.0.113.7.`,
    );
  }

  if (host.toLowerCase() === "localhost") {
    throw new LookupError(
      "reserved",
      "That’s this device",
      "“localhost” always points back to the computer you’re using, so it has no public location.",
      { tone: "info" },
    );
  }

  const domain = normalizeDomain(host);
  if (domain) return { kind: "domain", value: domain };

  throw invalid(raw);
}

const invalid = (raw) =>
  new LookupError(
    "invalid",
    "Not an IP address or domain",
    `“${truncate(raw)}” isn’t something we can look up. Try an IP address like 8.8.8.8 or a domain like example.com.`,
  );

const truncate = (s, n = 48) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// --- Private and reserved ranges: explained locally, without spending an API call.

const v4ToInt = (ip) => ip.split(".").reduce((n, o) => n * 256 + Number(o), 0);

const V4_RANGES = [
  ["0.0.0.0", 8, "unspecified"],
  ["10.0.0.0", 8, "private"],
  ["100.64.0.0", 10, "shared"],
  ["127.0.0.0", 8, "loopback"],
  ["169.254.0.0", 16, "link-local"],
  ["172.16.0.0", 12, "private"],
  ["192.0.0.0", 24, "reserved"],
  ["192.0.2.0", 24, "documentation"],
  ["192.168.0.0", 16, "private"],
  ["198.18.0.0", 15, "benchmark"],
  ["198.51.100.0", 24, "documentation"],
  ["203.0.113.0", 24, "documentation"],
  ["224.0.0.0", 4, "multicast"],
  ["240.0.0.0", 4, "reserved"],
].map(([base, bits, type]) => [v4ToInt(base), bits, type]);

function v4Type(ip) {
  const n = v4ToInt(ip);
  for (const [base, bits, type] of V4_RANGES) {
    const size = 2 ** (32 - bits);
    if (n >= base && n < base + size) return type;
  }
  return null;
}

function expandV6(ip) {
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const fill = ip.includes("::") ? Array(8 - h.length - t.length).fill("0") : [];
  return [...h, ...fill, ...t].map((x) => parseInt(x || "0", 16));
}

function v6Type(ip) {
  const w = expandV6(ip);
  if (w.every((x) => x === 0)) return "unspecified";
  if (w.slice(0, 7).every((x) => x === 0) && w[7] === 1) return "loopback";
  if (w.slice(0, 5).every((x) => x === 0) && w[5] === 0xffff) {
    return v4Type(`${w[6] >> 8}.${w[6] & 255}.${w[7] >> 8}.${w[7] & 255}`);
  }
  if ((w[0] & 0xfe00) === 0xfc00) return "private";
  if ((w[0] & 0xffc0) === 0xfe80) return "link-local";
  if ((w[0] & 0xff00) === 0xff00) return "multicast";
  if (w[0] === 0x2001 && w[1] === 0x0db8) return "documentation";
  return null;
}

const RESERVED_COPY = {
  private: [
    "Private address",
    "is a private address. It only exists inside a local network (a home router, an office LAN), so it has no public location.",
  ],
  shared: [
    "Carrier-internal address",
    "belongs to a range internet providers use inside their own networks, so it has no public location.",
  ],
  loopback: [
    "That’s this device",
    "is a loopback address. It always points back to the computer you’re using, so it has no public location.",
  ],
  "link-local": [
    "Link-local address",
    "is only valid on a single network segment and is never routed on the internet, so it has no location.",
  ],
  multicast: [
    "Multicast address",
    "addresses a group of devices rather than a single host, so it has no location.",
  ],
  documentation: [
    "Documentation address",
    "is reserved for examples in documentation and is never used on the real internet.",
  ],
  benchmark: [
    "Benchmarking address",
    "is reserved for network testing and isn’t used on the public internet.",
  ],
  unspecified: ["Unspecified address", "means “no address”. It can’t be located."],
  reserved: ["Reserved address", "is in a reserved range that isn’t used on the public internet."],
};

/** Returns a LookupError for IPs that can never have a public location, else null. */
export function reservedError(ip) {
  const type = isIPv4(ip) ? v4Type(ip) : v6Type(ip);
  if (!type) return null;
  const [title, text] = RESERVED_COPY[type];
  return new LookupError("reserved", title, `${ip} ${text}`, { tone: "info" });
}
