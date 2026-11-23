import { PageHero, Seo, SectionHeading, CTABand } from '../components/UI.jsx';
import { PackageCard, SpecialCard, PopularRoutes } from '../components/Extras.jsx';
import { packages, specials } from '../config/site.js';

export default function Packages() {
  return (
    <>
      <Seo title="Tour Packages — Shirdi, Nashik, Konkan & Monsoon Trips" path="/packages"
        description="Shirdi – Shani Shingnapur – Nashik – Saptashrungi 2 Day / 1 Night package from Mumbai: Sedan ₹17,999, SUV ₹23,999. Monsoon specials, Konkan festival trips and one-way sharing." />
      <PageHero title="Tour Packages & Specials" text="Ready-made Dev Darshan tours, monsoon outings, Konkan festival trips and one-way sharing — or ask us for a custom plan." crumb="Packages" />
      <section className="container-x py-16 space-y-10">
        {packages.map((p) => <PackageCard key={p.id} p={p} full />)}
      </section>
      <section className="bg-white py-16">
        <div className="container-x">
          <SectionHeading kicker="Seasonal specials" title="Monsoon outings, Konkan trips and sharing rides" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {specials.map((s) => <SpecialCard key={s.id} s={s} />)}
          </div>
        </div>
      </section>
      <section className="container-x py-16">
        <SectionHeading kicker="Popular routes" title="Routes our customers book most" />
        <PopularRoutes />
      </section>
      <CTABand title="Want a custom package?" text="Tell us the places, dates and number of travellers — we will plan the route and share the best price." />
    </>
  );
}
