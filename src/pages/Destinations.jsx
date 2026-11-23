import { Link } from 'react-router-dom';
import { PageHero, Seo, SectionHeading, CTABand, icons } from '../components/UI.jsx';
import { DestinationCard } from '../components/Cards.jsx';
import { destinations, destinationGroups } from '../data/content.js';

const intro = {
  religious: 'Darshan trips planned around temple timings, with comfortable cars for elders and families — Maharashtra pilgrimage tours made easy.',
  konkan: 'Beaches, sea forts, temples and seafood along the Konkan coast. Ask about multi-day Konkan tour packages.',
  city: 'Full-day sightseeing in Mumbai and Pune, plus the popular Mumbai to Pune cab route.',
  weekend: 'Hill stations, ghats and waterfalls a few hours away — perfect for a quick break.',
};

export default function Destinations() {
  return (
    <>
      <Seo title="Popular Destinations — Shirdi, Konkan, Lonavala & More" path="/destinations"
        description="Mumbai to Shirdi taxi, Pandharpur, Tuljapur and Akkalkot pilgrimage tours, Konkan tour packages to Malvan, Dapoli, Ratnagiri and Ganpatipule, and weekend trips to Lonavala and Matheran." />
      <PageHero title="Popular Travel Destinations" text="Pilgrimages, Konkan beaches, city tours and weekend getaways across Maharashtra." crumb="Destinations" />
      <nav aria-label="Destination categories" className="sticky top-[76px] z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="container-x flex gap-2 overflow-x-auto py-3">
          {destinationGroups.map((g) => {
            const I = icons[g.icon];
            return (
              <Link key={g.id} to={`/destinations#${g.id}`} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full bg-navy-50 px-4 text-sm font-semibold text-navy-800 hover:bg-gold-100">
                <I className="h-4 w-4" /> {g.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {destinationGroups.map((g, i) => (
        <section key={g.id} id={g.id} className={`scroll-mt-32 py-16 ${i % 2 ? 'bg-white' : ''}`}>
          <div className="container-x">
            <SectionHeading center={false} title={g.label} text={intro[g.id]} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.filter((d) => d.group === g.id).map((d) => <DestinationCard key={d.id} d={d} />)}
            </div>
          </div>
        </section>
      ))}
      <p className="container-x text-sm text-slate-500">Distances shown are approximate road distances from Mumbai, for estimates only.</p>
      <CTABand title="Have a destination in mind?" text="Send us your route and travel dates for a quick estimate." />
    </>
  );
}
