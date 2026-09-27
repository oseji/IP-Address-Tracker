import CopyButton from "./CopyButton";
import Icon from "./Icon";
import { formatOffset, hoursOfDay, relativeToVisitor, timeAt } from "../lib/time";

const coords = (lat, lng) =>
  `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lng).toFixed(4)}° ${lng < 0 ? "W" : "E"}`;
const osmUrl = (lat, lng) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`;

// Values re-mount (and so re-animate) per result, not per clock tick.
const Value = ({ i, className = "", children }) => (
  <span className={`value ${className}`} style={{ "--i": i }}>
    {children}
  </span>
);

const Missing = () => (
  <span className="value-missing">
    <span aria-hidden="true">—</span>
    <span className="sr-only">Not available</span>
  </span>
);

/** A 24-hour scale where the gap between "there" and "you" is the time difference. */
function DayRuler({ there, you }) {
  const a = Math.min(there, you) / 24;
  const b = Math.max(there, you) / 24;
  return (
    <div className="ruler" aria-hidden="true">
      <div className="ruler-scale" />
      <div className="ruler-span" style={{ "--a": a, "--w": b - a }} />
      <div className="ruler-pos" style={{ "--pos": there / 24 }}>
        <span className="ruler-mark ruler-mark--there" data-flip={there > 19 || undefined}>
          There
        </span>
      </div>
      <div className="ruler-pos" style={{ "--pos": you / 24 }}>
        <span className="ruler-mark ruler-mark--you" data-flip={you > 19 || undefined}>
          You
        </span>
      </div>
      <div className="ruler-hours">
        {["00", "06", "12", "18", "24"].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <dl className="fields is-skeleton" aria-hidden="true">
      {["Local time", "Internet provider", "Network", "Route", "Coordinates"].map((label, i) => (
        <div
          className={`field ${i === 2 ? "field--left" : i === 3 ? "field--right" : "field--wide"}`}
          key={label}
        >
          <dt>{label}</dt>
          <dd>
            <span className="skeleton" style={{ width: `${[40, 70, 60, 75, 55][i]}%` }} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The ruled form: where / when / who, laid out like the back of a QSL card. */
export default function Fields({ result, now, loading, stale, onCopied }) {
  if (!result) return loading ? <Skeleton /> : null;
  const t = result.offset !== null ? timeAt(result.offset, now) : null;

  return (
    <dl
      className="fields"
      key={`${result.key}:${result.fetchedAt}`}
      data-loading={loading || undefined}
      data-stale={stale || undefined}
    >
      <div className="field field--wide field--time">
        <dt>Local time</dt>
        <dd>
          {t ? (
            <>
              <Value i={0} className="time">
                <span className="time-clock">{t.time}</span>
                <span className="time-day">{t.day}</span>
              </Value>
              <Value i={1} className="field-note">
                {formatOffset(result.offset)} · {relativeToVisitor(result.offset, now)}
              </Value>
              <DayRuler there={t.hours} you={hoursOfDay(now)} />
            </>
          ) : (
            <Missing />
          )}
        </dd>
      </div>

      <div className="field field--wide">
        <dt>Internet provider</dt>
        <dd>{result.isp ? <Value i={2}>{result.isp}</Value> : <Missing />}</dd>
      </div>

      <div className="field field--left">
        <dt>Network</dt>
        <dd>
          {result.asn ? (
            <>
              <Value i={3}>{result.asn}</Value>
              {result.asName && (
                <Value i={3} className="field-note">
                  {result.asName}
                </Value>
              )}
            </>
          ) : (
            <Missing />
          )}
        </dd>
      </div>

      <div className="field field--right">
        <dt>Route</dt>
        <dd>{result.route ? <Value i={4}>{result.route}</Value> : <Missing />}</dd>
      </div>

      <div className="field field--wide">
        <dt>Coordinates</dt>
        <dd className="field-coords">
          <Value i={5}>{coords(result.lat, result.lng)}</Value>
          <span className="field-actions">
            <CopyButton
              text={`${result.lat}, ${result.lng}`}
              label="Copy coordinates"
              onCopied={onCopied}
            />
            <a
              className="icon-button"
              href={osmUrl(result.lat, result.lng)}
              target="_blank"
              rel="noreferrer"
              title="Open in OpenStreetMap"
              aria-label="Open in OpenStreetMap (new tab)"
            >
              <Icon name="external" size={18} />
            </a>
          </span>
        </dd>
      </div>
    </dl>
  );
}
