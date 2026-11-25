// All API logic lives here so it can be unit-tested; files in /api are thin Vercel wrappers.
import { randomInt } from "node:crypto";
import { calculateFare, FareError } from "../booking/fare-engine.js";
import { parseBookingRequest, parseQuoteRequest, ValidationError } from "../booking/validation.js";
import { getRoute } from "./google-routes.js";
import { clientIp, handle, HttpError, json, rateLimit, readJson } from "./http.js";
import { getActivePricing, getSettings, publicPricing, savePricing } from "./pricing-store.js";
import { db, requireAdmin } from "./supabase.js";
import type { PricingConfig } from "../booking/types.js";

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L

export function newBookingCode(now = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 3600_000).toISOString(); // IST date
  const ymd = ist.slice(2, 4) + ist.slice(5, 7) + ist.slice(8, 10);
  let rand = "";
  for (let i = 0; i < 5; i++) rand += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `NTT-${ymd}-${rand}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^NTT-\d{6}-[2-9A-HJ-NP-Z]{5}$/;

// ── Public ──────────────────────────────────────────────────────────────────

/** GET /api/booking-config: pricing rules for the live preview plus business contact details. */
export const getBookingConfig = handle(async () => {
  const [pricing, settings] = await Promise.all([getActivePricing(), getSettings()]);
  return json(
    {
      pricing: publicPricing(pricing),
      business: {
        name: settings.business_name,
        whatsappNumber: settings.whatsapp_number,
        phone: settings.contact_phone,
        email: settings.contact_email,
      },
    },
    200
  ); // no caching: a price change must reach customers immediately
});

/** POST /api/quote: Google route (server-side) and the authoritative fare. */
export const postQuote = handle(async (req) => {
  rateLimit(`quote:${clientIp(req)}`, 40, 60_000);
  const q = parseQuoteRequest(await readJson(req));
  const pricing = await getActivePricing();
  const route = await getRoute(q.pickup, q.drop, q.stops);
  if (route.distanceMeters / 1000 > pricing.maxRouteKm) {
    throw new HttpError(422, "route_too_long", `Routes over ${pricing.maxRouteKm} km cannot be booked online. Please call us.`);
  }
  // The route is returned even if these particular fare options are invalid (e.g. a disabled trip type).
  let fare = null;
  let fareError: string | null = null;
  try {
    fare = calculateFare(pricing, q.fare, route);
  } catch (e) {
    if (!(e instanceof FareError)) throw e;
    fareError = e.message;
  }
  return json({
    fareError,
    route: {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      encodedPolyline: route.encodedPolyline,
      tollEstimate: route.tollEstimate,
    },
    fare,
  });
});

/** POST /api/bookings: re-validates everything, recalculates the fare on the server, and saves the booking. */
export const postBooking = handle(async (req) => {
  rateLimit(`book:${clientIp(req)}`, 8, 10 * 60_000);
  const body = await readJson(req);
  const pricing = await getActivePricing();
  const vehicleId = typeof (body as any)?.vehicleId === "string" ? (body as any).vehicleId : "";
  const vehicle = pricing.vehicles.find((v) => v.id === vehicleId && v.enabled);
  if (!vehicle) throw new ValidationError({ vehicleId: "Selected vehicle is not available." });
  const b = parseBookingRequest(body, vehicle.seats);

  const route = await getRoute(b.pickup, b.drop, b.stops);
  const fare = calculateFare(pricing, b.fare, route);

  // The customer must have seen this exact total. If pricing or the route changed, ask them to review it.
  if (Math.abs(fare.total - b.expectedTotal) > 0.5) {
    throw new HttpError(409, "fare_changed", "The fare has been updated. Please review the new total and confirm again.", { fare });
  }

  const row = {
    customer_name: b.customer.name,
    customer_mobile: b.customer.mobile,
    customer_email: b.customer.email,
    passengers: b.passengers,
    special_requirements: b.specialRequirements,
    trip_type: b.fare.tripType,
    vehicle_id: vehicle.id,
    vehicle_name: fare.vehicleName,
    local_package_id: b.fare.localPackageId ?? null,
    extra_ids: b.fare.extraIds,
    waiting_minutes: b.fare.waitingMinutes,
    pickup_place_id: b.pickup.placeId,
    pickup_name: b.pickup.name,
    pickup_address: b.pickup.address,
    pickup_lat: b.pickup.location.lat,
    pickup_lng: b.pickup.location.lng,
    drop_place_id: b.drop.placeId,
    drop_name: b.drop.name,
    drop_address: b.drop.address,
    drop_lat: b.drop.location.lat,
    drop_lng: b.drop.location.lng,
    stops: b.stops,
    pickup_date: b.fare.pickupDate,
    pickup_time: b.fare.pickupTime,
    return_date: b.fare.returnDate ?? null,
    route_distance_m: route.distanceMeters,
    route_km: fare.routeKm,
    duration_minutes: fare.durationMinutes,
    route_polyline: route.encodedPolyline ?? null,
    fare_breakdown: fare,
    final_fare: fare.total,
    pricing_version: pricing.version ?? null,
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const [saved] = await db.insert<{ booking_code: string; access_token: string }>("bookings", {
        ...row,
        booking_code: newBookingCode(),
      });
      return json({ bookingId: saved.booking_code, accessToken: saved.access_token, fare }, 201);
    } catch (e) {
      if (e instanceof HttpError && e.code === "conflict" && attempt < 3) continue; // booking code collision
      throw e;
    }
  }
  throw new HttpError(500, "server_error", "Could not create the booking.");
});

const PUBLIC_BOOKING_FIELDS =
  "booking_code,status,customer_name,customer_mobile,customer_email,passengers,special_requirements,trip_type,vehicle_id,vehicle_name," +
  "pickup_name,pickup_address,pickup_lat,pickup_lng,drop_name,drop_address,drop_lat,drop_lng,stops,pickup_date,pickup_time,return_date," +
  "route_km,duration_minutes,route_polyline,fare_breakdown,final_fare,created_at";

/** GET /api/booking?id=NTT-...&token=uuid: confirmation page data. The token stops other people guessing booking IDs. */
export const getBooking = handle(async (req) => {
  rateLimit(`view:${clientIp(req)}`, 60, 60_000);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const token = url.searchParams.get("token") || "";
  if (!CODE_RE.test(id) || !UUID_RE.test(token)) throw new HttpError(404, "not_found", "Booking not found.");
  const rows = await db.select<Record<string, unknown>>("bookings", {
    select: PUBLIC_BOOKING_FIELDS,
    booking_code: `eq.${id}`,
    access_token: `eq.${token}`,
  });
  if (!rows[0]) throw new HttpError(404, "not_found", "Booking not found.");
  const settings = await getSettings();
  return json({
    booking: rows[0],
    business: { name: settings.business_name, whatsappNumber: settings.whatsapp_number, phone: settings.contact_phone, email: settings.contact_email },
  });
});

// ── Admin ───────────────────────────────────────────────────────────────────

/** GET/PUT /api/admin/pricing */
export const adminPricing = handle(async (req) => {
  const user = await requireAdmin(req);
  if (req.method === "GET") return json({ pricing: await getActivePricing() });
  if (req.method === "PUT") {
    const body = (await readJson(req, 200_000)) as { pricing?: PricingConfig };
    const saved = await savePricing(body?.pricing as PricingConfig, user.id);
    return json({ pricing: saved });
  }
  throw new HttpError(405, "method_not_allowed", "Method not allowed.");
});

/** GET/PUT /api/admin/settings */
export const adminSettings = handle(async (req) => {
  await requireAdmin(req);
  if (req.method === "GET") return json({ settings: await getSettings() });
  if (req.method === "PUT") {
    const b = (await readJson(req)) as Record<string, unknown>;
    const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const whatsapp = s(b.whatsapp_number, 20).replace(/\D/g, "");
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      throw new ValidationError({ whatsapp_number: "Enter the WhatsApp number with country code, e.g. 919967456323." });
    }
    const name = s(b.business_name, 100);
    if (!name) throw new ValidationError({ business_name: "Business name is required." });
    const [row] = await db.update("site_settings", { id: "eq.1" }, {
      business_name: name,
      whatsapp_number: whatsapp,
      contact_phone: s(b.contact_phone, 30),
      contact_email: s(b.contact_email, 254),
      updated_at: new Date().toISOString(),
    });
    return json({ settings: row });
  }
  throw new HttpError(405, "method_not_allowed", "Method not allowed.");
});

const STATUSES = ["pending", "confirmed", "assigned", "completed", "cancelled"];

/** GET /api/admin/bookings?status=&from=&to=&page= and PATCH /api/admin/bookings { id, status } */
export const adminBookings = handle(async (req) => {
  await requireAdmin(req);
  if (req.method === "GET") {
    const url = new URL(req.url);
    const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const q: Record<string, string> = {
      select: "id," + PUBLIC_BOOKING_FIELDS.replace(",route_polyline", ""),
      order: "created_at.desc",
      limit: "50",
      offset: String(page * 50),
    };
    const status = url.searchParams.get("status");
    if (status && STATUSES.includes(status)) q.status = `eq.${status}`;
    const search = (url.searchParams.get("q") || "").replace(/[^A-Za-z0-9\- +]/g, "").trim();
    if (search) q.or = `(booking_code.ilike.*${search}*,customer_mobile.ilike.*${search}*,customer_name.ilike.*${search}*)`;
    return json({ bookings: await db.select("bookings", q) });
  }
  if (req.method === "PATCH") {
    const b = (await readJson(req)) as { id?: string; status?: string };
    if (!b.id || !UUID_RE.test(b.id) || !b.status || !STATUSES.includes(b.status)) {
      throw new ValidationError({ status: "Invalid booking or status." });
    }
    const [row] = await db.update("bookings", { id: `eq.${b.id}` }, { status: b.status });
    if (!row) throw new HttpError(404, "not_found", "Booking not found.");
    return json({ booking: row });
  }
  throw new HttpError(405, "method_not_allowed", "Method not allowed.");
});
