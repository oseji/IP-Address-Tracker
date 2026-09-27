import { useCallback, useEffect, useRef, useState } from "react";
import { parseQuery, reservedError } from "../lib/query";
import { fetchGeo, cached, remember, keyFor } from "../lib/geo";
import { LookupError } from "../lib/errors";

const urlQuery = () => new URLSearchParams(window.location.search).get("q");

function syncUrl(result, mode) {
  if (mode === "none") return;
  const url = new URL(window.location.href);
  if (result.kind === "self") url.searchParams.delete("q");
  else url.searchParams.set("q", result.query);
  if (url.href === window.location.href) return;
  window.history[mode === "replace" ? "replaceState" : "pushState"]({}, "", url);
}

/**
 * Lookup state machine. `result` is the last success and survives errors,
 * so the UI can show it as stale instead of silently keeping it.
 */
export function useLookup({ onResult } = {}) {
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(() => ({ label: urlQuery() }));
  const [error, setError] = useState(null);
  const lastInput = useRef(null);
  const inflight = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // `input` is raw text, or null for the visitor's own connection.
  const lookup = useCallback(async (input, { history = "push" } = {}) => {
    inflight.current?.abort();
    inflight.current = null;
    lastInput.current = input;

    let q = null;
    if (input !== null) {
      try {
        q = parseQuery(input);
      } catch (err) {
        setPending(null);
        setError(err);
        return;
      }
      const reserved = q.kind === "ip" && reservedError(q.value);
      if (reserved) {
        setPending(null);
        setError(reserved);
        return;
      }
    }

    const settle = (res) => {
      setResult(res);
      setError(null);
      setPending(null);
      syncUrl(res, history);
      onResultRef.current?.(res);
    };

    const hit = cached(keyFor(q));
    if (hit) return settle(hit);

    const ctrl = new AbortController();
    inflight.current = ctrl;
    setError(null);
    setPending({ label: q?.value ?? null });
    try {
      const res = await fetchGeo(q, { signal: ctrl.signal });
      remember(res);
      if (!ctrl.signal.aborted) settle(res);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setPending(null);
      setError(
        err instanceof LookupError
          ? err
          : new LookupError(
              "unknown",
              "Something went wrong",
              "The lookup failed unexpectedly. Try again.",
              { retry: true },
            ),
      );
    } finally {
      if (inflight.current === ctrl) inflight.current = null;
    }
  }, []);

  const retry = useCallback(() => lookup(lastInput.current), [lookup]);
  const dismiss = useCallback(() => setError(null), []);

  // First load reads ?q=, then back/forward replays history (usually from cache).
  useEffect(() => {
    lookup(urlQuery(), { history: "replace" });
    const onPop = () => lookup(urlQuery(), { history: "none" });
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      inflight.current?.abort();
    };
  }, [lookup]);

  return { result, pending, error, lookup, retry, dismiss };
}
