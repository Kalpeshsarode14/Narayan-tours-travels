import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Check, Clock, MapPin, Route, Sparkles, CalendarCheck } from 'lucide-react';
import { btn, WhatsAppIcon } from './UI.jsx';
import { business, popularRoutes, img } from '../config/site.js';
import { inr, whatsappLink } from '../lib/utils.js';

/* ---------- Popular routes (from posters) ---------- */
export function PopularRoutes() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {popularRoutes.map((r) => (
        <div key={r.from + r.to} className="flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-100">
          <p className="flex items-center gap-2 text-sm text-slate-500"><Route className="h-4 w-4 text-saffron-500" /> {r.from}</p>
          <p className="mt-1 font-display text-lg font-bold leading-snug text-navy-900">→ {r.to}</p>
          {r.note && <p className="mt-1 text-sm text-saffron-600 font-semibold">{r.note}</p>}
          {r.km > 0 && <p className="mt-1 text-sm text-slate-500">approx. {r.km} km one way</p>}
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm font-semibold">
            <Link to={`/book?destination=${encodeURIComponent(r.to)}`} className="inline-flex min-h-[36px] items-center gap-1 text-navy-800 hover:text-saffron-600">Book <ArrowRight className="h-4 w-4" /></Link>
            {r.km > 0 && <Link to={`/fare-calculator?km=${r.km}`} className="inline-flex min-h-[36px] items-center gap-1 text-slate-500 hover:text-navy-800"><Calculator className="h-4 w-4" /> Estimate</Link>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Tour package ---------- */
export function PackageCard({ p, full = false }) {
  return (
    <article id={p.id} className="scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100">
      <div className="grid grid-cols-5 gap-1 bg-navy-900 p-1">
        {p.photos.map((ph, i) => (
          <img key={ph} src={img(ph)} alt={p.places[i] || p.title} loading="lazy" decoding="async"
            className={`aspect-[3/4] w-full object-cover ${i === 0 ? 'rounded-tl-[1.3rem]' : ''} ${i === p.photos.length - 1 ? 'rounded-tr-[1.3rem]' : ''}`} />
        ))}
      </div>
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1 text-sm font-semibold text-navy-900"><Clock className="h-4 w-4" /> {p.duration} · from {p.from}</p>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-tight text-navy-900 text-balance">{p.title}</h3>
          {p.marathi && <p className="mt-1 font-marathi text-lg text-saffron-600">{p.marathi}</p>}
          <h4 className="mt-6 font-display font-semibold text-navy-900">Places covered</h4>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {p.places.map((pl) => <li key={pl} className="flex gap-2 text-[15px] text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" /> {pl}</li>)}
          </ul>
          {full && (
            <>
              <h4 className="mt-6 font-display font-semibold text-navy-900">Itinerary</h4>
              <ol className="mt-3 space-y-4">
                {p.itinerary.map((d) => (
                  <li key={d.day} className="rounded-2xl bg-navy-50 p-4 ring-1 ring-navy-100">
                    <p className="font-display font-semibold text-navy-900"><span className="mr-2 rounded-md bg-navy-800 px-2 py-0.5 text-sm text-gold-300">{d.day}</span>{d.title}</p>
                    <ul className="mt-2 space-y-1">{d.items.map((it) => <li key={it} className="flex gap-2 text-[15px] text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" /> {it}</li>)}</ul>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-navy-900 p-6 text-white">
            <p className="font-display text-sm font-semibold text-gold-300">Package rates</p>
            {p.prices.map((pr) => (
              <div key={pr.label} className="mt-3 flex items-end justify-between gap-3 border-b border-white/10 pb-3 last:border-0">
                <span className="text-navy-100">{pr.label}</span>
                <span className="whitespace-nowrap font-display text-3xl font-bold text-gold-400">{inr(pr.price)}</span>
              </div>
            ))}
            <p className="mt-3 text-xs text-navy-100">Per vehicle, as on our current poster. Confirm availability and final price when booking.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-navy-900">Package includes</h4>
            <ul className="mt-2 space-y-1.5">{p.includes.map((x) => <li key={x} className="flex gap-2 text-[15px] text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {x}</li>)}</ul>
            {p.note && <p className="mt-3 text-sm text-slate-500">{p.note}</p>}
          </div>
          <div className="mt-auto flex flex-wrap gap-3">
            <Link to={`/book?destination=${encodeURIComponent(`${p.title} (${p.duration} package)`)}&tripType=round`} className={btn.gold}>Book this package <ArrowRight className="h-4 w-4" /></Link>
            {!full && <Link to={`/packages#${p.id}`} className={btn.outline}>View itinerary</Link>}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- Seasonal specials ---------- */
export function SpecialCard({ s }) {
  return (
    <article id={s.id} className="scroll-mt-24 flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img src={img(s.photo)} alt={s.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
        {s.marathi && <p className="absolute bottom-3 left-5 right-5 font-marathi text-lg font-semibold text-gold-300">{s.marathi}</p>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold text-navy-900">{s.title}</h3>
        <p className="mt-2 text-[15px] text-slate-600">{s.text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {s.includes.map((x) => <span key={x} className="rounded-full bg-navy-50 px-3 py-1 text-sm text-navy-800 ring-1 ring-navy-100">{x}</span>)}
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-saffron-600"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" /> {s.badge}</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          <a href={whatsappLink(`Hello ${business.name}, I am interested in: ${s.title}. Please share details and price.`)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}>
            <WhatsAppIcon /> Ask on WhatsApp
          </a>
          <Link to={`/book?service=${encodeURIComponent(s.title)}`} className={btn.outline}><CalendarCheck className="h-4 w-4" /> Book</Link>
        </div>
      </div>
    </article>
  );
}
