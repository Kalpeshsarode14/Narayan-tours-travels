import { Check, X } from 'lucide-react';
import { PageHero, Seo, SectionHeading, CTABand } from '../components/UI.jsx';
import { VehicleCard } from '../components/Cards.jsx';
import { vehicles, fareDisclaimer } from '../config/site.js';

export default function Fleet() {
  const rows = [
    ['Starting price', ...vehicles.map((v) => `₹${v.ratePerKm}/km`)],
    ['Passengers', ...vehicles.map((v) => `Up to ${v.seats}`)],
    ['Luggage', ...vehicles.map((v) => v.luggage)],
    ['Body type', ...vehicles.map((v) => v.type)],
    ['Best for', ...vehicles.map((v) => v.idealFor.join(', '))],
  ];
  return (
    <>
      <Seo title="Our Fleet — Dzire & Ertiga Car Rental" path="/fleet"
        description="Rent a Maruti Suzuki Dzire from ₹14/km or an Ertiga from ₹17/km with an experienced driver. Ideal for family trips, airport transfers and outstation travel in Maharashtra." />
      <PageHero title="Our Fleet" text="Comfortable, air-conditioned cars with experienced drivers and simple per-kilometre pricing." />
      <section className="container-x py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
      </section>
      <section className="container-x pb-10">
        <SectionHeading kicker="Compare" title="Dzire or Ertiga?" />
        <div className="overflow-x-auto rounded-3xl bg-white shadow-card ring-1 ring-navy-100">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-navy-900 text-white font-display">
              <tr><th className="px-5 py-4" scope="col"><span className="sr-only">Feature</span></th>{vehicles.map((v) => <th key={v.id} className="px-5 py-4" scope="col">{v.name}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {rows.map(([k, ...vals]) => (
                <tr key={k}><th scope="row" className="px-5 py-4 font-semibold text-navy-900">{k}</th>{vals.map((x, i) => <td key={i} className="px-5 py-4 text-slate-700">{x}</td>)}</tr>
              ))}
              <tr><th scope="row" className="px-5 py-4 font-semibold text-navy-900">Third-row seating</th>
                {vehicles.map((v) => <td key={v.id} className="px-5 py-4">{v.seats > 4 ? <Check className="h-5 w-5 text-emerald-600" aria-label="Yes" /> : <X className="h-5 w-5 text-slate-400" aria-label="No" />}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-500">{fareDisclaimer}</p>
      </section>
      <CTABand />
    </>
  );
}
