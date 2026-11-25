// Place verification + driving route, with a database cache so the fare preview and the
// final booking always use the identical route (and to stay well inside Ola's free tier).
import { createHash } from "node:crypto";
import type { PlaceSelection, RouteInfo } from "../booking/types.js";
import { HttpError } from "./http.js";
import { placeDetails, route as olaRoute } from "./ola.js";
import { db } from "./supabase.js";

const ROUTE_CACHE_HOURS = 24;
const PLACE_CACHE_DAYS = 30;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

async function cacheGet<T>(key: string, maxAgeMs: number): Promise<T | null> {
  try {
    const since = new Date(Date.now() - maxAgeMs).toISOString();
    const rows = await db.select<{ data: T }>("route_cache", { select: "data", key: `eq.${key}`, created_at: `gte.${since}` });
    return rows[0]?.data ?? null;
  } catch (e) {
    console.warn("[cache] read failed, continuing", e);
    return null;
  }
}

async function cacheSet(key: string, data: unknown) {
  try {
    await db.upsert("route_cache", { key, data, created_at: new Date().toISOString() });
  } catch (e) {
    console.warn("[cache] write failed", e);
  }
}

/**
 * Replaces the browser-supplied name/address/coordinates with Ola's own record for each place ID.
 * A customer editing coordinates in dev tools therefore cannot change the distance or fare.
 */
export async function verifyPlace(p: PlaceSelection): Promise<PlaceSelection> {
  const key = "place:" + hash(p.placeId);
  const cached = await cacheGet<PlaceSelection>(key, PLACE_CACHE_DAYS * 86_400_000);
  if (cached) return cached;
  const fresh = await placeDetails(p.placeId);
  await cacheSet(key, fresh);
  return fresh;
}

export async function verifyPlaces(pickup: PlaceSelection, drop: PlaceSelection, stops: PlaceSelection[]) {
  const [vp, vd, ...vs] = await Promise.all([pickup, drop, ...stops].map(verifyPlace));
  return { pickup: vp, drop: vd, stops: vs };
}

export function routeCacheKey(pickup: PlaceSelection, drop: PlaceSelection, stops: PlaceSelection[]) {
  return "route:" + hash(["ola-v2", pickup.placeId, ...stops.map((s) => s.placeId), drop.placeId].join("|"));
}

/** Route between already-verified places. */
export async function getRoute(pickup: PlaceSelection, drop: PlaceSelection, stops: PlaceSelection[]): Promise<RouteInfo> {
  if (pickup.placeId === drop.placeId && stops.length === 0) {
    throw new HttpError(422, "same_place", "Pickup and drop-off cannot be the same place.");
  }
  const key = routeCacheKey(pickup, drop, stops);
  const cached = await cacheGet<RouteInfo>(key, ROUTE_CACHE_HOURS * 3_600_000);
  if (cached) return cached;
  const r = await olaRoute([pickup.location, ...stops.map((s) => s.location), drop.location]);
  await cacheSet(key, r);
  return r;
}
