import { useEffect, useRef, useState } from "react";
import { loadOlaMaps } from "./ola-maps";
import { PUBLIC_ENV } from "./env";
import { formatDuration } from "../../lib/booking/fare-engine";
import { decodeRoutePolyline } from "../../lib/booking/polyline";
import type { LatLng, PlaceSelection } from "../../lib/booking/types";

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

const MAHARASHTRA: [number, number] = [73.4, 19.2]; // [lng, lat]
const ROUTE_ID = "ntt-route";

function pinElement(label: string, color: string, title: string) {
  const el = document.createElement("div");
  el.className = "ntt-pin";
  el.style.background = color;
  el.textContent = label;
  el.title = title;
  return el;
}

/** Interactive Ola map (MapLibre) with pickup/stops/drop pins and the server-computed route line. */
export default function RouteMap({ pickup, drop, stops, encodedPolyline, distanceKm, durationMinutes, loading, compact }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sdkRef = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const OlaMaps = await loadOlaMaps();
        if (cancelled || !el.current) return;
        const ola = new OlaMaps({ apiKey: PUBLIC_ENV.olaMapsBrowserKey });
        sdkRef.current = OlaMaps;
        const map = await ola.init({
          style: PUBLIC_ENV.olaMapsStyle,
          container: el.current,
          center: MAHARASHTRA,
          zoom: 6.5,
        });
        if (cancelled) return;
        mapRef.current = map;
        map.on?.("error", (e: any) => console.warn("[map]", e?.error?.message || e));
        const markReady = () => !cancelled && setReady(true);
        if (map.loaded?.() || map.isStyleLoaded?.()) markReady();
        else map.on("load", markReady);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Map could not be loaded.");
      }
    })();
    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const OlaMaps = sdkRef.current;
    if (!ready || !map || !OlaMaps) return;
    try {
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      const Marker = OlaMaps.Marker || (window as any).OlaMaps?.Marker;
      const pts: LatLng[] = [];
      const add = (p: PlaceSelection, label: string, color: string, title: string) => {
        pts.push(p.location);
        if (!Marker) return;
        const m = new Marker({ element: pinElement(label, color, `${title}: ${p.address}`), anchor: "center" })
          .setLngLat([p.location.lng, p.location.lat])
          .addTo(map);
        markers.current.push(m);
      };
      if (pickup) add(pickup, "A", "#16a34a", "Pickup");
      stops.forEach((s, i) => add(s, String(i + 1), "#f59e0b", `Stop ${i + 1}`));
      if (drop) add(drop, "B", "#dc2626", "Drop-off");

      // Route line
      const line = encodedPolyline && pickup ? decodeRoutePolyline(encodedPolyline, pickup.location) : [];
      const data = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: line.map((p) => [p.lng, p.lat]) },
      };
      if (map.getSource?.(ROUTE_ID)) map.getSource(ROUTE_ID).setData(data);
      else {
        map.addSource(ROUTE_ID, { type: "geojson", data });
        map.addLayer({
          id: ROUTE_ID + "-casing",
          type: "line",
          source: ROUTE_ID,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#0a1834", "line-width": 9, "line-opacity": 0.35 },
        });
        map.addLayer({
          id: ROUTE_ID,
          type: "line",
          source: ROUTE_ID,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#1d4ed8", "line-width": 5 },
        });
      }
      line.forEach((p) => pts.push(p));

      if (pts.length >= 2) {
        const lngs = pts.map((p) => p.lng);
        const lats = pts.map((p) => p.lat);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 48, maxZoom: 15, duration: 600 }
        );
      } else if (pts.length === 1) {
        map.flyTo?.({ center: [pts[0].lng, pts[0].lat], zoom: 14, duration: 600 });
      }
    } catch (e) {
      console.warn("[map] draw failed", e);
      setError("Could not draw the route on the map.");
    }
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
