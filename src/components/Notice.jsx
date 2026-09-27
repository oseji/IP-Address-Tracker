import { useState } from "react";
import Icon from "./Icon";
import Stamp from "./Stamp";

/**
 * Lookup failures and "no public location" answers. Keeps the last error
 * mounted while it collapses so the exit can animate.
 */
export default function Notice({ error, onRetry, onSelf, onDismiss }) {
  const [shown, setShown] = useState(error);
  if (error && error !== shown) setShown(error);
  const open = Boolean(error);
  const info = shown?.tone === "info";

  return (
    <div
      className="notice-wrap"
      data-open={open || undefined}
      aria-hidden={!open || undefined}
      inert={open ? undefined : ""}
    >
      <div className="notice-clip">
        {shown && (
          <div
            className="notice"
            data-tone={shown.tone}
            role={info ? "status" : "alert"}
            key={`${shown.code}:${shown.detail}`}
          >
            <div className="notice-head">
              <Stamp tone={info ? "ink" : "red"}>
                {info ? "No public location" : "Lookup failed"}
              </Stamp>
              <button
                type="button"
                className="icon-button notice-close"
                onClick={onDismiss}
                aria-label="Dismiss message"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <h2 className="notice-title">{shown.title}</h2>
            <p className="notice-detail">{shown.detail}</p>
            <div className="notice-actions">
              {shown.retry && (
                <button type="button" className="button" onClick={onRetry}>
                  <Icon name="retry" size={18} />
                  Try again
                </button>
              )}
              <button type="button" className="text-button" onClick={onSelf}>
                <Icon name="locate" size={18} />
                Show my IP instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
