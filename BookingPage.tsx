import { useEffect, useMemo, useRef, useState } from "react";
import PlaceInput from "./PlaceInput";
import RouteMap from "./RouteMap";
import FareSummary from "./FareSummary";
import { api, ApiError, type BusinessInfo, type QuoteResponse, type TripPayload } from "./api";
import { calculateFare, FareError, formatInr } from "../../lib/booking/fare-engine";
import { MAX_STOPS, parseBookingRequest, ValidationError } from "../../lib/booking/validation";
import { TRIP_TYPE_LABELS, type FareBreakdown, type PlaceSelection, type PricingConfig, type TripType } from "../../lib/booking/types";
import "./booking.css";

interface Props {
  /** Called after a booking is saved. Defaults to navigating to /book/confirmation. */
  onConfirmed?: (bookingId: string, accessToken: string) => void;
  /** Hide the built-in page heading (when the site's own page hero is shown above). */
  hideHeader?: boolean;
  /** Rendered instead of the booking form if the booking service is unavailable (e.g. not configured yet). */
  fallback?: React.ReactNode;
}

/** Maps the site's existing link parameters (?tripType=round, ?destination=Shirdi, ?service=…) to this form. */
function initialTripType(qs: URLSearchParams): TripType {
  const t = qs.get("tripType") || qs.get("type") || "";
  if (t === "round" || t === "round_trip") return "round_trip";
  if (t === "local" || t === "airport") return t;
  return "one_way";
}

const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
function defaultTime() {
  const now = new Date(Date.now() + 2 * 3600_000);
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const m = ist.getMinutes() < 30 ? 30 : 0;
  if (m === 0) ist.setHours(ist.getHours() + 1);
  return `${String(ist.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const placeLabel = (p: PlaceSelection) => (p.name && !p.address.startsWith(p.name) ? `${p.name}, ${p.address}` : p.address);
const TRIP_SHORT: Record<TripType, string> = { one_way: "One Way", round_trip: "Round Trip", local: "Local", airport: "Airport" };
const WAIT_OPTIONS = [0, 30, 60, 90, 120, 180, 240];

export default function BookingPage({ onConfirmed, hideHeader, fallback }: Props) {
  const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [configError, setConfigError] = useState("");

  const [tripType, setTripType] = useState<TripType>(() => initialTripType(qs));
  const service = qs.get("service") || "";
  const initialDropText = qs.get("destination") || "";
  const [pickup, setPickup] = useState<PlaceSelection | null>(null);
  const [drop, setDrop] = useState<PlaceSelection | null>(null);
  const [stops, setStops] = useState<(PlaceSelection | null)[]>([]);
  const [pickupDate, setPickupDate] = useState(todayIST());
  const [pickupTime, setPickupTime] = useState(defaultTime());
  const [returnDate, setReturnDate] = useState(addDays(todayIST(), 1));
  const [vehicleId, setVehicleId] = useState(qs.get("vehicle") || "");
  const [localPackageId, setLocalPackageId] = useState("");
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [extraIds, setExtraIds] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [special, setSpecial] = useState(service ? `Service: ${service}` : "");

  const [route, setRoute] = useState<QuoteResponse["route"] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [serverFare, setServerFare] = useState<FareBreakdown | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fareChangedNotice, setFareChangedNotice] = useState("");
  const formTop = useRef<HTMLDivElement>(null);

  // Load pricing + business info
  const loadConfig = () => {
    setConfigError("");
    api
      .config()
      .then(({ pricing, business }) => {
        setPricing(pricing);
        setBusiness(business);
        const enabledTypes = (Object.keys(pricing.tripTypesEnabled) as TripType[]).filter((t) => pricing.tripTypesEnabled[t]);
        setTripType((t) => (enabledTypes.includes(t) ? t : enabledTypes[0]));
        setVehicleId((v) => (pricing.vehicles.some((x) => x.id === v) ? v : pricing.vehicles[0]?.id || ""));
      })
      .catch((e) => setConfigError(e.message || "Could not load booking options."));
  };
  useEffect(loadConfig, []);

  const vehicle = pricing?.vehicles.find((v) => v.id === vehicleId) || null;
  useEffect(() => {
    if (!vehicle) return;
    if (!vehicle.local.packages.some((p) => p.id === localPackageId)) setLocalPackageId(vehicle.local.packages[0]?.id || "");
    if (passengers > vehicle.seats) setPassengers(vehicle.seats);
  }, [vehicleId, pricing]);
  useEffect(() => {
    if (returnDate < pickupDate) setReturnDate(pickupDate);
  }, [pickupDate]);

  const validStops = stops.filter((s): s is PlaceSelection => !!s);
  const routeKey = [pickup?.placeId, ...validStops.map((s) => s.placeId), drop?.placeId].join("|");

  const tripPayload = (vid = vehicleId): TripPayload | null =>
    pickup && drop
      ? {
          pickup,
          drop,
          stops: validStops,
          tripType,
          vehicleId: vid,
          pickupDate,
          pickupTime,
          returnDate: tripType === "round_trip" ? returnDate : undefined,
          localPackageId: tripType === "local" ? localPackageId : undefined,
          waitingMinutes,
          extraIds,
        }
      : null;

  // 1. Fetch the Google route via the server whenever the locations change
  useEffect(() => {
    setServerFare(null);
    if (!pickup || !drop || !vehicleId) {
      setRoute(null);
      setRouteError("");
      return;
    }
    let cancelled = false;
    setRouteLoading(true);
    setRouteError("");
    // The route depends only on the locations, so a neutral one-way quote is used to fetch it.
    // The displayed fare is recalculated instantly below for the customer's actual options.
    const payload = tripPayload()!;
    api
      .quote({
        ...payload,
        tripType: "one_way",
        pickupDate: todayIST(),
        pickupTime: "09:00",
        returnDate: undefined,
        localPackageId: undefined,
        waitingMinutes: 0,
        extraIds: [],
      })
      .then((q) => {
        if (cancelled) return;
        setRoute(q.route);
        setServerFare(q.fare);
      })
      .catch((e: ApiError) => {
        if (cancelled) return;
        setRoute(null);
        setRouteError(e.message);
      })
      .finally(() => !cancelled && setRouteLoading(false));
    return () => {
      cancelled = true;
    };
  }, [routeKey, !!pricing]);

  // 2. Instant fare: same engine as the server, recalculated on every option change
  const fareInput = {
    tripType,
    vehicleId,
    pickupDate,
    pickupTime,
    returnDate: tripType === "round_trip" ? returnDate : undefined,
    localPackageId: tripType === "local" ? localPackageId : undefined,
    stopsCount: validStops.length,
    waitingMinutes,
    extraIds,
  };
  const { fare, fareError } = useMemo(() => {
    if (!pricing || !route || !vehicleId) return { fare: serverFare, fareError: "" };
    try {
      return { fare: calculateFare(pricing, fareInput, route), fareError: "" };
    } catch (e) {
      return { fare: null, fareError: e instanceof FareError ? e.message : "Could not calculate the fare." };
    }
  }, [pricing, route, JSON.stringify(fareInput), serverFare]);

  // Per-vehicle estimate for the vehicle cards
  const vehicleTotals = useMemo(() => {
    const out: Record<string, number | null> = {};
    if (!pricing || !route) return out;
    for (const v of pricing.vehicles) {
      try {
        const pkg = tripType === "local" ? v.local.packages.find((p) => p.id === localPackageId)?.id || v.local.packages[0]?.id : undefined;
        out[v.id] = calculateFare(pricing, { ...fareInput, vehicleId: v.id, localPackageId: pkg }, route).total;
      } catch {
        out[v.id] = null;
      }
    }
    return out;
  }, [pricing, route, JSON.stringify(fareInput)]);

  useEffect(() => setFareChangedNotice(""), [fare?.total]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const payload = tripPayload();
    const body = {
      ...(payload || { pickup, drop, stops: validStops, ...fareInput }),
      customer: { name, mobile, email },
      passengers,
      specialRequirements: special,
      expectedTotal: fare?.total ?? NaN,
    };
    const unselectedStop = stops.findIndex((s) => !s);
    try {
      parseBookingRequest(body, vehicle?.seats || 1);
      if (unselectedStop >= 0) throw new ValidationError({ [`stops.${unselectedStop}`]: "Select this stop from the suggestions or remove it." });
      if (!fare) throw new ValidationError({ fare: fareError || routeError || "Please wait for the fare to be calculated." });
      setErrors({});
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(err.fields);
        const first = document.querySelector(".ntt-booking .has-error, .ntt-booking [aria-invalid='true']");
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      throw err;
    }
    setSubmitting(true);
    try {
      const res = await api.book(body as any);
      if (onConfirmed) onConfirmed(res.bookingId, res.accessToken);
      else window.location.assign(`/book/confirmation?id=${encodeURIComponent(res.bookingId)}&token=${encodeURIComponent(res.accessToken)}`);
    } catch (err) {
      const ae = err as ApiError;
      if (ae.code === "fare_changed") {
        // Pricing was updated by the business. Reload rules so the preview matches, then ask the customer to confirm again.
        api.config().then(({ pricing }) => setPricing(pricing));
        setFareChangedNotice(`The fare was updated to ${formatInr(ae.body.fare.total)}. Please review it and tap Confirm Booking again.`);
      } else if (ae.code === "validation") {
        setErrors(ae.body.fields || {});
        setSubmitError(ae.message);
      } else {
        setSubmitError(ae.message || "Booking failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (configError && fallback) {
    return <>{fallback}</>;
  }
  if (configError) {
    return (
      <div className="ntt-booking ntt-state">
        <h2>Online booking is temporarily unavailable</h2>
        <p>{configError}</p>
        <button className="ntt-btn" onClick={loadConfig}>
          Try again
        </button>
        {business?.phone && <a href={`tel:${business.phone.replace(/\s/g, "")}`}>Call {business.phone}</a>}
      </div>
    );
  }
  if (!pricing) {
    return (
      <div className="ntt-booking ntt-state">
        <span className="ntt-spinner large" />
        <p>Loading booking options…</p>
      </div>
    );
  }

  const enabledTypes = (Object.keys(TRIP_TYPE_LABELS) as TripType[]).filter((t) => pricing.tripTypesEnabled[t]);
  const err = (k: string) => errors[k];
  const extras = pricing.extras.filter((x) => x.enabled);

  return (
    <div className="ntt-booking" ref={formTop}>
      {!hideHeader && (
        <header className="ntt-booking-head">
          <h1>Book Your Cab</h1>
          <p>Pick exact locations on Google Maps and see your final fare before you confirm.</p>
        </header>
      )}
      {service && <p className="ntt-service-chip">Service: {service}</p>}

      <form className="ntt-booking-grid" onSubmit={submit} noValidate>
        <div className="ntt-col-form">
          {/* Trip */}
          <section className="ntt-card ntt-o1">
            <h2>
              <span className="ntt-step">1</span>Trip details
            </h2>
            <div className="ntt-tabs" role="radiogroup" aria-label="Trip type">
              {enabledTypes.map((t) => (
                <button
                  type="button"
                  key={t}
                  role="radio"
                  aria-checked={tripType === t}
                  className={tripType === t ? "active" : ""}
                  onClick={() => setTripType(t)}
                >
                  {TRIP_SHORT[t]}
                </button>
              ))}
            </div>
            {tripType === "airport" && <p className="ntt-hint">For airport pickup or drop. Choose the airport as pickup or destination.</p>}

            <div className="ntt-route-inputs">
              <PlaceInput
                label="Pickup location"
                placeholder="Search building, area, station, airport…"
                value={pickup}
                onChange={setPickup}
                error={err("pickup")}
                icon="pickup"
              />
              {stops.map((s, i) => (
                <PlaceInput
                  key={i}
                  label={`Stop ${i + 1}`}
                  placeholder="Search a stop on the way"
                  value={s}
                  onChange={(p) => setStops((arr) => arr.map((x, j) => (j === i ? p : x)))}
                  onRemove={() => setStops((arr) => arr.filter((_, j) => j !== i))}
                  error={err(`stops.${i}`)}
                  icon="stop"
                />
              ))}
              <PlaceInput
                label="Drop-off location"
                placeholder="Search destination"
                value={drop}
                onChange={setDrop}
                error={err("drop")}
                icon="drop"
                initialText={initialDropText}
              />
              {stops.length < MAX_STOPS && tripType !== "airport" && (
                <button type="button" className="ntt-link-btn" onClick={() => setStops((s) => [...s, null])}>
                  + Add a stop
                  {pricing.extraStopCharge.enabled && pricing.extraStopCharge.perStop > 0 && (
                    <span className="ntt-muted"> ({formatInr(pricing.extraStopCharge.perStop)} per stop)</span>
                  )}
                </button>
              )}
            </div>

            <div className="ntt-row">
              <div className={`ntt-field ${err("pickupDate") ? "has-error" : ""}`}>
                <label htmlFor="ntt-date">Pickup date</label>
                <input id="ntt-date" type="date" min={todayIST()} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
                {err("pickupDate") && <p className="ntt-error">{err("pickupDate")}</p>}
              </div>
              <div className={`ntt-field ${err("pickupTime") ? "has-error" : ""}`}>
                <label htmlFor="ntt-time">Pickup time</label>
                <input id="ntt-time" type="time" step={900} value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required />
                {err("pickupTime") && <p className="ntt-error">{err("pickupTime")}</p>}
              </div>
            </div>
            {tripType === "round_trip" && (
              <div className={`ntt-field ${err("returnDate") ? "has-error" : ""}`}>
                <label htmlFor="ntt-return">Return date</label>
                <input id="ntt-return" type="date" min={pickupDate} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                {err("returnDate") && <p className="ntt-error">{err("returnDate")}</p>}
              </div>
            )}
            {tripType === "local" && vehicle && (
              <div className={`ntt-field ${err("localPackageId") ? "has-error" : ""}`}>
                <label htmlFor="ntt-pkg">Local package</label>
                <select id="ntt-pkg" value={localPackageId} onChange={(e) => setLocalPackageId(e.target.value)}>
                  {vehicle.local.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} – {formatInr(p.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {pricing.waitingCharge.enabled && (
              <div className="ntt-field">
                <label htmlFor="ntt-wait">Expected waiting time (optional)</label>
                <select id="ntt-wait" value={waitingMinutes} onChange={(e) => setWaitingMinutes(+e.target.value)}>
                  {WAIT_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m === 0 ? "No waiting" : m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}
                      {m > 0 && m <= pricing.waitingCharge.freeMinutes ? " (free)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Vehicle */}
          <section className="ntt-card ntt-o3">
            <h2>
              <span className="ntt-step">2</span>Choose your vehicle
            </h2>
            <div className="ntt-vehicles" role="radiogroup" aria-label="Vehicle">
              {pricing.vehicles.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  role="radio"
                  aria-checked={vehicleId === v.id}
                  className={`ntt-vehicle ${vehicleId === v.id ? "active" : ""}`}
                  onClick={() => setVehicleId(v.id)}
                >
                  <span className="ntt-vehicle-cat">{v.category}</span>
                  <strong>{v.name}</strong>
                  <span className="ntt-vehicle-meta">
                    {v.seats} seats · {v.luggage} bags
                  </span>
                  <span className="ntt-vehicle-rate">
                    {tripType === "one_way" && `₹${v.oneWay.perKm}/km`}
                    {tripType === "round_trip" && `₹${v.roundTrip.perKm}/km`}
                    {tripType === "airport" && `From ${formatInr(v.airport.baseFare)}`}
                    {tripType === "local" && `From ${formatInr(Math.min(...v.local.packages.map((p) => p.price)))}`}
                  </span>
                  {vehicleTotals[v.id] != null && <span className="ntt-vehicle-total">{formatInr(vehicleTotals[v.id]!)}</span>}
                </button>
              ))}
            </div>
            {extras.length > 0 && (
              <fieldset className="ntt-extras">
                <legend>Add-ons</legend>
                {extras.map((x) => (
                  <label key={x.id} className="ntt-check">
                    <input
                      type="checkbox"
                      checked={extraIds.includes(x.id)}
                      onChange={(e) => setExtraIds((ids) => (e.target.checked ? [...ids, x.id] : ids.filter((i) => i !== x.id)))}
                    />
                    {x.label} <span className="ntt-muted">+{formatInr(x.amount)}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </section>

          {/* Customer */}
          <section className="ntt-card ntt-o5">
            <h2>
              <span className="ntt-step">3</span>Your details
            </h2>
            <div className={`ntt-field ${err("customer.name") ? "has-error" : ""}`}>
              <label htmlFor="ntt-name">Full name</label>
              <input id="ntt-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err("customer.name")} />
              {err("customer.name") && <p className="ntt-error">{err("customer.name")}</p>}
            </div>
            <div className="ntt-row">
              <div className={`ntt-field ${err("customer.mobile") ? "has-error" : ""}`}>
                <label htmlFor="ntt-mobile">Mobile number</label>
                <div className="ntt-prefix">
                  <span>+91</span>
                  <input
                    id="ntt-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={14}
                    placeholder="98XXXXXXXX"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    aria-invalid={!!err("customer.mobile")}
                  />
                </div>
                {err("customer.mobile") && <p className="ntt-error">{err("customer.mobile")}</p>}
              </div>
              <div className={`ntt-field ${err("customer.email") ? "has-error" : ""}`}>
                <label htmlFor="ntt-email">Email address</label>
                <input
                  id="ntt-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!err("customer.email")}
                />
                {err("customer.email") && <p className="ntt-error">{err("customer.email")}</p>}
              </div>
            </div>
            <div className={`ntt-field ${err("passengers") ? "has-error" : ""}`}>
              <label htmlFor="ntt-pax">Number of passengers</label>
              <div className="ntt-stepper">
                <button type="button" aria-label="Fewer passengers" onClick={() => setPassengers((p) => Math.max(1, p - 1))}>
                  −
                </button>
                <input
                  id="ntt-pax"
                  type="number"
                  min={1}
                  max={vehicle?.seats}
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, +e.target.value || 1))}
                />
                <button type="button" aria-label="More passengers" onClick={() => setPassengers((p) => Math.min(vehicle?.seats || 1, p + 1))}>
                  +
                </button>
                <span className="ntt-muted">Max {vehicle?.seats}</span>
              </div>
              {err("passengers") && <p className="ntt-error">{err("passengers")}</p>}
            </div>
            <div className="ntt-field">
              <label htmlFor="ntt-special">Special requirements (optional)</label>
              <textarea
                id="ntt-special"
                rows={3}
                maxLength={1000}
                placeholder="Child seat, extra luggage, exact gate/landmark, flight number…"
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
              />
            </div>
          </section>
        </div>

        <aside className="ntt-col-side">
          <div className="ntt-o2">
          <RouteMap
            pickup={pickup}
            drop={drop}
            stops={validStops}
            encodedPolyline={route?.encodedPolyline}
            distanceKm={route ? Math.round(route.distanceMeters / 100) / 10 : undefined}
            durationMinutes={route ? Math.round(route.durationSeconds / 60) : undefined}
            loading={routeLoading}
          />
          </div>
          <div className="ntt-o4">
          <FareSummary
            fare={fare}
            pickupAddress={pickup ? placeLabel(pickup) : undefined}
            dropAddress={drop ? placeLabel(drop) : undefined}
            stops={validStops.map(placeLabel)}
            loading={routeLoading}
            error={routeError || fareError || err("fare")}
          />
          </div>
          {fareChangedNotice && <p className="ntt-notice ntt-o6">{fareChangedNotice}</p>}
          {submitError && <p className="ntt-error ntt-submit-error ntt-o6">{submitError}</p>}
          <div className="ntt-submit-bar ntt-o6">
            {business?.phone && (
              <a className="ntt-bar-call" href={`tel:${business.phone.replace(/\s/g, "")}`} aria-label={`Call ${business.phone}`}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            )}
            <div className="ntt-submit-total">
              <small>Total fare</small>
              <strong>{fare ? formatInr(fare.total) : "—"}</strong>
            </div>
            <button type="submit" className="ntt-btn ntt-btn-primary" disabled={submitting || routeLoading || !fare}>
              {submitting ? "Booking…" : "Confirm Booking"}
            </button>
          </div>
          <p className="ntt-fineprint ntt-o6">
            You'll see the total fare before you confirm. The fare is fixed at booking time.
            {business?.phone && (
              <>
                {" "}
                Need help? Call <a href={`tel:${business.phone.replace(/\s/g, "")}`}>{business.phone}</a>.
              </>
            )}
          </p>
        </aside>
      </form>
    </div>
  );
}
