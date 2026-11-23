import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  User, Phone, MapPin, Flag, Calendar, Clock, Users, CircleAlert, CircleCheck, Copy, Send, Pencil,
  Calculator, ArrowRight, Info, Car,
} from 'lucide-react';
import { btn, WhatsAppIcon } from './UI.jsx';
import { CarArt } from './Art.jsx';
import { business, vehicles, fareDisclaimer, mapLocation, img, popularRoutes } from '../config/site.js';
import { destinations } from '../data/content.js';
import {
  estimateFare, inr, openWhatsApp, whatsappLink, vehicleById, formatDate, formatTime, todayISO, cleanMobile, telLink,
} from '../lib/utils.js';

/* ---------- shared field ---------- */
const inputCls = (err) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-base text-navy-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 ${
    err ? 'border-red-500 focus:ring-red-100' : 'border-navy-100 focus:border-navy-600 focus:ring-navy-100'
  }`;

function Field({ id, label, required, error, hint, icon: Icon, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        {Icon && <Icon className="h-4 w-4 text-saffron-500" aria-hidden="true" />}
        <span>{label}{required && <span className="text-red-600" aria-hidden="true">&nbsp;*</span>}</span>
        {!required && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 flex items-center gap-1 text-sm text-red-600"><CircleAlert className="h-4 w-4" /> {error}</p>}
    </div>
  );
}

const describedBy = (id, errors, hint) => (errors[id] ? `${id}-err` : hint ? `${id}-hint` : undefined);

function Segmented({ name, value, onChange, options }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-2 rounded-xl bg-navy-50 p-1.5 ring-1 ring-navy-100">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`min-h-[44px] rounded-lg px-3 font-display text-[15px] font-semibold transition ${value === o.value ? 'bg-navy-800 text-white shadow' : 'text-navy-800 hover:bg-white'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const tripOptions = [{ value: 'oneway', label: 'One Way' }, { value: 'round', label: 'Round Trip' }];

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/* =====================================================================
   BOOKING FORM
   ===================================================================== */
const emptyBooking = {
  name: '', mobile: '', pickup: '', destination: '', date: '', time: '', returnDate: '',
  vehicle: '', passengers: '', tripType: 'oneway', notes: '',
};

function validateBooking(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your full name.';
  if (!f.mobile.trim()) e.mobile = 'Please enter your mobile number.';
  else if (!cleanMobile(f.mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number.';
  if (f.pickup.trim().length < 2) e.pickup = 'Please enter a pickup location.';
  if (f.destination.trim().length < 2) e.destination = 'Please enter your destination.';
  if (!f.date) e.date = 'Please choose a journey date.';
  else if (f.date < todayISO()) e.date = 'Journey date cannot be in the past.';
  if (!f.time) e.time = 'Please choose a pickup time.';
  if (f.returnDate && f.date && f.returnDate < f.date) e.returnDate = 'Return date must be on or after the journey date.';
  if (!f.vehicle) e.vehicle = 'Please select a vehicle.';
  const p = Number(f.passengers);
  const v = vehicleById(f.vehicle);
  if (!f.passengers) e.passengers = 'Please enter the number of passengers.';
  else if (!Number.isInteger(p) || p < 1) e.passengers = 'Enter a number of 1 or more.';
  else if (v && p > v.seats) e.passengers = `${v.name} seats up to ${v.seats}. Choose a larger vehicle or reduce passengers.`;
  return e;
}

function bookingMessage(f, service) {
  const v = vehicleById(f.vehicle);
  const lines = [
    `*New Booking Request — ${business.name}*`,
    '',
    `Name: ${f.name.trim()}`,
    `Mobile: ${cleanMobile(f.mobile)}`,
    `Pickup: ${f.pickup.trim()}`,
    `Destination: ${f.destination.trim()}`,
    `Journey date: ${formatDate(f.date)}`,
    `Pickup time: ${formatTime(f.time)}`,
    f.returnDate ? `Return date: ${formatDate(f.returnDate)}` : null,
    `Vehicle: ${v.name} (₹${v.ratePerKm}/km)`,
    `Passengers: ${f.passengers}`,
    `Trip type: ${f.tripType === 'round' ? 'Round Trip' : 'One Way'}`,
    service ? `Service: ${service}` : null,
    f.notes.trim() ? `Additional requirements: ${f.notes.trim()}` : null,
    '',
    'Please confirm availability and the final fare. Thank you.',
  ];
  return lines.filter((l) => l !== null).join('\n');
}

export function BookingForm() {
  const [params] = useSearchParams();
  const service = params.get('service') || '';
  const [f, setF] = useState(() => ({
    ...emptyBooking,
    vehicle: vehicleById(params.get('vehicle')) ? params.get('vehicle') : '',
    destination: params.get('destination') || '',
    tripType: params.get('tripType') === 'round' ? 'round' : 'oneway',
  }));
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null); // { message, opened }
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);
  const resultRef = useRef(null);

  const set = (k) => (e) => {
    const val = e?.target ? e.target.value : e;
    setF((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  useEffect(() => { if (result) resultRef.current?.focus(); }, [result]);

  const submit = (e) => {
    e.preventDefault();
    const errs = validateBooking(f);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    const message = bookingMessage(f, service);
    const opened = openWhatsApp(message);
    setResult({ message, opened });
  };

  if (result) {
    const v = vehicleById(f.vehicle);
    const rows = [
      ['Name', f.name], ['Mobile', cleanMobile(f.mobile)], ['Pickup', f.pickup], ['Destination', f.destination],
      ['Journey date', formatDate(f.date)], ['Pickup time', formatTime(f.time)], ['Return date', f.returnDate ? formatDate(f.returnDate) : '—'],
      ['Vehicle', `${v.name} · ₹${v.ratePerKm}/km`], ['Passengers', f.passengers], ['Trip type', f.tripType === 'round' ? 'Round Trip' : 'One Way'],
      ...(service ? [['Service', service]] : []), ['Requirements', f.notes || '—'],
    ];
    return (
      <div ref={resultRef} tabIndex={-1} className="rounded-3xl bg-white p-6 sm:p-8 shadow-card ring-1 ring-navy-100 focus:outline-none" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <CircleCheck className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-display font-semibold text-navy-900">Your booking request is ready to send</p>
            <p className="text-[15px] text-slate-700">
              {result.opened ? 'WhatsApp has opened in a new tab with your details. ' : ''}
              Tap <strong>Send on WhatsApp</strong> to send it to {business.owner}. <strong>Your trip is not confirmed yet</strong> — the owner will reply to confirm availability and the final fare.
            </p>
          </div>
        </div>
        <h3 className="mt-6 font-display text-xl font-bold text-navy-900">Booking summary</h3>
        <dl className="mt-3 divide-y divide-navy-100 rounded-2xl ring-1 ring-navy-100">
          {rows.map(([k, val]) => (
            <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3 px-4 py-2.5 text-[15px]">
              <dt className="text-slate-500">{k}</dt><dd className="font-medium text-navy-900 break-words">{val}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={whatsappLink(result.message)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}>
            <WhatsAppIcon /> Send on WhatsApp
          </a>
          <button type="button" className={btn.outline} onClick={async () => setCopied(await copyText(result.message))}>
            <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy message'}
          </button>
          <button type="button" className={`${btn.base} text-navy-800 hover:bg-navy-50`} onClick={() => { setResult(null); setCopied(false); }}>
            <Pencil className="h-4 w-4" /> Edit details
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-500">Prefer to talk? Call <a className="font-semibold text-navy-800 underline" href={telLink}>{business.phoneDisplay}</a>.</p>
      </div>
    );
  }

  const v = vehicleById(f.vehicle);
  return (
    <form ref={formRef} onSubmit={submit} noValidate className="rounded-3xl bg-white p-6 sm:p-8 shadow-card ring-1 ring-navy-100">
      {service && (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 text-sm font-semibold text-navy-900">Service: {service}</p>
      )}
      {Object.keys(errors).some((k) => errors[k]) && (
        <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <CircleAlert className="h-4 w-4" /> Please correct the highlighted fields.
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name} icon={User}>
          <input id="name" name="name" autoComplete="name" className={inputCls(errors.name)} value={f.name} onChange={set('name')}
            aria-invalid={!!errors.name} aria-describedby={describedBy('name', errors)} placeholder="Your full name" />
        </Field>
        <Field id="mobile" label="Mobile number" required error={errors.mobile} icon={Phone} hint="10-digit number for trip updates">
          <input id="mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" className={inputCls(errors.mobile)} value={f.mobile} onChange={set('mobile')}
            aria-invalid={!!errors.mobile} aria-describedby={describedBy('mobile', errors, true)} placeholder="98XXXXXXXX" />
        </Field>
        <Field id="pickup" label="Pickup location" required error={errors.pickup} icon={MapPin}>
          <input id="pickup" name="pickup" className={inputCls(errors.pickup)} value={f.pickup} onChange={set('pickup')}
            aria-invalid={!!errors.pickup} aria-describedby={describedBy('pickup', errors)} placeholder="Area, city or landmark" />
        </Field>
        <Field id="destination" label="Destination" required error={errors.destination} icon={Flag}>
          <input id="destination" name="destination" list="dest-list" className={inputCls(errors.destination)} value={f.destination} onChange={set('destination')}
            aria-invalid={!!errors.destination} aria-describedby={describedBy('destination', errors)} placeholder="e.g. Shirdi" />
          <datalist id="dest-list">
            {destinations.filter((d) => d.km).map((d) => <option key={d.id} value={d.name} />)}
          </datalist>
        </Field>
        <Field id="date" label="Journey date" required error={errors.date} icon={Calendar}>
          <input id="date" name="date" type="date" min={todayISO()} className={inputCls(errors.date)} value={f.date} onChange={set('date')}
            aria-invalid={!!errors.date} aria-describedby={describedBy('date', errors)} />
        </Field>
        <Field id="time" label="Pickup time" required error={errors.time} icon={Clock}>
          <input id="time" name="time" type="time" className={inputCls(errors.time)} value={f.time} onChange={set('time')}
            aria-invalid={!!errors.time} aria-describedby={describedBy('time', errors)} />
        </Field>
        <Field id="returnDate" label="Return date" error={errors.returnDate} icon={Calendar}>
          <input id="returnDate" name="returnDate" type="date" min={f.date || todayISO()} className={inputCls(errors.returnDate)} value={f.returnDate} onChange={set('returnDate')}
            aria-invalid={!!errors.returnDate} aria-describedby={describedBy('returnDate', errors)} />
        </Field>
        <Field id="passengers" label="Number of passengers" required error={errors.passengers} icon={Users} hint={v ? `${v.name} seats up to ${v.seats}` : undefined}>
          <input id="passengers" name="passengers" type="number" min="1" max="6" inputMode="numeric" className={inputCls(errors.passengers)} value={f.passengers} onChange={set('passengers')}
            aria-invalid={!!errors.passengers} aria-describedby={describedBy('passengers', errors, !!v)} placeholder="1–6" />
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Car className="h-4 w-4 text-saffron-500" /> Vehicle<span className="text-red-600" aria-hidden="true">&nbsp;*</span></legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((vh) => {
            const active = f.vehicle === vh.id;
            return (
              <label key={vh.id} className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 pr-4 transition ${active ? 'border-saffron-500 bg-gold-100/50' : errors.vehicle ? 'border-red-400' : 'border-navy-100 hover:border-navy-300'}`}>
                <input type="radio" name="vehicle" value={vh.id} checked={active} onChange={set('vehicle')} className="sr-only peer" aria-describedby={errors.vehicle ? 'vehicle-err' : undefined} />
                <span className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-navy-800">{vh.photo ? <img src={img(vh.photo)} alt="" className="h-full w-full object-cover" /> : <CarArt kind={vh.art} color={vh.color} />}</span>
                <span className="flex-1">
                  <span className="block font-display font-semibold text-navy-900">{vh.short}</span>
                  <span className="block text-sm text-slate-500">Up to {vh.seats} passengers</span>
                </span>
                <span className="whitespace-nowrap font-display font-bold text-saffron-600">₹{vh.ratePerKm}/km</span>
                <span className="pointer-events-none absolute inset-0 rounded-2xl peer-focus-visible:ring-4 peer-focus-visible:ring-gold-300" />
              </label>
            );
          })}
        </div>
        {errors.vehicle && <p id="vehicle-err" className="mt-1 flex items-center gap-1 text-sm text-red-600"><CircleAlert className="h-4 w-4" /> {errors.vehicle}</p>}
      </fieldset>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-navy-900">Trip type<span className="text-red-600" aria-hidden="true">&nbsp;*</span></p>
        <Segmented name="Trip type" value={f.tripType} onChange={set('tripType')} options={tripOptions} />
      </div>

      <div className="mt-6">
        <Field id="notes" label="Additional requirements">
          <textarea id="notes" name="notes" rows="3" className={inputCls(false)} value={f.notes} onChange={set('notes')}
            placeholder="Flight number, child seat, luggage, stops on the way…" />
        </Field>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-slate-500 max-w-md"><Info className="h-4 w-4 mt-0.5 shrink-0" /> Submitting opens WhatsApp with your request. Your booking is confirmed only after the owner replies.</p>
        <button type="submit" className={`${btn.whatsapp} sm:min-w-[260px]`}><WhatsAppIcon /> Send booking request</button>
      </div>
    </form>
  );
}

/* =====================================================================
   FARE CALCULATOR
   ===================================================================== */
export function FareCalculator({ compact = false }) {
  const [params] = useSearchParams();
  const [vehicleId, setVehicleId] = useState(vehicleById(params.get('vehicle')) ? params.get('vehicle') : vehicles[0].id);
  const [km, setKm] = useState(() => {
    const k = Number(params.get('km'));
    return k > 0 ? String(k) : '150';
  });
  const [tripType, setTripType] = useState('oneway');
  const [copied, setCopied] = useState(false);

  const kmNum = Number(km);
  const kmError = km === '' ? 'Enter the estimated distance.' : !(kmNum > 0) ? 'Distance must be more than 0 km.' : kmNum > 5000 ? 'Please enter a distance under 5,000 km.' : '';
  const est = useMemo(() => (kmError ? null : estimateFare({ vehicleId, km: kmNum, tripType })), [vehicleId, kmNum, tripType, kmError]);
  const presets = [
    ...popularRoutes.filter((r) => r.km).map((r) => ({ id: r.to, name: r.to, km: r.km })),
    ...destinations.filter((d) => d.km && !popularRoutes.some((r) => r.to === d.name)),
  ];

  const msg = est
    ? `Hello ${business.name}, I used the fare calculator on your website.\nVehicle: ${est.vehicle.name}\nDistance: ${kmNum} km (${tripType === 'round' ? 'Round Trip' : 'One Way'}) = ${est.totalKm} km\nEstimated fare: ${inr(est.fare)}\nPlease share the final fare including tolls and other charges.`
    : '';

  return (
    <div className={`grid gap-6 ${compact ? '' : 'lg:grid-cols-[1.1fr_1fr]'} items-start`}>
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card ring-1 ring-navy-100">
        <p className="mb-2 text-sm font-semibold text-navy-900">1. Select vehicle</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Vehicle">
          {vehicles.map((v) => (
            <button key={v.id} type="button" role="radio" aria-checked={vehicleId === v.id} onClick={() => setVehicleId(v.id)}
              className={`rounded-2xl border-2 p-3 text-left transition ${vehicleId === v.id ? 'border-saffron-500 bg-gold-100/50' : 'border-navy-100 hover:border-navy-300'}`}>
              <span className="block aspect-[16/9] overflow-hidden rounded-xl bg-navy-800">{v.photo ? <img src={img(v.photo)} alt="" className="h-full w-full object-cover" /> : <CarArt kind={v.art} color={v.color} />}</span>
              <span className="mt-2 block font-display font-semibold text-navy-900">{v.short}</span>
              <span className="block text-sm text-saffron-600 font-semibold">₹{v.ratePerKm}/km</span>
            </button>
          ))}
        </div>

        <label htmlFor="km" className="mt-6 mb-2 block text-sm font-semibold text-navy-900">2. Estimated one-way distance (km)</label>
        <div className="flex items-center gap-3">
          <input id="km" type="number" min="1" max="5000" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)}
            aria-invalid={!!kmError} aria-describedby="km-help" className={`${inputCls(kmError)} max-w-[160px] font-display text-lg font-semibold`} />
          <input type="range" min="10" max="800" step="5" value={kmNum > 0 ? Math.min(kmNum, 800) : 10} onChange={(e) => setKm(e.target.value)}
            aria-label="Distance slider" className="flex-1 accent-saffron-500 h-11" />
        </div>
        <p id="km-help" className={`mt-1 text-sm ${kmError ? 'text-red-600' : 'text-slate-500'}`}>{kmError || 'Check the distance on Google Maps, or pick a route below.'}</p>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick routes from Mumbai">
          {presets.slice(0, compact ? 6 : 12).map((d) => (
            <button key={d.id} type="button" onClick={() => setKm(String(d.km))}
              className={`min-h-[36px] rounded-full px-3 text-sm ring-1 transition ${Number(km) === d.km ? 'bg-navy-800 text-white ring-navy-800' : 'bg-navy-50 text-navy-800 ring-navy-100 hover:bg-white'}`}>
              Mumbai → {d.name} <span className="opacity-70">~{d.km}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 mb-2 text-sm font-semibold text-navy-900">3. Trip type</p>
        <Segmented name="Trip type" value={tripType} onChange={setTripType} options={tripOptions} />
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 sm:p-8 text-white shadow-card lg:sticky lg:top-24" aria-live="polite">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-saffron-500/25 blur-2xl" aria-hidden="true" />
        <p className="relative flex items-center gap-2 text-navy-100"><Calculator className="h-5 w-5 text-gold-400" /> Estimated fare</p>
        <p className="relative mt-2 font-display text-5xl sm:text-6xl font-bold text-gold-400 tabular-nums">{est ? inr(est.fare) : '—'}</p>
        {est && (
          <>
            <p className="relative mt-3 text-navy-100">
              <span className="tabular-nums">{est.totalKm.toLocaleString('en-IN')} km</span> × ₹{est.rate}/km
              {tripType === 'round' && <span className="block text-sm">({kmNum} km each way × 2)</span>}
            </p>
            <div className="relative mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-sm text-navy-100 mb-2">Compare vehicles for this trip</p>
              {vehicles.map((v) => {
                const e = estimateFare({ vehicleId: v.id, km: kmNum, tripType });
                return (
                  <div key={v.id} className="flex justify-between py-1 text-[15px]">
                    <span className={v.id === vehicleId ? 'font-semibold text-white' : 'text-navy-100'}>{v.name.replace('Maruti Suzuki ', '')} · ₹{v.ratePerKm}/km</span>
                    <span className="tabular-nums font-semibold">{inr(e.fare)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <p className="relative mt-5 flex gap-2 text-sm text-navy-100"><Info className="h-4 w-4 mt-0.5 shrink-0 text-gold-400" /> {fareDisclaimer}</p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link to={`/book?vehicle=${vehicleId}&tripType=${tripType}`} className={btn.gold}>Book this trip <ArrowRight className="h-4 w-4" /></Link>
          {est && (
            <a href={whatsappLink(msg)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}><WhatsAppIcon /> Ask final fare</a>
          )}
          {est && !compact && (
            <button type="button" onClick={async () => setCopied(await copyText(msg))} className={btn.ghost}><Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   CONTACT FORM (sends via WhatsApp — no database configured)
   ===================================================================== */
export function ContactForm() {
  const [f, setF] = useState({ name: '', mobile: '', topic: 'General enquiry', message: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: undefined })); };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (f.name.trim().length < 2) errs.name = 'Please enter your name.';
    if (!cleanMobile(f.mobile)) errs.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (f.message.trim().length < 5) errs.message = 'Please write a short message.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      e.currentTarget.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    const message = `*${f.topic} — via website*\nName: ${f.name.trim()}\nMobile: ${cleanMobile(f.mobile)}\n\n${f.message.trim()}`;
    setDone({ message, opened: openWhatsApp(message) });
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card ring-1 ring-navy-100" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <CircleCheck className="h-6 w-6 shrink-0 text-emerald-600" />
          <p className="text-[15px] text-slate-700"><strong className="text-navy-900">Your message is ready.</strong> {done.opened ? 'WhatsApp has opened in a new tab. ' : ''}Tap below to send it — we reply on WhatsApp or by phone.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={whatsappLink(done.message)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}><WhatsAppIcon /> Send on WhatsApp</a>
          <button type="button" className={btn.outline} onClick={() => setDone(null)}><Pencil className="h-4 w-4" /> Edit</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6 sm:p-8 shadow-card ring-1 ring-navy-100">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="c-name" label="Your name" required error={errors.name} icon={User}>
          <input id="c-name" name="name" autoComplete="name" className={inputCls(errors.name)} value={f.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-err' : undefined} />
        </Field>
        <Field id="c-mobile" label="Mobile number" required error={errors.mobile} icon={Phone}>
          <input id="c-mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" className={inputCls(errors.mobile)} value={f.mobile} onChange={set('mobile')} aria-invalid={!!errors.mobile} aria-describedby={errors.mobile ? 'c-mobile-err' : undefined} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="c-topic" label="Enquiry type" required>
            <select id="c-topic" name="topic" className={inputCls(false)} value={f.topic} onChange={set('topic')}>
              {['General enquiry', 'Tour package enquiry', 'Corporate / business enquiry', 'Feedback'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="c-message" label="Message" required error={errors.message}>
            <textarea id="c-message" name="message" rows="4" className={inputCls(errors.message)} value={f.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'c-message-err' : undefined} placeholder="How can we help?" />
          </Field>
        </div>
      </div>
      <button type="submit" className={`${btn.navy} mt-6 w-full sm:w-auto`}><Send className="h-4 w-4" /> Send via WhatsApp</button>
      <p className="mt-3 text-sm text-slate-500">Messages are sent through WhatsApp. This website does not store your details.</p>
    </form>
  );
}

/* ---------- Map (editable in config) ---------- */
export function MapCard() {
  if (!mapLocation) {
    return (
      <div className="grid h-full min-h-[280px] place-items-center rounded-3xl bg-navy-800 p-8 text-center text-white ring-1 ring-navy-100 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.12)_1px,transparent_0)] [background-size:22px_22px]">
        <div>
          <MapPin className="mx-auto h-10 w-10 text-gold-400" />
          <p className="mt-3 font-display text-lg font-semibold">Serving {business.serviceArea}</p>
          <p className="mt-1 text-navy-100">Office: {business.officeCity} · {business.coverage}</p>
          <p className="mt-1 text-navy-100">Door-to-door pickup from your home, hotel, station or airport.</p>
          <p className="mt-4 text-xs text-navy-300">Owner: set <code>mapLocation</code> in src/config/site.js to show a Google Map here.</p>
        </div>
      </div>
    );
  }
  return (
    <iframe title={`${business.name} location on Google Maps`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps?q=${encodeURIComponent(mapLocation)}&output=embed`}
      className="h-full min-h-[320px] w-full rounded-3xl border-0 ring-1 ring-navy-100" />
  );
}
