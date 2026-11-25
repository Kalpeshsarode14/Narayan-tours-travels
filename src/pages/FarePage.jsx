import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { PageHero, Seo, CTABand, btn } from '../components/UI.jsx';
import { FareCalculator } from '../components/Forms.jsx';
import { vehicles } from '../config/site.js';

export default function FarePage() {
  return (
    <>
      <Seo title="Fare Calculator — Estimate Your Cab Fare" path="/fare-calculator"
        description={`Estimate your outstation cab fare instantly. ${vehicles.map((v) => `${v.name.replace('Maruti Suzuki ', '')} ₹${v.ratePerKm}/km`).join(', ')}. One way or round trip.`} />
      <PageHero title="Fare Calculator" text="Pick a car, enter the distance and choose one way or round trip. Estimated fare = total km × vehicle rate." />
      <section className="container-x py-16">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-5 sm:p-6 shadow-card ring-1 ring-navy-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-navy-900">
            <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-saffron-500" />
            <span><strong className="font-display">Want the exact fare?</strong> Pick your pickup and drop-off on Google Maps — we calculate the real road distance, tolls and the final fare instantly.</span>
          </p>
          <Link to="/book" className={`${btn.gold} shrink-0`}>Get exact fare <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <FareCalculator />
      </section>
      <CTABand title="Happy with the estimate?" text="Send your trip details and the owner will confirm the final fare." />
    </>
  );
}
