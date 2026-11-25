import type {
  FareBreakdown,
  FareInput,
  FareLine,
  PricingConfig,
  RouteInfo,
  VehiclePricing,
} from "./types.js";

export class FareError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "FareError";
  }
}

const rupees = (n: number) => Math.round(n);
const fmtKm = (n: number) => `${Math.round(n * 10) / 10} km`;
const fmtInr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Calendar days from pickup to return, inclusive (a same-day round trip counts as 1). */
export function tripDaysBetween(pickupDate: string, returnDate?: string): number {
  if (!returnDate) return 1;
  const a = Date.parse(`${pickupDate}T00:00:00Z`);
  const b = Date.parse(`${returnDate}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) throw new FareError("bad_date", "Invalid trip dates.");
  const days = Math.round((b - a) / 86_400_000) + 1;
  if (days < 1) throw new FareError("bad_return_date", "Return date cannot be before the pickup date.");
  return days;
}

/** True if HH:mm falls inside the night window. Handles windows that cross midnight, e.g. 22 to 6. */
export function isNightTime(time: string, startHour: number, endHour: number): boolean {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return false;
  const minutes = h * 60 + (m || 0);
  const start = startHour * 60;
  const end = endHour * 60;
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

export function findVehicle(config: PricingConfig, vehicleId: string): VehiclePricing {
  const v = config.vehicles.find((x) => x.id === vehicleId);
  if (!v || !v.enabled) throw new FareError("bad_vehicle", "Selected vehicle is not available.");
  return v;
}

/**
 * Calculates the fare. This is the single source of truth: the browser runs it for an instant preview,
 * and the server runs it again with the pricing stored in the database before saving any booking.
 */
export function calculateFare(config: PricingConfig, input: FareInput, route: RouteInfo): FareBreakdown {
  if (!config.tripTypesEnabled[input.tripType]) {
    throw new FareError("bad_trip_type", "This trip type is not available right now.");
  }
  const vehicle = findVehicle(config, input.vehicleId);
  const routeKm = Math.max(0, route.distanceMeters / 1000);
  if (routeKm > config.maxRouteKm) {
    throw new FareError("route_too_long", `Routes over ${config.maxRouteKm} km cannot be booked online. Please call us.`);
  }
  const durationMinutes = Math.round(route.durationSeconds / 60);
  const tripDays = input.tripType === "round_trip" ? tripDaysBetween(input.pickupDate, input.returnDate) : 1;
  const stops = Math.max(0, Math.floor(input.stopsCount || 0));

  const lines: FareLine[] = [];
  const notes: string[] = [];
  let chargeableKm = 0;
  let coreFare = 0; // base + distance/package; night % applies to this

  const push = (line: FareLine) => {
    line.amount = rupees(line.amount);
    if (line.amount !== 0 || line.code === "distance" || line.code === "package") lines.push(line);
  };

  switch (input.tripType) {
    case "one_way": {
      const p = vehicle.oneWay;
      chargeableKm = Math.max(Math.ceil(routeKm), p.minKm);
      push({ code: "base", label: "Base fare", amount: p.baseFare });
      push({
        code: "distance",
        label: "Distance fare",
        amount: chargeableKm * p.perKm,
        detail: `${chargeableKm} km × ₹${p.perKm}/km${chargeableKm > Math.ceil(routeKm) ? ` (minimum ${p.minKm} km)` : ""}`,
      });
      coreFare = p.baseFare + chargeableKm * p.perKm;
      if (config.driverAllowance.enabled) {
        push({ code: "driver_allowance", label: "Driver allowance", amount: config.driverAllowance.oneWayFlat });
      }
      break;
    }
    case "round_trip": {
      if (!input.returnDate) throw new FareError("missing_return_date", "Please choose a return date.");
      const p = vehicle.roundTrip;
      const actual = Math.ceil(routeKm * 2);
      const minimum = p.minKmPerDay * tripDays;
      chargeableKm = Math.max(actual, minimum);
      push({ code: "base", label: "Base fare", amount: p.baseFare });
      push({
        code: "distance",
        label: "Distance fare",
        amount: chargeableKm * p.perKm,
        detail:
          chargeableKm > actual
            ? `${chargeableKm} km × ₹${p.perKm}/km (minimum ${p.minKmPerDay} km/day × ${tripDays} day${tripDays > 1 ? "s" : ""})`
            : `${chargeableKm} km (both ways) × ₹${p.perKm}/km`,
      });
      coreFare = p.baseFare + chargeableKm * p.perKm;
      if (config.driverAllowance.enabled) {
        push({
          code: "driver_allowance",
          label: "Driver allowance",
          amount: config.driverAllowance.perDay * tripDays,
          detail: `${fmtInr(config.driverAllowance.perDay)} × ${tripDays} day${tripDays > 1 ? "s" : ""}`,
        });
      }
      break;
    }
    case "local": {
      const pkg = vehicle.local.packages.find((x) => x.id === input.localPackageId);
      if (!pkg) throw new FareError("bad_package", "Please choose a local package.");
      chargeableKm = Math.max(Math.ceil(routeKm), pkg.km);
      push({ code: "package", label: `Local package (${pkg.label})`, amount: pkg.price });
      coreFare = pkg.price;
      const extraKm = Math.max(0, Math.ceil(routeKm) - pkg.km);
      if (extraKm > 0) {
        push({
          code: "distance",
          label: "Extra distance",
          amount: extraKm * vehicle.local.extraKmRate,
          detail: `${extraKm} km × ₹${vehicle.local.extraKmRate}/km`,
        });
        coreFare += extraKm * vehicle.local.extraKmRate;
      }
      const extraHours = Math.max(0, Math.ceil(durationMinutes / 60) - pkg.hours);
      if (extraHours > 0) {
        push({
          code: "distance",
          label: "Extra hours (estimated)",
          amount: extraHours * vehicle.local.extraHourRate,
          detail: `${extraHours} hr × ₹${vehicle.local.extraHourRate}/hr`,
        });
      }
      notes.push(
        `Extra km (₹${vehicle.local.extraKmRate}/km) and extra hours (₹${vehicle.local.extraHourRate}/hr) beyond the package are billed at actuals.`
      );
      if (config.driverAllowance.enabled) {
        push({ code: "driver_allowance", label: "Driver allowance", amount: config.driverAllowance.localFlat });
      }
      break;
    }
    case "airport": {
      const p = vehicle.airport;
      chargeableKm = Math.ceil(routeKm);
      const extraKm = Math.max(0, chargeableKm - p.includedKm);
      push({ code: "base", label: `Airport transfer (up to ${p.includedKm} km)`, amount: p.baseFare });
      push({
        code: "distance",
        label: "Distance beyond included km",
        amount: extraKm * p.perKmAfter,
        detail: `${extraKm} km × ₹${p.perKmAfter}/km`,
      });
      coreFare = p.baseFare + extraKm * p.perKmAfter;
      if (config.driverAllowance.enabled) {
        push({ code: "driver_allowance", label: "Driver allowance", amount: config.driverAllowance.airportFlat });
      }
      if (config.parking.enabled) {
        push({ code: "parking", label: "Airport parking / entry", amount: config.parking.airportFlat });
      }
      break;
    }
  }

  // Tolls
  if (config.toll.enabled) {
    const directions = input.tripType === "round_trip" ? 2 : 1;
    if (config.toll.mode === "actuals") {
      notes.push("Toll charges are not included and are payable at actuals during the trip.");
    } else {
      let toll: number;
      let detail: string;
      if (config.toll.mode === "routes_api" && route.tollEstimate != null) {
        toll = route.tollEstimate * directions;
        detail = directions === 2 ? "Google Maps toll estimate × 2 (both ways)" : "Google Maps toll estimate";
      } else {
        toll = routeKm * config.toll.perKmEstimate * directions;
        detail = `Estimated at ₹${config.toll.perKmEstimate}/km${directions === 2 ? " both ways" : ""}`;
      }
      if (rupees(toll) > 0) {
        push({ code: "toll", label: "Toll charges (estimated)", amount: toll, detail });
        notes.push("Toll charges are estimated; any difference is settled at actuals.");
      }
    }
  }

  // Stops
  if (stops > 0 && config.extraStopCharge.enabled) {
    push({
      code: "extra_stops",
      label: "Additional stops",
      amount: stops * config.extraStopCharge.perStop,
      detail: `${stops} × ${fmtInr(config.extraStopCharge.perStop)}`,
    });
  }
  if (stops > 0 && config.parking.enabled && config.parking.perStop > 0) {
    push({ code: "parking", label: "Parking at stops", amount: stops * config.parking.perStop });
  }

  // Night
  if (config.nightCharge.enabled && isNightTime(input.pickupTime, config.nightCharge.startHour, config.nightCharge.endHour)) {
    const amt = config.nightCharge.mode === "percent" ? (coreFare * config.nightCharge.value) / 100 : config.nightCharge.value;
    push({
      code: "night",
      label: "Night charge",
      amount: amt,
      detail: `Pickup between ${config.nightCharge.startHour}:00 and ${config.nightCharge.endHour}:00`,
    });
  }

  // Waiting
  const waitingMinutes = Math.max(0, Math.floor(input.waitingMinutes || 0));
  if (config.waitingCharge.enabled && waitingMinutes > config.waitingCharge.freeMinutes) {
    const billable = waitingMinutes - config.waitingCharge.freeMinutes;
    const halfHours = Math.ceil(billable / 30);
    push({
      code: "waiting",
      label: "Waiting charges",
      amount: (halfHours * config.waitingCharge.perHour) / 2,
      detail: `${billable} min beyond ${config.waitingCharge.freeMinutes} free min`,
    });
  }

  // Optional extras the customer picked
  const uniqueExtras = Array.from(new Set(input.extraIds || []));
  for (const id of uniqueExtras) {
    const extra = config.extras.find((e) => e.id === id && e.enabled);
    if (extra) push({ code: "extra", label: extra.label, amount: extra.amount });
  }

  let subtotal = lines.reduce((s, l) => s + l.amount, 0);

  if (config.minimumFare.enabled && subtotal < config.minimumFare.amount) {
    push({
      code: "minimum_fare_adjustment",
      label: "Minimum fare adjustment",
      amount: config.minimumFare.amount - subtotal,
      detail: `Minimum booking fare is ${fmtInr(config.minimumFare.amount)}`,
    });
    subtotal = lines.reduce((s, l) => s + l.amount, 0);
  }

  if (config.gst.enabled && config.gst.percent > 0) {
    push({ code: "gst", label: `GST (${config.gst.percent}%)`, amount: (subtotal * config.gst.percent) / 100 });
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);

  return {
    currency: "INR",
    pricingVersion: config.version ?? null,
    tripType: input.tripType,
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.category} · ${vehicle.name}`,
    routeKm: Math.round(routeKm * 10) / 10,
    chargeableKm,
    durationMinutes,
    tripDays,
    lines,
    subtotal,
    total,
    notes,
  };
}

export const formatInr = fmtInr;
export const formatKm = fmtKm;
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
