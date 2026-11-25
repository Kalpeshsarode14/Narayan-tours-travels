// Shared types for the NTT booking system (used by browser and server code).

export type TripType = "one_way" | "round_trip" | "local" | "airport";

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  one_way: "One Way (Outstation)",
  round_trip: "Round Trip (Outstation)",
  local: "Local (Hourly Package)",
  airport: "Airport Transfer",
};

export interface LocalPackage {
  id: string; // e.g. "4h-40km"
  label: string; // e.g. "4 Hrs / 40 Km"
  hours: number;
  km: number;
  price: number; // package price for this vehicle
}

export interface VehiclePricing {
  id: string; // e.g. "sedan"
  name: string; // e.g. "Swift Dzire or similar"
  category: string; // e.g. "Sedan"
  seats: number;
  luggage: number;
  enabled: boolean;
  oneWay: {
    baseFare: number;
    perKm: number;
    minKm: number; // minimum chargeable km for a one-way trip
  };
  roundTrip: {
    baseFare: number;
    perKm: number;
    minKmPerDay: number; // e.g. 300 km/day (Indian outstation norm)
  };
  local: {
    packages: LocalPackage[];
    extraKmRate: number; // beyond package km
    extraHourRate: number; // beyond package hours
  };
  airport: {
    baseFare: number; // covers includedKm
    includedKm: number;
    perKmAfter: number;
  };
}

export type ChargeMode = "flat" | "percent";
export type TollMode = "routes_api" | "per_km_estimate" | "actuals";

export interface ExtraCharge {
  id: string;
  label: string; // e.g. "Carrier / roof rack"
  amount: number;
  enabled: boolean;
}

export interface PricingConfig {
  version?: number; // assigned by the database
  currency: "INR";
  vehicles: VehiclePricing[];
  /** Trip types the customer may choose. */
  tripTypesEnabled: Record<TripType, boolean>;
  driverAllowance: {
    enabled: boolean;
    oneWayFlat: number; // one-way outstation
    perDay: number; // round trip, per calendar day
    airportFlat: number;
    localFlat: number;
  };
  nightCharge: {
    enabled: boolean;
    startHour: number; // 22 = 10 PM
    endHour: number; // 6 = 6 AM
    mode: ChargeMode;
    value: number; // ₹ or % of distance fare
  };
  waitingCharge: {
    enabled: boolean;
    freeMinutes: number;
    perHour: number; // billed per started 30 min (half of perHour)
  };
  extraStopCharge: {
    enabled: boolean;
    perStop: number;
  };
  toll: {
    enabled: boolean;
    mode: TollMode; // per_km_estimate, actuals = paid by customer on trip (routes_api = map-provider estimate, if available)
    perKmEstimate: number; // used for per_km_estimate, and as fallback when Google has no toll data
  };
  parking: {
    enabled: boolean;
    airportFlat: number;
    perStop: number;
  };
  minimumFare: {
    enabled: boolean;
    amount: number;
  };
  gst: {
    enabled: boolean;
    percent: number; // 5% for cab services without ITC
  };
  extras: ExtraCharge[];
  /** Maximum allowed trip distance (safety guard for abusive / mistaken routes). */
  maxRouteKm: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceSelection {
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
}

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
  /** Map-provider toll estimate in INR for one direction, if available (Ola Maps: not provided). */
  tollEstimate?: number | null;
}

export interface FareInput {
  tripType: TripType;
  vehicleId: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm (24h)
  returnDate?: string; // round trip only
  localPackageId?: string; // local only
  stopsCount: number;
  waitingMinutes: number;
  extraIds: string[];
  isAirportPickupOrDrop?: boolean;
}

export interface FareLine {
  code:
    | "base"
    | "distance"
    | "package"
    | "driver_allowance"
    | "toll"
    | "parking"
    | "night"
    | "waiting"
    | "extra_stops"
    | "extra"
    | "minimum_fare_adjustment"
    | "gst";
  label: string;
  amount: number;
  detail?: string;
}

export interface FareBreakdown {
  currency: "INR";
  pricingVersion: number | null;
  tripType: TripType;
  vehicleId: string;
  vehicleName: string;
  routeKm: number; // one-direction route distance (rounded to 0.1)
  chargeableKm: number;
  durationMinutes: number;
  tripDays: number;
  lines: FareLine[];
  subtotal: number;
  total: number;
  notes: string[]; // e.g. "Tolls payable at actuals"
}
