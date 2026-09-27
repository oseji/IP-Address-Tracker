import Callsign from "./Callsign";
import CopyButton from "./CopyButton";
import Stamp from "./Stamp";

const KIND = { self: "Your connection", ip: "IP lookup", domain: "Domain lookup" };

function Place({ result }) {
  const local = [result.city, result.region !== result.city && result.region]
    .filter(Boolean)
    .join(", ");
  const primary = local || result.countryName || "Unknown place";
  const secondary = [local && result.countryName, result.postalCode].filter(Boolean).join(" · ");
  return (
    <div className="place" key={`${result.key}:${result.fetchedAt}`}>
      <p className="place-name">{primary}</p>
      {secondary && <p className="place-sub">{secondary}</p>}
    </div>
  );
}

/** The card's "callsign" block: status stamp, the address, and where it is. */
export default function Record({ result, loading, stale, onCopied }) {
  const stamp = !result
    ? { tone: "ink", text: loading ? "Locating" : "No result yet" }
    : stale
      ? { tone: "ink", text: "Previous lookup" }
      : { tone: "blue", text: KIND[result.kind] };

  return (
    <section
      className="record"
      aria-labelledby="record-title"
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      data-stale={stale || undefined}
    >
      <h2 id="record-title" className="sr-only">
        Lookup result
      </h2>
      <span className="progress" aria-hidden="true" />
      <div className="record-stamp">
        <Stamp tone={stamp.tone} key={`${stamp.text}:${result?.fetchedAt}`}>
          {stamp.text}
        </Stamp>
      </div>

      {result?.kind === "domain" && (
        <p className="record-resolved" key={result.key}>
          <span>{result.query}</span> resolves to
        </p>
      )}

      <div className="record-address">
        {result && <p className="sr-only">IP address {result.ip}</p>}
        <Callsign value={result?.ip ?? null}>
          {result && <CopyButton text={result.ip} label="Copy IP address" onCopied={onCopied} />}
        </Callsign>
      </div>

      {result ? (
        <Place result={result} />
      ) : (
        loading && (
          <div className="place" aria-hidden="true">
            <p className="place-name skeleton" style={{ width: "62%" }} />
            <p className="place-sub skeleton" style={{ width: "38%" }} />
          </div>
        )
      )}
    </section>
  );
}
