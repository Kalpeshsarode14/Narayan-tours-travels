import { Phone, ShieldCheck, MessageCircle, CircleCheck } from 'lucide-react';
import { PageHero, Seo } from '../components/UI.jsx';
import { BookingForm } from '../components/Forms.jsx';
import { business } from '../config/site.js';
import { telLink } from '../lib/utils.js';

const steps = [
  { icon: MessageCircle, t: 'Send your request', d: 'Fill in the form — WhatsApp opens with your trip details ready to send.' },
  { icon: Phone, t: 'Owner confirms', d: `${business.owner} checks availability and shares the final fare.` },
  { icon: CircleCheck, t: 'Travel happy', d: 'Your car and driver arrive at the pickup point on time.' },
];

export default function Book() {
  return (
    <>
      <Seo title="Book Now — Request a Car" path="/book" description="Book a Dzire or Ertiga with Narayan Tours & Travels. Send your trip details on WhatsApp and the owner will confirm availability and fare." />
      <PageHero title="Book Your Ride" text="Share your trip details below. Your request goes straight to the owner on WhatsApp." crumb="Book Now" />
      <section className="container-x py-16 grid gap-8 lg:grid-cols-[1fr_340px] items-start">
        <BookingForm />
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy-100">
            <h2 className="font-display text-lg font-bold text-navy-900">How booking works</h2>
            <ol className="mt-4 space-y-5">
              {steps.map(({ icon: I, t, d }, i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-800 text-gold-400"><I className="h-5 w-5" /></span>
                  <span><span className="block font-semibold text-navy-900">{i + 1}. {t}</span><span className="text-[15px] text-slate-600">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl bg-navy-900 p-6 text-white">
            <ShieldCheck className="h-8 w-8 text-gold-400" />
            <p className="mt-3 font-display font-semibold">Booking is confirmed only after the owner replies.</p>
            <p className="mt-1 text-sm text-navy-100">This website does not store your details or take payments.</p>
            <a href={telLink} className="mt-4 inline-flex items-center gap-2 font-display text-xl font-bold text-gold-300"><Phone className="h-5 w-5" /> {business.phoneDisplay}</a>
          </div>
        </aside>
      </section>
    </>
  );
}
