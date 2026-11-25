import { MapPin, Calculator, CircleCheck, Phone, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHero, Seo } from '../components/UI.jsx';
import { BookingForm } from '../components/Forms.jsx';
import BookingPage from '../booking/BookingPage';
import { business } from '../config/site.js';
import { telLink } from '../lib/utils.js';

const steps = [
  { icon: MapPin, t: 'Pick exact locations', d: 'Search your pickup and drop-off — building, station, airport or village — and pick the exact place.' },
  { icon: Calculator, t: 'See the final fare', d: 'Distance, travel time and a full fare breakdown appear instantly, before you confirm.' },
  { icon: CircleCheck, t: 'Confirm & get a booking ID', d: `Your booking is saved and you can send the details to ${business.owner} on WhatsApp.` },
];

/** Shown only if online booking is not available (e.g. before the booking service is configured). */
function WhatsAppFallback() {
  return (
    <section className="container-x py-16 grid gap-8 lg:grid-cols-[1fr_340px] items-start">
      <BookingForm />
      <aside className="space-y-6 lg:sticky lg:top-24">
        <div className="rounded-3xl bg-navy-900 p-6 text-white">
          <ShieldCheck className="h-8 w-8 text-gold-400" />
          <p className="mt-3 font-display font-semibold">Booking is confirmed only after the owner replies.</p>
          <p className="mt-1 text-sm text-navy-100">Your request is sent on WhatsApp.</p>
          <a href={telLink} className="mt-4 inline-flex items-center gap-2 font-display text-xl font-bold text-gold-300"><Phone className="h-5 w-5" /> {business.phoneDisplay}</a>
        </div>
      </aside>
    </section>
  );
}

export default function Book() {
  const navigate = useNavigate();
  return (
    <>
      <Seo title="Book Now — Exact Locations & Instant Fare" path="/book"
        description="Book a Dzire or Ertiga with Narayan Tours & Travels. Pick exact pickup and drop locations on the map and see your final fare instantly before you confirm." />
      <PageHero title="Book Your Ride" text="Choose exact locations on the map and see your final fare before you confirm." crumb="Book Now" />
      <div className="container-x py-10 sm:py-14">
        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map(({ icon: I, t, d }, i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-100">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-800 text-gold-400"><I className="h-5 w-5" /></span>
              <span><span className="block font-semibold text-navy-900">{i + 1}. {t}</span><span className="text-[14px] text-slate-600">{d}</span></span>
            </li>
          ))}
        </ol>
        <BookingPage
          hideHeader
          fallback={<WhatsAppFallback />}
          onConfirmed={(id, token) => navigate(`/book/confirmation?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`)}
        />
      </div>
    </>
  );
}
