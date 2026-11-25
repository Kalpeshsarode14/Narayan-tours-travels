# Narayan Tours & Travels — NTT Travel website

React + Vite + Tailwind CSS + Lucide icons + React Router.
10 pages: Home, About, Fleet, Services, Destinations, Packages, Fare Calculator, Gallery, Contact, Book Now.

---

## 1. Run it on your computer

1. Install **Node.js 20 or newer** from <https://nodejs.org> (choose the "LTS" version).
2. Unzip this folder, open a terminal / command prompt **inside it**, and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open the address it prints (usually <http://localhost:5173>).

To make a production build: `npm run build` (output goes to `dist/`). To preview that build: `npm run preview`.

---

## 2. Put it online with Vercel (free)

**Option A — GitHub + Vercel (recommended, auto-updates when you change files)**

1. Create a free account at <https://github.com> and a new repository (e.g. `narayan-tours`).
2. Upload all files from this folder to the repository (drag and drop on the GitHub website works).
3. Go to <https://vercel.com>, sign in with GitHub, click **Add New → Project**, and pick the repository.
4. Vercel detects **Vite** automatically. Keep the defaults (Build command `npm run build`, Output `dist`) and click **Deploy**.
5. You get a link like `https://narayan-tours.vercel.app`. To use your own domain (e.g. `ntttravel.in`), open the project → **Settings → Domains**.

**Option B — Vercel CLI**

```bash
npm install -g vercel
vercel        # first time: answer the questions, accept defaults
vercel --prod # publish
```

`vercel.json` is already included so links like `/fleet` or `/book` work when opened directly.

**After deploying:** put your real web address in `siteUrl` in `src/config/site.js`, and replace `https://narayan-tours.vercel.app` in `index.html`, `public/robots.txt` and `public/sitemap.xml`.

---

## 3. Everyday edits (no coding knowledge needed)

| What to change | Where |
|---|---|
| Phone numbers, owner name, taglines, office city | `src/config/site.js` → `business` |
| **Per-km prices** (Dzire ₹14, Ertiga ₹17) | `src/config/site.js` → `vehicles` → `ratePerKm` |
| **Package prices** (Shirdi–Nashik ₹17,999 / ₹23,999) | `src/config/site.js` → `packages` |
| Monsoon / Konkan / sharing specials | `src/config/site.js` → `specials` |
| Popular routes | `src/config/site.js` → `popularRoutes` |
| Google Map location | `src/config/site.js` → `mapLocation` (address or `"lat,lng"`) |
| Facebook / Instagram / YouTube links | `src/config/site.js` → `social` |
| Customer reviews | `src/config/site.js` → `testimonials` (set `isSample: false` for real ones) |
| Services, destinations, FAQ, gallery | `src/data/content.js` |
| Photos | `public/images/…` — then set `photo: 'folder/file.webp'` |

A price change in `site.js` updates the fleet cards, the quick fare calculator and the footer together.
**Prices used for real bookings on `/book` are set in the Admin panel (`/admin`), not in `site.js`.** When you change a rate in the admin panel, also update `ratePerKm` here so the marketing pages show the same number.

**Photos:** the current photos were cut from your posters. For sharper pictures, take real photos of your cars and trips, put them in `public/images/fleet/` or `public/images/destinations/`, and update the file names in `site.js` / `content.js`. Landscape photos about 1200 px wide work best.

---

## 4. How booking works (important)

The **Book Now** page (`/book`) is a full online booking system:

* The customer picks **exact pickup, stops and drop-off from Google Maps** suggestions (typed text alone is not accepted).
* The site gets the real **driving route, distance and travel time** from Google and shows it on a map.
* The **final fare** and a full breakdown (base, distance, driver allowance, tolls, night/waiting/stop charges, add-ons) appear instantly and update when anything changes.
* On **Confirm Booking**, the server recalculates the fare (customers cannot change it), saves the booking in the **Supabase** database with a booking ID such as `NTT-261210-7KQ4M`, and shows a confirmation page with a **Send on WhatsApp** button to +91 99674 56323.
* The owner manages **prices, bookings and the WhatsApp number** at `/admin` (password protected).
* Until the booking service is set up (Google keys + Supabase + Vercel settings), `/book` automatically falls back to the previous **WhatsApp request form**, so the site never breaks.

**Setup (one time, ~30 minutes):** follow [`docs/BOOKING-SETUP.md`](docs/BOOKING-SETUP.md).

The **contact form** still sends via WhatsApp. The quick **Fare Calculator** page (km slider) is still there and links to `/book` for the exact fare.

---

## 5. SEO already included

* Page-specific titles, descriptions, canonical links and Open Graph tags (`src/components/UI.jsx → Seo`)
* `TravelAgency` (LocalBusiness) structured data in `index.html` using only details from your posters — name, phone numbers, owner, Mumbai, areas served. **No street address was added**; add one there and in `mapLocation` when you want it shown.
* Clean URLs (`/fleet`, `/packages`, `/fare-calculator` …), `robots.txt`, `sitemap.xml`, image alt text, share image (`public/og-image.png`)
* Target phrases used in page copy: Narayan Tours and Travels, car rental in Maharashtra, outstation car rental, Mumbai to Pune cab, Mumbai to Shirdi taxi, Konkan tour packages, Maharashtra pilgrimage tours, Dzire / Ertiga car rental, affordable family travel.

After going live, add the site to **Google Search Console** and your **Google Business Profile**.

---

## 6. Project structure

```
api/                  ← Vercel server functions: route + fare (/api/quote), bookings, admin
lib/booking/          ← fare calculation, validation, WhatsApp message (shared by browser and server)
lib/server/           ← Google Routes, Supabase, admin login check (server only)
supabase/schema.sql   ← database tables (run once in Supabase)
tests/                ← automated tests: npm test
src/
  booking/            ← booking page, Google Maps search + map, fare breakdown, confirmation
  admin/              ← admin dashboard (pricing, bookings, business settings)
  config/site.js      ← business details, prices, packages, routes, testimonials
  data/content.js     ← services, destinations, FAQ, gallery
  lib/utils.js        ← fare formula, WhatsApp link, validation helpers
  components/         ← Layout (header/footer/floating buttons), cards, forms, art, packages
  pages/              ← one file per page
public/images/        ← logo, car and destination photos
```
