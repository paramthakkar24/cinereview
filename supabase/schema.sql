-- =============================================================================
-- CineReview — Supabase schema (Phase 0)
-- -----------------------------------------------------------------------------
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query →
-- paste → Run). It is safe to re-run: every statement is guarded with
-- "if not exists" / "or replace" / "drop policy if exists".
--
-- Creates three tables — profiles, ratings, comments — plus Row-Level Security
-- (RLS) policies and a trigger that gives every new auth user a profile row.
--
-- Security model:
--   * Anyone (even logged-out) may READ ratings, comments, and profiles.
--   * Only an authenticated user may INSERT, and only as themselves.
--   * A user may UPDATE / DELETE only their OWN rows.
--   * Rating score is constrained to an integer 1..10.
--   * One rating per user per movie (re-rating UPDATEs the existing row).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. profiles — one row per user, created automatically on signup
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  username    text        not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 2. ratings — one score (1..10) per user per movie
-- -----------------------------------------------------------------------------
create table if not exists public.ratings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  movie_id    text        not null,
  score       integer     not null check (score between 1 and 10),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, movie_id)
);

create index if not exists ratings_movie_id_idx on public.ratings (movie_id);

alter table public.ratings enable row level security;

drop policy if exists "ratings are readable by everyone" on public.ratings;
create policy "ratings are readable by everyone"
  on public.ratings for select
  using (true);

drop policy if exists "users can insert their own rating" on public.ratings;
create policy "users can insert their own rating"
  on public.ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update their own rating" on public.ratings;
create policy "users can update their own rating"
  on public.ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own rating" on public.ratings;
create policy "users can delete their own rating"
  on public.ratings for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 3. comments — feedback per movie (length-limited at the DB level)
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  movie_id    text        not null,
  body        text        not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_movie_id_idx on public.comments (movie_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "comments are readable by everyone" on public.comments;
create policy "comments are readable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "users can insert their own comment" on public.comments;
create policy "users can insert their own comment"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update their own comment" on public.comments;
create policy "users can update their own comment"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own comment" on public.comments;
create policy "users can delete their own comment"
  on public.comments for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 4. keep ratings.updated_at fresh on every update
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ratings_touch_updated_at on public.ratings;
create trigger ratings_touch_updated_at
  before update on public.ratings
  for each row execute function public.touch_updated_at();


-- -----------------------------------------------------------------------------
-- 5. auto-create a profile when a new auth user signs up
--    display name comes from signup metadata (data.username / full_name),
--    falling back to the email local-part, then a short id-based name.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user_' || left(new.id::text, 8)
  );

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    display_name,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 6. convenience view — per-movie average user score + vote count
--    (read-only aggregate the frontend can query directly)
-- -----------------------------------------------------------------------------
create or replace view public.movie_rating_stats as
  select
    movie_id,
    round(avg(score)::numeric, 1) as average_score,
    count(*)                      as vote_count
  from public.ratings
  group by movie_id;

-- -----------------------------------------------------------------------------
-- 7. watchlist — films a user saved to watch later (private to each user)
--    Denormalised (title/poster/year stored) so the watchlist page renders
--    without re-calling TMDB.
-- -----------------------------------------------------------------------------
create table if not exists public.watchlist (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  movie_id    text        not null,
  title       text        not null,
  poster      text,
  year        integer,
  created_at  timestamptz not null default now(),
  unique (user_id, movie_id)
);

create index if not exists watchlist_user_idx on public.watchlist (user_id, created_at desc);

alter table public.watchlist enable row level security;

-- Watchlists are private: a user can only see and change their own rows.
drop policy if exists "users can read their own watchlist" on public.watchlist;
create policy "users can read their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert into their own watchlist" on public.watchlist;
create policy "users can insert into their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete from their own watchlist" on public.watchlist;
create policy "users can delete from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);


-- Done. Verify in Dashboard → Table Editor that profiles / ratings / comments /
-- watchlist exist and each shows "RLS enabled".
