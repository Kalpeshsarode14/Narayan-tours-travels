// Loads the Maps JavaScript API once, using Google's recommended dynamic library import.
import { PUBLIC_ENV } from "./env";

declare global {
  interface Window {
    google?: any;
  }
}

let bootstrapPromise: Promise<void> | null = null;

export class MapsUnavailableError extends Error {}

function bootstrap(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = new Promise<void>((resolve, reject) => {
    const key = PUBLIC_ENV.googleMapsBrowserKey;
    if (!key) {
      reject(new MapsUnavailableError("Google Maps key is not configured (VITE_GOOGLE_MAPS_BROWSER_KEY)."));
      return;
    }
    if (window.google?.maps?.importLibrary) return resolve();
    const cbName = `__nttMapsReady_${Date.now()}`;
    (window as any)[cbName] = () => {
      delete (window as any)[cbName];
      resolve();
    };
    // Google calls this if the key is invalid or a referrer is not allowed.
    (window as any).gm_authFailure = () => {
      reject(new MapsUnavailableError("Google Maps rejected the API key. Check the key's website restrictions."));
    };
    const params = new URLSearchParams({
      key,
      v: "weekly",
      loading: "async",
      language: "en-IN",
      region: "IN",
      callback: cbName,
    });
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => {
      bootstrapPromise = null;
      reject(new MapsUnavailableError("Could not load Google Maps. Check your internet connection."));
    };
    document.head.appendChild(s);
  });
  return bootstrapPromise;
}

export async function importLibrary<T = any>(name: "maps" | "places" | "marker" | "geometry" | "core"): Promise<T> {
  await bootstrap();
  return window.google.maps.importLibrary(name) as Promise<T>;
}
