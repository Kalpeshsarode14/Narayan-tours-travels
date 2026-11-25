import { useEffect, useRef, useState } from "react";
import { importLibrary } from "./google-maps";
import { PUBLIC_ENV } from "./env";
import { formatDuration } from "../../lib/booking/fare-engine";
import type { PlaceSelection } from "../../lib/booking/types";

interface Props {
  pickup: PlaceSelection | null;
  drop: PlaceSelection | null;
  stops: PlaceSelection[];
  encodedPolyline?: string;
  distanceKm?: number;
  durationMinutes?: number;
  loading?: boolean;
  compact?: boolean;
}

const INDIA_CENTER = { lat: 19.2, lng: 73.4 }; // Maharashtra

/** Interactive Google Map with pickup/stops/drop markers and the server-computed route line. */
export default function RouteMap({ pickup, drop, stops, encodedPolyline, distanceKm, durationMinutes, loading, compact }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Map } = await importLibrary("maps");
        if (cancelled || !el.current) return;
        mapRef.current = new Map(el.current, {
          center: INDIA_CENTER,
          zoom: 7,
          mapId: PUBLIC_ENV.googleMapsMapId,
          gestureHandling: "cooperative",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        });
        setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Map could not be loaded.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const [{ AdvancedMarkerElement, PinElement }, geometry, core] = await Promise.all([
        importLibrary("marker"),
        encodedPolyline ? importLibrary("geometry") : Promise.resolve(null),
        importLibrary("core"),
      ]);
      const { Polyline } = await importLibrary("maps");
      if (cancelled) return;
      overlays.current.forEach((o) => (o.setMap ? o.setMap(null) : (o.map = null)));
      overlays.current = [];
      const map = mapRef.current;
      const bounds = new core.LatLngBounds();
      const mark = (p: PlaceSelection, label: string, bg: string, title: string) => {
        const pin = new PinElement({ glyphText: label, background: bg, borderColor: "#ffffff", glyphColor: "#ffffff", scale: 1.1 });
        const m = new AdvancedMarkerElement({ map, position: p.location, content: pin.element ?? pin, title: `${title}: ${p.address}` });
        overlays.current.push(m);
        bounds.extend(p.location);
      };
      if (pickup) mark(pickup, "A", "#16a34a", "Pickup");
      stops.forEach((s, i) => mark(s, String(i + 1), "#f59e0b", `Stop ${i + 1}`));
      if (drop) mark(drop, "B", "#dc2626", "Drop-off");

      if (encodedPolyline && geometry) {
        const path = geometry.encoding.decodePath(encodedPolyline);
        const casing = new Polyline({ map, path, strokeColor: "#0a1834", strokeOpacity: 0.35, strokeWeight: 9 });
        const line = new Polyline({ map, path, strokeColor: "#1d4ed8", strokeOpacity: 1, strokeWeight: 5 });
        overlays.current.push(casing, line);
        path.forEach((pt: any) => bounds.extend(pt));
      }
      if (!bounds.isEmpty()) {
        if (pickup && drop) map.fitBounds(bounds, 48);
        else {
          map.setCenter(bounds.getCenter());
          map.setZoom(14);
        }
      }
    })().catch(() => setError("Could not draw the route on the map."));
    return () => {
      cancelled = true;
    };
  }, [ready, pickup?.placeId, drop?.placeId, stops.map((s) => s.placeId).join(","), encodedPolyline]);

  return (
    <div className={`ntt-map-card ${compact ? "compact" : ""}`}>
      <div className="ntt-map" ref={el} role="region" aria-label="Route map">
        {error && (
          <div className="ntt-map-fallback">
            <strong>Map unavailable</strong>
            <span>{error}</span>
          </div>
        )}
        {!error && !ready && <div className="ntt-map-fallback">Loading map…</div>}
      </div>
      {(distanceKm != null || loading) && (
        <div className="ntt-route-stats" aria-live="polite">
          {loading ? (
            <span className="ntt-muted">Calculating route…</span>
          ) : (
            <>
              <div>
                <span className="ntt-stat-label">Distance</span>
                <strong>{distanceKm} km</strong>
              </div>
              <div>
                <span className="ntt-stat-label">Est. travel time</span>
                <strong>{formatDuration(durationMinutes || 0)}</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
