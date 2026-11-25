/* =====================================================================
   SEO / AEO / GEO prerender — runs after `vite build`.

   The site is a single-page React app, so without this step every URL
   returns the same empty HTML shell. Search engines and AI crawlers
   (ChatGPT, Perplexity, Claude, Gemini…) that don't run JavaScript would
   see no content at all.

   For every public page this script writes a real HTML file into dist/
   with its own <title>, description, canonical URL, Open Graph tags,
   JSON-LD structured data and a readable text version of the page inside
   #root (React replaces it as soon as the app loads).

   It also writes:
     dist/spa.html     untouched app shell, used by vercel.json as the
                       fallback for /book/confirmation, /admin and 404s
     dist/sitemap.xml  with lastmod dates
     dist/llms.txt     plain-text summary for AI assistants

   Content comes from src/config/site.js and src/data/content.js, so it
   stays in sync with the site automatically.
   ===================================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { business, vehicles, packages, specials, popularRoutes, fareDisclaimer } from '../src/config/site.js';
import { services, destinations, destinationGroups, faqs } from '../src/data/content.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const shellPath = join(dist, 'index.html');
if (!existsSync(shellPath)) {
  console.error('[seo-prerender] dist/index.html not found — run vite build first.');
  process.exit(1);
}
const shell = readFileSync(shellPath, 'utf8');

const SITE = business.siteUrl.replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = `${SITE}/og-image.png`;
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const short = (v) => v.name.replace('Maruti Suzuki ', '');
const rates = vehicles.map((v) => `${short(v)} ₹${v.ratePerKm}/km`).join(', ');

/* ---------- Shared structured data ---------- */
const ORG_ID = `${SITE}/#business`;
const business_ld = {
  '@type': ['TravelAgency', 'LocalBusiness'],
  '@id': ORG_ID,
  name: business.name,
  alternateName: [business.brand, 'NTT Travel', 'Narayan Tours and Travels'],
  slogan: business.marketingTagline,
  description:
    'Car rental and taxi service in Mumbai, Thane and Navi Mumbai for outstation trips, airport transfers, pilgrimage tours, Konkan trips and family tours across Maharashtra.',
  url: `${SITE}/`,
  telephone: business.phoneTel,
  image: `${SITE}/images/${business.heroPhoto}`,
  logo: `${SITE}/images/${business.logo}`,
  founder: { '@type': 'Person', name: business.owner },
  address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressRegion: 'Maharashtra', addressCountry: 'IN' },
  areaServed: ['Mumbai', 'Thane', 'Navi Mumbai', 'Pune', 'Konkan', 'Maharashtra', 'India'].map((name) => ({ '@type': 'Place', name })),
  priceRange: `₹${Math.min(...vehicles.map((v) => v.ratePerKm))}–₹${Math.max(...vehicles.map((v) => v.ratePerKm))} per km`,
  currenciesAccepted: 'INR',
  knowsLanguage: ['en', 'mr', 'hi'],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: business.phoneTel,
      contactType: 'reservations',
      areaServed: 'IN',
      availableLanguage: ['English', 'Marathi', 'Hindi'],
    },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Car rental rates',
    itemListElement: vehicles.map((v) => ({
      '@type': 'Offer',
      name: `${v.name} with driver`,
      description: `${v.type}, ${v.seats} passengers. ${v.summary}`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: v.ratePerKm,
        priceCurrency: 'INR',
        unitText: 'per km',
      },
    })),
  },
};
const website_ld = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: business.name,
  alternateName: business.brand,
  inLanguage: 'en-IN',
  publisher: { '@id': ORG_ID },
};
const faq_ld = {
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};
const crumbs_ld = (path, name) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    ...(path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name, item: SITE + path }]),
  ],
});

/* ---------- Reusable HTML blocks ---------- */
const nav = [
  ['/', 'Home'], ['/services', 'Services'], ['/fleet', 'Fleet & Rates'], ['/packages', 'Tour Packages'],
  ['/destinations', 'Destinations'], ['/fare-calculator', 'Fare Calculator'], ['/book', 'Book Now'],
  ['/about', 'About'], ['/gallery', 'Gallery'], ['/contact', 'Contact'],
];
const navHtml = `<nav aria-label="Main"><ul>${nav.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></nav>`;
const contactHtml = `<p><strong>Call / WhatsApp:</strong> <a href="tel:${business.phoneTel}">${esc(business.phoneDisplay)}</a> (${esc(business.owner)}) · Based in ${esc(business.officeCity)} · Serving ${esc(business.serviceArea)} and ${esc(business.coverage)}.</p>`;
const ratesHtml = `<ul>${vehicles
  .map((v) => `<li><strong>${esc(v.name)}</strong> (${esc(v.type)}, ${v.seats} passengers, ${esc(v.luggage)}) — <strong>₹${v.ratePerKm} per km</strong>. ${esc(v.summary)}</li>`)
  .join('')}</ul><p><small>${esc(fareDisclaimer)}</small></p>`;
const faqHtml = `<section><h2>Frequently asked questions</h2>${faqs
  .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
  .join('')}</section>`;
const servicesHtml = `<ul>${services
  .map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><p>${s.points.map(esc).join(' · ')}</p></li>`)
  .join('')}</ul>`;
const routesHtml = `<ul>${popularRoutes
  .map((r) => {
    const est = r.km ? ` — about ${r.km} km one way; Dzire est. ${inr(r.km * vehicles[0].ratePerKm)}, Ertiga est. ${inr(r.km * vehicles[1].ratePerKm)}` : '';
    return `<li>${esc(r.from)} to ${esc(r.to)}${esc(est)}${r.note ? ` (${esc(r.note)})` : ''}</li>`;
  })
  .join('')}</ul><p><small>Route estimates are approximate one-way figures; tolls, parking and other charges may be extra.</small></p>`;
const packagesHtml = packages
  .map(
    (p) => `<article><h3>${esc(p.title)}</h3><p>${esc(p.duration)} · from ${esc(p.from)}</p><ul>${p.prices
      .map((x) => `<li>${esc(x.label)}: <strong>${inr(x.price)}</strong></li>`)
      .join('')}</ul><h4>Places covered</h4><ul>${p.places.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${p.itinerary
      .map((d) => `<h4>${esc(d.day)}: ${esc(d.title)}</h4><ul>${d.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`)
      .join('')}<p><strong>Includes:</strong> ${p.includes.map(esc).join(', ')}.</p><p><small>${esc(p.note)}</small></p></article>`
  )
  .join('');
const specialsHtml = specials
  .map((s) => `<article><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><p><strong>Includes:</strong> ${s.includes.map(esc).join(', ')}. ${esc(s.badge)}</p></article>`)
  .join('');
const destinationsHtml = destinationGroups
  .map((g) => {
    const list = destinations.filter((d) => d.group === g.id);
    if (!list.length) return '';
    return `<section><h2>${esc(g.label)}</h2><ul>${list
      .map((d) => `<li><h3>${esc(d.name)}</h3><p>${esc(d.text)}${d.km ? ` About ${d.km} km from Mumbai / Thane.` : ''}</p>${d.highlights ? `<p>${d.highlights.map(esc).join(' · ')}</p>` : ''}</li>`)
      .join('')}</ul></section>`;
  })
  .join('');
const cta = `<p><a href="/book">Book your ride online</a> or call <a href="tel:${business.phoneTel}">${esc(business.phoneDisplay)}</a>.</p>`;

/* ---------- Pages ---------- */
const pages = [
  {
    path: '/',
    name: 'Home',
    title: `${business.name} — Car Rental & Taxi in Mumbai, Thane & Maharashtra | ${business.brand}`,
    description: `${business.name} (${business.brand}): car rental with driver in Mumbai, Thane & Navi Mumbai. ${rates}. Outstation cabs, Mumbai–Pune & Shirdi taxi, Konkan & pilgrimage tours. Call ${business.phoneDisplay}.`,
    ld: [faq_ld],
    body: `<h1>${esc(business.name)} — car rental &amp; taxi service in Mumbai and across Maharashtra</h1>
<p><strong>${esc(business.name)} (${esc(business.brand)})</strong> is a Mumbai-based car rental and taxi service run by ${esc(business.owner)}. We provide AC cars with experienced drivers for outstation trips, airport pickup and drop, pilgrimage tours, Konkan trips, weekend getaways and family tours from Mumbai, Thane and Navi Mumbai. ${esc(business.marketingTagline)}</p>
<h2>Car rental rates</h2>${ratesHtml}
<h2>Popular routes</h2>${routesHtml}
<h2>Our services</h2>${servicesHtml}
<h2>Tour packages</h2>${packagesHtml}
${faqHtml}
<h2>Contact</h2>${contactHtml}${cta}`,
  },
  {
    path: '/services',
    name: 'Services',
    title: `Cab & Car Rental Services in Mumbai — Outstation, Airport, Pilgrimage | ${business.name}`,
    description: 'Local city travel, outstation car rental, airport pickup & drop, family tours, corporate travel, pilgrimage tours, Konkan one-way sharing, weekend getaways and custom packages from Mumbai & Thane.',
    ld: [
      {
        '@type': 'ItemList',
        name: 'Travel services',
        itemListElement: services.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'Service', name: s.title, description: s.text, provider: { '@id': ORG_ID }, areaServed: 'Maharashtra, India' },
        })),
      },
    ],
    body: `<h1>Our travel services</h1><p>From a quick airport drop to a week-long family tour — one dependable car service for every kind of trip, starting from Mumbai, Thane and Navi Mumbai.</p>${servicesHtml}<h2>Rates</h2>${ratesHtml}${contactHtml}${cta}`,
  },
  {
    path: '/fleet',
    name: 'Fleet',
    title: `Dzire & Ertiga on Rent with Driver — ${rates} | ${business.name}`,
    description: `Rent a Maruti Suzuki Dzire from ₹${vehicles[0].ratePerKm}/km or an Ertiga from ₹${vehicles[1].ratePerKm}/km with an experienced driver in Mumbai & Thane. Ideal for family trips, airport transfers and outstation travel in Maharashtra.`,
    ld: [],
    body: `<h1>Our fleet: Dzire and Ertiga with driver</h1><p>Comfortable, air-conditioned cars with experienced drivers and simple per-kilometre pricing.</p>${vehicles
      .map(
        (v) => `<article><h2>${esc(v.name)} — ₹${v.ratePerKm}/km</h2><p>${esc(v.summary)}</p><ul><li>Type: ${esc(v.type)}</li><li>Seats: ${v.seats} passengers</li><li>Luggage: ${esc(v.luggage)}</li><li>Ideal for: ${v.idealFor.map(esc).join(', ')}</li><li>Features: ${v.features.map(esc).join(', ')}</li></ul></article>`
      )
      .join('')}<p><small>${esc(fareDisclaimer)}</small></p>${contactHtml}${cta}`,
  },
  {
    path: '/packages',
    name: 'Tour Packages',
    title: `Shirdi, Nashik & Konkan Tour Packages from Mumbai | ${business.name}`,
    description: `Shirdi – Shani Shingnapur – Nashik – Saptashrungi 2 Day / 1 Night package from Mumbai: Sedan ${inr(packages[0].prices[0].price)}, SUV ${inr(packages[0].prices[1].price)}. Monsoon specials, Konkan festival trips and one-way sharing.`,
    ld: packages.map((p) => ({
      '@type': 'TouristTrip',
      name: p.title,
      description: `${p.duration} from ${p.from}. Covers ${p.places.join(', ')}.`,
      touristType: 'Pilgrims and families',
      itinerary: { '@type': 'ItemList', itemListElement: p.places.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: x } })) },
      provider: { '@id': ORG_ID },
      offers: p.prices.map((x) => ({ '@type': 'Offer', name: x.label, price: x.price, priceCurrency: 'INR', url: `${SITE}/packages` })),
    })),
    body: `<h1>Tour packages &amp; specials</h1><p>Ready-made Dev Darshan tours, monsoon outings, Konkan festival trips and one-way sharing — or ask us for a custom plan.</p>${packagesHtml}<h2>Seasonal specials</h2>${specialsHtml}${contactHtml}${cta}`,
  },
  {
    path: '/destinations',
    name: 'Destinations',
    title: `Mumbai to Shirdi, Konkan, Lonavala & More — Cab Destinations | ${business.name}`,
    description: 'Mumbai to Shirdi taxi, Nashik–Trimbakeshwar, Pandharpur, Tuljapur and Akkalkot pilgrimage tours, Konkan trips to Malvan, Dapoli, Ratnagiri and Ganpatipule, and weekend trips to Lonavala and Matheran.',
    ld: [],
    body: `<h1>Popular travel destinations from Mumbai</h1><p>Pilgrimages, Konkan beaches, city tours and weekend getaways across Maharashtra.</p>${destinationsHtml}<h2>Popular routes</h2>${routesHtml}${contactHtml}${cta}`,
  },
  {
    path: '/fare-calculator',
    name: 'Fare Calculator',
    title: `Cab Fare Calculator — Estimate Outstation Taxi Fare | ${business.name}`,
    description: `Estimate your outstation cab fare instantly: ${rates}. Estimated fare = total km × per-km rate. One way or round trip from Mumbai, Thane & Navi Mumbai.`,
    ld: [],
    body: `<h1>Cab fare calculator</h1><p><strong>How the fare is estimated:</strong> total kilometres × the per-km rate of the car. For a round trip the distance is counted both ways.</p>${ratesHtml}<h2>Example estimates</h2>${routesHtml}${contactHtml}${cta}`,
  },
  {
    path: '/book',
    name: 'Book Now',
    title: `Book a Cab Online — Mumbai, Thane & Outstation | ${business.name}`,
    description: `Book a Dzire or Ertiga with ${business.name}. Pick exact pickup and drop locations on the map, see the route and an estimated fare, and confirm with the owner on WhatsApp.`,
    ld: [],
    body: `<h1>Book your ride</h1><ol><li>Pick exact pickup and drop locations on the map.</li><li>See distance, travel time and an estimated fare.</li><li>Confirm and get a booking ID, then send the details to ${esc(business.owner)} on WhatsApp. Kindly discuss the final fare with the cab owner.</li></ol>${ratesHtml}${contactHtml}`,
  },
  {
    path: '/about',
    name: 'About Us',
    title: `About Us — ${business.name} (${business.brand}), Mumbai`,
    description: `About ${business.name} — a Maharashtra car rental and tour service run by ${business.owner}, built on comfort, safety and reliability.`,
    ld: [],
    body: `<h1>About ${esc(business.name)}</h1><p>${esc(business.name)} (${esc(business.brand)}) is a car rental and tour service based in ${esc(business.officeCity)}, run by ${esc(business.owner)}. Our values: ${esc(business.tagline)}. ${esc(business.promise)}</p><p>We serve ${esc(business.serviceArea)}, with ${esc(business.coverage)}.</p><h2>What we offer</h2>${servicesHtml}${contactHtml}${cta}`,
  },
  {
    path: '/gallery',
    name: 'Gallery',
    title: `Gallery — Trips, Cars & Destinations | ${business.name}`,
    description: `Photos of our Dzire and Ertiga cars and popular destinations — Shirdi, Ganpatipule, Devkund, Raigad, Tarkarli and more — from ${business.name}.`,
    ld: [],
    body: `<h1>Gallery</h1><p>Our cars and some of the places we travel to across Maharashtra.</p>${contactHtml}${cta}`,
  },
  {
    path: '/contact',
    name: 'Contact',
    title: `Contact ${business.name} — Call / WhatsApp ${business.phoneDisplay}`,
    description: `Contact ${business.name}. Call or WhatsApp ${business.owner} on ${business.phoneDisplay} for cab bookings, quotes and tour packages in Mumbai, Thane and Maharashtra.`,
    ld: [faq_ld],
    body: `<h1>Contact us</h1><p>Call, WhatsApp or send a message — you will hear back directly from the owner, ${esc(business.owner)}.</p>${contactHtml}${faqHtml}`,
  },
  {
    path: '/photo-credits',
    name: 'Photo credits',
    title: `Photo credits | ${business.name}`,
    description: 'Credits and licences for photos used on this website, sourced from Wikimedia Commons.',
    ld: [],
    body: `<h1>Photo credits</h1><p>Credits and licences for photos used on this website, sourced from Wikimedia Commons.</p>`,
  },
];

/* ---------- Build each page ---------- */
const STATIC_CSS = `<style id="seo-static-css">#root>.seo-static{max-width:880px;margin:0 auto;padding:96px 20px 48px;font-family:'DM Sans',system-ui,sans-serif;color:#1e293b;line-height:1.6}#root>.seo-static h1{font-size:2rem;line-height:1.2;color:#0a1834}#root>.seo-static h2{margin-top:2rem;color:#0a1834}#root>.seo-static nav ul{display:flex;flex-wrap:wrap;gap:12px;list-style:none;padding:0}#root>.seo-static a{color:#c2410c}</style>`;

function headFor(p) {
  const url = SITE + (p.path === '/' ? '/' : p.path);
  const graph = { '@context': 'https://schema.org', '@graph': [business_ld, website_ld, crumbs_ld(p.path, p.name), ...p.ld] };
  return [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en-IN" href="${url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${url}" />`,
    `<meta name="author" content="${esc(business.name)}" />`,
    `<meta name="geo.region" content="IN-MH" />`,
    `<meta name="geo.placename" content="Mumbai, Maharashtra" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:site_name" content="${esc(business.name)}" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:alt" content="${esc(business.name)} — Dzire and Ertiga cabs" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<link rel="alternate" type="text/plain" title="LLM summary" href="${SITE}/llms.txt" />`,
    `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\x5cu003c')}</script>`,
    STATIC_CSS,
  ].join('\n    ');
}

/* Remove the tags we regenerate per page from the shell's <head>. */
function stripHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="(description|keywords|robots|author|twitter:[^"]*)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<!--\s*(Open Graph[^>]*|LocalBusiness[^>]*)-->\s*/gi, '');
}

const base = stripHead(shell);
if (!/<div id="root"><\/div>/.test(base)) {
  console.error('[seo-prerender] Could not find <div id="root"></div> in dist/index.html');
  process.exit(1);
}

// Untouched shell for the SPA fallback (confirmation page, admin, 404s).
writeFileSync(join(dist, 'spa.html'), shell);

for (const p of pages) {
  const html = base
    .replace(/<\/head>/i, `    ${headFor(p)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><div class="seo-static">${navHtml}<main>${p.body}</main></div></div>`);
  const out = p.path === '/' ? join(dist, 'index.html') : join(dist, p.path.slice(1), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

/* ---------- sitemap.xml ---------- */
const priority = { '/': '1.0', '/book': '0.9', '/fleet': '0.9', '/packages': '0.9', '/services': '0.8', '/destinations': '0.8', '/fare-calculator': '0.8', '/contact': '0.7', '/about': '0.6', '/gallery': '0.5', '/photo-credits': '0.2' };
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${SITE}${p.path === '/' ? '/' : p.path}</loc><lastmod>${TODAY}</lastmod><priority>${priority[p.path] || '0.5'}</priority></url>`)
    .join('\n')}\n</urlset>\n`
);

/* ---------- llms.txt (for AI assistants / GEO) ---------- */
const llms = `# ${business.name} (${business.brand})

> ${business.name} is a car rental and taxi service based in Mumbai, India, run by ${business.owner}. It provides AC cars with drivers (Maruti Suzuki Dzire and Ertiga) for outstation trips, airport transfers, pilgrimage tours, Konkan trips and family tours from Mumbai, Thane and Navi Mumbai across Maharashtra. Phone / WhatsApp: ${business.phoneDisplay} (${business.phoneTel}).

## Key facts
- Business: ${business.name}, also called ${business.brand}
- Owner: ${business.owner}
- Based in: ${business.officeCity}
- Service area: ${business.serviceArea}; ${business.coverage}
- Contact: call or WhatsApp ${business.phoneDisplay}
- Languages: English, Marathi, Hindi
- Booking: online at ${SITE}/book, or by phone / WhatsApp. A booking is confirmed when the owner replies. The final fare is discussed with the cab owner.
- Payment: no online payment on the website; details are shared by the owner.

## Rates (per km, with driver)
${vehicles.map((v) => `- ${v.name} (${v.type}, ${v.seats} passengers): ₹${v.ratePerKm}/km`).join('\n')}
- Estimated fare = total km × per-km rate (round trips count both ways). ${fareDisclaimer}

## Popular routes (approx. one-way distance)
${popularRoutes.map((r) => `- ${r.from} to ${r.to}${r.km ? `: about ${r.km} km` : ''}${r.note ? ` (${r.note})` : ''}`).join('\n')}

## Tour packages
${packages.map((p) => `- ${p.title} — ${p.duration} from ${p.from}: ${p.prices.map((x) => `${x.label} ${inr(x.price)}`).join(', ')}. Includes ${p.includes.join(', ')}.`).join('\n')}
${specials.map((s) => `- ${s.title}: ${s.text}`).join('\n')}

## Services
${services.map((s) => `- ${s.title}: ${s.text}`).join('\n')}

## FAQ
${faqs.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Pages
${pages.filter((p) => p.path !== '/photo-credits').map((p) => `- [${p.name}](${SITE}${p.path === '/' ? '/' : p.path}): ${p.description}`).join('\n')}
`;
writeFileSync(join(dist, 'llms.txt'), llms);

console.log(`[seo-prerender] wrote ${pages.length} pages, spa.html, sitemap.xml and llms.txt`);
