import { useLayoutEffect, useRef } from "react";
import { localClock } from "../lib/time";

const sameDay = (a, b) => a.toDateString() === b.toDateString();
const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const when = (ts, now) => {
  const d = new Date(ts);
  return sameDay(d, now) ? localClock(d) : shortDate.format(d);
};

/** Recent lookups, newest first. Rows glide to their new slots (FLIP). */
export default function Logbook({ items, activeKey, now, onSelect, onClear, reducedMotion }) {
  const list = useRef(null);
  const tops = useRef(new Map());

  useLayoutEffect(() => {
    const rows = list.current ? [...list.current.children] : [];
    const next = new Map();
    for (const row of rows) {
      const key = row.dataset.key;
      const top = row.offsetTop;
      next.set(key, top);
      if (reducedMotion) continue;
      const before = tops.current.get(key);
      if (before === undefined) {
        if (tops.current.size)
          row.animate(
            [
              { clipPath: "inset(0 100% 0 0)", opacity: 0 },
              { clipPath: "inset(0 0 0 0)", opacity: 1 },
            ],
            { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          );
      } else if (before !== top) {
        row.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], {
          duration: 380,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        });
      }
    }
    tops.current = next;
  }, [items, reducedMotion]);

  return (
    <section className="log" aria-labelledby="log-title">
      <div className="log-head">
        <h2 id="log-title" className="label">
          Recent lookups
        </h2>
        {items.length > 0 && (
          <button type="button" className="text-button text-button--small" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="log-empty">
          Addresses and domains you look up are listed here, so you can return to them in one click.
          They stay in this browser.
        </p>
      ) : (
        <ol className="log-list" ref={list}>
          {items.map((it) => (
            <li key={it.key} data-key={it.key}>
              <button
                type="button"
                className="log-row"
                aria-current={it.key === activeKey || undefined}
                onClick={() => onSelect(it.query)}
              >
                <span className="log-query">{it.query}</span>
                <span className="log-place">
                  {it.place || "Unknown place"}
                  {it.kind === "domain" && <span className="log-ip"> · {it.ip}</span>}
                </span>
                <time className="log-time" dateTime={new Date(it.at).toISOString()}>
                  {when(it.at, now)}
                </time>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
