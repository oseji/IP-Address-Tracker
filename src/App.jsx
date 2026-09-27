import { useCallback, useEffect, useRef, useState } from "react";
import SearchForm from "./components/SearchForm";
import Notice from "./components/Notice";
import Record from "./components/Record";
import Fields from "./components/Fields";
import Logbook from "./components/Logbook";
import LookupMap from "./components/LookupMap";
import Icon from "./components/Icon";
import { useLookup } from "./hooks/useLookup";
import { useRecents } from "./hooks/useRecents";
import { useTheme } from "./hooks/useTheme";
import { useMediaQuery, useMinuteClock, useReducedMotion } from "./hooks/useMedia";
import { isInputError } from "./lib/errors";

const describe = (r) => {
  const place = [r.city, r.region, r.countryName].filter(Boolean).join(", ") || "an unknown place";
  const subject =
    r.kind === "self" ? "Your connection" : r.kind === "domain" ? `${r.query} (${r.ip})` : r.ip;
  return `${subject} is in ${place}.`;
};

function App() {
  const reducedMotion = useReducedMotion();
  const split = useMediaQuery("(min-width: 56.25em)");
  const now = useMinuteClock();
  const { theme, toggle } = useTheme(reducedMotion);
  const { items: recentItems, add: addRecent, clear: clearRecents } = useRecents();
  const inputRef = useRef(null);
  const [input, setInput] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
  );
  const [announcement, setAnnouncement] = useState("");

  const onResult = useCallback(
    (res) => {
      addRecent(res);
      setInput(res.query ?? "");
      setAnnouncement(describe(res));
    },
    [addRecent],
  );
  const { result, pending, error, lookup, retry, dismiss } = useLookup({ onResult });

  const inputError = isInputError(error) ? error : null;
  const notice = error && !inputError ? error : null;
  const loading = Boolean(pending);
  const stale = Boolean(notice && result);

  // Name the tab (and history entries) after the current result.
  useEffect(() => {
    const place = result && (result.city || result.region || result.countryName);
    document.title = result
      ? `${result.query ?? result.ip}${place ? ` · ${place}` : ""} — IP Address Tracker`
      : "IP Address Tracker";
  }, [result]);

  // "/" jumps to the search field from anywhere that isn't already a text field.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lookupSelf = () => {
    setInput("");
    lookup(null);
  };

  return (
    <div className="app">
      <header className="masthead">
        <h1 className="wordmark">
          <svg className="wordmark-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4.5" />
          </svg>
          IP Address Tracker
        </h1>
        <button
          type="button"
          className="icon-button theme-toggle"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </header>

      <SearchForm
        ref={inputRef}
        value={input}
        onChange={(v) => {
          setInput(v);
          if (inputError) dismiss();
        }}
        onSubmit={(v) => lookup(v)}
        onSelf={lookupSelf}
        busy={loading}
        busyLabel={pending?.label}
        inputError={inputError}
      />

      <Notice error={notice} onRetry={retry} onSelf={lookupSelf} onDismiss={dismiss} />

      <Record
        result={result}
        loading={loading}
        stale={stale}
        onCopied={() => setAnnouncement("IP address copied.")}
      />

      <LookupMap
        result={result}
        loading={loading}
        stale={stale}
        reducedMotion={reducedMotion}
        interactive={split}
      />

      <Fields
        result={result}
        now={now}
        loading={loading}
        stale={stale}
        onCopied={() => setAnnouncement("Coordinates copied.")}
      />

      <Logbook
        items={recentItems}
        activeKey={stale ? null : result?.key}
        now={now}
        onSelect={(q) => lookup(q)}
        onClear={clearRecents}
        reducedMotion={reducedMotion}
      />

      <footer className="colophon">
        <p>
          Locations are approximate, usually to the nearest city. Geolocation by{" "}
          <a href="https://geo.ipify.org" target="_blank" rel="noreferrer">
            IPify
          </a>
          .
        </p>
      </footer>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

export default App;
