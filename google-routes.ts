// Server-side Google Routes API (computeRoutes). The server key never reaches the browser.
import { createHash } from "node:crypto";
import type { PlaceSelection, RouteInfo } from "../booking/types.js";
import { env, HttpError } from "./http.js";
import { db } from "./supabase.js";

const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const CACHE_HOURS = 24;

interface Money { currencyCode?: string; units?: string; nanos?: number }
interface RoutesResponse {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string; // "12345s"
    polyline?: { encodedPolyline?: string };
    travelAdvisory?: { tollInfo?: { estimatedPrice?: Money[] } };
  }>;
}

export function routeCacheKey(pickup: PlaceSelection, drop: PlaceSelection, stops: PlaceSelection[]) {
  const raw = ["v1", pickup.placeId, ...stops.map((s) => s.placeId), drop.placeId].join("|");
  return createHash("sha256").update(raw).digest("hex");
}

/** Parses Google's toll info: undefined tollInfo → no tolls (0); tollInfo without price → unknown (null). */
export function parseToll(tollInfo: { estimatedPrice?: Money[] } | undefined): number | null {
  if (!tollInfo) return 0;
  const inr = tollInfo.estimatedPrice?.find((p) => p.currencyCode === "INR");
  if (!inr) return null;
  return Number(inr.units || 0) + (inr.nanos || 0) / 1e9;
}

export async function fetchGoogleRoute(pickup: PlaceSelection, drop: PlaceSelection, stops: PlaceSelection[]): Promise<RouteInfo> {
  // Toll estimates use a higher-priced Routes tier. Set GOOGLE_ROUTES_TOLLS=off to skip them;
  // pricing then falls back to the admin's "₹ per km" toll estimate (or "actuals").
  const tolls = (process.env.GOOGLE_ROUTES_TOLLS || "on").toLowerCase() !== "off";
  const body = {
    origin: { placeId: pickup.placeId },
    destination: { placeId: drop.placeId },
    intermediates: stops.map((s) => ({ placeId: s.placeId })),
    travelMode: "DRIVE",
    // TRAFFIC_UNAWARE: stable distances for pricing and the cheapest Routes SKU.
    routingPreference: "TRAFFIC_UNAWARE",
    computeAlternativeRoutes: false,
    ...(tolls
      ? { extraComputations: ["TOLLS"], routeModifiers: { vehicleInfo: { emissionType: "DIESEL" }, tollPasses: ["IN_FASTAG"] } }
      : {}),
    languageCode: "en-IN",
    regionCode: "IN",
    units: "METRIC",
  };
  const res = await fetch(ROUTES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env("GOOGLE_MAPS_SERVER_KEY"),
      "x-goog-fieldmask": `routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline${tolls ? ",routes.travelAdvisory.tollInfo" : ""}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[routes] HTTP", res.status, await res.text());
    throw new HttpError(502, "route_failed", "Could not get the route from Google Maps. Please try again.");
  }
  const data = (await res.json()) as RoutesResponse;
  const r = data.routes?.[0];
  if (!r || !r.distanceMeters) {
    throw new HttpError(422, "no_route", "No driving route was found between these locations. Please check them.");
  }
  return {
    distanceMeters: r.distanceMeters,
    durationSeconds: parseInt(r.duration || "0", 10) || 0,
    encodedPolyline: r.polyline?.encodedPolyline,
    tollEstimate: tolls ? parseToll(r.travelAdvisory?.tollInfo) : null,
  };
}

/** Route with a 24h database cache, so the preview and the final booking use the identical route. */
export async function getRoute(pickup: PlaceSelection, drop: PlaceSelection, stops: PlaceSelection[]): Promise<RouteInfo> {
  if (pickup.placeId === drop.placeId && stops.length === 0) {
    throw new HttpError(422, "same_place", "Pickup and drop-off cannot be the same place.");
  }
  const key = routeCacheKey(pickup, drop, stops);
  const since = new Date(Date.now() - CACHE_HOURS * 3600_000).toISOString();
  try {
    const hit = await db.select<{ data: RouteInfo }>("route_cache", { select: "data", key: `eq.${key}`, created_at: `gte.${since}` });
    if (hit[0]) return hit[0].data;
  } catch (e) {
    console.warn("[routes] cache read failed, continuing", e);
  }
  const route = await fetchGoogleRoute(pickup, drop, stops);
  try {
    await db.upsert("route_cache", { key, data: route, created_at: new Date().toISOString() });
  } catch (e) {
    console.warn("[routes] cache write failed", e);
  }
  return route;
}
