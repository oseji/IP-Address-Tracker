import { forwardRef, useEffect, useState } from "react";
import Icon, { SignalIcon } from "./Icon";

/**
 * Labeled lookup field. Input errors (empty / malformed) render inline and
 * are tied to the field with aria-describedby; the shake replays per attempt.
 */
const SearchForm = forwardRef(function SearchForm(
  { value, onChange, onSubmit, onSelf, busy, busyLabel, inputError },
  ref,
) {
  // Each rejected submit is a new error object; alternate keyframes to replay.
  const [shake, setShake] = useState(0);
  useEffect(() => {
    if (inputError) setShake((n) => n + 1);
  }, [inputError]);

  const hint = busy
    ? busyLabel
      ? `Looking up ${busyLabel}…`
      : "Finding your connection…"
    : "IPv4, IPv6, or a domain name. Press / to jump here.";

  return (
    <form
      className="search"
      role="search"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label className="search-label" htmlFor="lookup">
        Look up an IP address or domain
      </label>
      <div
        className="search-row"
        data-invalid={inputError ? "" : undefined}
        data-shake={shake ? shake % 2 : undefined}
      >
        <input
          ref={ref}
          id="lookup"
          name="q"
          type="text"
          inputMode="url"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. 8.8.8.8 or example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              onChange("");
            }
          }}
          aria-invalid={inputError ? true : undefined}
          aria-describedby="lookup-hint"
        />
        <button className="search-submit" type="submit" aria-busy={busy || undefined}>
          <span>{busy ? "Looking up" : "Look up"}</span>
          {busy ? <SignalIcon /> : <Icon name="arrow" />}
        </button>
      </div>
      <p
        id="lookup-hint"
        className="search-hint"
        data-tone={inputError ? "error" : undefined}
        aria-live="polite"
      >
        {inputError ? inputError.detail : hint}
      </p>
      <button className="text-button search-self" type="button" onClick={onSelf}>
        <Icon name="locate" size={18} />
        Use my IP address
      </button>
    </form>
  );
});

export default SearchForm;
