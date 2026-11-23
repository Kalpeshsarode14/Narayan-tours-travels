import { Link } from 'react-router-dom';
import { PageHero, Seo, CTABand, icons } from '../components/UI.jsx';
import { ServiceCard } from '../components/Cards.jsx';
import { services } from '../data/content.js';

export default function Services() {
  return (
    <>
      <Seo title="Travel Services — Outstation, Airport, Pilgrimage & Tours" path="/services"
        description="Local city travel, outstation car rental, airport pickup and drop, family tours, corporate travel, Maharashtra pilgrimage tours, weekend getaways and custom packages." />
      <PageHero title="Our Travel Services" text="From a quick airport drop to a week-long family tour — one dependable car service for every kind of trip." crumb="Services" />
      <nav aria-label="Service sections" className="sticky top-[76px] z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="container-x flex gap-2 overflow-x-auto py-3">
          {services.map((s) => {
            const I = icons[s.icon];
            return (
              <Link key={s.id} to={`/services#${s.id}`} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full bg-navy-50 px-4 text-sm font-semibold text-navy-800 hover:bg-gold-100">
                <I className="h-4 w-4" /> {s.title}
              </Link>
            );
          })}
        </div>
      </nav>
      <section className="container-x py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => <ServiceCard key={s.id} s={s} detailed />)}
        </div>
      </section>
      <CTABand title="Need something not listed here?" text="Tell us your plan — we will suggest a route, the right car and an estimate." />
    </>
  );
}
