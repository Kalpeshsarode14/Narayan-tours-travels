// End-to-end API test with Google Routes + Supabase mocked at the fetch() level.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

process.env.SUPABASE_URL = "https://db.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
process.env.OLA_MAPS_API_KEY = "server-key";

const { postQuote, postBooking, getBooking, getPlaces, adminPricing, adminBookings, getBookingConfig, newBookingCode } = await import(
  "../lib/server/handlers.js"
);
const { DEFAULT_PRICING } = await import("../lib/booking/default-pricing.js");

type Row = Record<string, any>;
let tables: Record<string, Row[]>;
let olaCalls: Record<string, number> = {};
let olaKeySeen = "";
let directionsParams: URLSearchParams | null = null;
// What Ola "knows" about each place (the truth the server must use)
const OLA_PLACES: Record<string, { name: string; address: string; lat: number; lng: number }> = {
  "ola-platform:mumbaiCSMT": { name: "CSMT", address: "Fort, Mumbai, Maharashtra", lat: 18.94, lng: 72.83 },
  "ola-platform:puneStation": { name: "Pune Railway Station", address: "Agarkar Nagar, Pune", lat: 18.52, lng: 73.87 },
};

beforeEach(() => {
  tables = {
    admin_users: [{ user_id: "admin-1" }],
    pricing_versions: [],
    site_settings: [{ id: 1, business_name: "Narayan Tours & Travels", whatsapp_number: "919967456323", contact_phone: "+91 99674 56323", contact_email: "" }],
    route_cache: [],
    bookings: [],
  };
  olaCalls = {};
});

function matches(row: Row, params: URLSearchParams) {
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset", "or"].includes(k)) continue;
    const [op, val] = [v.slice(0, v.indexOf(".")), v.slice(v.indexOf(".") + 1)];
    if (op === "eq" && String(row[k]) !== val) return false;
    if (op === "gte" && !(String(row[k]) >= val)) return false;
  }
  return true;
}

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  const method = init.method || "GET";
  if (url.host === "api.olamaps.io") {
    olaCalls[url.pathname] = (olaCalls[url.pathname] || 0) + 1;
    olaKeySeen = url.searchParams.get("api_key") || "";
    if (url.pathname === "/places/v1/autocomplete") {
      return new Response(JSON.stringify({ status: "ok", predictions: [
        { place_id: "ola-platform:puneStation", description: "Pune Railway Station, Agarkar Nagar, Pune",
          structured_formatting: { main_text: "Pune Railway Station", secondary_text: "Agarkar Nagar, Pune" },
          geometry: { location: { lat: 18.52, lng: 73.87 } } },
      ] }));
    }
    if (url.pathname === "/places/v1/details") {
      const p = OLA_PLACES[url.searchParams.get("place_id") || ""];
      if (!p) return new Response(JSON.stringify({ status: "zero_results" }));
      return new Response(JSON.stringify({ status: "ok", result: { name: p.name, formatted_address: p.address, geometry: { location: { lat: p.lat, lng: p.lng } } } }));
    }
    if (url.pathname === "/routing/v1/directions/basic") {
      assert.equal(method, "POST");
      directionsParams = url.searchParams;
      return new Response(JSON.stringify({ status: "SUCCESS", routes: [{ legs: [{ distance: 150_400, duration: 10_800 }], overview_polyline: "abc" }] }));
    }
  }
  if (url.host === "db.test" && url.pathname === "/auth/v1/user") {
    const tok = init.headers.authorization;
    if (tok === "Bearer admin-token") return new Response(JSON.stringify({ id: "admin-1", email: "a@x.com" }));
    if (tok === "Bearer customer-token") return new Response(JSON.stringify({ id: "cust-9", email: "c@x.com" }));
    return new Response("{}", { status: 401 });
  }
  if (url.host === "db.test" && url.pathname.startsWith("/rest/v1/")) {
    const table = url.pathname.split("/").pop()!;
    const t = tables[table];
    if (method === "GET") {
      let rows = t.filter((r) => matches(r, url.searchParams));
      if (url.searchParams.get("order") === "id.desc") rows = [...rows].sort((a, b) => b.id - a.id);
      const lim = url.searchParams.get("limit");
      if (lim) rows = rows.slice(0, +lim);
      const sel = url.searchParams.get("select");
      if (sel && sel !== "*") {
        const cols = sel.split(",");
        rows = rows.map((r) => Object.fromEntries(cols.filter((c) => c in r).map((c) => [c, r[c]])));
      }
      return new Response(JSON.stringify(rows));
    }
    if (method === "POST") {
      const row = JSON.parse(init.body);
      if (table === "bookings") {
        if (t.some((r) => r.booking_code === row.booking_code)) return new Response("dup", { status: 409 });
        Object.assign(row, { id: randomUUID(), access_token: randomUUID(), status: "pending", created_at: new Date().toISOString() });
      }
      if (table === "pricing_versions") row.id = t.length + 1;
      if (table === "route_cache") {
        const i = t.findIndex((r) => r.key === row.key);
        if (i >= 0) t.splice(i, 1);
      }
      t.push(row);
      return new Response(JSON.stringify([row]), { status: 201 });
    }
    if (method === "PATCH") {
      const patch = JSON.parse(init.body);
      const rows = t.filter((r) => matches(r, url.searchParams));
      rows.forEach((r) => Object.assign(r, patch));
      return new Response(JSON.stringify(rows));
    }
  }
  throw new Error(`unexpected fetch ${method} ${url}`);
}) as typeof fetch;

const place = (id: string, lat: number, lng: number) => ({ placeId: id, name: id, address: `${id}, Maharashtra`, location: { lat, lng } });
const trip = {
  pickup: place("ola-platform:mumbaiCSMT", 18.94, 72.83),
  drop: place("ola-platform:puneStation", 18.52, 73.87),
  stops: [],
  tripType: "one_way",
  vehicleId: "dzire",
  pickupDate: "2099-01-10",
  pickupTime: "09:00",
};
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://site.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
    body: JSON.stringify(body),
  });

test("quote → booking → confirmation, server-side fare and cached route", async () => {
  const qRes = await postQuote(post(trip));
  assert.equal(qRes.status, 200);
  const q = await qRes.json();
  assert.equal(q.fare.total, 151 * 14 + 300 + 226);
  assert.equal(q.route.distanceMeters, 150_400);
  assert.equal(olaKeySeen, "server-key");
  assert.equal(directionsParams!.get("origin"), "18.94,72.83");
  assert.equal(directionsParams!.get("destination"), "18.52,73.87");
  assert.equal(q.places.pickup.name, "CSMT");

  // Changing vehicle re-uses the cached route (no extra Google call)
  const q2 = await (await postQuote(post({ ...trip, vehicleId: "ertiga" }))).json();
  assert.equal(q2.fare.total, 151 * 17 + 300 + 226);
  assert.equal(olaCalls["/routing/v1/directions/basic"], 1);
  assert.equal(olaCalls["/places/v1/details"], 2, "each place verified once, then cached");

  const booking = {
    ...trip,
    customer: { name: "Ravi Kumar", mobile: "9820012345", email: "ravi@example.com" },
    passengers: 3,
    specialRequirements: "Child seat please",
    expectedTotal: q.fare.total,
  };
  const bRes = await postBooking(post(booking));
  assert.equal(bRes.status, 201);
  const b = await bRes.json();
  assert.match(b.bookingId, /^NTT-\d{6}-[A-Z2-9]{5}$/);
  assert.equal(olaCalls["/routing/v1/directions/basic"], 1, "booking uses the same cached route as the preview");
  assert.equal(olaCalls["/places/v1/details"], 2);

  const saved = tables.bookings[0];
  assert.equal(saved.final_fare, q.fare.total);
  assert.equal(saved.pickup_lat, 18.94);
  assert.equal(saved.route_km, 150.4);
  assert.equal(saved.duration_minutes, 180);
  assert.equal(saved.customer_mobile, "+919820012345");
  assert.deepEqual(saved.fare_breakdown.lines.map((l: any) => l.code), ["distance", "driver_allowance", "toll"]);

  const gRes = await getBooking(new Request(`https://site.test/api/booking?id=${b.bookingId}&token=${b.accessToken}`));
  assert.equal(gRes.status, 200);
  const g = await gRes.json();
  assert.equal(g.booking.booking_code, b.bookingId);
  assert.equal(g.business.whatsappNumber, "919967456323");
  assert.equal("access_token" in g.booking, false);

  // wrong token → 404
  const bad = await getBooking(new Request(`https://site.test/api/booking?id=${b.bookingId}&token=${randomUUID()}`));
  assert.equal(bad.status, 404);
});

test("tampered fare is rejected; nothing saved", async () => {
  const res = await postBooking(
    post({
      ...trip,
      customer: { name: "Ravi Kumar", mobile: "9820012345", email: "ravi@example.com" },
      passengers: 2,
      expectedTotal: 1, // edited in browser dev tools
    })
  );
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.error, "fare_changed");
  assert.equal(body.fare.total, 2640);
  assert.equal(tables.bookings.length, 0);
});

test("invalid input is rejected with field errors", async () => {
  const res = await postBooking(post({ ...trip, pickup: { placeId: "x" }, passengers: 9, customer: {}, expectedTotal: 100 }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.fields.pickup && body.fields.passengers && body.fields["customer.mobile"]);
  const notJson = await postQuote(new Request("https://site.test/api", { method: "POST", body: "x" }));
  assert.equal(notJson.status, 415);
});

test("admin pricing: protected, validated, versioned; old bookings keep their fare", async () => {
  const anon = await adminPricing(new Request("https://site.test/api/admin/pricing"));
  assert.equal(anon.status, 401);
  const cust = await adminPricing(new Request("https://site.test/api/admin/pricing", { headers: { authorization: "Bearer customer-token" } }));
  assert.equal(cust.status, 403);

  // booking at old price
  const q = await (await postQuote(post(trip))).json();
  await postBooking(post({ ...trip, customer: { name: "Asha Patil", mobile: "9876543210", email: "a@b.in" }, passengers: 1, expectedTotal: q.fare.total }));

  const newPricing = JSON.parse(JSON.stringify(DEFAULT_PRICING));
  newPricing.vehicles[0].oneWay.perKm = 16;
  const put = await adminPricing(
    new Request("https://site.test/api/admin/pricing", {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: "Bearer admin-token" },
      body: JSON.stringify({ pricing: newPricing }),
    })
  );
  assert.equal(put.status, 200);
  assert.equal((await put.json()).pricing.version, 1);

  const q2 = await (await postQuote(post(trip))).json();
  assert.equal(q2.fare.total, 151 * 16 + 300 + 226);
  assert.equal(q2.fare.pricingVersion, 1);
  assert.equal(tables.bookings[0].final_fare, 2640, "existing booking unchanged");

  // invalid pricing is refused
  newPricing.vehicles[0].oneWay.perKm = -1;
  const badPut = await adminPricing(
    new Request("https://site.test/api/admin/pricing", {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: "Bearer admin-token" },
      body: JSON.stringify({ pricing: newPricing }),
    })
  );
  assert.equal(badPut.status, 400);

  // public config reflects new pricing
  const cfg = await (await getBookingConfig(new Request("https://site.test/api/booking-config"))).json();
  assert.equal(cfg.pricing.vehicles[0].oneWay.perKm, 16);

  // admin can list + update status
  const list = await (await adminBookings(new Request("https://site.test/api/admin/bookings", { headers: { authorization: "Bearer admin-token" } }))).json();
  assert.equal(list.bookings.length, 1);
  const patch = await adminBookings(
    new Request("https://site.test/api/admin/bookings", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: "Bearer admin-token" },
      body: JSON.stringify({ id: tables.bookings[0].id, status: "confirmed" }),
    })
  );
  assert.equal(patch.status, 200);
  assert.equal(tables.bookings[0].status, "confirmed");
});

test("booking codes are unique-looking and IST dated", () => {
  const c = newBookingCode(new Date("2026-12-09T20:00:00Z")); // 10 Dec 01:30 IST
  assert.match(c, /^NTT-261210-[2-9A-HJ-NP-Z]{5}$/);
});

test("place search goes through the server; tampered coordinates are replaced by the real place", async () => {
  const r = await getPlaces(new Request("https://site.test/api/places?input=pune"));
  const body = await r.json();
  assert.equal(body.suggestions[0].placeId, "ola-platform:puneStation");
  assert.equal(body.suggestions[0].main, "Pune Railway Station");
  assert.equal("api_key" in body, false);
  const d = await (await getPlaces(new Request("https://site.test/api/places?placeId=ola-platform:puneStation"))).json();
  assert.equal(d.place.location.lat, 18.52);
  const bad = await getPlaces(new Request("https://site.test/api/places?placeId=../../etc"));
  assert.equal(bad.status, 400);

  // Customer edits the drop coordinates in dev tools to look much closer (cheaper)
  const tampered = { ...trip, drop: place("ola-platform:puneStation", 18.95, 72.84) };
  const q = await (await postQuote(post(tampered))).json();
  assert.equal(directionsParams!.get("destination"), "18.52,73.87", "server routes to the real place");
  const res = await postBooking(post({ ...tampered, customer: { name: "Ravi Kumar", mobile: "9820012345", email: "r@x.in" }, passengers: 1, expectedTotal: q.fare.total }));
  assert.equal(res.status, 201);
  const saved = tables.bookings.at(-1)!;
  assert.equal(saved.drop_lat, 18.52);
  assert.equal(saved.drop_address, "Agarkar Nagar, Pune");

  // Unknown place IDs are refused
  const unknown = await postQuote(post({ ...trip, drop: place("ola-platform:doesNotExist", 1, 1) }));
  assert.equal(unknown.status, 422);
});
