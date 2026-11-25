import { formatDuration, formatInr } from "./fare-engine.js";
import { TRIP_TYPE_LABELS, type TripType } from "./types.js";

export interface WhatsAppBookingSummary {
  bookingId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  pickupAddress: string;
  dropAddress: string;
  stops: string[];
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm
  returnDate?: string | null;
  tripType: TripType;
  vehicleName: string;
  passengers: number;
  routeKm: number;
  durationMinutes: number;
  total: number;
}

export function formatDateIN(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatTimeIN(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** WhatsApp-formatted message (*bold* is WhatsApp markup). */
export function buildWhatsAppMessage(b: WhatsAppBookingSummary, businessName: string): string {
  const lines = [
    `*${businessName} – Booking Confirmation*`,
    ``,
    `*Booking ID:* ${b.bookingId}`,
    `*Name:* ${b.customerName}`,
    ``,
    `*Pickup:* ${b.pickupAddress}`,
    ...b.stops.map((s, i) => `*Stop ${i + 1}:* ${s}`),
    `*Drop:* ${b.dropAddress}`,
    ``,
    `*Trip:* ${TRIP_TYPE_LABELS[b.tripType]}`,
    `*Date:* ${formatDateIN(b.pickupDate)}`,
    `*Time:* ${formatTimeIN(b.pickupTime)}`,
    ...(b.returnDate ? [`*Return:* ${formatDateIN(b.returnDate)}`] : []),
    `*Vehicle:* ${b.vehicleName}`,
    `*Passengers:* ${b.passengers}`,
    `*Distance:* ${b.routeKm} km`,
    `*Est. Journey Time:* ${formatDuration(b.durationMinutes)}`,
    ``,
    `*Total Fare:* ${formatInr(b.total)}`,
    ``,
    `*Contact:* ${b.customerMobile}`,
    `*Email:* ${b.customerEmail}`,
    ``,
    `Please confirm my booking. Thank you!`,
  ];
  return lines.join("\n");
}

/** wa.me link. `number` may contain spaces/+; digits only are used. Indian 10-digit numbers get the 91 prefix. */
export function whatsAppLink(number: string, message: string): string {
  let digits = number.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
