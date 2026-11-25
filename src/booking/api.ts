import { PUBLIC_ENV } from "./env";
import type { FareBreakdown, PlaceSelection, PricingConfig, TripType } from "../../lib/booking/types";

export interface BusinessInfo {
  name: string;
  whatsappNumber: string;
  phone: string;
  email: string;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public body: any) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_ENV.apiBase}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers || {}) },
    });
  } catch {
    throw new ApiError(0, "network", "No internet connection. Please check your network and try again.", null);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error || "error", body.message || "Something went wrong.", body);
  return body as T;
}

export interface TripPayload {
  pickup: PlaceSelection;
  drop: PlaceSelection;
  stops: PlaceSelection[];
  tripType: TripType;
  vehicleId: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  localPackageId?: string;
  waitingMinutes: number;
  extraIds: string[];
}

export interface QuoteResponse {
  places?: { pickup: PlaceSelection; drop: PlaceSelection; stops: PlaceSelection[] };
  route: { distanceMeters: number; durationSeconds: number; encodedPolyline?: string; tollEstimate?: number | null };
  fare: FareBreakdown | null;
  fareError: string | null;
}

export interface PlaceSuggestion {
  placeId: string;
  main: string;
  secondary: string;
  description: string;
}

export const api = {
  places: (input: string) => call<{ suggestions: PlaceSuggestion[] }>(`/api/places?input=${encodeURIComponent(input)}`),
  place: (placeId: string) => call<{ place: PlaceSelection }>(`/api/places?placeId=${encodeURIComponent(placeId)}`),
  config: () => call<{ pricing: PricingConfig; business: BusinessInfo }>("/api/booking-config"),
  quote: (p: TripPayload) => call<QuoteResponse>("/api/quote", { method: "POST", body: JSON.stringify(p) }),
  book: (p: TripPayload & { customer: { name: string; mobile: string; email: string }; passengers: number; specialRequirements: string; expectedTotal: number }) =>
    call<{ bookingId: string; accessToken: string; fare: FareBreakdown }>("/api/bookings", { method: "POST", body: JSON.stringify(p) }),
  booking: (id: string, token: string) =>
    call<{ booking: any; business: BusinessInfo }>(`/api/booking?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`),
};

export function adminCall<T>(path: string, token: string, init: RequestInit = {}) {
  return call<T>(path, { ...init, headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) } });
}
