import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MapPin, Mail, ArrowUp } from 'lucide-react';
import { LogoMark } from './Art.jsx';
import { btn, WhatsAppIcon, SocialLinks } from './UI.jsx';
import { business, vehicles } from '../config/site.js';
import { services, destinations } from '../data/content.js';
import { whatsappLink, telLink } from '../lib/utils.js';
import VisitorCounter from './VisitorCounter.jsx';

export const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/fleet', label: 'Our Fleet' },
  { to: '/services', label: 'Services' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/packages', label: 'Packages' },
  { to: '/fare-calculator', label: 'Fare Calculator' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

function Brand({ light = true }) {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0" aria-label={`${business.name} home`}>
      <LogoMark className="h-11 w-11 drop-shadow" />
      <span className="leading-tight">
        <span className={`block font-display font-bold text-[16px] whitespace-nowrap ${light ? 'text-white' : 'text-navy-900'}`}>Narayan Tours <span className="text-gold-400">&</span> Travels</span>
        <span className={`block text-[12px] tracking-wide whitespace-nowrap ${light ? 'text-navy-100' : 'text-slate-500'}`}>{business.brand} · {business.tagline}</span>
      </span>
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const link = ({ isActive }) =>
    `relative whitespace-nowrap px-2 py-2 text-[14.5px] font-medium transition ${isActive ? 'text-gold-400' : 'text-white/90 hover:text-white'}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled || open ? 'bg-navy-950/95 backdrop-blur shadow-lg' : 'bg-gradient-to-b from-navy-950/80 to-transparent'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-gold-400 focus:px-3 focus:py-2 focus:text-navy-950">Skip to content</a>
      <div className="container-x flex h-[76px] items-center justify-between gap-4">
        <Brand />
        <nav aria-label="Main" className="hidden xl:flex items-center">
          {navItems.filter((n) => n.to !== '/').map((n) => (
            <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={telLink} className="hidden md:inline-flex xl:hidden 2xl:inline-flex items-center gap-2 whitespace-nowrap px-3 text-white font-semibold">
            <Phone className="h-4 w-4 text-gold-400" /> {business.phoneDisplay}
          </a>
          <Link to="/book" className={`${btn.gold} hidden sm:inline-flex whitespace-nowrap !min-h-[44px] !px-5`}>Book Now</Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}
            className="xl:hidden grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      <div id="mobile-nav" className={`xl:hidden overflow-hidden transition-[max-height] duration-300 ${open ? 'max-h-[85vh] overflow-y-auto' : 'max-h-0'}`}>
        <nav aria-label="Mobile" className="container-x pb-6 grid gap-1">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `rounded-xl px-4 py-3 text-lg ${isActive ? 'bg-white/10 text-gold-400' : 'text-white'}`}>{n.label}</NavLink>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link to="/book" className={btn.gold}>Book Now</Link>
            <a href={telLink} className={btn.ghost}><Phone className="h-4 w-4" /> Call</a>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const col = 'font-display font-semibold text-white mb-4';
  const a = 'text-navy-100 hover:text-gold-300 transition';
  return (
    <footer className="bg-navy-950 text-navy-100">
      <div className="h-1 bg-gradient-to-r from-gold-400 via-saffron-500 to-gold-400" />
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <Brand />
          <p className="mt-4 font-display text-gold-300 text-lg">{business.marketingTagline}</p>
          <p className="mt-1 font-marathi text-navy-100">{business.marathiTagline}</p>
          <p className="mt-3 text-[15px]">Car rental and tours from {business.serviceArea} — {business.coverage}. Sedan ₹{vehicles[0].ratePerKm}/km · Ertiga ₹{vehicles[1].ratePerKm}/km.</p>
          <SocialLinks className="mt-5" />
        </div>
        <div>
          <h2 className={col}>Quick links</h2>
          <ul className="space-y-2">
            {navItems.map((n) => <li key={n.to}><Link className={a} to={n.to}>{n.label}</Link></li>)}
            <li><Link className={a} to="/book">Book Now</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={col}>Travel services</h2>
          <ul className="space-y-2">
            {services.map((s) => <li key={s.id}><Link className={a} to={`/services#${s.id}`}>{s.title}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className={col}>Popular destinations</h2>
          <ul className="space-y-2">
            {destinations.filter((d) => d.km).slice(0, 9).map((d) => (
              <li key={d.id}><Link className={a} to={`/destinations#${d.id}`}>{d.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={col}>Contact</h2>
          <ul className="space-y-3 text-[15px]">
            <li className="text-white font-medium">{business.owner}</li>
            <li><a className={`${a} inline-flex items-center gap-2`} href={telLink}><Phone className="h-4 w-4 text-gold-400" /> {business.phoneDisplay}</a></li>
            <li><a className={`${a} inline-flex items-center gap-2`} href={whatsappLink()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> WhatsApp us</a></li>
            {business.email && <li><a className={`${a} inline-flex items-center gap-2`} href={`mailto:${business.email}`}><Mail className="h-4 w-4 text-gold-400" /> {business.email}</a></li>}
            <li className="inline-flex items-start gap-2"><MapPin className="h-4 w-4 mt-1 text-gold-400 shrink-0" /> Office: {business.officeCity}<br />Serving {business.serviceArea}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p>© {year} {business.name} ({business.brand}). All rights reserved.</p>
          <VisitorCounter />
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{business.tagline}</span>
            <Link to="/photo-credits" className="underline underline-offset-2 opacity-80 hover:opacity-100">Photo credits</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const f = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const fab = 'grid h-14 w-14 place-items-center rounded-full shadow-xl transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400';
  return (
    <div className="ntt-fabs fixed bottom-5 right-4 z-30 flex flex-col items-end gap-3">
      {showTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-navy-900 shadow-lg ring-1 ring-navy-100">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      <a href={telLink} aria-label={`Call ${business.phoneDisplay}`} className={`${fab} bg-saffron-500 text-white`}>
        <Phone className="h-6 w-6" />
      </a>
      <a href={whatsappLink(`Hello ${business.name}, I would like to enquire about a trip.`)} target="_blank" rel="noopener noreferrer"
        aria-label="Chat on WhatsApp" className={`${fab} bg-[#25D366] text-white relative`}>
        <span className="absolute inset-0 rounded-full bg-[#25D366] motion-safe:animate-ping opacity-30" aria-hidden="true" />
        <WhatsAppIcon className="h-7 w-7 relative" />
      </a>
    </div>
  );
}

function Loader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div aria-hidden="true" className={`fixed inset-0 z-[60] grid place-items-center bg-navy-950 transition-opacity duration-500 ${done ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
      <div className="text-center">
        <LogoMark className="mx-auto h-20 w-20 motion-safe:animate-[spin_1.4s_ease-in-out_1]" />
        <p className="mt-4 font-display font-semibold text-white">Narayan Tours & Travels</p>
        <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-gold-400 to-saffron-500 motion-safe:animate-[drive_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  return (
    <>
      <Loader />
      <ScrollManager />
      <Header />
      <main id="main" className="bg-navy-50 min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </>
  );
}
