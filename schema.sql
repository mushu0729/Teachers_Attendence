-- Run this whole file once in Supabase Dashboard -> SQL Editor -> New query -> Run

create table if not exists teachers (
  kgid text primary key,
  name text not null
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  kgid text not null references teachers(kgid),
  name text not null,
  date date not null,
  marked_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  distance_meters double precision not null,
  photo_url text not null,
  unique(kgid, date)
);

create table if not exists settings (
  id int primary key default 1,
  start_time time not null default '08:00',
  end_time time not null default '17:00'
);

insert into settings (id, start_time, end_time)
values (1, '08:00', '17:00')
on conflict (id) do nothing;

-- Note: Row Level Security is left OFF on purpose.
-- All reads/writes happen through Next.js API routes using the
-- SERVICE ROLE key on the server; the browser never talks to
-- Supabase directly, so RLS is not required for this setup.
