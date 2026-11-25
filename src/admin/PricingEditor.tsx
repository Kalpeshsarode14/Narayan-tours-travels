import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AdminFetch } from "./AdminApp";
import { calculateFare, formatInr } from "../../lib/booking/fare-engine";
import { DEFAULT_PRICING } from "../../lib/booking/default-pricing";
import { TRIP_TYPE_LABELS, type PricingConfig, type TripType, type VehiclePricing } from "../../lib/booking/types";
import { validatePricingConfig, ValidationError } from "../../lib/booking/validation";
import FareSummary from "../booking/FareSummary";

type Path = (string | number)[];
function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T;
  const [k, ...rest] = path;
  const copy: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  copy[k] = setIn((obj as any)[k], rest, value);
  return copy;
}
function getIn(obj: any, path: Path) {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
}


interface EditorState {
  cfg: PricingConfig;
  upd: (path: Path, value: unknown) => void;
  errors: Record<string, string>;
}
const EditorCtx = createContext<EditorState | null>(null);
const useEditor = () => useContext(EditorCtx)!;
const pathKey = (path: Path) =>
  path.map((p) => (typeof p === "number" ? `[${p}]` : `.${p}`)).join("").replace(/^\./, "");

function Num({ path, label, suffix, prefix = "₹", step = 1 }: { path: Path; label: string; suffix?: string; prefix?: string; step?: number }) {
  const { cfg, upd, errors } = useEditor();
  const key = pathKey(path);
  return (
    <label className={`ntt-adm-num ${errors[key] ? "has-error" : ""}`}>
      <span>{label}</span>
      <span className="ntt-adm-input">
        {prefix && <em>{prefix}</em>}
        <input
          type="number"
          min={0}
          step={step}
          value={getIn(cfg, path) ?? 0}
          onChange={(e) => upd(path, e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix && <em>{suffix}</em>}
      </span>
      {errors[key] && <small className="ntt-error">{errors[key]}</small>}
    </label>
  );
}

function Toggle({ path, label }: { path: Path; label: string }) {
  const { cfg, upd } = useEditor();
  return (
    <label className="ntt-adm-toggle">
      <input type="checkbox" checked={!!getIn(cfg, path)} onChange={(e) => upd(path, e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function PricingEditor({ api }: { api: AdminFetch }) {
  const [cfg, setCfg] = useState<PricingConfig | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ pricing: PricingConfig }>("/api/admin/pricing")
      .then(({ pricing }) => {
        setCfg(pricing);
        setSaved(JSON.stringify(pricing));
      })
      .catch((e) => setStatus({ kind: "error", text: e.message }));
  }, []);

  if (!cfg) return <p>{status?.text || "Loading pricing…"}</p>;
  const dirty = JSON.stringify(cfg) !== saved;
  const upd = (path: Path, value: unknown) => setCfg((c) => setIn(c!, path, value));

  async function save() {
    setStatus(null);
    try {
      validatePricingConfig(cfg);
      setErrors({});
    } catch (e) {
      if (e instanceof ValidationError) {
        setErrors(e.fields);
        setStatus({ kind: "error", text: `Please fix: ${e.message}` });
        return;
      }
    }
    setSaving(true);
    try {
      const { pricing } = await api<{ pricing: PricingConfig }>("/api/admin/pricing", { method: "PUT", body: JSON.stringify({ pricing: cfg }) });
      setCfg(pricing);
      setSaved(JSON.stringify(pricing));
      setStatus({ kind: "ok", text: `Saved. Pricing version ${pricing.version} is now live for new bookings.` });
    } catch (e: any) {
      if (e.body?.fields) setErrors(e.body.fields);
      setStatus({ kind: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  const addVehicle = () => {
    const base: VehiclePricing = JSON.parse(JSON.stringify(DEFAULT_PRICING.vehicles[0]));
    let n = cfg.vehicles.length + 1;
    while (cfg.vehicles.some((v) => v.id === `vehicle-${n}`)) n++;
    upd(["vehicles"], [...cfg.vehicles, { ...base, id: `vehicle-${n}`, name: "New vehicle", category: "Car", enabled: false }]);
  };

  return (
    <EditorCtx.Provider value={{ cfg, upd, errors }}>
    <div className="ntt-adm-pricing">
      <div className="ntt-adm-savebar">
        <div>
          <strong>Pricing rules</strong>
          <span className="ntt-muted"> · {cfg.version ? `Live version ${cfg.version}` : "Using built-in defaults (not saved yet)"}</span>
        </div>
        {status && <span className={status.kind === "ok" ? "ntt-ok" : "ntt-error"}>{status.text}</span>}
        <button className="ntt-btn" disabled={!dirty || saving} onClick={() => setCfg(JSON.parse(saved))}>
          Discard changes
        </button>
        <button className="ntt-btn ntt-btn-primary" disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving…" : "Save & publish"}
        </button>
      </div>

      <section className="ntt-card">
        <h2>Trip types offered</h2>
        <div className="ntt-adm-grid">
          {(Object.keys(TRIP_TYPE_LABELS) as TripType[]).map((t) => (
            <Toggle key={t} path={["tripTypesEnabled", t]} label={TRIP_TYPE_LABELS[t]} />
          ))}
        </div>
      </section>

      <section className="ntt-card">
        <h2>Vehicles &amp; rates</h2>
        {cfg.vehicles.map((v, i) => (
          <details key={i} className="ntt-adm-vehicle" open={i === 0}>
            <summary>
              <strong>
                {v.category} · {v.name}
              </strong>
              <span className={v.enabled ? "ntt-ok" : "ntt-muted"}>{v.enabled ? "Enabled" : "Hidden"}</span>
            </summary>
            <div className="ntt-adm-grid">
              <Toggle path={["vehicles", i, "enabled"]} label="Show to customers" />
              <label className="ntt-adm-num">
                <span>Name</span>
                <input value={v.name} onChange={(e) => upd(["vehicles", i, "name"], e.target.value)} />
              </label>
              <label className="ntt-adm-num">
                <span>Category</span>
                <input value={v.category} onChange={(e) => upd(["vehicles", i, "category"], e.target.value)} />
              </label>
              <label className={`ntt-adm-num ${errors[`vehicles[${i}].id`] ? "has-error" : ""}`}>
                <span>ID (used in links, lowercase)</span>
                <input value={v.id} onChange={(e) => upd(["vehicles", i, "id"], e.target.value.toLowerCase())} />
                {errors[`vehicles[${i}].id`] && <small className="ntt-error">{errors[`vehicles[${i}].id`]}</small>}
              </label>
              <Num path={["vehicles", i, "seats"]} label="Passenger seats" prefix="" />
              <Num path={["vehicles", i, "luggage"]} label="Luggage (bags)" prefix="" />
            </div>
            <h4>One way (outstation)</h4>
            <div className="ntt-adm-grid">
              <Num path={["vehicles", i, "oneWay", "baseFare"]} label="Base fare" />
              <Num path={["vehicles", i, "oneWay", "perKm"]} label="Rate per km" suffix="/km" step={0.5} />
              <Num path={["vehicles", i, "oneWay", "minKm"]} label="Minimum chargeable km" prefix="" suffix="km" />
            </div>
            <h4>Round trip (outstation)</h4>
            <div className="ntt-adm-grid">
              <Num path={["vehicles", i, "roundTrip", "baseFare"]} label="Base fare" />
              <Num path={["vehicles", i, "roundTrip", "perKm"]} label="Rate per km" suffix="/km" step={0.5} />
              <Num path={["vehicles", i, "roundTrip", "minKmPerDay"]} label="Minimum km per day" prefix="" suffix="km/day" />
            </div>
            <h4>Airport transfer</h4>
            <div className="ntt-adm-grid">
              <Num path={["vehicles", i, "airport", "baseFare"]} label="Fixed fare" />
              <Num path={["vehicles", i, "airport", "includedKm"]} label="Km included" prefix="" suffix="km" />
              <Num path={["vehicles", i, "airport", "perKmAfter"]} label="Rate per km after that" suffix="/km" step={0.5} />
            </div>
            <h4>Local packages</h4>
            <table className="ntt-adm-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Hours</th>
                  <th>Km</th>
                  <th>Price ₹</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {v.local.packages.map((p, j) => (
                  <tr key={j}>
                    <td>
                      <input
                        value={p.label}
                        onChange={(e) => {
                          upd(["vehicles", i, "local", "packages", j, "label"], e.target.value);
                        }}
                      />
                    </td>
                    {(["hours", "km", "price"] as const).map((f) => (
                      <td key={f}>
                        <input
                          type="number"
                          min={0}
                          value={p[f]}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = { ...p, [f]: val };
                            next.id = `${next.hours}h-${next.km}km`;
                            upd(["vehicles", i, "local", "packages", j], next);
                          }}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        className="ntt-link-btn"
                        onClick={() => upd(["vehicles", i, "local", "packages"], v.local.packages.filter((_, k) => k !== j))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="ntt-link-btn"
              onClick={() => {
                let h = 6;
                while (v.local.packages.some((p) => p.id === `${h}h-${h * 10}km`)) h++;
                upd(["vehicles", i, "local", "packages"], [...v.local.packages, { id: `${h}h-${h * 10}km`, label: `${h} Hrs / ${h * 10} Km`, hours: h, km: h * 10, price: 0 }]);
              }}
            >
              + Add package
            </button>
            <div className="ntt-adm-grid">
              <Num path={["vehicles", i, "local", "extraKmRate"]} label="Extra km rate" suffix="/km" step={0.5} />
              <Num path={["vehicles", i, "local", "extraHourRate"]} label="Extra hour rate" suffix="/hr" />
            </div>
            {cfg.vehicles.length > 1 && (
              <button
                className="ntt-link-btn ntt-danger"
                onClick={() => confirm(`Remove ${v.name}?`) && upd(["vehicles"], cfg.vehicles.filter((_, k) => k !== i))}
              >
                Remove this vehicle
              </button>
            )}
          </details>
        ))}
        <button className="ntt-btn" onClick={addVehicle}>
          + Add vehicle
        </button>
      </section>

      <section className="ntt-card">
        <h2>Charges</h2>
        <div className="ntt-adm-block">
          <Toggle path={["driverAllowance", "enabled"]} label="Driver allowance" />
          <div className="ntt-adm-grid">
            <Num path={["driverAllowance", "oneWayFlat"]} label="One way (flat)" />
            <Num path={["driverAllowance", "perDay"]} label="Round trip (per day)" suffix="/day" />
            <Num path={["driverAllowance", "airportFlat"]} label="Airport (flat)" />
            <Num path={["driverAllowance", "localFlat"]} label="Local (flat)" />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["nightCharge", "enabled"]} label="Night charge" />
          <div className="ntt-adm-grid">
            <Num path={["nightCharge", "startHour"]} label="Night starts (hour, 0–23)" prefix="" suffix=":00" />
            <Num path={["nightCharge", "endHour"]} label="Night ends (hour, 0–23)" prefix="" suffix=":00" />
            <label className="ntt-adm-num">
              <span>Charge type</span>
              <select value={cfg.nightCharge.mode} onChange={(e) => upd(["nightCharge", "mode"], e.target.value)}>
                <option value="flat">Flat amount (₹)</option>
                <option value="percent">% of base + distance fare</option>
              </select>
            </label>
            <Num path={["nightCharge", "value"]} label="Amount" prefix={cfg.nightCharge.mode === "percent" ? "" : "₹"} suffix={cfg.nightCharge.mode === "percent" ? "%" : undefined} />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["waitingCharge", "enabled"]} label="Waiting charges" />
          <div className="ntt-adm-grid">
            <Num path={["waitingCharge", "freeMinutes"]} label="Free waiting" prefix="" suffix="min" />
            <Num path={["waitingCharge", "perHour"]} label="Rate (billed per 30 min)" suffix="/hr" />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["extraStopCharge", "enabled"]} label="Additional stop charge" />
          <div className="ntt-adm-grid">
            <Num path={["extraStopCharge", "perStop"]} label="Per stop" />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["toll", "enabled"]} label="Toll charges" />
          <div className="ntt-adm-grid">
            <label className="ntt-adm-num">
              <span>How tolls are charged</span>
              <select value={cfg.toll.mode} onChange={(e) => upd(["toll", "mode"], e.target.value)}>
                <option value="per_km_estimate">Estimate at ₹ per km</option>
                <option value="actuals">Not included, customer pays at actuals</option>
              </select>
            </label>
            <Num path={["toll", "perKmEstimate"]} label="Toll estimate per km" suffix="/km" step={0.1} />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["parking", "enabled"]} label="Parking charges" />
          <div className="ntt-adm-grid">
            <Num path={["parking", "airportFlat"]} label="Airport parking (flat)" />
            <Num path={["parking", "perStop"]} label="Parking per stop" />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["minimumFare", "enabled"]} label="Minimum booking fare" />
          <div className="ntt-adm-grid">
            <Num path={["minimumFare", "amount"]} label="Minimum fare" />
          </div>
        </div>
        <div className="ntt-adm-block">
          <Toggle path={["gst", "enabled"]} label="Add GST to fare" />
          <div className="ntt-adm-grid">
            <Num path={["gst", "percent"]} label="GST rate" prefix="" suffix="%" step={0.5} />
            <Num path={["maxRouteKm"]} label="Longest route bookable online" prefix="" suffix="km" />
          </div>
        </div>
      </section>

      <section className="ntt-card">
        <h2>Optional add-ons</h2>
        <p className="ntt-muted">Customers can tick these on the booking form.</p>
        <table className="ntt-adm-table">
          <thead>
            <tr>
              <th>Show</th>
              <th>Label</th>
              <th>Price ₹</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cfg.extras.map((x, i) => (
              <tr key={i}>
                <td>
                  <input type="checkbox" checked={x.enabled} onChange={(e) => upd(["extras", i, "enabled"], e.target.checked)} />
                </td>
                <td>
                  <input value={x.label} onChange={(e) => upd(["extras", i, "label"], e.target.value)} />
                </td>
                <td>
                  <input type="number" min={0} value={x.amount} onChange={(e) => upd(["extras", i, "amount"], Number(e.target.value))} />
                </td>
                <td>
                  <button className="ntt-link-btn" onClick={() => upd(["extras"], cfg.extras.filter((_, k) => k !== i))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="ntt-link-btn"
          onClick={() => {
            let n = cfg.extras.length + 1;
            while (cfg.extras.some((x) => x.id === `extra-${n}`)) n++;
            upd(["extras"], [...cfg.extras, { id: `extra-${n}`, label: "New add-on", amount: 0, enabled: false }]);
          }}
        >
          + Add add-on
        </button>
      </section>

      <FareTester cfg={cfg} />
    </div>
    </EditorCtx.Provider>
  );
}

/** Lets the owner try the unsaved rules on a sample trip before publishing. */
function FareTester({ cfg }: { cfg: PricingConfig }) {
  const [km, setKm] = useState(150);
  const [hours, setHours] = useState(3);
  const [tripType, setTripType] = useState<TripType>("one_way");
  const [vehicleId, setVehicleId] = useState(cfg.vehicles[0]?.id || "");
  const [days, setDays] = useState(2);
  const [time, setTime] = useState("09:00");
  const [toll, setToll] = useState(0);

  const result = useMemo(() => {
    const v = cfg.vehicles.find((x) => x.id === vehicleId) || cfg.vehicles[0];
    if (!v) return { error: "Add a vehicle first." };
    const testCfg = { ...cfg, vehicles: cfg.vehicles.map((x) => (x.id === v.id ? { ...x, enabled: true } : x)), tripTypesEnabled: { ...cfg.tripTypesEnabled, [tripType]: true } };
    const pickupDate = "2030-01-01";
    const returnDate = new Date(Date.UTC(2030, 0, days)).toISOString().slice(0, 10);
    try {
      return {
        fare: calculateFare(
          testCfg,
          {
            tripType,
            vehicleId: v.id,
            pickupDate,
            pickupTime: time,
            returnDate: tripType === "round_trip" ? returnDate : undefined,
            localPackageId: v.local.packages[0]?.id,
            stopsCount: 0,
            waitingMinutes: 0,
            extraIds: [],
          },
          { distanceMeters: km * 1000, durationSeconds: hours * 3600, tollEstimate: toll }
        ),
      };
    } catch (e: any) {
      return { error: e.message };
    }
  }, [cfg, km, hours, tripType, vehicleId, days, time, toll]);

  return (
    <section className="ntt-card">
      <h2>Test your pricing</h2>
      <p className="ntt-muted">Try a sample trip with the rules above (including unsaved changes).</p>
      <div className="ntt-adm-grid">
        <label className="ntt-adm-num">
          <span>Trip type</span>
          <select value={tripType} onChange={(e) => setTripType(e.target.value as TripType)}>
            {(Object.keys(TRIP_TYPE_LABELS) as TripType[]).map((t) => (
              <option key={t} value={t}>
                {TRIP_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="ntt-adm-num">
          <span>Vehicle</span>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {cfg.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="ntt-adm-num">
          <span>One-way route km</span>
          <input type="number" min={0} value={km} onChange={(e) => setKm(+e.target.value)} />
        </label>
        <label className="ntt-adm-num">
          <span>Drive time (hrs)</span>
          <input type="number" min={0} step={0.5} value={hours} onChange={(e) => setHours(+e.target.value)} />
        </label>
        <label className="ntt-adm-num">
          <span>Pickup time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="ntt-adm-num">
          <span>Map toll estimate ₹ (if any)</span>
          <input type="number" min={0} value={toll} onChange={(e) => setToll(+e.target.value)} />
        </label>
        {tripType === "round_trip" && (
          <label className="ntt-adm-num">
            <span>Round trip days</span>
            <input type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, +e.target.value))} />
          </label>
        )}
      </div>
      {"error" in result ? <p className="ntt-error">{result.error}</p> : <FareSummary fare={result.fare!} title={`Sample total: ${formatInr(result.fare!.total)}`} />}
    </section>
  );
}
