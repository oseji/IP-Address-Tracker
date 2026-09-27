import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "./Icon";

// One light tile set for both themes; theme and ink tint are CSS filters,
// so switching theme never re-downloads tiles.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const WORLD = [24, 10];
const ZOOM = 11; // IP geolocation is city-level; closer zooms would overstate precision.

const escape = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const pinLabel = (r) =>
  [r.city || r.region || r.countryName, r.city || r.region ? r.country : ""]
    .filter(Boolean)
    .join(", ");

function pinIcon(result, phase) {
  return L.divIcon({
    className: "pin-anchor",
    iconSize: [0, 0],
    html: `<div class="pin" data-phase="${phase}">
      <span class="pin-area"></span>
      <span class="pin-ring"></span><span class="pin-ring"></span>
      <span class="pin-dot"></span>
      <span class="pin-label">${escape(pinLabel(result))}</span>
    </div>`,
  });
}

/** Moves the camera for each new result and reports when it has arrived. */
function Director({ result, reducedMotion, interactive, onDepart, onArrive }) {
  const map = useMap();
  const awaiting = useRef(false);
  const first = useRef(true);
  const cb = useRef({ onDepart, onArrive });
  cb.current = { onDepart, onArrive };

  useEffect(() => {
    const onEnd = () => {
      if (!awaiting.current) return;
      awaiting.current = false;
      cb.current.onArrive(false);
    };
    map.on("moveend", onEnd);
    return () => map.off("moveend", onEnd);
  }, [map]);

  useEffect(() => {
    const touchOnly = window.matchMedia("(pointer: coarse)").matches;
    if (interactive) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
    // Stacked phone layout: one-finger drags scroll the page, pinch still zooms.
    if (interactive || !touchOnly) map.dragging.enable();
    else map.dragging.disable();
  }, [map, interactive]);

  useEffect(() => {
    if (!result) return;
    const target = L.latLng(result.lat, result.lng);
    const from = map.getCenter();
    const isFirst = first.current;
    first.current = false;

    const samePlace =
      map.getZoom() === ZOOM &&
      map.latLngToContainerPoint(target).distanceTo(map.latLngToContainerPoint(from)) < 2;
    if (samePlace) {
      cb.current.onArrive(false);
      return;
    }
    if (reducedMotion) {
      map.setView(target, ZOOM, { animate: false });
      cb.current.onArrive(true);
      return;
    }
    const km = from.distanceTo(target) / 1000;
    const duration = isFirst ? 2.4 : Math.min(2.4, 0.9 + km / 5000);
    awaiting.current = true;
    cb.current.onDepart();
    map.flyTo(target, ZOOM, { duration, easeLinearity: 0.15 });
  }, [map, result, reducedMotion]);

  return null;
}

export default function LookupMap({ result, loading, stale, reducedMotion, interactive }) {
  const [map, setMap] = useState(null);
  const [pin, setPin] = useState(null); // { result, phase: landing | leaving | still }
  const frame = useRef(null);
  const resultRef = useRef(result);
  resultRef.current = result;

  const icon = useMemo(() => pin && pinIcon(pin.result, pin.phase), [pin]);
  const label = result ? `Map centred on ${pinLabel(result)}` : "World map";

  // MapContainer only forwards className/id/style, so name the region directly.
  useEffect(() => {
    const el = map?.getContainer();
    if (!el) return;
    el.setAttribute("role", "region");
    el.setAttribute("aria-roledescription", "map");
    el.setAttribute("aria-label", label);
  }, [map, label]);

  return (
    <div className="map-region" data-loading={loading || undefined} data-stale={stale || undefined}>
      <div className="map-frame" ref={frame}>
        <MapContainer
          ref={setMap}
          className="map"
          center={WORLD}
          zoom={2}
          minZoom={2}
          zoomControl={false}
          scrollWheelZoom={false}
          worldCopyJump
        >
          <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
          <Director
            result={result}
            reducedMotion={reducedMotion}
            interactive={interactive}
            onDepart={() => setPin((p) => p && { ...p, phase: "leaving" })}
            onArrive={(jump) => {
              setPin({ result: resultRef.current, phase: jump ? "still" : "landing" });
              // Reduced motion: a cut instead of a flight, softened by a short fade.
              if (jump)
                frame.current?.animate([{ opacity: 0.2 }, { opacity: 1 }], {
                  duration: 360,
                  easing: "ease-out",
                });
            }}
          />
          {pin && (
            <Marker
              position={[pin.result.lat, pin.result.lng]}
              icon={icon}
              keyboard={false}
              interactive={false}
            />
          )}
        </MapContainer>
      </div>

      <div className="map-controls" role="group" aria-label="Map controls">
        <button type="button" onClick={() => map?.zoomIn()} aria-label="Zoom in" title="Zoom in">
          <Icon name="plus" />
        </button>
        <button type="button" onClick={() => map?.zoomOut()} aria-label="Zoom out" title="Zoom out">
          <Icon name="minus" />
        </button>
        <button
          type="button"
          disabled={!result}
          onClick={() =>
            result &&
            map?.flyTo([result.lat, result.lng], ZOOM, { animate: !reducedMotion, duration: 0.8 })
          }
          aria-label="Recenter on result"
          title="Recenter on result"
        >
          <Icon name="recenter" />
        </button>
      </div>
    </div>
  );
}
