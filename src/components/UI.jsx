import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Route, Plane, Users, Briefcase, Landmark, Mountain, Sparkles, Waves, Building2, CloudRain,
  Armchair, UserCheck, ShieldCheck, Wallet, Headphones, Phone, ArrowRight,
} from 'lucide-react';
import { business, social } from '../config/site.js';
import { whatsappLink, telLink } from '../lib/utils.js';

export const icons = { MapPin, Route, Plane, Users, Briefcase, Landmark, Mountain, Sparkles, Waves, Building2, CloudRain };

/* ---------- Buttons (Tailwind class sets) ---------- */
export const btn = {
  base: 'inline-flex items-center justify-center gap-2 rounded-full px-6 min-h-[48px] font-display font-semibold text-[15px] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:opacity-60',
  get gold() { return `${this.base} bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-[0_8px_24px_-8px_rgba(252,196,25,.7)]`; },
  get orange() { return `${this.base} bg-saffron-500 text-white hover:bg-saffron-600`; },
  get navy() { return `${this.base} bg-navy-800 text-white hover:bg-navy-700`; },
  get ghost() { return `${this.base} border border-white/40 text-white hover:bg-white/10`; },
  get outline() { return `${this.base} border-2 border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-white`; },
  get whatsapp() { return `${this.base} bg-[#25D366] text-[#06101f] hover:bg-[#3ee07a]`; },
};

/* ---------- SEO: per-page title, description, canonical, OG ---------- */
function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const m = selector.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function Seo({ title, description, path = '/' }) {
  useEffect(() => {
    const full = title ? `${title} | ${business.name}` : `${business.name} — Car Rental in Maharashtra`;
    const url = business.siteUrl.replace(/\/$/, '') + path;
    document.title = full;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', full);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('link[rel="canonical"]', 'href', url);
  }, [title, description, path]);
  return null;
}

/* ---------- Headings ---------- */
export function SectionHeading({ kicker, title, text, center = true, light = false }) {
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-2xl mb-10`}>
      {kicker && (
        <p className={`font-display text-sm font-semibold ${light ? 'text-gold-300' : 'text-saffron-500'} mb-2`}>{kicker}</p>
      )}
      <h2 className={`font-display text-3xl sm:text-4xl font-bold leading-tight text-balance ${light ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
      {text && <p className={`mt-4 text-[17px] ${light ? 'text-navy-100' : 'text-slate-600'}`}>{text}</p>}
    </div>
  );
}

export function PageHero({ title, text, crumb }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 pt-32 pb-16 sm:pb-20">
      <div className="absolute inset-0 opacity-30 [background:radial-gradient(60%_80%_at_85%_10%,#f57c00_0%,transparent_60%),radial-gradient(40%_60%_at_0%_100%,#fcc419_0%,transparent_60%)]" />
      <svg className="absolute bottom-0 left-0 w-full h-16 text-navy-50" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 60 L0 30 Q300 0 600 30 T1200 25 L1200 60Z" fill="currentColor" />
      </svg>
      <div className="relative container-x">
        <nav aria-label="Breadcrumb" className="text-sm text-navy-100 mb-3">
          <Link to="/" className="hover:text-gold-300">Home</Link> <span aria-hidden="true">/</span> <span className="text-gold-300">{crumb || title}</span>
        </nav>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.08] max-w-3xl text-balance motion-safe:animate-rise">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-lg text-navy-100">{text}</p>}
      </div>
    </section>
  );
}

/* ---------- WhatsApp + social glyphs ---------- */
export function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.03c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.93-4.66-4.11-.13-.18-1.11-1.48-1.11-2.83 0-1.34.7-2 .95-2.28.25-.27.54-.34.72-.34l.52.01c.17.01.39-.06.61.47.24.55.79 1.9.86 2.04.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.28-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
    </svg>
  );
}

const socialGlyphs = {
  facebook: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9H17l.5-4h-4V8.9c0-.6.3-.9 1-.9Z',
  instagram: 'M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM16.5 2h-9A5.5 5.5 0 0 0 2 7.5v9A5.5 5.5 0 0 0 7.5 22h9a5.5 5.5 0 0 0 5.5-5.5v-9A5.5 5.5 0 0 0 16.5 2Zm3.7 14.5a3.7 3.7 0 0 1-3.7 3.7h-9a3.7 3.7 0 0 1-3.7-3.7v-9a3.7 3.7 0 0 1 3.7-3.7h9a3.7 3.7 0 0 1 3.7 3.7v9Z',
  youtube: 'M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z',
};

export function SocialLinks({ className = '' }) {
  const items = Object.entries(social).filter(([, url]) => url);
  if (!items.length) return null;
  return (
    <div className={`flex gap-3 ${className}`}>
      {items.map(([key, url]) => (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${business.name} on ${key}`}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-gold-400 hover:text-navy-950 transition">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d={socialGlyphs[key]} /></svg>
        </a>
      ))}
    </div>
  );
}

/* ---------- Trust strip ---------- */
const trust = [
  { icon: Armchair, title: 'Comfortable Vehicles', text: 'Clean, well-maintained AC Dzire and Ertiga cars.' },
  { icon: UserCheck, title: 'Experienced Drivers', text: 'Professional drivers who know local routes, highways and ghats.' },
  { icon: ShieldCheck, title: 'Safe Journeys', text: 'Careful driving, on-time pickups and door-to-door service.' },
  { icon: Wallet, title: 'Affordable Pricing', text: 'Transparent per-km rates from ₹14/km — no hidden charges.' },
  { icon: Headphones, title: 'Reliable Service', text: '24/7 booking support on call and WhatsApp. Advance booking available.' },
];

export function TrustStrip() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {trust.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-100 transition hover:-translate-y-1">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-saffron-500 text-navy-950">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display font-semibold text-navy-900">{title}</h3>
          <p className="mt-1 text-[15px] text-slate-600">{text}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Call-to-action band ---------- */
export function CTABand({ title = 'Planning a trip? Let’s get you moving.', text = 'Send your trip details on WhatsApp or call the owner directly for a quick quote.' }) {
  return (
    <section className="container-x my-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 px-6 py-12 sm:px-12 text-center sm:text-left">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-saffron-500/30 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-balance">{title}</h2>
            <p className="mt-2 text-navy-100">{text}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/book" className={btn.gold}>Book Your Ride <ArrowRight className="h-4 w-4" /></Link>
            <a href={whatsappLink(`Hello ${business.name}, I would like a quote for a trip.`)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}>
              <WhatsAppIcon /> WhatsApp
            </a>
            <a href={telLink} className={btn.ghost}><Phone className="h-4 w-4" /> {business.phoneDisplay}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
