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

A price change in `site.js` updates the fleet cards, fare calculator, booking form and footer together.

**Photos:** the current photos were cut from your posters. For sharper pictures, take real photos of your cars and trips, put them in `public/images/fleet/` or `public/images/destinations/`, and update the file names in `site.js` / `content.js`. Landscape photos about 1200 px wide work best.

---

## 4. How booking works (important)

* The **Book Now** form checks every required field, shows a booking summary and opens **WhatsApp** with the full request addressed to **+91 99674 56323**. The customer taps *Send*.
* The site clearly says the trip is **not confirmed** until the owner replies.
* The **contact form** works the same way (sends via WhatsApp).
* **Nothing is stored on a server** — no database is configured, and the site never claims otherwise.

### Optional: saving bookings in a database

If you later want every booking saved (to see a list, export to Excel, etc.), the simplest options are:

* **Supabase** (free tier) — create a `bookings` table and insert the form data from `BookingForm` in `src/components/Forms.jsx` before opening WhatsApp. Use the public "anon" key with a row-level-security rule that only allows inserts.
* **Firebase Firestore** — same idea with `addDoc(collection(db, 'bookings'), data)`.
* **Google Sheets** via Google Apps Script — easiest to read for non-technical owners.

Keep WhatsApp as the confirmation step either way.

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
src/
  config/site.js      ← business details, prices, packages, routes, testimonials
  data/content.js     ← services, destinations, FAQ, gallery
  lib/utils.js        ← fare formula, WhatsApp link, validation helpers
  components/         ← Layout (header/footer/floating buttons), cards, forms, art, packages
  pages/              ← one file per page
public/images/        ← logo, car and destination photos
```
