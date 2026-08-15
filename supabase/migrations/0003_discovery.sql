-- Discovery: taste compatibility and distance in one indexed query.
--
-- The scoring mirrors src/lib/match.ts so the client and the database agree:
-- rank-weighted artist overlap dominates, genre overlap broadens, exact track
-- overlap is the rare bonus, and the raw ratio is mapped onto 42–99.

-- Rank weight decays 1, 1/2, 1/3 … so a shared #1 counts far more than a #5.
create or replace function public.rank_weight(rank int) returns numeric
language sql immutable as $$
  select 1.0 / (rank + 1);
$$;

create or replace function public.taste_score(a uuid, b uuid) returns int
language sql stable security definer set search_path = public as $$
with
artist_hit as (
  select coalesce(sum(sqrt(public.rank_weight(x.rank) * public.rank_weight(y.rank))), 0) as v
  from public.top_artists x
  join public.top_artists y on y.artist_id = x.artist_id and y.profile_id = b
  where x.profile_id = a
),
artist_total as (
  select sqrt(
    coalesce((select sum(public.rank_weight(rank)) from public.top_artists where profile_id = a), 0) *
    coalesce((select sum(public.rank_weight(rank)) from public.top_artists where profile_id = b), 0)
  ) as v
),
track_hit as (
  select coalesce(sum(sqrt(public.rank_weight(x.rank) * public.rank_weight(y.rank))), 0) as v
  from public.top_tracks x
  join public.top_tracks y on y.track_id = x.track_id and y.profile_id = b
  where x.profile_id = a
),
track_total as (
  select sqrt(
    coalesce((select sum(public.rank_weight(rank)) from public.top_tracks where profile_id = a), 0) *
    coalesce((select sum(public.rank_weight(rank)) from public.top_tracks where profile_id = b), 0)
  ) as v
),
genres as (
  select
    (select array_agg(distinct g) from public.top_artists, unnest(genres) g where profile_id = a) as ga,
    (select array_agg(distinct g) from public.top_artists, unnest(genres) g where profile_id = b) as gb
),
genre_ratio as (
  select case
    when ga is null or gb is null then 0
    when cardinality(ga || gb) = 0 then 0
    else (
      select count(*)::numeric from (select unnest(ga) intersect select unnest(gb)) s
    ) / (
      select count(*)::numeric from (select unnest(ga) union select unnest(gb)) s
    )
  end as v
  from genres
)
select least(99, round(
  42 + 72 * (
    0.55 * case when (select v from artist_total) = 0 then 0
                else (select v from artist_hit) / (select v from artist_total) end
  + 0.27 * (select v from genre_ratio)
  + 0.18 * case when (select v from track_total) = 0 then 0
                else (select v from track_hit) / (select v from track_total) end
  )
))::int;
$$;

/*
  Candidates for the swipe deck.

  max_distance_km null means "anywhere" — profiles without a location are only
  included in that case, because a distance filter cannot honestly be applied
  to a profile whose position is unknown.
*/
create or replace function public.discover_candidates(
  max_distance_km numeric default null,
  min_score int default 0,
  max_results int default 25
)
returns table (
  profile_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  birth_year int,
  distance_km numeric,
  score int,
  last_seen_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with me as (select id, location from public.profiles where id = auth.uid())
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.city,
    p.birth_year,
    case
      when me.location is null or p.location is null then null
      else round((st_distance(me.location, p.location) / 1000)::numeric, 1)
    end as distance_km,
    public.taste_score(auth.uid(), p.id) as score,
    p.last_seen_at
  from public.profiles p, me
  where p.id <> auth.uid()
    and not public.is_blocked(p.id)
    and not exists (
      select 1 from public.swipes s where s.actor_id = auth.uid() and s.target_id = p.id
    )
    and (
      max_distance_km is null
      or (
        me.location is not null
        and p.location is not null
        and st_dwithin(me.location, p.location, max_distance_km * 1000)
      )
    )
    and public.taste_score(auth.uid(), p.id) >= min_score
  order by score desc, distance_km asc nulls last, p.last_seen_at desc
  limit max_results;
$$;

/*
  People on the same track right now, for the live board.

  `within_minutes` is what makes it "now": a now_playing row that has not been
  refreshed recently is stale presence, not a live listener.
*/
create or replace function public.listening_now(
  target_track_id text,
  max_distance_km numeric default null,
  within_minutes int default 15,
  max_results int default 25
)
returns table (
  profile_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  distance_km numeric,
  score int,
  started_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with me as (select id, location from public.profiles where id = auth.uid())
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.city,
    case
      when me.location is null or p.location is null then null
      else round((st_distance(me.location, p.location) / 1000)::numeric, 1)
    end as distance_km,
    public.taste_score(auth.uid(), p.id) as score,
    np.updated_at
  from public.now_playing np
  join public.profiles p on p.id = np.profile_id
  cross join me
  where np.track_id = target_track_id
    and np.is_playing
    and np.updated_at > now() - make_interval(mins => within_minutes)
    and p.id <> auth.uid()
    and not public.is_blocked(p.id)
    and not exists (
      select 1 from public.swipes s where s.actor_id = auth.uid() and s.target_id = p.id
    )
    and (
      max_distance_km is null
      or (
        me.location is not null
        and p.location is not null
        and st_dwithin(me.location, p.location, max_distance_km * 1000)
      )
    )
  order by score desc, distance_km asc nulls last
  limit max_results;
$$;

-- Writing your own coordinates without handing the raw point to the client.
create or replace function public.set_my_location(lat double precision, lng double precision)
returns void
language sql security definer set search_path = public as $$
  update public.profiles
  set location = st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      location_updated_at = now()
  where id = auth.uid();
$$;

create or replace function public.clear_my_location() returns void
language sql security definer set search_path = public as $$
  update public.profiles
  set location = null, location_updated_at = null
  where id = auth.uid();
$$;
