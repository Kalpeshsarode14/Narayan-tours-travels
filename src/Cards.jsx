import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Luggage, Check, ArrowRight, Compass, ChevronDown, Quote, Info, Calculator } from 'lucide-react';
import { CarArt, Visual } from './Art.jsx';
import { btn, icons } from './UI.jsx';
import { testimonials, showTestimonials, img } from '../config/site.js';

/* ---------- Vehicle ---------- */
export function VehicleCard({ v }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100 flex flex-col">
      <div className={`relative overflow-hidden ${v.photo ? 'aspect-[16/9] bg-navy-50' : 'bg-gradient-to-br from-navy-900 via-navy-800 to-navy-600 px-6 pt-10 pb-4'}`}>
        {v.photo ? (
          <img src={img(v.photo)} alt={`${v.name} — ${v.type} car rental in Maharashtra`} loading="lazy" decoding="async"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <CarArt kind={v.art} color={v.color} className="relative mx-auto w-full max-w-[400px] transition duration-500 group-hover:translate-x-2" />
        )}
        <span className="absolute left-5 top-5 rounded-full bg-navy-900/85 px-3 py-1 text-xs font-semibold text-gold-300 ring-1 ring-white/20 backdrop-blur">{v.type}</span>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-2xl font-bold text-navy-900">{v.name}</h3>
          <p className="whitespace-nowrap font-display">
            <span className="text-sm text-slate-500">from </span>
            <span className="text-3xl font-bold text-saffron-500">₹{v.ratePerKm}</span>
            <span className="text-slate-600">/km</span>
          </p>
        </div>
        <p className="mt-2 text-slate-600">{v.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-navy-800"><Users className="h-4 w-4" /> Up to {v.seats} passengers</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-navy-800"><Luggage className="h-4 w-4" /> {v.luggage}</span>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {v.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[15px] text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" /> {f}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-500"><span className="font-semibold text-navy-800">Ideal for:</span> {v.idealFor.join(', ')}</p>
        <div className="mt-auto pt-6 flex flex-wrap gap-3">
          <Link to={`/book?vehicle=${v.id}`} className={btn.gold}>Book Now <ArrowRight className="h-4 w-4" /></Link>
          <Link to={`/fare-calculator?vehicle=${v.id}`} className={btn.outline}><Calculator className="h-4 w-4" /> Estimate fare</Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- Service ---------- */
export function ServiceCard({ s, detailed = false }) {
  const Icon = icons[s.icon];
  return (
    <article id={detailed ? s.id : undefined} className="scroll-mt-24 group overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Visual photo={s.photo} scene={s.scene} alt={`${s.title} by Narayan Tours & Travels`} className="h-full w-full transition duration-700 group-hover:scale-105" />
        <span className="absolute left-4 bottom-4 grid h-12 w-12 place-items-center rounded-xl bg-navy-900/90 text-gold-400 backdrop-blur">
          {Icon && <Icon className="h-6 w-6" aria-hidden="true" />}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold text-navy-900">{s.title}</h3>
        <p className="mt-2 text-[15px] text-slate-600">{s.text}</p>
        {detailed && (
          <ul className="mt-4 space-y-1.5">
            {s.points.map((p) => <li key={p} className="flex items-center gap-2 text-[15px] text-slate-700"><Check className="h-4 w-4 text-saffron-500" /> {p}</li>)}
          </ul>
        )}
        <div className="mt-auto pt-5">
          <Link to={`/book?service=${encodeURIComponent(s.title)}`} className="inline-flex min-h-[44px] items-center gap-2 font-display font-semibold text-saffron-600 hover:text-saffron-500">
            Book this service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- Destination ---------- */
export function DestinationCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <article id={d.id} className="scroll-mt-24 group overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Visual photo={d.photo} scene={d.scene} seed={[...d.id].reduce((a, c) => a + c.charCodeAt(0), 0)} alt={`${d.name}, Maharashtra — travel by car with Narayan Tours & Travels`} className="h-full w-full transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
        <h3 className="absolute bottom-4 left-5 right-5 font-display text-2xl font-bold text-white">{d.name}</h3>
        {d.km > 0 && <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy-900">~{d.km} km from Mumbai</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[15px] text-slate-600">{d.text}</p>
        <div id={`${d.id}-more`} hidden={!open} className="mt-4 rounded-2xl bg-navy-50 p-4">
          <p className="font-display text-sm font-semibold text-navy-900 mb-2">Highlights</p>
          <ul className="space-y-1">
            {d.highlights.map((h) => <li key={h} className="flex gap-2 text-[15px] text-slate-700"><Check className="mt-0.5 h-4 w-4 text-saffron-500" /> {h}</li>)}
          </ul>
          {d.km > 0 && (
            <Link to={`/fare-calculator?km=${d.km}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-navy-700 underline underline-offset-4">Estimate fare for ~{d.km} km</Link>
          )}
        </div>
        <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${d.id}-more`}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border-2 border-navy-800 px-3 text-sm font-display font-semibold text-navy-800 hover:bg-navy-800 hover:text-white transition">
            <Compass className="h-4 w-4" /> {open ? 'Show less' : 'Explore'}
          </button>
          <Link to={`/book?destination=${encodeURIComponent(d.name)}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-gold-400 px-3 text-sm font-display font-semibold text-navy-950 hover:bg-gold-300 transition">
            Book Trip
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- Testimonials (placeholders clearly labelled) ---------- */
export function Testimonials() {
  if (!showTestimonials || !testimonials.length) return null;
  const anySample = testimonials.some((t) => t.isSample);
  return (
    <div>
      {anySample && (
        <p className="mx-auto mb-6 flex max-w-2xl items-start gap-2 rounded-xl bg-gold-100 px-4 py-3 text-sm text-navy-900 ring-1 ring-gold-300">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          These are sample placeholders, not real reviews. Replace them with genuine customer feedback in <code className="font-mono">src/config/site.js</code>.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <figure key={i} className="relative rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy-100">
            {t.isSample && <span className="absolute right-4 top-4 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-slate-500">Sample</span>}
            <Quote className="h-8 w-8 text-gold-400" aria-hidden="true" />
            <blockquote className="mt-3 text-slate-700">{t.text}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-800 font-display font-bold text-gold-300">{t.name.charAt(0)}</span>
              <span>
                <span className="block font-semibold text-navy-900">{t.name}</span>
                <span className="block text-sm text-slate-500">{t.trip}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- FAQ ---------- */
export function FAQ({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-navy-100 rounded-3xl bg-white shadow-card ring-1 ring-navy-100">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3>
              <button type="button" id={`faq-b-${i}`} aria-expanded={isOpen} aria-controls={`faq-p-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-display font-semibold text-navy-900 hover:text-saffron-600">
                {f.q}
                <ChevronDown className={`h-5 w-5 shrink-0 transition ${isOpen ? 'rotate-180 text-saffron-500' : ''}`} />
              </button>
            </h3>
            <div id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`} hidden={!isOpen} className="px-6 pb-5 text-slate-600">{f.a}</div>
          </div>
        );
      })}
    </div>
  );
}
