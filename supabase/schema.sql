-- NTT Travel booking system: Supabase schema
-- Run once in Supabase Dashboard → SQL Editor. Safe to re-run.
--
-- Security model: Row Level Security is ON for every table and NO public policies exist,
-- so the browser's anon key cannot read or write anything. All reads and writes go through
-- the Vercel API functions, which use the service-role key on the server only.

create extension if not exists pgcrypto;

-- ── Admins ──────────────────────────────────────────────────────────────────
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- ── Pricing (append-only versions; the newest row is the active pricing) ────
create table if not exists public.pricing_versions (
  id         bigserial primary key,
  config     jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
alter table public.pricing_versions enable row level security;

-- ── Business settings (single row) ──────────────────────────────────────────
create table if not exists public.site_settings (
  id               int primary key default 1 check (id = 1),
  business_name    text not null default 'Narayan Tours & Travels',
  whatsapp_number  text not null default '919967456323',
  contact_phone    text not null default '+91 99674 56323',
  contact_email    text not null default '',
  updated_at       timestamptz not null default now()
);
alter table public.site_settings enable row level security;
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ── Route cache (so the preview and the booking use the same Google route) ──
create table if not exists public.route_cache (
  key        text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.route_cache enable row level security;

-- ── Bookings ────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id                   uuid primary key default gen_random_uuid(),
  booking_code         text not null unique,               -- e.g. NTT-261210-7KQ4M
  access_token         uuid not null default gen_random_uuid(), -- needed to view the confirmation page
  status               text not null default 'pending'
                       check (status in ('pending','confirmed','assigned','completed','cancelled')),

  customer_name        text not null,
  customer_mobile      text not null,
  customer_email       text not null,
  passengers           int  not null check (passengers between 1 and 60),
  special_requirements text not null default '',

  trip_type            text not null check (trip_type in ('one_way','round_trip','local','airport')),
  vehicle_id           text not null,
  vehicle_name         text not null,
  local_package_id     text,
  extra_ids            text[] not null default '{}',
  waiting_minutes      int not null default 0,

  pickup_place_id      text not null,
  pickup_name          text not null default '',
  pickup_address       text not null,
  pickup_lat           double precision not null,
  pickup_lng           double precision not null,
  drop_place_id        text not null,
  drop_name            text not null default '',
  drop_address         text not null,
  drop_lat             double precision not null,
  drop_lng             double precision not null,
  stops                jsonb not null default '[]',        -- [{placeId,name,address,location:{lat,lng}}]

  pickup_date          date not null,
  pickup_time          time not null,
  return_date          date,

  route_distance_m     int not null,
  route_km             numeric(8,1) not null,
  duration_minutes     int not null,
  route_polyline       text,

  fare_breakdown       jsonb not null,                     -- snapshot; never recalculated
  final_fare           numeric(10,2) not null,
  pricing_version      bigint references public.pricing_versions(id),

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_pickup_date_idx on public.bookings (pickup_date);
create index if not exists bookings_status_idx on public.bookings (status);
alter table public.bookings enable row level security;

-- Keep a booking's fare fixed after creation, even if someone with DB access edits the row.
create or replace function public.bookings_protect_fare() returns trigger language plpgsql as $$
begin
  if new.final_fare is distinct from old.final_fare
     or new.fare_breakdown is distinct from old.fare_breakdown then
    raise exception 'Booked fare cannot be changed';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists bookings_protect_fare on public.bookings;
create trigger bookings_protect_fare before update on public.bookings
  for each row execute function public.bookings_protect_fare();

-- Revoke direct table access from browser roles (RLS already blocks it; this is belt-and-braces).
revoke all on public.admin_users, public.pricing_versions, public.site_settings,
              public.route_cache, public.bookings from anon, authenticated;

-- ── After creating your admin login in Authentication → Users, run: ─────────
-- insert into public.admin_users (user_id)
--   select id from auth.users where email = 'YOUR-ADMIN-EMAIL@example.com';
