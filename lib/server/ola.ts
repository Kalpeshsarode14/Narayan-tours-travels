// Server-side Ola Maps client. The server key (OLA_MAPS_API_KEY) never reaches the browser.
// API reference: https://maps.olakrutrim.com/krutrim/apidocs (OpenAPI: /openapi/ola-maps-apis-oas.yaml)
import { randomUUID } from "node:crypto";
import type { LatLng, PlaceSelection, RouteInfo } from "../booking/types.js";
import { env, HttpError } from "./http.js";

const BASE = "https://api.olamaps.io";

// Bias searches toward Mumbai/Maharashtra; places anywhere in India are still returned.
const SEARCH_BIAS = "19.0760,72.8777";

async function ola<T>(method: "GET" | "POST", path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", env("OLA_MAPS_API_KEY"));
  let res: Response;
  try {
    res = await fetch(url, { method, headers: { "X-Request-Id": randomUUID() }, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new HttpError(502, "maps_unreachable", "Map service is not responding. Please try again.");
  }
  if (res.status === 401 || res.status === 403) {
    console.error("[ola] auth failed", res.status, await res.text().catch(() => ""));
    throw new HttpError(503, "maps_auth", "Map service is not configured correctly. Please call us to book.");
  }
  if (res.status === 429) throw new HttpError(503, "maps_quota", "Map service is busy. Please try again in a minute.");
  if (!res.ok) {
    console.error("[ola]", path, res.status, await res.text().catch(() => ""));
    throw new HttpError(502, "maps_error", "Map service error. Please try again.");
  }
  return (await res.json()) as T;
}

export interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
  description: string;
  location: LatLng | null;
}

interface AutocompleteResponse {
  status?: string;
  predictions?: Array<{
    place_id?: string;
    description?: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

export async function autocomplete(input: string): Promise<Suggestion[]> {
  const data = await ola<AutocompleteResponse>("GET", "/places/v1/autocomplete", {
    input,
    location: SEARCH_BIAS,
    language: "en",
  });
  return (data.predictions || [])
    .filter((p) => p.place_id)
    .slice(0, 6)
    .map((p) => {
      const lat = p.geometry?.location?.lat;
      const lng = p.geometry?.location?.lng;
      return {
        placeId: p.place_id!,
        main: p.structured_formatting?.main_text || p.description?.split(",")[0] || "",
        secondary: p.structured_formatting?.secondary_text || "",
        description: p.description || "",
        location: typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null,
      };
    });
}

interface DetailsResponse {
  status?: string;
  result?: {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  };
}

/** Authoritative name/address/coordinates for a place ID, so customers can't fake coordinates. */
export async function placeDetails(placeId: string): Promise<PlaceSelection> {
  const data = await ola<DetailsResponse>("GET", "/places/v1/details", { place_id: placeId });
  const r = data.result;
  const lat = r?.geometry?.location?.lat;
  const lng = r?.geometry?.location?.lng;
  if (!r || typeof lat !== "number" || typeof lng !== "number") {
    throw new HttpError(422, "bad_place", "We couldn't find one of the selected locations. Please select it again.");
  }
  return {
    placeId,
    name: r.name || "",
    address: r.formatted_address || r.name || "",
    location: { lat, lng },
  };
}

interface DirectionsResponse {
  status?: string;
  routes?: Array<{
    legs?: Array<{ distance?: number; duration?: number }>;
    overview_polyline?: string | { points?: string };
  }>;
}

const ll = (p: LatLng) => `${p.lat},${p.lng}`;

/**
 * Driving route via the Directions API.
 * (Directions *Basic* returns unrealistic ETAs, e.g. ~10 hours for Mumbai→Lonavala,
 * so we use the full endpoint with traffic metadata off.)
 */
export async function route(points: LatLng[]): Promise<RouteInfo> {
  const [origin, ...rest] = points;
  const destination = rest.pop()!;
  const params: Record<string, string> = {
    origin: ll(origin),
    destination: ll(destination),
    alternatives: "false",
    steps: "false",
    overview: "full",
    language: "en",
    traffic_metadata: "false",
  };
  if (rest.length) params.waypoints = rest.map(ll).join("|");
  const data = await ola<DirectionsResponse>("POST", "/routing/v1/directions", params);
  const r = data.routes?.[0];
  const legs = r?.legs || [];
  const distanceMeters = legs.reduce((s, l) => s + (Number(l.distance) || 0), 0);
  const durationSeconds = legs.reduce((s, l) => s + (Number(l.duration) || 0), 0);
  if (!r || !distanceMeters) {
    throw new HttpError(422, "no_route", "No driving route was found between these locations. Please check them.");
  }
  const poly = typeof r.overview_polyline === "string" ? r.overview_polyline : r.overview_polyline?.points;
  return {
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: Math.round(durationSeconds),
    encodedPolyline: poly || undefined,
    tollEstimate: null, // Ola does not return toll prices; pricing uses the admin's toll rule
  };
}
