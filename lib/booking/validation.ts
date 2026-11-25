import type { FareInput, PlaceSelection, PricingConfig, TripType } from "./types.js";

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super(Object.values(fields)[0] || "Invalid input");
    this.name = "ValidationError";
  }
}

const TRIP_TYPES: TripType[] = ["one_way", "round_trip", "local", "airport"];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

export const MAX_STOPS = 5;

/** Indian mobile: 10 digits starting 6-9, optional +91 / 0 prefix. Returns normalized +91XXXXXXXXXX. */
export function normalizeIndianMobile(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  const m = digits.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  return m ? `+91${m[1]}` : null;
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) && raw.length <= 254;
}

function todayInIndia(): string {
  // en-CA gives YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function parsePlace(v: unknown, field: string, errors: Record<string, string>): PlaceSelection | null {
  if (!isObj(v)) {
    errors[field] = "Please select a location from the suggestions.";
    return null;
  }
  const placeId = str(v.placeId, 300);
  const loc = isObj(v.location) ? v.location : {};
  const lat = num(loc.lat);
  const lng = num(loc.lng);
  if (!placeId || !/^[A-Za-z0-9_\-]+$/.test(placeId)) {
    errors[field] = "Please select a location from the Google suggestions.";
    return null;
  }
  if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) {
    errors[field] = "Location coordinates are missing. Please select the location again.";
    return null;
  }
  return { placeId, name: str(v.name, 200), address: str(v.address, 500), location: { lat, lng } };
}

export interface RouteRequest {
  pickup: PlaceSelection;
  drop: PlaceSelection;
  stops: PlaceSelection[];
}

export interface QuoteRequest extends RouteRequest {
  fare: FareInput;
}

export interface BookingRequest extends QuoteRequest {
  customer: { name: string; mobile: string; email: string };
  passengers: number;
  specialRequirements: string;
  /** Total the customer saw. The server rejects the booking if its own calculation differs. */
  expectedTotal: number;
}

export function parseQuoteRequest(body: unknown, opts: { requireFutureDate?: boolean } = {}): QuoteRequest {
  const errors: Record<string, string> = {};
  const b = isObj(body) ? body : {};
  const pickup = parsePlace(b.pickup, "pickup", errors);
  const drop = parsePlace(b.drop, "drop", errors);
  const rawStops = Array.isArray(b.stops) ? b.stops : [];
  if (rawStops.length > MAX_STOPS) errors.stops = `A maximum of ${MAX_STOPS} stops is allowed.`;
  const stops = rawStops
    .slice(0, MAX_STOPS)
    .map((s, i) => parsePlace(s, `stops.${i}`, errors))
    .filter((s): s is PlaceSelection => !!s);

  const tripType = str(b.tripType) as TripType;
  if (!TRIP_TYPES.includes(tripType)) errors.tripType = "Please choose a trip type.";
  const vehicleId = str(b.vehicleId, 50);
  if (!vehicleId) errors.vehicleId = "Please choose a vehicle.";

  const pickupDate = str(b.pickupDate, 10);
  const pickupTime = str(b.pickupTime, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || Number.isNaN(Date.parse(pickupDate))) {
    errors.pickupDate = "Please choose a pickup date.";
  } else if (opts.requireFutureDate && pickupDate < todayInIndia()) {
    errors.pickupDate = "Pickup date cannot be in the past.";
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) errors.pickupTime = "Please choose a pickup time.";

  let returnDate: string | undefined;
  if (tripType === "round_trip") {
    returnDate = str(b.returnDate, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) errors.returnDate = "Please choose a return date.";
    else if (pickupDate && returnDate < pickupDate) errors.returnDate = "Return date cannot be before the pickup date.";
    else if (pickupDate && (Date.parse(returnDate) - Date.parse(pickupDate)) / 86_400_000 > 30)
      errors.returnDate = "Round trips longer than 30 days must be booked by phone.";
  }

  const localPackageId = tripType === "local" ? str(b.localPackageId, 50) : undefined;
  if (tripType === "local" && !localPackageId) errors.localPackageId = "Please choose a local package.";

  const waitingMinutes = Math.floor(num(b.waitingMinutes) || 0);
  if (waitingMinutes < 0 || waitingMinutes > 24 * 60) errors.waitingMinutes = "Waiting time is out of range.";

  const extraIds = Array.isArray(b.extraIds) ? b.extraIds.map((x) => str(x, 50)).filter(Boolean).slice(0, 20) : [];

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    pickup: pickup!,
    drop: drop!,
    stops,
    fare: {
      tripType,
      vehicleId,
      pickupDate,
      pickupTime,
      returnDate,
      localPackageId,
      stopsCount: stops.length,
      waitingMinutes,
      extraIds,
    },
  };
}

export function parseBookingRequest(body: unknown, maxPassengers: number): BookingRequest {
  let quote: QuoteRequest | null = null;
  const errors: Record<string, string> = {};
  try {
    quote = parseQuoteRequest(body, { requireFutureDate: true });
  } catch (e) {
    if (e instanceof ValidationError) Object.assign(errors, e.fields);
    else throw e;
  }
  const b = isObj(body) ? body : {};
  const c = isObj(b.customer) ? b.customer : {};
  const name = str(c.name, 100);
  if (name.length < 2 || !/^[\p{L}\p{M} .'\-]+$/u.test(name)) errors["customer.name"] = "Please enter your full name.";
  const mobile = normalizeIndianMobile(str(c.mobile, 20));
  if (!mobile) errors["customer.mobile"] = "Please enter a valid 10-digit Indian mobile number.";
  const email = str(c.email, 254).toLowerCase();
  if (!isValidEmail(email)) errors["customer.email"] = "Please enter a valid email address.";
  const passengers = Math.floor(num(b.passengers));
  if (!(passengers >= 1)) errors.passengers = "Please enter the number of passengers.";
  else if (passengers > maxPassengers) errors.passengers = `This vehicle seats up to ${maxPassengers} passengers.`;
  const expectedTotal = num(b.expectedTotal);
  if (!(expectedTotal >= 0)) errors.expectedTotal = "Fare is missing. Please wait for the fare to load.";

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    ...quote!,
    customer: { name, mobile: mobile!, email },
    passengers,
    specialRequirements: str(b.specialRequirements, 1000),
    expectedTotal,
  };
}

/** Validates an admin-submitted pricing config. Returns a clean copy (no unknown keys). */
export function validatePricingConfig(raw: unknown): PricingConfig {
  const errors: Record<string, string> = {};
  const r = isObj(raw) ? raw : {};
  const nonNeg = (v: unknown, path: string, max = 1_000_000): number => {
    const n = num(v);
    if (!(n >= 0 && n <= max)) {
      errors[path] = `${path} must be a number between 0 and ${max}.`;
      return 0;
    }
    return n;
  };
  const bool = (v: unknown) => v === true;
  const o = (v: unknown) => (isObj(v) ? v : {});

  const vehiclesRaw = Array.isArray(r.vehicles) ? r.vehicles : [];
  if (!vehiclesRaw.length) errors.vehicles = "At least one vehicle is required.";
  const ids = new Set<string>();
  const vehicles = vehiclesRaw.slice(0, 30).map((vr, i) => {
    const v = o(vr);
    const p = `vehicles[${i}]`;
    const id = str(v.id, 40);
    if (!/^[a-z0-9\-]{2,40}$/.test(id)) errors[`${p}.id`] = `${p}.id must be 2-40 lowercase letters, digits or dashes.`;
    if (ids.has(id)) errors[`${p}.id`] = `Duplicate vehicle id "${id}".`;
    ids.add(id);
    const ow = o(v.oneWay), rt = o(v.roundTrip), lc = o(v.local), ap = o(v.airport);
    const pkgIds = new Set<string>();
    const packages = (Array.isArray(lc.packages) ? lc.packages : []).slice(0, 10).map((pr, j) => {
      const pk = o(pr);
      const pid = str(pk.id, 40);
      if (!/^[a-z0-9\-]{1,40}$/.test(pid) || pkgIds.has(pid)) errors[`${p}.local.packages[${j}].id`] = "Package id must be unique lowercase text.";
      pkgIds.add(pid);
      return {
        id: pid,
        label: str(pk.label, 60) || pid,
        hours: nonNeg(pk.hours, `${p}.local.packages[${j}].hours`, 24),
        km: nonNeg(pk.km, `${p}.local.packages[${j}].km`, 1000),
        price: nonNeg(pk.price, `${p}.local.packages[${j}].price`),
      };
    });
    return {
      id,
      name: str(v.name, 80) || id,
      category: str(v.category, 40) || "Car",
      seats: Math.max(1, Math.min(60, Math.floor(nonNeg(v.seats, `${p}.seats`, 60)))),
      luggage: Math.floor(nonNeg(v.luggage, `${p}.luggage`, 50)),
      enabled: bool(v.enabled),
      oneWay: {
        baseFare: nonNeg(ow.baseFare, `${p}.oneWay.baseFare`),
        perKm: nonNeg(ow.perKm, `${p}.oneWay.perKm`, 1000),
        minKm: nonNeg(ow.minKm, `${p}.oneWay.minKm`, 2000),
      },
      roundTrip: {
        baseFare: nonNeg(rt.baseFare, `${p}.roundTrip.baseFare`),
        perKm: nonNeg(rt.perKm, `${p}.roundTrip.perKm`, 1000),
        minKmPerDay: nonNeg(rt.minKmPerDay, `${p}.roundTrip.minKmPerDay`, 2000),
      },
      local: {
        packages,
        extraKmRate: nonNeg(lc.extraKmRate, `${p}.local.extraKmRate`, 1000),
        extraHourRate: nonNeg(lc.extraHourRate, `${p}.local.extraHourRate`, 10000),
      },
      airport: {
        baseFare: nonNeg(ap.baseFare, `${p}.airport.baseFare`),
        includedKm: nonNeg(ap.includedKm, `${p}.airport.includedKm`, 1000),
        perKmAfter: nonNeg(ap.perKmAfter, `${p}.airport.perKmAfter`, 1000),
      },
    };
  });
  if (vehicles.length && !vehicles.some((v) => v.enabled)) errors.vehicles = "At least one vehicle must be enabled.";

  const tt = o(r.tripTypesEnabled);
  const da = o(r.driverAllowance), nc = o(r.nightCharge), wc = o(r.waitingCharge), es = o(r.extraStopCharge);
  const tl = o(r.toll), pk = o(r.parking), mf = o(r.minimumFare), gst = o(r.gst);
  const startHour = Math.floor(nonNeg(nc.startHour, "nightCharge.startHour", 23));
  const endHour = Math.floor(nonNeg(nc.endHour, "nightCharge.endHour", 23));
  const nightMode = nc.mode === "percent" ? "percent" : "flat";
  const tollMode = tl.mode === "per_km_estimate" || tl.mode === "actuals" ? tl.mode : "routes_api";

  const extraIds = new Set<string>();
  const extras = (Array.isArray(r.extras) ? r.extras : []).slice(0, 20).map((er, i) => {
    const e = o(er);
    const id = str(e.id, 40);
    if (!/^[a-z0-9\-]{1,40}$/.test(id) || extraIds.has(id)) errors[`extras[${i}].id`] = "Extra id must be unique lowercase text.";
    extraIds.add(id);
    return { id, label: str(e.label, 80) || id, amount: nonNeg(e.amount, `extras[${i}].amount`), enabled: bool(e.enabled) };
  });

  const config: PricingConfig = {
    currency: "INR",
    vehicles,
    tripTypesEnabled: {
      one_way: bool(tt.one_way),
      round_trip: bool(tt.round_trip),
      local: bool(tt.local),
      airport: bool(tt.airport),
    },
    driverAllowance: {
      enabled: bool(da.enabled),
      oneWayFlat: nonNeg(da.oneWayFlat, "driverAllowance.oneWayFlat"),
      perDay: nonNeg(da.perDay, "driverAllowance.perDay"),
      airportFlat: nonNeg(da.airportFlat, "driverAllowance.airportFlat"),
      localFlat: nonNeg(da.localFlat, "driverAllowance.localFlat"),
    },
    nightCharge: {
      enabled: bool(nc.enabled),
      startHour,
      endHour,
      mode: nightMode,
      value: nonNeg(nc.value, "nightCharge.value", nightMode === "percent" ? 100 : 1_000_000),
    },
    waitingCharge: {
      enabled: bool(wc.enabled),
      freeMinutes: nonNeg(wc.freeMinutes, "waitingCharge.freeMinutes", 1440),
      perHour: nonNeg(wc.perHour, "waitingCharge.perHour"),
    },
    extraStopCharge: { enabled: bool(es.enabled), perStop: nonNeg(es.perStop, "extraStopCharge.perStop") },
    toll: { enabled: bool(tl.enabled), mode: tollMode, perKmEstimate: nonNeg(tl.perKmEstimate, "toll.perKmEstimate", 100) },
    parking: {
      enabled: bool(pk.enabled),
      airportFlat: nonNeg(pk.airportFlat, "parking.airportFlat"),
      perStop: nonNeg(pk.perStop, "parking.perStop"),
    },
    minimumFare: { enabled: bool(mf.enabled), amount: nonNeg(mf.amount, "minimumFare.amount") },
    gst: { enabled: bool(gst.enabled), percent: nonNeg(gst.percent, "gst.percent", 28) },
    extras,
    maxRouteKm: nonNeg(r.maxRouteKm ?? 2500, "maxRouteKm", 10000) || 2500,
  };
  if (!Object.values(config.tripTypesEnabled).some(Boolean)) errors.tripTypesEnabled = "Enable at least one trip type.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return config;
}
