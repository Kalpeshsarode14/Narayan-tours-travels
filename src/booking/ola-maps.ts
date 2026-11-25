// Loads the Ola Maps Web SDK (v2, MapLibre-based) once, from its CDN.
// Docs: https://maps.olakrutrim.com/krutrim/docs/sdks/web-sdk/latest/setup
import { PUBLIC_ENV } from "./env";

// Pinned version so a new SDK release can't change the site unexpectedly. Update deliberately.
const SDK_URL = "https://unpkg.com/olamaps-web-sdk@1.4.0/dist/olamaps-web-sdk.umd.js";

export class MapsUnavailableError extends Error {}

let loading: Promise<any> | null = null;

/** Resolves to the OlaMaps class (the UMD bundle exposes it as window.OlaMaps or window.OlaMaps.OlaMaps). */
export function loadOlaMaps(): Promise<any> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    if (!PUBLIC_ENV.olaMapsBrowserKey) {
      reject(new MapsUnavailableError("Map key is not configured (VITE_OLA_MAPS_API_KEY)."));
      return;
    }
    const pick = () => {
      const g = (window as any).OlaMaps;
      return typeof g === "function" ? g : g?.OlaMaps;
    };
    if (pick()) return resolve(pick());
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => (pick() ? resolve(pick()) : reject(new MapsUnavailableError("Map could not be started.")));
    s.onerror = () => {
      loading = null;
      reject(new MapsUnavailableError("Could not load the map. Check your internet connection."));
    };
    document.head.appendChild(s);
  });
  return loading;
}
