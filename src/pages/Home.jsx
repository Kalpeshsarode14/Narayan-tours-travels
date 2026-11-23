import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, ShieldCheck, Heart, Sparkles, BadgeCheck } from 'lucide-react';
import { HeroScene } from '../components/Art.jsx';
import { btn, Seo, SectionHeading, TrustStrip, CTABand, WhatsAppIcon, icons } from '../components/UI.jsx';
import { VehicleCard, ServiceCard, DestinationCard, Testimonials, FAQ } from '../components/Cards.jsx';
import { FareCalculator } from '../components/Forms.jsx';
import { PopularRoutes, PackageCard } from '../components/Extras.jsx';
import { business, vehicles, packages, img } from '../config/site.js';
import { services, destinations, destinationGroups, faqs } from '../data/content.js';
import { whatsappLink, telLink } from '../lib/utils.js';

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <HeroScene className="absolute inset-0 -z-10 h-full w-full opacity-70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/95 via-navy-950/70 to-navy-950/30" />
      <div className="container-x grid items-center gap-10 pt-28 pb-28 lg:grid-cols-[1.05fr_1fr] lg:pt-36 lg:pb-36">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-gold-300 ring-1 ring-white/20 backdrop-blur motion-safe:animate-rise">
            <Sparkles className="h-4 w-4" /> {business.marketingTagline}
          </p>
          <h1 className="mt-5 font-display text-[40px] sm:text-6xl font-extrabold leading-[1.05] text-white text-balance motion-safe:animate-rise [animation-delay:.1s]">
            Your Journey, <span className="bg-gradient-to-r from-gold-300 to-saffron-400 bg-clip-text text-transparent">Our Responsibility.</span>
          </h1>
          <p className="mt-3 font-marathi text-xl text-gold-300 motion-safe:animate-rise [animation-delay:.15s]">{business.marathiTagline}</p>
          <p className="mt-4 max-w-xl text-lg sm:text-xl text-navy-100 motion-safe:animate-rise [animation-delay:.2s]">
            Explore Maharashtra and beyond with comfortable, safe and reliable travel services from {business.name}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 motion-safe:animate-rise [animation-delay:.3s]">
            <Link to="/book" className={btn.gold}>Book Your Ride <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/services" className={btn.ghost}>Explore Our Services</Link>
            <a href={whatsappLink(`Hello ${business.name}, I would like to book a ride.`)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}>
              <WhatsAppIcon /> Book on WhatsApp
            </a>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-white motion-safe:animate-rise [animation-delay:.4s]">
            {vehicles.map((v) => (
              <div key={v.id}>
                <dt className="text-sm text-navy-100">{v.short}</dt>
                <dd className="font-display text-2xl font-bold">₹{v.ratePerKm}<span className="text-base font-medium text-navy-100">/km</span></dd>
              </div>
            ))}
            <div>
              <dt className="text-sm text-navy-100">Call {business.owner.split(' ')[0]}</dt>
              <dd><a href={telLink} className="font-display text-2xl font-bold hover:text-gold-300">{business.phoneDisplay}</a></dd>
            </div>
          </dl>
        </div>
        <figure className="relative motion-safe:animate-rise [animation-delay:.25s]">
          <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-gold-400 via-saffron-500 to-transparent opacity-60 blur-xl" aria-hidden="true" />
          <img src={img(business.heroPhoto)} alt="Narayan Tours & Travels Maruti Suzuki Dzire and Ertiga on a scenic Maharashtra road with fort, beach and temple"
            className="relative aspect-[16/9] w-full rounded-[2rem] object-cover shadow-2xl ring-4 ring-white/10" width="1300" height="571" fetchpriority="high" />
          <figcaption className="absolute -bottom-6 left-4 right-4 flex flex-wrap justify-center gap-2 sm:left-auto sm:right-6 sm:justify-end">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-lg">One Sedan + One Ertiga available</span>
            <span className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 shadow-lg">Advance booking open</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function DestinationsPreview() {
  const [group, setGroup] = useState('religious');
  const list = destinations.filter((d) => d.group === group);
  return (
    <section className="container-x py-20">
      <SectionHeading kicker="Popular destinations" title="Pilgrimages, Konkan beaches and Sahyadri getaways"
        text="Some of the trips our customers book most often. Every route can be planned one way or as a round trip." />
      <div role="tablist" aria-label="Destination categories" className="mb-8 flex flex-wrap justify-center gap-2">
        {destinationGroups.map((g) => {
          const Icon = icons[g.icon];
          const active = g.id === group;
          return (
            <button key={g.id} role="tab" type="button" aria-selected={active} onClick={() => setGroup(g.id)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 font-display text-[15px] font-semibold transition ${active ? 'bg-navy-800 text-white shadow' : 'bg-white text-navy-800 ring-1 ring-navy-100 hover:ring-navy-300'}`}>
              <Icon className="h-4 w-4" /> {g.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, 6).map((d) => <DestinationCard key={d.id} d={d} />)}
      </div>
      <div className="mt-10 text-center"><Link to="/destinations" className={btn.outline}>View all destinations <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  );
}

function AboutTeaser() {
  const values = [
    { icon: Heart, t: 'Comfort' }, { icon: ShieldCheck, t: 'Safety' }, { icon: BadgeCheck, t: 'Reliability' }, { icon: Sparkles, t: 'Customer Satisfaction' },
  ];
  return (
    <section className="bg-white py-20">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div className="relative rounded-[2rem] bg-gradient-to-br from-navy-900 to-navy-700 p-8 pt-14 shadow-card">
          <img src={img(business.logo)} alt="NTT Travel — Narayan Tours & Travels logo" loading="lazy" className="mx-auto w-2/3 max-w-[300px] rounded-full ring-4 ring-gold-400/70" />
          <img src={img('fleet/dzire-ertiga.webp')} alt="Our Dzire sedan and Ertiga" loading="lazy" className="relative mt-6 w-full rounded-2xl object-cover" />
          <p className="relative mt-4 text-center font-display text-lg font-semibold text-gold-300">{business.tagline}</p>
        </div>
        <div>
          <SectionHeading center={false} kicker="About Narayan Tours & Travels" title="Every journey should be comfortable, safe and memorable" />
          <p className="-mt-4 text-[17px] text-slate-600">
            We provide reliable car rental and travel services for family trips, religious journeys, outstation travel and customized tours —
            run personally by {business.owner}, so you always speak to the person responsible for your trip.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {values.map(({ icon: I, t }) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-navy-50 p-4 font-display font-semibold text-navy-900">
                <I className="h-5 w-5 text-saffron-500" /> {t}
              </li>
            ))}
          </ul>
          <Link to="/about" className={`${btn.navy} mt-8`}>More about us <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Seo path="/" description="Narayan Tours & Travels (NTT Travel) — car rental in Maharashtra. Dzire from ₹14/km, Ertiga from ₹17/km. Outstation cabs, Mumbai to Pune & Shirdi taxi, Konkan tour packages and pilgrimage tours. Call 9967 456 323." />
      <Hero />

      <section className="container-x relative z-10 -mt-16">
        <TrustStrip />
      </section>

      <section className="container-x py-20">
        <SectionHeading kicker="Our fleet" title="Well-kept cars with clear per-km pricing" text="Choose the car that fits your group. Every trip comes with an experienced driver." />
        <div className="grid gap-8 lg:grid-cols-2">
          {vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
      </section>

      <section className="container-x pb-20">
        <SectionHeading kicker="Our popular routes" title="Mumbai, Pune, Shirdi, Konkan and back" text="One-way, round trip and one-way sharing on the routes our customers book most." />
        <PopularRoutes />
      </section>

      <section className="bg-navy-900 py-20">
        <div className="container-x">
          <SectionHeading light kicker="Our travel services" title="One trusted car service for every kind of trip" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {services.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        </div>
      </section>

      <section className="container-x pt-20">
        <SectionHeading kicker="Featured package" title="2 Day / 1 Night Dev Darshan from Mumbai" />
        {packages.slice(0, 1).map((p) => <PackageCard key={p.id} p={p} />)}
        <p className="mt-6 text-center"><Link to="/packages" className="font-semibold text-saffron-600 underline underline-offset-4">See monsoon, Konkan and sharing specials</Link></p>
      </section>

      <DestinationsPreview />

      <section className="bg-gradient-to-b from-white to-navy-50 py-20">
        <div className="container-x">
          <SectionHeading kicker="Fare calculator" title="Know your estimated fare in seconds" text="Estimated fare = total kilometres × vehicle rate. Final fare is confirmed by the owner." />
          <FareCalculator />
        </div>
      </section>

      <AboutTeaser />

      <section className="container-x py-20">
        <SectionHeading kicker="Customer stories" title="What our travellers say" />
        <Testimonials />
      </section>

      <section className="container-x pb-6">
        <SectionHeading kicker="FAQ" title="Questions before you book" />
        <FAQ items={faqs.slice(0, 5)} />
        <p className="mt-6 text-center"><Link to="/contact#faq" className="font-semibold text-saffron-600 underline underline-offset-4">See all questions</Link></p>
      </section>

      <CTABand />
    </>
  );
}
