-- Row level security.
--
-- The rule that shapes almost everything here: a block hides both directions.
-- If either side blocked the other, neither sees the other's rows.

alter table public.profiles enable row level security;
alter table public.top_artists enable row level security;
alter table public.top_tracks enable row level security;
alter table public.now_playing enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_blocked(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other and blocked_id = auth.uid())
  );
$$;

-- Membership of a match, used by the chat policies.
create or replace function public.in_match(match uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches
    where id = match and (profile_a = auth.uid() or profile_b = auth.uid())
  );
$$;

-- ---------------------------------------------------------------- profiles --

create policy "profiles are readable unless blocked"
  on public.profiles for select
  using (id = auth.uid() or not public.is_blocked(id));

create policy "own profile insert"
  on public.profiles for insert with check (id = auth.uid());

create policy "own profile update"
  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "own profile delete"
  on public.profiles for delete using (id = auth.uid());

-- ------------------------------------------------------------------- taste --

create policy "taste readable unless blocked"
  on public.top_artists for select
  using (profile_id = auth.uid() or not public.is_blocked(profile_id));

create policy "own top artists write"
  on public.top_artists for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "tracks readable unless blocked"
  on public.top_tracks for select
  using (profile_id = auth.uid() or not public.is_blocked(profile_id));

create policy "own top tracks write"
  on public.top_tracks for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "now playing readable unless blocked"
  on public.now_playing for select
  using (profile_id = auth.uid() or not public.is_blocked(profile_id));

create policy "own now playing write"
  on public.now_playing for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- --------------------------------------------------------- swipes, matches --

-- Deliberately no select policy for other people's swipes: who liked you is
-- paid information, exposed only through the matches table.
create policy "own swipes readable"
  on public.swipes for select using (actor_id = auth.uid());

create policy "own swipes write"
  on public.swipes for insert with check (actor_id = auth.uid() and not public.is_blocked(target_id));

create policy "own swipes update"
  on public.swipes for update using (actor_id = auth.uid()) with check (actor_id = auth.uid());

create policy "matches readable by members"
  on public.matches for select
  using (profile_a = auth.uid() or profile_b = auth.uid());

-- Matches are only ever created by the swipe trigger.

-- ------------------------------------------------------------------- feed --

create policy "posts readable unless blocked"
  on public.posts for select using (not public.is_blocked(author_id));

create policy "own posts write"
  on public.posts for insert with check (author_id = auth.uid());

create policy "own posts delete"
  on public.posts for delete using (author_id = auth.uid());

create policy "likes readable unless blocked"
  on public.post_likes for select using (not public.is_blocked(profile_id));

create policy "own likes write"
  on public.post_likes for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "comments readable unless blocked"
  on public.post_comments for select using (not public.is_blocked(author_id));

create policy "own comments write"
  on public.post_comments for insert with check (author_id = auth.uid());

create policy "own comments delete"
  on public.post_comments for delete using (author_id = auth.uid());

-- ------------------------------------------------------------------- chat --

create policy "messages readable by match members"
  on public.messages for select using (public.in_match(match_id));

create policy "messages sent by match members"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.in_match(match_id));

create policy "mark messages read"
  on public.messages for update using (public.in_match(match_id)) with check (public.in_match(match_id));

-- ------------------------------------------------------- blocks and reports --

create policy "own blocks readable"
  on public.blocks for select using (blocker_id = auth.uid());

create policy "own blocks write"
  on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- A reporter may file and see their own reports. Nobody sees reports filed
-- against them, and only the service role can triage.
create policy "own reports readable"
  on public.reports for select using (reporter_id = auth.uid());

create policy "file a report"
  on public.reports for insert with check (reporter_id = auth.uid());
