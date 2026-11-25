import { useEffect, useState } from "react";
import { api, type BusinessInfo } from "./api";
import RouteMap from "./RouteMap";
import { formatDuration } from "../../lib/booking/fare-engine";
import { buildWhatsAppMessage, formatDateIN, formatTimeIN, whatsAppLink } from "../../lib/booking/whatsapp";
import { TRIP_TYPE_LABELS, type PlaceSelection } from "../../lib/booking/types";
import "./booking.css";

interface Props {
  bookingId?: string;
  accessToken?: string;
}

/** Shows the saved booking (from the database, not browser memory) with WhatsApp confirmation. */
export default function ConfirmationPage(props: Props) {
  const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const id = props.bookingId || qs.get("id") || "";
  const token = props.accessToken || qs.get("token") || "";
  const [data, setData] = useState<{ booking: any; business: BusinessInfo } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      setError("Booking link is incomplete.");
      return;
    }
    api.booking(id, token).then(setData).catch((e) => setError(e.message));
  }, [id, token]);

  if (error) {
    return (
      <div className="ntt-booking ntt-state">
        <h2>We couldn't open this booking</h2>
        <p>{error}</p>
        <a className="ntt-btn" href="/book">
          Make a new booking
        </a>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="ntt-booking ntt-state">
        <span className="ntt-spinner large" />
        <p>Loading your booking…</p>
      </div>
    );
  }

  const b = data.booking;
  const biz = data.business;
  const stops: PlaceSelection[] = b.stops || [];
  const fullAddr = (name: string, addr: string) => (name && !addr.startsWith(name) ? `${name}, ${addr}` : addr);
  const pickupAddr = fullAddr(b.pickup_name, b.pickup_address);
  const dropAddr = fullAddr(b.drop_name, b.drop_address);
  const time = String(b.pickup_time).slice(0, 5);
  const pickupDirections =
    b.pickup_lat != null && b.pickup_lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${b.pickup_lat},${b.pickup_lng}`
      : "";
  const baseMessage = buildWhatsAppMessage(
    {
      bookingId: b.booking_code,
      customerName: b.customer_name,
      customerMobile: b.customer_mobile,
      customerEmail: b.customer_email,
      pickupAddress: pickupAddr,
      dropAddress: dropAddr,
      stops: stops.map((s) => fullAddr(s.name, s.address)),
      pickupDate: b.pickup_date,
      pickupTime: time,
      returnDate: b.return_date,
      tripType: b.trip_type,
      vehicleName: b.vehicle_name,
      passengers: b.passengers,
      routeKm: Number(b.route_km),
      durationMinutes: b.duration_minutes,
      total: Number(b.final_fare),
    },
    biz.name
  );
  const fareFreeMessage = baseMessage.replace(/^\*Total Fare:\*.*$/m, "*Fare:* To be discussed with cab owner");
  const message = pickupDirections
    ? fareFreeMessage.replace(/^(\*Pickup:\*.*)$/m, (line) => `${line}\n*Pickup Location (Directions):* ${pickupDirections}`)
    : fareFreeMessage;
  const waUrl = whatsAppLink(biz.whatsappNumber, message);

  return (
    <div className="ntt-booking ntt-confirm">
      <header className="ntt-confirm-head">
        <div className="ntt-check-badge" aria-hidden>
          ✓
        </div>
        <h1>Booking received!</h1>
        <p>
          Your booking ID is <strong className="ntt-code">{b.booking_code}</strong>
        </p>
        <p className="ntt-muted">
          Status: <span className={`ntt-status ntt-status-${b.status}`}>{b.status}</span> · Our team will call you to confirm the driver details.
        </p>
      </header>

      <div className="ntt-confirm-actions">
        <a className="ntt-btn ntt-btn-whatsapp" href={waUrl} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.83 0-1.34.71-2 .96-2.28.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.56.79 1.93.86 2.07.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.28-.12.56.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.27.14.45.2.52.32.07.11.07.66-.17 1.34z" />
          </svg>
          Send confirmation on WhatsApp
        </a>
        <button
          type="button"
          className="ntt-btn"
          onClick={() =>
            navigator.clipboard?.writeText(message).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
          }
        >
          {copied ? "Copied ✓" : "Copy details"}
        </button>
        <button type="button" className="ntt-btn" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <div className="ntt-booking-grid">
        <div className="ntt-col-form">
          <section className="ntt-card">
            <h2>Trip details</h2>
            <dl className="ntt-details">
              <div>
                <dt>Trip type</dt>
                <dd>{TRIP_TYPE_LABELS[b.trip_type as keyof typeof TRIP_TYPE_LABELS]}</dd>
              </div>
              <div>
                <dt>Pickup date &amp; time</dt>
                <dd>
                  {formatDateIN(b.pickup_date)}, {formatTimeIN(time)}
                </dd>
              </div>
              {b.return_date && (
                <div>
                  <dt>Return date</dt>
                  <dd>{formatDateIN(b.return_date)}</dd>
                </div>
              )}
              <div>
                <dt>Vehicle</dt>
                <dd>{b.vehicle_name}</dd>
              </div>
              <div>
                <dt>Passengers</dt>
                <dd>{b.passengers}</dd>
              </div>
              <div>
                <dt>Distance / time</dt>
                <dd>
                  {Number(b.route_km)} km · {formatDuration(b.duration_minutes)}
                </dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{b.customer_name}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{b.customer_mobile}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{b.customer_email}</dd>
              </div>
              {b.special_requirements && (
                <div className="wide">
                  <dt>Special requirements</dt>
                  <dd>{b.special_requirements}</dd>
                </div>
              )}
            </dl>
          </section>
          <RouteMap
            compact
            pickup={{ placeId: "p", name: b.pickup_name, address: pickupAddr, location: { lat: b.pickup_lat, lng: b.pickup_lng } }}
            drop={{ placeId: "d", name: b.drop_name, address: dropAddr, location: { lat: b.drop_lat, lng: b.drop_lng } }}
            stops={stops}
            encodedPolyline={b.route_polyline || undefined}
          />
        </div>
        <aside className="ntt-col-side">
          <section className="ntt-fare-card">
            <h3>Final Fare</h3>
            <p style={{ margin: "12px 0 0", padding: "14px 16px", borderRadius: 12, background: "#fff7e6", border: "1px solid #f5c26b", color: "#7a4b00", fontWeight: 600, textAlign: "center" }}>
              Kindly discuss final fare with cab owner.
            </p>
          </section>
          <p className="ntt-fineprint">
            Questions? Call{" "}
            <a href={`tel:${biz.phone.replace(/\s/g, "")}`}>{biz.phone}</a>
            {biz.email && (
              <>
                {" "}
                or email <a href={`mailto:${biz.email}`}>{biz.email}</a>
              </>
            )}
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
