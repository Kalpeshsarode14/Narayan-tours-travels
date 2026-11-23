import { Phone, User, Briefcase, Clock, MapPin } from 'lucide-react';
import { PageHero, Seo, SectionHeading, btn, WhatsAppIcon, SocialLinks } from '../components/UI.jsx';
import { ContactForm, MapCard } from '../components/Forms.jsx';
import { FAQ } from '../components/Cards.jsx';
import { business } from '../config/site.js';
import { faqs } from '../data/content.js';
import { whatsappLink, telLink } from '../lib/utils.js';

export default function Contact() {
  return (
    <>
      <Seo title="Contact Us" path="/contact" description={`Contact ${business.name}. Call or WhatsApp ${business.owner} on ${business.phoneDisplay} for bookings, quotes and tour packages.`} />
      <PageHero title="Contact Us" text="Call, WhatsApp or send a message — you will hear back directly from the owner." />

      <section className="container-x py-16 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-navy-900 p-7 text-white shadow-card">
            <h2 className="font-display text-2xl font-bold">{business.name}</h2>
            <p className="text-gold-300">{business.tagline}</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center gap-3"><User className="h-5 w-5 text-gold-400" /> <span><span className="block text-sm text-navy-100">Contact person</span>{business.owner}</span></li>
              <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-gold-400" /> <span><span className="block text-sm text-navy-100">Mobile</span><a href={telLink} className="font-display text-xl font-semibold hover:text-gold-300">{business.phoneDisplay}</a></span></li>
              <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-gold-400" /> <span><span className="block text-sm text-navy-100">Office</span>{business.officeCity} · {business.coverage}</span></li>
              <li className="flex items-center gap-3"><Clock className="h-5 w-5 text-gold-400" /> <span><span className="block text-sm text-navy-100">Bookings</span>24/7 on call & WhatsApp · Advance booking available</span></li>
            </ul>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <a href={telLink} className={btn.gold}><Phone className="h-4 w-4" /> Call now</a>
              <a href={whatsappLink(`Hello ${business.name}, I have an enquiry.`)} target="_blank" rel="noopener noreferrer" className={btn.whatsapp}><WhatsAppIcon /> WhatsApp</a>
            </div>
            <SocialLinks className="mt-6" />
          </div>
          <div className="min-h-[300px]"><MapCard /></div>
        </div>
        <div>
          <SectionHeading center={false} kicker="Send a message" title="How can we help?" />
          <ContactForm />
          <div className="mt-8 rounded-3xl bg-white p-7 shadow-card ring-1 ring-navy-100">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-100 text-saffron-600"><Briefcase className="h-6 w-6" /></span>
              <h2 className="font-display text-xl font-bold text-navy-900">Business & corporate enquiries</h2>
            </div>
            <p className="mt-3 text-slate-600">Employee transport, client pickups, event cars, hotel and travel-agent tie-ups, or regular monthly requirements — share your needs and we will get back with a proposal.</p>
            <a className={`${btn.navy} mt-5`} target="_blank" rel="noopener noreferrer"
              href={whatsappLink(`Hello ${business.name}, I have a business / corporate travel enquiry.\nCompany:\nRequirement:\nDates / frequency:`)}>
              <WhatsAppIcon /> Start a business enquiry
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 container-x pb-20">
        <SectionHeading kicker="FAQ" title="Frequently asked questions" />
        <FAQ items={faqs} />
      </section>
    </>
  );
}
