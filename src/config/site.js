/* =====================================================================
   SITE SETTINGS — edit this one file to update business details,
   vehicle prices, package prices, social links, map and testimonials.
   ===================================================================== */

/* Where images live (files in /public/images). Leave as is. */
export const assetBase =
  (typeof window !== 'undefined' && window.__ASSET_BASE__) || '/images/';
export const img = (path) => (path ? assetBase + path : '');

export const business = {
  name: 'Narayan Tours & Travels',
  brand: 'NTT Travel',
  tagline: 'Comfort | Safety | Reliability',
  marketingTagline: 'Travel Happy... Travel Safe...',
  promise: 'Your Journey, Our Responsibility.',
  marathiTagline: 'तुमच्या प्रत्येक प्रवासात... आम्ही सोबत!',
  owner: 'Shrikant Mahindrakar',
  // Main number — booking requests from the website go here on WhatsApp
  phoneDisplay: '9967 456 323',
  phoneTel: '+919967456323',
  whatsappNumber: '919967456323', // country code + number, digits only
  email: '', // add an email address if you have one
  officeCity: 'Mumbai, India',
  serviceArea: 'Mumbai, Thane, Navi Mumbai, Pune & Konkan',
  coverage: 'Maharashtra & All-India tours',
  // Your live website address (used for SEO tags). Change after deploying.
  siteUrl: 'https://ntt-travel.vercel.app',
  logo: 'brand/ntt-emblem-dark.webp',
  logoLight: 'brand/ntt-logo-light.webp',
  heroPhoto: 'brand/hero-fleet.webp',
};

/* Google Maps: leave empty until you want a map shown.
   Put your full business address or a "lat,lng" here, e.g. '19.0760,72.8777'. */
export const mapLocation = '';

/* Social media — paste full URLs. Empty links are hidden automatically. */
export const social = {
  facebook: '',
  instagram: '', // your posters mention Instagram — paste the profile link here
  youtube: '',
};

/* =====================================================================
   FLEET & PRICES — change ratePerKm to update prices everywhere.
   ===================================================================== */
export const vehicles = [
  {
    id: 'dzire',
    name: 'Maruti Suzuki Dzire',
    short: 'Sedan (Dzire)',
    type: 'Sedan',
    ratePerKm: 14,
    seats: 4,
    luggage: '2 medium bags',
    art: 'sedan',
    color: '#f5f7fb',
    photo: 'fleet/dzire.webp',
    summary: 'Comfortable 4-seater sedan for small families, couples and business travel.',
    idealFor: ['Family trips', 'Airport transfers', 'Business travel'],
    features: ['AC cab', 'Comfortable seating', 'Music system', 'Experienced driver'],
  },
  {
    id: 'ertiga',
    name: 'Maruti Suzuki Ertiga',
    short: 'Ertiga',
    type: 'MPV / Family car',
    ratePerKm: 17,
    seats: 6,
    luggage: '3–4 bags (with seats folded)',
    art: 'mpv',
    color: '#e9ecf2',
    photo: 'fleet/ertiga.webp',
    summary: 'Spacious, family-friendly 3-row car for groups and long-distance journeys.',
    idealFor: ['Group travel', 'Long-distance journeys', 'Pilgrimage tours'],
    features: ['AC cab', 'Spacious 3-row seating', 'Extra luggage room', 'Experienced driver'],
  },
];

/* Text shown next to every fare estimate. */
export const fareDisclaimer =
  'This is an estimate only. Tolls, parking, state permits, driver allowance, night charges, minimum kilometre requirements and other applicable charges may be extra. Final fare is confirmed by the owner.';

/* =====================================================================
   TOUR PACKAGES — prices from your posters. Edit freely.
   ===================================================================== */
export const packages = [
  {
    id: 'shirdi-nashik-saptashrungi',
    title: 'Shirdi – Shani Shingnapur – Nashik – Saptashrungi Dev Darshan',
    marathi: 'शिर्डी - शनि शिंगणापूर - नाशिक - सप्तश्रृंगी देव दर्शन',
    duration: '2 Days / 1 Night',
    from: 'Mumbai / Navi Mumbai',
    prices: [
      { label: 'Sedan (4 seater)', price: 17999, vehicle: 'dzire' },
      { label: 'SUV (6–7 seater)', price: 23999, vehicle: 'ertiga' },
    ],
    photos: ['destinations/shirdi.webp', 'destinations/shani-shingnapur.webp', 'destinations/trimbakeshwar.webp', 'destinations/nashik-panchavati.webp', 'destinations/kalaram.webp'],
    places: [
      'Sai Baba Samadhi Mandir, Shirdi', 'Shani Shingnapur Mandir', 'Trimbakeshwar Jyotirlinga, Nashik', 'Panchavati & Godavari Ghat',
      'Kalaram Mandir, Nashik', 'Sita Gufa', 'Muktidham Mandir, Nashik', 'Saptashrungi Devi Mandir, Vani',
    ],
    itinerary: [
      { day: 'Day 1', title: 'Mumbai / Navi Mumbai → Shirdi → Shani Shingnapur → Nashik', items: ['Sai Baba darshan and local sightseeing', 'Shani Shingnapur darshan', 'Overnight stay in Nashik'] },
      { day: 'Day 2', title: 'Nashik → Saptashrungi → Mumbai / Navi Mumbai', items: ['Nashik darshan — Trimbakeshwar, Panchavati, Kalaram Mandir, Sita Gufa, Muktidham', 'Saptashrungi Devi darshan (Vani)', 'Return journey to Mumbai / Navi Mumbai'] },
    ],
    includes: ['Pickup & drop (Mumbai / Navi Mumbai)', 'Comfortable AC cab', 'Custom stop options', 'Early-morning pickup available'],
    note: 'Weekend & festival special bookings available. Hotel stay, meals and darshan passes are not mentioned as included — confirm with the owner when booking.',
  },
];

/* Seasonal & special services (shown on the Packages page) */
export const specials = [
  {
    id: 'monsoon',
    title: 'Monsoon Special — Explore the beauty of Maharashtra',
    marathi: 'पावसाळ्यात फिरायला... महाराष्ट्रातच फिरायला!',
    photo: 'destinations/devkund.webp',
    text: 'Waterfalls, forts, ghats and hill stations near Mumbai and Thane — Lohagad, Rajmachi, Bhivpuri, Matheran, Igatpuri, Malshej, Bhandardara and more. One-day and two-day trips.',
    includes: ['Pickup & drop', 'AC cab', 'Toll & parking', 'Driver allowance', 'Fuel'],
    badge: 'Custom packages — call for best price · Group booking special discount',
  },
  {
    id: 'konkan',
    title: 'Konkan Festival Special — Ganpati & holidays',
    marathi: 'कोकणातून मुंबई / ठाण्याकडे परतीचा प्रवास',
    photo: 'destinations/ganpatipule.webp',
    text: 'Advance booking for festival-season trips between Mumbai / Thane and the Konkan — Ratnagiri, Chiplun, Khed, Mangaon, Mahad, Dapoli, Guhagar, Malvan and more. Book early before the holiday rush.',
    includes: ['Door-to-door pickup', 'AC cab', 'Custom stops', 'Family friendly'],
    badge: 'Advance booking available',
  },
  {
    id: 'sharing',
    title: 'One-Way Sharing — Mumbai to Konkan',
    photo: 'destinations/dapoli.webp',
    text: 'One-way sharing seats on the Mumbai – Mangaon, Dapoli and Ratnagiri routes. Call or WhatsApp to check the next available date and fare.',
    includes: ['Mumbai – Mangaon', 'Mumbai – Dapoli', 'Mumbai – Ratnagiri'],
    badge: 'Seats subject to availability',
  },
];

/* Popular routes from your posters. km = approx. one-way distance used for quick estimates. */
export const popularRoutes = [
  { from: 'Mumbai', to: 'Pune', km: 150 },
  { from: 'Mumbai', to: 'Shirdi', km: 240 },
  { from: 'Mumbai', to: 'Lonavala', km: 85 },
  { from: 'Mumbai', to: 'Mangaon', km: 130, note: 'One-way sharing' },
  { from: 'Mumbai', to: 'Dapoli', km: 220, note: 'One-way sharing' },
  { from: 'Mumbai', to: 'Ratnagiri', km: 330, note: 'One-way sharing' },
  { from: 'Mumbai', to: 'Nashik – Saptashrungi – Shani Shingnapur', km: 0, note: 'Package available' },
  { from: 'Konkan', to: 'Mumbai / Thane', km: 0, note: 'Ratnagiri · Chiplun · Khed · Mangaon · Mahad' },
];

/* =====================================================================
   TESTIMONIALS — SAMPLE placeholders, clearly labelled on the site.
   Replace with genuine customer feedback and set isSample: false.
   ===================================================================== */
export const showTestimonials = true;
export const testimonials = [
  { isSample: true, name: 'Sample customer name', trip: 'Mumbai → Shirdi',
    text: 'This is a sample testimonial. Replace it with a real review from a customer who travelled with Narayan Tours & Travels.' },
  { isSample: true, name: 'Sample customer name', trip: 'Thane → Ganpatipule',
    text: 'Placeholder text. Ask happy customers for a line or two about their trip and paste it here with their permission.' },
  { isSample: true, name: 'Sample customer name', trip: 'Airport drop',
    text: 'Sample review. Genuine feedback builds trust — update this in src/config/site.js.' },
];
