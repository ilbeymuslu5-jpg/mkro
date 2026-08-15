-- makromusic — initial schema
--
-- Covers: profiles fed from Spotify, taste (top artists/tracks), presence,
-- swipes and matches, the social feed, chat messages, blocks and reports.
--
-- Distance filtering uses PostGIS geography so a radius query is a single
-- indexed predicate rather than a client-side scan.

create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- profiles --

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  spotify_id text unique not null,
  display_name text not null,
  avatar_url text,
  bio text default '' not null,
  birth_year int check (birth_year between 1900 and extract(year from now())::int - 13),
  city text,
  -- WGS84 point. Null until the user grants geolocation.
  location geography(Point, 4326),
  location_updated_at timestamptz,
  plan text not null default 'free' check (plan in ('free', 'platinum')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index profiles_location_idx on public.profiles using gist (location);
create index profiles_last_seen_idx on public.profiles (last_seen_at desc);

-- ------------------------------------------------------------------- taste --

-- Spotify ids are the source of truth; name/image are cached for rendering
-- so the feed does not need a Spotify call per row.
create table public.top_artists (
  profile_id uuid not null references public.profiles on delete cascade,
  artist_id text not null,
  name text not null,
  image_url text,
  genres text[] not null default '{}',
  rank int not null check (rank >= 0),
  primary key (profile_id, artist_id)
);

create index top_artists_artist_idx on public.top_artists (artist_id);

create table public.top_tracks (
  profile_id uuid not null references public.profiles on delete cascade,
  track_id text not null,
  name text not null,
  artist_name text not null,
  artist_id text not null,
  image_url text,
  duration_ms int,
  rank int not null check (rank >= 0),
  primary key (profile_id, track_id)
);

create index top_tracks_track_idx on public.top_tracks (track_id);

create table public.now_playing (
  profile_id uuid primary key references public.profiles on delete cascade,
  track_id text not null,
  name text not null,
  artist_name text not null,
  image_url text,
  is_playing boolean not null default true,
  updated_at timestamptz not null default now()
);

create index now_playing_track_idx on public.now_playing (track_id, updated_at desc);

-- --------------------------------------------------------- swipes, matches --

create table public.swipes (
  actor_id uuid not null references public.profiles on delete cascade,
  target_id uuid not null references public.profiles on delete cascade,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id),
  constraint swipes_no_self check (actor_id <> target_id)
);

-- One row per pair, with the ids ordered so the pair is unique either way.
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_a uuid not null references public.profiles on delete cascade,
  profile_b uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_ordered check (profile_a < profile_b),
  unique (profile_a, profile_b)
);

create index matches_a_idx on public.matches (profile_a);
create index matches_b_idx on public.matches (profile_b);

-- A mutual like creates the match row. Doing it in a trigger keeps the rule
-- on the server, where a client cannot skip it.
create or replace function public.handle_swipe() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  reciprocated boolean;
begin
  if new.direction <> 'like' then
    return new;
  end if;

  select exists (
    select 1 from public.swipes
    where actor_id = new.target_id and target_id = new.actor_id and direction = 'like'
  ) into reciprocated;

  if reciprocated then
    insert into public.matches (profile_a, profile_b)
    values (least(new.actor_id, new.target_id), greatest(new.actor_id, new.target_id))
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger swipes_create_match
  after insert or update on public.swipes
  for each row execute function public.handle_swipe();

-- ------------------------------------------------------------------- feed --

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  track_id text not null,
  track_name text not null,
  artist_name text not null,
  image_url text,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id);

create table public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index post_comments_post_idx on public.post_comments (post_id, created_at);

-- ------------------------------------------------------------------- chat --

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  body text check (char_length(body) between 1 and 2000),
  -- A shared Spotify track, or a track generated for the pair.
  track_id text,
  track_name text,
  artist_name text,
  generated jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_has_content check (
    body is not null or track_id is not null or generated is not null
  )
);

create index messages_match_idx on public.messages (match_id, created_at);

-- --------------------------------------------------- blocks and moderation --

create table public.blocks (
  blocker_id uuid not null references public.profiles on delete cascade,
  blocked_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles on delete set null,
  reported_id uuid not null references public.profiles on delete cascade,
  reason text not null check (
    reason in ('harassment', 'spam', 'fake_profile', 'inappropriate_content', 'other')
  ),
  detail text check (char_length(detail) <= 1000),
  -- Optional pointer to what was reported.
  context_type text check (context_type in ('profile', 'post', 'message')),
  context_id uuid,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now(),
  constraint reports_no_self check (reporter_id <> reported_id)
);

create index reports_status_idx on public.reports (status, created_at desc);
create unique index reports_one_open_per_pair
  on public.reports (reporter_id, reported_id, context_type, context_id)
  where status <> 'closed';

-- ------------------------------------------------------------------ realtime --

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_comments;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.now_playing;
