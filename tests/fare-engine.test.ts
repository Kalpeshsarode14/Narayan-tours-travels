import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateFare, isNightTime, tripDaysBetween, FareError } from "../lib/booking/fare-engine.js";
import { DEFAULT_PRICING as SHIPPED_DEFAULTS } from "../lib/booking/default-pricing.js";
import type { FareInput, PricingConfig } from "../lib/booking/types.js";
import { validatePricingConfig, parseBookingRequest, parseQuoteRequest, normalizeIndianMobile, ValidationError } from "../lib/booking/validation.js";
import { buildWhatsAppMessage, whatsAppLink } from "../lib/booking/whatsapp.js";

const clone = (c: PricingConfig): PricingConfig => JSON.parse(JSON.stringify(c));
// Most engine tests use a map-provided toll estimate ("routes_api") so toll amounts are exact;
// the shipped default (per-km estimate, as Ola Maps has no toll prices) is tested separately below.
const DEFAULT_PRICING: PricingConfig = { ...clone(SHIPPED_DEFAULTS), toll: { enabled: true, mode: "routes_api", perKmEstimate: 1.5 } };
const base: FareInput = {
  tripType: "one_way",
  vehicleId: "dzire",
  pickupDate: "2026-12-10",
  pickupTime: "09:00",
  stopsCount: 0,
  waitingMinutes: 0,
  extraIds: [],
};
// Mumbai → Pune ≈ 150 km, 3h
const route = { distanceMeters: 150_400, durationSeconds: 3 * 3600, tollEstimate: 320 };
const line = (f: ReturnType<typeof calculateFare>, code: string) => f.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);

test("one-way: base + km × rate + driver allowance + Google toll", () => {
  const f = calculateFare(DEFAULT_PRICING, base, route);
  assert.equal(f.chargeableKm, 151);
  assert.equal(line(f, "distance"), 151 * 14);
  assert.equal(line(f, "driver_allowance"), 300);
  assert.equal(line(f, "toll"), 320);
  assert.equal(f.total, 2114 + 300 + 320);
  assert.equal(f.total, f.lines.reduce((s, l) => s + l.amount, 0));
});

test("changing vehicle changes the fare", () => {
  const sedan = calculateFare(DEFAULT_PRICING, base, route);
  const suv = calculateFare(DEFAULT_PRICING, { ...base, vehicleId: "ertiga" }, route);
  assert.equal(line(suv, "distance"), 151 * 17);
  assert.ok(suv.total > sedan.total);
});

test("one-way: minimum km applies to short trips", () => {
  const f = calculateFare(DEFAULT_PRICING, base, { distanceMeters: 40_000, durationSeconds: 3600, tollEstimate: 0 });
  assert.equal(f.chargeableKm, 100);
  assert.equal(line(f, "distance"), 1400);
});

test("round trip: both ways, 300 km/day minimum, allowance per day, toll × 2", () => {
  const rt = { ...base, tripType: "round_trip" as const, returnDate: "2026-12-12" }; // 3 days
  const f = calculateFare(DEFAULT_PRICING, rt, route);
  assert.equal(f.tripDays, 3);
  assert.equal(f.chargeableKm, 900); // max(301, 900)
  assert.equal(line(f, "distance"), 900 * 14);
  assert.equal(line(f, "driver_allowance"), 900);
  assert.equal(line(f, "toll"), 640);
  // same-day round trip uses actual km when it exceeds 300
  const sameDay = calculateFare(DEFAULT_PRICING, { ...rt, returnDate: "2026-12-10" }, { ...route, distanceMeters: 200_000 });
  assert.equal(sameDay.chargeableKm, 400);
});

test("round trip: missing / past return date rejected", () => {
  assert.throws(() => calculateFare(DEFAULT_PRICING, { ...base, tripType: "round_trip" }, route), FareError);
  assert.throws(() => tripDaysBetween("2026-12-10", "2026-12-09"), FareError);
});

test("local package with extra km and hours", () => {
  const f = calculateFare(
    DEFAULT_PRICING,
    { ...base, tripType: "local", localPackageId: "4h-40km" },
    { distanceMeters: 52_000, durationSeconds: 5.5 * 3600, tollEstimate: 0 }
  );
  assert.equal(line(f, "package"), 1200);
  // 12 extra km × 14 + 2 extra hr × 150
  assert.equal(line(f, "distance"), 168 + 300);
});

test("airport transfer: included km, parking", () => {
  const f = calculateFare(DEFAULT_PRICING, { ...base, tripType: "airport" }, { distanceMeters: 42_300, durationSeconds: 3600, tollEstimate: null });
  assert.equal(line(f, "base"), 800);
  assert.equal(line(f, "distance"), (43 - 30) * 14);
  assert.equal(line(f, "parking"), 150);
  // tollEstimate null → per-km fallback 42.3 × 1.5 = 63.45 → 63
  assert.equal(line(f, "toll"), 63);
});

test("night, waiting, stops, extras, minimum fare, GST", () => {
  const cfg = clone(DEFAULT_PRICING);
  cfg.gst.enabled = true;
  const f = calculateFare(
    cfg,
    { ...base, pickupTime: "23:30", stopsCount: 2, waitingMinutes: 95, extraIds: ["carrier", "carrier", "unknown"] },
    route
  );
  assert.equal(line(f, "night"), 250);
  assert.equal(line(f, "extra_stops"), 200);
  assert.equal(line(f, "waiting"), 225); // 65 min → 3 half-hours × 75
  assert.equal(line(f, "extra"), 200); // de-duplicated, unknown ignored
  const pre = f.lines.filter((l) => l.code !== "gst").reduce((s, l) => s + l.amount, 0);
  assert.equal(line(f, "gst"), Math.round(pre * 0.05));

  const cfg2 = clone(DEFAULT_PRICING);
  cfg2.minimumFare.amount = 5000;
  const g = calculateFare(cfg2, base, route);
  assert.equal(g.total, 5000);
});

test("night percent mode and window wrap", () => {
  assert.equal(isNightTime("23:00", 22, 6), true);
  assert.equal(isNightTime("05:59", 22, 6), true);
  assert.equal(isNightTime("06:00", 22, 6), false);
  assert.equal(isNightTime("13:00", 12, 14), true);
  const cfg = clone(DEFAULT_PRICING);
  cfg.nightCharge = { enabled: true, startHour: 22, endHour: 6, mode: "percent", value: 10 };
  const f = calculateFare(cfg, { ...base, pickupTime: "02:00" }, route);
  assert.equal(line(f, "night"), Math.round(2114 * 0.1));
});

test("components can be switched off", () => {
  const cfg = clone(DEFAULT_PRICING);
  cfg.driverAllowance.enabled = false;
  cfg.toll.enabled = false;
  const f = calculateFare(cfg, base, route);
  assert.equal(f.total, 2114);
  cfg.toll = { enabled: true, mode: "actuals", perKmEstimate: 1.5 };
  const g = calculateFare(cfg, base, route);
  assert.equal(line(g, "toll"), 0);
  assert.ok(g.notes.some((n) => n.includes("actuals")));
});

test("disabled vehicle / trip type and very long routes are rejected", () => {
  const cfg = clone(DEFAULT_PRICING);
  cfg.vehicles[1].enabled = false;
  cfg.tripTypesEnabled.airport = false;
  assert.throws(() => calculateFare(cfg, { ...base, vehicleId: "ertiga" }, route), /not available/);
  assert.throws(() => calculateFare(cfg, { ...base, tripType: "airport" }, route), /not available/);
  assert.throws(() => calculateFare(cfg, base, { ...route, distanceMeters: 3_000_000 }), /cannot be booked/);
});

test("pricing config validation keeps defaults valid and rejects bad values", () => {
  const ok = validatePricingConfig(DEFAULT_PRICING);
  assert.deepEqual(ok, DEFAULT_PRICING);
  const bad = clone(DEFAULT_PRICING) as any;
  bad.vehicles[0].oneWay.perKm = -5;
  bad.vehicles[1].id = "dzire";
  assert.throws(() => validatePricingConfig(bad), ValidationError);
  // unknown keys are stripped
  const extra = { ...clone(DEFAULT_PRICING), hacked: true } as any;
  assert.equal("hacked" in validatePricingConfig(extra), false);
});

const place = (id: string, lat = 19.07, lng = 72.87) => ({ placeId: id, name: id, address: `${id} addr`, location: { lat, lng } });
const validBooking = {
  pickup: place("ChIJpickup"),
  drop: place("ChIJdrop", 18.52, 73.85),
  stops: [],
  tripType: "one_way",
  vehicleId: "dzire",
  pickupDate: "2099-01-01",
  pickupTime: "09:00",
  customer: { name: "Ravi Kumar", mobile: "098200 12345", email: "Ravi@Example.com" },
  passengers: 3,
  expectedTotal: 2734,
};

test("booking request validation", () => {
  const r = parseBookingRequest(validBooking, 4);
  assert.equal(r.customer.mobile, "+919820012345");
  assert.equal(r.customer.email, "ravi@example.com");
  assert.equal(r.fare.stopsCount, 0);
  try {
    parseBookingRequest({ ...validBooking, pickup: { placeId: "x" }, passengers: 9, customer: { name: "", mobile: "12345", email: "nope" } }, 4);
    assert.fail("should throw");
  } catch (e) {
    assert.ok(e instanceof ValidationError);
    assert.deepEqual(Object.keys(e.fields).sort(), ["customer.email", "customer.mobile", "customer.name", "passengers", "pickup"].sort());
  }
  assert.throws(() => parseBookingRequest({ ...validBooking, pickupDate: "2020-01-01" }, 4), /past/);
  assert.throws(() => parseQuoteRequest({ ...validBooking, tripType: "round_trip", returnDate: "2098-12-01" }), /before/);
  assert.equal(normalizeIndianMobile("+91 98200-12345"), "+919820012345");
  assert.equal(normalizeIndianMobile("5820012345"), null);
});

test("WhatsApp message and link", () => {
  const msg = buildWhatsAppMessage(
    {
      bookingId: "NTT-261210-AB12",
      customerName: "Ravi Kumar",
      customerMobile: "+919820012345",
      customerEmail: "ravi@example.com",
      pickupAddress: "CSMT, Mumbai",
      dropAddress: "Shivajinagar, Pune",
      stops: ["Lonavala"],
      pickupDate: "2026-12-10",
      pickupTime: "21:30",
      tripType: "one_way",
      vehicleName: "Sedan · Maruti Suzuki Dzire",
      passengers: 3,
      routeKm: 150.4,
      durationMinutes: 185,
      total: 2734,
    },
    "Narayan Tours & Travels"
  );
  assert.match(msg, /NTT-261210-AB12/);
  assert.match(msg, /Stop 1:\* Lonavala/);
  assert.match(msg, /₹2,734/);
  assert.match(msg, /3 hr 5 min/);
  const link = whatsAppLink("99674 56323", msg);
  assert.ok(link.startsWith("https://wa.me/919967456323?text="));
  assert.equal(decodeURIComponent(link.split("text=")[1]), msg);
});

test("shipped defaults: tolls estimated per km (Ola Maps gives no toll prices)", () => {
  assert.equal(SHIPPED_DEFAULTS.toll.mode, "per_km_estimate");
  const f = calculateFare(SHIPPED_DEFAULTS, base, { distanceMeters: 150_400, durationSeconds: 10_800, tollEstimate: null });
  assert.equal(f.lines.find((l) => l.code === "toll")?.amount, Math.round(150.4 * 1.5));
  assert.equal(f.total, 151 * 14 + 300 + 226);
  assert.deepEqual(validatePricingConfig(SHIPPED_DEFAULTS), SHIPPED_DEFAULTS);
});

test("old saved configs with routes_api still validate", () => {
  const old = clone(SHIPPED_DEFAULTS) as any;
  old.toll.mode = "routes_api";
  assert.equal(validatePricingConfig(old).toll.mode, "routes_api");
  old.toll.mode = "bogus";
  assert.equal(validatePricingConfig(old).toll.mode, "per_km_estimate");
});
