-- Lucy's Art Castle engagement storage
-- Run this in the Supabase SQL editor for the project used by the Vercel preview.

create extension if not exists pgcrypto;

create table if not exists public.art_likes (
  id uuid primary key default gen_random_uuid(),
  artwork_id text not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  constraint art_likes_artwork_check check (artwork_id in ('eeveely', 'red-kite-emily', 'chloe-red', 'red')),
  constraint art_likes_unique_visitor unique (artwork_id, visitor_id)
);

create table if not exists public.art_comments (
  id uuid primary key default gen_random_uuid(),
  artwork_id text not null,
  visitor_name text not null check (char_length(visitor_name) between 1 and 40),
  comment text not null check (char_length(comment) between 2 and 500),
  created_at timestamptz not null default now(),
  constraint art_comments_artwork_check check (artwork_id in ('eeveely', 'red-kite-emily', 'chloe-red', 'red'))
);

create index if not exists art_likes_artwork_idx on public.art_likes (artwork_id);
create index if not exists art_comments_created_idx on public.art_comments (created_at desc);
create index if not exists art_comments_artwork_idx on public.art_comments (artwork_id);

alter table public.art_likes enable row level security;
alter table public.art_comments enable row level security;

-- No public policies are intentionally created. The browser cannot read comments
-- or write directly to either table. All access goes through same-origin Vercel
-- functions using the service-role key, which stays server-side.
