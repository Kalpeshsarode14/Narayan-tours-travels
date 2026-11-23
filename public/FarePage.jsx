import { PageHero, Seo, CTABand } from '../components/UI.jsx';
import { FareCalculator } from '../components/Forms.jsx';
import { vehicles } from '../config/site.js';

export default function FarePage() {
  return (
    <>
      <Seo title="Fare Calculator — Estimate Your Cab Fare" path="/fare-calculator"
        description={`Estimate your outstation cab fare instantly. ${vehicles.map((v) => `${v.name.replace('Maruti Suzuki ', '')} ₹${v.ratePerKm}/km`).join(', ')}. One way or round trip.`} />
      <PageHero title="Fare Calculator" text="Pick a car, enter the distance and choose one way or round trip. Estimated fare = total km × vehicle rate." />
      <section className="container-x py-16">
        <FareCalculator />
      </section>
      <CTABand title="Happy with the estimate?" text="Send your trip details and the owner will confirm the final fare." />
    </>
  );
}
