import { useCallback, useState } from "react";

const KEY = "ipt:recents:v1";
const MAX = 8;

const load = () => {
  try {
    const items = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(items) ? items.slice(0, MAX) : [];
  } catch {
    return [];
  }
};

const save = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode: the list just won't persist */
  }
};

/** Explicit lookups only (not the visitor's own IP), newest first, capped. */
export function useRecents() {
  const [items, setItems] = useState(load);

  const add = useCallback((res) => {
    if (res.kind === "self") return;
    setItems((prev) => {
      const entry = {
        key: res.key,
        query: res.query,
        kind: res.kind,
        ip: res.ip,
        place: [res.city || res.region, res.country].filter(Boolean).join(", "),
        at: Date.now(),
      };
      const next = [entry, ...prev.filter((p) => p.key !== res.key)].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    save([]);
    setItems([]);
  }, []);

  return { items, add, clear };
}
