import { Heart, ShieldCheck, BadgeCheck, Smile, Phone } from 'lucide-react';
import { PageHero, Seo, SectionHeading, TrustStrip, CTABand, btn } from '../components/UI.jsx';
import { LogoMark } from '../components/Art.jsx';
import { business, img } from '../config/site.js';
import { telLink } from '../lib/utils.js';

const values = [
  { icon: Heart, title: 'Comfort', text: 'Clean, air-conditioned cars and a relaxed pace, so you arrive fresh — whether it is a two-hour drop or a five-day tour.' },
  { icon: ShieldCheck, title: 'Safety', text: 'Experienced drivers, careful driving on highways and ghats, and vehicles kept in good condition.' },
  { icon: BadgeCheck, title: 'Reliability', text: 'On-time pickups and honest communication about the route, timing and charges before you travel.' },
  { icon: Smile, title: 'Customer Satisfaction', text: 'We listen to what you need — stops, elders, children, luggage — and plan the trip around it.' },
];

export default function About() {
  return (
    <>
      <Seo title="About Us" path="/about" description="About Narayan Tours & Travels — a Maharashtra car rental and tour service run by Shrikant Mahindrakar, built on comfort, safety and reliability." />
      <PageHero title="About Narayan Tours & Travels" text={`${business.tagline} — the values behind every trip we drive.`} crumb="About Us" />

      <section className="container-x py-20 grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <SectionHeading center={false} kicker="Who we are" title="Every journey should be comfortable, safe and memorable" />
          <div className="-mt-4 space-y-4 text-[17px] text-slate-600">
            <p>At {business.name}, we believe every journey should be comfortable, safe and memorable. We provide reliable car rental and travel services for family trips, religious journeys, outstation travel and customized tours.</p>
            <p>Our commitment is to provide comfortable vehicles, dependable service and a pleasant travel experience for every customer.</p>
            <p>Based in {business.officeCity}, we serve {business.serviceArea} with door-to-door pickup, and plan {business.coverage.toLowerCase()} on request — from Dev Darshan packages and Konkan festival trips to monsoon outings and airport transfers.</p>
            <p>The business is run personally by <strong className="text-navy-900">{business.owner}</strong>. When you call or message us, you speak directly with the person who plans your trip and assigns your car and driver.</p>
          </div>
          <a href={telLink} className={`${btn.navy} mt-8`}><Phone className="h-4 w-4" /> Talk to {business.owner.split(' ')[0]} — {business.phoneDisplay}</a>
        </div>
        <div className="relative rounded-[2rem] bg-navy-900 p-8 shadow-card text-center">
          <LogoMark className="mx-auto h-24 w-24" />
          <p className="mt-4 font-display text-2xl font-bold text-white">{business.brand}</p>
          <p className="text-gold-300 font-display">{business.marketingTagline}</p>
          <p className="mt-1 font-marathi text-navy-100">{business.marathiTagline}</p>
          <img src={img('fleet/dzire-ertiga.webp')} alt="Narayan Tours & Travels Dzire and Ertiga" loading="lazy" className="mt-6 w-full rounded-2xl object-cover" />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-x">
          <SectionHeading kicker="Our values" title="What you can expect on every trip" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: I, title, text }) => (
              <div key={title} className="rounded-3xl bg-navy-50 p-6 ring-1 ring-navy-100">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-800 text-gold-400"><I className="h-7 w-7" /></span>
                <h3 className="mt-5 font-display text-xl font-bold text-navy-900">{title}</h3>
                <p className="mt-2 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <SectionHeading kicker="Why travel with us" title="Small details that make a big difference" />
        <TrustStrip />
      </section>
      <CTABand />
    </>
  );
}
