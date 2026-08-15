/**
 * Supabase data access. Everything the app reads or writes goes through here,
 * so no component talks to the client directly.
 *
 * Reads deliberately do not re-filter blocked users: row level security drops
 * those rows server-side, which is the only place the rule cannot be bypassed.
 */
import type { RealtimeChannel } from '@supabase/supabase-js'
import { requireSupabase } from '@/lib/supabase'
import type { SpotifyArtist, SpotifyProfile, SpotifyTrack, NowPlaying } from './spotify'

// ------------------------------------------------------------------- types --

export interface Profile {
  id: string
  spotifyId: string
  displayName: string
  avatarUrl: string | null
  bio: string
  birthYear: number | null
  city: string | null
  plan: 'free' | 'platinum'
}

export interface Candidate {
  profileId: string
  displayName: string
  avatarUrl: string | null
  bio: string
  city: string | null
  birthYear: number | null
  /** Null when either side has no location on file. */
  distanceKm: number | null
  score: number
}

export interface FeedPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  trackId: string
  trackName: string
  artistName: string
  imageUrl: string | null
  body: string
  createdAt: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
}

export interface FeedComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  body: string
  createdAt: string
}

export interface Match {
  id: string
  otherId: string
  otherName: string
  otherAvatar: string | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  matchId: string
  senderId: string
  body: string | null
  trackId: string | null
  trackName: string | null
  artistName: string | null
  generated: { title: string; basedOn: string; mood: string; durationSec: number } | null
  createdAt: string
}

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'other'

// ---------------------------------------------------------------- profiles --

/** Creates the profile row on first sign-in, and refreshes it after that. */
export async function upsertProfile(
  userId: string,
  spotify: SpotifyProfile,
): Promise<Profile> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .upsert(
      {
        id: userId,
        spotify_id: spotify.id,
        display_name: spotify.displayName,
        avatar_url: spotify.imageUrl,
        city: spotify.country,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) throw error
  return toProfile(data)
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select()
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? toProfile(data) : null
}

export async function updateProfile(
  id: string,
  patch: { bio?: string; birthYear?: number | null; city?: string | null; plan?: Profile['plan'] },
): Promise<void> {
  const { error } = await requireSupabase()
    .from('profiles')
    .update({
      ...(patch.bio !== undefined && { bio: patch.bio }),
      ...(patch.birthYear !== undefined && { birth_year: patch.birthYear }),
      ...(patch.city !== undefined && { city: patch.city }),
      ...(patch.plan !== undefined && { plan: patch.plan }),
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteAccount(id: string): Promise<void> {
  // Every table cascades from profiles, so this removes the whole footprint.
  const { error } = await requireSupabase().from('profiles').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------- taste --

/** Replaces the stored taste snapshot with a fresh Spotify read. */
export async function syncTaste(
  userId: string,
  artists: SpotifyArtist[],
  tracks: SpotifyTrack[],
): Promise<void> {
  const client = requireSupabase()

  // Delete-then-insert: a plain upsert would leave artists the user has since
  // dropped out of their top list sitting in the table forever.
  const [artistDelete, trackDelete] = await Promise.all([
    client.from('top_artists').delete().eq('profile_id', userId),
    client.from('top_tracks').delete().eq('profile_id', userId),
  ])
  if (artistDelete.error) throw artistDelete.error
  if (trackDelete.error) throw trackDelete.error

  if (artists.length > 0) {
    const { error } = await client.from('top_artists').insert(
      artists.map((artist, rank) => ({
        profile_id: userId,
        artist_id: artist.id,
        name: artist.name,
        image_url: artist.imageUrl,
        genres: artist.genres,
        rank,
      })),
    )
    if (error) throw error
  }

  if (tracks.length > 0) {
    const { error } = await client.from('top_tracks').insert(
      tracks.map((track, rank) => ({
        profile_id: userId,
        track_id: track.id,
        name: track.name,
        artist_name: track.artistName,
        artist_id: track.artistId,
        image_url: track.imageUrl,
        duration_ms: track.durationMs,
        rank,
      })),
    )
    if (error) throw error
  }
}

export async function getTaste(profileId: string): Promise<{
  artists: { id: string; name: string; imageUrl: string | null; genres: string[] }[]
  tracks: { id: string; name: string; artistName: string; imageUrl: string | null }[]
}> {
  const client = requireSupabase()
  const [artists, tracks] = await Promise.all([
    client.from('top_artists').select().eq('profile_id', profileId).order('rank'),
    client.from('top_tracks').select().eq('profile_id', profileId).order('rank'),
  ])
  if (artists.error) throw artists.error
  if (tracks.error) throw tracks.error

  return {
    artists: (artists.data ?? []).map((row) => ({
      id: row.artist_id,
      name: row.name,
      imageUrl: row.image_url,
      genres: row.genres ?? [],
    })),
    tracks: (tracks.data ?? []).map((row) => ({
      id: row.track_id,
      name: row.name,
      artistName: row.artist_name,
      imageUrl: row.image_url,
    })),
  }
}

export async function publishNowPlaying(
  userId: string,
  playing: NowPlaying | null,
): Promise<void> {
  const client = requireSupabase()

  if (!playing) {
    const { error } = await client.from('now_playing').delete().eq('profile_id', userId)
    if (error) throw error
    return
  }

  const { error } = await client.from('now_playing').upsert({
    profile_id: userId,
    track_id: playing.trackId,
    name: playing.name,
    artist_name: playing.artistName,
    image_url: playing.imageUrl,
    is_playing: playing.isPlaying,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

// --------------------------------------------------------------- discovery --

/** Taste plus distance, ranked server-side. Null radius means anywhere. */
export async function discoverCandidates(options: {
  maxDistanceKm: number | null
  minScore?: number
  limit?: number
}): Promise<Candidate[]> {
  const { data, error } = await requireSupabase().rpc('discover_candidates', {
    max_distance_km: options.maxDistanceKm,
    min_score: options.minScore ?? 0,
    max_results: options.limit ?? 25,
  })
  if (error) throw error
  return (data ?? []).map(toCandidate)
}

/** People on the same track whose presence was refreshed recently. */
export async function listeningNow(
  trackId: string,
  options: { maxDistanceKm?: number | null; withinMinutes?: number; limit?: number } = {},
): Promise<Candidate[]> {
  const { data, error } = await requireSupabase().rpc('listening_now', {
    target_track_id: trackId,
    max_distance_km: options.maxDistanceKm ?? null,
    within_minutes: options.withinMinutes ?? 15,
    max_results: options.limit ?? 25,
  })
  if (error) throw error
  return (data ?? []).map(toCandidate)
}

export async function setLocation(lat: number, lng: number): Promise<void> {
  const { error } = await requireSupabase().rpc('set_my_location', { lat, lng })
  if (error) throw error
}

export async function clearLocation(): Promise<void> {
  const { error } = await requireSupabase().rpc('clear_my_location')
  if (error) throw error
}

// ------------------------------------------------------------------ swipes --

export async function swipe(targetId: string, direction: 'like' | 'pass'): Promise<void> {
  const client = requireSupabase()
  const { data: user } = await client.auth.getUser()
  if (!user.user) throw new Error('Oturum yok.')

  const { error } = await client
    .from('swipes')
    .upsert(
      { actor_id: user.user.id, target_id: targetId, direction },
      { onConflict: 'actor_id,target_id' },
    )
  if (error) throw error
}

export async function listMatches(userId: string): Promise<Match[]> {
  const { data, error } = await requireSupabase()
    .from('matches')
    .select(
      'id, created_at, profile_a, profile_b, a:profiles!matches_profile_a_fkey(id, display_name, avatar_url), b:profiles!matches_profile_b_fkey(id, display_name, avatar_url)',
    )
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, any>) => {
    const other = row.profile_a === userId ? row.b : row.a
    return {
      id: row.id,
      otherId: other?.id ?? '',
      otherName: other?.display_name ?? '',
      otherAvatar: other?.avatar_url ?? null,
      createdAt: row.created_at,
    }
  })
}

// -------------------------------------------------------------------- feed --

export async function listPosts(userId: string, limit = 50): Promise<FeedPost[]> {
  const { data, error } = await requireSupabase()
    .from('posts')
    .select(
      'id, author_id, track_id, track_name, artist_name, image_url, body, created_at, author:profiles!posts_author_id_fkey(display_name, avatar_url), post_likes(profile_id), post_comments(id)',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    authorId: row.author_id,
    authorName: row.author?.display_name ?? '',
    authorAvatar: row.author?.avatar_url ?? null,
    trackId: row.track_id,
    trackName: row.track_name,
    artistName: row.artist_name,
    imageUrl: row.image_url,
    body: row.body,
    createdAt: row.created_at,
    likeCount: row.post_likes?.length ?? 0,
    likedByMe: (row.post_likes ?? []).some((like: { profile_id: string }) => like.profile_id === userId),
    commentCount: row.post_comments?.length ?? 0,
  }))
}

export async function createPost(input: {
  authorId: string
  trackId: string
  trackName: string
  artistName: string
  imageUrl: string | null
  body: string
}): Promise<void> {
  const { error } = await requireSupabase().from('posts').insert({
    author_id: input.authorId,
    track_id: input.trackId,
    track_name: input.trackName,
    artist_name: input.artistName,
    image_url: input.imageUrl,
    body: input.body,
  })
  if (error) throw error
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await requireSupabase().from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function setLike(postId: string, userId: string, liked: boolean): Promise<void> {
  const client = requireSupabase()
  const { error } = liked
    ? await client.from('post_likes').upsert({ post_id: postId, profile_id: userId })
    : await client.from('post_likes').delete().eq('post_id', postId).eq('profile_id', userId)
  if (error) throw error
}

export async function listComments(postId: string): Promise<FeedComment[]> {
  const { data, error } = await requireSupabase()
    .from('post_comments')
    .select('id, post_id, author_id, body, created_at, author:profiles!post_comments_author_id_fkey(display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at')

  if (error) throw error

  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.author?.display_name ?? '',
    authorAvatar: row.author?.avatar_url ?? null,
    body: row.body,
    createdAt: row.created_at,
  }))
}

export async function addComment(postId: string, authorId: string, body: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('post_comments')
    .insert({ post_id: postId, author_id: authorId, body })
  if (error) throw error
}

// -------------------------------------------------------------------- chat --

export async function listMessages(matchId: string): Promise<ChatMessage[]> {
  const { data, error } = await requireSupabase()
    .from('messages')
    .select()
    .eq('match_id', matchId)
    .order('created_at')

  if (error) throw error
  return (data ?? []).map(toMessage)
}

export async function sendMessage(input: {
  matchId: string
  senderId: string
  body?: string
  track?: { id: string; name: string; artistName: string }
  generated?: ChatMessage['generated']
}): Promise<void> {
  const { error } = await requireSupabase().from('messages').insert({
    match_id: input.matchId,
    sender_id: input.senderId,
    body: input.body ?? null,
    track_id: input.track?.id ?? null,
    track_name: input.track?.name ?? null,
    artist_name: input.track?.artistName ?? null,
    generated: input.generated ?? null,
  })
  if (error) throw error
}

/**
 * Live messages for one thread. Returns the channel so the caller can
 * unsubscribe — a channel left open after unmount keeps firing.
 */
export function subscribeToMessages(
  matchId: string,
  onMessage: (message: ChatMessage) => void,
): RealtimeChannel {
  return requireSupabase()
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => onMessage(toMessage(payload.new as Record<string, any>)),
    )
    .subscribe()
}

/** Live feed inserts, so a new post appears without a refresh. */
export function subscribeToPosts(onInsert: () => void): RealtimeChannel {
  return requireSupabase()
    .channel('posts:all')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, onInsert)
    .subscribe()
}

export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await requireSupabase().removeChannel(channel)
}

// ------------------------------------------------------- blocks and reports --

export async function listBlocked(userId: string): Promise<Profile[]> {
  const { data, error } = await requireSupabase()
    .from('blocks')
    .select('blocked:profiles!blocks_blocked_id_fkey(*)')
    .eq('blocker_id', userId)

  if (error) throw error
  return (data ?? [])
    .map((row: Record<string, any>) => row.blocked)
    .filter(Boolean)
    .map(toProfile)
}

export async function block(userId: string, blockedId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('blocks')
    .upsert({ blocker_id: userId, blocked_id: blockedId })
  if (error) throw error
}

export async function unblock(userId: string, blockedId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('blocks')
    .delete()
    .eq('blocker_id', userId)
    .eq('blocked_id', blockedId)
  if (error) throw error
}

export async function reportUser(input: {
  reporterId: string
  reportedId: string
  reason: ReportReason
  detail?: string
  contextType?: 'profile' | 'post' | 'message'
  contextId?: string
}): Promise<void> {
  const { error } = await requireSupabase().from('reports').insert({
    reporter_id: input.reporterId,
    reported_id: input.reportedId,
    reason: input.reason,
    detail: input.detail ?? null,
    context_type: input.contextType ?? 'profile',
    context_id: input.contextId ?? null,
  })

  // The partial unique index rejects a second open report for the same target.
  if (error && error.code === '23505') {
    throw new Error('Bu kişi için zaten açık bir şikayetin var.')
  }
  if (error) throw error
}

// ---------------------------------------------------------------- mapping --

function toProfile(row: Record<string, any>): Profile {
  return {
    id: row.id,
    spotifyId: row.spotify_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? '',
    birthYear: row.birth_year ?? null,
    city: row.city ?? null,
    plan: row.plan === 'platinum' ? 'platinum' : 'free',
  }
}

function toCandidate(row: Record<string, any>): Candidate {
  return {
    profileId: row.profile_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? '',
    city: row.city ?? null,
    birthYear: row.birth_year ?? null,
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    score: Number(row.score),
  }
}

function toMessage(row: Record<string, any>): ChatMessage {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    body: row.body ?? null,
    trackId: row.track_id ?? null,
    trackName: row.track_name ?? null,
    artistName: row.artist_name ?? null,
    generated: row.generated ?? null,
    createdAt: row.created_at,
  }
}
