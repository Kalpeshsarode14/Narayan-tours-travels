# NTT Travel: Google Maps Booking & Automatic Fare System

What this adds to **ntt-travel.vercel.app**:

- **/book**: the customer picks exact pickup, stops and drop-off from Google Maps suggestions. The route appears on a live map, and the full fare breakdown updates instantly when anything changes.
- **/book/confirmation**: shows the saved booking with its booking ID, route map, locked fare breakdown, and a **Send on WhatsApp** button.
- **/admin**: password-protected dashboard to edit all pricing, view and update bookings, and set the WhatsApp number.
- **/api/\***: Vercel serverless functions. The route distance and the final fare are always recalculated on the server before a booking is saved.

> **Status:** The code is merged into this site and tested: 19 automated tests, plus browser tests of the real site pages on phone and desktop with Google and Supabase simulated. Online booking will **not** work on the live site until you complete steps 1–4 below (API keys, database, environment variables). Until then, `/book` automatically shows the previous WhatsApp request form.

---

## 1. Google Maps Platform (about 15 minutes)

1. Go to <https://console.cloud.google.com/> and create a project (e.g. `ntt-travel`). **Enable billing.** Google requires it even within the free usage.
2. **APIs & Services → Library**. Enable these three:
   - **Maps JavaScript API** (the map)
   - **Places API (New)** (location search). Make sure it's the "(New)" one.
   - **Routes API** (distance, travel time, tolls)
3. **APIs & Services → Credentials → Create credentials → API key**. Create **two keys**:

   | Key | Application restriction | API restriction | Where it goes |
   |---|---|---|---|
   | **Browser key** | *Websites*: `https://ntt-travel.vercel.app/*`, `https://ntt-travel-*.vercel.app/*` (previews), your custom domain if any (`https://www.yourdomain.com/*`), and `http://localhost:5173/*` for local testing | Maps JavaScript API, Places API (New) | `VITE_GOOGLE_MAPS_BROWSER_KEY` |
   | **Server key** | *None*. Vercel has no fixed IP address, so this key is protected by staying secret on the server | **Routes API only** | `GOOGLE_MAPS_SERVER_KEY` (never prefix with `VITE_`) |

4. **Map ID** (needed for the modern map markers): **Google Maps Platform → Map management → Create Map ID**. Choose type *JavaScript*, *Vector*. Copy the ID into `VITE_GOOGLE_MAPS_MAP_ID`.
5. **Quotas (protects your bill).** Go to **APIs & Services → each API → Quotas & system limits** and set per-day caps. Sensible starting values for a small cab business:
   - Routes API, *Compute Routes requests per day*: **1,000**
   - Places API (New), *Autocomplete requests per day*: **5,000**; *Place Details requests per day*: **2,000**
   - Maps JavaScript API, *Map loads per day*: **3,000**
6. **Billing → Budgets & alerts**: add a monthly budget (e.g. ₹2,000) with email alerts at 50/90/100%.

**Cost notes**
- Each search uses one autocomplete *session* (a session token is reused for typing and then the selection).
- Routes are cached in the database for 24 hours. Changing vehicle, trip type, date or add-ons does **not** call Google again, and the booking reuses the preview's route.
- Toll estimates (`TOLLS`) are billed at a higher Routes tier. To turn them off, set `GOOGLE_ROUTES_TOLLS=off` in Vercel. In Admin → Charges → Tolls, pick either "Estimate at ₹ per km" or "Not included, customer pays at actuals".
- Check current prices at <https://mapsplatform.google.com/pricing/>.
- **Verify tolls once:** after setup, get a quote for Mumbai CSMT → Pune Station (Expressway). Compare the toll line with what you actually pay. If Google's figure is off for your routes, switch to "₹ per km".

## 2. Supabase database (about 10 minutes)

1. Create a project at <https://supabase.com> (region **Mumbai / ap-south-1**). Save the database password somewhere safe.
2. **SQL Editor → New query**. Paste the whole of `supabase/schema.sql` and click **Run**.
3. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up". Only you create admin logins.
4. **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick *Auto confirm user*.
5. Back in the **SQL Editor**, make that user an admin:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'YOUR-EMAIL@example.com';
   ```
6. **Project Settings → API**. You'll need:
   - Project URL → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - `anon` / publishable key → `VITE_SUPABASE_ANON_KEY` (safe in the browser; it can't read any table)
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**server only, never put it in a `VITE_` variable or commit it**)

Every table has Row Level Security on with no public policies, so the browser can't touch the database directly. A database trigger also stops anyone from changing a booking's fare after it is saved.

## 3. Vercel environment variables

**Vercel → Project → Settings → Environment Variables** (tick Production and Preview):

| Name | Value | Visible to browser? |
|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **No, secret** |
| `GOOGLE_MAPS_SERVER_KEY` | Server key (Routes API) | **No, secret** |
| `GOOGLE_ROUTES_TOLLS` | `on` (default) or `off` | No |
| `VITE_GOOGLE_MAPS_BROWSER_KEY` | Browser key (referrer-restricted) | Yes |
| `VITE_GOOGLE_MAPS_MAP_ID` | Map ID from step 1.4 | Yes |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes |
| `VITE_SUPABASE_ANON_KEY` | anon key | Yes |

For local development, copy `.env.example` to `.env.local` and fill it in (`.env.local` is git-ignored; never commit it). Note: `npm run dev` (Vite) serves the pages but not the `/api` functions. To test bookings locally, run `npx vercel dev` instead.

Then **redeploy**. Vite bakes the `VITE_` values into the build.

**Recommended:** **Vercel → Firewall → Rules → Rate limit**. Add 30 requests/minute per IP for `/api/quote` and 5 requests/10 minutes per IP for `/api/bookings`. The code has its own per-instance limiter too, but Vercel's rule is global.

## 4. First login and pricing

1. Open `https://ntt-travel.vercel.app/admin` and sign in.
2. **Pricing**: the starting values are your current website rates (Dzire ₹14/km, Ertiga ₹17/km), plus typical defaults for everything else. **Review every number**, use **Test your pricing** at the bottom, then click **Save & publish**. New quotes use it immediately. Existing bookings keep the fare they were booked at.
3. **Business settings**: check the WhatsApp number (default `919967456323`, your listed phone number), business name and contact phone.

---

## How the fare is calculated

`Total = trip fare + driver allowance + tolls + stops + parking + night + waiting + add-ons`, raised to the minimum fare if lower, plus GST if enabled. Each part can be switched on or off in Admin.

| Trip type | Trip fare |
|---|---|
| One way | base + max(route km, min km) × ₹/km |
| Round trip | base + max(route km × 2, min km/day × days) × ₹/km; driver allowance × days; tolls × 2 |
| Local | package price + extra km × rate + extra hours × rate |
| Airport | fixed fare (includes N km) + km beyond N × rate + airport parking |

The browser and the server use the **same calculation file** (`lib/booking/fare-engine.ts`). The browser shows it instantly. The server recalculates it from the Google route and the database pricing when the customer books, and rejects the booking if the totals differ by more than 50 paise. A fare edited in browser dev tools is therefore refused (tested).

## What changed in the existing site

| File | Change |
|---|---|
| `src/pages/Book.jsx` | Now shows the Google Maps booking system. Falls back to the old WhatsApp form if the booking service isn't configured. |
| `src/pages/BookingConfirmation.jsx` | New: `/book/confirmation` |
| `src/App.jsx` | Added `/book/confirmation` and `/admin` routes. The admin code is loaded only when `/admin` is opened. |
| `src/components/Layout.jsx` | Floating Call/WhatsApp buttons get a class `ntt-fabs`, so on phones the booking page can hide them (its fare bar has its own Call button). |
| `src/pages/FarePage.jsx` | Banner linking to `/book` for the exact fare. |
| `vercel.json` | The page rewrite no longer catches `/api/…` |
| `package.json` | `npm test`, plus dev tools for it (`tsx`, `typescript`, `@types/node`). No new runtime packages. |
| `.gitignore` | Also ignores `.env.local` so keys are never committed. |

Existing links keep working: `/book?vehicle=ertiga`, `/book?tripType=round`, `/book?destination=Shirdi` (pre-fills the search so the customer picks the exact place), and `/book?service=…` (shown on the form and copied into special requirements).

**Prices in two places:** marketing pages (fleet cards, quick fare calculator, SEO text) still read `ratePerKm` from `src/config/site.js`. Real bookings use the admin pricing. When you change a rate in `/admin`, also update `site.js`.

## Files

```
api/                         Vercel serverless functions
  booking-config.ts  GET     public pricing + business info
  quote.ts           POST    Google route (server key) + fare
  bookings.ts        POST    validate → recalculate → save → booking ID
  booking.ts         GET     confirmation data (needs id + secret token)
  admin/pricing.ts   GET/PUT
  admin/bookings.ts  GET/PATCH
  admin/settings.ts  GET/PUT
lib/booking/                 shared, browser-safe: fare-engine, types, default-pricing, validation, whatsapp
lib/server/                  server only: handlers, google-routes, pricing-store, supabase, http
src/booking/                 BookingPage, ConfirmationPage, PlaceInput, RouteMap, FareSummary, booking.css
src/admin/                   AdminApp, PricingEditor, BookingsTable, SettingsForm, auth, admin.css
supabase/schema.sql
tests/                       npm test
```
