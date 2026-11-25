import { Fragment, useEffect, useState } from "react";
import type { AdminFetch } from "./AdminApp";
import FareSummary from "../booking/FareSummary";
import { formatDuration, formatInr } from "../../lib/booking/fare-engine";
import { formatDateIN, formatTimeIN } from "../../lib/booking/whatsapp";
import { TRIP_TYPE_LABELS } from "../../lib/booking/types";

const STATUSES = ["pending", "confirmed", "assigned", "completed", "cancelled"];

export default function BookingsTable({ api }: { api: AdminFetch }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    api<{ bookings: any[] }>(`/api/admin/bookings?${params}`)
      .then((r) => setRows(r.bookings))
      .catch((e) => setError(e.message));
  };
  useEffect(load, [status, page]);

  async function setRowStatus(id: string, s: string) {
    try {
      await api("/api/admin/bookings", { method: "PATCH", body: JSON.stringify({ id, status: s }) });
      setRows((rs) => rs!.map((r) => (r.id === id ? { ...r, status: s } : r)));
    } catch (e: any) {
      alert(e.message);
    }
  }

  const gmaps = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section className="ntt-card">
      <div className="ntt-adm-filters">
        <h2>Bookings</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            load();
          }}
        >
          <input placeholder="Booking ID, name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={status} onChange={(e) => (setPage(0), setStatus(e.target.value))}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="ntt-btn">Search</button>
        </form>
      </div>
      {error && <p className="ntt-error">{error}</p>}
      {!rows && !error && <p>Loading…</p>}
      {rows && rows.length === 0 && <p className="ntt-muted">No bookings found.</p>}
      {rows && rows.length > 0 && (
        <div className="ntt-adm-scroll">
          <table className="ntt-adm-table ntt-adm-bookings">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Trip date</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Fare</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className={open === r.id ? "open" : ""}>
                    <td>
                      <button className="ntt-link-btn" onClick={() => setOpen(open === r.id ? null : r.id)}>
                        {r.booking_code}
                      </button>
                      <small>{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</small>
                    </td>
                    <td>
                      {formatDateIN(r.pickup_date)}
                      <small>{formatTimeIN(String(r.pickup_time).slice(0, 5))}</small>
                    </td>
                    <td>
                      {r.customer_name}
                      <small>
                        <a href={`tel:${r.customer_mobile}`}>{r.customer_mobile}</a>
                      </small>
                    </td>
                    <td className="ntt-adm-route">
                      <span>{r.pickup_name || r.pickup_address}</span> → <span>{r.drop_name || r.drop_address}</span>
                      <small>
                        {Number(r.route_km)} km · {TRIP_TYPE_LABELS[r.trip_type as keyof typeof TRIP_TYPE_LABELS]}
                      </small>
                    </td>
                    <td>{r.vehicle_name}</td>
                    <td>
                      <strong>{formatInr(Number(r.final_fare))}</strong>
                    </td>
                    <td>
                      <select value={r.status} onChange={(e) => setRowStatus(r.id, e.target.value)} className={`ntt-status-select ntt-status-${r.status}`}>
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr className="ntt-adm-detail">
                      <td colSpan={7}>
                        <div className="ntt-adm-detail-grid">
                          <dl className="ntt-details">
                            <div>
                              <dt>Pickup</dt>
                              <dd>
                                {r.pickup_address}{" "}
                                <a href={gmaps(r.pickup_lat, r.pickup_lng)} target="_blank" rel="noreferrer">
                                  Map ↗
                                </a>
                              </dd>
                            </div>
                            {(r.stops || []).map((s: any, i: number) => (
                              <div key={i}>
                                <dt>Stop {i + 1}</dt>
                                <dd>
                                  {s.address}{" "}
                                  <a href={gmaps(s.location.lat, s.location.lng)} target="_blank" rel="noreferrer">
                                    Map ↗
                                  </a>
                                </dd>
                              </div>
                            ))}
                            <div>
                              <dt>Drop</dt>
                              <dd>
                                {r.drop_address}{" "}
                                <a href={gmaps(r.drop_lat, r.drop_lng)} target="_blank" rel="noreferrer">
                                  Map ↗
                                </a>
                              </dd>
                            </div>
                            {r.return_date && (
                              <div>
                                <dt>Return</dt>
                                <dd>{formatDateIN(r.return_date)}</dd>
                              </div>
                            )}
                            <div>
                              <dt>Passengers</dt>
                              <dd>{r.passengers}</dd>
                            </div>
                            <div>
                              <dt>Journey time</dt>
                              <dd>{formatDuration(r.duration_minutes)}</dd>
                            </div>
                            <div>
                              <dt>Email</dt>
                              <dd>{r.customer_email}</dd>
                            </div>
                            {r.special_requirements && (
                              <div>
                                <dt>Special requirements</dt>
                                <dd>{r.special_requirements}</dd>
                              </div>
                            )}
                          </dl>
                          <FareSummary fare={r.fare_breakdown} title="Booked fare (locked)" />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="ntt-adm-pager">
        <button className="ntt-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ← Newer
        </button>
        <span>Page {page + 1}</span>
        <button className="ntt-btn" disabled={!rows || rows.length < 50} onClick={() => setPage((p) => p + 1)}>
          Older →
        </button>
      </div>
    </section>
  );
}
