-- 0001_create_events.sql
-- Creates the public.events table, supporting indexes, an updated_at trigger,
-- and a public-read RLS policy. Mutations are expected to go through the
-- service_role key (which bypasses RLS).

create extension if not exists "pgcrypto";

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  source text not null,                    -- 'devfolio', 'devpost', 'luma', 'instagram', 'manual', etc.
  source_url text not null,
  poster_url text,
  poster_aspect_ratio numeric default 0.8,
  start_date timestamptz,
  end_date timestamptz,
  registration_deadline timestamptz,
  location_text text,                      -- "IIIT-B Campus, Bangalore"
  city text,                               -- normalized: "Bangalore"
  is_online boolean default false,
  latitude numeric,
  longitude numeric,
  tags text[] default '{}',                -- ['ai-ml', 'web3', ...]
  prize_pool_text text,                    -- free-form because formats vary
  organizer text,
  content_hash text not null unique,       -- for dedup across scraper runs
  raw_payload jsonb,                       -- original scraped data for debugging
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index events_start_date_idx on public.events (start_date);
create index events_registration_deadline_idx on public.events (registration_deadline);
create index events_tags_idx on public.events using gin (tags);
create index events_city_idx on public.events (city);

-- Auto-update updated_at on row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

-- Row Level Security: events are publicly readable; mutations only via service_role.
alter table public.events enable row level security;

create policy "Events are viewable by everyone"
on public.events
for select
to anon, authenticated
using (true);
