import { formatDuration, formatInr } from "../../lib/booking/fare-engine";
import type { FareBreakdown } from "../../lib/booking/types";

interface Props {
  fare: FareBreakdown | null;
  pickupAddress?: string;
  dropAddress?: string;
  stops?: string[];
  loading?: boolean;
  error?: string;
  title?: string;
}

/** Clean fare breakdown card. Used in the booking page (live) and confirmation page (saved snapshot). */
export default function FareSummary({ fare, pickupAddress, dropAddress, stops = [], loading, error, title = "Fare Estimate" }: Props) {
  return (
    <section className="ntt-fare-card" aria-live="polite" aria-busy={loading}>
      <h3>{title}</h3>
      {(pickupAddress || dropAddress) && (
        <ol className="ntt-trip-points">
          {pickupAddress && (
            <li>
              <span className="ntt-dot ntt-dot-pickup" />
              <div>
                <small>Pickup</small>
                {pickupAddress}
              </div>
            </li>
          )}
          {stops.map((s, i) => (
            <li key={i}>
              <span className="ntt-dot ntt-dot-stop" />
              <div>
                <small>Stop {i + 1}</small>
                {s}
              </div>
            </li>
          ))}
          {dropAddress && (
            <li>
              <span className="ntt-dot ntt-dot-drop" />
              <div>
                <small>Destination</small>
                {dropAddress}
              </div>
            </li>
          )}
        </ol>
      )}

      {error && <p className="ntt-error ntt-fare-error">{error}</p>}
      {!fare && !error && (
        <p className="ntt-muted">{loading ? "Calculating your fare…" : "Select pickup and destination to see your fare instantly."}</p>
      )}

      {fare && (
        <div className={loading ? "ntt-fare-stale" : ""}>
          <dl className="ntt-trip-stats">
            <div>
              <dt>Route distance</dt>
              <dd>{fare.routeKm} km</dd>
            </div>
            <div>
              <dt>Est. journey time</dt>
              <dd>{formatDuration(fare.durationMinutes)}</dd>
            </div>
            {fare.tripType === "round_trip" && (
              <div>
                <dt>Trip duration</dt>
                <dd>
                  {fare.tripDays} day{fare.tripDays > 1 ? "s" : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>Chargeable distance</dt>
              <dd>{fare.chargeableKm} km</dd>
            </div>
          </dl>

          <table className="ntt-fare-table">
            <tbody>
              {fare.lines.map((l, i) => (
                <tr key={i}>
                  <th scope="row">
                    {l.label}
                    {l.detail && <small>{l.detail}</small>}
                  </th>
                  <td>{formatInr(l.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total Fare</th>
                <td>{formatInr(fare.total)}</td>
              </tr>
            </tfoot>
          </table>
          {fare.notes.length > 0 && (
            <ul className="ntt-fare-notes">
              {fare.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
