import { LookupError } from "./errors";
import { parseOffset } from "./time";

// Env overrides exist for local testing against a mock; defaults are production.
const API_URL = import.meta.env.VITE_GEO_API_URL || "https://geo.ipify.org/api/v2/country,city";
const API_KEY = import.meta.env.VITE_IPIFY_KEY || "at_I75ZfnulXpsHjdbOoO4S5IQYHKYCO";
const TIMEOUT_MS = 12000;

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

const countryName = (code) => {
  if (!code || code === "ZZ") return "";
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
};

/** Cache key for a parsed query; `null` is the visitor's own connection. */
export const keyFor = (q) => (q ? `${q.kind}:${q.value}` : "self");

function normalize(data, q) {
  const loc = data.location ?? {};
  const hasCoords =
    Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && !(loc.lat === 0 && loc.lng === 0);
  if (!data.ip || !hasCoords) {
    const who = q?.value ?? data.ip ?? "this address";
    throw new LookupError(
      "no-location",
      "No location on record",
      `The lookup service knows ${who}, but has no location for it.`,
    );
  }
  return {
    key: keyFor(q),
    kind: q ? q.kind : "self",
    query: q?.value ?? null,
    ip: data.ip,
    city: loc.city || "",
    region: loc.region || "",
    country: loc.country || "",
    countryName: countryName(loc.country),
    postalCode: loc.postalCode || "",
    lat: loc.lat,
    lng: loc.lng,
    offset: parseOffset(loc.timezone),
    isp: data.isp || "",
    asn: data.as?.asn ? `AS${data.as.asn}` : "",
    asName: data.as?.name || "",
    route: data.as?.route || "",
    fetchedAt: Date.now(),
  };
}

function httpError(status, q) {
  if (status === 400 && q?.kind === "domain") {
    return new LookupError(
      "not-found",
      "Domain not found",
      `${q.value} doesn’t resolve to a public IP address. It may not exist, or it may be misspelled.`,
    );
  }
  if (status === 400 || status === 422) {
    return new LookupError(
      "rejected",
      "Lookup service rejected that",
      `The service couldn’t use “${q?.value ?? "that"}”. Check it and try again.`,
    );
  }
  if (status === 401 || status === 403) {
    return new LookupError(
      "denied",
      "Lookups are unavailable",
      "The lookup service refused the request: its API key is invalid or out of credits. This needs fixing on our side, not yours.",
    );
  }
  if (status === 429) {
    return new LookupError(
      "rate-limited",
      "Too many lookups",
      "The lookup service is limiting requests right now. Wait a minute, then try again.",
      { retry: true },
    );
  }
  return new LookupError(
    "server",
    "Lookup service error",
    `The lookup service had a problem (HTTP ${status}). Try again in a moment.`,
    { retry: true },
  );
}

/**
 * Looks up a parsed query (`null` = the visitor's own IP).
 * Rejects with LookupError, or AbortError if `signal` aborts.
 */
export async function fetchGeo(q, { signal } = {}) {
  const params = new URLSearchParams({ apiKey: API_KEY });
  if (q?.kind === "ip") params.set("ipAddress", q.value);
  if (q?.kind === "domain") params.set("domain", q.value);

  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, TIMEOUT_MS);
  const forward = () => ctrl.abort();
  signal?.addEventListener("abort", forward);

  try {
    let res;
    try {
      res = await fetch(`${API_URL}?${params}`, { signal: ctrl.signal });
    } catch (err) {
      if (timedOut) {
        throw new LookupError(
          "timeout",
          "Lookup timed out",
          `The lookup service didn’t answer within ${TIMEOUT_MS / 1000} seconds. Try again.`,
          { retry: true },
        );
      }
      if (signal?.aborted) throw err;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new LookupError(
          "offline",
          "You’re offline",
          "Reconnect to the internet, then try again.",
          { retry: true },
        );
      }
      throw new LookupError(
        "network",
        "Can’t reach the lookup service",
        "The connection failed. A content blocker can also block geo.ipify.org; if you use one, allow it for this site.",
        { retry: true },
      );
    }
    if (!res.ok) throw httpError(res.status, q);
    return normalize(await res.json(), q);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forward);
  }
}

// --- Cache: lookups cost API credits, and IP locations rarely change within a day.

const CACHE_KEY = "ipt:cache:v1";
const SELF_KEY = "ipt:self:v1";
const TTL = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 40;
const memory = new Map();

const read = (store, key) => {
  try {
    return JSON.parse(store.getItem(key)) ?? null;
  } catch {
    return null;
  }
};
const write = (store, key, value) => {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: memory cache still works */
  }
};

export function cached(key) {
  if (memory.has(key)) return memory.get(key);
  if (typeof window === "undefined") return null;
  // Own IP changes with the network, so it's only kept for this tab session.
  const hit =
    key === "self" ? read(sessionStorage, SELF_KEY) : read(localStorage, CACHE_KEY)?.[key];
  if (!hit || Date.now() - hit.fetchedAt > TTL) return null;
  memory.set(key, hit);
  return hit;
}

export function remember(result) {
  memory.set(result.key, result);
  if (result.key === "self") return write(sessionStorage, SELF_KEY, result);
  const all = read(localStorage, CACHE_KEY) ?? {};
  all[result.key] = result;
  const keep = Object.values(all)
    .filter((r) => Date.now() - r.fetchedAt < TTL)
    .sort((a, b) => b.fetchedAt - a.fetchedAt)
    .slice(0, MAX_ENTRIES);
  write(localStorage, CACHE_KEY, Object.fromEntries(keep.map((r) => [r.key, r])));
}
