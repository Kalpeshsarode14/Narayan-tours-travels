import type { PricingConfig } from "./types.js";

/**
 * Starting pricing, used until the owner saves pricing in /admin.
 * Vehicle ids, names and per-km rates (Dzire ₹14, Ertiga ₹17) match src/config/site.js,
 * so existing links such as /book?vehicle=ertiga keep working.
 * Everything else is a typical Maharashtra outstation default.
 * The owner should review it in the Admin panel. After seeding, the database copy is the one used.
 */
export const DEFAULT_PRICING: PricingConfig = {
  currency: "INR",
  vehicles: [
    {
      id: "dzire",
      name: "Maruti Suzuki Dzire",
      category: "Sedan",
      seats: 4,
      luggage: 2,
      enabled: true,
      oneWay: { baseFare: 0, perKm: 14, minKm: 100 },
      roundTrip: { baseFare: 0, perKm: 14, minKmPerDay: 300 },
      local: {
        packages: [
          { id: "4h-40km", label: "4 Hrs / 40 Km", hours: 4, km: 40, price: 1200 },
          { id: "8h-80km", label: "8 Hrs / 80 Km", hours: 8, km: 80, price: 2200 },
          { id: "12h-120km", label: "12 Hrs / 120 Km", hours: 12, km: 120, price: 3200 },
        ],
        extraKmRate: 14,
        extraHourRate: 150,
      },
      airport: { baseFare: 800, includedKm: 30, perKmAfter: 14 },
    },
    {
      id: "ertiga",
      name: "Maruti Suzuki Ertiga",
      category: "MPV / Family car",
      seats: 6,
      luggage: 3,
      enabled: true,
      oneWay: { baseFare: 0, perKm: 17, minKm: 100 },
      roundTrip: { baseFare: 0, perKm: 17, minKmPerDay: 300 },
      local: {
        packages: [
          { id: "4h-40km", label: "4 Hrs / 40 Km", hours: 4, km: 40, price: 1500 },
          { id: "8h-80km", label: "8 Hrs / 80 Km", hours: 8, km: 80, price: 2700 },
          { id: "12h-120km", label: "12 Hrs / 120 Km", hours: 12, km: 120, price: 3900 },
        ],
        extraKmRate: 17,
        extraHourRate: 200,
      },
      airport: { baseFare: 1000, includedKm: 30, perKmAfter: 17 },
    },
  ],
  tripTypesEnabled: { one_way: true, round_trip: true, local: true, airport: true },
  driverAllowance: { enabled: true, oneWayFlat: 300, perDay: 300, airportFlat: 0, localFlat: 0 },
  nightCharge: { enabled: true, startHour: 22, endHour: 6, mode: "flat", value: 250 },
  waitingCharge: { enabled: true, freeMinutes: 30, perHour: 150 },
  extraStopCharge: { enabled: true, perStop: 100 },
  toll: { enabled: true, mode: "per_km_estimate", perKmEstimate: 1.5 },
  parking: { enabled: true, airportFlat: 150, perStop: 0 },
  minimumFare: { enabled: true, amount: 800 },
  gst: { enabled: false, percent: 5 },
  extras: [{ id: "carrier", label: "Roof carrier for luggage", amount: 200, enabled: true }],
  maxRouteKm: 2500,
};
