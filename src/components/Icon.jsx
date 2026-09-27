// One stroke weight, one grid: every icon is drawn on 24×24 at 1.75.
const paths = {
  arrow: <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
      <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  check: <path className="icon-check" d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M19.5 14.2A7.5 7.5 0 0 1 9.8 4.5a7.5 7.5 0 1 0 9.7 9.7z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  recenter: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  external: (
    <path d="M13.5 4.5h6v6M19.5 4.5l-8 8M17.5 14v4.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H10" />
  ),
  retry: <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4.5v4h4" />,
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

/** Three arcs radiating from a point: the "transmitting" state of a lookup. */
export function SignalIcon({ size = 20 }) {
  return (
    <svg
      className="icon icon-signal"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <path className="arc arc-1" d="M5 14a5 5 0 0 1 5 5" />
      <path className="arc arc-2" d="M5 9.5a9.5 9.5 0 0 1 9.5 9.5" />
      <path className="arc arc-3" d="M5 5a14 14 0 0 1 14 14" />
    </svg>
  );
}
